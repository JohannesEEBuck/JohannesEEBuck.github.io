/**
 * This is an ajax loader for the xml data file.
 * 'onready' should be defined with function with those arguments: dataSet, xhttp, xml, file.
 * 'onready' should be defined with function with those arguments: xhttp, file.
 * @constructor
 */
function DataSetLoader() {
    this.loaded = false;
    this.error = false;
    this.xmlDoc = null;
    this.dataSet = null;
    this.file = "files/BCC_HD.xml";
    this.onerror = function(x, f){
        console.error("state=" + x.readyState + " status=" + x.status + " for file : " + f);
    }
    this.onready = function(dataSet, x, f){
        console.log("state=" + x.readyState + " status=" + x.status + " for file : " + f);
    }
};

/**
 * Start loading the dataSet. The file is loaded asynchronously, and call the 'onready' function when the file is loaded.
 * @param {string} fileName - The name and path to the xml file that contains the dataSet.
 */
DataSetLoader.prototype.loadDataSet = function (fileName) {
    if (typeof fileName === 'string' || fileName instanceof String) {
        this.file = fileName;
    }
    this.loaded = false;
    this.error = false;
    this.xhttp = new XMLHttpRequest();
    this.xhttp.onreadystatechange = function () {
        if (this.xhttp.readyState == 4 && this.xhttp.status == 200) {
            this.loaded = true;
            this.xmlDoc = this.xhttp.responseXML;
            this.dataSet = xmlToJson(this.xmlDoc);
            this.onready(this.dataSet, this.xmlDoc, this.xhttp, this.file);
        } else if (this.xhttp.status != 200 && this.xhttp.status != 0) {
            this.error = true;
            this.onerror(this.xhttp, this.file);
        }
    }.bind(this);
    this.xhttp.open("GET", this.file, true);
    this.xhttp.send();
}

if (typeof define === 'function' && define.amd) {
    define("dataSetLoader", ['bcc_commons'], function() {
        return new DataSetLoader();
    });
} else if ('undefined' !== typeof exports && 'undefined' !== typeof module) {
    module.exports = new DataSetLoader();
}

/**
 * Converts XML to JSON.
 * @param {string} xml - The XML to convert.
 * @return {object} A JavaScript object containing data from the XML.
 */
function xmlToJson(xml) {

    // Create the return object
    var obj = {};

    if (xml.nodeType == 1) { // element
        // do attributes
        if (xml.attributes.length > 0) {
            obj["@attributes"] = {};
            for (var j = 0; j < xml.attributes.length; j++) {
                var attribute = xml.attributes.item(j);
                obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
            }
        }
    } else if (xml.nodeType == 3) { // text
        obj = xml.nodeValue;
    }

    // do children
    if (xml.hasChildNodes()) {
        for (var i = 0; i < xml.childNodes.length; i++) {
            var item = xml.childNodes.item(i);
            var nodeName = item.nodeName;
            if (typeof (obj[nodeName]) == "undefined") {
                obj[nodeName] = xmlToJson(item);
            } else {
                if (typeof (obj[nodeName].push) == "undefined") {
                    var old = obj[nodeName];
                    obj[nodeName] = [];
                    obj[nodeName].push(old);
                }
                obj[nodeName].push(xmlToJson(item));
            }
        }
    }
    return obj;
};

/**
 * Return the dataSetInfo object, it is strucured data based on the dataSet, intended to be used by the BCC.
 * @param {object} dataSet - The dataset to use.
 * @return {object} The dataSetInfo object.
 */
function initDataSetInfo(dataSet) {
    var dataSetInfo = {};
    for (var i = 0; i < dataSet.DataSet.Data.length; i++) {
        initCountryData(dataSet.DataSet.Data[i], dataSetInfo);
    }
    return dataSetInfo;
}

/**
 * Inserts the data of one country to  the dataSetInfo object.
 * @param {object} countryData - The data from the dataSet for one country.
 * @param {object} dataSetInfo - The dataSetInfo object.
 * @return {object} Data for one country.
 */
function initCountryData(countryData, dataSetInfo) {
    var country = countryData.Country["@attributes"];

    var angle = [],
        date = [];

    var dates = ['x'];
    var serie = [];
    var gdpS = [];
    var gdpgcS = [];
    var ser1 = [country.code + '_GDP'],
        ser2 = [country.code.toUpperCase()];//[country.code + '_GDP_GC'];
    var label = [],
        region = [],
        countryTPs = [];

    for (var i = 0; i < countryData.Observations.Observation.length; i++) {
        var obs = countryData.Observations.Observation[i];

        for (var j = 0; j < obs.Theta.obs.length; j++) {
            angle.push(obs.Theta.obs[j]["@attributes"].angle);
            date.push(obs.Theta.obs[j]["@attributes"].date);
        }

        dates.push(obs.fullDate["#text"]);
        var gdp=null, gdpgc=null;
        if(obs.GDP){
            gdp=obs.GDP["#text"];
        }
        ser1.push(gdp);
        if(obs.GDP_GC){
            gdpgc=obs.GDP_GC["#text"];
        }
        ser2.push(gdpgc);
        serie.push([toDate(obs.fullDate["#text"]).getTime(), gdpgc?Number(gdpgc):gdpgc]);
        gdpgcS.push(gdpgcS?Number(gdpgc):gdpgcS);
        gdpS.push(gdp?Number(gdp):gdp);

        var tps = [];
        if (obs.A["#text"] == "1"){
            region.push(new Array("A", obs.fullDate["#text"]));
            tps.push('A');
        }
        if (obs.B["#text"] == "1"){
            region.push(new Array("B", obs.fullDate["#text"]));
            tps.push('B');
        }
        if (obs.C["#text"] == "1"){
            region.push(new Array("C", obs.fullDate["#text"]));
            tps.push('C');
        }
        if (obs.D["#text"] == "1"){
            region.push(new Array("D", obs.fullDate["#text"]));
            tps.push('D');
        }
        if (obs.Alpha["#text"] == "1"){
            tps.push('α');
        }
        if (obs.Beta["#text"] == "1"){
            tps.push('β');
        }
        if(tps.length>0){
            var tpLabel = "";
            $.each(tps,function(index,value){
                if(tpLabel.length==0){
                    tpLabel=country.code + ': '+value;
                } else {
                    tpLabel=tpLabel+" & "+value;
                }
                countryTPs.push({tp:value,date:toDate(obs.fullDate["#text"]),index:gdpS.length-1});
            });
            label.push({
                value: obs.fullDate["#text"],
                text: (tpLabel)
            });
        }
    }

    var countryDataInfo = {};
    countryDataInfo.angle = angle;
    countryDataInfo.gdp = gdpS;
    countryDataInfo.gdpgc = gdpgcS;
    countryDataInfo.date = date;
    countryDataInfo.dates = dates;
    countryDataInfo.ser1 = ser1;
    countryDataInfo.ser2 = ser2;
    countryDataInfo.serie = serie;
    countryDataInfo.label = label;
    countryDataInfo.region = region;
    countryDataInfo.description = country.description;
    countryDataInfo.code = country.code;
    countryDataInfo.tps = countryTPs;

    dataSetInfo[country.code] = countryDataInfo;
}
