/**
 * Suvorov Roman windj007@gmail.com (c) 2012
 * 
 */
(function($) {
	/**
	 * Constructor of class Selection.
	 * An instance of this class is added to every series object.
	 * It stores all the settings for selection points that belongs to the series.
	 *  
	 * @returns {$.jqplot.Selection}
	 */
    $.jqplot.Selection = function() {

    	// whether to enable data points' selection
        this.show = $.jqplot.config.enablePlugins;

        // renderer to use for drawing selection
        // commonly it must not be changed
        // (to say truth I suppose that it isn't needed at all)
        this.renderer = new $.jqplot.LineRenderer();
        this.rendererOptions = {
                showLine : false,
                showMarker : true
            };

        // renderer to use for drawing selected data points
        this.markerRenderer = new $.jqplot.MarkerRenderer();
        // default parameters for drawing selected data points
        this.selectedMarkerOptions = {
                size: 15
        };

        // indices of selected points in series.data array
        this.selectedPoints = [];

        // reference to a function (event handler) that is called when a point is going to be selected
        this.onSelect = null;
        // reference to a function (event handler) that is called when a point is going to be deselected 
        this.onDeselect = null;
        // reference to a function (event handler) that is called when a point is selected
        this.onSelected = null;
        // reference to a function (event handler) that is called when a point is deselected 
        this.onDeselected = null;
    };
    
    $.jqplot.postSeriesInitHooks.push(parseSelectionOptions);
    $.jqplot.postDrawSeriesHooks.push(drawSelection);
    $.jqplot.postInitHooks.push(subscribeEvents);
    
    // called within scope of a series
    function parseSelectionOptions (target, data, seriesDefaults, options, plot) {
        this.selection = new $.jqplot.Selection();
        options = options || {};
        $.extend(true, this.selection,
        		{ selectedMarkerOptions: options.markerOptions },
        		{ selectedMarkerOptions: { color : this.color } },
        		seriesDefaults.selection,
                options.selection);
        this.selection.renderer.init.call(this.selection, null); // maybe it's enough for us to use markerRenderer only?
        this.selection.markerRenderer.init.call(this.selection.markerRenderer, this.selection.selectedMarkerOptions);
    }
    
    // called within scope of series object
    function drawSelection(sctx, options) {
        // if we have options, merge trendline options in with precedence
        options = $.extend(true, {}, this.selection, options);

        if (options.show && this.show) {
            var data = this.data;
            var points = $.map(options.selectedPoints, function (idx) { return [data[idx]]; }); // map indices to points
            var gridData = this.renderer.makeGridData.call(this, points);
            this.selection.renderer.draw.call(this.selection, sctx, gridData, {});
        }
    }
    
    // called within scope of plot object
    function subscribeEvents(plot, data, options) {
        this.target.bind('jqplotDataClick', $.proxy(onPointClick, this));
        // add to jqplot object methods for selection
        this.togglePoint = $.proxy(togglePoint, this);
        this.togglePointSilently = $.proxy(togglePointSilently, this);
    }
    
    // called within scope of plot object
    function onPointClick(ev, seriesIndex, pointIndex, data) {
        this.togglePoint(seriesIndex, pointIndex);
    }

    // called within scope of plot object
    // triggers events
    // returns new state of point (true means point is selected)
    function togglePoint(seriesIndex, pointIndex, force) {
    	var series = this.series[seriesIndex];
        if (!series.selection || !series.selection.show)
            return false;
        
        var selectedNow = isSelected(seriesIndex, pointIndex);
        var args = [seriesIndex, pointIndex, selectedNow];
        if (!selectedNow) { // the point is selected now
            if (series.selection.onSelect)
                if(!series.selection.onSelect.apply(this, args) && !force){
                	return selectedNow;
                }
        } else {
            if (series.selection.onDeselect)
                if(!series.selection.onDeselect.apply(this, args) && !force){
                	return selectedNow;
                }
        }
        
    	selectedNow = togglePointImpl.call(this, seriesIndex, pointIndex);
    	args = [seriesIndex, pointIndex, selectedNow];
    	
        if (selectedNow) { // the point is selected now
            if (series.selection.onSelected)
                series.selection.onSelected.apply(this, args);
            this.target.trigger('jqplotPointSelected', args);
            return true;
        } else {
        	var args = [seriesIndex, pointIndex, false];
            if (series.selection.onDeselected)
                series.selection.onDeselected.apply(this, args);
            this.target.trigger('jqplotPointDeselected', args);
            return false;
        }
    }
    
    // called within scope of plot object
    // does not trigger events
    // returns new state of point (true means point is selected)
    function togglePointSilently(seriesIndex, pointIndex) {
        var series = this.series[seriesIndex];
        if (!series.selection || !series.selection.show)
            return false;
        
        return togglePointImpl.call(this, seriesIndex, pointIndex);
    }
    
    // called within scope of plot object
    // internal version without any checks
    // returns new state of point (true means point is selected)
    function togglePointImpl(seriesIndex, pointIndex) {
    	var series = this.series[seriesIndex];
//    	var found_idx = series.selection.selectedPoints.indexOf(pointIndex);
    	var found_idx = $.inArray(pointIndex, series.selection.selectedPoints);
        
        if (found_idx == -1) { // has not been selected before
            series.selection.selectedPoints.push(pointIndex);
            this.drawSeries({}, seriesIndex);
            return true;
        } else {
            series.selection.selectedPoints.splice(found_idx, 1);
            this.drawSeries({}, seriesIndex);
            return false;
        }
    }
    
    function isSelected(seriesIndex, pointIndex) {
    	if(series && this.series.length>seriesIndex){
    		var series = this.series[seriesIndex];
        	var found_idx = $.inArray(pointIndex, series.selection.selectedPoints);
        	return found_idx >= 0;
    	}
    	return false;
    }

})(jQuery);