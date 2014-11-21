'use strict';

const chai      = require('chai');
const coMocha   = require('co-mocha');
const expect    = chai.expect;

const TransformerCleanCss = require('../');
const Tree      = require('shark-tree');
const Logger    = require('shark-logger');
const cofse     = require('co-fs-extra');
const path      = require('path');

describe('Initialization', function() {
	before(function *() {
		this.logger = Logger({
			name: 'TransformerCleanCssLogger'
		});

		this.files = {};
		this.src = path.join(__dirname, './fixtures/test.css');

		this.dest = path.join(__dirname, './fixtures/test.dest.css');

		this.expectDest = path.join(__dirname, './fixtures/test.dest.expect.css');
		this.expectDestContent = yield cofse.readFile(this.expectDest, { encoding: 'utf8' });

		yield cofse.writeFile(this.dest, '');

		this.files[this.dest] = {
			files: [this.src],
			options: {

			}
		};

		this.tree = Tree(this.files, this.logger);
	});

	it('should clean css and output valid result', function *() {
		var tree = yield TransformerCleanCss.treeToTree(this.tree, this.logger);

		expect(tree.getSrcCollectionByDest(this.dest).getFileByIndex(0).getContent())
			.equal(this.expectDestContent);
	})
});
