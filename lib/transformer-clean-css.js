'use strict';

const Transformer   = require('shark-transformer');
const CleanCSS      = require('clean-css');
const extend        = require('node.extend');
const co            = require('co');
const VError        = require('verror');
const path          = require('path');

const loggerOpName = 'clean-css';

module.exports = Transformer.extend({
	optionsDefault: {
		advanced: true,
		aggressiveMerging: true,
		benchmark: false,
		compatibility: false,
		debug: false,
		inliner: false,
		keepBreaks: false,
		keepSpecialComments: false,
		processImport: false,
		rebase: false,
		relativeTo: null,
		root: null,
		roundingPrecision: 2,
		target: null
	},

	init: function() {
		this.options = extend({}, this.optionsDefault, this.options);
	},

	renderCleanCss: function(css, destPath, options) {
		var time = this.logger.time();
		var sizeBefore = css.length;

		try {
			if (!this.logger.inPipe()) {
				this.logger.info({
					opName: loggerOpName,
					opType: this.logger.OP_TYPE.STARTED
				}, path.basename(destPath));
			}

			var result = new CleanCSS(options).minify(css);

			this.logger.info({
				opName: loggerOpName,
				opType: this.logger.OP_TYPE.FINISHED_SUCCESS,
				duration: time.delta(),
				size: {before: sizeBefore, after: result.length}
			}, this.logger.inPipe() ? '' : path.basename(destPath));
			return result;
		}
		catch (error) {
			throw new VError(error, 'CleanCss error');
		}
	},

	transformTree: function *() {
		return this.tree.forEachDestSeries(co.wrap(function *(destPath, srcCollection, done) {
			try {
				yield this.transformTreeConcreteDest(destPath, srcCollection);
				done();
			}
			catch (error) {
				done(new VError(error, 'CleanCss#transformTree'));
			}
		}.bind(this)));
	},

	transformTreeConcreteDest: function *(destPath, srcCollection) {
		var options = extend({}, this.options, srcCollection.getOptions().cleanCss);

		if (options.enabled === false) {
			this.logger.info('%s disabled, passing...', loggerOpName);
			return;
		}

		srcCollection.forEach(function(srcFile) {
			var cleaned = this.renderCleanCss(
				srcFile.getContent(),
				destPath,
				options
			);
			srcFile.setContent(cleaned);
		}.bind(this));
	},

	treeToTree: function *() {
		yield this.tree.fillContent();
		yield this.transformTree();

		return this.tree;
	}
});