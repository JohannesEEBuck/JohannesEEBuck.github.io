/**
 * This is the object used to generate the PDF report.
 * @constructor
 * @param {BCC} bcc - The BCC instance.
 * @param {object} dataset - The dataSet contains all the data from the xml data file.
 * @param {dataSetInfo} dataSetInfo - Data structured for the BCC based on the dataSet.
 * @param {Date | number | string} from - The end date of the time period for the graph (Date object, milliseconds from 1970 or a string with a date).
 * @param {Date | number | string} to - The start date of the time period for the graph (Date object, milliseconds from 1970 or a string with a date).
 * @param {Date | number | string} clockTime - The date used to display the position on clicks.
 * @param {string} dateFormat - The format pattern for a date in a string (only basic pattern: 'dd' for days, 'mm' for month and 'yyyy' for 4 digits years).
 * @param {string} delimiter - The delimiter used by the pattern for a string date (Example: format='dd/mm/yyyy' and delimiter='/').
 */
function PdfGenerator(bcc, dataset, datasetinfo, from, to, clockTime, format, delimiter){
    this.from = toDate(from, format, delimiter);
    this.to = toDate(to, format, delimiter);
    this.bcc = bcc;
    this.screenPdfSizeFactor = 5;
    this.page = 1;
    this.genDate = new Date();
    this.thetaIndex = undefined;
    if(clockTime && !isNaN(clockTime.getTime())){
        for(i=dataset.DataSet.Data[0].Observations.Observation.length-1; i>=-1; i--){
            for (var theta = dataset.DataSet.Data[0].Observations.Observation[i].Theta.obs.length - 1; theta >= 0; theta-- ) {
                if (i >= 0
                    && dataset.DataSet.Data[0].Observations.Observation[i].Theta.obs.length > 0
                    && !isNaN(dataset.DataSet.Data[0].Observations.Observation[i].Theta.obs[theta]['@attributes'].angle)
                    && toDate(dataset.DataSet.Data[0].Observations.Observation[i].Theta.obs[theta]['@attributes'].date).getTime() <= clockTime.getTime()) {

                    this.thetaIndex = theta;
                    break;
                }
            }

            if ( this.thetaIndex !== undefined) {
                break;
            }
        }
        if(i>=0){
            this.clockObservationIndex = i;
        } else {
            this.clockObservationIndex = dataset.DataSet.Data[0].Observations.Observation.length-1;
            this.thetaIndex = dataset.DataSet.Data[0].Observations.Observation[this.clockObservationIndex].Theta.obs.length-1;
        }
    } else {
        var i;
        for(i=dataset.DataSet.Data[0].Observations.Observation.length-1; i>=-1; i--){
            if(i>=0
                && dataset.DataSet.Data[0].Observations.Observation[i].Theta.obs.length>0
                && !isNaN(dataset.DataSet.Data[0].Observations.Observation[i].Theta.obs[dataset.DataSet.Data[0].Observations.Observation[i].Theta.obs.length-1]['@attributes'].angle)
                && toDate(dataset.DataSet.Data[0].Observations.Observation[i].Theta.obs[dataset.DataSet.Data[0].Observations.Observation[i].Theta.obs.length-1]['@attributes'].date).getTime()>to.getTime()){
                break;
            }
        }
        if(i>=0){
            this.clockObservationIndex = i;
        } else {
            this.clockObservationIndex = dataset.DataSet.Data[0].Observations.Observation.length-1;
        }
    }
    this.clockDate = (clockTime && !isNaN(clockTime.getTime()))?clockTime:dataset.DataSet.Data[0].Observations.Observation[this.clockObservationIndex].Theta.obs[this.thetaIndex]['@attributes'].date;
    this.dataSet = dataset;
    this.dataSetInfo = datasetinfo;
    this.eurostatLogo = "data:image/jpeg;base64,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";
    this.fileName = "bcc_report_"+$.datepicker.formatDate('dd/mm/yy',this.genDate)+".pdf";
}

/**
 * Start the generation and save the generated pdf to the local computer.
 * @param {string[]} countries - Array with codes of countries to include in the report.
 * @param {string} regionCountry - The code of the country for which the regions and turning points will be shown on the graph in the report.
 */
PdfGenerator.prototype.downloadReport = function (countries, regionCountry) {
    var doc = this.generateReport(countries, regionCountry);
    doc.output("save", this.fileName);
};

/**
 * Do the generation of the PDF document.
 * @param {string[]} countries - Array with codes of countries to include in the report.
 * @param {string} regionCountry - The code of the country for which the regions and turning points will be shown on the graph in the report.
 * @return {object} The pdf document generated with jsPDF.
 */
PdfGenerator.prototype.generateReport = function (countries, regionCountry) {
    var doc = new jsPDF();
    this.initDoc(doc);
    this.initPage(doc);

    var tempJQChart = this.addLinearChart(doc, countries, regionCountry);
    var countryColors = this.getCountryColors(countries, tempJQChart);
    this.addChartLegends(doc, countryColors);

    doc.text(32, 130, $.i18n.t('slowdown'));
    doc.text(32, 136, $.i18n.t('recession'));
    var rgbColor = hexToRgb("#DCE9F5");
    doc.setFillColor(rgbColor.r, rgbColor.g, rgbColor.b);
    doc.rect(25, 127, 4, 4, 'FD');
    rgbColor = hexToRgb("#C7E0F1");
    doc.setFillColor(rgbColor.r, rgbColor.g, rgbColor.b);
    doc.rect(25, 133, 4, 4, 'FD');

    doc.setFontType("bold");
    doc.setFontSize(14);
    doc.setTextColor(128,128,128);
    doc.text(25, 157, $.i18n.t('data_on')+" "+formatQuarter(this.clockDate,'dd/MM/yyyy','/'));

    var yOffset = 169;
    var posDiff = 0;
    for(var i=0; i<countries.length; i++){
        if(i===8 || (i>8 && (i-8)%16===0)){
            this.initNewPage(doc);
            posDiff = i;
            yOffset = 50;
        }
        this.addClock(doc, countries[i], i-posDiff, yOffset, countryColors[countries[i]]);
    }

    if(countries.length>4){
        this.initNewPage(doc);
        this.addDefinitions(doc,50);
    } else {
        this.addDefinitions(doc,yOffset+60);
    }

    return doc;
};

PdfGenerator.prototype.addDefinitions = function (doc,yOffset) {
    var y = yOffset;
    doc.setFontType("normal");
    doc.setFontSize(10);
    doc.setTextColor(0,0,0);

    doc.text(38, yOffset, $.i18n.t('report_def_aA_1'));
    doc.text(38, yOffset+5, $.i18n.t('report_def_aA_2'));
    doc.text(38, yOffset+10, $.i18n.t('report_def_AB_1'));
    doc.text(38, yOffset+15, $.i18n.t('report_def_AB_2'));
    doc.text(38, yOffset+20, $.i18n.t('report_def_Bb_1'));
    doc.text(38, yOffset+25, $.i18n.t('report_def_Bb_2'));
    doc.text(38, yOffset+30, $.i18n.t('report_def_bC_1'));
    doc.text(38, yOffset+35, $.i18n.t('report_def_bC_2'));
    doc.text(38, yOffset+40, $.i18n.t('report_def_CD_1'));
    doc.text(38, yOffset+45, $.i18n.t('report_def_CD_2'));
    doc.text(38, yOffset+50, $.i18n.t('report_def_Da_1'));
    doc.text(38, yOffset+55, $.i18n.t('report_def_Da_2'));


    doc.setFontType("bold");
    doc.text(24, yOffset, 'alpha-A : ');
    doc.text(24, yOffset+10, 'A-B : ');
    doc.text(24, yOffset+20, 'B-beta : ');
    doc.text(24, yOffset+30, 'beta-C : ');
    doc.text(24, yOffset+40, 'C-D : ');
    doc.text(24, yOffset+50, 'D-alpha : ');
}

/**
 * Add the legends of the graph on the document.
 * @param {object} doc - The pdf document we are working on.
 * @param {object} countryColors - The colors of the countries on graph, to display the legends. It is a map of country code (cc) with an associated color value.
 */
PdfGenerator.prototype.addChartLegends = function (doc, countryColors) {
    var posX=2, posY=0;
    doc.setFontType("normal");
    doc.setFontSize(10);
    doc.setTextColor(0,0,0);
    doc.text(23, 120, $.i18n.t('countries')+":");
    doc.setFontSize(8);
    for(cc in countryColors){
        rgbColor = hexToRgb(countryColors[cc]);
        doc.setFillColor(rgbColor.r, rgbColor.g, rgbColor.b);
        doc.circle(23+(posX*10), 121+(posY*5)-1.7, 1.5, 'F');
        doc.text(25+(posX*10), 120+(posY*5), cc==="GB"?"UK":(cc==="GR"?"EL":cc));
        posX++;
        if(posX>=15){
            posX=2;
            posY++;
        }
    }
}

/**
 * This function convert an hexadecimal coded color (example '#ef54f4') to rgb.
 * @param {string} hex - The color as hexadecimal code. Full and short version supported, with or without the # character (examples: '#aa22cc', '#a2c','aa22cc', 'a2c').
 * @return {object} A object with 3 attributes: 'r', 'g' and 'b'.
 */
function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/**
 * Adds the graph on the document.
 * @param {object} doc - The pdf document we are working on.
 * @param {string[]} countries - Array with codes of countries to included in the report.
 * @param {string} regionCountry - The code of the country for which the regions and turning points will be shown on the graph in the report.
 */
PdfGenerator.prototype.addLinearChart = function (doc, countries, regionCounty) {
    var tempJQChart = this.initTempLinearChart(countries, regionCounty, 180, 75);
    var canvas = tempJQChart.getSingleCanvas("#FFFFFF");
    document.body.removeChild($('#'+tempJQChart.id)[0]);
    doc.addImage(canvas.toDataURL("image/jpeg", 1.0), 'JPEG', 15, 50, canvas.width/this.screenPdfSizeFactor, canvas.height/this.screenPdfSizeFactor);
    doc.setFontType("normal");
    doc.setFontSize(10);
    doc.setTextColor(0,0,0);
    doc.text(15, 45, $.i18n.t('chart_gdp_gc_title'));
    return tempJQChart;
};

/**
 * Retrieve the colors used to draw country lines on the graph.
 * @param {string[]} countries - Array with codes of countries included in the report.
 * @return {object} The colors of the countries on graph, to display the legends. It is a map of country code (cc) with an associated color value.
 */
PdfGenerator.prototype.getCountryColors = function (countries, jqChart){
    var countryColors = {};
    for(var i=0; i<jqChart.jqPlots.series.length; i++){
        var serie = jqChart.jqPlots.series[i];
        var countryIndex = $.inArray(serie.label.substring(0,2),countries);
        if(countryIndex>=0 && countryColors[countries[countryIndex]]==undefined){
            countryColors[countries[countryIndex]] = serie.fillColor;
        }
    }
    return countryColors;
};

/**
 * Initializes a temporar linear chart with jqChart, that will be used to extrat canvas and include it on pdf.
 * @param {string[]} countries - Array with codes of countries included in the report.
 * @param {string} regionCountry - The code of the country for which the regions and turning points will be shown on the graph in the report.
 * @param {number} width - The width of the graph.
 * @param {number} height - The height of the graph.
 * @return {object} The created chart.
 */
PdfGenerator.prototype.initTempLinearChart = function (countries, regionCounty, width, height) {
    var charDivId="tempChartDiv";
    var chartDiv=document.createElement('div');
    chartDiv.id=charDivId;
    chartDiv.style.width=(width*this.screenPdfSizeFactor)+"px";
    chartDiv.style.height=(height*this.screenPdfSizeFactor)+"px";
    document.body.appendChild(chartDiv);
    var chart = initJqChart(charDivId, this.bcc, this.dataSet, this.dataSetInfo, undefined, this.from, this.to.getMonth()===2?new Date(this.to.setMonth(this.to.getMonth()+3)):this.to);
    for(var i=0; i<countries.length; i++){
        chart.loadCountry(countries[i], i, true);
    }
    if(typeof regionCounty!=="undefined" && regionCounty){
        chart.loadCountryRegions(regionCounty, false, true);
    } else {
        chart.clearRegions(true);
    }
    return chart;
};

/**
 * Initializes the pdf document, it set the meta-datas.
 * @param {object} doc - The pdf document we are working on.
 */
PdfGenerator.prototype.initDoc = function (doc) {
    doc.setProperties({
        title: 'Business Cycle Clock',
        subject: 'Business Cycle Clock',
        author: 'Eurostat',
        keywords: 'report, eurostat, business cycle clock, bcc',
        creator: 'Eurostat'
    });
};

/**
 * Adds and initializes a new page to the pdf document.
 * @param {object} doc - The pdf document we are working on.
 */
PdfGenerator.prototype.initNewPage = function (doc) {
    this.initPage(doc, true);
};

/**
 * Initializes a page in the pdf document, it adds header, footer and page number on the page.
 * @param {object} doc - The pdf document we are working on.
 * @param {boolean} addPage - If set to true, a new page is added to the document, else it is the current page that is initialized.
 */
PdfGenerator.prototype.initPage = function (doc, addPage) {
    if(addPage === true){
        doc.addPage();
        this.page++;
    }
    doc.setFontSize(24);
    doc.setFontType("bold");
    doc.setTextColor(128,128,128);
    doc.text(30, 25, "Business Cycle Clock");
    doc.addImage(this.eurostatLogo, 'JPEG', 145, 16, 60, 10);

    doc.setFontType("normal");
    doc.setFontSize(10);
    doc.setTextColor(0,0,0);
    doc.text(20, 295, $.i18n.t('doc_generated_from')+" "+document.location.protocol + '//' + document.location.host + document.location.pathname+" "+$.i18n.t('on_date')+" "+$.datepicker.formatDate('d MM yy',this.genDate,$.datepicker.regional[$.i18n.language])+".");
    doc.text(190, 288, $.i18n.t('page')+" "+this.page);
};

/**
 * Return the data of one country from the dataSet.
 * @param {string} countryCode - The code of the country.
 * @return {object} The data from the dataSet for that country.
 */
PdfGenerator.prototype.getCountryData = function (countryCode) {
    for(var i=0; i<this.dataSet.DataSet.Data.length; i++){
        if(this.dataSet.DataSet.Data[i].Country['@attributes'].code === countryCode){
            return this.dataSet.DataSet.Data[i];
        }
    }
    return undefined;
};

/**
 * To add a clock on the document.
 * @param {object} doc - The pdf document we are working on.
 * @param {string} countryCode - The code of the country.
 * @param {number} pos - The position of the clock (order index).
 * @param {number} yOffset - It represents a vertical offset before the clocks section on the page.
 * @param {string} color - Color of the text.
 */
PdfGenerator.prototype.addClock = function (doc, countryCode, pos, yOffset, color) {
    var countryData = this.getCountryData(countryCode);

    if(typeof yOffset==="undefined" || !yOffset){
        yOffset = 0;
    }

    if(countryData!==undefined){
        var posX = (pos%4);
        var posY = Math.floor(pos/4);

        rgbColor = hexToRgb(color);
        doc.setFillColor(rgbColor.r, rgbColor.g, rgbColor.b);
        //doc.circle(22+(posX*43), yOffset+(posY*70)-1.7, 2, 'F');
        doc.setFontType("normal");
        doc.setFontSize(12);
        doc.setTextColor(0,0,0);
        doc.text(25+(posX*43), yOffset+(posY*65), $.i18n.t('country:'+countryData.Country['@attributes'].code));

        var canvas = document.createElement('canvas');
        var clock = new CycleClock(canvas, {
            width: 150,
            height: 155,
            radius: 45,
            backgroundColor: "#FFFFFF",
            crise1Color: "#FAA61A",
            crise1MirrorColor: "#FEDEB3",
            crise2Color: "#F26522",
            crise2MirrorColor: "#F89F6C",
            noCriseColor: "#8BD1D1",
            noCriseMirrorColor: "#3BBFBD",
        });
        clock.updateClock(this.dataSetInfo[countryCode].angle[(this.clockObservationIndex*3) + this.thetaIndex]);
        var imgData = canvas.toDataURL("image/jpeg", 1.0);
        doc.addImage(imgData, 'JPEG', 20+(posX*43), yOffset+1+(posY*65));

        doc.setFontType("normal");
        doc.setFontSize(12);
        doc.setTextColor(0,0,0);
        doc.text(25+(posX*43), yOffset+46+(posY*65),""+$.datepicker.formatDate('M yy', toDate(this.clockDate,"dd/MM/yyyy","/"),$.datepicker.regional[$.i18n.language]));
        //doc.text(20+(posX*43), yOffset+46+(posY*70), $.i18n.t('gdp')+": "+new Number(countryData.Observations.Observation[this.clockObservationIndex].GDP['#text']).toFixed(3));
        //doc.text(20+(posX*43), yOffset+51+(posY*70), $.i18n.t('gdp_gc')+": "+new Number(countryData.Observations.Observation[this.clockObservationIndex].GDP_GC['#text']).toFixed(3));
    }
};

if (typeof define === 'function' && define.amd) {
    define("pdfGenerator", ['jquery','jsPdf','jquery-ui', 'datepicker-de', 'datepicker-fr','jqChart'], function() {
        return PdfGenerator;
    });
} else if ('undefined' !== typeof exports && 'undefined' !== typeof module) {
    module.exports = PdfGenerator;
}
