'use strict';

import configureStore   from './configureStore';
import configurePatcher from './configurePatcher';
import {loadScript}     from './utils';

function init() {
    var initialState = {
            view: {
                current: 'feed',
                previous: null
            }
        },
        store = configureStore(initialState);
    
    configurePatcher(document.getElementById('placeholder'), store);
}

document.addEventListener('deviceready', init, false);

// navigator.userAgent in OS X Chrome:
//  Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.71 Safari/537.36
// navigator.userAgent in cordova-bundled app:
//  Mozilla/5.0 (iPhone; CPU iPhone OS 9_0_2 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13A452
// navigator.userAgent in iOS Safari:
//  Mozilla/5.0 (iPhone; CPU iPhone OS 9_0_2 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13A452 Safari/601.1

//  fake it in browser
if (navigator.userAgent.match(/(Chrome|Safari)/i)) {
    document.body.classList.add('browser');
    window.onload = () =>
        document.dispatchEvent(new CustomEvent('deviceready'));
} else
    loadScript('cordova.js');