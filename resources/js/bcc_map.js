if (typeof define === 'function' && define.amd) {
    define("bcc_map", ['jquery', 'd3', 'leaflet', 'bcc_commons','cycleClock','timer','jquery-ui','datepicker-de','datepicker-fr','monthPicker'], function($, d3, L) {
        window.L=L;
        return BCCMapApp;
    });
} else if ('undefined' !== typeof exports && 'undefined' !== typeof module) {
    module.exports = BCCMapApp;
}

/**
 * It represents the map view of the BCC webapp.
 * @Constructor
 * @param {object} dataset - The dataSet contains all the data from the xml data file.
 * @param {dataSetInfo} dataSetInfo - Data structured for the BCC based on the dataSet.
 * @param {string | object | DOMelement} mapSelector - jQuery style selector or jQuery or DOM object to the element where the map must be inserted.
 * @param {string | object | DOMelement} monthPickerSelector - jQuery style selector or jQuery or DOM object to the element where the month selector must be inserted.
 * @param {string | object | DOMelement} currentMonthSelector - jQuery style selector or jQuery or DOM object to the element where the current month is diplayed.
 * @param {string | object | DOMelement} eaClockSelector - jQuery style selector or jQuery or DOM object to the element where the EA clock must be inserted.
 * @param {string | object | DOMelement} playerSelector - jQuery style selector or jQuery or DOM object to the element where the player (play and pause buttons) must be inserted.
 */
function BCCMapApp(dataset, dataSetInfo, mapSelector, monthPickerSelector, currentMonthSelector, eaClockSelector, playerSelector) {
    var countryCode = dataset.DataSet.Data[0].Country['@attributes'].code;
    var lastIndex = dataSetInfo[countryCode].date.length-1;

    if ( isNaN(dataSetInfo[countryCode].angle[lastIndex]) ) {
        for (var i = lastIndex; i > 0; i-- ) {
            if ( !isNaN(dataSetInfo[countryCode].angle[i]) ) {
                lastIndex = i;
                break;
            }
        }
    }

    var minDate =  dataSetInfo[countryCode].date[0];
    var maxDate = dataSetInfo[countryCode].date[lastIndex];
    this.selectedDate = maxDate;
    this.bccmap = new BCCMap(mapSelector, dataSetInfo, this.selectedDate);
    this.initEAClock(eaClockSelector);
    this.bccMapControls = new BCCMapControls(this.bccmap, this.eaClock, monthPickerSelector, currentMonthSelector, playerSelector, dataSetInfo, maxDate, minDate, 'dd/mm/yyyy', '/');
    $.datepicker.setDefaults($.datepicker.regional[$.i18n.language.substr(0,2)]);
    $(document.body).localize();
}

/**
 * Initialize the clock for Euro Area.
 * @param {string | object | DOMelement} eaClockSelector - jQuery style selector or jQuery or DOM object to the element where the EA clock must be inserted.
 */
BCCMapApp.prototype.initEAClock = function(eaClockSelector) {
    this.eaClock = new CycleClock(eaClockSelector,{
        width: 210,
        height: 200,
        radius: 70,
        crise1Color: "#FAA61A",
        crise1MirrorColor: "#FEDEB3",
        crise2Color: "#F26522",
        crise2MirrorColor: "#F89F6C",
        noCriseColor: "#8BD1D1",
        noCriseMirrorColor: "#3BBFBD",
    });
}

/**
 * Jump to next month.
 */
BCCMapApp.prototype.nextMonth = function() {
    this.bccMapControls.nextMonth();
}

/**
 * Jump to previous month.
 */
BCCMapApp.prototype.prevMonth = function() {
    this.bccMapControls.prevMonth();
}

/**
 * Jump to a specific date.
 * @param {Date} date - The date to go to.
 */
BCCMapApp.prototype.setDate = function(date) {
    this.bccMapControls.setDate(date);
}

/**
 * Represents the map of th map view.
 * @constructor
 * @param {string | object | DOMelement} selector - jQuery style selector or jQuery or DOM object to the element where the map must be inserted.
 * @param {dataSetInfo} dataSetInfo - Data structured for the BCC based on the dataSet.
 * @param {Date | number | string} selectedDate - The date displayed initially (Date object, milliseconds from 1970 or a string with a date).
 * @param {string} dateFormat - The format pattern for a date in a string (only basic pattern: 'dd' for days, 'mm' for month and 'yyyy' for 4 digits years).
 * @param {string} delimiter - The delimiter used by the pattern for a string date (Example: format='dd/mm/yyyy' and delimiter='/').
 */
function BCCMap(selector, dataSetInfo, selectedDate, dateFormat, delimiter) {
    this.geojsonLayer=null;
    this.selectedDate = toDate(selectedDate, dateFormat, delimiter);
    this.dataSetInfo = dataSetInfo;
    this.map = $(selector);
    this.initLeaflet(selector,'resources/map/CNTR_RG_10M_2014_CLIP_EU.geojson');
}

/**
 * Initializes the leaflet map.
 * @param {string | object | DOMelement} selector - jQuery style selector or jQuery or DOM object to the element where the map must be inserted.
 * @param {string} mapFile - Name and path of the geojson file on the server with geographical data for the map, it will be loaded with ajax.
 */
BCCMap.prototype.initLeaflet = function (selector, mapFile){
    var mapId = $(selector).attr('id');
    this.leafletMap = L.map(mapId,{
        center:L.latLng(53.008939, 12.389892),
        zoom:4.3,
        minZoom:4,
        maxZoom:10,
        maxBounds:
            [[34.274, -24.511],
                [71.746, 45.099]],
        attributionControl:false,
        zoomControl: false
    });
    L.control.zoom({position:'bottomleft'}).addTo(this.leafletMap);
    var legend = L.control({position: 'topleft'});
    legend.onAdd = function (map) {
        var legenddiv = L.DomUtil.create('div', 'info_legend');
        var colors = [
            "#3BBFBD",
            "#8BD1D1",
            "#FAA61A",
            "#F26522",
            "#F89F6C",
            "#FEDEB3",
            "#7F7F7F",
            "#E5E5E5"];
        var borders = ['solid 1px black','solid 1px black','solid 1px black','solid 1px black','solid 1px black','solid 1px black','solid 1px black','none'];
        var i18nLabelKeys = [
            'expansion',
            'deceleration',
            'slowdown',
            'recession',
            'recession2',
            'recovery',
            'no_data',
            'out_BCC_coverage'];
        var labels = [$.i18n.t('expansion'),$.i18n.t('deceleration'),$.i18n.t('slowdown'),$.i18n.t('recession'),$.i18n.t('recession2'),$.i18n.t('recovery'),$.i18n.t('no_data'),$.i18n.t('out_BCC_coverage')];
        for (var i = 0; i < colors.length; i++) {
            legenddiv.innerHTML += '<div><i style="background:'+colors[i]+'; border:'+borders[i]+'"></i><span data-i18n="'+i18nLabelKeys[i]+'">'+labels[i]+'</span></div>'
        }
        return legenddiv;
    }
    legend.addTo(this.leafletMap);
    this.countryInfo = L.control({position:"topright"});
    this.countryInfo.onAdd = function(map){
        this.countryInfoDiv = L.DomUtil.create('div', 'country_info');
        this.setCountryInfo();
        return this.countryInfoDiv;
    }.bind(this);
    this.countryInfo.addTo(this.leafletMap);
    $.getJSON(mapFile)
        .done(function(data) {
            this.geojsonLayer = L.geoJson(data,{
                style: this.styleFeature.bind(this),
                onEachFeature: this.initFeature.bind(this)
            }).addTo(this.leafletMap);
            this.reorderLayers();
        }.bind(this))
        .fail(function() {
            console.log( "error" );
        });
}

/**
 * Set the country information on the dedicated paneld at the top right of the map.
 * @param {object} props - Set of properties for a country. If this is not set, a message will instead be displayed to explaine how to see country information.
 */
BCCMap.prototype.setCountryInfo = function(props){
    var cc
    var hasData = false;
    if(props){
        cc = props.CNTR_ID;
        if(cc=='UK')
            cc='GB';
        if(cc=='EL')
            cc='GR';
        hasData=!!this.dataSetInfo[cc];
    }
    if(this.countryInfoDiv){
        var memberState = (isEUMember(props)?'<span data-i18n="eu_member">'+$.i18n.t('eu_member')+'</span>':
            (isEFTAMember(props)&&isEUCandidate(props)?'<span data-i18n="efta_member">'+$.i18n.t('efta_member')+'</span data-i18n="eu_candidate"><br/><span>'+$.i18n.t('eu_candidate')+'</span>':
                (isEFTAMember(props)?'<span data-i18n="efta_member">'+$.i18n.t('efta_member')+'</span>':
                    (isEUCandidate(props)?'<span data-i18n="eu_candidate">'+$.i18n.t('eu_candidate')+'<span>':'<span data-i18n="out_ES">'+$.i18n.t('out_ES')+'</span>'))));
        if(isEAMember(props)){
            memberState+='<br/><span data-i18n="ea_member">'+$.i18n.t('ea_member')+'</span>';
        }
        this.countryInfoDiv.innerHTML  = '<div id="map_countryClock" style="display:inline-block;"></div><div style="display:inline-block;vertical-align: top;">' +  (props ?
            '<b data-i18n="country:'+cc+'">' + $.i18n.t("country:"+cc) + '</b><br /><span class="ue_member">'+memberState+'</span>'/*<div id="map_countryData">No data available</div>'*/
            : '<span data-i18n="mouse_over_for_data">'+$.i18n.t('mouse_over_for_data')+'</span>')+'</div>';
    }
    if(props && hasData){
        $('#map_countryClock').attr('data-countryCode',cc);
        $('#map_countryData').attr('data-countryCode',cc);
        this.clock = new CycleClock('#map_countryClock',{
            width: 105,
            height: 105,
            radius: 34,
            crise1Color: "#FAA61A",
            crise1MirrorColor: "#FEDEB3",
            crise2Color: "#F26522",
            crise2MirrorColor: "#F89F6C",
            noCriseColor: "#8BD1D1",
            noCriseMirrorColor: "#3BBFBD",
            fontSize: 14,
            innerDist: 8
        });
        this.updateMapCountryClock();
    }
}

/**
 * Function to update the clock of the country overed on map.
 */
BCCMap.prototype.updateMapCountryClock = function(){
    var clock = $('#map_countryClock[data-countryCode]');
    if(this.clock && clock && clock.length>0){
        var cc = clock.attr('data-countryCode');
        var angle = this.getAngleForCountryDate(cc, this.selectedDate);
        if(isValidNumeric(angle)){
            this.clock.updateClock(angle);
        } else {
            this.clock.drawClock();
        }
    }
}

/**
 * It will reorders the countries layers, so non EU nouctries are at the back and BCC covvered ones are on the front, this is required for correct display of borders.
 */
BCCMap.prototype.reorderLayers = function(){
    if(this.geojsonLayer!=null){
        this.geojsonLayer.eachLayer(function (layer) {
            if(isBccCoverage(layer.feature.properties)){
                layer.bringToFront();
            } else if(!isEUMember(layer.feature.properties)){
                layer.bringToBack();
            }
        }.bind(this));
    }
}

/**
 * This function set the country highlight behaviour on map.
 * @param {object} feature - The feature is a leaflet object linked to a country on the map; not used.
 * @param {object} layer - The layer is an object that represents a country on the map.
 */
BCCMap.prototype.initFeature = function(feature, layer) {
    layer.on({
        mouseover: this.highlightFeature.bind(this),
        mouseout: this.resetHighlight.bind(this)
    });
}

/**
 * Reset country style on map after highlight.
 * @param {object} e - The event object.
 */
BCCMap.prototype.resetHighlight = function(e) {
    this.geojsonLayer.resetStyle(e.target);
    if(isBccCoverage(e.target.feature.properties)){
        e.target.bringToFront();
    } else {
        e.target.bringToBack();
    }
    this.setCountryInfo();
}

/**
 * Set country style on map when it highlights.
 * @param {object} e - The event object.
 */
BCCMap.prototype.highlightFeature = function(e) {
    var layer = e.target;
    layer.setStyle({
        weight: 1.5,
        color: '#000000',
        opacity: 0.9
    });
    if (!L.Browser.ie && !L.Browser.opera) {
        layer.bringToFront();
    }
    this.setCountryInfo(layer.feature.properties);
}

/**
 * Set the style of the country on the map, depending on the country, the date (current cyclic situation).
 * @param {object} feature - The feature is a leaflet object linked to a country on the map.
 * @return {object} A set of style properties.
 */
BCCMap.prototype.styleFeature = function (feature){
    return this.getCountryStyle(feature,this.selectedDate);
}

/**
 * Tells if the country is covered by the BCC (EA countries and UK).
 * @param {object} props - Set of properties for a country. If this is not set, a message will instead be displayed to explaine how to see country information.
 * @return {boolean}
 */
function isBccCoverage(props){
    return props && props.CNTR_ID && (isEAMember(props));
}

/**
 * Tells if the country member of the Euro Area.
 * @param {object} props - Set of properties for a country. If this is not set, a message will instead be displayed to explaine how to see country information.
 * @return {boolean}
 */
function isEAMember(props){
    return props && props.CNTR_ID
        && $.inArray(props.CNTR_ID,((typeof eaMembers!='undefined') && eaMembers)?eaMembers:['BE','DE','IE','GR','EL','ES','FR','IT','CY','LU','MT','NL','AT','PT','SI','SK','FI','EE','LV','LT'])>=0;
}

/**
 * Tells if the country member of the European Union.
 * @param {object} props - Set of properties for a country. If this is not set, a message will instead be displayed to explaine how to see country information.
 * @return {boolean}
 */
function isEUMember(props){
    return props && props.EU_TERR && props.EU_TERR=='Y';
}

/**
 * Tells if the country a candidate to adhesion the European Union.
 * @param {object} props - Set of properties for a country. If this is not set, a message will instead be displayed to explaine how to see country information.
 * @return {boolean}
 */
function isEUCandidate(props){
    return props && props.CC_TERR && props.CC_TERR=='Y';
}

/**
 * Tells if the country member of the EFTA.
 * @param {object} props - Set of properties for a country. If this is not set, a message will instead be displayed to explaine how to see country information.
 * @return {boolean}
 */
function isEFTAMember(props){
    return props && props.EFTA_TERR && props.EFTA_TERR=='Y';
}

/**
 * Tells if the country is covered by the Eurostat (EA,EU,EFTA and EU candidates countries).
 * @param {object} props - Set of properties for a country. If this is not set, a message will instead be displayed to explaine how to see country information.
 * @return {boolean}
 */
function isEstatCoverage(props){
    return isEUMember(props) || isEFTAMember(props) || isEUCandidate(props);
}

/**
 * Returns the style to apply to the country on the map, depending the country, if it is covered by the BCC and the date (current cyclic situation).
 * @param {object} feature - The feature is a leaflet object linked to a country on the map.
 * @param {Date | number | string} selectedDate - The date displayed initially (Date object, milliseconds from 1970 or a string with a date).
 * @param {string} dateFormat - The format pattern for a date in a string (only basic pattern: 'dd' for days, 'mm' for month and 'yyyy' for 4 digits years).
 * @param {string} delimiter - The delimiter used by the pattern for a string date (Example: format='dd/mm/yyyy' and delimiter='/').
 * @return {object} A set of style properties.
 */
BCCMap.prototype.getCountryStyle = function (feature, date, dateFormat, delimiter){
    var cc = feature.properties.CNTR_ID.toUpperCase();
    var inEstatCoverage = isBccCoverage(feature.properties);
    if(cc=='UK'){
        cc='GB';
    } else if(cc=='EL'){
        cc='GR';
    }
    var angle = this.getAngleForCountryDate(cc, date, dateFormat, delimiter);
    var fillColor = this.getColorForAngle(angle,inEstatCoverage?"#7F7F7F":"#E5E5E5");
    return {
        fillColor: fillColor,
        weight: 1,
        opacity: inEstatCoverage?0.5:0,
        color: inEstatCoverage?("#555555"):fillColor,
        fillOpacity: 1
    };
}

/**
 * Returns the angle of the clock of a country at a specific date.
 * @param {string} cc - The code of the country.
 * @param {Date | number | string} selectedDate - The date displayed initially (Date object, milliseconds from 1970 or a string with a date).
 * @param {string} dateFormat - The format pattern for a date in a string (only basic pattern: 'dd' for days, 'mm' for month and 'yyyy' for 4 digits years).
 * @param {string} delimiter - The delimiter used by the pattern for a string date (Example: format='dd/mm/yyyy' and delimiter='/').
 * @return {number} The angle.
 */
BCCMap.prototype.getAngleForCountryDate = function (cc, date, dateFormat, delimiter){
    var date = toDate(date,dateFormat,delimiter);
    var index=0;
    if(!this.dataSetInfo[cc]){
        return undefined;
    }
    for(var i=0; i<this.dataSetInfo[cc].date.length; i++){
        var otherDate = stringToDate(this.dataSetInfo[cc].date[i],'dd/mm/yyyy','/')
        if(otherDate.getTime()>=date.getTime()){
            index=i;
            break;
        }
    }
    return this.dataSetInfo[cc].angle[index];
}

/**
 * Returns the data of a country at a specific date.
 * @param {string} cc - The code of the country.
 * @param {Date | number | string} selectedDate - The date displayed initially (Date object, milliseconds from 1970 or a string with a date).
 * @param {string} dateFormat - The format pattern for a date in a string (only basic pattern: 'dd' for days, 'mm' for month and 'yyyy' for 4 digits years).
 * @param {string} delimiter - The delimiter used by the pattern for a string date (Example: format='dd/mm/yyyy' and delimiter='/').
 * @return {object} A set of data for the country (angle, GDP and GDP DC).
 */
BCCMap.prototype.getDataForCountryDate = function (cc, date, dateFormat, delimiter){
    var date = toDate(date,dateFormat,delimiter);
    var index=0;
    if(!this.dataSetInfo[cc]){
        return undefined;
    }
    for(var i=0; i<this.dataSetInfo[cc].date.length; i++){
        var otherDate = stringToDate(this.dataSetInfo[cc].date[i],'dd/mm/yyyy','/')
        if(otherDate.getTime()>=date.getTime()){
            index=i;
            break;
        }
    }
    return {
        angle:this.dataSetInfo[cc].angle[index],
        gdp:this.dataSetInfo[cc].gdp[index/3],
        gdpgc:this.dataSetInfo[cc].gdpgc[index/3]
    };
}

/**
 * Return the color to apply to a country on the map, depending on the current angle for this country (position on the cycle clock).
 * @param {number} angle - The angle that defines the position on the clock.
 * @param {string} defaultColor - A default color that will be return the given angle is not valid.
 * @return {string} A color (html encoded, example "#e6a532") corresponding the the current cyclic situation (recession, slowdown or growth), or the default color if no valid angle value is provided.
 */
BCCMap.prototype.getColorForAngle = function (a, defaultColor){
    var angle = Number(a);
    while(angle > 2*Math.PI){
        angle -= 2*Math.PI;
    }
    while(angle < 0){
        angle += 2*Math.PI;
    }
    if(angle >= 0 && angle <= Math.PI/2){
        return "#8BD1D1";
    } else if(angle > Math.PI/2 && angle <= 3*Math.PI/4){
        return "#FAA61A";
    } else if(angle > 3*Math.PI/4 && angle <= Math.PI){
        return "#F26522";
    } else if(angle > Math.PI && angle <= 5*Math.PI/4){
        return "#F89F6C";
    } else if(angle > 5*Math.PI/4 && angle <= 3*Math.PI/2){
        return "#FEDEB3";
    } else if(angle > 3*Math.PI/2 && angle <= 2*Math.PI){
        return "#3BBFBD";
    } else {
        return defaultColor;
    }


//    if(angle > Math.PI/2 && angle < 3*Math.PI/2) {
//        if(angle > Math.PI/4 && angle < 3*Math.PI/4){
//            return "#d76e2d";
//        } else {
//            return "#e6a532";
//        }
//    } else if (jQuery.isNumeric(angle)){
//        return "#f0cd91";
//    } else {
//        return defaultColor;
//    }
}

/**
 * Set the date linked to the map, it will update the color of the countries on the map depending on the cyclic situation of them at that date.
 * @param {Date | number | string} selectedDate - The date displayed initially (Date object, milliseconds from 1970 or a string with a date).
 * @param {string} dateFormat - The format pattern for a date in a string (only basic pattern: 'dd' for days, 'mm' for month and 'yyyy' for 4 digits years).
 * @param {string} delimiter - The delimiter used by the pattern for a string date (Example: format='dd/mm/yyyy' and delimiter='/').
 */
BCCMap.prototype.setDate = function (date, dateFormat, delimiter){
    this.selectedDate = toDate(date, dateFormat, delimiter);
    if(this.geojsonLayer!=null){
        this.geojsonLayer.eachLayer(function (layer) {
            layer.setStyle(this.styleFeature(layer.feature));
        }.bind(this));
    }
}

/**
 * Represents the control button of the map view (calendar shape to choose a time, next/previous month buttons .. etc); it is all the left part of the screen.
 * @constructor
 * @param {BCCMap} bccMap - The BCCMap object linked.
 * @param {CycleClock} eaClock - The  instance of the clock for EA, visible on the map view.
 * @param {string | object | DOMelement} monthPickerSelector - jQuery style selector or jQuery or DOM object to the element where the month selector must be inserted.
 * @param {string | object | DOMelement} currentMonthSelector - jQuery style selector or jQuery or DOM object to the element where the current month is diplayed.
 * @param {string | object | DOMelement} playerSelector - jQuery style selector or jQuery or DOM object to the element where the player (play and pause buttons) must be inserted.
 * @param {dataSetInfo} dataSetInfo - Data structured for the BCC based on the dataSet.
 * @param {Date | number | string} maxdate - The end date for the animation (Date object, milliseconds from 1970 or a string with a date).
 * @param {Date | number | string} mindate - The start date for the animation (Date object, milliseconds from 1970 or a string with a date).
 * @param {string} dateFormat - The format pattern for a date in a string (only basic pattern: 'dd' for days, 'mm' for month and 'yyyy' for 4 digits years).
 * @param {string} delimiter - The delimiter used by the pattern for a string date (Example: format='dd/mm/yyyy' and delimiter='/').
 */
function BCCMapControls (bccMap, eaClock, monthPickerSelector, currentMonthSelector, playerSelector, dataSetInfo, maxdate, mindate, dateFormat, delimiter) {
    this.bccMap = bccMap;
    this.eaClock = eaClock;
    this.maxDate = toDate(maxdate, dateFormat, delimiter);
    this.minDate = toDate(mindate, dateFormat, delimiter);
    this.monthPicker = $(monthPickerSelector);
    this.currentMonthSelector = currentMonthSelector;
    this.initTimer(playerSelector, dataSetInfo);
    this.initMonthPicker();
    this.onDateChanged = function(date){
        $(this.currentMonthSelector).text($.datepicker.formatDate('M yy', date, $.datepicker.regional[$.i18n.language.substr(0,2)]));
        this.bccMap.setDate(date);
        var dateIndex = $.inArray('01/'+$.datepicker.formatDate('mm/yy', date),this.bccMap.dataSetInfo['EA'].date);
        if(dateIndex>=0){
            var angle = this.bccMap.dataSetInfo['EA'].angle[dateIndex];
            this.eaClock.updateClock(angle);
            this.bccMap.updateMapCountryClock();
        }
        this.timer.timerPos = dateIndex;//date.getMonth()-this.minDate.getMonth()+(12*(date.getYear()-this.minDate.getYear()));
    }.bind(this);
    this.eaClock.drawClock();
    this.setDate(this.maxDate);
}

/**
 * This funtion initializes the timer for the animation of the map.
 * @param {string | object | DOMelement} playerSelector - jQuery style selector or jQuery or DOM object to the element where the player (play and pause buttons) must be inserted.
 * @param {dataSetInfo} dataSetInfo - Data structured for the BCC based on the dataSet.
 */
BCCMapControls.prototype.initTimer = function(playerSelector, dataSetInfo) {
    this.timer = new TimerLoop(this.setPos.bind(this),playerSelector, 0, getMaxClockIndex(dataSetInfo), true, false, true);
}

/**
 * Initializes the month picker (calendar shape onthe left of map view to choose a month).
 */
BCCMapControls.prototype.initMonthPicker = function() {
    this.monthPicker.MonthPicker({
        SelectedMonth: this.maxDate,
        MonthFormat: 'mm/yy',
        MaxMonth: this.maxDate,
        MinMonth: this.minDate,
        OnAfterChooseMonth: function(selecteddate) {
            this.setDate(selecteddate);
        }.bind(this),
        i18n: $.datepicker.regional[$.i18n.language.substr(0,2)]
    });
}

/**
 * Updates the time range (time period), it impacts the animation of the map, and the range of monthes that can be selected in the month picker.
 * @param {number} posMin - The minimum index to use in the list of data for the clocks.
 * @param {number} posMax - The maximum index to use in the list of data for the clocks.
 * @param {Date | number | string} dateFrom - The end date (Date object, milliseconds from 1970 or a string with a date).
 * @param {Date | number | string} dateTo - The start date (Date object, milliseconds from 1970 or a string with a date).
 * @param {string} dateFormat - The format pattern for a date in a string (only basic pattern: 'dd' for days, 'mm' for month and 'yyyy' for 4 digits years).
 * @param {string} delimiter - The delimiter used by the pattern for a string date (Example: format='dd/mm/yyyy' and delimiter='/').
 */
BCCMapControls.prototype.updateRange = function(posMin, posMax, dateFrom, dateTo, format, delimiter) {
    this.minDate = toDate(dateFrom, format ,delimiter);
    this.maxDate = toDate(dateTo, format, delimiter);
    this.timer.maxTimerPos = posMax;
    this.timer.minTimerPos = posMin;
    this.monthPicker.MonthPicker('Destroy');
    this.initMonthPicker();
    if(this.selectedDate.getTime()<this.minDate.getTime()) {
        this.setDate(this.minDate);
    } else if(this.selectedDate.getTime()>this.maxDate.getTime()) {
        this.setDate(this.maxDate);
    } else {
        this.monthPicker.MonthPicker('SetSelectedMonth', this.selectedDate);
    }
}

/**
 * Set the current date to use.
 * @param {Date | number | string} date - The date (Date object, milliseconds from 1970 or a string with a date).
 * @param {string} dateFormat - The format pattern for a date in a string (only basic pattern: 'dd' for days, 'mm' for month and 'yyyy' for 4 digits years).
 * @param {string} delimiter - The delimiter used by the pattern for a string date (Example: format='dd/mm/yyyy' and delimiter='/').
 */
BCCMapControls.prototype.setDate = function (date, dateFormat, delimiter){
    this.selectedDate = toDate(date, dateFormat, delimiter);
    this.onDateChanged(this.selectedDate);
    this.monthPicker.MonthPicker('SetSelectedMonth', date);
};

/**
 * Set the current position to use.
 * @param {number} pos - The position to use.
 */
BCCMapControls.prototype.setPos = function (pos){
    var newMonthDate = toDate(this.minDate);
    newMonthDate.setMonth(newMonthDate.getMonth() + (pos-this.timer.minTimerPos));
    this.setDate(newMonthDate);
}

/**
 * Jump to next month.
 */
BCCMapControls.prototype.nextMonth = function (){
    var nextMonthDate = toDate(this.selectedDate);
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
    if(nextMonthDate.getTime()<=this.maxDate.getTime() && nextMonthDate.getTime()>=this.minDate.getTime()){
        this.monthPicker.val($.datepicker.formatDate('mm/yy',nextMonthDate, $.datepicker.regional[$.i18n.language.substr(0,2)]));
        this.setDate(nextMonthDate);
    }
}

/**
 * Jump to previous month.
 */
BCCMapControls.prototype.prevMonth = function (){
    var nextMonthDate = toDate(this.selectedDate);
    nextMonthDate.setMonth(nextMonthDate.getMonth() - 1);
    if(nextMonthDate.getTime()<=this.maxDate.getTime() && nextMonthDate.getTime()>=this.minDate.getTime()){
        this.monthPicker.val($.datepicker.formatDate('mm/yy',nextMonthDate, $.datepicker.regional[$.i18n.language.substr(0,2)]));
        this.setDate(nextMonthDate);
    }
}