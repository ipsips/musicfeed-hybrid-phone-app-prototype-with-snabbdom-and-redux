'use strict';

//  Since resize events can fire at a high rate
//  we throttle calling it. implementation from:
//  developer.mozilla.org/en-US/docs/Web/Events/resize#requestAnimationFrame_customEvent
if (process.browser || typeof window !== 'undefined')
    (function defineThrottledResizeEvent() {
        var running = false;

        window.addEventListener('resize', () => {
            if (running)
                return;

            running = true;
            requestAnimationFrame(() => {
                //  see: https://developer.mozilla.org/en-US/docs/Web/Events/resize#requestAnimationFrame_customEvent
                window.dispatchEvent(new CustomEvent('throttledResize'));
                running = false;
            });
        });
    })();

//  Polyfills
if (!Array.prototype.find)
    Array.prototype.find = function (predicate) {
        if (this === null)
            throw new TypeError('Array.prototype.find called on null or undefined');

        if (typeof predicate !== 'function')
            throw new TypeError('predicate must be a function');

        var list = Object(this),
            length = list.length >>> 0,
            thisArg = arguments[1],
            value, i;

        for (i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list))
                return value;
        }

        return undefined;
    };

if (!Array.prototype.findIndex)
    Array.prototype.findIndex = function (predicate) {
        if (this === null)
            throw new TypeError('Array.prototype.findIndex called on null or undefined');

        if (typeof predicate !== 'function')
            throw new TypeError('predicate must be a function');

        var list = Object(this),
            length = list.length >>> 0,
            thisArg = arguments[1],
            value, i;

        for (i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list))
                return i;
        }

        return -1;
    };

//  Text case transformations
if (!String.prototype.toSentenceCase)
    String.prototype.toSentenceCase = function () {
        return this.charAt(0).toUpperCase() + this.substring(1);
    };

if (!String.prototype.toTitleCase)
    String.prototype.toTitleCase = function () {
        return this.split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.substring(1)).join(' ');
    };

//  Pad with a leading zero when necessary
if (!Number.prototype.leadZero)
    Number.prototype.leadZero = function () {
        return ('0'+ this).substr(-2);
    };

if (!String.prototype.leadZero)
    String.prototype.leadZero = function () {
        return ('0'+ this).substr(-2);
    };

export function hasClass(el, className) {
    return (' '+el.className+' ').replace(/[\n\t]/g, ' ').indexOf(' '+className+' ') > -1
            ? true
            : false;
}

//  A utility function to safely escape JSON
//  for embedding in a <script> tag
export function safeStringify(obj) {
    return JSON.stringify(obj).replace(/<\/script/g, '<\\/script').replace(/<!--/g, '<\\!--')
}

//  Check if deep object propery exists
//  see: stackoverflow.com/a/2631198
//
//  var test = {level1:{level2:{level3:'level3'}} };
//  checkNested(test, 'level1', 'level2', 'level3'); // true
//  checkNested(test, 'level1', 'level2', 'foo'); // false
export function checkNested(obj /*, level1, level2, ... levelN*/) {
    var args = Array.prototype.slice.call(arguments, 1);

    for (var i = 0; i < args.length; i++) {

        if (!obj || !Object.prototype.hasOwnProperty.call(obj, args[i]))
            return false;

        obj = obj[args[i]];
    }

    return true;
}

//  does the same trick as the getRef() below
export function getNested(obj /*, level1, level2, ... levelN*/) {
    var args = Array.prototype.slice.call(arguments, 1);

    for (var i = 0; i < args.length; i++) {

        if (!obj || !Object.prototype.hasOwnProperty.call(obj, args[i]))
            return undefined;

        obj = obj[args[i]];
    }

    return obj;
}

//  get (deeply nested) property value by dot-notation
//  see: stackoverflow.com/a/10934946
export function getRef(obj, path) {
    return path.split('.').reduce((obj, prop) => obj ? obj[prop] : obj, obj);
}


//  Asynchronously load stylesheet, returns a Promise
//  see: stackoverflow.com/a/28386674
export function loadStyleSheet(url) {
    
    var timer,
        sheet      = document.createElement('link');
        sheet.rel  = 'stylesheet';
        sheet.type = 'text/css';
        sheet.href = url;
    
    document.head.appendChild(sheet);

    return new Promise(function (resolve, reject) {
        
        var resolveLink = function () { resolve(sheet) };
        
        sheet.onload = resolveLink;
        sheet.addEventListener('load', resolveLink);
        sheet.onreadystatechange = function () {
            if (sheet.readyState === 'loaded' || sheet.readyState === 'complete')
                resolveLink();
        };

        timer = setInterval(function (){
            try {
                for (var i=0; i < document.styleSheets.length; i++)
                    if (document.styleSheets[i].href === sheet.href)
                        resolveLink();
            } catch(e) {
                // the stylesheet wasn't loaded
                reject(e);
            }
        }, 250);
    })
    .then(function (stylesheet) {
        clearInterval(timer);
        return stylesheet;
    }, function (e) {
        console.log("the stylesheet wasn't loaded", e);
    });
}

//  based on the above, returns a Promise
export function loadScript(url, async) {
    async = typeof async === 'undefined'
            ? false
            : true;

    var timer,
        script        = document.createElement('script');
        script.type   = 'text/javascript';
        script.async  = async;
        script.src    = url;

    document.head.appendChild(script);

    return new Promise((resolve, reject) => {
        var resolveLink = () => resolve(script);
        
        script.onload = resolveLink;
        script.addEventListener('load', resolveLink);
        script.onreadystatechange = () =>
            (script.readyState === 'loaded' ||
             script.readyState === 'complete') &&
            resolveLink();

        timer = setInterval(() => {
                    try {
                        for (var i=0; i < document.scripts.length; i++)
                            if (document.scripts[i].src === script.src)
                                resolveLink();
                    } catch(err) {
                        // the script wasn't loaded
                        reject(err);
                    }
                }, 250);
    })
    .then(script =>
        clearInterval(timer) || script,
    err =>
        console.log("the script wasn't loaded", err));
}

export function parseJSON(resText) {
    var resJSON = null;
    
    if (resText)
        try {
            resJSON = JSON.parse(resText);
        } catch(e) {
            // invalid json
            // console.error('could not JSON-parse: %s', resText, e);
        }
    
    return resJSON;
}

//  use regulat string as template string
//  see: stackoverflow.com/a/1408373
//
//  Usage:
//  supplantString("I'm {age} years old!", { age: 29 });
//  supplantString("The {a} says {n}, {n}, {n}!", { a: 'cow', n: 'moo' });
export function supplantString(string, replacements) {
    return string.replace(/{([^{}]*)}/g,
        function (a, b) {
            var r = replacements[b];
            return typeof r === 'string' || typeof r === 'number' ? r : '';
        }
    );
}

//  see if DATE 1 is later than DATE 2
export function compareISODates(dateStr1, dateStr2) {
    if (['now', 'yesterday'].indexOf(dateStr1) > -1)
        dateStr1 = new Date().toISOString();
    
    if (dateStr1 == 'yesterday')
        dateStr1.setDate(dateStr1.getDate() - 1);

    if (['now', 'yesterday'].indexOf(dateStr2) > -1)
        dateStr2 = new Date().toISOString();
    
    if (dateStr2 == 'yesterday')
        dateStr2.setDate(dateStr2.getDate() - 1);

    //  return true if second date is not defined
    if (!dateStr2)
        return true;

    //  return false if first date is not defined
    //  (but second date is)
    if (!dateStr1)
        return false;

    var d1 = new Date(dateStr1),
        d2 = new Date(dateStr2),
        diff = d1 - d2;

    //  return true if first date is later (greater)
    return diff > 0;
}

export function addHttp(url) {
    return !/^(?:f|ht)tps?\:\/\//.test(url)
            ? 'http://'+ url
            : url;
}

export function navInternal(evt) {
    var href = evt.currentTarget.getAttribute('href'),
        isUrl = /^https?:\/\//.test(href),
        isSameDomain = href.indexOf(location.protocol+'//'+location.host) == 0,
        isInternal = !isUrl || isUrl && isSameDomain;

    if (isInternal && typeof this.transitionTo === 'function') {
        evt.preventDefault();
        this.transitionTo(href);
    }
}
