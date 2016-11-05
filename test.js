'use strict';
const assert = require('assert');
const resolve = require('path').resolve;
const jsdom = require('jsdom');

const is = assert.deepEqual;

const html = `
<html>
<body>
  <div id="find-css-selector">
    <div id="one"></div> <!-- Basic ID -->
    <div id="2"></div> <!-- Escaped ID -->
    <div class="three"></div> <!-- Basic Class -->
    <div class="4"></div> <!-- Escaped Class -->
    <div attr="5"></div>  <!-- Only an attribute -->
    <p></p> <!-- Nothing unique -->
    <div class="seven seven"></div> <!-- Two classes with same name -->
    <div class="eight eight2"></div> <!-- Two classes with different names -->

    <!-- Two elements with the same id - should not use ID -->
    <div class="nine" id="nine-and-ten"></div>
    <div class="ten" id="nine-and-ten"></div>

    <!-- Three elements with the same id - should use class and nth-child instead -->
    <div class="sameclass" id="11-12-13"></div>
    <div class="sameclass" id="11-12-13"></div>
    <div class="sameclass" id="11-12-13"></div>

    <!-- Special characters -->
    <div id="!, &quot;, #, $, %, &amp;, ', (, ), *, +, ,, -, ., /, :, ;, <, =, >, ?, @, [, \, ], ^, \`, {, |, }, ~"></div>
  </div>
  <style type="text/css">
    #computed-style { width: 50px; height: 10px; }
    #computed-style::before { content: "before"; }
    #computed-style::after { content: "after"; }
  </style>
  <div id="computed-style"></div>
</body>
</html>
`;

describe('test for bug', function () {
	it('handle all situations nicely', function (done) {
		jsdom.env({
			html: html,
			scripts: [
				resolve('.', 'index.js')
			],
			features: {
				FetchExternalResources: ['script'],
				ProcessExternalResources: ['script']
			},
			done: function (err, window) {
				assert(!err && window.u, 'error during jsdom initialization');

				const u = window.u;
				const escape = u.escape;

				const $ = function(selector) {
					return window.document.querySelector(selector);
				};

				const nodes = $('*');
				for (let i = 0; i < nodes.length; i++) {
					const selector = u(nodes[i]);
					const matches = $(selector);

					is(matches.length, 1, 'There should be a single match');
				}

				let unattached = window.document.createElement('div');
				unattached.id = 'unattached';
				assert.throws(u.bind(null, unattached));

				let unattachedChild = window.document.createElement('div');
				unattached.appendChild(unattachedChild);
				assert.throws(u.bind(null, unattachedChild));

				let unattachedBody = window.document.createElement('body');
				assert.throws(u.bind(null, unattachedBody));

				let data = [
					'#one',
					'#' + escape('2'),
					'div.three',
					'div.' + escape('4'),
					'#find-css-selector > div:nth-child(5)',
					'#find-css-selector > p:nth-child(6)',
					'div.seven',
					'div.eight',
					'div.nine',
					'div.ten',
					'div.sameclass:nth-child(11)',
					'div.sameclass:nth-child(12)',
					'div.sameclass:nth-child(13)',
					'#' + escape('!, \", #, $, %, &, \', (, ), *, +, ,, -, ., /, :, ;, <, =, >, ?, @, [, \, ], ^, `, {, |, }, ~')
				];

				let container = $('#find-css-selector');
				is(container.children.length, data.length, 'correct # of child');

				for (let i = 0; i < data.length; i++) {
					let node = container.children[i];
					is(u(node), data[i], 'matched id for index ' + (i - 1));
				}

				done();
			}
		});
	});
});
