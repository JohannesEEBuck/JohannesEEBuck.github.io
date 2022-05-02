require.config({
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
        }
    }
});

/**
 * Global variable for the BCC view
 */
var bcc;
/**
 * Global variable for the map view
 */
var bccMapApp;
/**
 *
 */
var eaMembers;
/**
 * Maximum number of countries visible at the same time in the BCC.
 */
var maxCountryNumber=6;

require(['jquery',
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
        'bcc_map'],
    initBCCApp
);

/**
 * Initialization of the BCC webapp; called by requireJS.
 * @param {object} $ - jQuery instance.
 * @param {object} C3Chart - C3Chart instance.
 * @param {object} DataSetLoader - DataSetLoader instance.
 * @param {object} i18NextBCC - i18NextBCC instance.
 */
function initBCCApp($, C3Chart, dataSetLoader, i18nextBCC) {
    localStorage.clear();

    var overrideLng = getUrlParam('lng');
    initTheme();
    var view = getUrlParam('view');
    if(view=='map'){
        $('.alt_view').hide();
        $('#bccMap').show();
    }
    i18nextBCC.onChangedFunction = function (lng) {
        $.datepicker.setDefaults($.datepicker.regional[lng]);
        $(document.body).localize();
    }
    i18nextBCC.initI18Next();
    dataSetLoader.onready = function (dataSet, xml, xhttp, file) {
        bcc = new BCC(dataSet, 'countriesChart', '#playerClock', new ClocksNavList('#navlist', '#addCountry', maxCountryNumber));
        bcc.addCountry(dataSet.DataSet.Data[0].Country["@attributes"].code, true)
        setGeneratorCountriesOptions();
        bccMapApp = new BCCMapApp(dataSet, bcc.dataSetInfo, '#eu_map', '#monthpicker', '#current_month', '#ea_clock', '#mapPlayer');
        applyRangeSelection();
        if(overrideLng){
            changeLanguage(overrideLng.toLowerCase());
        }
    }
    dataSetLoader.loadDataSet("files/BCC_HD.xml");
    loadEACountryList("files/ea_countries.json");
    $.datepicker.setDefaults($.datepicker.regional[$.i18n.language.substr(0, 2)]);
    initLngChanger();
    initShareButton();
}

/**
 * Load the list of country codes of EA members from an external file and store it in #eaMembers variable.
 * @param {string} fileName - The name and path of the file to load; it must be a json file with a list of country code.
 */
function loadEACountryList(fileName){
    $.getJSON(fileName, function(data) {
        eaMembers = data;
    }).fail(function(er) {
        console.log( "could not get external ea countries list" );
        console.log(er);
    });
}

/**
 * Initialization of the button for changeing the language.
 */
function initLngChanger(){
    $(document).on("click", ".lngtooltip", function() {
        $(this).tooltip(
            {
                items: ".lngtooltip",
                content: function(){
                    var content = "<div class='lang_tooltip'>";
                    var lng = $.i18n.language.substr(0,2).toUpperCase();
                    if(lng!="EN"){
                        content += '<a class="lng_changer language-en" href="javascript:changeLanguage(\'en\');" title="English"></a>';
                    }
                    if(lng!="FR"){
                        content += '<a class="lng_changer language-fr" href="javascript:changeLanguage(\'fr\');" title="Français"></a>';
                    }
                    if(lng!="DE"){
                        content += '<a class="lng_changer language-de" href="javascript:changeLanguage(\'de\');" title="Deutsch"></a>';
                    }
                    content+="</div>";
                    return content;
                },
                close: function( event, ui ) {
                    var me = this;
                    ui.tooltip.hover(
                        function () {
                            $(this).stop(true).fadeTo(400, 1);
                        },
                        function () {
                            $(this).fadeOut("400", function(){
                                $(this).remove();
                            });
                        }
                    );
                    ui.tooltip.on("remove", function(){
                        $(me).tooltip("destroy");
                    });
                },
            }
        );
        $(this).tooltip("open");
    });
}

function initShareButton(){
    $(document).on("click", ".sharetooltip", function() {
        $(this).tooltip(
            {
                items: ".sharetooltip",
                content: function() {
                    var content = '<div class="sharetooltip-content">'
                        +'<a id="facebook" onclick="return fbs_click();"><img src="resources/img/share/bt_fb.svg" alt="facebook"></a>'
                        +'<br>'
                        +'<a id="twitter" onclick="return twitter_click();"><img src="resources/img/share/bt_twitter.svg" alt="twitter"></a>'
                        +'<br>'
                        +'</div>';
                    return content;
                },
                close: function( event, ui ) {
                    var me = this;
                    ui.tooltip.hover(
                        function () {
                            $(this).stop(true).fadeTo(400, 1);
                        },
                        function () {
                            $(this).fadeOut("400", function(){
                                $(this).remove();
                            });
                        }
                    );
                    ui.tooltip.on("remove", function(){
                        $(me).tooltip("destroy");
                    });
                },
            }
        );
        $(this).tooltip("open");
    });
}

/**
 * Function to apply the time period selection from the dedicated form to the graph, clocks and map.
 */
function applyRangeSelection() {
    bcc.monthRangeSelector.applyRangeSelection(function(fromDate,toDate){
        var range = bcc.updateRangeDate(fromDate,toDate, true);
        bccMapApp.bccMapControls.updateRange(range.clock.min.pos, range.clock.max.pos, range.clock.min.date, range.clock.max.date);
    }.bind(this));
}

/**
 * Change the current language and redo the all localization of the page.
 * @param {string} lng - The new langue to apply; it must be one of "en", "fr" or "de".
 */
function changeLanguage(lng){
    if(lng==='fr'||lng==='en'||lng==='de'){
        $('.lngtooltip').removeClass('language-' + $.i18n.language);
        $.i18n.changeLanguage(lng, function(){

            document.documentElement.setAttribute('lang', lng)

            bcc.updateClocks(bcc.timer.timerPos);

            $('.lngtooltip').addClass('language-' + $.i18n.language);

            var data = bcc.dataSetInfo[bcc.dataset.DataSet.Data[0].Country['@attributes'].code];
            var date = data.date[bccMapApp.bccMapControls.timer.timerPos];
            date = toDate(date,"dd/mm/yyyy","/");
            $(bccMapApp.bccMapControls.currentMonthSelector).text($.datepicker.formatDate('M yy', date, $.datepicker.regional[$.i18n.language.substr(0,2)]));

            $('#monthpicker').MonthPicker({
                i18n: $.datepicker.regional[$.i18n.language.substr(0,2)]
            });
            $('#monthpicker').MonthPicker('SetSelectedMonth', date);

            bcc.chart.localizeNames();
        });
    }
}

/**
 * Function to display the map view instead of the main view.
 * It pause the animation.
 */
function goToMapView(){
    bcc.timer.pause();
    bccMapApp.bccMapControls.timer.pause();
    bccMapApp.bccMapControls.timer.setPos(bcc.timer.timerPos);
    toggleViews();
    bccMapApp.bccmap.leafletMap._onResize();
}

/**
 * Function to display the main view instead of the map view.
 * It pause the animation.
 */
function goToBCCView(){
    bccMapApp.bccMapControls.timer.pause();
    bcc.timer.pause();
    bcc.timer.setPos(bccMapApp.bccMapControls.timer.timerPos);
    toggleViews();
}

/**
 * Function to toggle the view, between the main view and the map view.
 */
function toggleViews(){
    $('#bcc_view').toggle('slide',{direction:"left"},500);
    $('#bccMap').toggle('slide',{direction:"right"},500);
}

/**
 * Function to display the settings form (time period selection).
 */
function showSettings() {
    $('.hiddenPanel').hide();
    $('#settingsPanel').show();
}

/**
 * Function to display the embed panel.
 */
function showEmbedPanel() {
    $('.hiddenPanel').hide();
    $('#embedCopyCode').html(
        '<iframe src="'+document.location.protocol + '//' + document.location.host + document.location.pathname+'" height="837" width="1451"></iframe>');
    $('#embedPanel').show();
}

/**
 * Function to display the form for PDF report generation.
 * It also pre-fill the form to match onscreen data.
 */
function showReportGenerator() {
    require(['pdfGenerator'], function (PdfGenerator) {
        $('.hiddenPanel').hide();
        resetGeneratePanel();
        setDefaultGenSettions();
        $('#generatePanel').show();
    });
}

/**
 * Function to display the inforation panel.
 */
function showInfo() {
    $('.hiddenPanel').hide();$('#infoPanel').show();
}

/**
 * This function do the pdf report generation from the settings in the form and save it on the local computer.
 */
function downloadReport() {
    var fromto = bcc.genMonthRangeSelector.getValues();
    var pdfGen = new PdfGenerator(bcc, bcc.dataset, bcc.dataSetInfo, fromto.from, fromto.to, $('#genClockTimeSelect_month_picker').MonthPicker('Validate'));
    var countries = getSelectedGenerationCountries();
    if (countries && countries.length > 0) {
        var rpCountryCode = getSelectedGenRCountry();
        pdfGen.downloadReport(countries, rpCountryCode);
        $('#generateCountriesSelect, #genRCS, #generateReportButton, #cancelReportButton, #genRange_select_label, #genRangeselect, #genCustomeRange_selection, #genClockTimeSelect').hide();
        $('#generate_succes_msg, #okReportButton').show();
    }
}

/**
 * Reset the display of the pdf generation panel, to remove the success message after usage and display the form.
 */
function resetGeneratePanel() {
    $('#generateCountriesSelect, #genRCS, #generateReportButton, #cancelReportButton, #genRange_select_label, #genRangeselect, #genClockTimeSelect').show();
    $('#generate_succes_msg, #okReportButton').hide();
}

/**
 * This function fill the form for PDF report generation with the data visible on the screen (countries selected, country highlighted ... etc).
 */
function setDefaultGenSettions() {
    var selected = bcc.navList.getSelectedCountry();
    var shownCountries = bcc.navList.getShownCountries();
    $("#generateForm select#genRCSelect")[0].value = selected;
    var selectGenerationCountries = $("#generateForm #generateCountriesSelect input[type=checkbox]");
    for (var i = 0; i < selectGenerationCountries.length; i++) {
        if ($.inArray(selectGenerationCountries[i].value, shownCountries) >= 0) {
            selectGenerationCountries[i].checked = true; //TODO
        } else {
            selectGenerationCountries[i].checked = false;
        }
    }
    var value = bcc.monthRangeSelector.getValue();
    var from,to;
    if(value=="custom"){
        from = bcc.monthRangeSelector.getCustomFromValue();
        to = bcc.monthRangeSelector.getCustomToValue();
    }
    bcc.genMonthRangeSelector.setValue(value, from, to);
    updateGenRCSelectOptions();
//    if(bcc.timer.isPaused()){
//        $('#genClockTimeSelect_month_picker').val(bcc.timer.timerPos); //to set clocks date in report generation form to current date. UNCOMPLETE: still needed to retrieve the date!
//    }
    $('#genCustomeRange_selection').css('display',value==='custom'?'block':'none')
    updateGenClockTimeSelect();
}

/**
 * This function toggles hide/show for the clock time selector
 */
function toggleClockTimeSelector() {
    $('#range_select').toggle();
}

/**
 * This function applies the selection of the clock time selector
 */
function applyCustomRangeSelection(element, value) {
    $('#range_select .selected').removeClass('selected');

    $(element).addClass('selected');

    $('#range_selector').val(value);

    if (value == 'custom') {
        showSettings();
        // $('#settingsPanel').css('display',this.value==='custom'?'block':'none');
        // $('#customeRange_selection').css('display',this.value==='custom'?'block':'none');
    } else {
        applyRangeSelection();
    }
}

/**
 *This function updates the month picker for clocks date in PDF report generation form to adapt the mimits to the time period selected.
 */
function updateGenClockTimeSelect(){
    var newMinDate;
    var newMaxDate = new Date(bcc.range.clock.max.date);;
    switch ($('#genRange_select')[0].value){
        case '5':
            newMinDate = new Date(bcc.range.clock.max.date);
            newMinDate.setFullYear(newMinDate.getFullYear()-5);
            break;
        case '10':
            newMinDate = new Date(bcc.range.clock.max.date);
            newMinDate.setFullYear(newMinDate.getFullYear()-10);
            break;
        case '15':
            newMinDate = new Date(bcc.range.clock.max.date);
            newMinDate.setFullYear(newMinDate.getFullYear()-15);
            break;
        case 'custom':
            newMinDate = toDate('01/'+$('#genFrom_month_picker')[0].value,'dd/mm/yyyy','/');
            newMaxDate = toDate('01/'+$('#genTo_month_picker')[0].value,'dd/mm/yyyy','/');
            break;
        default:
            newMinDate = new Date(bcc.range.clock.min.date);
    }
    if($('#genClockTimeSelect_month_picker').MonthPicker('Validate').getTime()<newMinDate.getTime()){
        $('#genClockTimeSelect_month_picker').val($.datepicker.formatDate('mm/yy', newMinDate));
    }
    if($('#genClockTimeSelect_month_picker').MonthPicker('Validate').getTime()>newMaxDate.getTime()){
        $('#genClockTimeSelect_month_picker').val($.datepicker.formatDate('mm/yy', newMaxDate));
    }
    $('#genClockTimeSelect_month_picker').MonthPicker({
        ShowIcon: false,
        UseInputMask: true,
        MaxMonth: newMaxDate,
        MinMonth: newMinDate,
        i18n: $.datepicker.regional[$.i18n.language.substr(0, 2)]
    });
}

/**
 * Function to select automatically the countries in the pdf generation form to match the countries selected in the BCC webapp.
 */
function setGeneratorCountriesOptions() {
    $("#generateForm #generateCountriesSelect .genCSelect").remove()
    $('#generateForm #genRCS select#genRCSelect option').remove();
    var genCSelect = $("#generateForm #generateCountriesSelect");
    var genRCSelect = $('#generateForm #genRCS #genRCSelect');
    var countryCodes = bcc.getCountryCodes();
    for (var i in countryCodes) {
        genCSelect.append('<span class="genCSelect" style="display: inline-block"><input id="genCSelect_' + countryCodes[i] + '" type="checkbox" name="' + $.i18n.t('country:' + countryCodes[i]) + '" value="' + countryCodes[i] + '" onchange="genCSelectChanged(this);"><label for="genCSelect_' + countryCodes[i] + '" data-i18n="country:' + countryCodes[i] + '">' + $.i18n.t('country:' + countryCodes[i]) + '</label></span>')
        genRCSelect.append('<option value="' + countryCodes[i] + '" data-i18n="country:' + countryCodes[i] + '">' + $.i18n.t('country:' + countryCodes[i]) + '</option>');
    }
}

/**
 * Called when the user check or uncheck a country to include in the pdf report.
 */
function genCSelectChanged(changed){
    var genCSelectValues = [];
    var firstElem;
    $('#generateCountriesSelect span.genCSelect>input').each(function(index,element){
        if(!firstElem){
            firstElem=element;
        }
        if(element.checked){
            genCSelectValues.push(element.value);
        }
    });
    if(genCSelectValues.length<=0 && firstElem){
        firstElem.checked=true;
    } else if(genCSelectValues.length>maxCountryNumber){
        changed.checked = false;
    }
    updateGenRCSelectOptions();
}

/**
 * Update the options of the dropdown menu to the country with regions and points on the graph. Only country included in the report can be selected.
 */
function updateGenRCSelectOptions(){
    var genRCSelect = $('select#genRCSelect')[0];
    var genRCSelectValue = genRCSelect.value;
    var genRCSelectValueIn = false;
    var genRCSelectOptions = '';
    var genCSelectValues = [];
    $('#generateCountriesSelect span.genCSelect>input').each(function(index,element){
        if(element.checked){
            genCSelectValues.push(element.value);
            if(element.value===genRCSelectValue){
                genRCSelectValueIn=true;
            }
            genRCSelectOptions=genRCSelectOptions+'<option value="'+element.value+'" data-i18n="country:'+element.value+'">'+$.i18n.t('country:'+element.value)+'</option>';
        }
    });
    $(genRCSelect).html(genRCSelectOptions);
    if(genRCSelectValueIn){
        genRCSelect.value = genRCSelectValue;
    } else {
        genRCSelect.value=genCSelectValues[0];
    }
}

/**
 * Function to retrieve in pdf generation form, the country selected for regions on graph.
 * @return {string} The country code of the country.
 */
function getSelectedGenRCountry() {
    var selected = $("#generateForm select#genRCSelect");
    return selected.length > 0 ? selected[0].value : undefined;
}

/**
 * Function to retrieve in pdf generation form, all the countries selected.
 * @return {string[]} An array of country code.
 */
function getSelectedGenerationCountries() {
    var jqCountries = $("#generateForm #generateCountriesSelect input[type=checkbox]");
    var countries = [];
    for (var i = 0; i < jqCountries.length; i++) {
        if (jqCountries[i].checked) {
            countries.push(jqCountries[i].value);
        }
    }
    return countries;
}

/**
 * Function to add a country (add a clock and on the graph).
 * @param {string} countryCode - The code of the country to add.
 * @param {boolean} noRemoveOption - If true, no remove button will be available to the user.
 */
function addCountry(countryCode, noRemoveOption) {
    bcc.addCountry(countryCode,noRemoveOption);
}

/**
 * This function simulates a mouse event and is used foropening the dropdown menu for adding a country by clicking the + shape.
 * @param {DOMElementObject} element - The DOM element to simulate a click on.
 * @param {string} eventName - The name of the event to simulate.
 * @return {DOMElementObject} The DOM element where a click has been simulated.
 */
function simulateMouseEvent(element, eventName) {
    var options = extend(defaultOptions, arguments[2] || {});
    var oEvent, eventType = null;

    for (var name in eventMatchers) {
        if (eventMatchers[name].test(eventName)) {
            eventType = name;
            break;
        }
    }

    if (!eventType)
        throw new SyntaxError('Only HTMLEvents and MouseEvents interfaces are supported');

    if (document.createEvent) {
        oEvent = document.createEvent(eventType);
        if (eventType == 'HTMLEvents') {
            oEvent.initEvent(eventName, options.bubbles, options.cancelable);
        } else {
            oEvent.initMouseEvent(eventName, options.bubbles, options.cancelable, document.defaultView,
                options.button, options.pointerX, options.pointerY, options.pointerX, options.pointerY,
                options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.button, element);
        }
        element.dispatchEvent(oEvent);
    } else {
        options.clientX = options.pointerX;
        options.clientY = options.pointerY;
        var evt = document.createEventObject();
        oEvent = extend(evt, options);
        element.fireEvent('on' + eventName, oEvent);
    }
    return element;
}

/**
 * Used by function simulateMouseEvent(element, eventName).
 * @param {object} destination
 * @param {object} source
 * @return object
 */
function extend(destination, source) {
    for (var property in source)
        destination[property] = source[property];
    return destination;
}

/**
 * Used by function simulateMouseEvent(element, eventName).
 */
var eventMatchers = {
    'HTMLEvents': /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
    'MouseEvents': /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/
};
/**
 * Used by function simulateMouseEvent(element, eventName).
 */
var defaultOptions = {
    pointerX: 0,
    pointerY: 0,
    button: 0,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    bubbles: true,
    cancelable: true
};

function fbs_click()
{
    u=location.href;
    t=document.title;
    window.open('https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(u)+'&t='+encodeURIComponent(t),'sharer','toolbar=0,status=0,width=626,height=436');
    return false;
}

function gplus_click()
{
    u=location.href;
    t=document.title;
    window.open('https://plus.google.com/share?url='+encodeURIComponent(u),'sharer_google','toolbar=0,status=0,width=626,height=436');
    return false;
}

function twitter_click()
{

    u=location.href;
    t=document.title;
    window.open('https://twitter.com/intent/tweet?url='+encodeURIComponent(u)+'&amp;text='+encodeURIComponent(t),'sharer_twitter','toolbar=0,status=0,width=626,height=436');
    return false;
}
