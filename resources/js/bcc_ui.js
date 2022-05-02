/**
 * This represents the graphic element with clocks and add/remove country features.
 * @param {string | object | DOMelement} mapSelector - jQuery style selector or jQuery or DOM object to the clock list container in the page.
 * @param {string | object | DOMelement} mapSelector - jQuery style selector or jQuery or DOM object to the add country element.
 * @param {number} maxClock - The maximum number of clocks on the page, the maximum number of countries displayed.
 * @constructor
 */
function ClocksNavList(selector, addCountrySelector, maxClock){
    this.selector = selector;
    this.addCountrySelector = addCountrySelector;
    this.maxClock = maxClock;
}

/**
 * Returns the county selected (highlighted).
 * @return {string} The code of the country.
 */
ClocksNavList.prototype.getSelectedCountry = function () {
    var selected = $(this.selector).find(".country.selectable.selected[data-country-code]");
    return selected.length > 0 ? selected.attr('data-country-code') : undefined;
}

/**
 * Returns an array with the countries currently displayed on the page.
 * return {string[]} An array with codes of all currently displayed countries.
 */
ClocksNavList.prototype.getShownCountries = function () {
    var jqCountries = $(this.selector).find(".country.selectable[data-country-code]");
    var countries = [];
    for (var i = 0; i < jqCountries.length; i++) {
        countries.push($(jqCountries[i]).attr('data-country-code'));
    }
    return countries;
}

/**
 * Returns the clock for a specific country.
 * @param {string} countryCode - The code of the country.
 * @return {object} A jQuery selector result that contains page element for the country specified.
 */
ClocksNavList.prototype.getClockForCountry = function (countryCode) {
    return $(this.selector).find(".country[data-country-code='" + countryCode + "']");
}

/**
 * Return the index of a clock (country) in the list.
 * @param {string | object | DOMelement} selector - jQuery style selector or jQuery or DOM object to the clock/country element.
 * @return {number} The index of a clock (country) in the list.
 */
ClocksNavList.prototype.getClockIndex = function (selector) {
    var selectors = $(this.selector).find('.country thead select[data-country-ongraph]');
    return $.inArray(selector, selectors);
}

/**
 * Return the index for a clock (country) that will be added to the list (equals to lenght of the list).
 * @return {number} The index of a new entry in the list (equals to lenght of the list).
 */
ClocksNavList.prototype.getNewClockIndex = function () {
    var selectors = $(this.selector).find('.country thead select[data-country-ongraph]');
    return selectors.length;
}

/**
 * Update the list of choosable countries for adding, switching a county.
 * @param {string[]} countryShownCodes - An array of codes of the countries currently showned in BCC. Optional, if not set it will be retrieved automatically.
 */
ClocksNavList.prototype.updateSelectorsList = function (countryShownCodes) {
    if (typeof countryShownCodes == 'undefined' || !countryShownCodes) {
        countryShownCodes = this.retrieveCountryShownCodes();
    }
    $.each(countryShownCodes, function (index, countryCode) {
        $(this.selector).find(".country[data-country-code='" + countryCode + "'] th select").html(this.getSelectorOptions(countryCode, countryShownCodes));
    }.bind(this));
    var countryselectorOptions = this.getSelectorOptions(null, countryShownCodes, true);
    $(this.addCountrySelector).find("select#addCountrySelect").html(countryselectorOptions);
    $(this.addCountrySelector).find("select#addCountrySelectButton").html(countryselectorOptions);
    if (countryShownCodes.length >= this.maxClock) {
        $(this.addCountrySelector).hide();
    } else {
        $(this.addCountrySelector).show();
    }
}

/**
 * Retrieves the countries currently displayed on the page.
 * return {object} A jquery selector result with all the counties/clocks elements.
 */
ClocksNavList.prototype.retrieveCountriesShown = function () {
    return $(this.selector).find(".country[data-country-code]");
}

/**
 * Returns an array with the countries currently displayed on the page.
 * return {string[]} An array with codes of all currently displayed countries.
 */
ClocksNavList.prototype.retrieveCountryShownCodes = function () {
    var countries = this.retrieveCountriesShown();
    var countryCodes = [];
    $.each(countries, function (index, country) {
        countryCodes.push($(country).attr('data-country-code'));
    }.bind(this));
    return countryCodes;
}

/**
 * Remove a country/clock from the list.
 * @param {string} countryCode - The code of the country to remove.
 */
ClocksNavList.prototype.removeCountryInNavlist = function (countryCode) {
    $(this.selector).find(".country[data-country-code='" + countryCode + "']").parent().remove();
}

/**
 * Add a country and clock to the list.
 * @param {string} countryCode - The code of the country to add.
 * @param {function} onchange - A function called when country changes in the dropdown menu, for switching country.
 * @param {function} onmouseenter - A function called when the mouse enter the country/clock element, to handle highlight.
 * @param {function} onmouseleave - A function called when the mouse leave the country/clock element, to handle highlight.
 * @param {function} onclick - A function called when the user click on the country/clock element, to handle selection.
 * @param {function} onremove - A function called when the user remove a country/clock element.
 * @param {string[]} countryShownCodes - An array with codes of all currently displayed countries.
 * @param {boolean} noRemoveOption - If true, no remove button will be available to the user.
 * @return {object} The DOM object of the new added country/clock element.
 */
ClocksNavList.prototype.addCountryInNavlist = function (countryCode, onchange, onmouseenter, onmouseleave, onclick, onremove, countryShownCodes, noRemoveOption) {
    if (typeof countryShownCodes == 'undefined' || !countryShownCodes) {
        countryShownCodes = this.retrieveCountryShownCodes();
    }
    var addCountry = $(this.selector).find('li#addCountry');

    var navList =  $(this.selector + ' li');

    var newItemHTML = '<li><div class="country hover-highlight selectable" data-country-code="' + countryCode + '"><table><thead><tr><th><select data-country-ongraph="' + countryCode + '" onmousedown="if(this.options.length>11){this.size=11;}" onchange="setTimeout(function(){this.size=0;}.bind(this),1);" onblur="this.size=0;" size="0">' + this.getSelectorOptions(countryCode, countryShownCodes) + '</select>'+(!noRemoveOption?'<img class="deleteIcon" src="resources/img/Delete-icon.png" alt="remove" title="remove" data-i18n="[title]remove_country;[alt]remove_country"/>':'')+'</th></tr></thead><tbody><tr><td><div class="oneClock" ><canvas class="clock_canvas" width="210" height="200"></canvas><span class="currentDate"></span>';

    if (navList.length === 1) {
        newItemHTML+='<button class="help_button" data-i18n="[title]help" title="' + $.i18n.t('help') + '" onclick="$(\'#clockHelpPanel\').show(); bcc.cycleClockHelp.pie.flush();"/>';
    }

    newItemHTML += '</div></td></tr></tbody></table></div></li>';


    if(addCountry.length>0){
        addCountry.before(newItemHTML);
    } else {
        $(this.selector).append(newItemHTML);
    }
    var newCountry = $(this.selector).find(".country[data-country-code='" + countryCode + "']");
    newCountry.find("thead select[data-country-ongraph='" + countryCode + "']").change(onchange);
    var newCountryClock = newCountry.find(".oneClock");
    newCountryClock.mouseenter(onmouseenter);
    newCountryClock.mouseleave(onmouseleave);
    newCountryClock.click(onclick);
    if(!noRemoveOption){
        newCountry.find("img.deleteIcon").click(onremove);
    }
    return newCountry[0];
}

/**
 * Function to selects (highlights) a country.
 * @param {string} countryCode - The code of the country to select (highlight).
 */
ClocksNavList.prototype.selectCountry = function (countryCode) {
    $(this.selector).find(".country[data-country-code]").removeClass('selected');
    $(this.selector).find(".country[data-country-code='" + countryCode + "']").addClass('selected');
}

var orderedCountyCodes = ["BE","BG","CZ","DK","DE","EE","IE","EL","GR","ES","FR","HR","IT","CY","LV","LT","LU","HU","MT","NL","AT","PL","PT","RO","SI","SK","FI","SE","UK","GB"];

/**
 * Function to generates the options for a dropdown menu for country selection (add or switch country).
 * @param {string} countryCode - The code of the country selected in the dropdown menu (optional, can be undefined or null).
 * @param {string[]} coutryShownCodes - An array with codes of all currently displayed countries.
 * @param {boolean } addCountryOption - True if the option to add a country must be included (for add country, not switch).
 * @return {string} The HTML code for all options for the country dropdown menu.
 */
ClocksNavList.prototype.getSelectorOptions = function (countryCode, coutryShownCodes, addCountryOption) {
    if (typeof coutryShownCodes == 'undefined' || !coutryShownCodes) {
        coutryShownCodes = this.retrieveCountryShownCodes();
    }
    var optionsHTML = '';
    $.each(bcc.dataSetInfo, function (code, countryDataInfo) {
        if (code == countryCode) {
            optionsHTML = optionsHTML + '<option value="' + code + '" selected="selected" data-i18n="country:' + countryDataInfo.code + '">' + $.i18n.t('country:' + countryDataInfo.code) + '</option>';
        } else if ($.inArray(code, coutryShownCodes) < 0) {
            optionsHTML = optionsHTML + '<option value="' + code + '" data-i18n="country:' + countryDataInfo.code + '">' + $.i18n.t('country:' + countryDataInfo.code) + '</option>';
        }
    }.bind(this));
    optionsHTML=$(optionsHTML).sort(function (a,b){
        if($(a).val()=='EA'){
            return -1;
        }
        if($(b).val()=='EA'){
            return 1;
        }
        //return $(a).html().localeCompare($(b).html());
        var aPos = $.inArray($(a).val(), orderedCountyCodes);
        var bPos = $.inArray($(b).val(), orderedCountyCodes);
        return aPos<bPos?-1:1;
    });
    if(addCountryOption){
        optionsHTML = optionsHTML.toArray();
        optionsHTML.unshift($('<option value="" selected="selected" data-i18n="add_country_button">' + $.i18n.t('add_country_button') + '</option>')[0]);
    }
    return $(optionsHTML);
}

/**
 * Represent the GUI element to select a time period in months.
 * @constructor
 * @param {string | object | DOMelement} rangeSelectSelector - jQuery style selector or jQuery or DOM object to the element that contains inputs for selection.
 * @param {string | object | DOMelement} fromInputSelector - jQuery style selector or jQuery or DOM object to the input element for the selection of the starting month for custom selection.
 * @param {string | object | DOMelement} toInputSelector - jQuery style selector or jQuery or DOM object to the input element for the selection of the ending month for custom selection.
 * @param {object} range - The range object that defines the maximum, minimum dates usable in the BCC.
 */
function MonthRangeSelector(rangeSelectSelector, fromInputSelector, toInputSelector, range) {
    this.rangeSelectSelector = rangeSelectSelector;
    this.fromInputSelector = fromInputSelector;
    this.toInputSelector = toInputSelector;
    this.range = range;
    if(this.toInputSelector){
        $(this.toInputSelector).val($.datepicker.formatDate('mm/yy', this.range.clock.max.date));
        $(this.toInputSelector).MonthPicker({
            ShowIcon: false,
            UseInputMask: true,
            StartYear: this.range.clock.max.date.getFullYear(),
            MaxMonth: this.range.clock.max.date,
            MinMonth: new Date(new Date(this.range.clock.min.date).setMonth(this.range.clock.min.date.getMonth() + 6)),
            i18n: $.datepicker.regional[$.i18n.language.substr(0, 2)]
        });
    }
    $(this.fromInputSelector).val($.datepicker.formatDate('mm/yy', this.range.clock.min.date));
    $(this.fromInputSelector).MonthPicker({
        ShowIcon: false,
        UseInputMask: true,
        StartYear: this.range.clock.min.date.getFullYear(),
        MinMonth: this.range.clock.min.date,
        MaxMonth: new Date(new Date(this.range.clock.max.date).setMonth(this.range.clock.max.date.getMonth() - 6)),
        i18n: $.datepicker.regional[$.i18n.language.substr(0, 2)]
    });
    if(this.toInputSelector){
        $(this.toInputSelector).change(function () {
            var date = $(this.toInputSelector).MonthPicker('Validate');
            if (!date || date.getTime() < this.range.initial.clock.min.date.getTime() || date.getTime() > this.range.initial.clock.max.date.getTime()) {
                $(this).MonthPicker('SetSelectedMonth', this.range.clock.max.date);
            }
        }.bind(this));
    }
    $(this.fromInputSelector).change(function () {
        var date = $(this.fromInputSelector).MonthPicker('Validate');
        if (!date || date.getTime() < this.range.initial.clock.min.date.getTime() || date.getTime() > this.range.initial.clock.max.date.getTime()) {
            $(this).MonthPicker('SetSelectedMonth', this.range.clock.min.date);
        }
    }.bind(this));
}

/**
 * Return the value for starting month of custom selection.
 * @return {Date} The custom starting month.
 */
MonthRangeSelector.prototype.getCustomFromValue = function () {
    return $(this.fromInputSelector).MonthPicker('Validate');
}

/**
 * Returns the value for ending month of custom selection.
 * @return {Date} The custom ending month.
 */
MonthRangeSelector.prototype.getCustomToValue = function () {
    return this.toInputSelector?$(this.toInputSelector).MonthPicker('Validate'):this.range.clock.max.date;
}

/**
 * Set the value.
 * @param {string} value - The value from the dropdown menu.
 * @param {Date} from - The value for starting month of custom selection. Optional, only used if value is 'custom'.
 * @param {Date} to - The value for ending month of custom selection. Optional, only used if value is 'custom'.
 */
MonthRangeSelector.prototype.setValue = function (value, from, to) {
    $(this.rangeSelectSelector).val(value);
    if(value=="custom"){
        $(this.fromInputSelector).val($.datepicker.formatDate('mm/yy', from));
        $(this.toInputSelector).val($.datepicker.formatDate('mm/yy', to));
    }
}

/**
 * Return the current value of the dropdown menu.
 * @return {string} The value from basic selection ('5', '10', '15', 'all', 'custom');
 */
MonthRangeSelector.prototype.getValue = function () {
    return $(this.rangeSelectSelector).val();
}

/**
 * Get final values (from and to).
 * @return {object} An object with two attributes ('from' and 'to') containing Date.
 */
MonthRangeSelector.prototype.getValues = function () {
    var rangeSelectValue = $(this.rangeSelectSelector).val();
    switch (rangeSelectValue) {
        case '1':
        case '2':
        case '5':
        case '10':
        case '15':
        case '20':
            var fromDate = new Date(bcc.range.initial.clock.max.date).setFullYear(bcc.range.initial.clock.max.date.getFullYear() - Number(rangeSelectValue));
            return {from:fromDate,to:bcc.range.initial.clock.max.date}
        case 'all':
            return {from:bcc.range.initial.clock.min.date,to:bcc.range.initial.clock.max.date};
        case 'custom':
            var date1 = $(this.fromInputSelector).MonthPicker('Validate');
            var date2 = this.toInputSelector?$(this.toInputSelector).MonthPicker('Validate'):this.range.clock.max.date;
            if (date1 && date2) {
                if (date1.getTime() < date2.getTime()) {
                    return {from:date1,to:date2};
                } else {
                    return {from:date2,to:date1};
                }
            }
    }
}

/**
 * Function to do a custom action with the current values from the MonthRangeSelector.
 * @param {function} todo - The function to call, passing the current 'from' and 'to' values as Date.
 */
MonthRangeSelector.prototype.applyRangeSelection = function (todo) {
    var range = this.getValues();
    todo(range.from, range.to);
}

/**
 * Represents the GUI element that explain the meaning of the cycle clock.
 * @constructor
 * @param {string | object | DOMelement} selector - jQuery style selector or jQuery or DOM object to the elment where to insert the help tool.
 */
function CycleClockHelp(selector){
    this.pie = CycleClockHelp.prototype.c3.generate({
        bindto: selector,
        data: {
            columns: [
                ['α-A', 90],
                ['A-B', 45],
                ['B-β', 45],
                ['β-C', 45],
                ['C-D', 45],
                ['D-α', 90],
            ],
            type : 'pie',
            colors: {
                'α-A': '#8BD1D1',
                'A-B': '#FAA61A',
                'B-β': '#F26522',
                'β-C': '#F89F6C',
                'C-D': '#FEDEB3',
                'D-α': '#3BBFBD',
            },
            order: null
        },
        pie: {label: {show: false}},
        legend: {show: false},
        tooltip: {
            contents: function(d, defaultTitleFormat, defaultValueFormat, color){
                var color = color(d[0]);
                var innerContent = '';
                switch (d[0].id){
                    case 'α-A':case 'A-B':case 'B-β':
                        innerContent += $.i18n.t('right_quadrands_description')+'<br/>';
                        break;
                    case 'β-C':case 'C-D':case 'D-α':
                        innerContent += $.i18n.t('left_quadrands_description')+'<br/>';
                        break;
                }
                switch (d[0].id){
                    case 'α-A':
                        innerContent += '<br/>'+$.i18n.t('quadrant_upright_description');
                        break;
                    case 'A-B':
                        innerContent += '<br/>'+$.i18n.t('quadrant_bottomright_slowdown_description');
                        break;
                    case 'B-β':
                        innerContent += '<br/>'+$.i18n.t('quadrant_bottomright_recession_description');
                        break;
                    case 'β-C':
                        innerContent += '<br/>'+$.i18n.t('quadrant_bottomleft_recession_description');
                        break;
                    case 'C-D':
                        innerContent += '<br/>'+$.i18n.t('quadrant_bottomleft_slowdown_description');
                        break;
                    case 'D-α':
                        innerContent += '<br/>'+$.i18n.t('quadrant_bottomleft_description');
                        break;
                }
                return '<table class="c3-tooltip"><tbody><tr class="c3-tooltip-name-'+d[0].id+'"><td class="name"><span style="background-color:'+color+'"></span>'+d[0].id+'</td><td class="value">'+innerContent+'</td></tr></tbody></table>';
            }
        }
    });
}

if (typeof define === 'function' && define.amd) {
    define("bcc_ui", ['jquery', 'c3', 'i18nextBCC', 'jquery-ui', 'datepicker-de', 'datepicker-fr', 'monthPicker', 'bcc_commons'], function ($, c3) {
        CycleClockHelp.prototype.c3=c3;
        return null;
    });
} else if ('undefined' !== typeof exports && 'undefined' !== typeof module) {
    module.exports = null;
}
