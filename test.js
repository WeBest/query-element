'use strict';
const assert = require('assert');
const resolve = require('path').resolve;
const jsdom = require('jsdom');

describe('basic test', function () {
	it('initialize it self properly', function (done) {
		jsdom.env('<html><body><p>111</p></body></html>', [], done);
	});
	// 选到html或body上就挂了那简直太傻逼了
	it('does not explode when html or body tag is selected', function (done) {
		jsdom.env({
			html: '<html><body id="app"><p>111</p></body></html>',
			scripts: [
				resolve('.', 'index.js')
			],
			features: {
				FetchExternalResources: ['script'],
				ProcessExternalResources: ['script']
			},
			done: function (err, window) {
				assert(!err, 'error during jsdom initialization');
				assert(window.Sizzle, 'error during jsdom initialization');

				const $ = function(selector) {
					return window.document.querySelector(selector);
				};

				const u = new window.Sizzle();

				assert.equal(u.gen($('html')), 'html', 'simple query');
				assert.equal(u.gen($('body')), 'body', 'simple query');

				done();
			}
		});
	});
	// 重复id要忽略
	it('handle duplicated id nicely', function (done) {
		jsdom.env({
			html: '<html><body><p id="aa">111</p><p id="aa">222</p></body></html>',
			scripts: [
				resolve('.', 'index.js')
			],
			features: {
				FetchExternalResources: ['script'],
				ProcessExternalResources: ['script']
			},
			done: function (err, window) {
				assert(!err, 'error during jsdom initialization');

				const $ = function(selector) {
					return window.document.querySelector(selector);
				};

				const u = new window.Sizzle();

				assert.equal(u.config.invalidId.length, 0);
				assert.equal(u.gen($('#aa')), 'body > p:nth-child(1)');
				assert.equal(u.config.invalidId.length, 0);

				done();
			}
		});
	});
});
