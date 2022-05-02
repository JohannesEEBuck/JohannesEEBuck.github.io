if (typeof define === 'function' && define.amd) {
    define("timer", ['jquery'], function($) {
        return TimerLoop;
    });
} else if ('undefined' !== typeof exports && 'undefined' !== typeof module) {
    module.exports = TimerLoop;
}

/**
 * Represents the timer, used to run the animations. It is defines with a min and max 'position', and call a function with the position incrementing every 400 milliseconds.
 * @constructor
 * @param {function} onPosChange - The function to be called every 400 milliseconds, with two arguments: the current timer 'position' and the timer object.
 * @param {string | object} selector - The jQuery style selector or jQuery object for the element that contains the player that control this timer (play and pause buttons; with CSS class 'playerControl').
 * @param {number} minTimerPos - The minimum timer 'position', the value when it starts.
 * @param {number} maxTimerPos - The maximum timer 'position', it stopts when reaching this value and can not go further.
 * @param {boolean} isPaused - If true the timer is on pause after creation, else it start right away.
 * @param {boolean} backward - If true the timer go backward, it decrements positions from max to min.
 * @param {boolean} startAtLastPos - If true the timer initial 'position' is at last (maximum) value, else it start at first 'position'.
 */
function TimerLoop(onPosChange, selector, minTimerPos, maxTimerPos, isPaused, backward, startAtLastPos) {
    this.loop=false;
    this.started=false;
    this.hiddenPause=false;
    this.fast = false;
    this.selector = selector;
    this.backward = !!backward;
    this.isPaused = !!isPaused;
    this.interval=null;
    this.onPosChange = onPosChange;
    this.minTimerPos = minTimerPos;
    this.maxTimerPos = maxTimerPos;
    if(startAtLastPos){
        this.timerPos = this.maxTimerPos;
    } else {
        this.timerPos = this.minTimerPos;
    }
    if(!isPaused){
        this.goForward(true);
    }
    visProp = this.getHiddenProp();
    if (visProp) {
        var evtname = visProp.replace(/[H|h]idden/,'') + 'visibilitychange';
        document.addEventListener(evtname, this.visChange.bind(this));
    }
    if($(selector).children('.playerControl').length<=0){
        this.addPlayer();
    }
}

/**
 * Launch the timer.
 * @param {boolean} fast - If true, the timer go faster (100 milliseconds interval instead of 400).
 */
TimerLoop.prototype.play = function (fast) {
    if(typeof fast === 'undefined'){
        fast = this.fast;
    }
    if(this.isPaused && this.timerPos==this.maxTimerPos){
        this.setPos(this.minTimerPos);
    }
    this.isPaused = false;
    if(!this.started){
        this.started=true;
    }
    if(this.interval && fast != this.fast){
        clearInterval(this.interval);
        this.interval=null;
    }
    if(!this.interval){
        this.fast = fast;
        this.interval=setInterval(function (){
            if(this.hiddenPause!==true){
                this.setPos(this.timerPos+(this.backward?-1:1));
            }
        }.bind(this),this.fast?100:400);
    }
    $(this.selector).find('.playerControl.selectable').removeClass('selected');
    if(this.backward){
        $(this.selector).find(fast?'.playerControl.fastbackward':'.playerControl.backward').addClass('selected');
    } else {
        $(this.selector).find(fast?'.playerControl.fastforward':'.playerControl.play').addClass('selected');
    }
};

/**
 * Set the timer on pause.
 */
TimerLoop.prototype.pause = function () {
    this.isPaused = true;
    clearInterval(this.interval);
    this.interval=null;
    $(this.selector).find('.playerControl.selectable').removeClass('selected');
    $(this.selector).find('.playerControl.pause').addClass('selected');
};

/**
 * Set the timer to go forward (incrementing position).
 * @param {boolean} play -backToStart() If true, the timer start running.
 * @param {fast} fast - If true, set the timer to run faster (100 milliseconds interval instead of 400).
 */
TimerLoop.prototype.goForward = function (play, fast) {
    if(!this.started){
        this.timerPos = -1;
    }
    this.backward=false;
    if(play){
        this.play(fast!=undefined?fast:false);
    }
    $(this.selector).find('.playerControl.selectable').removeClass('selected');
    $(this.selector).find(fast?'.playerControl.fastforward':'.playerControl.play').addClass('selected');
};

/**
 * Set the timer to go backward (decrementing position).
 * @param {boolean} play - If true, the timer start running.
 * @param {fast} fast - If true, set the timer to run faster (100 milliseconds interval instead of 400).
 */
TimerLoop.prototype.goBackward = function (play, fast) {
    this.backward=true;
    if(play){
        this.play(fast!=undefined?fast:false);
    }
    $(this.selector).find('.playerControl.selectable').removeClass('selected');
    $(this.selector).find(fast?'.playerControl.fastbackward':'.playerControl.backward').addClass('selected');
};

/**
 * Set the current timer 'position'.
 * @param {number} newPos - The new value for the timer 'position'.
 * @param {boolean} forceNoLoop - Force to not loop, by default if the new value is bigger than maximum (or smaller than minimum when running backward) it will go back to start position and loop.
 */
TimerLoop.prototype.setPos = function (newPos, forceNoLoop) {
    if(typeof(newPos) === 'number' && isFinite(newPos)){
        newPos=Math.round(newPos);
        this.started=true;
        var forward = newPos>=this.timerPos;
        if((newPos>this.maxTimerPos) || (newPos<this.minTimerPos)){
            if(forceNoLoop){
                newPos=forward?this.maxTimerPos:this.minTimerPos;
            } else {
                newPos=!forward?this.maxTimerPos:this.minTimerPos;
            }
        }
        var newPosReturned = this.onPosChange(newPos, this);
        this.timerPos=newPos;
        if(!this.loop && this.timerPos==this.maxTimerPos){
            this.pause();
        }
    }
}

/**
 * Jump to the first position.
 */
TimerLoop.prototype.backToStart = function () {
    this.setPos(this.minTimerPos);
}

/**
 * Jump to the last position.
 */
TimerLoop.prototype.goToEnd = function () {
    this.setPos(this.maxTimerPos);
}

/**
 * Jump to next timer 'position'.
 */
TimerLoop.prototype.next = function (n) {
    if(typeof(n) === 'number' && isFinite(n)){
        this.setPos(this.timerPos+n, true);
    } else {
        this.setPos(this.timerPos+1, true);
    }
    
}

/**
 * Jump to previous timer 'position'.
 */
TimerLoop.prototype.back = function (n) {
    if(typeof(n) === 'number' && isFinite(n)){
        this.setPos(this.timerPos-n, true);
    } else {
        this.setPos(this.timerPos-1, true);
    }
    
}

/**
 * Function to retrieve the 'hidden' attribute of the document.
 * @return {string | null} The value of the hidden attribute, or null if not supported by the browser.
 */
TimerLoop.prototype.getHiddenProp = function (){
    var prefixes = ['webkit','moz','ms','o'];
    
    // if 'hidden' is natively supported just return it
    if ('hidden' in document) return 'hidden';
    if ('Hidden' in document) return 'Hidden';
    
    // otherwise loop over all the known prefixes until we find one
    for (var i = 0; i < prefixes.length; i++){
        if ((prefixes[i] + 'hidden') in document) 
            return prefixes[i] + 'hidden';
        if ((prefixes[i] + 'Hidden') in document) 
            return prefixes[i] + 'Hidden';
    }

    // otherwise it's not supported
    return null;
}

/**
 * Tell if the page is hidden (browser minimized or tab not visible).
 * @return {boolean} True is the page is hidden, else true.
 */
TimerLoop.prototype.isPageHidden = function () {
    var prop = this.getHiddenProp();
    if (!prop) return false;
    return document[prop];
}

/**
 * Function called when the visibility changes, the page becomes visible or hidden.
 * Used to pause the annimations when the BCC webapp is not visible.
 */
TimerLoop.prototype.visChange = function () {
    if (this.isPageHidden()){
        if(!this.isPaused){
            this.hiddenPause=true;
            this.pause();
        }
    }else{
        if(this.hiddenPause){
            this.hiddenPause=false;
            this.play();
        }
    }
};

/**
 * Add the DOM elements for the player (play and pause buttons), as children of the element defined by the selector passed to the timer constructor.
 * @param {boolean} extended - If true, the extended player will be added featuring additional buttons: fast forward, backward and fast backward.
 */
TimerLoop.prototype.addPlayer = function (extended) {
    this.player = $(this.selector);
    if(!this.player.hasClass('timerPlyer')){
        this.player.addClass('timerPlayer');
    }
    this.player.append('<div class="playerControl pause selectable" alt="pause" title="Pause"/>');
    this.player.append('<div class="playerControl play selectable" alt="play" title="Play"/>');
    this.player = $(this.player);
    this.player.children('.playerControl.pause').click(function(){this.pause()}.bind(this));
    this.player.children('.playerControl.play').click(function(){this.goForward(true)}.bind(this));
    if(extended) {
        this.player.append('<img class="playerControl extended fastbackward hover-highlight selectable" src="resources/img/button_black_fast_backward.gif" alt="fast backward" title="Fast backward" />')
        this.player.append('<img class="playerControl extended backward hover-highlight selectable" src="resources/img/button_black_play_back.gif" alt="play backward" title="Play backward" />');
        this.player.append('<img class="playerControl extended fastforward hover-highlight selectable" src="resources/img/button_black_fast_forward.gif" alt="fast forward" title="Fast forward" />');
        this.player.children('.playerControl.fastbackward').click(function(){this.goBackward(true,true)}.bind(this));
        this.player.children('.playerControl.backward').click(function(){this.goBackward(true)}.bind(this));
        this.player.children('.playerControl.fastforward').click(function(){this.goForward(true, true)}.bind(this));
    }
    
    if(this.isPaused){
        this.player.children('.playerControl.pause').addClass('selected');
    } else {
        this.player.children('.playerControl.play').addClass('selected');
    }
}
