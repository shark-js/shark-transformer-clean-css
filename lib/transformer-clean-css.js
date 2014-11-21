'use strict';

const WatcherNonInterruptibleError = require('shark-watcher').NonInterruptibleError;
const Transformer   = require('shark-transformer');
const CleanCSS      = require('clean-css');
const extend        = require('node.extend');
const co            = require('co');

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

	renderCleanCss: function(css) {
		try {
			return new CleanCSS(this.options).minify(css);
		}
		catch (error) {
			throw new WatcherNonInterruptibleError('CleanCss error');
		}
	},

	transformTree: function *() {
		return this.tree.forEachDestSeries(co.wrap(function *(destPath, srcCollection, done) {
			try {
				yield this.transformTreeConcreteDest(destPath, srcCollection);
				done();
			}
			catch (error) {
				done(new VError(error));
			}
		}.bind(this)));
	},

	transformTreeConcreteDest: function *(destPath, srcCollection) {
		try {
			srcCollection.forEach(function(srcFile) {
				var cleaned = this.renderCleanCss(
					srcFile.getContent()
				);
				srcFile.setContent(cleaned);
			}.bind(this));
		}
		catch (error) {
			throw new VError(error, 'renderTreeDest');
		}
	},

	treeToTree: function *() {
		yield this.tree.fillContent();
		yield this.transformTree();

		return this.tree;
	}
});