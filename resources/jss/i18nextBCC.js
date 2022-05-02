/**
 * This object is intended to initialize i18Next for use with the BCC and requireJS.
 * @constructor
 * @param {object} $ - $ instance.
 * @param {object} i18next - i18next instance.
 * @param {object} i18nextBrowserLanguageDetector - i18nextBrowserLanguageDetector (i18next plugin) instance.
 * @param {object} i18nextLocalStorageCache - i18nextLocalStorageCache (i18next plugin) instance.
 * @param {object} i18nextXHRBackend - i18nextXHRBackend (i18next plugin) instance.
 * @param {object} i18nextSprintfPostProcessor - i18nextSprintfPostProcessor (i18next plugin) instance.
 * @param {object} jqueryI18next - jqueryI18next (i18next plugin) instance.
 */
function i18NextBCC($, i18next, i18nextBrowserLanguageDetector, i18nextLocalStorageCache, i18nextXHRBackend, i18nextSprintfPostProcessor, jqueryI18next) {
    this.$=$;
    this.i18next=i18next;
    this.i18nextBrowserLanguageDetector=i18nextBrowserLanguageDetector;
    this.i18nextLocalStorageCache=i18nextLocalStorageCache;
    this.i18nextXHRBackend=i18nextXHRBackend;
    this.i18nextSprintfPostProcessor=i18nextSprintfPostProcessor;
    this.jqueryI18next=jqueryI18next;
    this.onChangedFunction = function(lng){
        $(document.body).localize();
    }
}

/**
* Function that initializes i18Next for the BCC webapp.
* @param {object | boolean} param - (Optional) i18Next parameters object. If it is not a object, default parameters will be used, if it is a boolean, true means debug mode.
*/
i18NextBCC.prototype.initI18Next = function(param){
    var initParams = {};
    if(param === Object(param)){
        initParams = param;
    } else {
        initParams = {
            debug: !!param,
            fallbackLng: 'en',
            "ns": [
                "translation",
                "country"
            ],
            backend: {
                loadPath: 'resources/locales/{{lng}}/{{ns}}.json'
            },
            cache: {
                enabled: true,
                prefix: 'bcc_i18next_res_',
                expirationTime: 60*60*1000
            },
            detection: {
                order: ['querystring'],
                lookupQuerystring: 'lng',
                lookupCookie: 'GUEST_LANGUAGE_ID'
            },
            overloadTranslationOptionHandler: this.i18nextSprintfPostProcessor.overloadTranslationOptionHandler
        }
    }
    this.i18next.use(this.i18nextXHRBackend).use(this.i18nextLocalStorageCache).use(this.i18nextBrowserLanguageDetector).use(this.i18nextSprintfPostProcessor).init(initParams);
    this.jqueryI18next.init(this.i18next, this.$, {
        tName: 't', // --> appends $.t = i18next.t
        i18nName: 'i18n', // --> appends $.i18n = i18next
        handleName: 'localize', // --> appends $(selector).localize(opts);
        selectorAttr: 'data-i18n', // selector for translating elements
        targetAttr: 'data-i18n-target', // element attribute to grab target element to translate (if diffrent then itself)
        optionsAttr: 'data-i18n-options', // element attribute that contains options, will load/set if useOptionsAttr = true
        useOptionsAttr: false, // see optionsAttr
        parseDefaultValueFromContent: true // parses default values from content ele.val or ele.text
    });
    this.i18next.on('languageChanged', this.onChangedFunction);
}

if (typeof define === 'function' && define.amd) {
    define("i18nextBCC",
           ['jquery','i18next','i18nextBrowserLanguageDetector','i18nextLocalStorageCache','i18nextXHRBackend','i18nextSprintfPostProcessor','jqueryI18next'], 
           function($, i18next, i18nextBrowserLanguageDetector, i18nextLocalStorageCache, i18nextXHRBackend, i18nextSprintfPostProcessor, jqueryI18next) {
                return new i18NextBCC($, i18next, i18nextBrowserLanguageDetector, i18nextLocalStorageCache, i18nextXHRBackend, i18nextSprintfPostProcessor, jqueryI18next);
            });
} else if ('undefined' !== typeof exports && 'undefined' !== typeof module) {
    module.exports = new i18NextBCC($, i18next, i18nextBrowserLanguageDetector, i18nextLocalStorageCache, i18nextXHRBackend, i18nextSprintfPostProcessor, jqueryI18next);
}