;(function($, window, document, undefined) {
	"use strict";

	var I18N = function(options) {
		// Load defaults
		this.options = $.extend({}, $.i18n.defaults, options);
		this.messages = {};
		this.sources = {};
		this.parser = this.options.parser;
		this.languages = {};
		this.locale = this.options.locale;
		String.locale = this.locale;
		this.init();
	};

	I18N.prototype = {
		/**
		 *
		 */
		init : function() {
			var that = this;
			var $links = $("link");
			var linksCount = $links.length;

			while (linksCount--) {
				var $link = $($links[linksCount]);
				var rel = ($link.attr("rel") || "").toLowerCase().split(/\s+/);
				if ($.inArray("localizations", rel) !== -1) {
					// multiple localizations
					that.load($link.attr("href"));
				} else if ($.inArray("localization", rel) !== -1) {
					// single localization
					var localization = {};
					localization[($link.attr("hreflang") || "").toLowerCase()] = $link.attr("href");
					that.load(localization);
				}
			}

			String.prototype.toLocaleString = function() {
				var parts = that.locale.toLowerCase().split("-");
				var i = parts.length;
				var this_val = this.valueOf();
				// Iterate through locales starting at most-specific until localization is found
				do {
					var locale = parts.slice(0, i).join("-");
					// load locale if not loaded
					if (locale in that.sources) {
						// Do this asynchronously.
						that._process_load_queue(locale, true);
					}
					if (locale in that.messages && this_val in that.messages[locale]) {
						return that.messages[locale][this_val];
					}
				} while (i--);

				return this_val;
			};
		},

		destroy : function() {
			$('body').data('i18n', null);
		},

		/**
		 *
		 */
		load : function(data, locale, async) {
			var that = this,
				hasOwn = Object.prototype.hasOwnProperty;
			async = async || false;
			locale = locale || that.locale;

			var dataType = typeof data;
			if (arguments.length > 0 && dataType !== "number") {
				if (dataType === "string") {
					var name = data;
					that.log("Loading json " + name);
					$.ajax({
						url : name,
						dataType : "json",
						success : function(localization, textStatus) {
							if (!locale) {
								that.messages = localization;
							} else {
								for (var message in localization) {
									that.messages[locale] = that.messages[locale] || [];
									that.messages[locale][message] = localization[message];
								}
							}
							that.loaded();
						},
						failure : function(jqxhr, settings, exception) {
							that.log("Triggered ajaxError handler." + exception);
						},
						async : async
					});
				} else if (!data) {
					// reset all localizations
					this.log("Resetting.");
					that.messages = {};
				} else { // data is Object
					// Extend current localizations instead of completely overwriting them
					for (var passedLocale in data) {
						this.log("Loading locale: " + passedLocale);
						if (hasOwn.call(data, passedLocale)) {
							var localization = data[passedLocale];
							var localizationType = typeof localization;
							this.log("Localization type: " + localizationType);
							passedLocale = passedLocale.toLowerCase();

							if (!(passedLocale in that.messages) || !localization) {
								// reset locale if not existing or reset flag is specified
								that.messages[passedLocale] = {};
							}

							if (!localization) {
								continue;
							}

							// URL specified
							if (typeof localizationType === "string") {
								if (that.options.locale.toLowerCase().indexOf(passedLocale) === 0) {
									localization = that.load(localization, passedLocale);
								} else {
									// queue loading locale if not needed
									if (!(passedLocale in this.sources)) {
										this.sources[passedLocale] = [];
									}
									this.log("Queueing: " + localization);
									this.sources[passedLocale].push(localization);
									continue;
								}
							}
						}
					}
				}
			}
			return Function.prototype.toLocaleString.apply(String, arguments);
		},

		log : function(/* arguments */) {
			console.log.apply(console, arguments);
		},

		loaded : function() {

		},

		/**
		 *
		 */
		_process_load_queue : function(locale, now) {
			var that = this,
				localization,
				queue = that.sources[locale];

			for (var i = 0; i < queue.length; i++) {
				localization = {};
				localization[locale] = that.load(queue[i], locale, now);
				that.load(localization);
			}

			delete that.sources[locale];
		},

		parse : function(key, parameters) {
			var message = key.toLocaleString();
			return this.parser.prototype.parse(message, parameters);
		}
	};

	if (!String.locale) {
		String.locale = $('html').attr('lang');
		if (!String.locale) {
			if (typeof navigator !== undefined) {
				var nav = navigator;
				String.locale = nav.language || nav.userLanguage || "";
			} else {
				String.locale = "";
			}
		}
	}

	$.i18n = function(key, parameter_1 /* [, parameter_2] */) {
		var parameters = [],
			i18n = $('body').data('i18n');
		var options = typeof key === 'object' && key;

		if (options && options.locale && i18n && i18n.locale !== options.locale) {
			i18n.destroy();
			i18n = null;
		}

		if (!i18n) {
			$('body').data('i18n', (i18n = new I18N(options)));
			$('[data-i18n]').each(function(e) {
				var $this = $(this);
				if ($this.data('i18n')) {
					$this.text($.i18n($this.data('i18n')));
				}
			});
		}

		if (!key) {
			return i18n;
		}

		// Support variadic arguments
		if (parameter_1 !== undefined) {
			parameters = $.makeArray(arguments);
			parameters.shift();
		}

		if (typeof key === 'string') {
			return i18n.parse(key, parameters);
		} else {
			return i18n;
		}
	};

	$.i18n.language = {};
	$.i18n.parser = {};
	$.i18n.defaults = {
		locale : String.locale,
		fallbackLocale : "en",
		parser : $.i18n.parser
	};

	$.i18n.Constructor = I18N;
	/**
	 * Convenient alias
	 */
	$._ = $.i18n;

	$(document).ready(function() {
		/* i18n DATA-API */
	});

} )(jQuery, window, document);
