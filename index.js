(function () {
	'use strict';
	var invalidId = [];
	var invalidClass = [];
	/**
	 * escape css name
	 * based on:
	 * https://github.com/mathiasbynens/CSS.escape
	 */
	function escape(value) {
		var string = String(value);
		var length = string.length;
		var index = -1;
		var codeUnit;
		var result = '';
		var firstCodeUnit = string.charCodeAt(0);

		while(++index < length) {
			codeUnit = string.charCodeAt(index);
			if (codeUnit == 0x0000) {
				result += '\uFFFD';
				continue;
			}
			if (
				(codeUnit >= 0x0001 && codeUnit <= 0x001F) || codeUnit == 0x007F ||
				(index == 0 && codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
				(
					index === 1 &&
					codeUnit >= 0x0030 && codeUnit <= 0x0039 &&
					firstCodeUnit == 0x002D
				)
			) {
				result += '\\' + codeUnit.toString(16) + ' ';
				continue;
			}
			if (
				index == 0 &&
				length == 1 &&
				codeUnit == 0x002D
			) {
				result += '\\' + string.charAt(index);
			}
			if (
				codeUnit >= 0x0080 ||
				codeUnit == 0x002D ||
				codeUnit == 0x005F ||
				codeUnit >= 0x0030 && codeUnit <= 0x0039 ||
				codeUnit >= 0x0041 && codeUnit <= 0x005A ||
				codeUnit >= 0x0061 && codeUnit <= 0x007A
			) {
				result += string.charAt(index);
				continue;
			}

			result += '\\' + string.charAt(index);
		}

		return result;
	}
	// the following code are mostly based on:
	// https://github.com/mozilla/gecko-dev
	/**
	 * Find the position of element in nodeList.
	 * @returns an index of match, or -1 if there is no match
	 */
	function positionInNodeList(element, nodeList) {
		for(var i = 0; i < nodeList.length; i++) {
			if (element === nodeList[i]) {
				return i;
			}
		}

		return -1;
	}
	/**
	 * Find a unique CSS selector for a given element
	 * @returns a string such that ele.ownerDocument.querySelector(reply) === ele
	 * and ele.ownerDocument.querySelectorAll(reply).length === 1
	 * inspired by 
	 */
	function findCssSelector(ele) {
		var doc = ele.ownerDocument;
		if (!doc || !doc.contains(ele)) {
			throw new Error('element not inside document');
		}

		var id = ele.id;
		if (id &&
			invalidId.indexOf(id) === -1 &&
			doc.querySelectorAll('#' + escape(id)).length === 1) {
			return '#' + escape(id);
		}

		// unique tag name
		var tagName = ele.localName;
		if (tagName === 'html' ||
			tagName === 'head' ||
			tagName === 'body') {
			return tagName;
		}

		// try to find a unique class name
		var selector, index, matches, i, className;
		if (ele.classList.length > 0) {
			for (i = 0; i < ele.classList.length; i++) {
				className = ele.classList.item(i);
				if (invalidClass.indexOf(className) > -1) {
					continue;
				}
				// Is this className unique by itself?
				selector = tagName + '.' + escape(className);
				matches = doc.querySelectorAll(selector);
				if (matches.length === 1) {
					return selector
				}
				// is nth-child unique?
				index = positionInNodeList(ele, ele.parentNode.children) + 1;
				selector = selector + ':nth-child(' + index + ')';
				matches = doc.querySelectorAll(selector);
				if (matches.length === 1) {
					return selector;
				}
			}
		}

		// not unique enough, fall back to nth-child and
		// use recursion
		if (ele.parentNode !== doc) {
			index = positionInNodeList(ele, ele.parentNode.children) + 1;
			selector = findCssSelector(ele.parentNode) + ' > ' +
				tagName + ':nth-child(' + index + ')';
		}

		return selector;
	}

	findCssSelector.invalidId = invalidId;
	findCssSelector.invalidClass = invalidClass;
	findCssSelector.positionInNodeList = positionInNodeList;
	findCssSelector.escape = escape;

	if (typeof define === 'function' && define.amd) {
		define(function () { return findCssSelector; });
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = findCssSelector;
	} else {
		window.u = findCssSelector;
	}
} ());
