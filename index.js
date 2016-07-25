
(function () {
	'use strict';

	function UniqueSelector() {
		this.currentElm = null;
		this.selectors = [];

		this.config = {
			context: null,
			invalidClass: [],
			invalidId: []
		};

		this.$id = null;
		this.$parent = null;

		this.allowDuplicateId = true;

		this.$tag = null;
		this.$class = null;
	}

	UniqueSelector.prototype.gen = function (element) {
		this.selectors.length = 0;
		this.currentElm = element;
		this.config.context = element.ownerDocument;
		//mark duplicate id as invalid
		var temp, original;

		if (this.allowDuplicateId) {
			temp = this.config.invalidId;
			//get a cheap copy
			original = [].concat(temp);
			//query all the element for id attribute and filter the id array.
			//if the last index of the current checked id is not itself, then
			//it must be a duplicate
			//and concat the result array with invalid id array
			[].map.call(this.config.context.querySelectorAll('[id]'), function (e) {
				return e.id;
			}).forEach(function (id, index, arr) {
				if (arr.lastIndexOf(id) !== index && temp.indexOf(id) === -1) {
					temp.push(id);
				}
			});
		}

		this.$calculate(element);

		if (this.allowDuplicateId) {
			this.config.invalidId = original;
		}

		return this.$buildSelectorString();
	};

	UniqueSelector.prototype.invalidClass = function (arr) {
		if (Array.isArray(arr)) {
			this.config.invalidClass = arr;
		}
	};

	UniqueSelector.prototype.invalidId = function (arr) {
		if (Array.isArray(arr)) {
			this.config.invalidId = arr;
		}
	};

	UniqueSelector.prototype.$buildSelectorString = function () {
		return this.selectors.join(' ');
	};

	//stack a selector string onto the selector list
	UniqueSelector.prototype.$stack = function (selector) {
		return this.selectors.unshift(selector);
	};

	UniqueSelector.prototype.$findIdSelector = function () {
		var id = this.$id,
			isInvalid = false,
			checkList = this.config.invalidId;
		//filter the id
		isInvalid = checkList.some(function (idToCheck) {
			return id.indexOf(idToCheck) > -1;
		});
		//if its a invalid one, we cannot use it
		if (isInvalid || id === '') {
			return false;
		}
		//we have it and we are done since id is unique
		this.$stack('#' + id);
		return true;
	};

	UniqueSelector.prototype.$findClassSelector = function (e) {
		var selector, className,
			tag = this.$tag,
			context = this.config.context,
			checkList = this.config.invalidClass;

		//filter the class list off invalid class
		className = this.$class.filter(function (name) {
			return checkList.every(function (classToCheck) {
				return name.indexOf(classToCheck) === -1;
			});
		});
		//nothing left, calculate tag selector
		if (className.length === 0) {
			return this.$findTagSelector(e);
		}
		//get the most unique class name in the context
		selector = tag + '.' + className.reduce(function (unique, current) {
			return context.getElementsByClassName(current).length <
				context.getElementsByClassName(unique).length ? current : unique;
		});
		//if it is the chosen one, we are done
		if (context.querySelectorAll(selector + ' ' + this.$buildSelectorString()).length === 1) {
			this.$stack(selector);
			return true;
		}
		//if it is unique in its parent, we are done for now
		if (e.parentElement.querySelectorAll(selector).length === 1) {
			this.$stack('> ' + selector);
			return false;
		}
		//class is too generic, use tag selector instead
		return this.$findTagSelector(e);
	};

	/*
	*  find div:nth-child(6) style tag + pseudo class selector
	*  absolutely unique within its parent node's children
	* */
	UniqueSelector.prototype.$findTagSelector = function (e) {
		var tag = this.$tag,
			parent = this.$parent,
			list = parent.children,
			suffix = ':nth-child(' + (Array.prototype.indexOf.call(list, e) + 1) + ')';

		//unique tag
		if (this.config.context.querySelectorAll(tag + ' ' + this.$buildSelectorString()).length === 1) {
			this.$stack(tag);
			return true;
		}
		//the nth-child is very tricky to match so add > to make it safe
		else {
			this.$stack('> ' + tag + suffix);
		}

		return false;
	};

	/*
	* generate property of the current element
	* so we can refer to them easily in the calculation that follows
	* */
	UniqueSelector.prototype.$generateProperty = function (e) {
		this.$tag = e.tagName.toLowerCase();
		//array.split staff will give you a bunch of '' in array, so I have to match
		this.$class = e.className.match(/(\S+)/) || [];
		this.$id = e.id;
		this.$parent = e.parentElement;
	};

	UniqueSelector.prototype.$calculate = function (e) {
		//let's try to get an idea of the element before doing anything
		this.$generateProperty(e);
		//if it is html,head, or body, there's no need to proceed (or it will break further calculation)
		if (['html', 'head', 'body'].indexOf(this.$tag) > -1) {
			this.$stack(this.$tag);
			return;
		}
		//try to find id, return true if it find it
		if (this.$findIdSelector()) {
			return;
		}
		//no id found, work on class
		else if (this.$findClassSelector(e)) {
			return;
		}
		//no unique class found,
		//but we have unique selector in its parent scope
		//start to work on its parent
		//it will always have a parent element if it is not html,head, or body
		this.currentElm = this.$parent;

		return this.$calculate(this.currentElm);
	};

	if (typeof define === 'function' && define.amd) {
		define(function () { return UniqueSelector; });
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = UniqueSelector;
	} else {
		window.Sizzle = UniqueSelector;
	}
} ());