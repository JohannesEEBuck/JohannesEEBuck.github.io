/**
 * C3js implementation of the linear chart of the BCC.
 * @param {string | object | DOMelement} selector - jQuery style selector or jQuery or DOM object to the elment where to insert the chart.
 * @param {BCC} bcc - The current BCC instance.
 * @param {object[]} seriesData - The series of data.
 * @param {objet[]} alabel - Labels and dates of turning points.
 * @param {string[][]} regions - Regions (slowdown, recession), that can be displayed on the graph.
 * @param {object} size - Object with size attributes 'height' and 'width' with number values, 'width' is optional.
 * @param {Date | number | string} dateMin - The minimum date of the time period to show in the graph; it can be a Date object, a time in milliseconds from 1970 or a date formatted in as string.
 * @param {Date | number | string} dateMax - The maximum date of the time period to show in the graph; it can be a Date object, a time in milliseconds from 1970 or a date formatted in as string.
 * @param {string} format - The format used to parse min and max dates if they are string (optional).
 * @param {string} delimiter - The delimiter used by the date format. Example: format="dd/mm/yyyy" and delimiter="/".
 */
function C3Chart(selector, bcc, seriesData, alabel, regions, size, dateMin, dateMax, format, delimiter) {
    this.bcc = bcc;
    this.c3 = C3Chart.prototype.c3;
    if(typeof this.c3 == 'undefined'){
        this.c3 = window.c3;
    }
    if (typeof this.c3 != 'undefined') {
        this.c3Chart = this.c3.generate({
            bindto: selector,
            data: {
                x: 'x',
                xFormat: "%d/%m/%Y",
                columns: seriesData
            },
            size: size,
            grid: {
                x: {
                    lines: alabel
                }
            },
            axis: {
                x: {
                    type: 'timeseries',
                    tick: {
                        fit: true,
                        format: '%m-%Y',
                        culling: {max:(toDate(dateMax, format, delimiter).getFullYear()-toDate(dateMin, format, delimiter).getFullYear()+1)/2}
                    },
                    min: toDate(dateMin, format, delimiter),
                    max: toDate(dateMax, format, delimiter)
                },
                y: {
                    tick: {
                        format: d3.format('.0f')
                    }
                }
            },
            regions: regions,
            legend: {
                item: {
                    onclick: function (id) {
                        return false;
                    }
                }
            },
            tooltip: {
                format: {
                    title: function (d) { return formatQuarterHtml(d); },
                    value: function (value, ratio, id) { return value.toFixed(5);}
                }
            },
            color: {
                pattern: ['#00989A', '#F68B21', '#E34A21', '#3BBFBD', '#7B9522', '#C9CF5C']
            }
        });
        this.c3Chart.ygrids([{
            value: 0
        }]);
        this.localizeNames();
    }
}

/**
 * Set the names of series (countries) in the current language on the graph legends.
 */
C3Chart.prototype.localizeNames = function(){
    var countrycodes = this.bcc.navList.getShownCountries();
    var names = {};
    for(var i=0; i<countrycodes.length; i++){
        names[countrycodes[i]]=$.i18n.t('country:'+countrycodes[i]);
    }
    this.c3Chart.data.names(names);
}

/**
 * Set a new time period for the graph and update the display.
 * @param {Date | number | string} startDate - The minimum date of the time period to show in the graph; it can be a Date object, a time in milliseconds from 1970 or a date formatted in as string.
 * @param {Date | number | string} endDate - The maximum date of the time period to show in the graph; it can be a Date object, a time in milliseconds from 1970 or a date formatted in as string.
 * @param {string} format - The format used to parse min and max dates if they are string (optional).
 * @param {string} delimiter - The delimiter used by the date format. Example: format="dd/mm/yyyy" and delimiter="/".
 */
C3Chart.prototype.setRange = function (startDate, endDate, format, delimiter) {
    var xmin = toDate(startDate, format, delimiter);
    var xmax = toDate(endDate, format, delimiter);
    this.c3Chart.axis.range({
        min: {
            x: xmin
        },
        max : {
            x: xmax
        }
    });
    //this.xAxisTicks(xmin,xmax);
}

/**
 * Generates the dates for the ticks to show on the X axis, depending of the time period.
 * @param {Date | number | string} startDate - The minimum date of the time period to show in the graph; it can be a Date object, a time in milliseconds from 1970 or a date formatted in as string.
 * @param {Date | number | string} endDate - The maximum date of the time period to show in the graph; it can be a Date object, a time in milliseconds from 1970 or a date formatted in as string.
 * @param {string} format - The format used to parse min and max dates if they are string (optional).
 * @param {string} delimiter - The delimiter used by the date format. Example: format="dd/mm/yyyy" and delimiter="/".
 * @return {Date[]} An array of Date objects, tick must be shown on the graph for those dates.
 */
C3Chart.prototype.xAxisTicks = function (startDate, endDate, format, delimiter) {
    var ticks = [];
    var xmin = toDate(startDate, format, delimiter);
    var xmax = toDate(endDate, format, delimiter);
    if(xmin.getTime()!=NaN && xmax.getTime()!=NaN && xmin.getTime()<xmax.getTime()){
        var yearsDiff = Math.abs(xmax - xmin)*1000*60*60*24*365;
        if(yearsDiff>=1){
            var interval=Math.floor(yearsDiff/7);
            ticks.push(xmin);
            var x = new Date(xmin.getTime());
            x.setMonth(0);
            x.setDate(1);
            x.setFullYear(x.getFullYear()+1+interval);
            while(x.getFullYear()<=xmax.getFullYear()-1){
                ticks.push(new Date(x.getTime()));
                x.setFullYear(x.getFullYear()+interval);
            }
            ticks.push(xmax);
        }
    }
    return ticks
}

/**
 * Set the focus on a specific country.
 * @param {string} countryCode - The code of the country to focus on the graph.
 */
C3Chart.prototype.focusCountry = function (countryCode) {
    if (typeof this.c3 != 'undefined') {
        var serie = bcc.dataSetInfo[countryCode].ser2[0];
        this.c3Chart.focus([serie], true);
    }
}

/**
 * Remove the focus for a specific country.
 * @param {string} countryCode - The code of the country to unfocus on the graph.
 */
C3Chart.prototype.unfocusCountry = function (countryCode) {
    if (typeof this.c3 != 'undefined') {
        if (typeof countryCode == 'undefined') {
            this.c3Chart.revert();
        } else {
            var serie = bcc.dataSetInfo[countryCode].ser2[0];
            this.c3Chart.revert([serie]);
        }
    }
}

/**
 * Load a country and show it on the graph.
 * @param {string} countryCode - The code of the country to load.
 */
C3Chart.prototype.loadCountry = function (countryCode) {
    if (typeof this.c3 != 'undefined') {
        var series = [];
        series.push(bcc.dataSetInfo[countryCode].ser2);
        this.c3Chart.load({
            columns: series
        });
        this.c3Chart.regions({});
        this.c3Chart.xgrids({});
        var names = {};
        names[countryCode]=$.i18n.t('country:'+countryCode);
        this.c3Chart.data.names(names);
    }
};

/**
 * Unload a country to stop showing it on the graph.
 * @param {string} countryCode - The code of the country to unload.
 */
C3Chart.prototype.unloadCountry = function (countryCode) {
    if (typeof this.c3 != 'undefined') {
        var data = bcc.dataSetInfo[countryCode];
        this.c3Chart.unload({
            ids: [data.ser2[0]]
        });
    }
};

/**
 * Remove all regions and turning points currently displayed on the graph.
 */
C3Chart.prototype.cleanOverlay = function () {
    if (typeof this.c3 != 'undefined') {
        this.c3Chart.regions({});
        this.c3Chart.xgrids({});
    }
}

/**
 * Draws regions and turning points on the graph.
 * Not usefull for C3js, required for jqChart implementation of the graph.
 */
C3Chart.prototype.drawCanvasOverlay = function () {
    // nothing to do
}

/**
 * Load and show vertical lines (turning points) on the graph for a specific country.
 * @param {string} countyCode - The code of the country.
 */
C3Chart.prototype.loadCountryLines = function (countryCode) {
    if (typeof this.c3 != 'undefined') {
        this.c3Chart.xgrids(bcc.dataSetInfo[countryCode].label);
    }
};

/**
 * Load and show regions (slowdown and recession periods) on the graph for a specific country.
 * @param {string} countyCode - The code of the country.
 */
C3Chart.prototype.loadCountryRegions = function (countryCode, noGrids) {
    if (typeof this.c3 != 'undefined') {
        var regions = bcc.getRegions(countryCode);

        //chart.c3Chart.regions([]);
        if (!noGrids) {
            this.loadCountryLines(countryCode);
        }
        this.c3Chart.regions([]);

        var newRegions = regions;
        if (typeof this.regionsTimeout != 'undefined') {
            clearTimeout(this.regionsTimeout);
        }

        this.regionsTimeout = setTimeout(function () {
            this.c3Chart.regions(newRegions);
        }.bind(this), 700);
    }
};

/**
 * Removes regions from the graph.
 * @param {boolean} cleargrids - If set to true, vertical lines (turning points) will also be cleared.
 */
C3Chart.prototype.clearRegions = function (cleargrids) {
    if (typeof this.c3 != 'undefined') {
        this.c3Chart.regions([]);
        if (!!cleargrids) {
            this.c3Chart.xgrids([]);
        }
    }
};

/**
 * Select (highlight) a data point on the graph for all series.
 * @param {number} pointIndex - the index of the point to select.
 */
C3Chart.prototype.selectPointAllSeries = function (pointIndex) {
    if (typeof this.c3 != 'undefined') {
        this.c3Chart.select(undefined, [pointIndex], true, true);
    }
};

/**
 * Select (highlight) a data point on the graph.
 * @param serie - The serie. Optional, if not set the point will be select on all series.
 * @param {number} pointIndex - The index of the point to select.
 * @param {boolean} clearSelection - If set to true, every other point currently selected will be unselected.
 */
C3Chart.prototype.selectPoint = function (serie, pointIndex, clearSelection) {
    if (typeof this.c3 != 'undefined') {
        this.c3Chart.select(serie, pointIndex, clearSelection, true);
    }
};

/**
 * Redraw the graph.
 * Not usefull for C3js, required for jqChart implementation of the graph.
 */
C3Chart.prototype.reDraw = function (clear) {
    // nothing to do
}

if (typeof define === 'function' && define.amd) {
    define("c3Chart", ["c3","bcc_commons"], function(c3) {
        C3Chart.prototype.c3 = c3;
        return C3Chart;
    });
} else if ('undefined' !== typeof exports && 'undefined' !== typeof module) {
    module.exports = C3Chart;
}
