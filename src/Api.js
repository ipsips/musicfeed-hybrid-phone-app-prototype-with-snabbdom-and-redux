'use strict';

import fetch from 'isomorphic-fetch';

// temp
var apiHost = '/fake-api/';

export default {
    feed()  { get('feed.json'   , arguments) },
    me()    { get('me.json'     , arguments) }
};

function get(endpoint, args) {
    fetch(apiHost+endpoint)
        .then(res => res.json())
        .then(cb(true, args))
        .catch(cb(false, args));
}

function cb(success, args) {
    return typeof args[args.length - 1] !== 'function'
        ? (success
            ? data => console.log('fetched data:', data)
            :  err => console.error('fetch error:', err))
        : success
            ? data => done(null, data, args[args.length - 1])
            :  err => done( err, null, args[args.length - 1]);
}

function done(err, data, cb) {
    return  err ? cb(err)
                : cb(null, data);
}
