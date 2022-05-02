/**
 * Make a Date object from a date formatted in a string. Handle only basic dates with day ('dd'), month ('mm') and 4 digits year ('yyyy').
 * @param {string} _date - The date as a string.
 * @param {string} _format - The format pattern.
 * @param {string} _delimiter - The delimiter used in the format pattern. For example _format="dd/mm/yyyy" and delimiter="/".
 * @return {Date} The Date object obtained from the given string date and format.
 */
function stringToDate(_date,_format,_delimiter) {
    var formatLowerCase=_format.toLowerCase();
    var formatItems=formatLowerCase.split(_delimiter);
    var dateItems=_date.split(_delimiter);
    var monthIndex=formatItems.indexOf("mm");
    var dayIndex=formatItems.indexOf("dd");
    var yearIndex=formatItems.indexOf("yyyy");
    var month=parseInt(dateItems[monthIndex]);
    month-=1;
    var formatedDate = new Date(dateItems[yearIndex],month,dateItems[dayIndex]);
    return formatedDate;
}

/**
 * Return a Date object from a date formatted in a string, a date as milliseconds from 1970 or a Date object.
 * @param {string | number | Date} _date - The date.
 * @param {string} _format - (Optional) The format pattern used for string date.
 * @param {string} _delimiter - (Optional) The delimiter used in the format pattern used for string date. For example _format="dd/mm/yyyy" and delimiter="/".
 * @return {Date} The date as a Date object.
 */
function toDate(date, dateFormat, delimiter){
    if(Object.prototype.toString.call(date) !== '[object Date]'){
        if($.type(date) === "string") {
            var df = (dateFormat!==undefined && $.type(dateFormat)==="string")?dateFormat:'dd/mm/yyyy';
            var d = (delimiter!==undefined && $.type(delimiter)==="string")?delimiter:'/';
            return stringToDate(date,df,d);
        } else {
            return new Date(date);
        }
    } else {
        return new Date(date.getTime());
    }
}

/**
 * Calculates the difference of time between two dates, in number of months. Days does not matter, the result is the number of total month as if the two dates has the same day of month.
 * Example monthDiff("20/02/2016","10/04/2016") -> 2.
 * @param {Date | string | number} date1 - The first date for the difference.
 * @param {Date | string | number} date2 - The second date for the difference.
 * @param {string} format - (Optional) The format pattern used for string date.
 * @param {string} delimiter - (Optional) The delimiter used in the format pattern used for string date. For example _format="dd/mm/yyyy" and delimiter="/".
 * @return {number} The number of month between the two given dates.
 */
function monthDiff(date1, date2, format, delimiter){
    var d1 = toDate(date1, format, delimiter);
    var d2 = toDate(date2, format, delimiter);
    var months = (d2.getFullYear()-d1.getFullYear())*12;
    months += d2.getMonth()-d1.getMonth();
    return months;
}

/**
 * Return the maximum index for clocks data, based on the given dataSetInfo object.
 * @param {object} dataSetInfo - It containes data structured for the BCC, based on the dataSet file.
 * @return {number} The maximum index for clocks data.
 */
function getMaxClockIndex(dataSetInfo) {
    var maxClock=0;
    if(typeof dataSetInfo != 'undefined' && dataSetInfo){
        $.each(dataSetInfo, function( code, countryDataInfo ) {
            if(countryDataInfo.angle.length-1>maxClock){
                maxClock=countryDataInfo.angle.length-1;
            }
        });
    }
    return maxClock;
}

/**
 * Check if a variable contains a valid number (number type, not NaN and not infinite).
 * @param n - The variable to check.
 * @return {boolean} True if it is a valid finite numeric; else returns false.
 */
function isValidNumeric(n){
    return !isNaN(parseFloat(n)) && isFinite(n);
}

/**
 * Initiates a url paramater based theme (not used at the end).
 * Theme are set in the url with the 'theme' paramater, so a class is added with its value. CSS has to be provided for the theme with the name as a CSS class embracing the elements.
 * @param {string | object} selector - (Optional) jQuery style selector or jQuery object to retrieve the element to theme must be applied on. If not set, 'body' is used.
 */
function initTheme(selector){
    var theme = getUrlParam('theme');
    setTheme(theme, selector);
}

/**
 * Apply a theme.
 * @param {string} theme -  The name of the theme to apply.
 * @param {string | object} selector - (Optional) jQuery style selector or jQuery object to retrieve the element to theme must be applied on. If not set, 'body' is used.
 */
function setTheme(theme, selector){
    if(!selector){
        selector = 'body';
    }
    $(selector).addClass(theme);
}

/**
 * Variables used to cache url parameters.
 */
var urlParams = null;
/**
 * Funtion to retrieve a parameter from the url.
 * @param {string} paramKey - The key (name) of the url parameter to retrieve.
 * @param {boolean} noCache - If true, the parameter is not retrieved from cache, but forced to retrieved from the url.
 * @return {string} The value retrieved for the given parameter key.
 */
function getUrlParam(paramKey, noCache){
    if(urlParams==null || noCache){
        urlParams={};window.location.search.replace(/[?&;]+([^=]+)=([^&;]*)/gi,function(str,key,value){urlParams[key] = value;});
    }
    return urlParams[paramKey];
}

/**
 * Return a quarter name formatted as HTML ready for i18n, from a date.
 * @param {string | number | Date} _date - The date.
 * @param {string} _format - (Optional) The format pattern used for string date.
 * @param {string} _delimiter - (Optional) The delimiter used in the format pattern used for string date. For example _format="dd/mm/yyyy" and delimiter="/".
 * @return {string} The quarter as HTML ready for i18n. Example: '05/04/2016' -> '<span data-i18n="2nd_quarter">2nd Quarter</span> 2016'.
 */
function formatQuarterHtml(date, format, delimiter){
    return formatQuarter(date, format, delimiter, true);
}

/**
 * Return a quarter name from a date.
 * @param {string | number | Date} _date - The date.
 * @param {string} _format - (Optional) The format pattern used for string date.
 * @param {string} _delimiter - (Optional) The delimiter used in the format pattern used for string date. For example _format="dd/mm/yyyy" and delimiter="/".
 * @param {boolean} html - If set to true, the name will be formatted as HTML redy for use with i18n; else it will be simple text.
 * @return {string} The quarter name. Examples: html=false '01/01/2014' -> '1st Quarter 2014'; html=tue '05/04/2016' -> '<span data-i18n="2nd_quarter">2nd Quarter</span> 2016'.
 */
function formatQuarter(date, format, delimiter, html){
    var d = toDate(date, format, delimiter);
    var month = d.getMonth();
    switch (month){
        case 0:
        case 1:
        case 2:
            if(html){
                return "<span data-i18n=\"1st_quarter\">"+$.i18n.t("1st_quarter")+"</span>"+d.getFullYear();
            }
            return $.i18n.t("1st_quarter")+d.getFullYear();
        case 3:
        case 4:
        case 5:
            if(html){
                return "<span data-i18n=\"2nd_quarter\">"+$.i18n.t("2nd_quarter")+"</span>"+d.getFullYear();
            }
            return $.i18n.t("2nd_quarter")+d.getFullYear();
        case 6:
        case 7:
        case 8:
            if(html){
                return "<span data-i18n=\"3rd_quarter\">"+$.i18n.t("3rd_quarter")+"</span>"+d.getFullYear();
            }
            return $.i18n.t("3rd_quarter")+d.getFullYear();
        case 9:
        case 10:
        case 11:
            if(html){
                return "<span data-i18n=\"4th_quarter\">"+$.i18n.t("4th_quarter")+"</span><span>"+d.getFullYear()+"</span>";
            }
            return $.i18n.t("4th_quarter") + d.getFullYear();
    }
}