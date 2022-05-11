if (typeof define === 'function' && define.amd) {
    define("bcc", ['jquery', 'c3Chart', 'i18nextBCC', 'timer', 'cycleClock', 'jquery-ui', 'datepicker-de', 'datepicker-fr', 'monthPicker', 'bcc_commons','bcc_ui'], function ($) {
        return BCC;
    });
} else if ('undefined' !== typeof exports && 'undefined' !== typeof module) {
    module.exports = BCC;
}

/**
 * Represents the main BBC view, with clocks and graph.
 * @constructor
 * @param {object} dataSet - The dataSet.
 * @param {string} idCountriesChartDiv - The id of the div where the chart must be inserted.
 * @param {string|object} playerSelector - The jQuery like selector to use to retrieve the element where the player (pause, play buttons) must be inserted. It can also be a jQuery object or DOM element.
 * @param {ClocksNavList} navList - The ClocksNavList instance to use.
 */
function BCC(dataSet, idCountriesChartDiv, playerSelector, navList) {
    this.navList = navList;
    this.clocks = {};
    this.dataset = dataSet;
    this.dataSetInfo = initDataSetInfo(this.dataset);
    this.range = this.getInitialRange(this.dataSetInfo);
    var firstCountryCode = this.dataset.DataSet.Data[0].Country["@attributes"].code;
    var seriesData = this.getCountrySeriesData(firstCountryCode);
    $('.on_script_load').show();
    $('.on_loading').hide();
    if (typeof SVGRect === "undefined") { // svg not supported
        this.navList.maxClock = 2;
        this.chart = initJqChart(idCountriesChartDiv, this, this.dataset, this.dataSetInfo, this.dataset, this.dataSetInfo, 2);
    } else {
        this.chart = new C3Chart('#'+idCountriesChartDiv, this, seriesData, this.dataSetInfo[firstCountryCode].label, this.getRegions(firstCountryCode), {height:200}, this.range.clock.min.date.setDate(30), this.range.clock.max.date.setDate(30));
    }
    this.chartPos = this.range.chart.max.pos - 1;
    this.timer = new TimerLoop(this.onTimerPosChanged.bind(this), playerSelector, this.range.clock.min.pos, this.range.clock.max.pos, true, false, true);
    this.timeSlider = this.initTimeSlider();
    this.initMonthRangeSelectors(this.range);

    $(document.body).localize();
    this.cycleClockHelp = new CycleClockHelp('#pie');
}

/**
 * Function to initialize the Month range selectors used to select a time period.
 * @param {object} range - The global range, that define the start and end of the data in time.
 */
BCC.prototype.initMonthRangeSelectors = function(range) {
    this.monthRangeSelector = new MonthRangeSelector('#range_selector', '#from_month_picker', '#to_month_picker', range);
    this.genMonthRangeSelector = new MonthRangeSelector('#genRange_select', '#genFrom_month_picker', '#genTo_month_picker', range);
    $('#genClockTimeSelect_month_picker').val($.datepicker.formatDate('mm/yy', range.clock.max.date));
    $('#genClockTimeSelect_month_picker').MonthPicker({
        ShowIcon: false,
        UseInputMask: true,
        StartYear: range.clock.max.date.getFullYear(),
        MaxMonth: range.clock.max.date,
        MinMonth: range.clock.min.date,
        i18n: $.datepicker.regional[$.i18n.language.substr(0, 2)]
    });
    $('#genRange_select').change(function(event){updateGenClockTimeSelect();});
    $('#genFrom_month_picker').change(function(event){updateGenClockTimeSelect();});
    $('#genTo_month_picker').change(function(event){updateGenClockTimeSelect();});
}

/**
 * Function call every time the timer position changed.
 * @param {number} pos - The index of the timer position.
 * @param {TimerLoop} timer - The instance of the timer who called the function.
 * @return {number} A new position, the timer will jump to.
 */
BCC.prototype.onTimerPosChanged = function(pos, timer) {
    var clockPos = pos;
    var newChartPos = this.getChartPos(pos);
    if ((newChartPos > this.range.chart.max.pos && clockPos > timer.maxTimerPos) || (clockPos < 0)) {
        clockPos = timer.backward ? timer.maxTimerPos : 0;
    }
    if (newChartPos != this.chartPos && newChartPos <= this.range.chart.max.pos && newChartPos >= 0) {
        this.chart.selectPointAllSeries(newChartPos);
        this.chartPos = newChartPos;
    }
    if (clockPos <= timer.maxTimerPos) {
        this.updateClocks(clockPos, this.navList.retrieveCountriesShown());
        this.timeSlider.slider("value", clockPos);
        this.updateAsideStats(this.navList.retrieveCountryShownCodes(), clockPos)
    }
    return clockPos;
}

/**
 * Function to select a country as the highlighted country in clocks and on the graph.
 * @param {string} countryCode - The country code of the country to select.
 */
BCC.prototype.selectCountry = function (countryCode) {
    this.navList.selectCountry(countryCode);
    this.chart.loadCountryRegions(countryCode, false, true);
    this.chart.focusCountry(countryCode);
    this.updateAsideStats(this.navList.retrieveCountryShownCodes());
}

/**
 * Function to retrieve the index of the position on the graph, based on the index of the clocks position.
 * @param {number} clockPos - The index of the position in the list of data used by the clock.
 * @return {number} The index of the position on the graph related to the clock position provided.
 */
BCC.prototype.getChartPos = function(clockPos) {
    if (clockPos === undefined) {
        clockPos = this.timer.timerPos;
    }
    var chartPos = (clockPos) / 3;
    return chartPos > 0 ? Math.floor(chartPos) : Math.ceil(chartPos);
}

/**
 * Function to get the initial range (time period), it contains the inital as well as one for the clock and one for the graph.
 * @param {object} dataSetInfo - the dataSetInfo contained tructured data for the BCC, from the initial dataSet file.
 * @return {object} The initial range object.
 */
BCC.prototype.getInitialRange = function(dataSetInfo) {
    var initialRange = {
        chart: this.getInitialChartRange(dataSetInfo),
        clock: this.getInitialClocktRange(dataSetInfo)
    }
    return {
        chart: this.getInitialChartRange(dataSetInfo),
        clock: this.getInitialClocktRange(dataSetInfo),
        initial: initialRange
    }
}

/**
 * This contains default options to use with CycleClock constructor.
 */
BCC.prototype.cycleClockOptions = {
    width: 210,
    height: 220,
    radius: 80,
    fontSize: 16,
    innerDist: 15,
    crise1Color: "#FAA61A",
    crise1MirrorColor: "#FEDEB3",
    crise2Color: "#F26522",
    crise2MirrorColor: "#F89F6C",
    noCriseColor: "#8BD1D1",
    noCriseMirrorColor: "#3BBFBD"
};

/**
 * This function switch the country associated with a specific clock in the list, identified by a jQuery style selector.
 * @param {string|object} selector - A jQuery style selector used to identify the clock to switch country.
 */
BCC.prototype.switchCountryForSelector = function (selector) {
    var countrySelector = $(selector);
    if (countrySelector.length > 0) {
        var oldCountryCode = countrySelector.attr('data-country-ongraph');
        var newCountryCode = countrySelector[0].value;
        if(oldCountryCode!==newCountryCode){
            this.chart.loadCountry(newCountryCode, this.navList.getClockIndex(selector));
            this.chart.unloadCountry(oldCountryCode, false);
            countrySelector.attr('data-country-ongraph', newCountryCode);
            var countryJqElem = countrySelector.parents('.country[data-country-code]');
            countryJqElem.attr('data-country-code', newCountryCode);
            this.selectCountry(newCountryCode);
            this.clocks[newCountryCode] = new CycleClock(countryJqElem.find('.oneClock'), this.cycleClockOptions);
            this.updateClockForCountry(newCountryCode);
            this.navList.updateSelectorsList();
            this.chart.reDraw();
        }
    }
}


function resizeMap() {
        var MapDim = Math.max(240,0.6*document.getElementById('float-clocks').clientHeight) + "px";
	    var yourImg = document.getElementById('picture_map');
		yourImg.style.height = MapDim;
}




/**
 * Remove a country from the clocks and his data from the graph, based on a clock identified by a jQuery style selector.
 * @param {string|object} selector - A jQuery style selector used to identify the country/clock to remove.
 */
BCC.prototype.removeCountry = function (selector) {
    var countyElem = $(selector).parents('.country[data-country-code]');
    var countryCode = countyElem.attr('data-country-code');
    var isSelected = countyElem.hasClass('selected');
    this.chart.unloadCountry(countryCode);
    this.clocks[countryCode] = undefined;
    this.navList.removeCountryInNavlist(countryCode);
    this.navList.updateSelectorsList();
    if (isSelected) {
        this.chart.clearRegions(true);
        this.getCountryCodes();
        if(this.navList.getShownCountries().length==1){
            this.updateAsideStats(this.navList.retrieveCountryShownCodes());
        } else {
            this.updateAsideStats();
        }
        var countryShownCodes = this.navList.retrieveCountryShownCodes();
        this.selectCountry(countryShownCodes[countryShownCodes.length-1]);
    } else if(this.navList.getShownCountries().length==1){
        this.updateAsideStats(this.navList.retrieveCountryShownCodes());
    }
    this.chart.reDraw();
	resizeMap()

}

/**
 * Function to update the position on clock for a specific country.
 * @param {String} countryCode - The country code of the country which the clock must be updated.
 */
BCC.prototype.updateClockForCountry = function (countryCode) {
    var country = this.navList.getClockForCountry(countryCode);
    this.updateClocks(bcc.timer.timerPos, country);
}

/**
 * Update the time period (range) from a date to another.
 * @param {date} min - The minimum date of the range; it can be a Date object, a time in milliseconds from 1970 or a date formatted in as string.
 * @param {date} min - The maximum date of the range; it can be a Date object, a time in milliseconds from 1970 or a date formatted in as string.
 * @param {boolean} checkInitialRange - Tell if it must check if the range difined by min and max is inside the initial range, if not the range is shrinked to fit into the initial one.
 * @param {string} format - The format used to parse min and max dates if they are string (optional).
 * @param {string} delimiter - The delimiter used by the date format. Example: format="dd/mm/yyyy" and delimiter="/".
 * @return {object} The updated range object.
 */
BCC.prototype.updateRangeDate = function(min, max, checkInitialRange, format, delimiter) {
    var minDate = toDate(min, format, delimiter);
    var maxDate = toDate(max, format, delimiter);
    if (checkInitialRange && minDate < this.range.initial.clock.min.date) {
        minDate = this.range.initial.clock.min.date;
    }
    if (checkInitialRange && max > this.range.initial.clock.max.date) {
        maxDate = this.range.initial.clock.max.date;
    }
    for (var i = 0; i < this.dataSetInfo[this.range.clock.refCountry].date.length; i++) {
        var date = toDate(this.dataSetInfo[this.range.clock.refCountry].date[i]);
        if (date.getTime() >= maxDate.getTime()) {
            this.range.clock.max.date = date;
            this.range.clock.max.pos = i;
            break;
        }
    }
    for (var i = this.dataSetInfo[this.range.clock.refCountry].date.length - 1; i >= 0; i--) {
        var date = toDate(this.dataSetInfo[this.range.clock.refCountry].date[i]);
        if (date.getTime() <= minDate.getTime()) {
            this.range.clock.min.date = date;
            this.range.clock.min.pos = i;
            break;
        }
    }
    this.afterClockRangeUpdated()
    return this.range;
}

/**
 * Function call after the clock range (time period) has changed, to update the graph and other elements for the new range.
 */
BCC.prototype.afterClockRangeUpdated = function() {
    this.updateChartRange(this.dataSetInfo, this.range);
    this.chart.setRange(this.range.chart.min.date, this.range.chart.max.date);
    this.timeSlider.slider("option", {
        min: this.range.clock.min.pos,
        max: this.range.clock.max.pos
    });
    this.timer.minTimerPos = this.range.clock.min.pos;
    this.timer.maxTimerPos = this.range.clock.max.pos;
    if (this.timer.timerPos > this.range.clock.max.pos || this.timer.timerPos < this.range.clock.min.pos) {
        this.timer.setPos(this.range.clock.min.pos);
    }
}

/**
 * Updates the chart range following the clock range.
 */
BCC.prototype.updateChartRange = function(dataSetInfo, range) {
    for (var i = 1; i < dataSetInfo[range.chart.refCountry].dates.length; i++) {
        var date = toDate(dataSetInfo[range.chart.refCountry].dates[i], 'dd/mm/yyyy', '/');
        if (new Date(date).setDate(1) >= new Date(range.clock.min.date).setDate(1)) {
            range.chart.min.pos = i - 1;
            range.chart.min.date = new Date(new Date(range.clock.min.date).setDate(31));
            break;
        }
    }
    for (var i = dataSetInfo[range.chart.refCountry].dates.length - 1; i > 0; i--) {
        var date = toDate(dataSetInfo[range.chart.refCountry].dates[i], 'dd/mm/yyyy', '/');
        if (new Date(date).setDate(1) <= new Date(range.clock.max.date).setDate(1)) {
            range.chart.max.pos = i - 1;
            range.chart.max.date = new Date(new Date(range.clock.max.date).setDate(31));
            break;
        }
    }
}

/**
 * Function that initiates the initial range from the dataSet.
 * @param {object} dataSetInfo - It contains structured data for the BCC from the dataSet file.
 * @return {object} The initial range for the graph.
 */
BCC.prototype.getInitialChartRange = function(dataSetInfo) {
    var maxChart = {
        min: {
            date: 0,
            pos: 0
        },
        max: {
            date: 0,
            pos: 0
        },
        refCountry: 'EA'
    };
    if (typeof dataSetInfo != 'undefined' && dataSetInfo) {
        $.each(dataSetInfo, function (code, countryDataInfo) {
            if (countryDataInfo.dates.length - 2 > maxChart.max.pos) { // -2 ?
                maxChart.max.pos = countryDataInfo.dates.length - 2;
                maxChart.max.date = toDate(countryDataInfo.dates[maxChart.max.pos + 1], 'dd/mm/yyyy', '/');
                maxChart.min.pos = 0;
                maxChart.min.date = toDate(countryDataInfo.dates[1], 'dd/mm/yyyy', '/');
                maxChart.refCountry = code;
            }
        }.bind(this));
    }
    return maxChart;
}

/**
 * Function that initiates the initial range for clocks from the dataSet.
 * @param {object} dataSetInfo - It contains structured data for the BCC from the dataSet file.
 * @return {object} The initial range for clocks.
 */
BCC.prototype.getInitialClocktRange = function(dataSetInfo) {
    var maxClock = {
        min: {
            date: 0,
            pos: 0
        },
        max: {
            date: 0,
            pos: 0
        },
        refCountry: 'EA'
    };
    if (typeof dataSetInfo != 'undefined' && dataSetInfo) {
        $.each(dataSetInfo, function (code, countryDataInfo) {
            if (countryDataInfo.date.length - 1 > maxClock.max.pos) {
                var maxValidIndex = countryDataInfo.date.length - 1;

                for (; maxValidIndex > 0; maxValidIndex--) {
                    if ( !!countryDataInfo.angle[maxValidIndex]
                            && !isNaN(countryDataInfo.angle[maxValidIndex]) ) {
                        break;
                    }
                }
                maxClock.max.pos = maxValidIndex;
                maxClock.max.date = toDate(countryDataInfo.date[maxClock.max.pos], 'dd/mm/yyyy', '/');
                maxClock.min.pos = 0;
                maxClock.min.date = toDate(countryDataInfo.date[0], 'dd/mm/yyyy', '/');
                maxClock.refCountry = code;
            }
        }.bind(this));
    }
    return maxClock;
}

/**
 * Function that initiates the time slider based on the range (time period).
 * @param {object} range - The range defines time periods of the data.
 * @return {object} The jQuery object linked to the DOM element of the time slider.
 */
BCC.prototype.initTimeSlider = function(range) {
    var firstCountryCode = this.dataset.DataSet.Data[0].Country["@attributes"].code;
    var max = this.dataSetInfo[firstCountryCode].date.length - 1;
    $("<div id='timeSlider'></div>").insertAfter('#countriesChart').slider({
        min: 0,
        max: max,
        value: max,
        slide: function (event, ui) {
            this.timer.setPos(ui.value);
        }.bind(this)
    });
    return $('#timeSlider');
}

/**
 * Update all the clocks.
 * @param {number} clockPos - The index of the position in the data list used by the clocks.
 * @param {list|object} clockPos - A list of country elements (DOM element or jQuery selector), or jQuery object with countries elements from the BCC page. It is optional, all countries from the clocks list will be used if parameter is ne set.
 */
BCC.prototype.updateClocks = function(clockPos, countriesShown) {
    if (typeof countriesShown == 'undefined' || !countriesShown) {
        countriesShown = this.navList.retrieveCountriesShown();
    }
    countriesShown.each(function (index, countryElem) {
        var clockPosCountry = clockPos;
        var countryCode = $(countryElem).attr('data-country-code');
        var canvasJqElem = $(countryElem).find('.oneClock>canvas')
        var currentQuarterDetails = undefined;


        if (canvasJqElem.length > 0 && this.clocks[countryCode]) {
            var data = this.dataSetInfo[countryCode];

            if ( !currentQuarterDetails ) {
                currentQuarterDetails = data.date[clockPos];
                $('#currentQuarter').html(formatQuarterHtml(currentQuarterDetails));
            }

            if (data && data.angle && clockPosCountry <= data.angle.length) {
                var angle = NaN;

                if ( !data.gdpgc ||
                    Math.floor(clockPosCountry/3) > data.gdpgc.length ||
                    isNaN(data.angle[clockPosCountry])) {

                    for ( var i = clockPos; i>0; i--) {
                        if ( !isNaN(data.angle[i]) && isFinite(data.angle[i]) ) {
                            clockPosCountry = i;
                            break;
                        }
                    }
                }

                angle = data.angle[clockPosCountry];

                this.clocks[countryCode].updateClock(angle);
            }

            if (data && data.date && clockPosCountry <= data.date.length) {
                var date = data.date[clockPosCountry];
                $(countryElem).find('span#currentDate, span.currentDate').html($.datepicker.formatDate('MM yy', toDate(date), $.datepicker.regional[$.i18n.language.substr(0, 2)]));
            }
        }
    }.bind(this));
}

/**
 * Retrieve all the country codes from the dataSet.
 * @return {string[]} An array of country code.
 */
BCC.prototype.getCountryCodes = function() {
    var countries = [];
    for (var k in this.dataSetInfo)
        countries.push(k);
    return countries;
}

/**
 * Returns the series for a country used for the graph (C3.js), rom the current dataSet.
 * @return {object[]} The data series formatted for using with C3.js.
 */
BCC.prototype.getCountrySeriesData = function(coutrycode) {
    var series = [];
    series.push(this.dataSetInfo[coutrycode].dates);
    series.push(this.dataSetInfo[coutrycode].ser2);
    return series;
}

/**
 * Function to add a country in the view (clocks and graph) based on a country code.
 * @param {string} countryCode - The country code of the country to add.
 * @param {boolean} noRemoveOption - If true, no remove button will be available to the user.
 */
BCC.prototype.addCountry = function (countryCode, noRemoveOption) {
    if (this.dataSetInfo[countryCode]) {
        this.chart.loadCountry(countryCode, this.navList.getNewClockIndex());
        this.chart.selectPointAllSeries(this.getChartPos(this.timer.timerPos));
        var countryElem = this.navList.addCountryInNavlist(countryCode,
            function (e) {
                this.switchCountryForSelector(e.target);
            }.bind(this),
            function (e) {
                this.mouseEnteredCountry(e.target);
            }.bind(this),
            function (e) {
                this.mouseLeavedCountry(e.target);
            }.bind(this),
            function (e) {
                this.clickedCountry(e.target);
            }.bind(this),
            function(e){
                this.removeCountry(e.target);
            }.bind(this), undefined, noRemoveOption);
        this.selectCountry(countryCode);
        this.chart.reDraw();
        this.clocks[countryCode] = new CycleClock($(countryElem).find('.oneClock'), this.cycleClockOptions);
        this.updateClockForCountry(countryCode);
    }
    this.navList.updateSelectorsList();
}

/**
 * Function called when the mouse entered over a country (clock), to handle highlights on mouse hovering.
 * @param {string|object} selector - A jQuery style selector used to identify the country/clock.
 */
BCC.prototype.mouseEnteredCountry = function (selector) {
    var countryCode = $(selector).parents(".country[data-country-code]").attr('data-country-code');
    this.chart.focusCountry(countryCode);
}

/**
 * Function called when the mouse left a country (clock), to handle highlights on mouse hovering.
 * @param {string|object} selector - A jQuery style selector used to identify the country/clock.
 */
BCC.prototype.mouseLeavedCountry = function (selector) {
    bcc.chart.unfocusCountry();
    var selected = this.navList.getSelectedCountry();
    if (selected) {
        bcc.chart.focusCountry(selected);
    } else {
        bcc.chart.clearRegions(true);
    }
}

/**
 * Function called when a country (clock) was cklicked, to handle country highlight selection.
 * @param {string|object} selector - A jQuery style selector used to identify the country/clock.
 */
BCC.prototype.clickedCountry = function (selector) {
    var countryCode = $(selector).parents(".country[data-country-code]").attr('data-country-code');
    bcc.selectCountry(countryCode);
}

/**
 * Finds the closest turning point anterior to a given date, for a specific country.
 * @param {string} countryCode - The code of the country.
 * @param {Date} date - The date to find turning point anterior to it.
 */
BCC.prototype.findPreviousTP = function (countryCode, date, before){
    var beforeTP=[];
    var previousTP = undefined;
    if(this.dataSetInfo[countryCode].tps.length>0){
        for(var i=0; i<this.dataSetInfo[countryCode].tps.length; i++){
            if(this.dataSetInfo[countryCode].tps[i].date.getTime()<date.getTime()){
                if(previousTP===undefined || this.dataSetInfo[countryCode].tps[i].date.getTime()>previousTP[0].date.getTime()){
                    if(previousTP===undefined){
                        previousTP=[];
                    }
                    beforeTP=previousTP;
                    previousTP=[];
                    previousTP.push(this.dataSetInfo[countryCode].tps[i]);
                } else if(previousTP===undefined || this.dataSetInfo[countryCode].tps[i].date.getTime()===previousTP[0].date.getTime()){
                    if(previousTP===undefined){
                        previousTP=[];
                    }
                    beforeTP=previousTP;
                    previousTP.push(this.dataSetInfo[countryCode].tps[i]);
                }
            }
        }
    }
    return before?beforeTP:previousTP;
}

/**
 * Finds the closest turning point (A, B, C or D) anterior to a given date, for a specific country.
 * @param {string} countryCode - The code of the country.
 * @param {Date} date - The date to find turning point anterior to it.
 */
BCC.prototype.findPreviousABCD_TP = function (countryCode, date, before){
    var beforeTP=[];
    var previousTP = undefined;
    if(this.dataSetInfo[countryCode].tps.length>0){
        for(var i=0; i<this.dataSetInfo[countryCode].tps.length; i++){
            if(this.dataSetInfo[countryCode].tps[i].date.getTime()<date.getTime() && (this.dataSetInfo[countryCode].tps[i].tp!='α' && this.dataSetInfo[countryCode].tps[i].tp!='β')){
                if(previousTP===undefined || this.dataSetInfo[countryCode].tps[i].date.getTime()>previousTP[0].date.getTime()){
                    if(previousTP===undefined){
                        previousTP=[];
                    }
                    beforeTP=previousTP;
                    previousTP=[];
                    previousTP.push(this.dataSetInfo[countryCode].tps[i]);
                } else if(previousTP===undefined || this.dataSetInfo[countryCode].tps[i].date.getTime()===previousTP[0].date.getTime()){
                    if(previousTP===undefined){
                        previousTP=[];
                    }
                    beforeTP=previousTP;
                    previousTP.push(this.dataSetInfo[countryCode].tps[i]);
                }
            }
        }
    }
    return before?beforeTP:previousTP;
}

/**
 * Give the date of the begining of the quarter where the provided date is in.
 * @param {Date | number | string} date - The date to find turning point anterior to it.
 */
function getQuarterBeginDate(date, format, delimiter){
    var quarterDate = toDate(date, format, delimiter);
    quarterDate.setDate(1);
    quarterDate.setMonth(((Math.floor(quarterDate.getMonth()/3))*3));
    var newDate = new Date(0);
    newDate.setFullYear(quarterDate.getFullYear());
    newDate.setMonth(quarterDate.getMonth());
    newDate.setDate(quarterDate.getDate());
    return newDate;
}

/**
 * Give the date of the end of the quarter where the provided date is in.
 * @param {Date | number | string} date - The date to find turning point anterior to it.
 */
function getQuarterEndDate(date, format, delimiter){
    var quarterDate = toDate(date, format, delimiter);
    quarterDate.setMonth(((Math.floor(quarterDate.getMonth()/3))*3)+2);
    quarterDate.setMonth(quarterDate.getMonth()+1);
    quarterDate.setDate(0);
    var newDate = new Date(0);
    newDate.setFullYear(quarterDate.getFullYear());
    newDate.setMonth(quarterDate.getMonth());
    newDate.setDate(quarterDate.getDate());
    return newDate;
}

function haveTP(array,tp){
    for(var i=0; i<array.length; i++){
        if(array[i].tp===tp){
            return true;
        }
    }
    return false;
}

function getTP(array,tp){
    for(var i=0; i<array.length; i++){
        if(array[i].tp===tp){
            return array[i];
        }
    }
    return undefined;
}

/**
 * Update the statistic block (right bottom panel of the main view) with information of a country.
 * @param {string[]} countryCodes - The codes of the countrys for which information must be displayed.
 * @param {number} pos - Current position in the data (clocks data), to show data related to the current position.
 */
BCC.prototype.updateAsideStats = function(countryCodes, pos) {
    if(!pos){
        pos = this.timer.timerPos
    }
    var statsHtml = '<div>';

    var selectedCountry = this.navList.getSelectedCountry();

    if (!selectedCountry)
        return;

    if(countryCodes)for(var i=0; i<countryCodes.length; i++){
        if ( selectedCountry != countryCodes[i] ) {
            continue;
        }

        var currentDate = toDate(this.dataSetInfo[countryCodes[i]].date[pos],'dd/mm/yyyy','/');
        var quarterDate = getQuarterEndDate(currentDate);
        if(quarterDate.getTime()>toDate(this.dataSetInfo[countryCodes[i]].dates[this.dataSetInfo[countryCodes[i]].dates.length-1], 'dd/mm/yyyy', '/').getTime()){
            quarterDate = toDate(this.dataSetInfo[countryCodes[i]].dates[this.dataSetInfo[countryCodes[i]].dates.length-1], 'dd/mm/yyyy', '/');
        }
        var currentQuarterValuesIndex;
        var j = this.dataSetInfo[countryCodes[i]].gdp.length-1;
        while(j>=0 && !currentQuarterValuesIndex){
            if(this.dataSetInfo[countryCodes[i]].gdp[j] && this.dataSetInfo[countryCodes[i]].gdp[j]>0){
                var quarterDateTime = quarterDate.getTime();
                var otherDate = getQuarterEndDate(toDate(this.dataSetInfo[countryCodes[i]].dates[j+1], 'dd/mm/yyyy', '/'));
                var otherTime = getQuarterEndDate(toDate(this.dataSetInfo[countryCodes[i]].dates[j+1], 'dd/mm/yyyy', '/')).getTime();
                if(quarterDate.getTime()>getQuarterEndDate(toDate(this.dataSetInfo[countryCodes[i]].dates[j+1], 'dd/mm/yyyy', '/')).getTime()){
                    currentQuarterValuesIndex=j;
                    quarterDate = getQuarterEndDate(toDate(this.dataSetInfo[countryCodes[i]].dates[j+1], 'dd/mm/yyyy', '/'));
                }
            }
            j--
        }
        var tp = this.findPreviousTP(countryCodes[i],quarterDate);
        if(tp&&quarterDate.getTime()){
            statsHtml+= '<span data-i18n="for">' + $.i18n.t("for") + "</span>: " + this.dataSetInfo[countryCodes[i]].description;
            var distanceFromCurrent;
            if(haveTP(tp,'D')){
                distanceFromCurrent = Math.floor(monthDiff(getQuarterEndDate(getTP(tp,'D').date), quarterDate)/3)+1;
                statsHtml+= '<br/><span data-i18n="expansion">'+$.i18n.t("expansion")+'</span>: ' + distanceFromCurrent + ' <span data-i18n="quarters">'+$.i18n.t("quarters")+'</span>';
            }else if(haveTP(tp,'C')){
                distanceFromCurrent = Math.floor(monthDiff(getQuarterEndDate(getTP(tp,'C').date), quarterDate)/3)+1;
                statsHtml+= '<br/><span data-i18n="recovery">'+$.i18n.t("recovery")+'</span>: ' + distanceFromCurrent + ' <span data-i18n="quarters">'+$.i18n.t("quarters")+'</span>';
            }else if(haveTP(tp,'β')){
                distanceFromCurrent = Math.floor(monthDiff(getQuarterEndDate(getTP(tp,'β').date), quarterDate)/3)+1;
                var previousTP = this.findPreviousTP(countryCodes[i],quarterDate, true);
                if(previousTP && haveTP(previousTP,"B")){
                    statsHtml+= '<br/><span data-i18n="recession">'+$.i18n.t("recession")+'</span>: ' + Math.floor(monthDiff(getQuarterEndDate(getTP(previousTP,'B').date), quarterDate)/3) + ' <span data-i18n="quarters">'+$.i18n.t("quarters")+'</span>';
                }
            }else if(haveTP(tp,'B')){
                distanceFromCurrent = Math.floor(monthDiff(getQuarterEndDate(getTP(tp,'B').date), quarterDate)/3)+1;
                statsHtml+= '<br/><span data-i18n="recession">'+$.i18n.t("recession")+'</span>: ' + distanceFromCurrent + ' <span data-i18n="quarters">'+$.i18n.t("quarters")+'</span>';
            }else if(haveTP(tp,'A')){
                distanceFromCurrent = Math.floor(monthDiff(getQuarterEndDate(getTP(tp,'A').date), quarterDate)/3)+1;
                statsHtml+= '<br/><span data-i18n="slowdown">'+$.i18n.t("slowdown")+'</span>: ' + distanceFromCurrent + ' <span data-i18n="quarters">'+$.i18n.t("quarters")+'</span>';
            }else if(haveTP(tp,'α')){
                distanceFromCurrent = Math.floor(monthDiff(getQuarterEndDate(getTP(tp,'α').date), quarterDate)/3)+1;
                statsHtml+= '<br/><span data-i18n="deceleration">'+$.i18n.t("deceleration")+'</span>: ' + distanceFromCurrent + ' <span data-i18n="quarters">'+$.i18n.t("quarters")+'</span>';
            }
            tp = this.findPreviousABCD_TP(countryCodes[i],quarterDate)
            // if(tp){
            //     var value;
            //     if(haveTP(tp,'D')){
            //         var tpValuesIndex = getTP(tp,'D').index;
            //         var current_gdpgc=this.dataSetInfo[countryCodes[i]].gdpgc[currentQuarterValuesIndex];
            //         var tp_gdpgc=this.dataSetInfo[countryCodes[i]].gdpgc[tpValuesIndex];
            //         value = (current_gdpgc-tp_gdpgc)/current_gdpgc;
            //         statsHtml+=' <span data-i18n="amplitude_expansion">'+$.i18n.t('amplitude_expansion')+'</span>: '+value.toFixed(2);
            //
            //     } else if(haveTP(tp,'C')){
            //         var tpValuesIndex = getTP(tp,'C').index;
            //         var current_gdp=this.dataSetInfo[countryCodes[i]].gdpgc[currentQuarterValuesIndex];
            //         var tp_gdp=this.dataSetInfo[countryCodes[i]].gdpgc[tpValuesIndex];
            //         value = (current_gdp-tp_gdp)/current_gdp;
            //         statsHtml+=' <span data-i18n="deepness_recovery">'+$.i18n.t('deepness_recovery')+'</span>: '+value.toFixed(2);
            //
            //     } else if(haveTP(tp,'B')){
            //         var tpValuesIndex = getTP(tp,'B').index;
            //         var current_gdp=this.dataSetInfo[countryCodes[i]].gdpgc[currentQuarterValuesIndex];
            //         var tp_gdp=this.dataSetInfo[countryCodes[i]].gdpgc[tpValuesIndex];
            //         value = (current_gdp-tp_gdp)/current_gdp;
            //         statsHtml+=' <span data-i18n="deepness_recession">'+$.i18n.t('deepness_recession')+'</span>: '+value.toFixed(2);
            //
            //     } else if(haveTP(tp,'A')){
            //         var tpValuesIndex = getTP(tp,'A').index;
            //         var current_gdpgc=this.dataSetInfo[countryCodes[i]].gdpgc[currentQuarterValuesIndex];
            //         var tp_gdpgc=this.dataSetInfo[countryCodes[i]].gdpgc[tpValuesIndex];
            //         value = (current_gdpgc-tp_gdpgc)/current_gdpgc;
            //         statsHtml+=' <span data-i18n="amplitude_slowdown">'+$.i18n.t('amplitude_slowdown')+'</span>: '+value.toFixed(2);
            //     }
            // }
        }
    }
    $('#docClock').html(statsHtml+'</div>');
    $('#docClock').toggleClass('animate');
    setTimeout(function () {
        $('#docClock').toggleClass('animate');
    }, 600);
}

/**
 * Update the statistic block (right bottom panel of the main view) with information of a country.
 * @param {string} countryCode - The code of the country for which information must be displayed.
 * @param {number} pos - Current position in the data (clocks data), to show data related to the current position.
 */
BCC.prototype.updateAsideStatsOld = function(countryCode, pos) {
    var statsHtml = '<div><h1 data-i18n="current_cycle_durations">'+$.i18n.t('current_cycle_durations')+'</h1><br/><b>'+(countryCode=="GB"?"UK":(countryCode=="GR"?"EL":countryCode))+'</b>';
    if(countryCode){
        if(!pos){
            pos = this.timer.timerPos
        }
        var currentDate = toDate(this.dataSetInfo[countryCode].date[pos],'dd/mm/yyyy','/');
        var regions = this.getRegions(countryCode);
        var inCrise=false;
        for (var i=0;i<regions.length;i++){
            var startDate = toDate(regions[i].start, 'dd/mm/yyyy','/');
            startDate.setDate(0);
            var stopDate = toDate(regions[i].end, 'dd/mm/yyyy','/');
            stopDate.setMonth(((Math.floor(stopDate.getMonth()/3))*3)+2);
            if(currentDate.getTime()>=startDate.getTime() && currentDate.getTime()<=stopDate.getTime()){
                var md = monthDiff(startDate, stopDate);
                if(regions[i].class=="crise2"){
                    statsHtml+= '<br/><span data-i18n="recession">'+$.i18n.t("recession")+'</span> = ' + Math.floor(md/3) + ' <span data-i18n="quarters">'+$.i18n.t("quarters")+'</span>';
                    inCrise=true;
                } else if(regions[i].class=="crise1") {
                    statsHtml+= '<br/><span data-i18n="slowdown">'+$.i18n.t("slowdown")+'</span> = ' + Math.floor(md/3) + ' <span data-i18n="quarters">'+$.i18n.t("quarters")+'</span>';
                    inCrise=true;
                }
            } else if((!startDate || isNaN(startDate.getTime())) && (!isNaN(stopDate.getTime()) && currentDate.getTime()<=stopDate.getTime())){
                if(regions[i].class=="crise2"){
                    statsHtml+= '<br/><span data-i18n="recession">'+$.i18n.t("recession")+'</span> <span data-i18n="until">'+$.i18n.t("until")+'</span> '+formatQuarterHtml(stopDate);
                    inCrise=true;
                } else if(regions[i].class=="crise1") {
                    statsHtml+= '<br/><span data-i18n="slowdown">'+$.i18n.t("slowdown")+'</span> <span data-i18n="until">'+$.i18n.t("until")+'</span> '+formatQuarterHtml(stopDate);
                    inCrise=true;
                }
            } else if((!stopDate || isNaN(stopDate.getTime())) && (!isNaN(startDate.getTime()) && currentDate.getTime()>=startDate.getTime())){
                if(regions[i].class=="crise2"){
                    statsHtml+= '<br/><span data-i18n="recession">'+$.i18n.t("recession")+'</span> <span data-i18n="since">'+$.i18n.t("since")+'</span> '+formatQuarterHtml(startDate);
                    inCrise=true;
                } else if(regions[i].class=="crise1") {
                    statsHtml+= '<br/><span data-i18n="slowdown">'+$.i18n.t("slowdown")+'</span> <span data-i18n="since">'+$.i18n.t("since")+'</span> '+formatQuarterHtml(startDate);
                    inCrise=true;
                }
            }
        }
        if(!inCrise){
            var noCrisePeriod = this.findGrowthDuration(currentDate,regions);
            if(noCrisePeriod.startDate && noCrisePeriod.stopDate){
                var md = monthDiff(noCrisePeriod.startDate, noCrisePeriod.stopDate);
                statsHtml+= '<br/><span data-i18n="growth">'+$.i18n.t("growth")+'</span> = ' + Math.floor(md/3) + ' <span data-i18n="quarters">'+$.i18n.t("quarters")+'</span>';
            } else if(!noCrisePeriod.startDate && noCrisePeriod.stopDate){
                statsHtml+= '<br/><span data-i18n="growth">'+$.i18n.t("growth")+'</span> <span data-i18n="until">'+$.i18n.t("until")+'</span> '+formatQuarterHtml(noCrisePeriod.stopDate);
            } else if(!noCrisePeriod.stopDate && noCrisePeriod.startDate){
                statsHtml+= '<br/><span data-i18n="growth">'+$.i18n.t("growth")+'</span> <span data-i18n="since">'+$.i18n.t("since")+'</span> '+formatQuarterHtml(noCrisePeriod.startDate);
            }
        }
    }
    if(statsHtml.length>0){
        $('#docClock').html(statsHtml+'</div>');
    }
}

/**
 * Find the duration of the current growth period.
 * (Assuming current date is in a growth period. There is no check if it is really a growth period.)
 * @param {Date} currentDate - The current date, it must be a valid Date object.
 * @param {object[]} regions - The slowdown and recession periods.
 * @return {object} The growth period (startDate and endDate).
 */
BCC.prototype.findGrowthDuration = function(currentDate,regions){
    var nearestPreviousCD, nearestNextAB;
    for (var i=0;i<regions.length;i++){
        var startDate = toDate(regions[i].start,'dd/mm/yyyy','/');
        var endDate = toDate(regions[i].end,'dd/mm/yyyy','/');
        if(startDate && !isNaN(startDate.getTime()) && startDate.getTime()>currentDate.getTime()){
            if(!nearestNextAB || startDate.getTime()<nearestNextAB.getTime()){
                nearestNextAB=startDate;
            }
        }
        if(endDate && !isNaN(endDate.getTime()) && endDate.getTime()<currentDate.getTime()){
            if(!nearestPreviousCD || endDate.getTime()>nearestPreviousCD.getTime()){
                nearestPreviousCD=endDate;
            }
        }
    }
    return {"startDate":nearestPreviousCD,"stopDate":nearestNextAB};
}

/**
 * Variable used to store regions (slowdown/recession periods) that has already been formatted for the graph.
 * class='crise' is slowdown, class='crise2' is recession
 */
var regionsByCountry = [];
/**
 * Retrieve the regions for a country, formatted for using with the graph.
 * @return {object[]} An array of regions {start, end, class}.
 */
BCC.prototype.getRegions = function(countryCode) {
    if(regionsByCountry[countryCode]){
        return regionsByCountry[countryCode];
    }
    var data = this.dataSetInfo[countryCode];
    var regions = [];
    var a = false,
        b = false,
        c = false,
        d = false;
    var AA = "",
        BB = "",
        CC = "",
        DD = "";

    for (var i = 0; i < data.region.length; i++) {
        if (data.region[i][0] == "A") {
            AA = data.region[i][1];
            a = true;
        }
        if (data.region[i][0] == "B") {
            BB = data.region[i][1];
            b = true;
        }
        if (data.region[i][0] == "C") {
            CC = data.region[i][1];
            c = true;
        }
        if (data.region[i][0] == "D") {
            DD = data.region[i][1];
            d = true;
        }

        if (c) {
            if (b) {
                regions.push({
                    start: BB,
                    end: CC,
                    'class': 'crise2'
                });
                b = c = false;
            } else {
                regions.push({
                    end: CC,
                    'class': 'crise2'
                });
                c = false;
            }
        }

        if (d) {
            if (a) {
                regions.unshift({
                    start: AA,
                    end: DD,
                    'class': 'crise1'
                });
                d = a = false;
            } else {
                regions.unshift({
                    end: DD,
                    'class': 'crise1'
                });
                d = false;
            }
        }
    }
    if(data.region[data.region.length-1][0]=="B"){
        regions.push({
            start: data.region[data.region.length-1][1],
            'class': 'crise2'
        });
        if(data.region[data.region.length-2][0]=="A"){
            regions.unshift({
                start: data.region[data.region.length-2][1],
                'class': 'crise1'
            });
        }
    } else if(data.region[data.region.length-1][0]=="A"){
        regions.unshift({
            start: data.region[data.region.length-1][1],
            'class': 'crise1'
        });
        if(data.region[data.region.length-2][0]=="B"){
            regions.push({
                start: data.region[data.region.length-2][1],
                'class': 'crise2'
            });
        }
    }
    regionsByCountry[countryCode] = regions;
    return regions;
}