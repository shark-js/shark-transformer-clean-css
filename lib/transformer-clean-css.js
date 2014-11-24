'use strict';

const WatcherNonInterruptibleError = require('shark-watcher').NonInterruptibleError;
const Transformer   = require('shark-transformer');
const CleanCSS      = require('clean-css');
const extend        = require('node.extend');
const co            = require('co');
const VError        = require('verror');
const path          = require('path');

const loggerOpName = 'transformer-clean-css';

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

	renderCleanCss: function(css, destPath) {
		var time = this.logger.time();
		var sizeBefore = css.length;

		try {
			this.logger.info({
				opName: loggerOpName,
				opType: this.logger.OP_TYPE.STARTED
			}, path.basename(destPath));

			var result = new CleanCSS(this.options).minify(css);

			this.logger.info({
				opName: loggerOpName,
				opType: this.logger.OP_TYPE.FINISHED_SUCCESS,
				duration: time.delta(),
				size: {before: sizeBefore, after: result.length}
			}, path.basename(destPath));
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
		srcCollection.forEach(function(srcFile) {
			var cleaned = this.renderCleanCss(
				srcFile.getContent(),
				destPath
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