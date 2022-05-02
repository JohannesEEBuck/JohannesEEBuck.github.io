/**
 * Represent one clock.
 * @constructor
 * @param {string | object} selector - jQuery style selector or jQuery object to retrieve a DOM element that is a canvas where to draw the clock; or another element. If it is an element different than a canvas, canvas element will be searched in the children, if no canvas element (with the CSS class 'clock_canvas') is found, it will be created as a child of the given DOM element.
 * @param {object} options - Set of options to customize the clock; they are all optional because default values are available.
 */
function CycleClock(selector, options) {
    this.fontSize = options.fontSize?options.fontSize:16;
    this.innerDist = options.innerDist!==undefined?options.innerDist:15;
    this.separatorsColor = options.separatorsColor?options.separatorsColor:'#FFFFFF';
    this.backgroundColor = options.backgroundColor;
    this.noCriseColor = options.noCriseColor;
    this.noCriseMirrorColor = options.noCriseMirrorColor?options.noCriseMirrorColor:this.noCriseColor;
    this.crise1Color = options.crise1Color?options.crise1Color:'#EEE9F5';
    this.crise1MirrorColor = options.crise1MirrorColor?options.crise1MirrorColor:this.crise1Color;
    this.crise2Color = options.crise2Color?options.crise2Color:'#d3c9e7';
    this.crise2MirrorColor = options.crise2MirrorColor?options.crise2MirrorColor:this.crise2Color;
    this.radius = options.radius ? options.radius : 70;
    this.bindToElem(selector, options.width, options.height);
    if(typeof this.canvas.getContext != 'function'){
        if(typeof G_vmlCanvasManager != 'undefined'){
            G_vmlCanvasManager.initElement(this.canvas);
        }
    }
    var jqCanvas = $(this.canvas);
    if (!jqCanvas.hasClass('clock_canvas')) {
        jqCanvas.addClass('clock_canvas');
    }
    if (options.width)
        jqCanvas.attr('width', options.width);
    if (options.height)
        jqCanvas.attr('height', options.height);
}

/**
 * Do the bindeing the DOM elements with the selector provided, and create the canvas element if not found.
 * @param {string | object} selector - jQuery style selector or jQuery object to retrieve a DOM element that is a canvas where to draw the clock; or another element. If it is an element different than a canvas, canvas element will be searched in the children, if no canvas element (with the CSS class 'clock_canvas') is found, it will be created as a child of the given DOM element.
 * @param {number} width - Width of the canvas element, only used if the canvas is not already existing.
 * @param {number} height - Height of the canvas element, only used if the canvas is not already existing.
 * @param {boolean} draw - True if the clock must be drown immediatly to the canvas.
 */
CycleClock.prototype.bindToElem = function (selector, width, height, draw) {
    this.elem = $(selector);
    if (!this.elem.is('canvas') && this.elem.children('canvas.clock_canvas').length <= 0) {
        this.elem.append("<canvas class='clock_canvas' width='" + (width?width:210) + "' height='" + (height?height:200) + "'/>");
    }
    if (this.elem.is('canvas')) {
        if(this.elem.parent().length>0){
            this.elem = this.elem.parent();
        } else {
            this.canvas = this.elem[0];
            this.elem = undefined;
        }
    }
    if(this.elem){
        this.canvas = this.elem.children('canvas.clock_canvas')[0];
    }
    if(!!draw){
        this.drawClock();
    }
};

/**
 * Draw the clock on the canvas.
 */
CycleClock.prototype.drawClock = function () {
    // --- Analog clock ---//
    var context = this.canvas.getContext('2d');

    // You can change this to make the clock as big or small as you want.
    // Just remember to adjust the canvas size if necessary.
    var clockRadius = this.radius;

    // Make sure the clock is centered in the canvas
    var clockX = this.canvas.width / 2;
    var clockY = this.canvas.height / 2;

    // Make sure TAU is defined (it's not by default)
    Math.TAU = 2 * Math.PI;
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ////////////////
    // DRAW CLOCK
    ////////////////

    //set background
    if(!!this.backgroundColor){
        context.fillStyle = this.backgroundColor;
        context.fillRect(0,0,this.canvas.width,this.canvas.height);
    }
    context.fillStyle = "#9c9d9e";

    context.beginPath();
    context.arc(clockX, clockY, clockRadius * 1.1, 0, Math.TAU);
    context.strokeStyle = '#9c9d9e';
    context.lineWidth = 2;
    context.stroke();
    context.closePath();
    context.font = this.fontSize+"px Georgia";

    this.drawCam(0, Math.PI / 4, clockRadius * 1.05, 1, this.crise1Color);
    this.drawCam(Math.PI / 4, Math.PI/2, clockRadius * 1.05, 1, this.crise2Color);
    this.drawCam(Math.PI/2, Math.PI - Math.PI / 4, clockRadius * 1.05, 1, this.crise2MirrorColor);
    this.drawCam(Math.PI - Math.PI / 4, Math.PI, clockRadius * 1.05, 1, this.crise1MirrorColor);
    if(!!this.noCriseColor){
        this.drawCam(Math.TAU-Math.PI/2, Math.TAU, clockRadius * 1.05, 1, this.noCriseColor);
    }
    if(!!this.noCriseMirrorColor){
        this.drawCam(Math.PI, Math.TAU-Math.PI/2, clockRadius * 1.05, 1, this.noCriseMirrorColor);
    }

    this.drawElt(-Math.PI / 2, 1, 1.1, this.separatorsColor, "\u03B1");
    this.drawElt(Math.PI / 2, 1, 1.1, this.separatorsColor, "\u03B2");
    this.drawElt(0, 1, 1.1, this.separatorsColor, "A");
    this.drawElt(Math.PI / 4, 1, 1.1, this.separatorsColor, "B");
    this.drawElt(Math.PI - Math.PI / 4, 1, 1.1, this.separatorsColor, "C");
    this.drawElt(Math.PI, 1, 1.1, this.separatorsColor, "D");
};

/**
 * Redraw the clock with a position specified by and angle.
 * @param {number} angle - The angle representing the position on the clock.
 */
CycleClock.prototype.updateClock = function (angle) {
    this.drawClock();
    // DRAW point
    if(!isNaN(angle) && isFinite(angle)){
        this.drawArm(angle, 3, 1, '#58595B');
    }
};

/**
 * Draw an arm on the clock, at a given position (angle).
 * @param {number} angle - The angle that defines the position of the arm on the clock.
 * @param {number} armThickness - The tickness of the arm.
 * @param {number} armLength - The lenght of the arm.
 * @param {string} armColor - The color of the arm.
 */
CycleClock.prototype.drawArm = function (angle, armThickness, armLength, armColor)
{
    var context = this.canvas.getContext('2d');
    var clockRadius = this.radius;
    var clockX = this.canvas.width/2;
    var clockY = this.canvas.height/2;
    var MathTau4 = Math.TAU / 4;
    var armRadians = (angle - MathTau4);
    var armLengthXclockRadius = armLength * clockRadius;
    var targetX = clockX + Math.cos(armRadians) * (armLengthXclockRadius);
    var targetY = clockY + Math.sin(armRadians) * (armLengthXclockRadius);

    context.lineWidth = armThickness;
    context.strokeStyle = armColor;

    context.beginPath();
    context.moveTo(clockX, clockY); // Start at the center
    context.lineTo(targetX, targetY); // Draw a line outwards
    context.stroke();
};

/**
 * Draw an arm on the clock, at a position defined by target X and Y coordinates.
 * @param {number} targetX - The X coordinate of the target.
 * @param {number} targetY - The Y coordinate of the target.
 * @param {number} armThickness - The tickness of the arm.
 * @param {string} armColor - The color of the arm.
 */
CycleClock.prototype.drawArm2 = function (targetX, targetY, armThickness, armColor)
{
    var context = this.canvas.getContext('2d');
    var clockX = this.canvas.width/2;
    var clockY = this.canvas.height/2;
    context.lineWidth = armThickness;
    context.strokeStyle = armColor;

    context.beginPath();
    context.moveTo(clockX, clockY); // Start at the center
    context.lineTo(targetX, targetY); // Draw a line outwards
    context.stroke();
};

/**
 * Draw a separator for clock sections.
 * @param {number} angle - The angle that defines the position of the separator on the clock.
 * @param {number} armThickness - The tickness of the separator.
 * @param {number} armLength - The lenght of the separator.
 * @param {string} armColor - The color of the separator.
 * @param {string} text - The label of the separator (turning points).
 */
CycleClock.prototype.drawElt = function (angle, armThickness, armLength, armColor, text) {
    var context = this.canvas.getContext('2d');
    var clockRadius = this.radius;
    var clockX = this.canvas.width/2;
    var clockY = this.canvas.height/2;
    var armRadians = angle;
    var MathCos = Math.cos(armRadians);
    var MathSin = Math.sin(armRadians);

    var fontAdd=0;
    if(armRadians>3) {
        fontAdd = this.fontSize*Math.TAU/10;
    } else if(armRadians>2) {
        fontAdd = this.fontSize*0.8;
    } else if(armRadians>1) {
        fontAdd = this.fontSize*Math.TAU/10;
    } else if(armRadians>0) {
        fontAdd = this.fontSize/3;
    }

    var textRadius = clockRadius + this.innerDist;

    //coord
    var innerDistXtextRadius = (textRadius)+fontAdd;;
    var x1 = clockX + MathCos * (innerDistXtextRadius);
    var y1 = clockY + MathSin * (innerDistXtextRadius);
    context.fillText(text, x1, y1);

    //coord
    var armLengthXclockRadius = armLength * clockRadius;
    var targetX = clockX + MathCos * (armLengthXclockRadius);
    var targetY = clockY + MathSin * (armLengthXclockRadius);
    this.drawArm2(targetX, targetY, armThickness, armColor);
};

/**
 * Draw a section from the clock, defined by two angles.
 * @param {number} angle1 - Angle that defines the start of the section.
 * @param {number} angle2 - Angle that defines the end of the section.
 * @param {number} radius - The radius of the clock.
 * @param {number} coef - A coefficient used with the radius to draw the section arc.
 * @param {string} color - The color of the section.
 */
CycleClock.prototype.drawCam = function (angle1, angle2, radius, coef, color) {
    var context = this.canvas.getContext('2d');
    var clockX = this.canvas.width/2;
    var clockY = this.canvas.height/2;
    var svg_fillStyle = context.fillStyle;
    var MathCos = Math.cos(angle1);
    var MathSin = Math.sin(angle1);
    var x1 = clockX + MathCos * radius;
    var y1 = clockY + MathSin * radius;

    MathCos = Math.cos(angle2);
    MathSin = Math.sin(angle2);

    context.fillStyle = color;
    context.beginPath();
    context.moveTo(clockX, clockY);
    context.lineTo(x1, y1);
    context.arc(clockX, clockY, (radius * coef), angle1, angle2);
    context.lineTo(clockX, clockY);
    context.fill();
    context.closePath();

    context.fillStyle = svg_fillStyle;
};
