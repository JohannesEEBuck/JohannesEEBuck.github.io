// Used to build optimized webapp with require optimizer, install node.js, nmp the requireJS first.
// To build, type command: r.js.cmd -o build.js

({
    appDir: "./",
    baseUrl: "./resources/js",
    dir: "./appdirectory-build",
    paths: {
        'monthPicker': 'jquery/MonthPicker',
        'jquery_maskedinput': 'jquery/jquery.maskedinput.min',
        'jqplot.core': 'jqplot/jquery.jqplot',
        'jqplot-with-modules': 'jqplot/jquery-jqplot-module-with-plugins',
        jsPdf: 'jsPDF/jspdf.min',
        swfObject: 'jsPDF/swfobject.js',
        downloadify: 'jsPDF/downloadify.min',
        jqChart: 'jqChart',
        pdfGenerator: 'pdfGenerator',
        timer: 'timer',
        bcc_app: 'bcc_app',
        cycleClock: 'cycleClock',
        jquery: 'jquery/jquery-1.12.0',
        c3: 'c3/c3.min',
        d3: 'd3/d3.v3.min',
        i18next: 'i18next/i18Next.min',
        i18nextBrowserLanguageDetector: 'i18next/i18nextBrowserLanguageDetector.min',
        i18nextLocalStorageCache: 'i18next/i18nextLocalStorageCache.min',
        i18nextXHRBackend: 'i18next/i18nextXHRBackend.min',
        i18nextSprintfPostProcessor: 'i18next/i18nextSprintfPostProcessor.min',
        jqueryI18next: 'i18next/jquery-i18next.min',
        'jquery-ui': 'jquery/jquery-ui',
        'datepicker-de': 'jquery/jquery.ui.datepicker-de.min',
        'datepicker-fr': 'jquery/jquery.ui.datepicker-fr.min',
        'bcc_commons': 'bcc_commons',
        leaflet: 'leaflet/leaflet'
    },
    shim: {
        'jqplot-core': {
            deps: ["jquery"]
        },
        'jqplot-with-modules': {
            deps: ["jqplot.core"]
        },
        'jquery-ui': {
            deps: ["jquery"]
        },
        'datepicker-de': {
            deps: ["jquery-ui"]
        },
        'datepicker-fr': {
            deps: ["jquery-ui"]
        },
        jquery_maskedinput: {
            deps: ["jquery-ui"]
        },
        monthPicker: {
            deps: ["jquery","jquery_maskedinput","jquery-ui","datepicker-de","datepicker-fr"]
        },
        'bcc_commons': {
            deps: ["jquery"]
        },
        bcc_app: {
            deps: ['jquery',
                    'c3Chart',
                    'dataSetLoader',
                    'i18nextBCC',
                    'jquery-ui',
                    'bcc',
                    'timer',
                    'cycleClock',
                    'datepicker-de',
                    'datepicker-fr',
                    'monthPicker',
                    'bcc_commons',
                    'bcc_ui',
                    'bcc_map']
        }
    },
    modules: [
        {
            name: "bcc_app"
        }
    ]
})