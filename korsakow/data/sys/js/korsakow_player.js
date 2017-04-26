/* Browser compatibility as per http://tokenposts.blogspot.com.au/2012/04/javascript-objectkeys-browser.html
 */
if(!Object.keys) Object.keys = function(o){
    if (o !== Object(o))
        throw new TypeError('Object.keys called on non-object');
    var ret=[];
    for(var p in o) if(Object.prototype.hasOwnProperty.call(o,p)) ret.push(p);
    return ret;
};

/**
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex
 */
if (!Array.prototype.findIndex) {
  Object.defineProperty(Array.prototype, 'findIndex', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function(predicate) {
      if (this === null || typeof this === 'undefined') {
        throw new TypeError('Array.prototype.find called on null or undefined');
      }
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }
      var list = Object(this);
      var length = list.length >>> 0;
      var thisArg = arguments[1];
      var value;

      for (var i = 0; i < length; i++) {
        if (i in list) {
          value = list[i];
          if (predicate.call(thisArg, value, i, list)) {
            return i;
          }
        }
      }
      return -1;
    }
  });
}

/**
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
 */
if (!Array.prototype.find) {
  Object.defineProperty(Array.prototype, 'find', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function(predicate) {
      if (this === null || typeof this === 'undefined') {
        throw new TypeError('Array.prototype.find called on null or undefined');
      }
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }
      var list = Object(this);
      var length = list.length >>> 0;
      var thisArg = arguments[1];
      var value;

      for (var i = 0; i < length; i++) {
        if (i in list) {
          value = list[i];
          if (predicate.call(thisArg, value, i, list)) {
            return value;
          }
        }
      }
      return undefined;
    }
  });
}

/**
 * For PhantomJS
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
 */
if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
      if (typeof this !== "function") {
        // closest thing possible to the ECMAScript 5
        // internal IsCallable function
        throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
      }

      var aArgs = Array.prototype.slice.call(arguments, 1),
          fToBind = this,
          fNOP = function () {},
          fBound = function () {
            return fToBind.apply(this instanceof fNOP && oThis
                   ? this
                   : oThis,
                   aArgs.concat(Array.prototype.slice.call(arguments)));
          };

      fNOP.prototype = this.prototype;
      fBound.prototype = new fNOP();

      return fBound;
    };
}

//This is to fix the Javascript mod bug that returns an incorrect value when attempting to get the remainder of a negative number.  The prototype below will achieve the correct value.
Number.prototype.mod = function(n) {
    return ((this%n)+n)%n;
};

Number.isFinite = Number.isFinite || function(value) {
    return typeof value === "number" && isFinite(value);
};

Number.parseInt = Number.parseInt || parseInt; // phantomjs
Number.parseFloat = Number.parseFloat || parseFloat; // phantomjs

/* NameSpace
 *
 * Creates a hierarchy of objects matching the given path,
 * used to scope definitions. The first path element is created
 * as a property of window.
 *
 * Only creates missing parts of the path, so
 * NS('org.korsakow') will create two objects but a subsequent
 * NS('org.korsakow.domain') will only create one.
 *
 * @param ns a dot separated string of namespaces
 *
 * e.g. NS('org.korsakow.domain') is equivalent to
 * window.org = {
 *         korsakow: {
 *             domain: {}
 *         }
 *     }
 *
 * Subsequently you might define class MyDomainObject as
 * org.korsakow.domain.MyDomainObject = ...
 */
var NS = function(ns) {
    ns = ns.split('.');
    var ctx = window;
    for (var i = 0; i < ns.length; ++i) {
        var n = ns[i];
        if (!ctx[n])
            ctx[n] = {};
        ctx = ctx[n];
    }
    return ctx;
};

NS('org.korsakow');
NS('org.korsakow.domain');
NS('org.korsakow.domain.rule');
NS('org.korsakow.domain.widget');
NS('org.korsakow.media');

var Class = Prototype.Class;
/* Wrapper around Prototype.Class.create
 * (see http://prototypejs.org/learn/class-inheritance)
 *
 * - Applies org.korskow.Object as the supertype of all registered classes
 * - Creates the property class.qualifiedName
 *
 * @param name the fully qualified name of the class
 */
Class.register = function(name) {
    var args = jQuery.makeArray(arguments);
    args.shift();
    if (name !== 'org.korsakow.Object' && args.length >= 1 && !args[0].qualifiedName)
        args.unshift(org.korsakow.Object);
    var clazz = Class.create.apply(null, args);
    clazz.qualifiedName = name;

    var dotIndex = name.lastIndexOf('.');
    clazz.packageName = (function() {
        if (dotIndex !== -1)
            return name.substring(0, dotIndex);
        else
            return '';
    })();
    clazz.className = name.substring(dotIndex + 1);

    NS(clazz.packageName)[clazz.className] = clazz;

    return clazz;
};

Class.registerSingleton = function() {
    var clazz = Class.register.apply(this, arguments);
    var instance = new clazz();
    NS(clazz.packageName)[clazz.className] = instance;
    return instance;
};

/* Exception-safe wrapper for a function.
 *
 * Will catch and rethrow any exceptions after alerting. This is used to facilitate debugging.
 * In the future we might not rethrow - throwing from jQuery callbacks can have unexpected
 * results, for example.
 *
 */
org.korsakow.WrapCallback = function(f) {
    return function() {
        try {
            return f.apply(this, arguments);
        } catch (e) {
            org.korsakow.log.error('Uncaught exception in anonymous function: ' + e.fileName + "(" + e.lineNumber + "): " + e, e.stack);
            throw e;
        }
    };
};
org.korsakow.W = org.korsakow.WrapCallback;

/* The supertype of all classes.
 *
 * Defines methods and properties useful for debugging.
 *
 */
Class.register('org.korsakow.Object', {
    initialize: function(name) {
        this._uniqueId = ++org.korsakow.Object._uniqueIdGen;
    },
    getClass: function() {
        return this.__proto__.constructor;
    },
    toString: function(s) {
        return "[" + this.getClass().qualifiedName + "#" + this._uniqueId + ";" + (s?s:"") + "]";
    }
});
org.korsakow.Object._uniqueIdGen = 0;

/* Exception hierarchy is not currently used because we could not reliably
 * get file and line-number info this way.
 */
Class.register('org.korsakow.Exception', {
    initialize: function($super, message) {
        $super();
        this.message = message;
    },
    toString: function() {
        return "Exception: "+this.message;
    }
});

// for now we just throw regular javascript errors
org.korsakow.Exception = Error;
org.korsakow.NullPointerException = org.korsakow.Exception;
org.korsakow.Exception.getStackString = function() {
    return org.korsakow.Exception.getStackTrace().join("\n");
};

/* Browser-compatible stack trace
 *
 * http://www.eriwen.com/javascript/js-stack-trace/
 */
org.korsakow.Exception.getStackTrace = function() {
    var callstack = [];
    var isCallstackPopulated = false;
    try {
        i.dont.exist+=0; //doesn't exist- that's the point
    } catch(e) {
        if (e.stack) { //Firefox
            var lines = e.stack.split('\n');
            for (var i=0, len=lines.length; i<len; i++) {
//                if (lines[i].match(/^\s*[A-Za-z0-9\-_\$]+\(/)) {    // dr
                    callstack.push(lines[i]);
//                }    // dr
            }
            //Remove call to printStackTrace()
            callstack.shift();
            isCallstackPopulated = true;
        }
        else if (window.opera && e.message) { //Opera
            var lines = e.message.split('\n');
            for (var i=0, len=lines.length; i<len; i++) {
                if (lines[i].match(/^\s*[A-Za-z0-9\-_\$]+\(/)) {
                    var entry = lines[i];
                    //Append next line also since it has the file info
                    if (lines[i+1]) {
                        entry += ' at ' + lines[i+1];
                        i++;
                    }
                    callstack.push(entry);
                }
            }
            //Remove call to printStackTrace()
            callstack.shift();
            isCallstackPopulated = true;
        }
    }
    if (!isCallstackPopulated) { //IE and Safari
        var currentFunction = arguments.callee.caller;
        while (currentFunction) {
            var fn = currentFunction.toString();
            var fname = fn.substring(fn.indexOf("function") + 8, fn.indexOf('')) || 'anonymous';
            callstack.push(fname);
            currentFunction = currentFunction.caller;
        }
    }
    return callstack;    // dr
};


Class.register('org.korsakow.Enum', {
    initialize: function($super, values) {
        $super();
        this.values = Object.keys(values).map(function(name) {
            var ev = new org.korsakow.EnumValue(values[name], name);
            this[name] = ev;
            return ev;
        }.bind(this));
    },
    fromValue: function(value) {
        return this.values.find(function(e) {
            return e.value === value;
        });
    }
});
Class.register('org.korsakow.EnumValue', {
    initialize: function($super, value, label) {
        $super();
        this.value = value;
        this.label = label;
    },
    toString: function() {
        return 'Enum[' + this.label + ' = ' + this.value + ']';
    }
});

/* Supertype for factories
 *
 * Provides functionality for registering a class to an ID and creating
 * instances of classes by ID.
 */
Class.register('org.korsakow.Factory', org.korsakow.Object, {
    initialize: function($super, name) {
        $super();
        // dynamically setup static delegate methods in case the factory is a singleton
        var clazz = this.getClass();
        if (!clazz.create) {
            clazz.create = function() {
                return clazz.instance.create.apply(clazz.instance, arguments);
            };
        }
        if (!clazz.has) {
            clazz.has = function() {
                return clazz.instance.has.apply(clazz.instance, arguments);
            };
        }
        if (!clazz.register) {
            clazz.register = function() {
                return clazz.instance.register.apply(clazz.instance, arguments);
            };
        }

        this.name = name;
        this.registry = {};

    },
    register: function(id, clazz) {
        if (!clazz)
            throw new Error(this + " - Register with null clazz: " + id);
        this.registry[id] = clazz;
    },
    has: function(type) {
        return !!this.registry[type];
    },
    create: function(type, args) {
        var clazz = this.registry[type];
        if (!clazz)
            throw new Error(this +  " - No class registered for: \"" + type + "\"");
        var obj = new clazz(args);
        return obj;
    },
    toString: function() {
        return "[Factory: " + this.name + "]";
    }
});

/* Wrapper around logging.
 *
 */
Class.register('org.korsakow.Logger', org.korsakow.Object, {
    initialize: function($super) {
        $super();
    },
    trace: window.console && window.console.trace && window.console.trace.bind(window.console),
    debug: window.console && window.console.debug && window.console.debug.bind(window.console, 'DEBUG'),
    info: window.console  && window.console.log   && window.console.log.bind(window.console, 'INFO'),
    warn: window.console  && window.console.warn  && window.console.warn.bind(window.console, 'WARN'),
    error: window.console && window.console.error && window.console.error.bind(window.console, 'ERROR')
});

org.korsakow.log = new org.korsakow.Logger();

Class.register('org.korsakow.Random', org.korsakow.Object, {
    initialize: function($super) {
        $super();
    },
    random: function() {
        return Math.random();
    }
});
org.korsakow.random = new org.korsakow.Random();

Class.register('org.korsakow.TimeoutFactory', org.korsakow.Object, {
    initialize: function($super) {
        $super();
    },
    create: function(func, delay) {
        return window.setTimeout(func, delay);
    },
    clear: function(id) {
        window.clearTimeout(id);
    }
});
org.korsakow.Timeout = new org.korsakow.TimeoutFactory();

Class.register('org.korsakow.IntervalFactory', org.korsakow.Object, {
    initialize: function($super) {
        $super();
    },
    create: function(func, delay) {
        return window.setInterval(func, delay);
    },
    clear: function(id) {
        window.clearInterval(id);
    }
});
org.korsakow.Interval = new org.korsakow.IntervalFactory();

org.korsakow.setTimeout = function(func, delay) {
    return org.korsakow.Timeout.create.apply(org.korsakow.Timeout, arguments);
};
org.korsakow.clearTimeout = function(func, delay) {
    return org.korsakow.Timeout.clear.apply(org.korsakow.Timeout, arguments);
};

org.korsakow.setInterval = function(func, delay) {
    return org.korsakow.Interval.create.apply(org.korsakow.Interval, arguments);
};
org.korsakow.clearInterval = function(func, delay) {
    return org.korsakow.Interval.clear.apply(org.korsakow.Interval, arguments);
};

Class.register('org.korsakow.Utility', org.korsakow.Object, {
    initialize: function($super){
        $super();
    }
});

org.korsakow.identity = function(x) {
    return x;
};

org.korsakow.isValue = function(x) {
    switch (jQuery.type(x)) {
    case 'undefined':
    case 'null':
        return false;
    default:
        return true;
    }
};

org.korsakow.isDefined = function(x) {
    return jQuery.type(x) !== 'undefined';
};

/* Converts the number to a string and pads to the number of zeros
 *
 */
org.korsakow.Utility.leadingZeros = function(number, zeros){
    var n = "" + number;
    while(n.length < zeros){
        n = "0" + n;
    }
    return n;
};

/* Creates a string representation of a timestamp.
 *
 * Format: mm:ss
 *
 *
 * @param time the time in milliseconds
 */
org.korsakow.Utility.formatTime = function(time) {
    time /= 1000;

    var m = Math.floor(time / 60);
    var s = Math.floor(time % 60);

    return this.leadingZeros(m,2) + ":" + this.leadingZeros(s,2);
};

/* Gets the value of property on target, whether it is a value or a function.
 *
 * if the property is a function, the result of its invocation is returned,
 * otherwise the property is returned.
 *
 */
org.korsakow.Utility.apply = function(target, property) {
    if (typeof target[property] === "function")
        return target[property]();
    else
        return target[property];
};

/* Sets the value of property on target, whether it is a value or a function.
 *
 * if the property is a function, the function is called with value as an argument
 * otherwise the property is assigned to
 *
 * @param value the value to assign
 */
org.korsakow.Utility.update = function(target, property, value) {
    var current = target[property];
    if (typeof target[property] === "function")
        target[property](value);
    else
        target[property] = value;
};

/* Performs string interpolation of operators.
 *
 * Allows for smart accessors.
 *
 * e.g. applyOperators("+=10", 1) yields 11
 *
 * TODO: is this currently even used?
 *
 * @param value the value to assign
 */
org.korsakow.Utility.applyOperators = function(value, current) {
    var t;
    var vs = value?value.toString():"";
    // TODO: this looks broken since we don't strip off the operation
    if (vs.indexOf("+=") === 0)
        t = current + value;
    else if (vs.indexOf("-=") === 0)
        t = current - value;
    else if (vs.indexOf("*=") === 0)
        t = current * value;
    else if (vs.indexOf("%") === vs.length-1)
        t = current * value/100;
    else
        t = value;
    return t;
};

/* Browser compatible fullscreen toggling.
 *
 * derived from: http://johndyer.name/native-fullscreen-javascript-api-plus-jquery-plugin/
 */
Class.register('org.korsakow.FullScreenAPI',org.korsakow.Object,{
    initialize: function($super){
        $super();

        this.supportsFullScreen = false;
        this.fullScreenEventName = '';
        this.prefix = '';

        // check for native support
        if (typeof window.document.cancelFullScreen !== 'undefined') {
            this.supportsFullScreen = true;
        } else {
            // check for fullscreen support by vendor prefix
            var browserPrefixes = 'webkit moz o ms khtml'.split(' ');
            for (var i = 0, il = browserPrefixes.length; i < il; i++ ) {
                this.prefix = browserPrefixes[i];
                if (typeof window.document[this.prefix + 'CancelFullScreen' ] !== 'undefined' ) {
                    this.supportsFullScreen = true;
                    this.fullScreenEventName = this.prefix + 'fullscreenchange';
                    break;
                }
            }
        }
    },
    isFullScreen: function() {
        if(this.supportsFullScreen){
            switch (this.prefix) {
                case '':
                    return window.document.fullScreen;
                case 'webkit':
                    return window.document.webkitIsFullScreen;
                default:
                    return window.document[this.prefix + 'FullScreen'];
            }
        }
        else{
            return false;
        }
    },
    requestFullScreen: function(element) {
        if(this.supportsFullScreen){
            return (this.prefix === '') ? element.requestFullScreen() : element[this.prefix + 'RequestFullScreen']();
        }
        else return null;
    },
    cancelFullScreen: function(element) {
        if(this.supportsFullScreen){
            return (this.prefix === '') ? window.document.cancelFullScreen() : window.document[this.prefix + 'CancelFullScreen']();
        }
        else return null;
    }
});

/* Ties a function to an object.
 *
 * Returns a function wrapper that guarantees a specific value for "this"
 * when the actual target function is called. Useful when providing a callback.
 *
 * e.g.
 *     var foo = {
 *         value: 10
 *     };
 *     var bar = function() { return this.value; }
 *     var f = ftor(foo, bar);
 *
 *     f() // returns 10
 * }
 *
 * @param This the object which will be "this" in the execution context
 * @param func the function to call
 *
 * TODO: this is obviated by Function.bind
 */
Class.register('org.korsakow.Functor', {
});
org.korsakow.ftor =
org.korsakow.Functor.create = function(This, func) {
    return function() {
        func.apply(This, arguments);
    };
};

/* TODO: unused?
 *
 */
Class.register('org.korsakow.domain.Player', {

});

Class.register('org.korsakow.Date', org.korsakow.Object, {
});
/* Gets the current data/time in milliseconds.
 */
org.korsakow.Date.now = function() {
    return Date.now();
};

org.korsakow.location = function() {
    return window.location;
};

NS('org.korsakow.domain.rule');
NS('org.korsakow.domain.trigger');

/* Parent class for all domain objects (models)
 *
 */
Class.register('org.korsakow.domain.DomainObject', org.korsakow.Object, {
    initialize: function($super, id) {
        $super();
        this.id = id;
    },
    toString: function($super) {
        return $super("%"+this.id);
    }
});

Class.register('org.korsakow.domain.Keyword', org.korsakow.Object, {
    initialize: function($super, value, weight) {
        $super(null);
        this.value = value;
        this.weight = weight;
    },
    toString: function() {
        return "[Keyword value='"+this.value+"'; weight='"+this.weight+"']";
    }
});

/* Parent class for all Media types
 *
 * TODO: is this class useful?
 */
Class.register('org.korsakow.domain.Media', org.korsakow.domain.DomainObject, {
    initialize: function($super, id, filename) {
        $super(id);
        this.filename = filename;
    }
});

Class.register('org.korsakow.domain.Video', org.korsakow.domain.Media, {
    initialize: function($super, id, filename, subtitlesFilename) {
        $super(id, filename);
        this.subtitlesFilename = subtitlesFilename;
    }
});

Class.register('org.korsakow.domain.Sound', org.korsakow.domain.Media, {
    initialize: function($super, id, filename){
        $super(id,filename);

    }
});

Class.register('org.korsakow.domain.Image', org.korsakow.domain.Media, {
    initialize: function($super, id, filename, duration) {
        $super(id, filename);
        this.duration = duration;
    }
});

Class.register('org.korsakow.domain.Snu', org.korsakow.domain.DomainObject, {
    initialize: function($super, id, name, keywords, mainMedia, thumbnailMedia, previewMedia, interf, events, lives, looping, starter, ender, insertText, previewText, rating, backgroundSoundMode, backgroundSoundLooping, backgroundSoundMedia, backgroundSoundVolume) {
        $super(id);
        this.name = name;
        this.keyword = keywords;
        this.mainMedia = mainMedia;
        this.thumbnailMedia = thumbnailMedia;
        this.previewMedia = previewMedia;
        this.interface = interf;
        this.events = events;
        this.lives = lives;
        this.looping = looping;
        this.starter = starter;
        this.ender = ender;
        this.insertText = insertText;
        this.previewText = previewText;
        this.rating = rating;
        this.backgroundSoundMode = backgroundSoundMode;
        this.backgroundSoundLooping = backgroundSoundLooping;
        this.backgroundSoundMedia = backgroundSoundMedia;
        this.backgroundSoundVolume = backgroundSoundVolume;
    }
});

Class.register('org.korsakow.domain.Event', org.korsakow.domain.DomainObject, {
    initialize: function($super, id, predicate, trigger, rule) {
        $super(id);
        this.id = id;
        this.predicate = predicate;
        this.trigger = trigger;
        this.rule = rule;
    },
    setup: function(env) {
        var This = this;
        this.trigger.setup(env, function triggeredRule () {
            // TODO check the predicate
            This.rule.execute(env);
        });
    },
    destroy: function() {
        this.cancel();
    },
    cancel: function (env) {
        this.trigger.cancel();
    }
});

/**
 * Executes an event's rules after <time> seconds.
 */
Class.register('org.korsakow.domain.trigger.SnuTime', org.korsakow.domain.DomainObject, {
    initialize: function($super, id, time) {
        $super(id);
        this.id = id;
        this.time = time;
    },
    setup: function (env, callback) {
        var This = this,
            mainMediaUI = env.getMainMediaWidget().mediaUI;

        // This needs to happen inside setup() so if the same
        // trigger is loaded for a new SNU it isn't already marked
        // as done.
        this.cancelled = false;
        this.done = false;

        mainMediaUI.bind('timeupdate', function triggerTimeUpdate () {
            var curTime = mainMediaUI.currentTime();
            var ready = (This.done === false && This.cancelled === false);
            if (curTime >= This.time && ready) {
                org.korsakow.log.debug('SnuTime triggered at: ' + curTime/1000 + 's');
                This.done = true;
                callback();
            }
        });
    },
    cancel: function () {
        this.cancelled = true;
    }
});

Class.register('org.korsakow.domain.Interface', org.korsakow.domain.DomainObject, {
    initialize: function($super, id, name, keywords, widgets, clickSound, clickSoundVolume, backgroundColor, backgroundImage) {
        $super(id);
        this.name = name;
        this.keyword = keywords;
        this.widgets = widgets;
        this.clickSound = clickSound;
        this.clickSoundVolume = clickSoundVolume;
        this.backgroundColor = backgroundColor;
        this.backgroundImage = backgroundImage;
    }
});

Class.register('org.korsakow.domain.Project', org.korsakow.domain.DomainObject, {
    initialize: function($super, id, name, width, height, splashScreenMedia, backgroundSoundMedia, backgroundSoundVolume, backgroundSoundLooping, clickSound, clickSoundVolume, backgroundColor, backgroundImage, maxLinks) {
        $super(id);
        this.name = name;
        this.width = width;
        this.height = height;
        this.splashScreenMedia = splashScreenMedia;
        this.backgroundSoundMedia = backgroundSoundMedia;
        this.backgroundSoundLooping = backgroundSoundLooping;
        this.backgroundSoundVolume = backgroundSoundVolume;
        this.clickSound = clickSound;
        this.clickSoundVolume = clickSoundVolume;
        this.backgroundColor = backgroundColor;
        this.backgroundImage = backgroundImage;
        this.maxLinks = maxLinks;
    }
});

Class.register('org.korsakow.SearchResults', {
    initialize: function() {
        this.results = [];
        this.keywords = [];
    },
    indexOfSnu: function(snu) {
        for (var i = 0; i < this.results.length; ++i)
            if (this.results[i].snu.id === snu.id)
                return i;
        return -1;
    },
    resultOfSnu: function(snu) {
        for (var i = 0; i < this.results.length; ++i)
            if (this.results[i].snu.id === snu.id)
                return this.results[i];
        return null;
    },
    toString: function() {
        return "[org.korsakow.SearchResults]";
    }
});
Class.register('org.korsakow.SearchResult', {
    initialize: function(snu, score) {
        this.snu = snu;
        this.score = score;
    },
    addScore: function(value) {
        this.score += value * this.snu.rating;
    },
    toString: function() {
        return "[org.korsakow.SearchResult; snu="+this.snu.id+"("+this.snu.name+")]";
    }
});

NS('org.korsakow.domain.rule');

/* Parent class for rules
 *
 * TODO: is this class useful?
 */
Class.register('org.korsakow.domain.Rule', org.korsakow.domain.DomainObject, {
    initialize: function($super, id, keywords, type) {
        $super(id);
        this.keywords = keywords;
        this.type = type;
    },
    execute: function(env) {

    }
});

/* Finds SNUs that contain this rule's keywords. SNU's scores increases for
 * each keyword that matches.
 */
Class.register('org.korsakow.domain.rule.KeywordLookup', org.korsakow.domain.Rule, {
    initialize: function($super, id, keywords, type) {
        $super(id, keywords, type);
        // TODO: assert type == org.korsakow.rule.KeywordLookup
    },
    /*
     * @param searchResults {org.korsakow.SearchResults}
     */
    execute: function(env, searchResults) {
        org.korsakow.log.debug('KeywordLookup: ' + this.keywords);

        // for each time a snu appears in a list, increase its searchResults
        // (thus, snus searchResults proportionally to the number of keywords
        // they match)
        var currentSnu = env.getCurrentSnu();

        jQuery.each(this.keywords, function(i, keyword) {
            var dao = env.getDao();
            var snus = dao.findSnusWithKeyword(keyword.value);

            for (var j = 0; j < snus.length; ++j) {
                var snu = snus[j];
                if (snu === currentSnu || snu.lives === 0) {
                    continue;
                }

                var result;
                var index = searchResults.indexOfSnu(snu);

                if ( index === -1 ) {
                    result = new org.korsakow.SearchResult(snu, 0, keyword);
                    searchResults.results.push(result);
                } else {
                    result = searchResults.results[index];
                }
                result.score += env.getDefaultSearchResultIncrement() * snu.rating;
            }
        });
    }
});
/* Filters from the list any SNU that has any of this rule's    s
 *
 */
Class.register('org.korsakow.domain.rule.ExcludeKeywords', org.korsakow.domain.Rule, {
    initialize: function($super, id, keywords, type) {
        $super(id, keywords, type);
    },
    execute: function(env, searchResults) {
        jQuery.each(this.keywords, function(i, keyword) {
            var snusToExclude = env.getDao().findSnusWithKeyword(keyword.value);
            jQuery.each(snusToExclude, function(j, snu) {
                searchResults.results.splice( searchResults.indexOfSnu(snu), 1 );
            });
        });
    }
});

/* Performs a search by running a series of subrules. Results are displayed
 * in Preview widgets.
 */
Class.register('org.korsakow.domain.rule.Search', org.korsakow.domain.Rule, {
    initialize: function($super, id, keywords, type, rules, maxLinks, keepLinks) {
        $super(id, keywords, type);
        this.rules = rules;
        this.maxLinks = maxLinks;
        this.keepLinks = keepLinks;
    },
    execute: function(env) {
        var searchResults = this.doSearch(env);

        this.processSearchResults(env, searchResults);
    },
    doSearch: function(env) {
        var searchResults = new org.korsakow.SearchResults();
        jQuery.each(this.rules, function(i, rule) {
            rule.execute(env, searchResults);
        });

        org.korsakow.log.debug('Search yielded ' + searchResults.results.length + ' results');
        searchResults.results.sort(function(a, b) {
            if (b.score === a.score)
                return Math.random()>0.5?1:-1;

            return b.score - a.score;
        });
        return searchResults;
    },
    processSearchResults: function(env, searchResults) {
        var keepLinks = !!this.keepLinks;

        var allPreviews = env.getWidgetsOfType('org.korsakow.widget.Preview')
                .sort(function(a, b) {
                    return a.model.index - b.model.index;
                });

        var previews;
        if (keepLinks) {
            var unoccupiedPreviews = allPreviews.filter(function(p) {
                    return !p.getSnu();
                });
            previews = unoccupiedPreviews;
        } else {
            allPreviews.forEach(function(p) {
                p.clear();
            });
            previews = allPreviews;
        }

        function isAlreadyPreviewedSnu(snu) {
            return allPreviews.some(function(p) {
                return p.getSnu() && p.getSnu().id === snu.id;
            });
        }

        var maxLinks = org.korsakow.isValue(this.maxLinks)?this.maxLinks:null;
        if (!org.korsakow.isValue(maxLinks)) {
            maxLinks = org.korsakow.isValue(env.getProject().maxLinks)?env.getProject().maxLinks:null;
        }

        var numLinksCreated = 0;
        for (var i = 0; i < searchResults.results.length; ++i) {
            if (!previews.length) {
                org.korsakow.log.debug('No available previews.');
                break;
            }
            if (Number.isFinite(maxLinks) && numLinksCreated >= maxLinks) {
                org.korsakow.log.debug('Max links (' + maxLinks + ') reached.');
                break;
            }
            var snu = searchResults.results[i].snu;
            if (isAlreadyPreviewedSnu(snu)) {
                org.korsakow.log.debug('Snu (' + snu.id + '; ' + snu.name + ') is in results but already previewed, skipping.');
                continue;
            }
            var preview = previews.shift();
            preview.setSnu(snu);
            numLinksCreated += 1;
            org.korsakow.log.debug('Creating a link for SNU (' + snu.id + '; ' + snu.name + ') at Preview #' + preview.model.index);
        }
        org.korsakow.log.debug('Done creating links for search results. ' + (i) + ' results out of ' + searchResults.results.length + ' were displayed');
    }
});

NS('org.korsakow.domain.widget');

org.korsakow.domain.widget.ScalingPolicy = new org.korsakow.Enum({
    Fill: 'fill',
    Contain: 'contain',
    Cover : 'cover',
    None: 'none',
    ScaleDown: 'scale-down'
});

org.korsakow.domain.widget.PlayMode = new org.korsakow.Enum({
    Always: 'always',
    MouseOver: 'mouseOver',
    Click: 'click'
});

Class.register('org.korsakow.domain.widget.TextStyle', org.korsakow.Object, { // not a DO
    initialize: function($super, color, fontFamily, fontSize, fontStyle, fontWeight, textDecoration) {
        this.color = color;
        this.color = color;
        this.fontFamily = fontFamily;
        this.fontSize = fontSize;
        this.fontStyle = fontStyle;
        this.fontWeight = fontWeight;
        this.textDecoration = textDecoration;
    }
});

Class.register('org.korsakow.domain.widget.TextAlign', org.korsakow.Object, { // not a DO
    initialize: function($super, horizontal, vertical) {
        this.horizontal = horizontal;
        this.vertical = vertical;
    }
});

Class.register('org.korsakow.domain.Widget', org.korsakow.domain.DomainObject, {
    initialize: function($super, id, keywords, type, x, y, width, height) {
        if (this.getClass() === org.korsakow.domain.Widget)
            throw new org.korsakow.Exception("Widget is an Abstract class");
        $super(id);
        this.keyword = keywords;
        this.type = type;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
});

Class.register('org.korsakow.domain.widget.MainMedia', org.korsakow.domain.Widget, {
    initialize: function($super, id, keywords, type, x, y, width, height, scalingPolicy) {
        $super(id, keywords, type, x, y, width, height, scalingPolicy);
        this.scalingPolicy = scalingPolicy;
    }

});

Class.register('org.korsakow.domain.widget.Preview', org.korsakow.domain.Widget, {
    initialize: function($super, id, keywords, type, x, y, width, height, index, textStyle, textAlign, scalingPolicy, previewTextMode, previewTextEffect, previewOverlayColor) {
        $super(id, keywords, type, x, y, width, height);
        this.index = index;
        this.textStyle = textStyle;

        this.textAlign = textAlign;

        this.scalingPolicy = scalingPolicy;

        this.scalingPolicy = scalingPolicy;

        this.previewTextMode = previewTextMode;
        this.previewTextEffect = previewTextEffect;
        this.previewOverlayColor = previewOverlayColor;
    }
});
org.korsakow.domain.widget.Preview.PreviewTextMode = new org.korsakow.Enum({
    Always: 'always',
    MouseOver: 'mouseover'
});
org.korsakow.domain.widget.Preview.PreviewTextEffect = new org.korsakow.Enum({
    None: 'none',
    Animate: 'animate'
});

Class.register('org.korsakow.domain.widget.FixedPreview', org.korsakow.domain.Widget, {
    initialize: function($super, id, keywords, type, x, y, width, height, snuId, textStyle, textAlign, scalingPolicy, previewTextMode, previewTextEffect, previewOverlayColor) {
        $super(id, keywords, type, x, y, width, height);
        this.snuId = snuId;
        this.textStyle = textStyle;

        this.textAlign = textAlign;

        this.scalingPolicy = scalingPolicy;

        this.previewTextMode = previewTextMode;
        this.previewTextEffect = previewTextEffect;
        this.previewOverlayColor = previewOverlayColor;
    }
});


Class.register('org.korsakow.domain.widget.MediaArea', org.korsakow.domain.Widget, {
    initialize: function($super, id, keywords, type, x, y, width, height, mediaId, playMode, scalingPolicy) {
        $super(id, keywords, type, x, y, width, height);
        this.mediaId = mediaId;
        this.playMode = playMode;
        this.scalingPolicy = scalingPolicy;
    }
});
Class.register('org.korsakow.domain.widget.InsertText', org.korsakow.domain.Widget, {
    initialize: function($super, id, keywords, type, x, y, width, height, textStyle) {
        $super(id, keywords, type, x, y, width, height);
        this.textStyle = textStyle;
    }
});
Class.register('org.korsakow.domain.widget.IFrame', org.korsakow.domain.Widget, {
    initialize: function($super, id, keywords, type, x, y, width, height, url) {
        $super(id, keywords, type, x, y, width, height);
        this.url = url;
    }
});
Class.register('org.korsakow.domain.widget.HtmlBox', org.korsakow.domain.Widget, {
    initialize: function($super, id, keywords, type, x, y, width, height, html) {
        $super(id, keywords, type, x, y, width, height);
        this.html = html;
    }
});
Class.register('org.korsakow.domain.widget.PlayTime', org.korsakow.domain.Widget, {
    initialize: function($super, id, keywords, type, x, y, width, height, textStyle, textAlign) {
        $super(id, keywords, type, x, y, width, height);
        this.textStyle = textStyle;
        this.textAlign = textAlign;
    }
});
Class.register('org.korsakow.domain.widget.TotalTime', org.korsakow.domain.Widget, {
    initialize: function($super, id, keywords, type, x, y, width, height, textStyle, textAlign) {
        $super(id, keywords, type, x, y, width, height);
        this.textStyle = textStyle;
        this.textAlign = textAlign;
    }
});
Class.register('org.korsakow.domain.widget.Scrubber', org.korsakow.domain.Widget, {
    initialize: function($super, id, keywords, type, x, y, width, height, backgroundColor, foregroundColor, interactive, loadingColor, barWidth, barHeight) {
        $super(id, keywords, type, x, y, width, height);
        this.backgroundColor = backgroundColor;
        this.foregroundColor = foregroundColor;
        this.interactive = interactive;
        this.loadingColor = loadingColor;
        this.barWidth = barWidth;
        this.barHeight = barHeight;

    }
});

Class.register('org.korsakow.domain.widget.FullscreenButton', org.korsakow.domain.Widget, {
    initialize: function($super, id, keywords, type, x, y, width, height) {
        $super(id, keywords, type, x, y, width, height);
    }
});

Class.register('org.korsakow.domain.widget.MasterVolume', org.korsakow.domain.Widget, {
    initialize: function($super, id, keywords, type, x, y, width, height) {
        $super(id, keywords, type, x, y, width, height);
    }
});

Class.register('org.korsakow.domain.widget.PlayButton', org.korsakow.domain.Widget, {
    initialize: function($super, id, keywords, type, x, y, width, height) {
        $super(id, keywords, type, x, y, width, height);
    }
});

Class.register('org.korsakow.domain.widget.Subtitles', org.korsakow.domain.Widget, {
    initialize: function($super, id, keywords, type, x, y, width, height, textStyle) {
        $super(id, keywords, type, x, y, width, height);
        this.subtitles = [];
        this.textStyle = textStyle;
    }
});

Class.register('org.korsakow.domain.widget.SubtitleCuePoint', org.korsakow.domain.Widget, {
    initialize: function($super, id, keywords, type, x, y, width, height, name, subtitles, startTime, endTime) {
        $super(id, keywords, type, x, y, width, height);
        this.name = name;
        this.subtitles = new Array();
        this.subtitles = subtitles.slice(0);
        //for(var i = 0; i < subtitles.length; i++){this.subtitles[i] = subtitles[i];} //Alternate deep copy
        this.startTime = startTime;
        this.endTime = endTime;
    }
});

NS('org.korsakow.controller');

/* Abstract parent for controllers
 *
 * Each controller has a DIV to which its view gets added. This DIV establishes the view's
 * position and size.
 *
 */
Class.register('org.korsakow.controller.AbstractController', {
    initialize: function($super, model) {
        $super();
        this.model = model || {}; // default value is for jsmock limitation in tests (Object.setPrototypeOf should fix this)
        this.element = null;
        this.env = null;

        this.element = jQuery("<div />");
    },
    setup: function(env) {
        this.env = env;
    },
    destroy: function() {
        this.env = null;
        this.element.unbind();
        this.element.remove();
        this.element.empty();
        this.element = jQuery('<div />');
    }
});

NS('org.korsakow.controller');

Class.register('org.korsakow.controller.EmbedController', org.korsakow.controller.AbstractController, {
    initialize: function($super) {
        $super();
        this.element.addClass('EmbedController');
    },
    setup: function($super, env) {
        $super(env);

        var that = this;

        this.element.css({
            width: '100%',
            height: '100%'
        }).addClass('scalingPolicy-contain');

        // TODO: use a url handling lib
        var linkUrl = org.korsakow.EnvUtils.getFilmUrl() + '#snu=' + env.snuId;
        var linkButton = jQuery('<a />')
                            .attr('href', linkUrl)
                            .attr('target', '_blank')
                            .addClass('linkbutton')
                            .appendTo(this.element);

        this.getSnu(env.snuId)
            .then(function(snu) { return that.showThumbnail(snu); })
            .then(function(snu) { return that.playSnu(snu); });
    },
    playSnu: function(snu) {
        var deferred = jQuery.Deferred();

        var that = this;
        var mainMedia = snu.mainMedia;
        var mainMediaUI = org.korsakow.ui.MediaUIFactory.create(mainMedia.getClass().qualifiedName, mainMedia);
        mainMediaUI.element.attr('controls', '');

        mainMediaUI.one('canplay', function() {
            that.thumbnailUI.element.remove();
            that.element
                .prepend(mainMediaUI.element);

            mainMediaUI.play();
        });

        mainMediaUI.load(org.korsakow.EnvUtils.resolvePath(mainMedia.filename));

        return deferred.promise();
    },
    showThumbnail: function(snu) {
        var deferred = jQuery.Deferred();

        var thumbnailUI = this.thumbnailUI = org.korsakow.ui.MediaUIFactory.create(snu.thumbnailMedia.getClass().qualifiedName, snu.thumbnailMedia);
        thumbnailUI.load(org.korsakow.EnvUtils.resolvePath(snu.thumbnailMedia.filename));

        thumbnailUI.element
                    .css('cursor', 'pointer')
                    .click(function() {
            deferred.resolve(snu);
        });

        this.element
            .prepend(thumbnailUI.element);

        return deferred.promise();
    },
    getSnu: function(snuId) {
        var deferred = jQuery.Deferred();

        try {
            org.korsakow.log.debug('Attempting to embed snu#' + snuId);
            var snu = this.env.dao.findById(snuId);
            deferred.resolve(snu);
        } catch (e) {
            deferred.reject();
        }

        return deferred.promise();
    }
});


/* Handles creating an interface's view based on it's widgets.
 *
 */
org.korsakow.controller.InterfaceController = Class.register('org.korsakow.controller.InterfaceController', org.korsakow.controller.AbstractController, {
    initialize: function($super, model) {
        $super(model);
        this.controllers = [];
    },
    setup: function($super, env) {
        $super(env);

        this.element.addClass("interface")
            .css({
                width: '100%',
                height: '100%',
                'background-color': this.model.backgroundColor?this.model.backgroundColor:null
            });

        if (this.model.backgroundImage) {
            var imageUI = new org.korsakow.ui.ImageUI(this.model.backgroundImage);
            imageUI.element.addClass("backgroundImage")
                .css({
                    top: '0',
                    left: '0',
                    width: '100%',
                    position: 'absolute'
                });
            imageUI.load(env.resolvePath(this.model.backgroundImage.filename));
            this.element.append(imageUI.element);
        }

        for (var i = 0; i < this.model.widgets.length; ++i) {
            var widget = this.model.widgets[i];
            var widgetController;
            try {
                widgetController = org.korsakow.controller.WidgetControllerFactory.create(widget.type, widget);
            } catch (e) {
                org.korsakow.log.error(e, e.stack);

                /*
                    Removed the following throw.  It isn't being caught anywhere, and as long as there is
                    a MainMedia Widget (a condition that is checked for elsewhere), the Korsakow media
                    should still work, rather than crashing and showing nothing. --Phoenix 07-08-2104 (ddmmyy)
                */
                //throw e;
            }
            this.controllers.push(widgetController);
            this.element.append(widgetController.element);
        }
    },
    destroy: function($super) {
        this.controllers.forEach(function(ctrl) {
            ctrl.destroy();
        });
        this.controllers = [];
        $super();
    }
});

NS('org.korsakow.controller');

Class.register('org.korsakow.controller.MainController', org.korsakow.controller.AbstractController, {
    initialize: function($super) {
        $super();
        this.element.addClass('MainController');
    },
    setup: function($super, env) {
        $super(env);

        var shareTemplate = this.shareTemplate = jQuery(org.korsakow.templates['share']());
        env.rootElement.append(
            shareTemplate
        );
        env.rootElement.append(
            jQuery('<div />').attr('id', 'glassOverlay')
        );
        env.rootElement.append(
            jQuery('<div />').attr('id', 'pauseOverlay')
        );

        this.shareButton = jQuery('<div />')
                            .addClass('Share')
                            .hide()
                            .append(
                                jQuery('<div/>')
                                    .addClass('content')
                                    .text('Share')
                            );
        this.shareButton.click(function() {
            shareTemplate.show();
            shareTemplate.find('input:eq(0)').focus();

            var snuId = env.getCurrentSnu().id;
            var mainMedia = env.currentMainMedia;

            var baseUrl = window.location.toString();

            var baseUrl = (function() {
                var url = jQuery('#korsakow-js').prop('src');
                ['js', 'data', '/'].forEach(function(p) {
                    var index = url.lastIndexOf(p);
                    if (index !== -1)
                        url = url.substring(0, index);
                });
                return url;
            })();

            shareTemplate.find('.shareSNU').attr('disabled', false)
                .removeClass('disabled')
                .val(baseUrl + "#?snu=" + snuId);
            shareTemplate.find('.shareFilm').val(baseUrl);
            var args = [
                'snu:"'+snuId+'"',
                'width:"'+mainMedia.model.width+'"',
                'height:"'+mainMedia.model.height+'"',
                'baseUrl:"'+(baseUrl)+'"'
            ];
            var media = env.currentMainMedia;
            shareTemplate.find('.embedCode').attr('disabled', false)
                .removeClass('disabled')
                .text(
                    jQuery('<div />')
                    .append(
                        jQuery('<iframe />')
                            .attr('src', baseUrl+'#?embed='+snuId)
                            .attr('width', 560)
                            .attr('height', 315)
                    ).html()
                );
        });
        shareTemplate.bind('keydown', function(event) {
            if (event.which === 27)
                shareTemplate.hide();
        });
        shareTemplate.find('.button.close')
            .bind('click', function() {
                shareTemplate.hide();
            });

        this.executeSnuCommand = new org.korsakow.controller.maincontroller.ExecuteSnu(this);
        env.globalBindingElement.bind('keydown', this.onKeyDown.bind(this));
    },
    onKeyDown: function(event) {
        var SPACE = 32;
        var RIGHT_ARROW = 39;
        var ESCAPE = 27;
        var ONE = 49;
        var TWO = 50;
        var THREE = 51;
        var FOUR = 52;
        var FIVE = 53;
        var SIX = 54;
        var SEVEN = 55;
        var EIGHT = 56;
        var NINE = 57;
        var ZERO = 58;

        org.korsakow.log.debug('MainController.onKeyDown ', event.which);
        switch(event.which) {
            case SPACE:
                this.togglePause();
                break;
            case RIGHT_ARROW:
                this.skipToNext();
                break;
            case ESCAPE:
                this.shareTemplate.hide();
                break;
            case ONE:
            case TWO:
            case THREE:
            case FOUR:
            case FIVE:
            case SIX:
            case SEVEN:
            case EIGHT:
            case NINE:
            case ZERO:
                this.selectPreviewByIndex(event.which - ONE);
                break;
        }
    },
    skipToNext: function() {
        var mainMediaUI = this.env.getMainMediaWidget().mediaUI;
        var currentTime = mainMediaUI.currentTime();

        var wouldFire = this.env.getCurrentSnu().events.filter(function(event) {
            return event.rule.type === 'org.korsakow.rule.Search' &&
                   event.trigger.time > currentTime;
        }).sort(function(a, b) {
            return a.trigger.time - b.trigger.time;
        });

        if (wouldFire.length) {
            var next = wouldFire[0];

            org.korsakow.log.debug('skipping to next search at ' + next.trigger.time);
            mainMediaUI.currentTime(Math.max(next.trigger.time - 500, currentTime));
        }
    },
    selectPreviewByIndex: function(index) {
        var previews = this.env.getWidgetsOfType('org.korsakow.widget.Preview')
            .filter(function(p) {
                return !!p.getSnu();
            });
        var selected = previews.find(function(p) {
            return p.model.index === index;
        });
        org.korsakow.log.debug('selectPreviewByIndex ', !!selected, selected && selected.model.index);
        if (selected)
            this.executeSnu(selected.getSnu());
    },
    togglePause: function() {
        if (!this.env.currentMainMedia)
            return;

        // TODO: toggle background sounds

        if (this.env.currentMainMedia.paused()) {
            this.env.currentMainMedia.play();
            this.env.mainElement.siblings('#pauseOverlay').hide();
            this.env.findPreviews().forEach(function(p) {
                p.resume();
            });
        } else {
            this.env.currentMainMedia.pause();
            this.env.mainElement.siblings('#pauseOverlay').show();
            this.env.findPreviews().forEach(function(p) {
                p.pause();
            });
        }
    },
    executeSnu: function(snu) {
        this.executeSnuCommand.execute(this.env, snu);

        var that = this;
        this.env.interfaceController.element.one('k-preview-select', function(event, nextSnu) {
            that.executeSnu(nextSnu);
        });
    }
 });


Class.register('org.korsakow.controller.maincontroller.ExecuteSnu', {
    initialize: function(mainController) {
        this.mainController = mainController;
    },
    cleanup: function(env) {
        var This = this;

        if (env.currentSnu) {
            env.cancelEvents();
            env.currentSnu = null;
        }
        if (env.currentInterface) {
            env.interfaceController.destroy();
            env.interfaceController = null;
            env.currentInterface = null;
        }
        if (env.currentMainMedia) {
            env.currentMainMedia.mediaUI.unbind('.environment.currentSnu');
            env.currentMainMedia = null;
        }

        this.mainController.shareButton.hide();
    },
    setupSnu: function(env, snu) {
        var This = this;

        org.korsakow.log.debug('Executing SNU: ' + snu.name);

        env.currentSnu = snu;
        env.setLastSnu(snu.id);

        if(env.currentSnu.lives > 0){
            --env.currentSnu.lives;
        }

        env.currentInterface = env.currentSnu.interface;
        env.interfaceController = new org.korsakow.controller.InterfaceController(env.currentInterface);
        env.interfaceController.setup(env);
        for (var j = 0; j < env.interfaceController.controllers.length; ++j) {
            var ctrl = env.interfaceController.controllers[j];
            ctrl.setup(env);
            if (ctrl.model.type === 'org.korsakow.widget.MainMedia') {
                env.currentMainMedia = ctrl;
            }
        }
        if (!env.currentMainMedia) {
            org.korsakow.log.warn('Current interface has no MainMedia widget: ' + env.currentInterface);
        } else {
            env.currentMainMedia.mediaUI.bind('ended.environment.currentSnu', function() {
                This.onMainMediaEnded(env);
            });
        }

        env.mainElement.append(env.interfaceController.element);

        // handle BG sound
        switch(env.currentSnu.backgroundSoundMode){
            case "keep":
                break;
            case "clear":
                if(env.soundManager.channels['backgroundSound']){
                    env.soundManager.channels['backgroundSound'].audio.cancel();
                    delete env.soundManager.channels['backgroundSound'];
                }
                break;
            case "set":
                var prev = env.soundManager.channels['backgroundSound'];
                var next = env.resolvePath(env.currentSnu.backgroundSoundMedia.filename);
                if(prev && next){
                    if(prev.audio.url === next)
                        break;
                }
                env.soundManager.playSound({
                    uri:next,
                    channel:"backgroundSound",
                    fade:1000,
                    loop: env.currentSnu.backgroundSoundLooping,
                    volume: env.currentSnu.backgroundSoundVolume
                });
                break;
        }

        // set all audio/video components to the appropriate volume
        env.applyGlobalVolume();
    },
    setupEvents: function(env, snu) {
        for (var i = 0; i < snu.events.length; ++i) {
            snu.events[i].setup(env);
        }
    },
    execute: function(env, snu) {
        this.cleanup(env);
        this.setupSnu(env, snu);
        this.setupEvents(env, snu);
        this.setupShareButton(env);
    },
    onMainMediaEnded: function(env) {
        var This = this;
        if (env.currentSnu.ender) {
            org.korsakow.Timeout.create(function() {
                This.cleanup(env);
            }, 5000);
            return;
        }

        var previewsWithSnus = env.findPreviews().filter(function(p) {
            return !!p.getSnu();
        });
        var isTheEnd = !previewsWithSnus.length;
        if (!isTheEnd)
            return;
        org.korsakow.log.debug('Film has ended');
        var enders = env.getDao().findSnusFilter(function(snu) {
            return !!snu.ender;
        });
        var ender = enders[Math.floor(enders.length*org.korsakow.random.random())];
        org.korsakow.log.debug('End SNU: ' + (ender?ender.id:null));
        if (!ender)
            return;

        this.setupSnu(env, ender);
    },
    setupShareButton: function(env) {
        if (!env.currentMainMedia) // TODO: update test fixtures
            return;
        this.mainController.shareButton
            .appendTo(env.currentMainMedia.containerElement);
        var that = this;
        env.currentMainMedia.mediaUI.bind('mouseover', function(event) {
            that.mainController.shareButton.show();
        });
        env.currentMainMedia.mediaUI.bind('mouseout', function(event) {
            // ignore whether any other elements might have obscured it,
            // only care about bounds
            var element = env.currentMainMedia.mediaUI.element;
            if (event.offsetX < 0 || event.offsetX > element.width() ||
                event.offsetY < 0 || event.offsetY > element.height())
                that.mainController.shareButton.hide();
        });
    }
});

NS('org.korsakow.controller.widget');

/* Factory that creates widgets based on widgetId's. See the mapping at the bottom of file.
 *
 */
org.korsakow.controller.WidgetControllerFactory = new org.korsakow.Factory();

Class.register('org.korsakow.controller.AbstractWidgetController', org.korsakow.controller.AbstractController, {
    initialize: function($super, model) {
        $super(model);
    },
    setup: function($super, env) {
        $super(env);

        // anything wishing to interact with the widget's dom
        // as a blackbox should use this.element
        this.element
            .addClass("widget")
            .css({
                left: this.model.x,
                top: this.model.y,
                width: this.model.width,
                height: this.model.height
            });
        // widget implementations should add their content
        // to this.containerElement
        this.containerElement = jQuery('<div />')
            .addClass('container')
            .appendTo(this.element);

        var W = function(p) {
            return (100*p/env.project.width) + '%';
        };
        var H = function(p) {
            return (100*p/env.project.height) + '%';
        };

        this.element.css({
            left: W(this.model.x),
            top: H(this.model.y),
            width: W(this.model.width),
            height: H(this.model.height)
        });
    },
    destroy: function($super) {
        $super();
    },
    applyTextStyles: function(target) {
        var textStyle = this.model.textStyle && {
            'color': this.model.textStyle.color,
            'font-family': this.model.textStyle.fontFamily,
            'font-size': this.model.textStyle.fontSize + 'em',
            'font-weight': this.model.textStyle.fontWeight,
            'font-style': this.model.textStyle.fontStyle,
            'text-decoration': this.model.textStyle.textDecoration
        } || {};
        var textAlign = this.model.textAlign && {
            'text-align': this.model.textAlign.horizontal,
            'vertical-align': this.model.textAlign.vertical
        } || {};
        var css = jQuery.extend({}, textStyle, textAlign);
        target.css(css);
    },
    applyMediaStyles: function(target) {
        if (this.model.scalingPolicy) {
            this.element.addClass('scalingPolicy-' + this.model.scalingPolicy.value);
        }
    },
    applyStyles: function() {
        var contentTarget = this.contentElement && this.contentElement || this.element;
        var mediaTarget = this.element;

        this.applyTextStyles(contentTarget);
        this.applyMediaStyles(mediaTarget);
    }
});

Class.register('org.korsakow.controller.MainMediaWidgetController', org.korsakow.controller.AbstractWidgetController, {
    initialize: function($super, model) {
        $super(model);
    },
    setup: function($super, env) {
        $super(env);
        var that = this;

        var snu = env.getCurrentSnu();
        var media = snu.mainMedia;

        this.element.addClass("MainMedia");
        var mediaUI = this.mediaUI = env.createMediaUI(media.getClass().qualifiedName, media);
        this.containerElement.append(mediaUI.element);
        mediaUI.element.attr("loop", snu.looping?true:false);

        mediaUI.load(env.resolvePath(media.filename));
        mediaUI.play();

        if (org.korsakow.Support.isIOS && that.mediaUI) {
            // since iOS can only play one media at a time, they will
            // interrupt each other so we need a way to start them again.
            this.element.bind('click', function() {
                if (that.mediaUI.paused())
                    that.mediaUI.play();
                else
                    that.mediaUI.pause();
            });
        }

        this.applyStyles();
    },
    togglePlay: function() {
        var video = this.mediaUI;
        if (video.paused()) {
            video.play();
            return true;
        } else {
            video.pause();
            return false;
        }
    },
    destroy: function($super) {
    },
    paused: function() {
        return this.mediaUI && this.mediaUI.paused();
    },
    play: function() {
        this.mediaUI.play();
    },
    pause: function() {
        this.mediaUI.pause();
    }

});

Class.register('org.korsakow.controller.PreviewWidgetController', org.korsakow.controller.AbstractWidgetController, {
    initialize: function($super, model) {
        $super(model);
        this.mediaUI = null;
        this.snu = null;
    },
    setup: function($super, env) {
        $super(env);

        this.enterEvents = org.korsakow.Support.getMouseOverEvents();
        this.leaveEvents = org.korsakow.Support.getMouseOutEvents();

        this.element.addClass("Preview");
        this.previewElement = jQuery('<div/>')
            .addClass('previewText')
            .appendTo(this.containerElement);
        this.backgroundElement = jQuery('<div/>')
                .addClass('background')
                .appendTo(this.previewElement);
        this.contentElement = jQuery('<div/>')
                .addClass('content')
                .appendTo(this.previewElement);

        this.applyStyles(this.previewElement);
        this.backgroundElement.css({
            'background-color': this.model.previewOverlayColor
        });

        this.shouldPlay = false;
        var This = this;
        this.element.click(org.korsakow.W(function() {
            org.korsakow.Support.refreshMediaCacheIfMobile();

            if (!This.snu)
                return;

            var complete = function() {
                if (!This.snu)
                    return;
                This.element.trigger('k-preview-select', This.snu);
                env.setGlassOverlay(false);
            };

            var clickSound = env.getClickSound();
            if (clickSound) {
                env.setGlassOverlay(true);
                env.soundManager.playSound({
                    uri: env.resolvePath(clickSound.sound.filename),
                    channel: "clickSound",
                    fade: 1000,
                    volume: clickSound.volume,
                    complete: complete
                });
            } else
                complete();
        }));

        this.element.bind(this.enterEvents, function() {
            if (This.mediaUI) {
                This.mediaUI.play();
                This.shouldPlay = true;
            }
        });
        this.element.bind(this.leaveEvents, function() {
            if (This.mediaUI) {
                This.mediaUI.pause();
                This.shouldPlay = false;
            }
        });

        this.applyStyles();
    },
    destroy: function($super) {
        this.clear();
        $super();
    },
    setSnu: function(snu) {
        this.clear();
        var media = snu.previewMedia;
        if (org.korsakow.Support.isIOS && snu.previewImage) {
            media = snu.previewImage;
        }

        if (!media) {
            return;
        }
        var mediaUI = this.env.createMediaUI(media.getClass().qualifiedName, media);
        this.containerElement.prepend(mediaUI.element); // goes behind other elements
        mediaUI.load(this.env.resolvePath(media.filename));
        var that = this;
        mediaUI.one('canplay', function() {
            that.element.addClass('loaded');
        });
        mediaUI.loop(true);

        if (snu.previewText) {
            this.setupPreviewText(snu.previewText);
        }


        this.snu = snu;
        this.mediaUI = mediaUI;
    },
    getSnu: function() {
        return this.snu;
    },
    clear: function() {
        this.element.removeClass('loaded');
        if (this.mediaUI !== null) {
            this.mediaUI.pause();
            this.containerElement.empty();
        }
        if (this.tween) {
            this.tween.cancel();
        }
        this.mediaUI = null;
        this.snu = null;
    },
    resume: function() {
        if (this.shouldPlay) {
            this.play();
        }
    },
    play: function() {
        this.mediaUI && this.mediaUI.play();
    },
    pause: function() {
        this.mediaUI && this.mediaUI.pause();
    },
    applyPreviewText: function(text) {
        this.previewElement.toggleClass('active', !!text);
        switch (this.model.previewTextEffect) {
            case org.korsakow.domain.widget.Preview.PreviewTextEffect.None:
                this.contentElement.html(text);
                break;
            case org.korsakow.domain.widget.Preview.PreviewTextEffect.Animate:
                var charsPerSecond = 25;
                var duration = text.length*1000/charsPerSecond;
                if (this.tween) {
                    this.tween.cancel();
                }
                var x;
                this.tween = org.korsakow.Tween.run(duration, 0, text.length, function(event, t) {
                    this.contentElement.html(text.substring(0, t));
                }.bind(this));
                this.tween.start();
                break;
            default:
                org.korsakow.log.warn('unknown previewTextEffect: ' + this.model.previewTextEffect);
                break;
        }
    },
    setupPreviewText: function(text) {
        switch (this.model.previewTextMode) {
            case org.korsakow.domain.widget.Preview.PreviewTextMode.Always:
                this.applyPreviewText(text);
                break;
            case org.korsakow.domain.widget.Preview.PreviewTextMode.MouseOver:
                this.element.bind(this.enterEvents, function() {
                    this.applyPreviewText(text);
                }.bind(this));
                this.element.bind(this.leaveEvents, function() {
                    this.applyPreviewText('');
                }.bind(this));
                break;
            default:
                org.korsakow.log.warn('unknown previewTextMode: ' + this.model.previewTextMode);
                break;
        }
    }
});

Class.register('org.korsakow.controller.FixedPreviewWidgetController', org.korsakow.controller.PreviewWidgetController, {
    setup: function ($super, env) {
        $super(env);
        var snu = env.dao.findById(this.model.snuId);
        this.setSnu(snu);
    }
});

Class.register('org.korsakow.controller.MediaAreaWidgetController', org.korsakow.controller.AbstractWidgetController, {
    initialize: function($super, model) {
        $super(model);
        this.mediaUI = null;
    },
    setup: function($super, env) {
        $super(env);
        var that = this;

        this.element.addClass("MediaArea");

        var media = env.getDao().findMediaById(this.model.mediaId);
        if (!media) {
            return;
        }
        var mediaUI = this.mediaUI = this.env.createMediaUI(media.getClass().qualifiedName, media);
        this.containerElement.append(mediaUI.element);
        mediaUI.load(this.env.resolvePath(media.filename));
        mediaUI.one('canplay', function() {
            that.element.addClass('loaded');
        });
        mediaUI.loop(!!this.model.looping);

        this.setupPlayMode();

        this.applyStyles();
    },
    destroy: function($super) {
        this.clear();
        $super();
    },
    clear: function() {
        this.element.removeClass('loaded');
        if (this.mediaUI !== null) {
            this.mediaUI.pause();
            this.containerElement.empty();
        }
        this.mediaUI = null;
    },
    setupPlayMode: function() {
        var that = this;

        function alwaysMode() {
            that.mediaUI.play();
        }

        function clickMode() {
            that.element.bind('click', function() {
                if (that.mediaUI) {
                    that.mediaUI.play();
                }
            });
        }

        function overMode() {
            that.element.bind(org.korsakow.Support.getMouseOverEvents(), function() {
                if (that.mediaUI) {
                    that.mediaUI.play();
                }
            });
            that.element.bind(org.korsakow.Support.getMouseOutEvents(), function() {
                if (that.mediaUI) {
                    that.mediaUI.pause();
                }
            });
        }

        switch (this.model.playMode) {
            case org.korsakow.domain.widget.PlayMode.Always:
                alwaysMode();
                break;

            case org.korsakow.domain.widget.PlayMode.MouseOver:
                overMode();
                break;

            case org.korsakow.domain.widget.PlayMode.Click:
                clickMode();
                break;

            default:
                org.korsakow.log.warn('unknown playMode: ' + this.model.playMode);
                alwaysMode();
                break;
        }
    },
    play: function() {
        this.mediaUI && this.mediaUI.play();
    },
    pause: function() {
        this.mediaUI && this.mediaUI.pause();
    }
});
Class.register('org.korsakow.controller.InsertTextWidgetController', org.korsakow.controller.AbstractWidgetController, {
    initialize: function($super, model) {
        $super(model);
    },
    setup: function($super, env) {
        $super(env);

        this.element.addClass("InsertText");

        this.contentElement = jQuery("<div>")
            .addClass('content')
            .html(env.getCurrentSnu().insertText).css({
                'width' : '100%',
                'height' : '100%'
            });
        this.containerElement.append(this.contentElement);

        this.applyStyles();
    }
});
Class.register('org.korsakow.controller.IFrameWidgetController', org.korsakow.controller.AbstractWidgetController, {
    initialize: function($super, model) {
        $super(model);
    },
    setup: function($super, env) {
        $super(env);
        var that = this;

        this.element.addClass("IFrame");

        if (this.model.url) {
            org.korsakow.log.debug('IFrame widget: ', this.model.url.substring(0, 256)); // substr in case e.g. data uri
            this.contentElement = jQuery("<iframe>");
            this.contentElement.attr('src', this.model.url)
                .bind('load', function() {
                    that.element.addClass('loaded');
                });
            this.containerElement.append(this.contentElement);
        }
        this.applyStyles();
    }
});
Class.register('org.korsakow.controller.HtmlBoxWidgetController', org.korsakow.controller.AbstractWidgetController, {
    initialize: function($super, model) {
        $super(model);
    },
    setup: function($super, env) {
        $super(env);
        var that = this;

        this.element.addClass("HtmlBox");

        if (this.model.html) {
            org.korsakow.log.debug('HtmlBox widget: ', this.model.html.substring(0, 256));
            // we use an iframe to sandbox the content and prevent it from breaking the film
            // ... but this also somewhat prevents users from easily doing some potentially fun stuff
            // though at least they should be able to use JS to escape the jail
            this.contentElement = jQuery("<iframe>").attr('src', 'about:blank')
                .bind('load', function() {
                    that.element.addClass('loaded');
                    that.contentElement.contents().find('html').html(that.model.html);
                });
            this.containerElement.append(this.contentElement);
        }
        this.applyStyles();
    }
});

Class.register('org.korsakow.controller.PlayButtonWidgetController', org.korsakow.controller.AbstractWidgetController, {
    initialize: function($super, model) {
        $super(model);
    },
    setup: function($super, env) {
        $super(env);
        this.element.addClass("PlayButton");

        var This = this;
        var mainMedia = env.getMainMediaWidget();
        var vid = mainMedia.mediaUI;

        this.element.click(function() {
            mainMedia.togglePlay();
        });

        vid.bind('ended', function() {
            var stillPlaying = false;
            if (!vid.ended())
                stillPlaying = true;
            if (!stillPlaying) {
                This.setPause();
            }
        });
        vid.bind('pause', function() {
            var stillPlaying = false;
            if (!vid.paused())
                stillPlaying = true;
            if (!stillPlaying) {
                This.setPause();
            }
        });

        vid.bind('play', function() {
            This.setPlay();
        });

        this.applyStyles();
    },
    setPlay: function() {
        this.element.removeClass("paused");
        this.element.addClass("playing");
    },
    setPause: function() {
        this.element.removeClass("playing");
        this.element.addClass("paused");
    }
});

Class.register('org.korsakow.controller.PlayTimeWidgetController', org.korsakow.controller.AbstractWidgetController, {
    initialize: function($super, model) {
        $super(model);
    },
    setup: function($super, env) {
        $super(env);

        this.element.addClass("PlayTime");
        var contentElement = this.contentElement = jQuery("<div>").addClass('content')
                                     .text(org.korsakow.Utility.formatTime(0))
                                     .appendTo(this.containerElement);
        this.applyStyles(this.contentElement);

        var mainMedia = env.getMainMediaWidget();
        var mediaUI = mainMedia.mediaUI;
        mediaUI.bind("timeupdate", function() {
            contentElement.text(org.korsakow.Utility.formatTime(mediaUI.currentTime()));
        });

        this.applyStyles();
    }
});

Class.register('org.korsakow.controller.TotalTimeWidgetController', org.korsakow.controller.AbstractWidgetController, {
    initialize: function($super, model) {
        $super(model);
    },
    setup: function($super, env) {
        $super(env);

        this.element.addClass("TotalTime");
        var contentElement = this.contentElement = jQuery("<div>").addClass('content')
                                     .text(org.korsakow.Utility.formatTime(0))
                                     .appendTo(this.containerElement);
        this.applyStyles(this.contentElement);

        var mainMedia = env.getMainMediaWidget();
        var vid = mainMedia.mediaUI;
        vid.bind("canplay", function() {
            var newTime = org.korsakow.Utility.formatTime(vid.duration());
            contentElement.text(newTime);
        });

        this.applyStyles();
    }
});
Class.register('org.korsakow.controller.ScrubberWidgetController', org.korsakow.controller.AbstractWidgetController, {
    initialize: function($super, model) {
        $super(model);
    },
    setup: function($super, env) {
        $super(env);

        this.element.addClass("Scrubber").css({
            'background-color' : this.model.backgroundColor
        });

        var mainMedia = env.getMainMediaWidget();
        var vid = mainMedia.mediaUI;

        var This = this;

        var bufferBar = jQuery("<div>").addClass('buffer').css({
            'background-color' : this.model.loadingColor,
            'height': this.model.barHeight + 'px'
        });

        var positionBar = jQuery("<div>").addClass('progress').css({
            'background-color' : this.model.foregroundColor,
            'width' : this.model.barWidth + "px",
            'height' : this.model.barHeight + "px"
        });

        vid.bind("progress", function() {
            bufferBar.css({
                'width': (100 * vid.buffered() / vid.duration()) + "%"
            });
        });

        vid.bind("timeupdate", function() {
            var pos = (100 * vid.currentTime() / vid.duration()) + "%";
            positionBar.css({
                'left' : pos
            });
        });

        if (this.model.interactive) {
            var positionMoved = function(e) {
                if (vid.ended()) {
                    vid.play();
                }
                var time = (e.pageX-This.model.x)/This.model.width;
                vid.currentTime(time * vid.duration());
            };
            this.element.click(function(e) {
                positionMoved(e);
            });
            this.element.mousedown(function(e) {
                This.mouseDown = true;
            });
            this.element.mouseup(function(e) {
                This.mouseDown = false;
            });
            this.element.mousemove(function(e) {
                if (This.mouseDown) {
                    positionMoved(e);
                }
            });
        }

        this.containerElement.append(bufferBar);
        this.containerElement.append(positionBar);

        this.applyStyles();
    }
});

Class.register('org.korsakow.controller.FullscreenButtonWidgetController', org.korsakow.controller.AbstractWidgetController, {
    initialize: function($super, model) {
        $super(model);
    },
    setup: function($super, env) {
        $super(env);

        this.element.addClass('FullscreenButton').addClass('closed');
        var fs = new org.korsakow.FullScreenAPI();
        var This = this;
        this.element.click(function() {
            var element = env.rootElement;
            if (This.element.hasClass('closed')) {
                fs.requestFullScreen(element[0]);
                This.element.removeClass('closed');
                This.element.addClass('open');
            }else{
                fs.cancelFullScreen(element[0]);
                This.element.removeClass('open');
                This.element.addClass('closed');
            }
        });

        this.applyStyles();
    }
});

Class.register('org.korsakow.controller.MasterVolumeWidgetController', org.korsakow.controller.AbstractWidgetController, {
    initialize: function($super, model) {
        $super(model);
    },
    setup: function($super, env) {
        $super(env);

        this.element.addClass('MasterVolume');
        var handleElement = this.handleElement = jQuery('<div>')
                        .addClass('handle')
                        .appendTo(this.containerElement);
        this.updateSlider(env.getGlobalVolume());
        var This = this;

        this.element.click(function(e) {
            var vol = e.offsetX / This.element.width();
            env.setGlobalVolume(vol);
            This.updateSlider(vol);
        });
        this.element.mousedown(function(e) {
            This.mouseIsDown = true;
            env.globalBindingElement.one('mouseup', function(e) {
                This.mouseIsDown = false;
            });
        });
        this.element.mousemove(function(e) {
            if (This.mouseIsDown) {
                var vol = e.offsetX / This.element.width();
                env.setGlobalVolume(vol);
                This.updateSlider(vol);
            }
        });

        this.applyStyles();
    },
    updateSlider: function(vol) {
        vol = Math.max(vol, 0);
        vol = Math.min(vol, 1);
        this.handleElement.css({
            'left' : (vol*100) + '%'
        });
    }

});

Class.register('org.korsakow.controller.SubtitlesController', org.korsakow.controller.AbstractWidgetController, {
    initialize: function($super, model) {
        $super(model);
    },
    setup: function($super, env) {
        $super(env);
        var This = this;
        var snu = env.getCurrentSnu();
        var media = snu.mainMedia;
        this.element.addClass("SubtitlesWidget");
        var mediaUI = this.mediaUI = env.createMediaUI('org.korsakow.domain.Subtitles');
        this.containerElement.append(mediaUI.element);

        var stFile = env.resolvePath(media.subtitlesFilename);
        if (stFile) {
            this.parseSubtitles(stFile, function onSubtitleDownload() {
                var mainmedia = env.getMainMediaWidget();
                var vid = mainmedia.mediaUI;
                vid.bind('timeupdate', function subtitleTimeUpdate(event) {
                    This.handleTimeUpdate(vid.currentTime());
                });
                vid.bind('ended', function subtitleTimeUpdate(event) {
                    This.mediaUI.text('');
                });
            });
        }

        this.applyStyles();
    },
    handleTimeUpdate: function(time) {
        var cuepoint = this.cuePoints.find(function(cuepoint) {
//            org.korsakow.log.info(cuepoint.time, '<=', time, '&&', time < (cuepoint.time + cuepoint.duration));
            return cuepoint.time <= time && time < (cuepoint.time + cuepoint.duration);
        });
        this.mediaUI.text(cuepoint ? cuepoint.subtitle : []);
    },
    getSubtitles: function() {
        return this.model.subtitles;
    },
    parseSubtitles: function(filePath, cb) {
        var This = this;
        var cuePoints = new Array();
        this.env.ajax({
            url: filePath,
            dataType: 'text',
            success: function(data) {
                var parser = new org.korsakow.util.SubtitleParserFactory().parser(filePath);
                var cuePoints = parser ? parser.parse(data) : [];
                This.cuePoints = cuePoints;
                cb();
            }
        }); //ajax request

    }
});

org.korsakow.controller.WidgetControllerFactory.register("org.korsakow.widget.Subtitles", org.korsakow.controller.SubtitlesController);
org.korsakow.controller.WidgetControllerFactory.register("org.korsakow.widget.MainMedia", org.korsakow.controller.MainMediaWidgetController);
org.korsakow.controller.WidgetControllerFactory.register("org.korsakow.widget.MediaArea", org.korsakow.controller.MediaAreaWidgetController);
org.korsakow.controller.WidgetControllerFactory.register("org.korsakow.widget.Preview", org.korsakow.controller.PreviewWidgetController);
org.korsakow.controller.WidgetControllerFactory.register("org.korsakow.widget.FixedPreview", org.korsakow.controller.FixedPreviewWidgetController);
org.korsakow.controller.WidgetControllerFactory.register("org.korsakow.widget.InsertText", org.korsakow.controller.InsertTextWidgetController);
org.korsakow.controller.WidgetControllerFactory.register("org.korsakow.widget.IFrame", org.korsakow.controller.IFrameWidgetController);
org.korsakow.controller.WidgetControllerFactory.register("org.korsakow.widget.HtmlBox", org.korsakow.controller.HtmlBoxWidgetController);
org.korsakow.controller.WidgetControllerFactory.register("org.korsakow.widget.PlayButton", org.korsakow.controller.PlayButtonWidgetController);
org.korsakow.controller.WidgetControllerFactory.register("org.korsakow.widget.PlayTime", org.korsakow.controller.PlayTimeWidgetController);
org.korsakow.controller.WidgetControllerFactory.register("org.korsakow.widget.TotalTime", org.korsakow.controller.TotalTimeWidgetController);
org.korsakow.controller.WidgetControllerFactory.register("org.korsakow.widget.Scrubber", org.korsakow.controller.ScrubberWidgetController);
org.korsakow.controller.WidgetControllerFactory.register("org.korsakow.widget.FullscreenButton", org.korsakow.controller.FullscreenButtonWidgetController);
org.korsakow.controller.WidgetControllerFactory.register("org.korsakow.widget.MasterVolume", org.korsakow.controller.MasterVolumeWidgetController);

NS('org.korsakow');

Class.register('org.korsakow.Player',org.korsakow.Object, {
    initialize: function($super, dao, window, globalElement, rootElement) {
        $super();
        this.dao = dao;
        this.window = window;
        this.globalElement = globalElement;
        this.rootElement = rootElement;
    },

    findStartSnu: function() {
        var startSnus = this.dao.findSnusFilter(function(s) {
            return s.starter;
        });
        if (!startSnus.length) {
            org.korsakow.log.debug('Film has no start Snus');

            startSnus = this.dao.findSnus();
        }

        return startSnus[Math.floor(Math.random() * startSnus.length)];
    },

    setBackgroundColor: function() {
        if (this.env.project.backgroundColor) {
            this.globalElement.css({'background-color': this.env.project.backgroundColor});
        }
    },
    showLogo: function() {
        var that = this;

        function load() {
            var deferred = jQuery.Deferred();

            // must be an image: we want it to play without user gesture, esp since
            // we use its click to workaround the restriction.
            var logoMedia = new org.korsakow.domain.Image(-1, 'sys/images/klogo.gif');
            var logoUI = that.env.createMediaUI(logoMedia.getClass().qualifiedName, logoMedia);
            logoUI.load(that.env.resolvePath(logoMedia.filename));
            logoUI.element.addClass('KLogo');
            logoUI.one('load', function() {
                deferred.resolve(logoUI);
            });
            logoUI.one('error', function() {
                org.korsakow.Bootstrap.showBreakingError('project-load-failed', 'Some files seem to be missing.');
                deferred.reject();
            });

            var centerContainer = jQuery('<div/>')
                .addClass('scalingPolicy-scale-down');
            centerContainer.append(logoUI.element);
            that.mainElement.append(centerContainer);

            return deferred.promise();
        }

        function regular(logoUI) {
            var deferred = jQuery.Deferred();

            var dismiss = function() {
                logoUI.element.parent().remove();
                deferred.resolve();
            };

            that.rootElement.one('click', org.korsakow.W(dismiss));
            org.korsakow.setTimeout(org.korsakow.W(dismiss), 4000); // approximate duration of klogo.gif

            return deferred.promise();
        }

        function mobile(logoUI) {
            var deferred = jQuery.Deferred();

            var dismiss = function() {
                org.korsakow.Support.refreshMediaCacheIfMobile(); // must happen on a user gesture
                logoUI.element.parent().remove();
                deferred.resolve();
            };

            that.rootElement.one('click', org.korsakow.W(dismiss));

            return deferred.promise();
        }

        var promise = load();

        if (org.korsakow.Support.isMobile)
            return promise.then(mobile);
        else
            return promise.then(regular);
    },
    showSplashScreen: function() {
        var deferred = jQuery.Deferred();

        if (this.env.project.splashScreenMedia) {
            var dismiss = function() {
                centerContainer.remove();
                deferred.resolve();
            };

            var splashScreenUI = this.env.createMediaUI(this.env.project.splashScreenMedia.getClass().qualifiedName, this.env.project.splashScreenMedia);
            splashScreenUI.load(this.env.resolvePath(this.env.project.splashScreenMedia.filename));
            splashScreenUI.element.addClass('SplashScreen');

            splashScreenUI.element.click(org.korsakow.W(dismiss));
            splashScreenUI.bind('ended', org.korsakow.W(dismiss));
            splashScreenUI.bind('error', org.korsakow.W(dismiss));

            var centerContainer = jQuery('<div/>')
                .css({
                width: '100%',
                height: '100%',
                'text-align': 'center'
            })
                .addClass('scalingPolicy-contain');
            centerContainer.append(splashScreenUI.element);
            this.mainElement.append(centerContainer);
            splashScreenUI.play();
        } else
            deferred.resolve();

        return deferred.promise();
    },

    showContinueScreen: function() {
        var that = this;

        var deferred = jQuery.Deferred();

        if (this.env.getLastSnu()) {
            org.korsakow.log.debug('Attempting to continue from continue-Snu #' + this.env.getLastSnu());
            //test the last snu and make sure it's legit
            var continueSnu = (function() {
                try {
                    return that.dao.findById(that.env.getLastSnu());
                } catch (e) {
                    return null;
                }
            })();

            if (!continueSnu) {
                org.korsakow.log.debug("Continue-Snu is not valid");
                this.env.clearLastSnu();
                deferred.reject();
            } else {
                var contScr = jQuery("<div/>", { "id": "continueScreen" }).appendTo(this.env.mainElement).show();
                var buttonContainer = jQuery("<div/>").addClass("buttonContainer").appendTo(contScr);
                jQuery("<p/>", { "text": "Would you like to continue from where you left off?"}).appendTo(buttonContainer);
                var resetButton = jQuery("<button/>")
                    .text("Reset");
                var continueButton = jQuery("<button/>")
                    .text("Continue");
                resetButton.appendTo(buttonContainer);
                continueButton.appendTo(buttonContainer);
                resetButton.click(function() {
                    that.env.clearLastSnu();
                    contScr.remove();
                    deferred.reject();
                });
                continueButton.click(function() {
                    contScr.remove();
                    deferred.resolve(continueSnu);
                });
            }
        } else {
            org.korsakow.log.debug('No continue Snu, starting from the beginning');
            deferred.reject();
        }

        return deferred.promise();
    },

    playFirstSnu: function() {
        var that = this;

        function setBackgroundSound() {
            if (that.env.project.backgroundSoundMedia) {
                that.env.soundManager.playSound({
                    uri: this.env.resolvePath(this.env.project.backgroundSoundMedia.filename),
                    channel:"backgroundSound", // TODO: make into const
                    fade:0,
                    loop: this.env.project.backgroundSoundLooping,
                    volume: this.env.project.backgroundSoundVolume
                });
            }
        }

        function setBackgroundImage() {
            if (that.env.project.backgroundImage) {
                var imageUI = new org.korsakow.ui.ImageUI(that.env.project.backgroundImage);

                imageUI.element.addClass("backgroundImage")
                    .css({
                        width: '100%',
                        height: 'auto',
                        position: 'absolute'
                    });
                imageUI.load(that.env.resolvePath(that.env.project.backgroundImage.filename));

                that.mainElement.append(imageUI.element);
            }
        }

        function beginPlaying(snu) {
            that.mainController.setup(that.env);

            setBackgroundSound();
            setBackgroundImage();
            org.korsakow.log.debug('Starting film from Snu: ' + snu);
            that.mainController.executeSnu(snu);
        }

        function continueFromUrl() {
            var deferred = jQuery.Deferred();

            var idFromUrl = parseInt(that.window.location.hash.replace(/[^a-zA-Z]*snu=(\d+)[?&]*/, '$1'));
            if (!Number.isFinite(idFromUrl))
                deferred.reject();
            else {
                try {
                    org.korsakow.log.debug('Attempting to continue from url-Snu #' + idFromUrl);
                    var snu = that.dao.findById(idFromUrl);
                    deferred.resolve(snu);
                } catch (e) {
                    deferred.reject();
                }
            }
            return deferred.promise();
        }

        continueFromUrl()
            .then(null, function() { return that.showContinueScreen(); })
            .then(beginPlaying)
            .fail(function() {
                org.korsakow.log.warn('No continue snu found, finding a random start snu');
                var startSnu = that.findStartSnu();
                if (startSnu) {
                    beginPlaying(startSnu);
                } else {
                    org.korsakow.log.warn('No start snu found, nothing to do');
                }
            });
    },

    /* Bootstraps the application.
     *
     * @param dao an {org.korsakow.domain.Dao}
     */
    start: function() {
        var that = this;

        org.korsakow.log.info("Is iOS? " + org.korsakow.Support.isIOS);
        org.korsakow.log.info("Is Android? " + org.korsakow.Support.isAndroid);

        if (org.korsakow.Support.isMobile) {
            org.korsakow.log.info('Mobile detected');
            org.korsakow.log.info(' Installing PrecachedMediaElementFactory');
            org.korsakow.ui.mediaElementFactory = new org.korsakow.ui.PrecachedMediaElementFactory();

            org.korsakow.log.info(' Disabling context menu');
            jQuery(this.window).bind('contextmenu', function(event) {
                event.preventDefault();
                event.stopPropagation();
            });
        }

        var localStorage = (function() {
            if (org.korsakow.Support.isLocalStorageAvailable()) {
                return new org.korsakow.WebStorage(this.window.localStorage);
            } else {
                org.korsakow.log.debug("localStorage is not available, using a non-persistent in-memory store instead");
                return new org.korsakow.MemoryStorage();
            }
        })();

        var mainController = this.mainController = new org.korsakow.controller.MainController({});
        var mainElement = this.mainElement = mainController.element;
        var env = this.env = new org.korsakow.Environment(mainElement, this.rootElement, this.globalElement, this.dao, localStorage);

        this.rootElement.append(mainController.element);

        if (!this.window.nodemo) this.rootElement.prepend('<div id="demoOverlay" class="overlay">demo mode</div>');


        env.project = this.dao.findProject();

        function aspect() {
            var doc = jQuery(this.window);

            var css = {};

            var containerWidth = doc.width();
            var containerHeight = doc.height();
            var projWidth = env.project.width;
            var projHeight = env.project.height;

            var scale = Math.min(containerWidth/projWidth, containerHeight/projHeight);

            css.width = projWidth*scale;
            css.height = projHeight*scale;

            mainElement.css(css);
        }

        function throttledResize(fn) {
            var timeout;
            return function() {
                org.korsakow.Timeout.clear(timeout);
                timeout = org.korsakow.Timeout.create(fn, 500);
            };
        }
        jQuery(this.window).resize(throttledResize(aspect));
        aspect();


        this.setBackgroundColor();

        this.showLogo()
            .then(function() { return that.showSplashScreen(); })
            .then(function() { return that.playFirstSnu(); });
    }

});

Class.register('org.korsakow.Embed',org.korsakow.Object, {
    initialize: function($super, dao, window, rootElement) {
        $super();
        this.dao = dao;
        this.window = window;
        this.rootElement = rootElement;
    },
    start: function(snuId) {
        var that = this;

        var embedController = new org.korsakow.controller.EmbedController();
        this.rootElement.append(embedController.element);

        embedController.setup({
            dao: this.dao,
            snuId: snuId
        });
    }
});

org.korsakow.Bootstrap = new (Class.register('org.korsakow.Bootstrap', {
    _loadProject: function() {
        function loadProject() {
            var deferred = jQuery.Deferred();
            jQuery.ajax({
                url: "data/project.json",
                dataType: 'json',
                success: function(data) {
                    var dao = org.korsakow.domain.Dao.create(data);
                    deferred.resolve(dao);
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    deferred.reject();

                    var extraMsg;
                    // Chrome 50.0.2661.102 and possibly others disallow ajax on the local FS
                    var resolvedUrl = jQuery('<img/>').attr('src', 'data/project.json').prop('src');
                    if (resolvedUrl.indexOf('file:') === 0) {
                        extraMsg = 'Your browser might not allow loading web pages directly from your computer. Please try uploading your film.';
                    } else
                    if (jqXHR.status === 404) {
                        extraMsg = 'Some files seem to be missing.';
                    }
                    org.korsakow.Bootstrap.showBreakingError('project-load-failed', extraMsg);
                    org.korsakow.log.info('Error while loading project file: ', textStatus, errorThrown, errorThrown.stack);
                }
            });
            return deferred.promise();
        }

        if (org.korsakow.Support.isMP4VideoSupported()) {
            return loadProject();
        } else {
            org.korsakow.Bootstrap.showBreakingError('mp4-unsupported');
            var deferred = jQuery.Deferred();
            deferred.reject();
            return deferred.promise();
        }
    },
    loadPlayer: function() {
        this._loadProject()
            .then(function(dao) {
                new org.korsakow.Player(dao, window, jQuery('body'), jQuery('#korsakow-root')).start();
            });
    },
    loadEmbed: function(embedId) {
        this._loadProject()
            .then(function(dao) {
                new org.korsakow.Embed(dao, window, jQuery('#korsakow-root')).start(embedId);
            });
    },
    load: function() {
        var embedId = Number.parseInt(org.korsakow.EnvUtils.getUrlVar('embed'));
        if (Number.isFinite(embedId)) {
            return this.loadEmbed(embedId);
        } else {
            return this.loadPlayer();
        }
    }
}));
org.korsakow.Bootstrap.showBreakingError = function(which, msg) {
    var errorElm = jQuery('.breaking-error');
    if (msg)
        jQuery('<em/>')
            .text(msg)
            .appendTo(errorElm);
    errorElm.add('.' + which)
            .show();
};


NS('org.korsakow');

org.korsakow.EnvUtils = new (Class.register('org.korsakow.EnvUtils', {
    resolvePath: function(path) {
        return path ? 'data/' + path : path;
    },
    getUrlVar: function(name) {
        // TODO: use a url handling lib
        var value = window.location.hash.replace(new RegExp('#.*' + name + '=([^&?]*?)'), '$1');
        return value;
    },
    getFilmUrl: function() {
        // TODO: use a url handling lib
        var baseUrl = org.korsakow.location().toString();
        var withoutHash = baseUrl.replace(/(.*?)#.*/, '$1');
        return withoutHash;
    }
}));

Class.register('org.korsakow.Environment', {
    initialize: function(mainElement, rootElement, globalBindingElement, dao, localStorage) {
        this.currentSnu = null;
        this.currentInterface = null;
        this.project = null;
        this.interfaceController = null;
        this.currentMainMedia = null;
        this.backgroundSoundUI = null;

        this.mainElement = mainElement;
        this.rootElement = rootElement;
        this.globalBindingElement = globalBindingElement;
        this.dao = dao;
        this.soundManager = new org.korsakow.SoundManager();
        this.localStorage = localStorage;
    },
    getDao: function() {
        return this.dao;
    },
    getDefaultSearchResultIncrement: function() {
        return 1;
    },
    resolvePath: org.korsakow.EnvUtils.resolvePath,
    ajax: function(opts) {
        return jQuery.ajax(opts);
    },
    getProject: function() {
        return this.project;
    },
    getCurrentSnu: function() {
        return this.currentSnu;
    },
    /*getCurrentSubtitles: function(){
        return this.currentSnu; //THIS IS NOT CORRECT!!
    },*/
    getSearchResults: function() {
        return this.searchResults;
    },
    getCurrentInterfaceController: function(){
        return this.interfaceController;
    },
    getWidgetById: function(id){
        for(var i = 0; i < this.interfaceController.controllers.length;i++){
            var cont = this.interfaceController.controllers[i];
            if(cont.model.id === id){
                return cont;
            }
        }
        return null;
    },
    getWidgetsOfType: function(type){
        var widgets = [];
        for(var i = 0; i < this.interfaceController.controllers.length;i++){
            var cont = this.interfaceController.controllers[i];
            if(cont.model.type === type){
                widgets.push(cont);
            }
        }
        return widgets;
    },
    getMainMediaWidget: function(){
        return this.getWidgetsOfType("org.korsakow.widget.MainMedia")[0];
    },

    getLastSnu: function() {
        return this.localStorage.get('lastSnu');
    },
    setLastSnu: function(snu) {
        this.localStorage.set('lastSnu', snu);
    },
    clearLastSnu: function() {
        this.localStorage.remove('lastSnu');
    },
    getClickSound: function() {
        function pair(sound, volume) {
            return {
                sound: sound,
                volume: volume
            };
        }
        if (this.currentInterface && this.currentInterface.clickSound)
            return pair(this.currentInterface.clickSound, this.currentInterface.clickSoundVolume);
        if (this.project.clickSound)
            return pair(this.project.clickSound, this.project.clickSoundVolume);
        return null;
    },
    getGlobalVolume: function(){
        return org.korsakow.ui.AudioUI.globalVolume;
    },
    setGlobalVolume: function(vol){
        if(vol < 0) vol = 0;
        if(vol > 1) vol = 1.0;
        // this.globalVolume = vol;
        org.korsakow.ui.AudioUI.globalVolume = vol;

        this.applyGlobalVolume();
    },
    createMediaUI: function(qualifiedName, opts) {
        return org.korsakow.ui.MediaUIFactory.create(qualifiedName, opts);
    },
    applyGlobalVolume: function(){
        var vol = org.korsakow.ui.AudioUI.globalVolume;
        this.mainElement.find('video').each(function(v){
            this.volume = vol;
        });
        /*
         * this.mainElement.find('audio').each(function(){ $(this)[0].volume = vol; });
         */
        // adjust position of all MV widgets in case there are multiple
        var volumeControllers = this.getWidgetsOfType('org.korsakow.widget.MasterVolume');
        for(var i = 0; i<volumeControllers.length;i++){
            volumeControllers[i].updateSlider(vol);
        }
        for(var key in this.soundManager.channels){
            var channel = this.soundManager.channels[key];
            channel.audio.volume(channel.audio.volume());
        }
    },
    cancelEvents: function () {
        for (var i = 0; i < this.currentSnu.events.length; ++i) {
            this.currentSnu.events[i].cancel();
        }
    },
    findPreviews: function() {
        return this.interfaceController.controllers.filter(function(ctrl) {
            if (ctrl.model.type === 'org.korsakow.widget.Preview' ||
                ctrl.model.type === 'org.korsakow.widget.FixedPreview') {
                return true;
            }
        });
    },
    setGlassOverlay: function(show) {
        if (show)
            this.mainElement.siblings('#glassOverlay').show();
        else
            this.mainElement.siblings('#glassOverlay').hide();
    },
    toString: function() {
        return "[org.korsakow.Environment]";
    }
});

/* Classes related to unmarshalling domain objects
 *
 * Finder: a finder knows how to locate a certain type of domain object in various ways from the project.xml
 *         finder methods return a jQuery-wrapped XML node
 *
 * Mapper: knows how to create a domain object from an XML node
 *
 */
NS('org.korsakow.domain.rule');
NS('org.korsakow.domain.trigger');
NS('org.korsakow.domain.widget');


/* Locates XML nodes by various criteria
 *
 */
Class.register('org.korsakow.domain.Finder', {
    /*
     * @param data jQuery-wrapped XML
     */
    initialize: function($super, data) {
        $super();
        this.data = data;
        this.idIndex = {};
        this.snuKeywordIndex = {};

        var thisFinder = this;
        function buildIndices() {
            ['videos', 'images', 'sounds', 'texts', 'interfaces', 'snus', 'maps'].forEach(function(type) {
                thisFinder.data && thisFinder.data[type] && thisFinder.data[type].forEach(function(d) {
                    thisFinder.idIndex[d.id] = d;

                    if (type === 'snus') {
                        d.keywords && d.keywords.forEach(function(k) {
                            var value = k.value;
                            thisFinder.snuKeywordIndex[value] = thisFinder.snuKeywordIndex[value] || [];
                            thisFinder.snuKeywordIndex[value].push(d);
                        });
                    }
                });
            });
        }
        var before = org.korsakow.Date.now();
        buildIndices();
        var after = org.korsakow.Date.now();

        org.korsakow.log.info("Building indices took " + (after-before) + "ms");
        org.korsakow.log.info('IdIndex size: ', Object.keys(this.idIndex).length);
        org.korsakow.log.info('SnuKeywordIndex size', Object.keys(this.snuKeywordIndex).length);
    },
    /**
     * @param id the id of the object to find, corresponds to the <id> tag in the xml
     * @param opts currently not used
     */
    findById: function(id, opts) {
        return this.idIndex[id];
    },
    findMediaById: function(id, opts) {
        return this.findById(id, opts);
    },
    findSnusWithKeyword: function(keyword) {
        return this.snuKeywordIndex[keyword] && this.snuKeywordIndex[keyword] || [];
    },
    findSnusFilter: function(filter) {
        return this.data.snus.filter(filter);
    },
    findProject: function() {
        return this.data.Project;
    }
});

org.korsakow.domain.MapperException = org.korsakow.Exception;
org.korsakow.domain.DomainObjectNotFoundException = org.korsakow.Exception;

/* Data Access Object
 * Finds domain objects
 */
Class.register('org.korsakow.domain.Dao', {
    /*
     * @param $super
     * @param finder
     * @param mappers Array[{org.korsakow.Mapper}
     */
    initialize: function($super, finder, mappers) {
        $super();
        this.idmap = {};
        this.mappers = mappers;
        this.finder = finder;
    },
    getMapper: function(clazz) {
        var mapper = this.mappers[clazz];
        if (!mapper)
            throw new org.korsakow.domain.MapperException("No mapper for: " + clazz);
        return mapper;
    },
    findById: function(id) {
        if (this.idmap[id])
            return this.idmap[id];
        var data = this.finder.findById.apply(this.finder, arguments);
        if (!data)
            throw new org.korsakow.domain.DomainObjectNotFoundException("DomainObject not found: #" + id);
        var mapper = this.getMapper(data.className);
        var obj = mapper.map(data);
        this.idmap[obj.id] = obj;
        return obj;
    },
    findMediaById: function(id) {
        if (this.idmap[id])
            return this.idmap[id];
        var data = this.finder.findMediaById.apply(this.finder, arguments);
        if (!data)
            throw new org.korsakow.domain.DomainObjectNotFoundException("DomainObject not found: #" + id);
        var mapper = this.getMapper(data.className);
        var obj = mapper.map(data);
        this.idmap[obj.id] = obj;
        return obj;
    },
    findSnusWithKeyword: function(keyword) {
        return this.finder.findSnusWithKeyword(keyword).map(function(d) {
            if (this.idmap[d.id])
                return this.idmap[d.id];
            var mapper = this.getMapper('Snu');
            var obj = mapper.map(d);
            this.idmap[obj.id] = obj;
            return obj;
        }.bind(this));
    },
    findSnusFilter: function(filter) {
        return this.finder.findSnusFilter(filter).map(function(d) {
            if (this.idmap[d.id])
                return this.idmap[d.id];
            var mapper = this.getMapper('Snu');
            var obj = mapper.map(d);
            this.idmap[obj.id] = obj;
            return obj;
        }.bind(this));
    },
    findSnus: function() { return this.findSnusFilter(function() { return true; }); },

    findProject: function() {
        var d = this.finder.findProject();
        var mapper = this.getMapper('Project');
        var obj = mapper.map(d);
        this.idmap[obj.id] = obj;
        return obj;
    },

    mapPojo: function(data) {
        return data.map(function(datum) {
            var mapper = this.getMapper(datum.className);
            var obj = mapper.map(datum);
            return obj;
        }.bind(this));
    },

    map: function(datum) {
        var id = datum.id;
        if (this.idmap[id])
            return this.idmap[id];
        var mapper = this.getMapper(datum.className);
        var obj = mapper.map(datum);
        this.idmap[obj.id] = obj;
        return obj;
    },
    mapAll: function(data) {
        return data.map(this.map.bind(this));
    }
});
/* Factory method
 * @param data jQuery-wrapped XML
 * @returns {org.korsakow.domain.Dao}
 */
org.korsakow.domain.Dao.create = function(data) {

    var dao = new org.korsakow.domain.Dao();
    dao.initialize(new org.korsakow.domain.Finder(data), {
        'Keyword': new org.korsakow.domain.KeywordInputMapper(dao),
        'Video': new org.korsakow.domain.VideoInputMapper(dao),
        'Sound' : new org.korsakow.domain.SoundInputMapper(dao),
        'Image': new org.korsakow.domain.ImageInputMapper(dao),
        'Snu': new org.korsakow.domain.SnuInputMapper(dao),
        'Interface': new org.korsakow.domain.InterfaceInputMapper(dao),
        'Widget': new org.korsakow.domain.WidgetInputMapper(dao),
        'Event': new org.korsakow.domain.EventInputMapper(dao),
        'Predicate': new org.korsakow.domain.PredicateInputMapper(dao),
        'Trigger': new org.korsakow.domain.TriggerInputMapper(dao),
        'Rule': new org.korsakow.domain.RuleInputMapper(dao),
        'Project': new org.korsakow.domain.ProjectInputMapper(dao)
    });
    return dao;
};

org.korsakow.domain.ParseException = org.korsakow.Exception;
/*
Class.create(Error, {
    initialize: function($super, message) {
        $super(message);
    }
});
*/

var PU = org.korsakow.domain.ParseUtil = Class.register('org.korsakow.domain.ParseUtil', {
});

org.korsakow.domain.ParseUtil.parseInt = function(expr, message) {
    if (!org.korsakow.isValue(expr))
        throw new org.korsakow.domain.ParseException("Int Not found: " + message);
    return parseInt(expr, null);
};
org.korsakow.domain.ParseUtil.parseFloat = function(expr, message) {
    if (!org.korsakow.isValue(expr))
        throw new org.korsakow.domain.ParseException("Float Not found: " + message);
    return Number.parseFloat(expr);
};
org.korsakow.domain.ParseUtil.parseString = function(expr, message) {
    if (!org.korsakow.isValue(expr))
        throw new org.korsakow.domain.ParseException("String Not found: " + message);
    return expr;
};
org.korsakow.domain.ParseUtil.parseBoolean = function(expr, message) {
    if (!org.korsakow.isValue(expr))
        throw new org.korsakow.domain.ParseException("Boolean Not found: " + message);
    return !!expr;
};
org.korsakow.domain.ParseUtil.parseColor = function(expr, message) {
    if (!org.korsakow.isValue(expr))
        throw new org.korsakow.domain.ParseException("Color Not found: " + message);
    var color = expr;
    // workaround for lack of browser support for alpha in hex representation
    var hexWithAlpha = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(color);
    if (hexWithAlpha) {
        var r = Number.parseInt(hexWithAlpha[1], 16);
        var g = Number.parseInt(hexWithAlpha[2], 16);
        var b = Number.parseInt(hexWithAlpha[3], 16);
        var a = Number.parseInt(hexWithAlpha[4], 16) / 0xFF;
        color = 'rgba(' +  [r, g, b, a].join(',') + ')';
    }
    return color;
};
org.korsakow.domain.ParseUtil.parseEnum = function(expr, enumClass, message) {
    if (!org.korsakow.isValue(expr))
        throw new org.korsakow.domain.ParseException("Enum (" + enumClass + ") Not found: " + message);
    return enumClass.fromValue(expr);
};

Class.register('org.korsakow.domain.InputMapper', {
    initialize: function($super, dao) {
        $super();
        this.dao = dao;
    },
    parseInt: function(data, prop) {
        return PU.parseInt(data[prop], this.getClass().qualifiedName + "." + prop + ':' + data['id']);
    },
    parseFloat: function(data, prop) {
        return PU.parseFloat(data[prop], this.getClass().qualifiedName + "." + prop + ':' + data['id']);
    },
    parseString: function(data, prop) {
        return PU.parseString(data[prop], this.getClass().qualifiedName + "." + prop + ':' + data['id']);
    },
    parseBoolean: function(data, prop) {
        return PU.parseBoolean(data[prop], this.getClass().qualifiedName + "." + prop + ':' + data['id']);
    },
    parseColor: function(data, prop) {
        return PU.parseColor(data[prop], this.getClass().qualifiedName + "." + prop + ':' + data['id']);
    },
    parseEnum: function(data, prop, enumClass) {
        return PU.parseEnum(data[prop], enumClass, this.getClass().qualifiedName + "." + prop + ':' + data['id']);
    },

    parseIntNoThrow: function(data, prop, defaultValue) {
        try {
            return PU.parseInt(data[prop], this.getClass().qualifiedName + "." + prop + ':' + data['id']);
        } catch (err) {
            org.korsakow.log.info(err);

            return defaultValue;
        }
    },
    parseFloatNoThrow: function(data, prop, defaultValue) {
        try {
            return PU.parseFloat(data[prop], this.getClass().qualifiedName + "." + prop + ':' + data['id']);
        } catch (err) {
            org.korsakow.log.info(err);

            return defaultValue;
        }
    },
    parseStringNoThrow: function(data, prop, defaultValue) {
        try {
            return PU.parseString(data[prop], this.getClass().qualifiedName + "." + prop + ':' + data['id']);
        } catch (err) {
            org.korsakow.log.info(err);

            return defaultValue;
        }
    },
    parseBooleanNoThrow: function(data, prop, defaultValue) {
        try {
            return PU.parseBoolean(data[prop], this.getClass().qualifiedName + "." + prop + ':' + data['id']);
        } catch (err) {
            org.korsakow.log.info(err);

            return defaultValue;
        }
    },
    parseColorNoThrow: function(data, prop, defaultValue) {
        try {
            return PU.parseColor(data[prop], this.getClass().qualifiedName + "." + prop + ':' + data['id']);
        } catch (err) {
            org.korsakow.log.info(err);

            return defaultValue;
        }
    },
    parseEnumNoThrow: function(data, prop, enumClass, defaultValue) {
        try {
            return PU.parseEnum(data[prop], enumClass, this.getClass().qualifiedName + "." + prop + ':' + data['id']);
        } catch (err) {
            org.korsakow.log.info(err);

            return defaultValue;
        }
    }
});

Class.register('org.korsakow.domain.KeywordInputMapper', org.korsakow.domain.InputMapper, {
    initialize: function($super, dao) {
        $super(dao);
    },
    map: function(data) {
        var value = this.parseString(data, "value");
        var weight = 1;
        return new org.korsakow.domain.Keyword(value, weight);
    }
});

Class.register('org.korsakow.domain.VideoInputMapper', org.korsakow.domain.InputMapper, {
    initialize: function($super, dao) {
        $super(dao);
    },
    map: function(data) {
        var This = this;
        var id = this.parseInt(data, "id");
        var filename = this.parseString(data, "filename");

        var subtitlesTag = data['subtitles'];
        var subtitlesFilename = (function () {
            if (!subtitlesTag) {
                return null;
            } else {
                return This.parseString(data, "subtitles");
            }
        })();

        return new org.korsakow.domain.Video(id, filename, subtitlesFilename);
    }
});

Class.register('org.korsakow.domain.ImageInputMapper', org.korsakow.domain.InputMapper, {
    initialize: function($super, dao) {
        $super(dao);
    },
    map: function(data) {
        var id = this.parseInt(data, "id");
        var filename = this.parseString(data, "filename");
        var duration = (function() {
            if (org.korsakow.isValue(data["duration"])) {
                return this.parseFloat(data, "duration");
            } else {
                return undefined;
            }
        })();
        return new org.korsakow.domain.Image(id, filename, duration);
    }
});

Class.register('org.korsakow.domain.SoundInputMapper', org.korsakow.domain.InputMapper, {
    initialize: function($super, dao) {
        $super(dao);
    },
    map: function(data) {
        var id = this.parseInt(data, "id");
        var filename = this.parseString(data, "filename");
        return new org.korsakow.domain.Sound(id, filename);
    }
});

Class.register('org.korsakow.domain.SnuInputMapper', org.korsakow.domain.InputMapper, {
    initialize: function($super, dao) {
        $super(dao);
    },
    map: function(data) {
        var id = this.parseInt(data, "id");
        var name = this.parseString(data, "name");
        var keywords = this.dao.mapPojo(data.keywords);
        var mainMedia = this.dao.findMediaById(this.parseInt(data, "mainMediaId"));
        var thumbnailMedia = this.dao.findMediaById(this.parseInt(data, "thumbnailId"));
        var previewMedia = (function() {
            if (org.korsakow.isValue(data["previewMediaId"])) {
                return this.dao.findMediaById(this.parseInt(data, "previewMediaId"));
            } else {
                return null;
            }
        }).apply(this);
        var interf = this.dao.findById(this.parseInt(data, "interfaceId"));
        var starter = this.parseBoolean(data, "starter");
        var ender = this.parseBoolean(data, "ender");
        var events = this.dao.mapAll(data.events);
        var lives = (function(){
            if (org.korsakow.isValue(data["lives"]))
                return this.parseInt(data, "lives");
            else
                return NaN;
        }).apply(this);
        var looping = this.parseBoolean(data, "looping");
        var insertText = this.parseString(data, "insertText");
        var previewText = this.parseString(data, "previewText");
        var rating = this.parseFloat(data, "rating");
        var backgroundSoundMode = this.parseString(data, "backgroundSoundMode");
        var backgroundSoundLooping = this.parseString(data, "backgroundSoundLooping");
        var backgroundSoundVolume = 1.0;
        var backgroundSoundMedia = (function(){
            if(org.korsakow.isValue(data["backgroundSoundId"])){
                backgroundSoundVolume = this.parseFloat(data, "backgroundSoundVolume");
                return this.dao.findById(this.parseInt(data, "backgroundSoundId"));
            } else
                return null;
        }).apply(this);
        return new org.korsakow.domain.Snu(id, name, keywords,
                mainMedia, thumbnailMedia, previewMedia,
                interf, events, lives,
                looping, starter, ender, insertText, previewText, rating,
                backgroundSoundMode,backgroundSoundLooping, backgroundSoundMedia, backgroundSoundVolume);
    }
});

Class.register('org.korsakow.domain.InterfaceInputMapper', org.korsakow.domain.InputMapper, {
    initialize: function($super, dao) {
        $super(dao);
    },
    map: function(data) {
        var This = this;

        var id = this.parseInt(data, "id");
        var name = this.parseString(data, "name");
        var keywords = [];
        // TODO: a better way to gracefully handle unknown widgets than ignoring errors
        var widgets = data.widgets
                          .filter(function(widgetData) {
                              var supported = This.dao.getMapper(widgetData.className)
                                             .canMap(widgetData.type);
                              if (!supported)
                                  org.korsakow.log.warn('Ignoring unsupported widget of type: ' + widgetData.type);
                              return supported;
                          })
                          .map(function(widgetData) {
                              return This.dao.map(widgetData);
                          });
        var clickSoundVolume = 1.0;
        var clickSound = (function() {
            if (org.korsakow.isValue(data["clickSoundId"])) {
                var clickSoundId = this.parseInt(data, "clickSoundId");
                clickSoundVolume = this.parseFloat(data, "clickSoundVolume");
                return this.dao.findById(clickSoundId);
            } else
                return null;
        }).apply(this);
        var backgroundImage = (function() {
            if (org.korsakow.isValue(data["backgroundImageId"])) {
                return this.dao.findById(this.parseInt(data, "backgroundImageId"));
            } else
                return null;
        }).apply(this);
        var backgroundColor = org.korsakow.isValue(data["backgroundColor"])?this.parseColor(data, "backgroundColor"):null;
        return new org.korsakow.domain.Interface(id, name, keywords, widgets, clickSound, clickSoundVolume, backgroundColor, backgroundImage);
    }
});

//
/**
 * This is actually a sort of MetaInputMapper in that it does a lookup for the actual mapper based on the widget's type
 */
Class.register('org.korsakow.domain.WidgetInputMapper', org.korsakow.domain.InputMapper, {
    initialize: function($super, dao) {
        $super(dao);
    },
    canMap: function(type) {
        return org.korsakow.domain.InputMapperFactory.has(type);
    },
    map: function(data) {
        var type = this.parseString(data, "type");
        var mapper = org.korsakow.domain.InputMapperFactory.create(type, this.dao);
        return mapper.map(data);
    }
});

Class.register('org.korsakow.domain.TextStyleInputMapper', org.korsakow.domain.InputMapper, {
    initialize: function($super) {
        $super(null);
    },
    map: function(data) {
        var color = this.parseColorNoThrow(data, "fontColor", "black");
        var fontFamily = this.parseStringNoThrow(data, "fontFamily", "Arial");
        var fontSize = this.parseFloatNoThrow(data, "fontSize", "12");
        var fontStyle = this.parseStringNoThrow(data, "fontStyle", "normal");
        var fontWeight = this.parseStringNoThrow(data, "fontWeight", "normal");
        var textDecoration = this.parseString(data, "textDecoration", "none");
        var textStyle = new org.korsakow.domain.widget.TextStyle(color, fontFamily, fontSize, fontStyle, fontWeight, textDecoration);
        return textStyle;
    }
});
org.korsakow.domain.textStyleInputMapper = new org.korsakow.domain.TextStyleInputMapper();

Class.register('org.korsakow.domain.TextAlignInputMapper', org.korsakow.domain.InputMapper, {
    initialize: function($super) {
        $super(null);
    },
    map: function(data) {
        var horizontal = this.parseString(data, "horizontalTextAlignment");
        var vertical = this.parseString(data, "verticalTextAlignment");
        var textAlign = new org.korsakow.domain.widget.TextAlign(horizontal, vertical);
        return textAlign;
    }
});
org.korsakow.domain.textAlignInputMapper = new org.korsakow.domain.TextAlignInputMapper();


Class.register('org.korsakow.domain.TextAlignInputMapper', org.korsakow.domain.InputMapper, {
    initialize: function($super) {
        $super(null);
    },
    map: function(data) {
        var horizontal = this.parseStringNoThrow(data, "horizontalTextAlign", "left");
        var vertical = this.parseStringNoThrow(data, "verticalTextAlign", "top");
        var textAlign = new org.korsakow.domain.widget.TextAlign(horizontal, vertical);
        return textAlign;
    }
});
org.korsakow.domain.textStyleInputMapper = new org.korsakow.domain.TextStyleInputMapper();
Class.register('org.korsakow.domain.MainMediaInputMapper', org.korsakow.domain.InputMapper, {
    initialize: function($super, dao) {
        $super(dao);
    },
    map: function(data) {
        var type = this.parseString(data, "type");
        var id = this.parseInt(data, "id");
        var x = this.parseInt(data, "x");
        var y = this.parseInt(data, "y");
        var width = this.parseInt(data, "width");
        var height = this.parseInt(data, "height");

        var scalingPolicy = this.parseEnumNoThrow(data, "scalingPolicy", org.korsakow.domain.widget.ScalingPolicy, org.korsakow.domain.widget.ScalingPolicy.Contain);

        var widget = new org.korsakow.domain.widget.MainMedia(id, [], type, x, y, width, height, scalingPolicy);
        return widget;
    }
});

Class.register('org.korsakow.domain.PreviewInputMapper', org.korsakow.domain.InputMapper, {
    initialize: function($super, dao) {
        $super(dao);
    },
    map: function(data) {
        var type = this.parseString(data, "type");
        var id = this.parseInt(data, "id");
        var x = this.parseInt(data, "x");
        var y = this.parseInt(data, "y");
        var width = this.parseInt(data, "width");
        var height = this.parseInt(data, "height");
        var index = this.parseInt(data, "index");

        var textStyle = org.korsakow.domain.textStyleInputMapper.map(data);
        var textAlign = org.korsakow.domain.textAlignInputMapper.map(data);

        var scalingPolicy = this.parseEnumNoThrow(data, "scalingPolicy", org.korsakow.domain.widget.ScalingPolicy, org.korsakow.domain.widget.ScalingPolicy.Contain);

        var scalingPolicy = this.parseEnumNoThrow(data, "scalingPolicy", org.korsakow.domain.widget.ScalingPolicy, org.korsakow.domain.widget.ScalingPolicy.Contain);

        var previewTextMode = (function() {
            if (org.korsakow.isValue(data["previewTextMode"])) {
                return org.korsakow.domain.widget.Preview.PreviewTextMode.fromValue(this.parseString(data, "previewTextMode"));
            } else
                return null;
        }).apply(this);
        var previewTextEffect = (function() {
            if (org.korsakow.isValue(data["previewTextEffect"])) {
                return org.korsakow.domain.widget.Preview.PreviewTextEffect.fromValue(this.parseString(data, "previewTextEffect"));
            } else
                return null;
        }).apply(this);
        var previewOverlayColor = this.parseColor(data, "previewOverlayColor");

        var widget = new org.korsakow.domain.widget.Preview(
            id, [], type,
            x, y, width, height,
            index,
            textStyle, textAlign,
            scalingPolicy,
            previewTextMode, previewTextEffect, previewOverlayColor);
        return widget;
    }
});

Class.register('org.korsakow.domain.FixedPreviewMapper', org.korsakow.domain.InputMapper, {
    initialize: function($super, dao) {
        $super(dao);
    },
    map: function(data) {
        var type = PU.parseString(data["type"], "FixedPreview.type");
        var id = PU.parseInt(data["id"], "FixedPreview.id");
        var x = PU.parseInt(data["x"], "FixedPreview.x");
        var y = PU.parseInt(data["y"], "FixedPreview.y");
        var width = PU.parseInt(data["width"], "FixedPreview.width");
        var height = PU.parseInt(data["height"], "FixedPreview.height");
        var snuId = PU.parseInt(data["snuId"], "FixedPreview.snuId");

        var textStyle = org.korsakow.domain.textStyleInputMapper.map(data);
        var textAlign = org.korsakow.domain.textAlignInputMapper.map(data);

        var scalingPolicy = this.parseEnumNoThrow(data, "scalingPolicy", org.korsakow.domain.widget.ScalingPolicy, org.korsakow.domain.widget.ScalingPolicy.Contain);

        var scalingPolicy = this.parseEnumNoThrow(data, "scalingPolicy", org.korsakow.domain.widget.ScalingPolicy, org.korsakow.domain.widget.ScalingPolicy.Contain);

        var previewTextMode = (function() {
            if (org.korsakow.isValue(data["previewTextMode"])) {
                return org.korsakow.domain.widget.Preview.PreviewTextMode.fromValue(this.parseString(data, "previewTextMode"));
            } else
                return null;
        }).apply(this);
        var previewTextEffect = (function() {
            if (org.korsakow.isValue(data["previewTextEffect"])) {
                return org.korsakow.domain.widget.Preview.PreviewTextEffect.fromValue(this.parseString(data, "previewTextEffect"));
            } else
                return null;
        }).apply(this);
        var previewOverlayColor = this.parseColor(data, "previewOverlayColor");

        var widget = new org.korsakow.domain.widget.FixedPreview(
            id, [], type,
            x, y, width, height,
            snuId,
            textStyle, textAlign,
            scalingPolicy,
            previewTextMode, previewTextEffect, previewOverlayColor);
        return widget;
    }
});

Class.register('org.korsakow.domain.MediaAreaInputMapper', org.korsakow.domain.InputMapper, {
    initialize: function($super, dao) {
        $super(dao);
    },
    map: function(data) {
        var type = this.parseString(data, "type");
        var id = this.parseInt(data, "id");
        var x = this.parseInt(data, "x");
        var y = this.parseInt(data, "y");
        var width = this.parseInt(data, "width");
        var height = this.parseInt(data, "height");
        var mediaId = this.parseInt(data, "mediaId");
        var playMode = (function() {
            if (org.korsakow.isValue(data["playMode"])) {
                return org.korsakow.domain.widget.PlayMode.fromValue(this.parseString(data, "playMode"));
            } else
                return null;
        }).apply(this);

        var scalingPolicy = this.parseEnumNoThrow(data, "scalingPolicy", org.korsakow.domain.widget.ScalingPolicy, org.korsakow.domain.widget.ScalingPolicy.Contain);

        var widget = new org.korsakow.domain.widget.MediaArea(id, [], type, x, y, width, height, mediaId, playMode, scalingPolicy);
        return widget;
    }
});

Class.register('org.korsakow.domain.InsertTextInputMapper', org.korsakow.domain.InputMapper, {
    initialize: function($super, dao) {
        $super(dao);
    },
    map: function(data) {
        var type = this.parseString(data, "type");
        var id = this.parseInt(data, "id");
        var x = this.parseInt(data, "x");
        var y = this.parseInt(data, "y");
        var width = this.parseInt(data, "width");
        var height = this.parseInt(data, "height");
        var textStyle = org.korsakow.domain.textStyleInputMapper.map(data);

        var widget = new org.korsakow.domain.widget.InsertText(
            id, [], type,
            x, y, width, height,
            textStyle);
        return widget;
    }
});

Class.register('org.korsakow.domain.IFrameInputMapper', org.korsakow.domain.InputMapper, {
    initialize: function($super, dao) {
        $super(dao);
    },
    map: function(data) {
        var type = this.parseString(data, "type");
        var id = this.parseInt(data, "id");
        var x = this.parseInt(data, "x");
        var y = this.parseInt(data, "y");
        var width = this.parseInt(data, "width");
        var height = this.parseInt(data, "height");

        var url = this.parseString(data, "url");

        var widget = new org.korsakow.domain.widget.IFrame(
            id, [], type,
            x, y, width, height,
            url);
        return widget;
    }
});

Class.register('org.korsakow.domain.HtmlBoxInputMapper', org.korsakow.domain.InputMapper, {
    initialize: function($super, dao) {
        $super(dao);
    },
    map: function(data) {
        var type = this.parseString(data, "type");
        var id = this.parseInt(data, "id");
        var x = this.parseInt(data, "x");
        var y = this.parseInt(data, "y");
        var width = this.parseInt(data, "width");
        var height = this.parseInt(data, "height");

        var html = this.parseString(data, "html");

        var widget = new org.korsakow.domain.widget.HtmlBox(
            id, [], type,
            x, y, width, height,
            html);
        return widget;
    }
});

Class.register('org.korsakow.domain.PlayButtonInputMapper', org.korsakow.domain.InputMapper, {
    initialize: function($super, dao) {
        $super(dao);
    },
    map: function(data) {
        var type = this.parseString(data, "type");
        var id = this.parseInt(data, "id");
        var x = this.parseInt(data, "x");
        var y = this.parseInt(data, "y");
        var width = this.parseInt(data, "width");
        var height = this.parseInt(data, "height");

        var widget = new org.korsakow.domain.widget.MediaArea(id, [], type, x, y, width, height);
        return widget;
    }
});
Class.register('org.korsakow.domain.PlayTimeInputMapper', org.korsakow.domain.InputMapper, {
    initialize: function($super, dao) {
        $super(dao);

    },
    map: function(data) {
        var type = this.parseString(data, "type");
        var id = this.parseInt(data, "id");
        var x = this.parseInt(data, "x");
        var y = this.parseInt(data, "y");
        var width = this.parseInt(data, "width");
        var height = this.parseInt(data, "height");
        var textStyle = org.korsakow.domain.textStyleInputMapper.map(data);
        var textAlign = org.korsakow.domain.textAlignInputMapper.map(data);

        var widget = new org.korsakow.domain.widget.PlayTime(
            id, [], type,
            x, y, width, height,
            textStyle, textAlign);
        return widget;
    }
});

Class.register('org.korsakow.domain.TotalTimeInputMapper', org.korsakow.domain.InputMapper, {
    initialize: function($super, dao) {
        $super(dao);

    },
    map: function(data) {
        var type = this.parseString(data, "type");
        var id = this.parseInt(data, "id");
        var x = this.parseInt(data, "x");
        var y = this.parseInt(data, "y");
        var width = this.parseInt(data, "width");
        var height = this.parseInt(data, "height");
        var textStyle = org.korsakow.domain.textStyleInputMapper.map(data);
        var textAlign = org.korsakow.domain.textAlignInputMapper.map(data);

        var widget = new org.korsakow.domain.widget.TotalTime(
            id, [], type,
            x, y, width, height,
            textStyle, textAlign);
        return widget;
    }
});

Class.register('org.korsakow.domain.ScrubberInputMapper', org.korsakow.domain.InputMapper, {
    initialize: function($super, dao) {
        $super(dao);

    },
    map: function(data) {
        var type = this.parseString(data, "type");
        var id = this.parseInt(data, "id");
        var x = this.parseInt(data, "x");
        var y = this.parseInt(data, "y");
        var width = this.parseInt(data, "width");
        var height = this.parseInt(data, "height");
        var backgroundColor = this.parseColor(data, "backgroundColor");
        var foregroundColor = this.parseColor(data, "foregroundColor");
        var interactive = this.parseBoolean(data, "interactive");
        var loadingColor = this.parseColor(data, "loadingColor");
        var barWidth = this.parseInt(data, "barWidth");
        var barHeight = this.parseInt(data, "barHeight");

        var widget = new org.korsakow.domain.widget.Scrubber(id, [], type, x, y, width, height, backgroundColor, foregroundColor, interactive, loadingColor, barWidth, barHeight);
        return widget;
    }
});
Class.register('org.korsakow.domain.FullscreenButtonInputMapper', org.korsakow.domain.InputMapper, {
    initialize: function($super, dao) {
        $super(dao);

    },
    map: function(data) {
        var type = this.parseString(data, "type");
        var id = this.parseInt(data, "id");
        var x = this.parseInt(data, "x");
        var y = this.parseInt(data, "y");
        var width = this.parseInt(data, "width");
        var height = this.parseInt(data, "height");

        var widget = new org.korsakow.domain.widget.FullscreenButton(id, [], type, x, y, width, height);
        return widget;
    }
});

Class.register('org.korsakow.domain.MasterVolumeInputMapper', org.korsakow.domain.InputMapper, {
    initialize: function($super, dao) {
        $super(dao);

    },
    map: function(data) {
        var type = this.parseString(data, "type");
        var id = this.parseInt(data, "id");
        var x = this.parseInt(data, "x");
        var y = this.parseInt(data, "y");
        var width = this.parseInt(data, "width");
        var height = this.parseInt(data, "height");

        var widget = new org.korsakow.domain.widget.MasterVolume(id, [], type, x, y, width, height);
        return widget;
    }
});

Class.register('org.korsakow.domain.SubtitlesInputMapper', org.korsakow.domain.InputMapper, {
    initialize: function($super, dao) {
        $super(dao);
    },
    map: function(data) {
        var type = this.parseString(data, "type");
        var id = this.parseInt(data, "id");
        var x = this.parseInt(data, "x");
        var y = this.parseInt(data, "y");
        var width = this.parseInt(data, "width");
        var height = this.parseInt(data, "height");
        var textStyle = org.korsakow.domain.textStyleInputMapper.map(data);

        var keywords = this.parseInt(data, "keywords");
        var widget = new org.korsakow.domain.widget.Subtitles(
            id, keywords, type,
            x, y, width, height,
            textStyle
        );
        return widget;
    }
});

Class.register('org.korsakow.domain.EventInputMapper', org.korsakow.domain.InputMapper, {
    initialize: function($super, dao) {
        $super(dao);
    },
    map: function(data) {
        var id = this.parseInt(data, "id");
        var predicate = this.dao.map(data.Predicate);
        var trigger = this.dao.map(data.Trigger);
        var rule = this.dao.map(data.Rule);
        var event = new org.korsakow.domain.Event(id, predicate, trigger, rule);
        return event;
    }
});

Class.register('org.korsakow.domain.PredicateInputMapper', org.korsakow.domain.InputMapper, {
    initialize: function($super, dao) {
        $super(dao);
    },
    map: function(data) {
        // TODO: map to an actual Predicate class.
        var id = this.parseInt(data, "id");
        var type = this.parseString(data, "type");
        var pred = {id: id, type: type};
        return pred;
    }
});

Class.register('org.korsakow.domain.TriggerInputMapper', org.korsakow.domain.InputMapper, {
    initialize: function($super, dao) {
        $super(dao);
    },
    map: function(data) {
        var type = this.parseString(data, "type");
        var mapper = org.korsakow.domain.InputMapperFactory.create(type, this.dao);
        var trigger = mapper.map(data);
        return trigger;
    }
});

Class.register('org.korsakow.domain.trigger.SnuTimeInputMapper', org.korsakow.domain.InputMapper, {
    initialize: function($super, dao) {
        $super(dao);
    },
    map: function(data) {
        var id = this.parseInt(data, "id");
        var time = this.parseInt(data, "time");
        var trigger = new org.korsakow.domain.trigger.SnuTime(id, time);
        return trigger;
    }
});

//
/**
 * This is actually a sort of MetaInputMapper in that it does a lookup for the actual mapper based on the rule's type
 */
Class.register('org.korsakow.domain.RuleInputMapper', org.korsakow.domain.InputMapper, {
    initialize: function($super, dao) {
        $super(dao);
    },
    map: function(data) {
        var type = this.parseString(data, "type");
        var mapper = org.korsakow.domain.InputMapperFactory.create(type, this.dao);
        return mapper.map(data);
    }
});

Class.register('org.korsakow.domain.KeywordLookupInputMapper', org.korsakow.domain.InputMapper, {
    initialize: function($super, dao) {
        $super(dao);
    },
    map: function(data) {
        var type = this.parseString(data, "type");
        var id = this.parseInt(data, "id");
        var keywords = this.dao.mapPojo(data.keywords);
        var rule = new org.korsakow.domain.rule.KeywordLookup(id, keywords, type);
        return rule;
    }
});
Class.register('org.korsakow.domain.ExcludeKeywordsInputMapper', org.korsakow.domain.InputMapper, {
    initialize: function($super, dao) {
        $super(dao);
    },
    map: function(data) {
        var type = this.parseString(data, "type");
        var id = this.parseInt(data, "id");
        var keywords = this.dao.mapPojo(data.keywords);
        var rule = new org.korsakow.domain.rule.ExcludeKeywords(id, keywords, type);
        return rule;
    }
});

Class.register('org.korsakow.domain.SearchInputMapper', org.korsakow.domain.InputMapper, {
    initialize: function($super, dao) {
        $super(dao);
    },
    map: function(data) {
        var type = this.parseString(data, "type");
        var id = this.parseInt(data, "id");
        var rules = this.dao.mapAll(data.rules);
        var maxLinks = org.korsakow.isValue(data["maxLinks"])?this.parseInt(data, "maxLinks"):null;
        var keepLinks = org.korsakow.isValue(data["keepLinks"])?this.parseBoolean(data, "keepLinks"):null;
        var rule = new org.korsakow.domain.rule.Search(id, [], type, rules, maxLinks, keepLinks);
        return rule;
    }
});
//

Class.register('org.korsakow.domain.ProjectInputMapper', org.korsakow.domain.InputMapper, {
    initialize: function($super, dao) {
        $super(dao);
    },
    map: function(data) {
        var id = this.parseInt(data, "id");
        var name = this.parseString(data, "name");
        var width = this.parseInt(data, "movieWidth");
        var height = this.parseInt(data, "movieHeight");
        var splashScreenMedia = (function() {
            if (org.korsakow.isValue(data["splashScreenMediaId"])) {
                return this.dao.findById(this.parseInt(data, "splashScreenMediaId"));
            } else
                return null;
        }).apply(this);

        var backgroundSoundVolume = 1.0;
        var backgroundSoundLooping = true;
        var backgroundSoundMedia = (function() {
            if(org.korsakow.isValue(data["backgroundSoundId"])) {
                backgroundSoundVolume = this.parseFloat(data, "backgroundSoundVolume");
                backgroundSoundLooping = this.parseBoolean(data, "backgroundSoundLooping");
                return this.dao.findById(this.parseInt(data, "backgroundSoundId"));
            } else
                return null;
        }).apply(this);

        var clickSoundVolume = 1.0;
        var clickSound = (function() {
            if (org.korsakow.isValue(data["clickSoundId"])) {
                clickSoundVolume = this.parseFloat(data, "clickSoundVolume");
                var clickSoundId = this.parseInt(data, "clickSoundId");
                return this.dao.findById(clickSoundId);
            } else
                return null;
        }).apply(this);
        var backgroundColor = org.korsakow.isValue(data["backgroundColor"])?this.parseColor(data, "backgroundColor"):null;
        var backgroundImage = (function() {
            if (org.korsakow.isValue(data["backgroundImageId"])) {
                return this.dao.findById(this.parseInt(data, "backgroundImageId"));
            } else
                return null;
        }).apply(this);
        var maxLinks = (function() {
            if (org.korsakow.isValue(data['maxLinks'])) {
                return this.parseInt(data, 'maxLinks');
            } else
                return null;
        }).apply(this);
        return new org.korsakow.domain.Project(id, name, width, height, splashScreenMedia, backgroundSoundMedia, backgroundSoundVolume, backgroundSoundLooping, clickSound, clickSoundVolume, backgroundColor, backgroundImage, maxLinks);
    }
});

Class.register('org.korsakow.domain.InputMapperFactory', org.korsakow.Factory, {
    initialize: function($super) {
        $super("InputMapperFactory");
    }
});

org.korsakow.domain.InputMapperFactory.instance = new org.korsakow.domain.InputMapperFactory();
org.korsakow.domain.InputMapperFactory.register("org.korsakow.widget.MainMedia", org.korsakow.domain.MainMediaInputMapper);
org.korsakow.domain.InputMapperFactory.register("org.korsakow.widget.MediaArea", org.korsakow.domain.MediaAreaInputMapper);
org.korsakow.domain.InputMapperFactory.register("org.korsakow.widget.Preview", org.korsakow.domain.PreviewInputMapper);
org.korsakow.domain.InputMapperFactory.register("org.korsakow.widget.FixedPreview", org.korsakow.domain.FixedPreviewMapper);
org.korsakow.domain.InputMapperFactory.register("org.korsakow.widget.InsertText", org.korsakow.domain.InsertTextInputMapper);
org.korsakow.domain.InputMapperFactory.register("org.korsakow.widget.IFrame", org.korsakow.domain.IFrameInputMapper);
org.korsakow.domain.InputMapperFactory.register("org.korsakow.widget.HtmlBox", org.korsakow.domain.HtmlBoxInputMapper);
org.korsakow.domain.InputMapperFactory.register("org.korsakow.widget.PlayTime", org.korsakow.domain.PlayTimeInputMapper);
org.korsakow.domain.InputMapperFactory.register("org.korsakow.widget.TotalTime", org.korsakow.domain.TotalTimeInputMapper);
org.korsakow.domain.InputMapperFactory.register("org.korsakow.widget.Scrubber", org.korsakow.domain.ScrubberInputMapper);
org.korsakow.domain.InputMapperFactory.register("org.korsakow.widget.PlayButton", org.korsakow.domain.PlayButtonInputMapper);
org.korsakow.domain.InputMapperFactory.register("org.korsakow.widget.FullscreenButton", org.korsakow.domain.FullscreenButtonInputMapper);
org.korsakow.domain.InputMapperFactory.register("org.korsakow.widget.MasterVolume", org.korsakow.domain.MasterVolumeInputMapper);
org.korsakow.domain.InputMapperFactory.register("org.korsakow.widget.Subtitles", org.korsakow.domain.SubtitlesInputMapper);
org.korsakow.domain.InputMapperFactory.register("org.korsakow.rule.KeywordLookup", org.korsakow.domain.KeywordLookupInputMapper);
org.korsakow.domain.InputMapperFactory.register("org.korsakow.rule.ExcludeKeywords", org.korsakow.domain.ExcludeKeywordsInputMapper);
org.korsakow.domain.InputMapperFactory.register("org.korsakow.rule.Search", org.korsakow.domain.SearchInputMapper);
org.korsakow.domain.InputMapperFactory.register("org.korsakow.trigger.SnuTime", org.korsakow.domain.trigger.SnuTimeInputMapper);

NS('org.korsakow');

Class.register('org.korsakow.SoundManager', {
    initialize: function($super) {
        $super();
        this.channels = {};
    },
    playSound: function(opts) {
        var that = this;

        var prev = this.channels[opts.channel];

        var cleanup = prev && prev.cancel() || jQuery.when();

        var state = {
            channel: opts.channel,
            canceled: false,
            cancel: jQuery.noop,
            audio: new org.korsakow.ui.AudioUI(opts.uri, 0)
        };

        this.channels[opts.channel] = state;

        cleanup.done(playNext);

        function playNext() {
            if (state.canceled)
                return;


            state.cancel = function() {
                if (state.canceled)
                    return jQuery.when();

                state.canceled = true;

                var cancelDeferred = jQuery.Deferred();
                if (state.audio.playing()) {
                    org.korsakow.Fade.fade({
                        duration: opts.fade*0.75,
                        begin: state.audio.volume(),
                        end: 0,
                        target: state.audio,
                        property: 'volume',
                        complete: cancelDeferred.resolve.bind(cancelDeferred)
                    });
                } else
                    cancelDeferred.resolve();

                cancelDeferred.done(function() {
                    state.audio.cancel();
                    state.audio = null;
                    if (that.channels[state.channel] === state)
                        delete that.channels[state.channel];
                });

                return cancelDeferred.promise();
            };

            if (opts.loop) state.audio.setLooping(opts.loop);

            var audioReady = jQuery.Deferred();

            org.korsakow.Fade.fade({
                duration: opts.fade,
                begin: 0,
                end: Number.isFinite(opts.volume) ? opts.volume : 1,
                target: state.audio,
                property: 'volume',
                complete: opts.complete
            });

            state.audio.play();
        }
    }
});

NS('org.korsakow');

Class.register('org.korsakow.WebStorage', org.korsakow.Object, {
    initialize: function($super, storage) {
        $super();
        this.storage = storage;
    },
    length: function() {
        return this.storage.length;
    },
    get: function(key) {
        return this.storage.getItem(key);
    },
    set: function(key, value) {
        return this.storage.setItem(key, value);
    },
    remove: function(key) {
        return this.storage.removeItem(key);
    },
    clear: function() {
        return this.storage.clear();
    }
});
Class.register('org.korsakow.MemoryStorage', org.korsakow.Object, {
    initialize: function($super) {
        $super();
        this.heap = {};
    },
    length: function() {
        return Object.keys(this.heap).length;
    },
    get: function(key) {
        return this.heap[key];
    },
    set: function(key, value) {
        this.heap[key] = value;
    },
    remove: function(key) {
        delete this.heap[key];
    },
    clear: function() {
        this.heap = {};
    }
});

NS('org.korsakow');

org.korsakow.Support = new (Class.register('org.korsakow.Support', org.korsakow.Object, {
    isIOS: /(iPad|iPhone|iPod)/gi.test(window.navigator.userAgent),
    isAndroid: /Android/gi.test(window.navigator.userAgent),
    isMobile: /iPad|iPhone|iPod|Android|webOS|BlackBerry|Windows Phone/gi.test(window.navigator.userAgent),
    /*
        Run in user gesture contexts or otherwise.

        unreliable, use only for debugging.
        resolves with boolean, or rejects if we cannot check.

        may not resolve at all.

        http://stackoverflow.com/questions/32653510/feature-detect-if-user-gesture-is-needed
    */
    testMediaPlaybackAllowed: function() {
        var deferred = jQuery.Deferred();
        var v = window.document.createElement("video");
        // https://github.com/kud/blank-video
        v.setAttribute('src', 'data:video/mp4;base64, AAAAHGZ0eXBNNFYgAAACAGlzb21pc28yYXZjMQAAAAhmcmVlAAAGF21kYXTeBAAAbGliZmFhYyAxLjI4AABCAJMgBDIARwAAArEGBf//rdxF6b3m2Ui3lizYINkj7u94MjY0IC0gY29yZSAxNDIgcjIgOTU2YzhkOCAtIEguMjY0L01QRUctNCBBVkMgY29kZWMgLSBDb3B5bGVmdCAyMDAzLTIwMTQgLSBodHRwOi8vd3d3LnZpZGVvbGFuLm9yZy94MjY0Lmh0bWwgLSBvcHRpb25zOiBjYWJhYz0wIHJlZj0zIGRlYmxvY2s9MTowOjAgYW5hbHlzZT0weDE6MHgxMTEgbWU9aGV4IHN1Ym1lPTcgcHN5PTEgcHN5X3JkPTEuMDA6MC4wMCBtaXhlZF9yZWY9MSBtZV9yYW5nZT0xNiBjaHJvbWFfbWU9MSB0cmVsbGlzPTEgOHg4ZGN0PTAgY3FtPTAgZGVhZHpvbmU9MjEsMTEgZmFzdF9wc2tpcD0xIGNocm9tYV9xcF9vZmZzZXQ9LTIgdGhyZWFkcz02IGxvb2thaGVhZF90aHJlYWRzPTEgc2xpY2VkX3RocmVhZHM9MCBucj0wIGRlY2ltYXRlPTEgaW50ZXJsYWNlZD0wIGJsdXJheV9jb21wYXQ9MCBjb25zdHJhaW5lZF9pbnRyYT0wIGJmcmFtZXM9MCB3ZWlnaHRwPTAga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCB2YnZfbWF4cmF0ZT03NjggdmJ2X2J1ZnNpemU9MzAwMCBjcmZfbWF4PTAuMCBuYWxfaHJkPW5vbmUgZmlsbGVyPTAgaXBfcmF0aW89MS40MCBhcT0xOjEuMDAAgAAAAFZliIQL8mKAAKvMnJycnJycnJycnXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXiEASZACGQAjgCEASZACGQAjgAAAAAdBmjgX4GSAIQBJkAIZACOAAAAAB0GaVAX4GSAhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZpgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGagC/AySEASZACGQAjgAAAAAZBmqAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZrAL8DJIQBJkAIZACOAAAAABkGa4C/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmwAvwMkhAEmQAhkAI4AAAAAGQZsgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGbQC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBm2AvwMkhAEmQAhkAI4AAAAAGQZuAL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGboC/AySEASZACGQAjgAAAAAZBm8AvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZvgL8DJIQBJkAIZACOAAAAABkGaAC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmiAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZpAL8DJIQBJkAIZACOAAAAABkGaYC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmoAvwMkhAEmQAhkAI4AAAAAGQZqgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGawC/AySEASZACGQAjgAAAAAZBmuAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZsAL8DJIQBJkAIZACOAAAAABkGbIC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBm0AvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZtgL8DJIQBJkAIZACOAAAAABkGbgCvAySEASZACGQAjgCEASZACGQAjgAAAAAZBm6AnwMkhAEmQAhkAI4AhAEmQAhkAI4AhAEmQAhkAI4AhAEmQAhkAI4AAAAhubW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAABDcAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAzB0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAA+kAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAALAAAACQAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAPpAAAAAAABAAAAAAKobWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAB1MAAAdU5VxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAACU21pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAhNzdGJsAAAAr3N0c2QAAAAAAAAAAQAAAJ9hdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAALAAkABIAAAASAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGP//AAAALWF2Y0MBQsAN/+EAFWdCwA3ZAsTsBEAAAPpAADqYA8UKkgEABWjLg8sgAAAAHHV1aWRraEDyXyRPxbo5pRvPAyPzAAAAAAAAABhzdHRzAAAAAAAAAAEAAAAeAAAD6QAAABRzdHNzAAAAAAAAAAEAAAABAAAAHHN0c2MAAAAAAAAAAQAAAAEAAAABAAAAAQAAAIxzdHN6AAAAAAAAAAAAAAAeAAADDwAAAAsAAAALAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAAiHN0Y28AAAAAAAAAHgAAAEYAAANnAAADewAAA5gAAAO0AAADxwAAA+MAAAP2AAAEEgAABCUAAARBAAAEXQAABHAAAASMAAAEnwAABLsAAATOAAAE6gAABQYAAAUZAAAFNQAABUgAAAVkAAAFdwAABZMAAAWmAAAFwgAABd4AAAXxAAAGDQAABGh0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAACAAAAAAAABDcAAAAAAAAAAAAAAAEBAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAQkAAADcAABAAAAAAPgbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAC7gAAAykBVxAAAAAAALWhkbHIAAAAAAAAAAHNvdW4AAAAAAAAAAAAAAABTb3VuZEhhbmRsZXIAAAADi21pbmYAAAAQc21oZAAAAAAAAAAAAAAAJGRpbmYAAAAcZHJlZgAAAAAAAAABAAAADHVybCAAAAABAAADT3N0YmwAAABnc3RzZAAAAAAAAAABAAAAV21wNGEAAAAAAAAAAQAAAAAAAAAAAAIAEAAAAAC7gAAAAAAAM2VzZHMAAAAAA4CAgCIAAgAEgICAFEAVBbjYAAu4AAAADcoFgICAAhGQBoCAgAECAAAAIHN0dHMAAAAAAAAAAgAAADIAAAQAAAAAAQAAAkAAAAFUc3RzYwAAAAAAAAAbAAAAAQAAAAEAAAABAAAAAgAAAAIAAAABAAAAAwAAAAEAAAABAAAABAAAAAIAAAABAAAABgAAAAEAAAABAAAABwAAAAIAAAABAAAACAAAAAEAAAABAAAACQAAAAIAAAABAAAACgAAAAEAAAABAAAACwAAAAIAAAABAAAADQAAAAEAAAABAAAADgAAAAIAAAABAAAADwAAAAEAAAABAAAAEAAAAAIAAAABAAAAEQAAAAEAAAABAAAAEgAAAAIAAAABAAAAFAAAAAEAAAABAAAAFQAAAAIAAAABAAAAFgAAAAEAAAABAAAAFwAAAAIAAAABAAAAGAAAAAEAAAABAAAAGQAAAAIAAAABAAAAGgAAAAEAAAABAAAAGwAAAAIAAAABAAAAHQAAAAEAAAABAAAAHgAAAAIAAAABAAAAHwAAAAQAAAABAAAA4HN0c3oAAAAAAAAAAAAAADMAAAAaAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAACMc3RjbwAAAAAAAAAfAAAALAAAA1UAAANyAAADhgAAA6IAAAO+AAAD0QAAA+0AAAQAAAAEHAAABC8AAARLAAAEZwAABHoAAASWAAAEqQAABMUAAATYAAAE9AAABRAAAAUjAAAFPwAABVIAAAVuAAAFgQAABZ0AAAWwAAAFzAAABegAAAX7AAAGFwAAAGJ1ZHRhAAAAWm1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNTUuMzMuMTAw');
        var promise = v.play();
        if (promise instanceof Promise) {
            promise.then(function() {
                deferred.resolve(true);
            }, function(error){
                if (error.name === "NotAllowedError") {
                    deferred.resolve(false);
                } else {
                    deferred.reject();
                }
            });
        } else {
            deferred.reject();
        }
        return deferred.promise();
    },
    refreshMediaCacheIfMobile: function() {
        if (org.korsakow.Support.isMobile)
            org.korsakow.ui.mediaElementFactory.populate();
    },
    isMP4VideoSupported: function() {
        var elem = jQuery("<video />");
        var test = elem[0].canPlayType('video/mp4');
        return test && test.length > 0;
    },
    isLocalStorageAvailable: function() {
        if (!window.localStorage)
            return false;
        try {
            window.localStorage.setItem('org.korsakow.Support.isLocalStorageAvailable', true);
            return !!window.localStorage.getItem('org.korsakow.Support.isLocalStorageAvailable');
        } catch (e) {
            // iOS and/or private browsing can block storage in non-evident ways
            // http://stackoverflow.com/questions/14555347/html5-localstorage-error-with-safari-quota-exceeded-err-dom-exception-22-an
            return false;
        }
    },
    getMouseOverEvents: function() {
        return org.korsakow.Support.isMobile ? 'touchstart' : 'mouseenter';
    },
    getMouseOutEvents: function() {
        return org.korsakow.Support.isMobile ? 'touchend touchcancel' : 'mouseleave';
    }
}));

NS('org.korsakow');

/* Interpolates a value over a period of time at a fixed rate.
 *
 * Events:
 *     change: called once per iteration
 *     complete: called once on the last iteration
 *
 */
Class.register('org.korsakow.Tween', {
    initialize: function($super, duration, begin, end) {
        $super();
        this.running = false;
        this.begin = begin;
        this.end = end;
        this.duration = duration;
        this.position = 0;
        this.time = 0;
        this.base = 0;
    },
    start: function() {
        if (this.running) return;
        this.running = true;
        this.base = org.korsakow.Date.now();
        this.timeout = org.korsakow.setInterval(org.korsakow.ftor(this, this.onTimer), org.korsakow.Tween.DefaultInterval);
        return this;
    },
    pause: function() {
        if (!this.running) return;
        org.korsakow.clearInterval(this.timeout);
        this.timeout = null;
        return this;
    },
    stop: function() {
        if (!this.running) return;
        this.cancel();
        this.position = this.end;
        jQuery(this).trigger('change', this.end);
        jQuery(this).trigger('complete');
        return this;
    },
    cancel: function() {
        if (!this.running) return;
        this.running = false;
        org.korsakow.clearInterval(this.timeout);
        this.timeout = null;
        return this;
    },
    onTimer: function() {
        var now = org.korsakow.Date.now();
        this.time = now-this.base;
        if (this.time > this.duration)
            this.time = this.duration;
        this.position = this.begin + (this.end-this.begin) * (this.duration?(this.time / this.duration):1);
        if (this.time >= this.duration)
            this.stop();
        else
            jQuery(this).trigger('change', this.position);
    }
});
org.korsakow.Tween.DefaultInterval = 50;
org.korsakow.Tween.run = function(duration, begin, end, onchange) {
    var t = new org.korsakow.Tween(duration, begin, end);
    jQuery(t).bind('change', onchange);
    return t;
};

Class.register('org.korsakow.Fade', {

});
/* Creates a fading tween.
 *
 * @param opts {
 *     duration: see Tween
 *     begin: see Tween
 *     end: see Tween
 *     target: the object whose property will be faded
 *     property: the property which will be faded (may be a property or accessor)
 *     complete: a callback invoked when the tween completes
 * }
 *
 * @return the tween object
 */
org.korsakow.Fade.fade = function(opts) {
    var t = new org.korsakow.Tween(opts.duration, opts.begin, opts.end);
    var init = org.korsakow.Utility.apply(opts.target, opts.property);
    jQuery(t).bind('change', function() {
        org.korsakow.Utility.update(opts.target, opts.property, t.position);
    });
    if (opts.complete)
        jQuery(t).bind('complete', opts.complete);
    org.korsakow.Utility.update(opts.target, opts.property, 0);
    t.start();
    return t;
};

/* Wrappers for the media types.
 *
 * An attempt is made at creating a consistent API.
 *
 */
NS('org.korsakow.ui');

/**
 Mobile devices have restrictions only allowing video/audio playback when inititated by a user gesture.
 In fact we can work around this by pre-creating a number of dom elements on a user gesture and
 those elements will no longer be restricted.

 Images are included here for uniformity, but not actually pre-created.
*/
Class.register('org.korsakow.ui.PrecachedMediaElementFactory', {
    initialize: function($super) {
        $super();
        this.audioCache = [];
        this.videoCache = [];
    },
    _createNewAudioElement: function() {
        var audio = jQuery('<audio/>');
        audio[0].load(); // required for bypassing user gesture restrictions
        return audio;
    },
    _createNewVideoElement: function() {
        var video = jQuery('<video/>');
        video[0].load(); // required for bypassing user gesture restrictions
        return video;
    },
    populate: function() {
        // Note: too high a number causes performance issues and can even
        //       cause this caching trick to fail on some browsers/devices.
        var maxCache = 20;
        if (this.audioCache.length < maxCache) {
            org.korsakow.log.debug('org.korsakow.ui.PrecachedMediaElementFactory repopulating audio from ' + this.audioCache.length + ' to ' + maxCache);
            for (var i = this.audioCache.length; i < maxCache; ++i) {
                this.audioCache.push(this._createNewAudioElement());
            }
        }
        if (this.videoCache.length < maxCache) {
            org.korsakow.log.debug('org.korsakow.ui.PrecachedMediaElementFactory repopulating video from ' + this.videoCache.length + ' to ' + maxCache);
            for (var i = this.videoCache.length; i < maxCache; ++i) {
                this.videoCache.push(this._createNewVideoElement());
            }
        }
    },
    newAudioElement: function() {
        if (!this.audioCache.length)
            throw new org.korsakow.Exception('Audio Element Cache is empty');
        org.korsakow.log.debug('org.korsakow.ui.PrecachedMediaElementFactory audio cache remaining: ' + (this.audioCache.length-1));
        return this.audioCache.shift();
    },
    newVideoElement: function() {
        if (!this.videoCache.length)
            throw new org.korsakow.Exception('Video Element Cache is empty');
        org.korsakow.log.debug('org.korsakow.ui.PrecachedMediaElementFactory video cache remaining: ' + (this.videoCache.length-1));
        return this.videoCache.shift();
    },
    newImageElement: function() {
        return jQuery('<img>');
    }
});

Class.register('org.korsakow.ui.DefaultMediaElementFactory', {
    initialize: function($super) {
        $super();
    },
    newAudioElement: function() {
        return jQuery('<audio>');
    },
    newVideoElement: function() {
        return jQuery('<video>');
    },
    newImageElement: function() {
        return jQuery('<img>');
    }
});

org.korsakow.ui.mediaElementFactory = new org.korsakow.ui.DefaultMediaElementFactory();

Class.register('org.korsakow.ui.MediaUI', {
    initialize: function($super) {
        $super();
    },
    one: function() {
        this.element.one.apply(this.element, arguments);
    },
    bind: function() {
        this.element.bind.apply(this.element, arguments);
    },
    unbind: function() {
        this.element.unbind.apply(this.element, arguments);
    },
    play: function () { },
    pause: function() { },
    paused: function() { },
    ended: function() { },
    currentTime: function() { },
    playing: function() {
        // html5 API sucks
        return !this.paused() && !this.ended() && this.currentTime();
    }
});

/* Wrapper around HTML images.
 *
 */
Class.register('org.korsakow.ui.ImageUI', org.korsakow.ui.MediaUI, {
    initialize: function($super, model) {
        $super();

        this.element = org.korsakow.ui.mediaElementFactory.newImageElement()
            .addClass("MediaUI")
            .addClass("ImageUI");

        this.isLoaded = false;
        this.isPlaying = false;
        this.isEnded = false;
        this._loop = false;
        this.startTime = 0;
        this.updateInterval = 16; //ms
        this._currentTime = 0;
        if (Number.isFinite(model.duration)) {
            this._duration = model.duration;
        } else {
            this._duration = 5000;
        }

    },
    whenLoaded: function(callback) {
        if (this.isLoaded) {
            callback();
        } else {
            this.element.one('canplay', callback);
        }
    },
    load: function(src) {
        this.isLoaded = false;
        this.element.removeClass('loaded');
        this.element.attr("src", src);
        var that = this;

        this.element.one('load', function() {
            that.isLoaded = true;
            that.element.addClass('loaded');
            that.element.trigger("canplay");
            that.element.trigger("loadedmetadata");
            that.element.trigger("canplaythrough");
            that.element.prop("readyState", 4);
        });
    },
    source: function() {
        return this.element.attr("src");
    },
    play: function() {
        if (this.isPlaying === true){
            return false;
        }
        this.isPlaying = true;
        var that = this;
        this.whenLoaded(function() {
            that.startTime = org.korsakow.Date.now();
            that.interval = org.korsakow.setInterval(function() { that.imagePlay(); }, that.updateInterval);
            that.element.trigger("play");
            that.element.trigger("playing");
        });
    },
    imagePlay: function(){
        if (this.isPlaying === false){
            return false;
        }
        this.currentTime(this.currentTime() + (( org.korsakow.Date.now() - this.startTime )));
        this.startTime = org.korsakow.Date.now();
        this.element.trigger("timeupdate");
        if (this.currentTime() >= this.duration()) {
            this.element.trigger("ended");
            this.element.trigger("pause"); // TODO: does this belong here?
            if (this.loop()) {
                var over = this.currentTime() - this.duration();
                // TODO: dispatch events?
                //         safari 7.0.2: N/A
                //         chrome 35.0.1916.153: ended
                this.currentTime(over % this.duration());
            } else {
                this.currentTime(this.duration());
                this.isEnded = true;
                this.isPlaying = false;
                org.korsakow.clearInterval(this.interval);
            }
        }
    },
    pause: function() {
        if (this.isPlaying === false){
            return false;
        }
        org.korsakow.clearInterval(this.interval);
        this.interval = null;
        this.isPlaying = false;
        this.element.trigger("paused");
    },
    paused: function() { return !this.isPlaying; },
    ended: function() {
        return this.isEnded;
    },
    currentTime: function(x) {
        if (Number.isFinite(x)){
            this._currentTime = x;
            this.element.trigger("seeked");
        }
        return this._currentTime;
    },
    duration: function(){
        return this._duration;
    },
    loop: function(x) {
        if (org.korsakow.isDefined(x))
            this._loop = x;
        return this._loop;
    }
});

/* Wrapper around HTML videos.
 *
 */
Class.register('org.korsakow.ui.VideoUI', org.korsakow.ui.MediaUI, {
    initialize: function($super, model) {
        $super();
        var This = this;
        this.model = model;
        this.element = org.korsakow.ui.mediaElementFactory.newVideoElement()
            .addClass("MediaUI")
            .addClass("VideoUI")
            .bind('error', function(event) {
                if (event.currentTarget.error) {
                    // no code when error originates in source tag
                    var code = event.currentTarget.error && org.korsakow.media.Errors.errorToString(event.currentTarget.error.code);
                    var state = event.currentTarget.networkState && org.korsakow.media.NetworkState.stateToString(event.currentTarget.networkState);
                    org.korsakow.log.error('Video error: code (' + code + '), state (' + state+ ')\n');
                }
            });
    },
    load: function(src) {
        var This = this;


        this.element.attr('src', src);

        This.element.removeClass('loaded');
        this.element.one('canplay', function() {
            This.element.addClass('loaded');
        });

        var placeholder = 'data/sys/videos/link_break.mp4';
        if (src !== placeholder) {
            this.element.one('error', function() {
                if (This.element[0].networkState === org.korsakow.media.NetworkState.NETWORK_NO_SOURCE) {
                    This.element.attr('src', placeholder);
                    This.element[0].load();
                }
            });
        }

        this.element[0].load();
    },
    play: function() {
        var This = this;
        // firefox 47.0 needs async between append <source> & play
        org.korsakow.setTimeout(function() {
            This.element[0].play();
        });
    },
    pause: function() {
        this.element[0].pause();
    },
    paused: function() {
        return this.element.prop('paused');
    },
    ended: function() {
        return this.element.prop('ended');
    },
    buffered: function() {
        var total = 0;
        var b = this.element.prop('buffered');
        var len = b.length;
        for (var i = 0; i < len; ++i)
            total += b.end(i) - b.start(i);
        return total * 1000;
    },
    currentTime: function(x) {
        if (Number.isFinite(x))
            this.element.prop('currentTime', x/1000);
        return Math.floor(this.element.prop('currentTime')*1000);
    },
    duration: function() {
        return Math.floor(this.element.prop('duration')*1000);
    },
    source: function() {
        return this.element.find("source").attr("src");
    },
    volume: function(x) {
        if (Number.isFinite(x))
            this.element.prop("volume", x);
        return this.element.prop("volume");
    },
    loop: function(x) {
        if (org.korsakow.isDefined(x))
            this.element.prop("loop", x);
        return this.element.prop("loop");
    }
});

Class.register('org.korsakow.ui.SubtitlesUI', {
    initialize: function($super, opts) {
        $super();
        this.element = jQuery("<div></div>");
        this.element.addClass("SubtitlesUI");
    },
    text: function(text) {
        text = jQuery.makeArray(text);

        this.element.children().remove();

        this.element.append(text.map(function(t) {
            return jQuery('<p/>').html(t).addClass('subtitleLine');
        }));
    }
});

/* Browser compatible wrapper around the HTML5 <audio> element.
 *
 */
Class.register('org.korsakow.ui.AudioUI', {
    one: function() {
        this.elem.one.apply(this.elem, arguments);
    },
    bind: function() {
        this.elem.bind.apply(this.elem, arguments);
    },
    unbind: function() {
        this.elem.unbind.apply(this.elem, arguments);
    },
    initialize: function($super, url, vol) {
        $super();
        this.url = url;
        this.innerVolume = vol || 1.0;
        //this.globalVolume = 1.0;
        this.init(url);
    },
    init: function(src) {
        var This = this;
        this.elem = org.korsakow.ui.mediaElementFactory.newAudioElement()
            .bind('error', function(event) {
                if (event.currentTarget.error) {
                    // no code when error originates in source tag
                    var code = event.currentTarget.error && org.korsakow.media.Errors.errorToString(event.currentTarget.error.code);
                    var state = event.currentTarget.networkState && org.korsakow.media.NetworkState.stateToString(event.currentTarget.networkState);
                    org.korsakow.log.error('Audio error: code (' + code + '), state (' + state+ ')\n');
                }
            });
        this.elem.attr('src', src);
        // phantomjs workaround: audio tag not fully supported (no load method)
        this.elem[0].load && this.elem[0].load();
    },
    play: function() {
        this.elem[0].play();
    },
    pause: function() {
        this.elem[0].pause();
    },
    paused: function() {
        return this.elem.prop('paused');
    },
    ended: function() {
        return this.elem.prop('ended');
    },
    playing: function() {
        // html5 API sucks
        return !this.paused() && !this.ended() && this.currentTime();
    },
    /*
     * If no arguments are supplied, retrieves the current volume.
     * If there is an argument the volume is first set, then returned.
     *
     * @param v [0,1], supports operations, e.g. "+=0.5"
     */
    volume: function(v) {
        if (arguments.length) {
            var t = org.korsakow.Utility.applyOperators(v, this.innerVolume);
            // TODO: remove this debug code or clean it up
            if (!Number.isFinite(t)) {
                org.korsakow.log.warn("Audio.volume, !isFinite(t)", v, t);
            }
            this.innerVolume = t;
            this.elem[0].volume = t * org.korsakow.ui.AudioUI.globalVolume;
        }
        return this.innerVolume;
    },
    /* Completely cancels the audio, stopping it and preventing any further download.
     *
     * @param opts {
     *     fade [optional]: duration (milliseconds) to fade out over before stopping, default is 0
     * }
     */
    cancel: function(opts) {
        opts = opts || {};
        org.korsakow.Fade.fade({
            duration: opts.fade || 0,
            begin: 1,
            end: 0,
            target: this.elem[0],
            property: 'volume',
            complete: org.korsakow.ftor(this, function() {
                if (this.elem) {
                    // stops any ongoing browser download of the media
                    // https://developer.mozilla.org/en-US/docs/Using_HTML5_audio_and_video
                    this.elem[0].pause();
                    this.elem.attr('src', '');
                    this.elem.removeAttr('src');
                    this.elem.remove();
                }
            })
        });
    },
    /* Gets or sets the current time in seconds
     *
     * Supports operators.
     */
    currentTime: function(v) {
        if (arguments.length) {
            var t = org.korsakow.Utility.applyOperators(v, this.elem[0].currentTime);
            this.elem[0].currentTime = t;
        }
        return this.elem[0].currentTime;
    },
    playTime: function() {
        return this.elem[0].played.end();
    },
    length: function() {
        return this.elem[0].seekable.end() - this.elem[0].seekable.start();
    },
    setLooping: function(loop){
        this.elem[0].loop = loop;
    }

});

org.korsakow.ui.AudioUI.globalVolume = 1.0;

Class.register('org.korsakow.media.Errors', org.korsakow.Object, {
});
org.korsakow.media.Errors.ERR_ABORTED = 1;
org.korsakow.media.Errors.ERR_NETWORK = 2;
org.korsakow.media.Errors.ERR_DECODE = 3;
org.korsakow.media.Errors.ERR_SRC_NOT_SUPPORTED = 4;
org.korsakow.media.Errors.errorToString = function(e) {
    switch (e) {
    case org.korsakow.media.Errors.ERR_ABORTED: return "aborted";
    case org.korsakow.media.Errors.ERR_NETWORK: return "network error";
    case org.korsakow.media.Errors.ERR_DECODE: return "decoding error";
    case org.korsakow.media.Errors.ERR_SRC_NOT_SUPPORTED: return "source not supported";
    default: return "unknown #" + e;
    }
};

Class.register('org.korsakow.media.NetworkState', org.korsakow.Object, {
});
org.korsakow.media.NetworkState.NETWORK_EMPTY = 0;
org.korsakow.media.NetworkState.NETWORK_IDLE = 1;
org.korsakow.media.NetworkState.NETWORK_LOADING = 2;
org.korsakow.media.NetworkState.NETWORK_NO_SOURCE = 3;
org.korsakow.media.NetworkState.stateToString = function(e) {
    switch (e) {
    case org.korsakow.media.NetworkState.NETWORK_EMPTY: return 'There is no data yet. Also, readyState is HAVE_NOTHING';
    case org.korsakow.media.NetworkState.NETWORK_IDLE: return 'Idle';
    case org.korsakow.media.NetworkState.NETWORK_LOADING: return 'The media is loading';
    case org.korsakow.media.NetworkState.NETWORK_NO_SOURCE: return 'No source (or not found)';
    default: return "unknown #" + e;
    }
};

/* Maps the domain objects' class names to the UI classes.
 *
 */
Class.register("org.korsakow.ui.MediaUIFactory", org.korsakow.Factory, {
    initialize: function($super) {
        $super("MediaUIFactory");
    }
});
org.korsakow.ui.MediaUIFactory.instance = new org.korsakow.ui.MediaUIFactory();
org.korsakow.ui.MediaUIFactory.register("org.korsakow.domain.Image", org.korsakow.ui.ImageUI);
org.korsakow.ui.MediaUIFactory.register("org.korsakow.domain.Video", org.korsakow.ui.VideoUI);
org.korsakow.ui.MediaUIFactory.register("org.korsakow.domain.Subtitles", org.korsakow.ui.SubtitlesUI);
//org.korsakow.ui.MediaUIFactory.register("org.korsakow.domain.Sound", org.korsakow.ui.AudioUI);

NS('org.korsakow.util');

org.korsakow.util.SubtitleException = org.korsakow.Exception;

Class.register('org.korsakow.util.SubtitleParserFactory', {
    initialize: function($super) {
        $super();
    },
    parser: function(filePath) {
        if (filePath.match(/[.]srt$/)) {
            org.korsakow.log.info('Subtitle detected as SRT: ', filePath);
            return new org.korsakow.util.SrtSubtitleParser();
        } else if (filePath.match(/[.]txt$/)) {
            org.korsakow.log.info('Subtitle detected as K3: ', filePath);
            return new org.korsakow.util.K3SubtitleParser();
        } else {
            org.korsakow.log.error('Subtitle detected as unknown: ', filePath);
            return null;
        }
    }
});

/* Represents a single subtitle
 *
 * @param name: String name used for debugging
 * @param time: uint the time at which the subtitle first appears
 * @param duration: uint the length of time the subtitle is shown for
 * @param subtitle: Array[String] the lines of text of the subtitle
 */
Class.register('org.korsakow.util.SubtitleCuePoint', {
    initialize: function($super, name, time, duration, subtitle) {
        $super();
        this.name = name;
        this.time = time;
        this.duration = duration;
        this.subtitle = subtitle;
    }
});

/* Parses subtitles in the SRT (http://en.wikipedia.org/wiki/SubRip) format.
 *
 */
Class.register('org.korsakow.util.SrtSubtitleParser', {
    initialize: function($super) {
        $super();
        this.timeLinePattern = /([0-9]{2}):([0-9]{2}):([0-9]{2}),([0-9]{3}) --> ([0-9]{2}):([0-9]{2}):([0-9]{2}),([0-9]{3})/;
    },

    /*
     * @param lines: Array[String]
     */
    parse: function(rawLines) {
        var cuepoints = [];
        var lines = rawLines.split( /(?:\r\n)|\n|\r/ ).map( jQuery.trim ); // the defacto standard seems to be CRLF but users have such a hard time with this so we're leanient
        var line = 0;
        var counter = 0;

        while (line < lines.length) {
            if (!lines[line].length) {
                ++line;
                continue;
            }
            var ret = this.parseCuePoint( lines, line, counter );
            line = ret.offset;
            ++counter;
            cuepoints.push( ret.cuepoint );
        }
        return cuepoints;
    },
    /*
     * @param lines: Array[String] line array
     * @param offset: uint offset into lines of the current cuepoint
     * @param counter: uint consistency counter
     * @return {offset:Number, cuepoint:ICuePoint}
     */
    parseCuePoint: function(lines, offset, counter) {
        var count = Number.parseInt( lines[offset++] );
        if ( count !== counter + 1 )
            throw new org.korsakow.util.SubtitleException("inconsistant file at line #" + offset + " ; " + count + "!=" + (counter + 1));

        var line = lines[offset++];
        var match = this.timeLinePattern.exec( line );
        if (!match)
            throw new org.korsakow.util.SubtitleException("invalid time at line #" + offset + ': ' + line);
        var begin = this.getTime(match[1], match[2], match[3], match[4]);
        var end   = this.getTime(match[5], match[6], match[7], match[8]);

        var content = [];
        for (; offset < lines.length; ++offset) {
            if (!lines[offset].length) {
                ++offset;
                break;
            }
            content.push( lines[offset] );
        }
        var name = "" + counter;

        return {
            offset: offset,
            cuepoint: new org.korsakow.util.SubtitleCuePoint( name, begin, end-begin, content )
        };
    },
    /*
     * @param hh: String hours
     * @param mm: String minutes
     * @param ss: String seconds
     * @param ms: String milliseconds
     * @return uint
     */
    getTime: function(hh, mm, ss, ms) {
        // specify the radix to avoid octal interpretations in some browsers (e.g. PhantomJS) since we capture leading zeros
        return (parseInt(hh, 10)*60*60 + Number.parseInt(mm, 10)*60 + Number.parseInt(ss, 10)) * 1000 + Number.parseInt(ms, 10);
    }
});

/* Parses subtitles in the legacy Korsakow v3 format.
 *
 */
Class.register('org.korsakow.util.K3SubtitleParser', {
    initialize: function($super) {
        $super();
        this.timeLinePattern = /^\s*<([0-9]+)>\s*$/;
    },

    /*
     * @param lines: Array[String]
     */
    parse: function(rawLines) {
        var cuepoints = [];
        var lines = rawLines.split( /(?:\r\n)|\n|\r/ ).map( jQuery.trim );
        var line = 0;

        // skip header stuff
        for (; line < lines.length; ++line) {
            if (this.timeLinePattern.test(lines[line]))
                break;
        }

        while (line < lines.length) {
            if (lines[line] === '<end>')
                break;

            var ret = this.parseCuePoint(lines, line);
            line = ret.offset;
            if (lines[line].length)
                throw new org.korsakow.util.SubtitleException("expected blank line after subtitle");
            ++line;
            cuepoints.push(ret.cuepoint);
        }
        return cuepoints;
    },
    /*
     * @param lines: Array[String] line array
     * @param offset: uint offset into lines of the current cuepoint
     * @return {offset:Number, cuepoint:ICuePoint}
     */
    parseCuePoint: function(lines, offset) {
        var match = this.timeLinePattern.exec( lines[offset++] );
        if (!match)
            throw new org.korsakow.util.SubtitleException("invalid time at line #" + (offset-1) + ': ' + lines[offset-1]);
        var begin = this.getTime(match[1]);

        var content = [];
        for (; !this.timeLinePattern.test(lines[offset]); ++offset)
            content.push(lines[offset]);

        match = this.timeLinePattern.exec( lines[offset++] );
        if (!match)
            throw new org.korsakow.util.SubtitleException("invalid time at line #" + (offset-1) + ': ' + lines[offset-1]);
        var end = this.getTime(match[1]);

        var name = begin + '-' + end;
        return {
            offset: offset,
            cuepoint: new org.korsakow.util.SubtitleCuePoint( name, begin, end-begin, content )
        };
    },
    getTime: function(ss) {
        return Number.parseInt(ss, 10); // base needed because there are often leading zeros
    }
});
