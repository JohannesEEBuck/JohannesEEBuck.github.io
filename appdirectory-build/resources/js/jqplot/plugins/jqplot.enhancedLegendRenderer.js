/**
 * jqPlot
 * Pure JavaScript plotting plugin using jQuery
 *
 * Version: 1.0.8
 * Revision: 1250
 *
 * Copyright (c) 2009-2013 Chris Leonello
 * jqPlot is currently available for use in all personal or commercial projects
 * under both the MIT (http://www.opensource.org/licenses/mit-license.php) and GPL
 * version 2.0 (http://www.gnu.org/licenses/gpl-2.0.html) licenses. This means that you can
 * choose the license that best suits your project and use it accordingly.
 *
 * Although not required, the author would appreciate an email letting him
 * know of any substantial use of jqPlot.  You can reach the author at:
 * chris at jqplot dot com or see http://www.jqplot.com/info.php .
 *
 * If you are feeling kind and generous, consider supporting the project by
 * making a donation at: http://www.jqplot.com/donate.php .
 *
 * sprintf functions contained in jqplot.sprintf.js by Ash Searle:
 *
 *     version 2007.04.27
 *     author Ash Searle
 *     http://hexmen.com/blog/2007/03/printf-sprintf/
 *     http://hexmen.com/js/sprintf.js
 *     The author (Ash Searle) has placed this code in the public domain:
 *     "This code is unrestricted: you are free to use it however you like."
 *
 */

!function(e){e.jqplot.EnhancedLegendRenderer=function(){e.jqplot.TableLegendRenderer.call(this)},e.jqplot.EnhancedLegendRenderer.prototype=new e.jqplot.TableLegendRenderer,e.jqplot.EnhancedLegendRenderer.prototype.constructor=e.jqplot.EnhancedLegendRenderer,e.jqplot.EnhancedLegendRenderer.prototype.init=function(s){this.numberRows=null,this.numberColumns=null,this.seriesToggle="normal",this.seriesToggleReplot=!1,this.disableIEFading=!0,e.extend(!0,this,s),this.seriesToggle&&e.jqplot.postDrawHooks.push(t)},e.jqplot.EnhancedLegendRenderer.prototype.draw=function(t,n){if(this.show){var l,o=this._series,i="position:absolute;";i+=this.background?"background:"+this.background+";":"",i+=this.border?"border:"+this.border+";":"",i+=this.fontSize?"font-size:"+this.fontSize+";":"",i+=this.fontFamily?"font-family:"+this.fontFamily+";":"",i+=this.textColor?"color:"+this.textColor+";":"",i+=null!=this.marginTop?"margin-top:"+this.marginTop+";":"",i+=null!=this.marginBottom?"margin-bottom:"+this.marginBottom+";":"",i+=null!=this.marginLeft?"margin-left:"+this.marginLeft+";":"",i+=null!=this.marginRight?"margin-right:"+this.marginRight+";":"",this._elem=e('<table class="jqplot-table-legend" style="'+i+'"></table>'),this.seriesToggle&&this._elem.css("z-index","3");var d,a,r=!1,h=!1;this.numberRows?(d=this.numberRows,a=this.numberColumns?this.numberColumns:Math.ceil(o.length/d)):this.numberColumns?(a=this.numberColumns,d=Math.ceil(o.length/this.numberColumns)):(d=o.length,a=1);var g,p,c,m,b,u,w,f,q,j=0;for(g=o.length-1;g>=0;g--)(1==a&&o[g]._stack||o[g].renderer.constructor==e.jqplot.BezierCurveRenderer)&&(h=!0);for(g=0;g<d;g++){for(c=e(document.createElement("tr")),c.addClass("jqplot-table-legend"),h?c.prependTo(this._elem):c.appendTo(this._elem),p=0;p<a;p++){if(j<o.length&&(o[j].show||o[j].showLabel)&&(l=o[j],u=this.labels[j]||l.label.toString())){var v=l.color;if(r=h?g!=d-1:g>0,w=r?this.rowSpacing:"0",m=e(document.createElement("td")),m.addClass("jqplot-table-legend jqplot-table-legend-swatch"),m.css({textAlign:"center",paddingTop:w}),f=e(document.createElement("div")),f.addClass("jqplot-table-legend-swatch-outline"),q=e(document.createElement("div")),q.addClass("jqplot-table-legend-swatch"),q.css({backgroundColor:v,borderColor:v}),m.append(f.append(q)),b=e(document.createElement("td")),b.addClass("jqplot-table-legend jqplot-table-legend-label"),b.css("paddingTop",w),this.escapeHtml?b.text(u):b.html(u),h?(this.showLabels&&b.prependTo(c),this.showSwatches&&m.prependTo(c)):(this.showSwatches&&m.appendTo(c),this.showLabels&&b.appendTo(c)),this.seriesToggle){var C;"string"!=typeof this.seriesToggle&&"number"!=typeof this.seriesToggle||e.jqplot.use_excanvas&&this.disableIEFading||(C=this.seriesToggle),this.showSwatches&&(m.bind("click",{series:l,speed:C,plot:n,replot:this.seriesToggleReplot},s),m.addClass("jqplot-seriesToggle")),this.showLabels&&(b.bind("click",{series:l,speed:C,plot:n,replot:this.seriesToggleReplot},s),b.addClass("jqplot-seriesToggle")),!l.show&&l.showLabel&&(m.addClass("jqplot-series-hidden"),b.addClass("jqplot-series-hidden"))}r=!0}j++}m=b=f=q=null}}return this._elem};var s=function(s){var t=s.data,n=t.series,l=t.replot,o=t.plot,i=t.speed,d=n.index,a=!1;!n.canvas._elem.is(":hidden")&&n.show||(a=!0);var r=function(){if(l){var s={};if(e.isPlainObject(l)&&e.extend(!0,s,l),o.replot(s),a&&i){var t=o.series[d];t.shadowCanvas._elem&&t.shadowCanvas._elem.hide().fadeIn(i),t.canvas._elem.hide().fadeIn(i),t.canvas._elem.nextAll(".jqplot-point-label.jqplot-series-"+t.index).hide().fadeIn(i)}}else{var t=o.series[d];t.canvas._elem.is(":hidden")||!t.show?(void 0!==o.options.legend.showSwatches&&!0!==o.options.legend.showSwatches||o.legend._elem.find("td").eq(2*d).addClass("jqplot-series-hidden"),void 0!==o.options.legend.showLabels&&!0!==o.options.legend.showLabels||o.legend._elem.find("td").eq(2*d+1).addClass("jqplot-series-hidden")):(void 0!==o.options.legend.showSwatches&&!0!==o.options.legend.showSwatches||o.legend._elem.find("td").eq(2*d).removeClass("jqplot-series-hidden"),void 0!==o.options.legend.showLabels&&!0!==o.options.legend.showLabels||o.legend._elem.find("td").eq(2*d+1).removeClass("jqplot-series-hidden"))}};n.toggleDisplay(s,r)},t=function(){if(this.legend.renderer.constructor==e.jqplot.EnhancedLegendRenderer&&this.legend.seriesToggle){var s=this.legend._elem.detach();this.eventCanvas._elem.after(s)}}}(jQuery);