/**
 * jsChart implementation of the linear chart of the BCC.
 * @constructor
 * @param {string} id - ID of the element where to insert the chart.
 * @param {BCC} bcc - The current BCC instance.
 * @param {object} dataSetInfo - Data from the dataSet structured for the BCC.
 * @param {string[]} countries - An array with codes of all the countries that can be shown on the graph.
 * @param {object[][]} series - An array of data series.
 * @param {number} maxSeriesToLoad - The maximum number of series that can be displayed at a time on the graph. Optional, if not set there is no limit.
 * @param {Date} from - The minimum date of the time period to show in the graph; it must be a Date object.
 * @param {Date} to - The maximum date of the time period to show in the graph; it must be a Date object.
 */
function JqChart(id, bcc, dataSetInfo, countries, series, maxSeriesToLoad, from, to) {
    this.bcc = bcc;
    this.dataSetInfo = dataSetInfo;
    if(maxSeriesToLoad==="undefined" || !maxSeriesToLoad || maxSeriesToLoad<=0){
        maxSeriesToLoad = series.length;
    }
    if (typeof $.jqplot != 'undefined') {
        this.cursorTooltipData = null, this.cursorLine = null, this.countryInSeries = [];
        this.countries = countries, this.id = id, this.series = series;
        this.yMin = 0, this.yMax = 0, this.xMin = 0, this.xMax = 0;
        var yMin = 0, yMax = 0, xMin = 0, xMax = 0;
        var varseriesOpt = [];
        for(var i=0; i<maxSeriesToLoad && i<series.length; i++){
            varseriesOpt.push({label: this.countries[i] + '_GDP_GC', show: i===0, showLabel: i===0});
        }
        for (var i = 0; i < this.series.length; i++) {
            for (var j = 0; j < this.series[i].length; j++) {
                if (this.series[i][j].length > 1) {
                    if (this.series[i][j][1] > yMax) {
                        yMax = this.series[i][j][1];
                    }
                    if (this.series[i][j][1] < yMin) {
                        yMin = this.series[i][j][1];
                    }
                    if (this.series[i][j][0] > xMax) {
                        xMax = this.series[i][j][0];
                    }
                    if (this.series[i][j][0] < xMin) {
                        xMin = this.series[i][j][0];
                    }
                }
            }
        }
        this.yMin = Number(yMin.toFixed(2)) - 0.01;
        this.yMax = Number(yMax.toFixed(2)) + 0.01;
        this.xMin = Number(xMin.toFixed(2)) - 0.01;
        this.xMax = Number(xMax.toFixed(2)) + 0.01;
        if(from && from.getTime()>this.xMin){
            this.xMin = from.getTime();
        }
        if(to && to.getTime()<this.xMax){
            this.xMax = to.getTime();
        }
        $.jqplot.config.enablePlugins = true;
        this.countryInSeries.push(this.countries[0]);
        var jqplotSeries = [];
        for(var i=0; i<maxSeriesToLoad && i<series.length; i++){
            jqplotSeries.push(this.series[i]);
        }
        this.jqPlots = $.jqplot(this.id, jqplotSeries, {
            seriesDefaults: {
                lineWidth: 0.5,
                markerRenderer: $.jqplot.MarkerRenderer,
                markerOptions: {
                    size: 5
                },
                selection: {
                    show: true,
                    selectedMarkerOptions: {
                        size: 25,
                        shadow: true,
                        style: 'circle'
                    },
                    onSelect: function (event, seriesIndex, pointIndex, selectedNow) {
                        return false;
                    },
                    onDeselect: function (event, seriesIndex, pointIndex, selectedNow) {
                        return false;
                    }
                }
            },
            series: varseriesOpt,
            axes: {
                xaxis: {
                    min: this.xMin,
                    max: this.xMax,
                    renderer: $.jqplot.DateAxisRenderer,
                    tickOptions: {
                        formatString: '%b&nbsp;%#d',
                        showGridline: false
                    },
                    tickInterval: '3 month',
                    rendererOptions: {
                        tickRenderer: $.jqplot.AxisTickRenderer,
                        tickOptions: {
                            showLabel: true,
                            size: 5,
                            markSize: 10,
                            formatter: function(format, value) {
                                var d = new Date(value);
                                if(d && d.getMonth()>=0 && d.getMonth()<3  && d.getYear()%2===0){
                                    return $.datepicker.formatDate('mm-yy', d);
                                } else {
                                    return '';
                                }
                            }
                        }
                    }
                },
                yaxis: {
                    min: this.yMin,
                    max: this.yMax,
                    tickOptions: {
                        formatString: '%.2f',
                        showGridline: false
                    }
                }
            },
            highlighter: {
                show: true,
                showTooltip: false,
                sizeAdjust: 4
            },
            legend: {
                renderer: $.jqplot.EnhancedLegendRenderer,
                show: true,
                rendererOptions: {
                    numberRows: 1,
                    seriesToggle: false
                },
                location: 's',
                placement: 'outsideGrid'
            },
            grid: {
                background: '#FFFFFF',
                shadow: false,
                drawBorder: false,
                gridLineColor: '#000000'
            },
            canvasOverlay: {
                show: true,
                objects: []
            },
            cursor: {
                show: true,
                showTooltip: true,
                tooltipLocation: 'e',
                tooltipOffset: 26,
                followMouse: true,
                style: 'e-resize'
            }
        });
        $('#' + id).bind('jqplotMouseMove', onMouseMove);
        $('#' + id).bind('jqplotMouseLeave', onMouseLeave);
        this.loadCountryRegions(this.countries[0], false, true);
    }
}

/**
 * Initialize a new linear graph with the jqChart implementation.
 * @param {string} id - ID of the element where to insert the chart.
 * @param {BCC} bcc - The current BCC instance.
 * @param {object} dataSet - The dataSet.
 * @param {object} dataSetInfo - Data from the dataSet structured for the BCC.
 * @param {number} maxSeriesToLoad - The maximum number of series that can be displayed at a time on the graph. Optional, if not set there is no limit.
 * @param {Date} from - The minimum date of the time period to show in the graph; it must be a Date object.
 * @param {Date} to - The maximum date of the time period to show in the graph; it must be a Date object.
 * @return {JqChart} The created instance of JqChart.
 */
function initJqChart(id, bcc, dataSet, dataSetInfo, maxSeriesToLoad, from, to){
    var seriesArray = [];
    var countries = [];
    for(var i=0; i<dataSet.DataSet.Data.length; i++){
        var countryCode= dataSet.DataSet.Data[i].Country["@attributes"].code;
        seriesArray.push(dataSetInfo[countryCode].serie);
        countries.push(countryCode);
    }
    return new JqChart(id, bcc, dataSetInfo, countries, seriesArray, maxSeriesToLoad, from, to);
}

/**
 * NOT IMPLEMENTED
 * Set a new time period for the graph and update the display.
 * @param {Date | number | string} startDate - The minimum date of the time period to show in the graph; it can be a Date object, a time in milliseconds from 1970 or a date formatted in as string.
 * @param {Date | number | string} endDate - The maximum date of the time period to show in the graph; it can be a Date object, a time in milliseconds from 1970 or a date formatted in as string.
 */
JqChart.prototype.setRange = function (startDate, endDate) {
    //TODO
}

/**
 * NOT IMPLEMENTED
 * Set the focus on a specific country.
 * @param {string} countryCode - The code of the country to focus on the graph.
 */
JqChart.prototype.focusCountry = function (countryCode) {
    //TODO
};

/**
 * NOT IMPLEMENTED
 * Remove the focus for a specific country.
 * @param {string} countryCode - The code of the country to unfocus on the graph.
 */
JqChart.prototype.unfocusCountry = function (countryCode) {
    //TODO
};

/**
 * Load a country and show it on the graph.
 * @param {string} countryCode - The code of the country to load.
 * @param {number} clockIndex - The index of the clock/country in the navlist.
 * @param {boolean} redraw - If set to true, the graph will be redraw immediatly after. With jqChart any modification on the graph need a redraw to be displayed.
 */
JqChart.prototype.loadCountry = function (countryCode, clockIndex, redraw) {
    if (typeof $.jqplot != 'undefined') {
        index = $.inArray(countryCode, this.countries);
        if (index >= 0 && clockIndex >= 0 /*&& clockIndex < this.jqPlots.data.length*/) {
            
            var countryShownIn = this.isShownCountry(countryCode);
            var mustShow = countryShownIn===false || countryShownIn===clockIndex;
            var prevLabel = this.jqPlots.series[clockIndex].label;
            this.jqPlots.data[clockIndex]=this.series[index];
            this.jqPlots.series[clockIndex].data=this.series[index];
            this.jqPlots.series[clockIndex].label=countryCode + '_GDP_GC';
            this.jqPlots.options.series[clockIndex].label=countryCode + '_GDP_GC';
            this.jqPlots.series[clockIndex].show = mustShow;
            this.jqPlots.series[clockIndex].showLabel = mustShow;
            this.jqPlots.options.series[clockIndex].show=mustShow;
            this.jqPlots.options.series[clockIndex].showLabel=mustShow;
            this.showCountryWithLabel(prevLabel);
            this.loadCountryRegions(countryCode, false, redraw);
            if (redraw) {
                this.jqPlots.drawSeries({}, clockIndex);
            }
        }
    }
};

/**
 * Unload a country to stop showing it on the graph.
 * @param {string} countryCode - The code of the country to unload.
 * @param {boolean} redraw - If set to true, the graph will be redraw immediatly after. With jqChart any modification on the graph need a redraw to be displayed.
 */
JqChart.prototype.unloadCountry = function (countryCode, redraw) {
    if (typeof $.jqplot != 'undefined') {
        var serieIndex = $.inArray(countryCode, this.countryInSeries);
        if(serieIndex>=0){
            this.countryInSeries = this.countryInSeries.splice(serieIndex, 1);
            this.jqPlots.data = this.jqPlots.data.splice(serieIndex, 1);
            this.jqPlots.options.series = this.jqPlots.options.series.splice(serieIndex, 1);
            if (redraw) {
                this.jqPlots.drawSeries({});
            }
        }
    }
};

/**
 * Load and show vertical lines (turning points) on the graph for a specific country.
 * @param {string} countyCode - The code of the country.
 * @param {boolean} redraw - If set to true, the graph will be redraw immediatly after. With jqChart any modification on the graph need a redraw to be displayed.
 */
JqChart.prototype.loadCountryLines = function (countryCode, redraw) {
    if (typeof $.jqplot != 'undefined') {
        var lines = this.dataSetInfo[countryCode].label;
        for (var i = 0; i < lines.length; i++) {
            this.setVerticalLine(toDate(lines[i].value).getTime(), null, lines[i].text);
        }
        if (redraw) {
            this.drawCanvasOverlay();
        }
    }
};

/**
 * Set a vertical line on the graph (turning point).
 * @param {number} position - The position of the vertical line on the x axis.
 * @param {string} name - The name of the vertical line.
 * @param {string} label - The label of the vertical line (turning point).
 * @param {boolean} redraw - If set to true, the graph will be redraw immediatly after. With jqChart any modification on the graph need a redraw to be displayed.
 */
JqChart.prototype.setVerticalLine = function (position, name, label, redraw) {
    if (typeof $.jqplot != 'undefined') {
        var vertLine = name ? this.jqPlots.plugins.canvasOverlay.getObject(name) : null;
        if (vertLine) {
            this.jqPlots.plugins.canvasOverlay.getObject(name).options.x = position;
        } else {
            this.jqPlots.plugins.canvasOverlay.addVerticalLine({
                name: name,
                x: position,
                lineWidth: 1,
                color: 'rgba(80, 80, 80,0.5)',
                shadow: false,
                showLabel: (typeof label != 'undefined' && label),
                label: label,
                labelLocation: 's',
                labelAnchor: 'end',
                labelOffset: 10,
                labelOffsetX: -8,
                labelOffsetY: 15
            });
        }
        if (redraw) {
            this.drawCanvasOverlay();
        }
    }
};

/**
 * Load and show regions (slowdown and recession periods) on the graph for a specific country.
 * @param {string} countyCode - The code of the country.
 * @param {boolean} noGrids - If set to true, only regions are loaded, no vertical lines.
 * @param {boolean} redraw - If set to true, the graph will be redraw immediatly after. With jqChart any modification on the graph need a redraw to be displayed.
 */
JqChart.prototype.loadCountryRegions = function (countryCode, noGrids, redraw) {
    if (typeof $.jqplot != 'undefined') {
        this.clearRegions();
        var regions = bcc.getRegions(countryCode);
        var crise2Regions = [];
        for(var i=0; i<regions.length; i++){
            var region = regions[i];
            if(region.start && region.end){
                var start = region.start?toDate(region.start):this.xMin;
                var end = region.end?toDate(region.end):this.xMax;
                if(region.class == "crise2"){
                    crise2Regions.push({color:'#C7E0F1',start:new Date(start.getTime()),end:new Date(end.getTime())});
                } else {
                    this.addRegion(start, end, '#DCE9F5');
                }
            }
        }
        for(var i=0; i<crise2Regions.length; i++){
            this.addRegion(crise2Regions[i].start, crise2Regions[i].end, crise2Regions[i].color);
        }
        if(!noGrids){
            this.loadCountryLines(countryCode);
        }
        if (redraw) {
            this.drawCanvasOverlay();
        }
    }
};

/**
 * Adds a region on the graph.
 * @param {number} startPoint - The starting position of the region on the x axis.
 * @param {number} stopPoint - The ending position of the region on the x axis.
 * @param {string} color - The color of the region, ad hexadicimal code (example: '#EEE9F5').
 * @param {string} name - The name of the region.
 * @param {boolean} redraw - If set to true, the graph will be redraw immediatly after. With jqChart any modification on the graph need a redraw to be displayed.
 */
JqChart.prototype.addRegion = function (startPoint, stopPoint, color, name, redraw) {
    if (typeof $.jqplot != 'undefined') {
        this.jqPlots.plugins.canvasOverlay.addRectangle({
            xmin: startPoint,
            xmax: stopPoint,
            xminOffset: "0px", xmaxOffset: "0px", yminOffset: "2px", ymaxOffset: "2px",
            color: color, 
            shadow: false,
            showTooltip: false,
            name: name,
        });
        if (redraw) {
            this.drawCanvasOverlay();
        }
    }
};

/**
 * Removes regions from the graph.
 * @param {boolean} redraw - If set to true, the graph will be redraw immediatly after. With jqChart any modification on the graph need a redraw to be displayed.
 */
JqChart.prototype.clearRegions = function (redraw) {
    if (typeof $.jqplot != 'undefined') {
        this.cleanOverlay(redraw);
    }
};

/**
 * Remove all regions and turning points currently displayed on the graph.
 * @param {boolean} redraw - If set to true, the graph will be redraw immediatly after. With jqChart any modification on the graph need a redraw to be displayed.
 */
JqChart.prototype.cleanOverlay = function (redraw) {
    if (typeof $.jqplot != 'undefined') {
        this.jqPlots.plugins.canvasOverlay.clear(this.jqPlots);
        this.jqPlots.plugins.canvasOverlay.objects = [];
        this.jqPlots.plugins.canvasOverlay.objectNames = [];
        if (redraw) {
            this.drawCanvasOverlay();
        }
    }
};

/**
 * Select (highlight) a data point on the graph for all series.
 * @param {number} pointIndex - the index of the point to select.
 */
JqChart.prototype.selectPointAllSeries = function (pointIndex) {
    if (typeof $.jqplot != 'undefined') {
        var selected = false;
        for (var i = 0; i < this.jqPlots.series.length; i++) {
            this.jqPlots.series[i].selection.selectedPoints = [];
            if (this.jqPlots.series[i].data.length > pointIndex) {
                this.jqPlots.togglePoint(i, pointIndex, true);
                selected = true;
            }
        }
        return selected;
    }
};

/**
 * NOT IMPLEMENTED, ACT AS PROXY TO selectPointAllSeries(pointIndex).
 * Select (highlight) a data point on the graph.
 * @param serie - The serie. Optional, if not set the point will be select on all series.
 * @param {number} pointIndex - The index of the point to select.
 * @param {boolean} clearSelection - If set to true, every other point currently selected will be unselected.
 */
JqChart.prototype.selectPoint = function (serie, pointIndex, clearSelection) {
    if (typeof $.jqplot != 'undefined') {
        //TODO
        this.selectPointAllSeries(pointIndex);
    }
};




/**
 * Function call when the mouse moves on the graph, to handle the display of current values.
 */
function onMouseMove(ev, gridpos, datapos, neighbor, data) {
    var nearestBelow, nearestUpper;
    if (data.series.length > 0) {
        for (var i = 0; i < data.series[0].data.length; i++) {
            if (data.series[0].data[i].length > 0) {
                if ((data.series[0].data[i][0] < datapos.xaxis) && (!nearestBelow || data.series[0].data[i][0] > nearestBelow)) {
                    nearestBelow = data.series[0].data[i][0];
                }
                if ((data.series[0].data[i][0] > datapos.xaxis) && (!nearestUpper || data.series[0].data[i][0] < nearestUpper)) {
                    nearestUpper = data.series[0].data[i][0];
                }
            }
        }
        var closest = datapos.xaxis - nearestBelow < nearestUpper - datapos.xaxis ? nearestBelow : nearestUpper;
        if (closest != this.cursorLine || !this.cursorTooltipData) {
            this.cursorLine = closest;
            //chart.setVerticalLine(closest, 'cursorLine', null, true);
            var trs = '';
            for (var i = 0; i < data.series.length; i++) {
                if (data.series[i].show) {
                    var name = data.series[i].label;
                    var color = data.series[i].color;
                    var value;
                    for (var j = 0; j < data.series[i].data.length; j++) {
                        if (data.series[i].data[j].length > 1 && data.series[i].data[j][0] == closest) {
                            value = data.series[i].data[j][1];
                        }
                    }
                    trs = trs
                            + '	<tr class="tooltip-name-' + name + '">'
                            + '		<td class="name">'
                            + '			<span style="background-color:' + color + '"/>' + name + '</td>'
                            + '		<td class="value">' + value + '</td>'
                            + '	</tr>';
                }
            }
            this.cursorTooltipData = trs;
        }
        $('#' + chart.id + ' .jqplot-cursor-tooltip').html(
                '<table class="tooltip">'
                + '<tbody>'
                + '	<tr>'
                + '		<th colspan="2">' + $.datepicker.formatDate("dd/mm/yy", new Date(closest)) + '</th>'
                + '	</tr>'
                + this.cursorTooltipData
                + '</tbody>'
                + '</table>'
                );
    }
}
/**
 * Function call when the mouse leaves the graph, to handle the display of current values.
 */
function onMouseLeave(ev, gridpos, datapos, neighbor, data) {
    chart.cursorLine = null;
    chart.cursorTooltipData = null;
    chart.removeOverlayByName('cursorLine', true);
}
/**
 * Tells if a specific country is currently shown on the graph.
 * @param {string} country - The code of the country.
 * @return {boolean} True if the country is currently shown on the graph; else false.
 */
JqChart.prototype.isShownCountry = function (country) {
    if (typeof $.jqplot != 'undefined') {
        for(var i=0; i<this.jqPlots.series.length; i++){
            if(this.jqPlots.series[i].show && this.jqPlots.series[i].label == country + '_GDP_GC'){
                return i;
            }
        }
        return false;
    }
};
/**
 * Show the country with a specific label.
 * @param {string} label - A country label; the country with this label will be shown on the graph.
 */
JqChart.prototype.showCountryWithLabel = function (label) {
    if (typeof $.jqplot != 'undefined') {
        for(var i=0; i<this.jqPlots.series.length; i++){
            if(!this.jqPlots.series[i].show && this.jqPlots.series[i].label == label){
                this.jqPlots.series[i].show = true;
                return i;
            }
        }
    }
};
/**
 * Redraw the graph.
 * With jqChart any modification on the graph need a redraw to be displayed.
 * @param {boolean} clear - If set to true, drawing canvas will be cleared befor redraw; it is recommended for most cases.
 */
JqChart.prototype.reDraw = function (clear) {
    if (typeof $.jqplot != 'undefined') {
        this.jqPlots.redraw(clear);
    }
};
/**
 * Remove an overlay element (vertical line or region) by name.
 * @param {string} name - The name of the element to remove.
 * @param {boolean} redraw - If set to true, the graph will be redraw immediatly after. With jqChart any modification on the graph need a redraw to be displayed.
 */
JqChart.prototype.removeOverlayByName = function (name, redraw) {
    if (typeof $.jqplot != 'undefined') {
        this.jqPlots.plugins.canvasOverlay.removeObject(name);
        if (redraw) {
            this.drawCanvasOverlay();
        }
    }
};
/**
 * Draw the canvas with overlay elements (regions and vertical lines).
 */
JqChart.prototype.drawCanvasOverlay = function () {
    if (typeof $.jqplot != 'undefined') {
        $(".jqplot-canvasOverlay-label").remove();
        this.jqPlots.plugins.canvasOverlay.draw(this.jqPlots);
    }
};
/**
 * Drw the series on the graph.
 */
JqChart.prototype.drawSeries = function () {
    if (typeof $.jqplot != 'undefined') {
        this.jqPlots.drawSeries({});
    }
};

/**
 * Creates and return a single canvas (image) with the current state of the graph.
 * @param {string} backgroundColor - The color to set at the background of the canvas (hexadecimal code, example: '#E8FD68').
 * @return {Canvas} A single canvas that show the whole graph.
 */
JqChart.prototype.getSingleCanvas = function (backgroundColor) {
    if (typeof $.jqplot != 'undefined') {
        var gridCanvas = $('#'+this.id+' canvas.jqplot-grid-canvas');
        var overlayCanvas = $('#'+this.id+' canvas.jqplot-overlayCanvas-canvas');
        var seriesCanvas = $('#'+this.id+' canvas.jqplot-series-canvas');

        var jqPlotBaseCanvas = $('#'+this.id+' canvas.jqplot-base-canvas');

        var canvas = document.createElement('canvas');
        canvas.height=jqPlotBaseCanvas.attr('height');
        canvas.width=jqPlotBaseCanvas.attr('width');
        
        var context=canvas.getContext("2d");
        
        //set background
        if(!!backgroundColor){
            context.fillStyle = backgroundColor;
            context.fillRect(0,0,canvas.width,canvas.height);
        }
        context.fillStyle = "#000000";

        context.drawImage(gridCanvas[0],0,0);
        var topProp = overlayCanvas.css('top').replace(/[^\d.-]/g, '');
        var leftProp = overlayCanvas.css('left').replace(/[^\d.-]/g, '');
        context.drawImage(overlayCanvas[0],leftProp,topProp);
        for(var i=0; i<seriesCanvas.length; i++){
            context.drawImage(seriesCanvas[i],leftProp,topProp);
        }
        
        this.addXTickLabelsOnCanvas(context, parseInt(topProp)+overlayCanvas.height()+20, 0);
        this.addYTickLabelsOnCanvas(context, 0, 9);
        this.addCanvasOverlayLabels(context, 5, -5);
        
        return canvas;
    }
};

/**
 * Adds labels on the canvas for overlay elements (turning points)
 */
JqChart.prototype.addCanvasOverlayLabels = function (context, xOffset, yOffset) {
    var labelDivs = $("#"+this.id+" .jqplot-canvasOverlay-label");

    for(var i=0; i<labelDivs.length; i++){
        var labelDiv = $(labelDivs[i]);
        var label = labelDiv.text();
        var x = labelDiv[0].offsetLeft+(labelDiv[0].offsetWidth/2);
        var y = labelDiv[0].offsetTop;
        context.save();
        context.textAlign = 'right';
        context.translate(x, y);
        context.rotate(-Math.PI/2);
        context.fillText(label,-yOffset,xOffset);
        context.restore();
    }
};

/**
 * Adds labels for ticks on X axis on the canvas.
 */
JqChart.prototype.addXTickLabelsOnCanvas = function (context, y, xOffset) {
    for(var i=0; i<this.jqPlots.axes.xaxis._ticks.length; i++){
        var xtick = this.jqPlots.axes.xaxis._ticks[i];
        if(xtick.label && xtick.label.length>0){
            var x = xtick._elem[0].offsetLeft;
            context.fillText(xtick.label,x+xOffset,y);
        }
    }
};


/**
 * Adds labels for ticks on Y axis on the canvas.
 */
JqChart.prototype.addYTickLabelsOnCanvas = function (context, x, yOffset) {
    for(var i=0; i<this.jqPlots.axes.yaxis._ticks.length; i++){
        var ytick = this.jqPlots.axes.yaxis._ticks[i];
        if(ytick.label && ytick.label.length>0){
            var y = ytick._elem[0].offsetTop;
            context.fillText(ytick.label,x,y+yOffset);
        }
    }
};

if (typeof define === 'function' && define.amd) {
    define("jqChart", ['jquery','jqplot-with-modules'], function($,jqPlot) {
        return JqChart;
    });
} else if ('undefined' !== typeof exports && 'undefined' !== typeof module) {
    module.exports = JqChart;
}
