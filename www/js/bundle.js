(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],2:[function(require,module,exports){
// the whatwg-fetch polyfill installs the fetch() function
// on the global object (window or self)
//
// Return that as the export for use in Webpack, Browserify etc.
require('whatwg-fetch');
module.exports = self.fetch.bind(self);

},{"whatwg-fetch":3}],3:[function(require,module,exports){
(function() {
  'use strict';

  if (self.fetch) {
    return
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = name.toString();
    }
    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = value.toString();
    }
    return value
  }

  function Headers(headers) {
    this.map = {}

    var self = this
    if (headers instanceof Headers) {
      headers.forEach(function(name, values) {
        values.forEach(function(value) {
          self.append(name, value)
        })
      })

    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        self.append(name, headers[name])
      })
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name)
    value = normalizeValue(value)
    var list = this.map[name]
    if (!list) {
      list = []
      this.map[name] = list
    }
    list.push(value)
  }

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)]
  }

  Headers.prototype.get = function(name) {
    var values = this.map[normalizeName(name)]
    return values ? values[0] : null
  }

  Headers.prototype.getAll = function(name) {
    return this.map[normalizeName(name)] || []
  }

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  }

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = [normalizeValue(value)]
  }

  // Instead of iterable for now.
  Headers.prototype.forEach = function(callback) {
    var self = this
    Object.getOwnPropertyNames(this.map).forEach(function(name) {
      callback(name, self.map[name])
    })
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result)
      }
      reader.onerror = function() {
        reject(reader.error)
      }
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader()
    reader.readAsArrayBuffer(blob)
    return fileReaderReady(reader)
  }

  function readBlobAsText(blob) {
    var reader = new FileReader()
    reader.readAsText(blob)
    return fileReaderReady(reader)
  }

  var support = {
    blob: 'FileReader' in self && 'Blob' in self && (function() {
      try {
        new Blob();
        return true
      } catch(e) {
        return false
      }
    })(),
    formData: 'FormData' in self
  }

  function Body() {
    this.bodyUsed = false


    this._initBody = function(body) {
      this._bodyInit = body
      if (typeof body === 'string') {
        this._bodyText = body
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body
      } else if (!body) {
        this._bodyText = ''
      } else {
        throw new Error('unsupported BodyInit type')
      }
    }

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      }

      this.arrayBuffer = function() {
        return this.blob().then(readBlobAsArrayBuffer)
      }

      this.text = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return readBlobAsText(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as text')
        } else {
          return Promise.resolve(this._bodyText)
        }
      }
    } else {
      this.text = function() {
        var rejected = consumed(this)
        return rejected ? rejected : Promise.resolve(this._bodyText)
      }
    }

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      }
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    }

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']

  function normalizeMethod(method) {
    var upcased = method.toUpperCase()
    return (methods.indexOf(upcased) > -1) ? upcased : method
  }

  function Request(url, options) {
    options = options || {}
    this.url = url

    this.credentials = options.credentials || 'omit'
    this.headers = new Headers(options.headers)
    this.method = normalizeMethod(options.method || 'GET')
    this.mode = options.mode || null
    this.referrer = null

    if ((this.method === 'GET' || this.method === 'HEAD') && options.body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(options.body)
  }

  function decode(body) {
    var form = new FormData()
    body.trim().split('&').forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=')
        var name = split.shift().replace(/\+/g, ' ')
        var value = split.join('=').replace(/\+/g, ' ')
        form.append(decodeURIComponent(name), decodeURIComponent(value))
      }
    })
    return form
  }

  function headers(xhr) {
    var head = new Headers()
    var pairs = xhr.getAllResponseHeaders().trim().split('\n')
    pairs.forEach(function(header) {
      var split = header.trim().split(':')
      var key = split.shift().trim()
      var value = split.join(':').trim()
      head.append(key, value)
    })
    return head
  }

  Body.call(Request.prototype)

  function Response(bodyInit, options) {
    if (!options) {
      options = {}
    }

    this._initBody(bodyInit)
    this.type = 'default'
    this.url = null
    this.status = options.status
    this.ok = this.status >= 200 && this.status < 300
    this.statusText = options.statusText
    this.headers = options.headers instanceof Headers ? options.headers : new Headers(options.headers)
    this.url = options.url || ''
  }

  Body.call(Response.prototype)

  self.Headers = Headers;
  self.Request = Request;
  self.Response = Response;

  self.fetch = function(input, init) {
    // TODO: Request constructor should accept input, init
    var request
    if (Request.prototype.isPrototypeOf(input) && !init) {
      request = input
    } else {
      request = new Request(input, init)
    }

    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest()

      function responseURL() {
        if ('responseURL' in xhr) {
          return xhr.responseURL
        }

        // Avoid security warnings on getResponseHeader when not allowed by CORS
        if (/^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
          return xhr.getResponseHeader('X-Request-URL')
        }

        return;
      }

      xhr.onload = function() {
        var status = (xhr.status === 1223) ? 204 : xhr.status
        if (status < 100 || status > 599) {
          reject(new TypeError('Network request failed'))
          return
        }
        var options = {
          status: status,
          statusText: xhr.statusText,
          headers: headers(xhr),
          url: responseURL()
        }
        var body = 'response' in xhr ? xhr.response : xhr.responseText;
        resolve(new Response(body, options))
      }

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.open(request.method, request.url, true)

      if (request.credentials === 'include') {
        xhr.withCredentials = true
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob'
      }

      request.headers.forEach(function(name, values) {
        values.forEach(function(value) {
          xhr.setRequestHeader(name, value)
        })
      })

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
    })
  }
  self.fetch.polyfill = true
})();

},{}],4:[function(require,module,exports){
/* eslint-disable no-unused-vars */
'use strict';
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

module.exports = Object.assign || function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (Object.getOwnPropertySymbols) {
			symbols = Object.getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

},{}],5:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = thunkMiddleware;

function thunkMiddleware(_ref) {
  var dispatch = _ref.dispatch;
  var getState = _ref.getState;

  return function (next) {
    return function (action) {
      return typeof action === 'function' ? action(dispatch, getState) : next(action);
    };
  };
}

module.exports = exports['default'];
},{}],6:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = createStore;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _utilsIsPlainObject = require('./utils/isPlainObject');

var _utilsIsPlainObject2 = _interopRequireDefault(_utilsIsPlainObject);

/**
 * These are private action types reserved by Redux.
 * For any unknown actions, you must return the current state.
 * If the current state is undefined, you must return the initial state.
 * Do not reference these action types directly in your code.
 */
var ActionTypes = {
  INIT: '@@redux/INIT'
};

exports.ActionTypes = ActionTypes;
/**
 * Creates a Redux store that holds the state tree.
 * The only way to change the data in the store is to call `dispatch()` on it.
 *
 * There should only be a single store in your app. To specify how different
 * parts of the state tree respond to actions, you may combine several reducers
 * into a single reducer function by using `combineReducers`.
 *
 * @param {Function} reducer A function that returns the next state tree, given
 * the current state tree and the action to handle.
 *
 * @param {any} [initialState] The initial state. You may optionally specify it
 * to hydrate the state from the server in universal apps, or to restore a
 * previously serialized user session.
 * If you use `combineReducers` to produce the root reducer function, this must be
 * an object with the same shape as `combineReducers` keys.
 *
 * @returns {Store} A Redux store that lets you read the state, dispatch actions
 * and subscribe to changes.
 */

function createStore(reducer, initialState) {
  if (typeof reducer !== 'function') {
    throw new Error('Expected the reducer to be a function.');
  }

  var currentReducer = reducer;
  var currentState = initialState;
  var listeners = [];
  var isDispatching = false;

  /**
   * Reads the state tree managed by the store.
   *
   * @returns {any} The current state tree of your application.
   */
  function getState() {
    return currentState;
  }

  /**
   * Adds a change listener. It will be called any time an action is dispatched,
   * and some part of the state tree may potentially have changed. You may then
   * call `getState()` to read the current state tree inside the callback.
   *
   * @param {Function} listener A callback to be invoked on every dispatch.
   * @returns {Function} A function to remove this change listener.
   */
  function subscribe(listener) {
    listeners.push(listener);

    return function unsubscribe() {
      var index = listeners.indexOf(listener);
      listeners.splice(index, 1);
    };
  }

  /**
   * Dispatches an action. It is the only way to trigger a state change.
   *
   * The `reducer` function, used to create the store, will be called with the
   * current state tree and the given `action`. Its return value will
   * be considered the **next** state of the tree, and the change listeners
   * will be notified.
   *
   * The base implementation only supports plain object actions. If you want to
   * dispatch a Promise, an Observable, a thunk, or something else, you need to
   * wrap your store creating function into the corresponding middleware. For
   * example, see the documentation for the `redux-thunk` package. Even the
   * middleware will eventually dispatch plain object actions using this method.
   *
   * @param {Object} action A plain object representing “what changed”. It is
   * a good idea to keep actions serializable so you can record and replay user
   * sessions, or use the time travelling `redux-devtools`. An action must have
   * a `type` property which may not be `undefined`. It is a good idea to use
   * string constants for action types.
   *
   * @returns {Object} For convenience, the same action object you dispatched.
   *
   * Note that, if you use a custom middleware, it may wrap `dispatch()` to
   * return something else (for example, a Promise you can await).
   */
  function dispatch(action) {
    if (!_utilsIsPlainObject2['default'](action)) {
      throw new Error('Actions must be plain objects. ' + 'Use custom middleware for async actions.');
    }

    if (typeof action.type === 'undefined') {
      throw new Error('Actions may not have an undefined "type" property. ' + 'Have you misspelled a constant?');
    }

    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions.');
    }

    try {
      isDispatching = true;
      currentState = currentReducer(currentState, action);
    } finally {
      isDispatching = false;
    }

    listeners.slice().forEach(function (listener) {
      return listener();
    });
    return action;
  }

  /**
   * Replaces the reducer currently used by the store to calculate the state.
   *
   * You might need this if your app implements code splitting and you want to
   * load some of the reducers dynamically. You might also need this if you
   * implement a hot reloading mechanism for Redux.
   *
   * @param {Function} nextReducer The reducer for the store to use instead.
   * @returns {void}
   */
  function replaceReducer(nextReducer) {
    currentReducer = nextReducer;
    dispatch({ type: ActionTypes.INIT });
  }

  // When a store is created, an "INIT" action is dispatched so that every
  // reducer returns their initial state. This effectively populates
  // the initial state tree.
  dispatch({ type: ActionTypes.INIT });

  return {
    dispatch: dispatch,
    subscribe: subscribe,
    getState: getState,
    replaceReducer: replaceReducer
  };
}
},{"./utils/isPlainObject":12}],7:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _createStore = require('./createStore');

var _createStore2 = _interopRequireDefault(_createStore);

var _utilsCombineReducers = require('./utils/combineReducers');

var _utilsCombineReducers2 = _interopRequireDefault(_utilsCombineReducers);

var _utilsBindActionCreators = require('./utils/bindActionCreators');

var _utilsBindActionCreators2 = _interopRequireDefault(_utilsBindActionCreators);

var _utilsApplyMiddleware = require('./utils/applyMiddleware');

var _utilsApplyMiddleware2 = _interopRequireDefault(_utilsApplyMiddleware);

var _utilsCompose = require('./utils/compose');

var _utilsCompose2 = _interopRequireDefault(_utilsCompose);

exports.createStore = _createStore2['default'];
exports.combineReducers = _utilsCombineReducers2['default'];
exports.bindActionCreators = _utilsBindActionCreators2['default'];
exports.applyMiddleware = _utilsApplyMiddleware2['default'];
exports.compose = _utilsCompose2['default'];
},{"./createStore":6,"./utils/applyMiddleware":8,"./utils/bindActionCreators":9,"./utils/combineReducers":10,"./utils/compose":11}],8:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports['default'] = applyMiddleware;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _compose = require('./compose');

var _compose2 = _interopRequireDefault(_compose);

/**
 * Creates a store enhancer that applies middleware to the dispatch method
 * of the Redux store. This is handy for a variety of tasks, such as expressing
 * asynchronous actions in a concise manner, or logging every action payload.
 *
 * See `redux-thunk` package as an example of the Redux middleware.
 *
 * Because middleware is potentially asynchronous, this should be the first
 * store enhancer in the composition chain.
 *
 * Note that each middleware will be given the `dispatch` and `getState` functions
 * as named arguments.
 *
 * @param {...Function} middlewares The middleware chain to be applied.
 * @returns {Function} A store enhancer applying the middleware.
 */

function applyMiddleware() {
  for (var _len = arguments.length, middlewares = Array(_len), _key = 0; _key < _len; _key++) {
    middlewares[_key] = arguments[_key];
  }

  return function (next) {
    return function (reducer, initialState) {
      var store = next(reducer, initialState);
      var _dispatch = store.dispatch;
      var chain = [];

      var middlewareAPI = {
        getState: store.getState,
        dispatch: function dispatch(action) {
          return _dispatch(action);
        }
      };
      chain = middlewares.map(function (middleware) {
        return middleware(middlewareAPI);
      });
      _dispatch = _compose2['default'].apply(undefined, chain)(store.dispatch);

      return _extends({}, store, {
        dispatch: _dispatch
      });
    };
  };
}

module.exports = exports['default'];
},{"./compose":11}],9:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = bindActionCreators;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _utilsMapValues = require('../utils/mapValues');

var _utilsMapValues2 = _interopRequireDefault(_utilsMapValues);

function bindActionCreator(actionCreator, dispatch) {
  return function () {
    return dispatch(actionCreator.apply(undefined, arguments));
  };
}

/**
 * Turns an object whose values are action creators, into an object with the
 * same keys, but with every function wrapped into a `dispatch` call so they
 * may be invoked directly. This is just a convenience method, as you can call
 * `store.dispatch(MyActionCreators.doSomething())` yourself just fine.
 *
 * For convenience, you can also pass a single function as the first argument,
 * and get a function in return.
 *
 * @param {Function|Object} actionCreators An object whose values are action
 * creator functions. One handy way to obtain it is to use ES6 `import * as`
 * syntax. You may also pass a single function.
 *
 * @param {Function} dispatch The `dispatch` function available on your Redux
 * store.
 *
 * @returns {Function|Object} The object mimicking the original object, but with
 * every action creator wrapped into the `dispatch` call. If you passed a
 * function as `actionCreators`, the return value will also be a single
 * function.
 */

function bindActionCreators(actionCreators, dispatch) {
  if (typeof actionCreators === 'function') {
    return bindActionCreator(actionCreators, dispatch);
  }

  if (typeof actionCreators !== 'object' || actionCreators === null || actionCreators === undefined) {
    // eslint-disable-line no-eq-null
    throw new Error('bindActionCreators expected an object or a function, instead received ' + (actionCreators === null ? 'null' : typeof actionCreators) + '. ' + 'Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?');
  }

  return _utilsMapValues2['default'](actionCreators, function (actionCreator) {
    return bindActionCreator(actionCreator, dispatch);
  });
}

module.exports = exports['default'];
},{"../utils/mapValues":13}],10:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;
exports['default'] = combineReducers;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _createStore = require('../createStore');

var _utilsIsPlainObject = require('../utils/isPlainObject');

var _utilsIsPlainObject2 = _interopRequireDefault(_utilsIsPlainObject);

var _utilsMapValues = require('../utils/mapValues');

var _utilsMapValues2 = _interopRequireDefault(_utilsMapValues);

var _utilsPick = require('../utils/pick');

var _utilsPick2 = _interopRequireDefault(_utilsPick);

/* eslint-disable no-console */

function getUndefinedStateErrorMessage(key, action) {
  var actionType = action && action.type;
  var actionName = actionType && '"' + actionType.toString() + '"' || 'an action';

  return 'Reducer "' + key + '" returned undefined handling ' + actionName + '. ' + 'To ignore an action, you must explicitly return the previous state.';
}

function getUnexpectedStateKeyWarningMessage(inputState, outputState, action) {
  var reducerKeys = Object.keys(outputState);
  var argumentName = action && action.type === _createStore.ActionTypes.INIT ? 'initialState argument passed to createStore' : 'previous state received by the reducer';

  if (reducerKeys.length === 0) {
    return 'Store does not have a valid reducer. Make sure the argument passed ' + 'to combineReducers is an object whose values are reducers.';
  }

  if (!_utilsIsPlainObject2['default'](inputState)) {
    return 'The ' + argumentName + ' has unexpected type of "' + ({}).toString.call(inputState).match(/\s([a-z|A-Z]+)/)[1] + '". Expected argument to be an object with the following ' + ('keys: "' + reducerKeys.join('", "') + '"');
  }

  var unexpectedKeys = Object.keys(inputState).filter(function (key) {
    return reducerKeys.indexOf(key) < 0;
  });

  if (unexpectedKeys.length > 0) {
    return 'Unexpected ' + (unexpectedKeys.length > 1 ? 'keys' : 'key') + ' ' + ('"' + unexpectedKeys.join('", "') + '" found in ' + argumentName + '. ') + 'Expected to find one of the known reducer keys instead: ' + ('"' + reducerKeys.join('", "') + '". Unexpected keys will be ignored.');
  }
}

function assertReducerSanity(reducers) {
  Object.keys(reducers).forEach(function (key) {
    var reducer = reducers[key];
    var initialState = reducer(undefined, { type: _createStore.ActionTypes.INIT });

    if (typeof initialState === 'undefined') {
      throw new Error('Reducer "' + key + '" returned undefined during initialization. ' + 'If the state passed to the reducer is undefined, you must ' + 'explicitly return the initial state. The initial state may ' + 'not be undefined.');
    }

    var type = '@@redux/PROBE_UNKNOWN_ACTION_' + Math.random().toString(36).substring(7).split('').join('.');
    if (typeof reducer(undefined, { type: type }) === 'undefined') {
      throw new Error('Reducer "' + key + '" returned undefined when probed with a random type. ' + ('Don\'t try to handle ' + _createStore.ActionTypes.INIT + ' or other actions in "redux/*" ') + 'namespace. They are considered private. Instead, you must return the ' + 'current state for any unknown actions, unless it is undefined, ' + 'in which case you must return the initial state, regardless of the ' + 'action type. The initial state may not be undefined.');
    }
  });
}

/**
 * Turns an object whose values are different reducer functions, into a single
 * reducer function. It will call every child reducer, and gather their results
 * into a single state object, whose keys correspond to the keys of the passed
 * reducer functions.
 *
 * @param {Object} reducers An object whose values correspond to different
 * reducer functions that need to be combined into one. One handy way to obtain
 * it is to use ES6 `import * as reducers` syntax. The reducers may never return
 * undefined for any action. Instead, they should return their initial state
 * if the state passed to them was undefined, and the current state for any
 * unrecognized action.
 *
 * @returns {Function} A reducer function that invokes every reducer inside the
 * passed object, and builds a state object with the same shape.
 */

function combineReducers(reducers) {
  var finalReducers = _utilsPick2['default'](reducers, function (val) {
    return typeof val === 'function';
  });
  var sanityError;

  try {
    assertReducerSanity(finalReducers);
  } catch (e) {
    sanityError = e;
  }

  var defaultState = _utilsMapValues2['default'](finalReducers, function () {
    return undefined;
  });

  return function combination(state, action) {
    if (state === undefined) state = defaultState;

    if (sanityError) {
      throw sanityError;
    }

    var finalState = _utilsMapValues2['default'](finalReducers, function (reducer, key) {
      var newState = reducer(state[key], action);
      if (typeof newState === 'undefined') {
        var errorMessage = getUndefinedStateErrorMessage(key, action);
        throw new Error(errorMessage);
      }
      return newState;
    });

    if (process.env.NODE_ENV !== 'production') {
      var warningMessage = getUnexpectedStateKeyWarningMessage(state, finalState, action);
      if (warningMessage) {
        console.error(warningMessage);
      }
    }

    return finalState;
  };
}

module.exports = exports['default'];
}).call(this,require('_process'))

},{"../createStore":6,"../utils/isPlainObject":12,"../utils/mapValues":13,"../utils/pick":14,"_process":1}],11:[function(require,module,exports){
/**
 * Composes single-argument functions from right to left.
 *
 * @param {...Function} funcs The functions to compose.
 * @returns {Function} A function obtained by composing functions from right to
 * left. For example, compose(f, g, h) is identical to arg => f(g(h(arg))).
 */
"use strict";

exports.__esModule = true;
exports["default"] = compose;

function compose() {
  for (var _len = arguments.length, funcs = Array(_len), _key = 0; _key < _len; _key++) {
    funcs[_key] = arguments[_key];
  }

  return function (arg) {
    return funcs.reduceRight(function (composed, f) {
      return f(composed);
    }, arg);
  };
}

module.exports = exports["default"];
},{}],12:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = isPlainObject;
var fnToString = function fnToString(fn) {
  return Function.prototype.toString.call(fn);
};

/**
 * @param {any} obj The object to inspect.
 * @returns {boolean} True if the argument appears to be a plain object.
 */

function isPlainObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  var proto = typeof obj.constructor === 'function' ? Object.getPrototypeOf(obj) : Object.prototype;

  if (proto === null) {
    return true;
  }

  var constructor = proto.constructor;

  return typeof constructor === 'function' && constructor instanceof constructor && fnToString(constructor) === fnToString(Object);
}

module.exports = exports['default'];
},{}],13:[function(require,module,exports){
/**
 * Applies a function to every key-value pair inside an object.
 *
 * @param {Object} obj The source object.
 * @param {Function} fn The mapper function that receives the value and the key.
 * @returns {Object} A new object that contains the mapped values for the keys.
 */
"use strict";

exports.__esModule = true;
exports["default"] = mapValues;

function mapValues(obj, fn) {
  return Object.keys(obj).reduce(function (result, key) {
    result[key] = fn(obj[key], key);
    return result;
  }, {});
}

module.exports = exports["default"];
},{}],14:[function(require,module,exports){
/**
 * Picks key-value pairs from an object where values satisfy a predicate.
 *
 * @param {Object} obj The object to pick from.
 * @param {Function} fn The predicate the values must satisfy to be copied.
 * @returns {Object} The object with the values that satisfied the predicate.
 */
"use strict";

exports.__esModule = true;
exports["default"] = pick;

function pick(obj, fn) {
  return Object.keys(obj).reduce(function (result, key) {
    if (fn(obj[key])) {
      result[key] = obj[key];
    }
    return result;
  }, {});
}

module.exports = exports["default"];
},{}],15:[function(require,module,exports){
"use strict";

var SVGNS = "http://www.w3.org/2000/svg";
var modulesNS = ['key', 'on', 'style', 'class', 'props'];
var slice = Array.prototype.slice;

function isPrimitive(val) {
  return  typeof val === 'string'   ||
          typeof val === 'number'   ||
          typeof val === 'boolean'  ||
          typeof val === 'symbol'   ||
          val === null              ||
          val === undefined;
}

function normalizeAttrs(attrs, nsURI, defNS, modules) {
  var map = { ns: nsURI };
  for (var i = 0, len = modules.length; i < len; i++) {
    var mod = modules[i];
    if(attrs[mod])
      map[mod] = attrs[mod];
  }
  for(var key in attrs) {
    var parts = key.split('-');
    if(parts.length > 1)
      addAttr(parts[0], parts[1], attrs[key]);
    else if(!map[key])
      addAttr(defNS, parts[0], attrs[key]);
  }
  return map;
  
  function addAttr(namespace, key, val) {
    var ns = map[namespace] || (map[namespace] = {});
    ns[key] = val;
  }
}

function jsx(nsURI, defNS, modules, tag, attrs, children) {
  attrs = attrs || {};
  if(attrs.classNames) {
    var cns = attrs.classNames;
    tag = tag + '.' + (
      Array.isArray(cns) ? cns.join('.') : cns.replace(/\s+/g, '.')  
    );
  }
  if(typeof tag === 'string') {
    return { 
      sel       : tag, 
      data      : normalizeAttrs(attrs, nsURI, defNS, modules), 
      children  : children.map( function(c) { 
        return isPrimitive(c) ? {text: c} : c;
      })
    };
  } else if(typeof tag === 'function')
    return tag(attrs, children);
  else if(tag && typeof tag.view === 'function')
    return tag.view(attrs, children);
}

function JSX(nsURI, defNS, modules) {
  return function jsxWithCustomNS(tag, attrs, children) {
    if(arguments.length > 3 || !Array.isArray(children))
      children = slice.call(arguments, 2);
    return jsx(nsURI, defNS || 'props', modules || modulesNS, tag, attrs, children);
  } 
}

module.exports = { 
  html: JSX(undefined), 
  svg: JSX(SVGNS, 'attrs'), 
  JSX: JSX 
};
},{}],16:[function(require,module,exports){
module.exports = {
  array: Array.isArray,
  primitive: function(s) { return typeof s === 'string' || typeof s === 'number'; },
};

},{}],17:[function(require,module,exports){
function updateClass(oldVnode, vnode) {
  var cur, name, elm = vnode.elm,
      oldClass = oldVnode.data.class || {},
      klass = vnode.data.class || {};
  for (name in klass) {
    cur = klass[name];
    if (cur !== oldClass[name]) {
      elm.classList[cur ? 'add' : 'remove'](name);
    }
  }
}

module.exports = {create: updateClass, update: updateClass};

},{}],18:[function(require,module,exports){
var is = require('../is');

function arrInvoker(arr) {
  return function() {
    // Special case when length is two, for performance
    arr.length === 2 ? arr[0](arr[1]) : arr[0].apply(undefined, arr.slice(1));
  };
}

function fnInvoker(o) {
  return function(ev) { o.fn(ev); };
}

function updateEventListeners(oldVnode, vnode) {
  var name, cur, old, elm = vnode.elm,
      oldOn = oldVnode.data.on || {}, on = vnode.data.on;
  if (!on) return;
  for (name in on) {
    cur = on[name];
    old = oldOn[name];
    if (old === undefined) {
      if (is.array(cur)) {
        elm.addEventListener(name, arrInvoker(cur));
      } else {
        cur = {fn: cur};
        on[name] = cur;
        elm.addEventListener(name, fnInvoker(cur));
      }
    } else if (is.array(old)) {
      // Deliberately modify old array since it's captured in closure created with `arrInvoker`
      old.length = cur.length;
      for (var i = 0; i < old.length; ++i) old[i] = cur[i];
      on[name]  = old;
    } else {
      old.fn = cur;
      on[name] = old;
    }
  }
}

module.exports = {create: updateEventListeners, update: updateEventListeners};

},{"../is":16}],19:[function(require,module,exports){
function updateProps(oldVnode, vnode) {
  var key, cur, old, elm = vnode.elm,
      oldProps = oldVnode.data.props || {}, props = vnode.data.props || {};
  for (key in props) {
    cur = props[key];
    old = oldProps[key];
    if (old !== cur) {
      elm[key] = cur;
    }
  }
}

module.exports = {create: updateProps, update: updateProps};

},{}],20:[function(require,module,exports){
var raf = requestAnimationFrame || setTimeout;
var nextFrame = function(fn) { raf(function() { raf(fn); }); };

function setNextFrame(obj, prop, val) {
  nextFrame(function() { obj[prop] = val; });
}

function updateStyle(oldVnode, vnode) {
  var cur, name, elm = vnode.elm,
      oldStyle = oldVnode.data.style || {},
      style = vnode.data.style || {},
      oldHasDel = 'delayed' in oldStyle;
  for (name in style) {
    cur = style[name];
    if (name === 'delayed') {
      for (name in style.delayed) {
        cur = style.delayed[name];
        if (!oldHasDel || cur !== oldStyle.delayed[name]) {
          setNextFrame(elm.style, name, cur);
        }
      }
    } else if (name !== 'remove' && cur !== oldStyle[name]) {
      elm.style[name] = cur;
    }
  }
}

function applyDestroyStyle(vnode) {
  var style, name, elm = vnode.elm, s = vnode.data.style;
  if (!s || !(style = s.destroy)) return;
  for (name in style) {
    elm.style[name] = style[name];
  }
}

function applyRemoveStyle(vnode, rm) {
  var s = vnode.data.style;
  if (!s || !s.remove) {
    rm();
    return;
  }
  var name, elm = vnode.elm, idx, i = 0, maxDur = 0,
      compStyle, style = s.remove, amount = 0, applied = [];
  for (name in style) {
    applied.push(name);
    elm.style[name] = style[name];
  }
  compStyle = getComputedStyle(elm);
  var props = compStyle['transition-property'].split(', ');
  for (; i < props.length; ++i) {
    if(applied.indexOf(props[i]) !== -1) amount++;
  }
  elm.addEventListener('transitionend', function(ev) {
    if (ev.target === elm) --amount;
    if (amount === 0) rm();
  });
}

module.exports = {create: updateStyle, update: updateStyle, destroy: applyDestroyStyle, remove: applyRemoveStyle};

},{}],21:[function(require,module,exports){
// jshint newcap: false
/* global require, module, document, Element */
'use strict';

var VNode = require('./vnode');
var is = require('./is');

function isUndef(s) { return s === undefined; }
function isDef(s) { return s !== undefined; }

function emptyNodeAt(elm) {
  return VNode(elm.tagName, {}, [], undefined, elm);
}

var emptyNode = VNode('', {}, [], undefined, undefined);

var insertedVnodeQueue;

function sameVnode(vnode1, vnode2) {
  return vnode1.key === vnode2.key && vnode1.sel === vnode2.sel;
}

function createKeyToOldIdx(children, beginIdx, endIdx) {
  var i, map = {}, key;
  for (i = beginIdx; i <= endIdx; ++i) {
    key = children[i].key;
    if (isDef(key)) map[key] = i;
  }
  return map;
}

function createRmCb(childElm, listeners) {
  return function() {
    if (--listeners === 0) childElm.parentElement.removeChild(childElm);
  };
}

var hooks = ['create', 'update', 'remove', 'destroy', 'pre', 'post'];

function init(modules) {
  var i, j, cbs = {};
  for (i = 0; i < hooks.length; ++i) {
    cbs[hooks[i]] = [];
    for (j = 0; j < modules.length; ++j) {
      if (modules[j][hooks[i]] !== undefined) cbs[hooks[i]].push(modules[j][hooks[i]]);
    }
  }

  function createElm(vnode) {
    var i, data = vnode.data;
    if (isDef(data)) {
      if (isDef(i = data.hook) && isDef(i = i.init)) i(vnode);
      if (isDef(i = data.vnode)) vnode = i;
    }
    var elm, children = vnode.children, sel = vnode.sel;
    if (isDef(sel)) {
      // Parse selector
      var hashIdx = sel.indexOf('#');
      var dotIdx = sel.indexOf('.', hashIdx);
      var hash = hashIdx > 0 ? hashIdx : sel.length;
      var dot = dotIdx > 0 ? dotIdx : sel.length;
      var tag = hashIdx !== -1 || dotIdx !== -1 ? sel.slice(0, Math.min(hash, dot)) : sel;
      elm = vnode.elm = isDef(data) && isDef(i = data.ns) ? document.createElementNS(i, tag)
                                                          : document.createElement(tag);
      if (hash < dot) elm.id = sel.slice(hash + 1, dot);
      if (dotIdx > 0) elm.className = sel.slice(dot+1).replace(/\./g, ' ');
      if (is.array(children)) {
        for (i = 0; i < children.length; ++i) {
          elm.appendChild(createElm(children[i]));
        }
      } else if (is.primitive(vnode.text)) {
        elm.appendChild(document.createTextNode(vnode.text));
      }
      for (i = 0; i < cbs.create.length; ++i) cbs.create[i](emptyNode, vnode);
      i = vnode.data.hook; // Reuse variable
      if (isDef(i)) {
        if (i.create) i.create(emptyNode, vnode);
        if (i.insert) insertedVnodeQueue.push(vnode);
      }
    } else {
      elm = vnode.elm = document.createTextNode(vnode.text);
    }
    return vnode.elm;
  }

  function addVnodes(parentElm, before, vnodes, startIdx, endIdx) {
    for (; startIdx <= endIdx; ++startIdx) {
      parentElm.insertBefore(createElm(vnodes[startIdx]), before);
    }
  }

  function invokeDestroyHook(vnode) {
    var i = vnode.data, j;
    if (isDef(i)) {
      if (isDef(i = i.hook) && isDef(i = i.destroy)) i(vnode);
      for (i = 0; i < cbs.destroy.length; ++i) cbs.destroy[i](vnode);
      if (isDef(i = vnode.children)) {
        for (j = 0; j < vnode.children.length; ++j) {
          invokeDestroyHook(vnode.children[j]);
        }
      }
    }
  }

  function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
    for (; startIdx <= endIdx; ++startIdx) {
      var i, listeners, rm, ch = vnodes[startIdx];
      if (isDef(ch)) {
        if (isDef(ch.sel)) {
          invokeDestroyHook(ch);
          listeners = cbs.remove.length + 1;
          rm = createRmCb(ch.elm, listeners);
          for (i = 0; i < cbs.remove.length; ++i) cbs.remove[i](ch, rm);
          if (isDef(i = ch.data) && isDef(i = i.hook) && isDef(i = i.remove)) {
            i(ch, rm);
          } else {
            rm();
          }
        } else { // Text node
          parentElm.removeChild(ch.elm);
        }
      }
    }
  }

  function updateChildren(parentElm, oldCh, newCh) {
    var oldStartIdx = 0, newStartIdx = 0;
    var oldEndIdx = oldCh.length - 1;
    var oldStartVnode = oldCh[0];
    var oldEndVnode = oldCh[oldEndIdx];
    var newEndIdx = newCh.length - 1;
    var newStartVnode = newCh[0];
    var newEndVnode = newCh[newEndIdx];
    var oldKeyToIdx, idxInOld, elmToMove, before;

    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
      if (isUndef(oldStartVnode)) {
        oldStartVnode = oldCh[++oldStartIdx]; // Vnode has been moved left
      } else if (isUndef(oldEndVnode)) {
        oldEndVnode = oldCh[--oldEndIdx];
      } else if (sameVnode(oldStartVnode, newStartVnode)) {
        patchVnode(oldStartVnode, newStartVnode);
        oldStartVnode = oldCh[++oldStartIdx];
        newStartVnode = newCh[++newStartIdx];
      } else if (sameVnode(oldEndVnode, newEndVnode)) {
        patchVnode(oldEndVnode, newEndVnode);
        oldEndVnode = oldCh[--oldEndIdx];
        newEndVnode = newCh[--newEndIdx];
      } else if (sameVnode(oldStartVnode, newEndVnode)) { // Vnode moved right
        patchVnode(oldStartVnode, newEndVnode);
        parentElm.insertBefore(oldStartVnode.elm, oldEndVnode.elm.nextSibling);
        oldStartVnode = oldCh[++oldStartIdx];
        newEndVnode = newCh[--newEndIdx];
      } else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
        patchVnode(oldEndVnode, newStartVnode);
        parentElm.insertBefore(oldEndVnode.elm, oldStartVnode.elm);
        oldEndVnode = oldCh[--oldEndIdx];
        newStartVnode = newCh[++newStartIdx];
      } else {
        if (isUndef(oldKeyToIdx)) oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
        idxInOld = oldKeyToIdx[newStartVnode.key];
        if (isUndef(idxInOld)) { // New element
          parentElm.insertBefore(createElm(newStartVnode), oldStartVnode.elm);
          newStartVnode = newCh[++newStartIdx];
        } else {
          elmToMove = oldCh[idxInOld];
          patchVnode(elmToMove, newStartVnode);
          oldCh[idxInOld] = undefined;
          parentElm.insertBefore(elmToMove.elm, oldStartVnode.elm);
          newStartVnode = newCh[++newStartIdx];
        }
      }
    }
    if (oldStartIdx > oldEndIdx) {
      before = isUndef(newCh[newEndIdx+1]) ? null : newCh[newEndIdx+1].elm;
      addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx);
    } else if (newStartIdx > newEndIdx) {
      removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
    }
  }

  function patchVnode(oldVnode, vnode) {
    var i, hook;
    if (isDef(i = vnode.data) && isDef(hook = i.hook) && isDef(i = hook.prepatch)) {
      i(oldVnode, vnode);
    }
    if (isDef(i = oldVnode.data) && isDef(i = i.vnode)) oldVnode = i;
    if (isDef(i = vnode.data) && isDef(i = i.vnode)) vnode = i;
    var elm = vnode.elm = oldVnode.elm, oldCh = oldVnode.children, ch = vnode.children;
    if (oldVnode === vnode) return;
    if (isDef(vnode.data)) {
      for (i = 0; i < cbs.update.length; ++i) cbs.update[i](oldVnode, vnode);
      i = vnode.data.hook;
      if (isDef(i) && isDef(i = i.update)) i(oldVnode, vnode);
    }
    if (isUndef(vnode.text)) {
      if (isDef(oldCh) && isDef(ch)) {
        if (oldCh !== ch) updateChildren(elm, oldCh, ch);
      } else if (isDef(ch)) {
        addVnodes(elm, null, ch, 0, ch.length - 1);
      } else if (isDef(oldCh)) {
        removeVnodes(elm, oldCh, 0, oldCh.length - 1);
      }
    } else if (oldVnode.text !== vnode.text) {
      elm.textContent = vnode.text;
    }
    if (isDef(hook) && isDef(i = hook.postpatch)) {
      i(oldVnode, vnode);
    }
    return vnode;
  }

  return function(oldVnode, vnode) {
    var i;
    insertedVnodeQueue = [];
    for (i = 0; i < cbs.pre.length; ++i) cbs.pre[i]();
    if (oldVnode instanceof Element) {
      if (oldVnode.parentElement !== null) {
        createElm(vnode);
        oldVnode.parentElement.replaceChild(vnode.elm, oldVnode);
      } else {
        oldVnode = emptyNodeAt(oldVnode);
        patchVnode(oldVnode, vnode);
      }
    } else {
      patchVnode(oldVnode, vnode);
    }
    for (i = 0; i < insertedVnodeQueue.length; ++i) {
      insertedVnodeQueue[i].data.hook.insert(insertedVnodeQueue[i]);
    }
    insertedVnodeQueue = undefined;
    for (i = 0; i < cbs.post.length; ++i) cbs.post[i]();
    return vnode;
  };
}

module.exports = {init: init};

},{"./is":16,"./vnode":22}],22:[function(require,module,exports){
module.exports = function(sel, data, children, text, elm) {
  var key = data === undefined ? undefined : data.key;
  return {sel: sel, data: data, children: children,
          text: text, elm: elm, key: key};
};

},{}],23:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

// var apiHost = 'http://musicfeed.rubyforce.co/api/client/',
//     apiAuth = 'email=alex.korsak%40gmail.com&authentication_token=alex.korsak%40gmail.com';

// temp
var apiHost = /*'http://192.168.1.70:5551'+*/'/fake-api/';

exports['default'] = {
    // feed()  { get('timelines.json?my=false' , arguments) },
    // me()    { get('profile.json'            , arguments) },
    feed: function feed() {
        get('feed.json', arguments);
    },
    me: function me() {
        get('me.json', arguments);
    }
};

function get(endpoint, args) {
    // let a = endpoint.indexOf('?') < 0
    //         ? '?'+apiAuth
    //         : '&'+apiAuth;

    (0, _isomorphicFetch2['default'])(apiHost + endpoint /*+a*/).then(function (res) {
        return res.json();
    }).then(cb(true, args))['catch'](cb(false, args));
}

function cb(success, args) {
    return typeof args[args.length - 1] !== 'function' ? success ? function (data) {
        return console.log('fetched data:', data);
    } : function (err) {
        return console.error('fetch error:', err);
    } : success ? function (data) {
        return done(null, data, args[args.length - 1]);
    } : function (err) {
        return done(err, null, args[args.length - 1]);
    };
}

function done(err, data, cb) {
    return err ? cb(err) : cb(null, data);
}
module.exports = exports['default'];

},{"isomorphic-fetch":2}],24:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.fetchFeed = fetchFeed;
exports.scrollFeed = scrollFeed;
exports.openActions = openActions;
exports.closeActions = closeActions;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _Api = require('../../Api');

var _Api2 = _interopRequireDefault(_Api);

var _types = require('../types');

function fetchFeed() {
    return function (dispatch, getState) {
        return shouldFetch(getState()) ? dispatch(doFetch()) : null;
    };
}

function shouldFetch(state) {
    return !state.feed.tracks.length && !state.feed.isFetching;
}

function doFetch() {
    return function (dispatch) {
        return dispatch(send()) && _Api2['default'].feed(function (err, res) {
            return err ? dispatch(fail(err)) : dispatch(receive(res));
        });
    };
}

function send() {
    return {
        type: _types.FETCH_FEED_REQ
    };
}

function receive(json) {
    return {
        type: _types.FETCH_FEED_RES,
        tracks: json,
        updatedAt: Date.now()
    };
}

function fail(err) {
    return {
        type: _types.FETCH_FEED_ERR,
        error: err
    };
}

function scrollFeed(start) {
    return {
        type: start ? _types.SCROLL_FEED_START : _types.SCROLL_FEED_STOP
    };
}

function openActions(id) {
    return function (dispatch, getState) {
        return shouldOpenActions(getState(), id) ? dispatch(doOpenActions(id)) : null;
    };
}

function shouldOpenActions(state, id) {
    return state.feed.openActionIds.indexOf(id) < 0;
}

function doOpenActions(id) {
    return {
        type: _types.OPEN_FEED_ITEM_ACTIONS,
        id: id
    };
}

function closeActions(id) {
    return function (dispatch, getState) {
        return shouldCloseActions(getState(), id) ? dispatch(doCloseActions(id)) : null;
    };
}

function shouldCloseActions(state, id) {
    return state.feed.openActionIds.indexOf(id) > -1;
}

function doCloseActions(id) {
    return {
        type: _types.CLOSE_FEED_ITEM_ACTIONS,
        id: id
    };
}

},{"../../Api":23,"../types":28}],25:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.fetchMe = fetchMe;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _Api = require('../../Api');

var _Api2 = _interopRequireDefault(_Api);

var _types = require('../types');

function fetchMe() {
    return function (dispatch, getState) {
        return shouldFetch(getState()) ? dispatch(doFetch()) : null;
    };
}

function shouldFetch(state) {
    return !state.me.data && !state.me.isFetching;
}

function doFetch() {
    return function (dispatch) {
        return dispatch(send()) && _Api2['default'].me(function (err, res) {
            return err ? dispatch(fail(err)) : dispatch(receive(res));
        });
    };
}

function send() {
    return {
        type: _types.FETCH_ME_REQ
    };
}

function receive(res) {
    return {
        type: _types.FETCH_ME_RES,
        data: res,
        updatedAt: Date.now()
    };
}

function fail(err) {
    return {
        type: _types.FETCH_ME_ERR,
        error: err
    };
}

},{"../../Api":23,"../types":28}],26:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.playTrack = playTrack;
exports.progress = progress;
exports.togglePlayer = togglePlayer;
exports.setEq = setEq;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _Api = require('../../Api');

var _Api2 = _interopRequireDefault(_Api);

var _utils = require('../../utils');

var _types = require('../types');

function playTrack(track, idx) {
    return function (dispatch, getState) {
        var state = getState();

        if (shouldSetTrack(track, state)) return dispatch(setTrack(track, idx)) && dispatch(start());else if (shouldStart(state)) return dispatch(start());else return null;
    };
}

function shouldSetTrack(track, state) {
    return (0, _utils.getRef)(state.player, 'track.id') != track.id;
}

function shouldStart(state) {
    return !state.player.isPlaying;
}

function setTrack(track, idx) {
    return {
        type: _types.PLAYER_SET_TRACK,
        track: track,
        idx: idx
    };
}

function start() {
    return {
        type: _types.PLAYER_START
    };
}

function pause() {
    return {
        type: _types.PLAYER_PAUSE
    };
}

function progress(progress) {
    return {
        type: _types.PLAYER_PROGRESS,
        progress: progress
    };
}

function togglePlayer() {
    return function (dispatch, getState) {
        return getState().player.isOpen ? dispatch({ type: _types.PLAYER_CLOSE }) : dispatch({ type: _types.PLAYER_OPEN });
    };
}

function setEq(data) {
    return {
        type: _types.PLAYER_EQ,
        data: data
    };
}

},{"../../Api":23,"../../utils":46,"../types":28}],27:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.setView = setView;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

var _types = require('../types');

function setView(viewName) {
    return function (dispatch, getState) {
        return shouldSetView(viewName, getState()) ? dispatch(doSetView(viewName)) : null;
    };
}

function shouldSetView(viewName, state) {
    return viewName != state.view.current;
}

function doSetView(viewName) {
    return {
        type: _types.SET_VIEW,
        viewName: viewName
    };
}

},{"../types":28,"isomorphic-fetch":2}],28:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var SET_VIEW = 'SET_VIEW',
    FETCH_FEED_REQ = 'FETCH_FEED_REQ',
    FETCH_FEED_RES = 'FETCH_FEED_RES',
    FETCH_FEED_ERR = 'FETCH_FEED_ERR',
    SCROLL_FEED_START = 'SCROLL_FEED_START',
    SCROLL_FEED_STOP = 'SCROLL_FEED_STOP',
    OPEN_FEED_ITEM_ACTIONS = 'OPEN_FEED_ITEM_ACTIONS',
    CLOSE_FEED_ITEM_ACTIONS = 'CLOSE_FEED_ITEM_ACTIONS',
    FETCH_ME_REQ = 'FETCH_ME_REQ',
    FETCH_ME_RES = 'FETCH_ME_RES',
    FETCH_ME_ERR = 'FETCH_ME_ERR',

// PLAY_TRACK_REQ = 'PLAY_TRACK_REQ',
// PLAY_TRACK_RES = 'PLAY_TRACK_RES',
// PLAY_TRACK_ERR = 'PLAY_TRACK_ERR',
PLAYER_START = 'PLAYER_START',
    PLAYER_PAUSE = 'PLAYER_PAUSE',
    PLAYER_SET_TRACK = 'PLAYER_SET_TRACK',
    PLAYER_PROGRESS = 'PLAYER_PROGRESS',
    PLAYER_OPEN = 'PLAYER_OPEN',
    PLAYER_CLOSE = 'PLAYER_CLOSE',
    PLAYER_EQ = 'PLAYER_EQ';
exports.SET_VIEW = SET_VIEW;
exports.FETCH_FEED_REQ = FETCH_FEED_REQ;
exports.FETCH_FEED_RES = FETCH_FEED_RES;
exports.FETCH_FEED_ERR = FETCH_FEED_ERR;
exports.SCROLL_FEED_START = SCROLL_FEED_START;
exports.SCROLL_FEED_STOP = SCROLL_FEED_STOP;
exports.OPEN_FEED_ITEM_ACTIONS = OPEN_FEED_ITEM_ACTIONS;
exports.CLOSE_FEED_ITEM_ACTIONS = CLOSE_FEED_ITEM_ACTIONS;
exports.FETCH_ME_REQ = FETCH_ME_REQ;
exports.FETCH_ME_RES = FETCH_ME_RES;
exports.FETCH_ME_ERR = FETCH_ME_ERR;
exports.PLAYER_START = PLAYER_START;
exports.PLAYER_PAUSE = PLAYER_PAUSE;
exports.PLAYER_SET_TRACK = PLAYER_SET_TRACK;
exports.PLAYER_PROGRESS = PLAYER_PROGRESS;
exports.PLAYER_OPEN = PLAYER_OPEN;
exports.PLAYER_CLOSE = PLAYER_CLOSE;
exports.PLAYER_EQ = PLAYER_EQ;

},{}],29:[function(require,module,exports){
/** @jsx html */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _snabbdomJsx = require('snabbdom-jsx');

var _Tabbar = require('./Tabbar');

var _Tabbar2 = _interopRequireDefault(_Tabbar);

var _Player = require('./Player');

var _Player2 = _interopRequireDefault(_Player);

var _ViewsContainer = require('./ViewsContainer');

var _ViewsContainer2 = _interopRequireDefault(_ViewsContainer);

exports['default'] = {
    onCreate: function onCreate() {
        if (!this.unsubscribe) this.unsubscribe = window.store.subscribe(window.patch);
    },
    view: function view() {
        var state = window.store.getState(),
            props = {
            id: 'app',
            'hook-create': this.onCreate.bind(this)
        };

        return (0, _snabbdomJsx.html)(
            'div',
            props,
            navigator.userAgent.match(/(Chrome|Safari)/i) ? (0, _snabbdomJsx.html)(
                'ul',
                { classNames: 'statusbar',
                    'class-white': state.view.current == 'me' },
                (0, _snabbdomJsx.html)('li', null),
                (0, _snabbdomJsx.html)('li', null),
                (0, _snabbdomJsx.html)('li', null)
            ) : '',
            (0, _snabbdomJsx.html)(_ViewsContainer2['default'], null),
            (0, _snabbdomJsx.html)(_Tabbar2['default'], null),
            (0, _snabbdomJsx.html)(_Player2['default'], null)
        );
    }
};
module.exports = exports['default'];

},{"./Player":33,"./Tabbar":35,"./ViewsContainer":36,"snabbdom-jsx":15}],30:[function(require,module,exports){
/** @jsx html */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _snabbdomJsx = require('snabbdom-jsx');

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _texts = require('../texts');

var _texts2 = _interopRequireDefault(_texts);

var _utils = require('../utils');

var _actionsCreatorsFeed = require('../actions/creators/feed');

var _actionsCreatorsPlayer = require('../actions/creators/player');

var _Navbar = require('./Navbar');

var _Navbar2 = _interopRequireDefault(_Navbar);

exports['default'] = {
    onInsert: function onInsert(vnode) {
        setTimeout(function () {
            return window.store.dispatch((0, _actionsCreatorsFeed.fetchFeed)());
        });
    },
    onScrollableInsert: function onScrollableInsert(vnode) {
        vnode.elm.addEventListener('scroll', this.onScroll.bind(this), true);
    },
    onScroll: function onScroll(evt) {
        if (!this.scrolling) this.scrollStart();

        clearTimeout(this.scrollTimer);
        this.scrollTimer = setTimeout(this.scrollStop.bind(this), 100);
    },
    scrollStart: function scrollStart() {
        this.scrolling = true;
        window.store.dispatch((0, _actionsCreatorsFeed.scrollFeed)(true));
    },
    scrollStop: function scrollStop() {
        this.scrolling = false;
        window.store.dispatch((0, _actionsCreatorsFeed.scrollFeed)(false));
    },
    onScrollableDestroy: function onScrollableDestroy(vnode) {
        vnode.elm.removeEventListener('scroll', this.onScroll);
    },
    openActions: function openActions(id) {
        window.store.dispatch((0, _actionsCreatorsFeed.openActions)(id));
    },
    closeActions: function closeActions(id) {
        window.store.dispatch((0, _actionsCreatorsFeed.closeActions)(id));
    },
    play: function play(track, idx) {
        window.store.dispatch((0, _actionsCreatorsPlayer.playTrack)(track, idx));
    },
    openPlayer: function openPlayer() {
        window.store.dispatch((0, _actionsCreatorsPlayer.togglePlayer)());
    },
    view: function view(props) {
        var _this = this;

        var state = window.store.getState();

        (0, _objectAssign2['default'])(props, {
            id: 'feed',
            classNames: 'view',
            'class': {
                empty: !state.feed.tracks.length,
                loading: state.feed.isFetching
            },
            'hook-insert': this.onInsert.bind(this)
        });

        var scrollableProps = {
            id: 'scrollable',
            'hook-insert': this.onScrollableInsert.bind(this),
            'hook-destroy': this.onScrollableDestroy.bind(this)
        },
            playerTrackId = (0, _utils.getRef)(state.player, 'track.id');

        return (0, _snabbdomJsx.html)(
            'div',
            props,
            (0, _snabbdomJsx.html)(_Navbar2['default'], { view: 'feed' }),
            (0, _snabbdomJsx.html)(
                'div',
                scrollableProps,
                (0, _snabbdomJsx.html)(
                    'ul',
                    null,
                    state.feed.tracks.map(function (track, idx) {
                        return (0, _snabbdomJsx.html)(
                            'li',
                            {
                                classNames: 'track',
                                'class': {
                                    loved: track.is_liked,
                                    'show-actions': state.feed.openActionIds.indexOf(track.id) > -1,
                                    'hide-actions': state.feed.closedActionIds.indexOf(track.id) > -1,
                                    'is-playing': playerTrackId == track.id
                                },
                                // 'data-cover': track.picture,
                                style: {
                                    backgroundImage: 'url(' + track.picture + ')'
                                }
                            },
                            (0, _snabbdomJsx.html)(
                                'div',
                                null,
                                (0, _snabbdomJsx.html)(
                                    'div',
                                    { classNames: 'meta' },
                                    (0, _snabbdomJsx.html)(
                                        'h3',
                                        { classNames: 'title' },
                                        (0, _snabbdomJsx.html)(
                                            'span',
                                            null,
                                            track.name
                                        )
                                    ),
                                    (0, _snabbdomJsx.html)(
                                        'h6',
                                        { classNames: 'author', 'class-verified': track.is_verified_user },
                                        (0, _snabbdomJsx.html)('u', { style: {
                                                backgroundImage: 'url(' + track.author_picture + ')'
                                            } }),
                                        track.author_name
                                    ),
                                    (0, _snabbdomJsx.html)(
                                        'ul',
                                        { classNames: 'more' },
                                        (0, _snabbdomJsx.html)(
                                            'li',
                                            { classNames: 'ellipsis'
                                                /*on-click={this.openActions.bind(this, track.id)}*/ },
                                            (0, _snabbdomJsx.html)('i', { classNames: 'mf mf-ellipsis-2pt' })
                                        )
                                    )
                                ),
                                (0, _snabbdomJsx.html)('i', { classNames: 'mf mf-play',
                                    'on-click': _this.play.bind(_this, track, idx) }),
                                playerTrackId == track.id ? (0, _snabbdomJsx.html)(
                                    'div',
                                    { classNames: 'eq',
                                        'on-click': _this.openPlayer },
                                    (0, _snabbdomJsx.html)('div', { style: { transform: 'scaleY(' + Math.max(.03, state.player.eq[0]) + ')' } }),
                                    (0, _snabbdomJsx.html)('div', { style: { transform: 'scaleY(' + Math.max(.03, state.player.eq[1]) + ')' } }),
                                    (0, _snabbdomJsx.html)('div', { style: { transform: 'scaleY(' + Math.max(.03, state.player.eq[2]) + ')' } }),
                                    (0, _snabbdomJsx.html)('div', { style: { transform: 'scaleY(' + Math.max(.03, state.player.eq[3]) + ')' } }),
                                    (0, _snabbdomJsx.html)('div', { style: { transform: 'scaleY(' + Math.max(.03, state.player.eq[4]) + ')' } }),
                                    (0, _snabbdomJsx.html)('div', { style: { transform: 'scaleY(' + Math.max(.03, state.player.eq[5]) + ')' } })
                                ) : '',
                                (0, _snabbdomJsx.html)('div', { classNames: 'overlay' })
                            )
                        );
                    })
                )
            )
        );
    }
};
module.exports = exports['default'];
/*<li classNames="close"
   on-click={this.closeActions.bind(this, track.id)}>
   <i classNames="mf mf-x"/>
</li>*/ /*<div classNames="actions">
           <ul>
               <li classNames="repost">
                   <span>
                       <i classNames="mf mf-repost"/>
                       <u>{texts.track.repost}</u>
                   </span>
               </li>
               <li classNames="add-to-playlist">
                   <span>
                       <i classNames="mf mf-add-to-list"/>
                       <u>{texts.track.addToPlaylist}</u>
                   </span>
               </li>
               <li classNames="share">
                   <span>
                       <i classNames="mf mf-upload"/>
                       <u>{texts.track.share}</u>
                   </span>
               </li>
           </ul>
        </div>
        <div classNames="actions-blurred-backdrop">
           <div classNames="overlay"/>
           <div classNames="backdrop" style={{backgroundImage: 'url('+track.picture+')'}}/>
        </div>*/

},{"../actions/creators/feed":24,"../actions/creators/player":26,"../texts":45,"../utils":46,"./Navbar":32,"object-assign":4,"snabbdom-jsx":15}],31:[function(require,module,exports){
/** @jsx html */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _snabbdomJsx = require('snabbdom-jsx');

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _actionsCreatorsMe = require('../actions/creators/me');

var _texts = require('../texts');

var _texts2 = _interopRequireDefault(_texts);

var _Navbar = require('./Navbar');

var _Navbar2 = _interopRequireDefault(_Navbar);

exports['default'] = {
    onPrepatch: function onPrepatch(state) {
        if (state.view.current == 'me') setTimeout(function () {
            return window.store.dispatch((0, _actionsCreatorsMe.fetchMe)());
        });
    },
    getProfilePicUrl: function getProfilePicUrl(url, size) {
        if (!url) return '';

        if (url.indexOf('facebook.com') < 0) return url;

        var d = size == 'profile' ? [160, 160] : [1000, 600]; //[750/3*4, 750/3*4*.6];

        return url.replace(/picture(\?type=[a-z]*)$/, 'picture?width=' + d[0] + '&height=' + d[1]);
    },
    onClickFollowers: function onClickFollowers(evt) {
        evt.preventDefault();
    },
    onClickFollowing: function onClickFollowing(evt) {
        evt.preventDefault();
    },
    onClickMenu: function onClickMenu(sectionName, evt) {
        evt.preventDefault();
    },
    view: function view(props) {
        var state = window.store.getState();

        (0, _objectAssign2['default'])(props, {
            id: 'me',
            classNames: 'view',
            'class': {
                empty: !state.me.data,
                loading: state.me.isFetching
            },
            'hook-prepatch': this.onPrepatch.bind(this, state)
        });

        if (!state.me.data) return (0, _snabbdomJsx.html)(
            'div',
            props,
            (0, _snabbdomJsx.html)(_Navbar2['default'], { view: 'me' }),
            (0, _snabbdomJsx.html)(
                'div',
                { classNames: 'head' },
                (0, _snabbdomJsx.html)(
                    'h3',
                    { classNames: 'name' },
                    _texts2['default'].me.title
                )
            ),
            (0, _snabbdomJsx.html)(
                'div',
                { classNames: 'sections-container' },
                (0, _snabbdomJsx.html)('div', null)
            )
        );

        var data = state.me.data,
            profilePic = this.getProfilePicUrl(data.profile_image, 'profile'),
            bgPic = this.getProfilePicUrl(data.profile_image, 'bg');

        return (0, _snabbdomJsx.html)(
            'div',
            props,
            (0, _snabbdomJsx.html)(_Navbar2['default'], { view: 'me' }),
            (0, _snabbdomJsx.html)(
                'div',
                { classNames: 'head' },
                (0, _snabbdomJsx.html)('u', { classNames: 'profile-pic',
                    style: { backgroundImage: 'url(' + profilePic + ')' } }),
                (0, _snabbdomJsx.html)('u', { classNames: 'backdrop',
                    style: { backgroundImage: 'url(' + bgPic + ')' } }),
                (0, _snabbdomJsx.html)(
                    'h3',
                    { classNames: 'name' },
                    data.name
                ),
                (0, _snabbdomJsx.html)(
                    'ul',
                    { classNames: 'followings' },
                    (0, _snabbdomJsx.html)(
                        'li',
                        null,
                        (0, _snabbdomJsx.html)(
                            'a',
                            { href: '#', 'on-click': this.onClickFollowers },
                            data.followed_count,
                            ' followers'
                        )
                    ),
                    (0, _snabbdomJsx.html)(
                        'li',
                        null,
                        (0, _snabbdomJsx.html)(
                            'a',
                            { href: '#', 'on-click': this.onClickFollowing },
                            data.followings_count,
                            ' following'
                        )
                    )
                )
            ),
            (0, _snabbdomJsx.html)(
                'div',
                { classNames: 'menu' },
                (0, _snabbdomJsx.html)(
                    'ul',
                    null,
                    (0, _snabbdomJsx.html)(
                        'li',
                        { 'class-active': true },
                        (0, _snabbdomJsx.html)(
                            'a',
                            { href: '#', 'on-click': this.onClickMenu.bind(this, 'activity') },
                            'Activity'
                        )
                    ),
                    (0, _snabbdomJsx.html)(
                        'li',
                        null,
                        (0, _snabbdomJsx.html)(
                            'a',
                            { href: '#', 'on-click': this.onClickMenu.bind(this, 'playlists') },
                            'Playlists'
                        )
                    ),
                    (0, _snabbdomJsx.html)(
                        'li',
                        null,
                        (0, _snabbdomJsx.html)(
                            'a',
                            { href: '#', 'on-click': this.onClickMenu.bind(this, 'posts') },
                            'Posts'
                        )
                    )
                )
            ),
            (0, _snabbdomJsx.html)(
                'div',
                { classNames: 'sections-container' },
                (0, _snabbdomJsx.html)(
                    'div',
                    null,
                    (0, _snabbdomJsx.html)('div', { classNames: 'playlists scrollable' })
                )
            )
        );
    }
};
module.exports = exports['default'];

},{"../actions/creators/me":25,"../texts":45,"./Navbar":32,"object-assign":4,"snabbdom-jsx":15}],32:[function(require,module,exports){
/** @jsx html */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _snabbdomJsx = require('snabbdom-jsx');

var _texts = require('../texts');

var _texts2 = _interopRequireDefault(_texts);

exports['default'] = {
    feedNavbar: function feedNavbar(props) {
        var state = window.store.getState();

        return (0, _snabbdomJsx.html)(
            'nav',
            {
                classNames: 'navbar feed',
                'class-invisible': !state.feed.tracks.length,
                'class-hide': state.feed.isScrolling },
            (0, _snabbdomJsx.html)(
                'ul',
                null,
                (0, _snabbdomJsx.html)('li', null),
                (0, _snabbdomJsx.html)(
                    'li',
                    null,
                    _texts2['default'].navbar.feed
                ),
                (0, _snabbdomJsx.html)('li', null)
            )
        );
    },
    meNavbar: function meNavbar(props) {
        var state = window.store.getState();

        return (0, _snabbdomJsx.html)(
            'nav',
            {
                classNames: 'navbar me',
                'class-invisible': !state.me.data },
            (0, _snabbdomJsx.html)(
                'ul',
                null,
                (0, _snabbdomJsx.html)(
                    'li',
                    null,
                    (0, _snabbdomJsx.html)(
                        'a',
                        { href: '#', 'on-click': function (evt) {
                                return evt.preventDefault();
                            } },
                        (0, _snabbdomJsx.html)('i', { className: 'mf mf-gear' })
                    )
                ),
                (0, _snabbdomJsx.html)('li', null),
                (0, _snabbdomJsx.html)('li', null)
            )
        );
    },
    playerNavbar: function playerNavbar(props) {
        var state = window.store.getState();

        return (0, _snabbdomJsx.html)(
            'nav',
            { classNames: 'navbar player' },
            (0, _snabbdomJsx.html)(
                'ul',
                null,
                (0, _snabbdomJsx.html)('li', null),
                (0, _snabbdomJsx.html)(
                    'li',
                    null,
                    (0, _snabbdomJsx.html)(
                        'a',
                        { href: '#', 'on-click': props.closePlayer },
                        (0, _snabbdomJsx.html)('i', { className: 'mf mf-arrow-down-obtuse' })
                    )
                ),
                (0, _snabbdomJsx.html)('li', null)
            )
        );
    },
    view: function view(props) {
        return this[props.view + 'Navbar'](props);
    }
};
module.exports = exports['default'];

},{"../texts":45,"snabbdom-jsx":15}],33:[function(require,module,exports){
/** @jsx html */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _snabbdomJsx = require('snabbdom-jsx');

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _texts = require('../texts');

var _texts2 = _interopRequireDefault(_texts);

var _utils = require('../utils');

var _actionsCreatorsPlayer = require('../actions/creators/player');

var _Navbar = require('./Navbar');

var _Navbar2 = _interopRequireDefault(_Navbar);

Object.defineProperty(HTMLMediaElement.prototype, 'isPlaying', {
    get: function get() {
        return !!(this.currentTime > 0 && !this.paused && !this.ended && this.readyState > 2);
    }
});

function AudioSource(audio, fftSize, arrayLength) {
    if (!window.AudioContext) return null;

    var _ = this,
        audioCtx = new AudioContext(),
        // new (window.AudioContext || window.webkitAudioContext)
    source = audioCtx.createMediaElementSource(audio);

    _.analyser = audioCtx.createAnalyser();
    _.analyser.minDecibels = -90;
    _.analyser.maxDecibels = -10;
    _.analyser.smoothingTimeConstant = 0.4;
    _.analyser.fftSize = fftSize;
    source.connect(_.analyser);
    _.analyser.connect(audioCtx.destination);
    _.streamData = new Uint8Array(arrayLength);
}

exports['default'] = {
    closePlayer: function closePlayer(evt) {
        evt.preventDefault();
        window.store.dispatch((0, _actionsCreatorsPlayer.togglePlayer)());
    },
    onInsertAudio: function onInsertAudio(vnode) {
        this.audio = vnode.elm;
        this.audioSource = new AudioSource(this.audio, 32, 6);

        this.audio.addEventListener('error', function (evt) {
            return console.log('audio error:', evt);
        }, true);
        this.audio.addEventListener('canplay', this.onCanplay.bind(this), true);
        this.audio.addEventListener('playing', this.onStartPlayback.bind(this), true);
        // this.audio.addEventListener('pause', this.onPausePlayback.bind(this), true);
    },
    onCanplay: function onCanplay(evt) {
        if (!this.audio.isPlaying) this.audio.play();
    },
    onStartPlayback: function onStartPlayback() {
        this.eq();
    },
    onPausePlayback: function onPausePlayback() {
        window.store.dispatch((0, _actionsCreatorsPlayer.setEq)([.03, .03, .03, .03, .03, .03]));
    },
    eq: function eq() {
        if (!this.audioSource) return;

        var eqData = [],
            i = undefined;

        this.audioSource.analyser.getByteFrequencyData(this.audioSource.streamData);

        for (i = 0; i < this.audioSource.streamData.length; i++) eqData.push(this.audioSource.streamData[i] / 255);

        window.store.dispatch((0, _actionsCreatorsPlayer.setEq)(eqData));

        if (this.audio.isPlaying) setTimeout(this.eq.bind(this), 20);
        // requestAnimationFrame(this.eq.bind(this));
    },
    view: function view(props) {
        var state = window.store.getState(),
            track = (0, _utils.getRef)(state, 'player.track'),
            idx = (0, _utils.getRef)(state, 'player.idx'),
            audioProps = (0, _objectAssign2['default'])({
            'hook-insert': this.onInsertAudio.bind(this)
        }, track && {
            controls: true,
            src: location.protocol + '//' + location.host + '/audio/' + (idx % 2 ? '15 Let It All Hang Out.mp3' : "14 Beethoven's Piano Sonata No. 1 In F Minor.mp3"),
            type: 'audio/mpeg'
        });

        return (0, _snabbdomJsx.html)(
            'div',
            { id: 'player',
                'class-show': state.player.isOpen,
                'class-hide': state.player.isClosed },
            (0, _snabbdomJsx.html)(_Navbar2['default'], { view: 'player', closePlayer: this.closePlayer }),
            track ? (0, _snabbdomJsx.html)(
                'div',
                {
                    'class': {
                        loved: track.is_liked
                    }
                },
                (0, _snabbdomJsx.html)(
                    'div',
                    { classNames: 'cover',
                        style: { backgroundImage: 'url(' + track.picture + ')' } },
                    (0, _snabbdomJsx.html)('div', { classNames: 'overlay' })
                ),
                (0, _snabbdomJsx.html)(
                    'div',
                    { classNames: 'meta' },
                    (0, _snabbdomJsx.html)(
                        'h2',
                        { classNames: 'title' },
                        (0, _snabbdomJsx.html)(
                            'span',
                            null,
                            track.name
                        )
                    )
                ),
                (0, _snabbdomJsx.html)('audio', audioProps)
            ) : ''
        );
    }
};
module.exports = exports['default'];
// 'show-actions': state.feed.openActionIds.indexOf(track.id) > -1,
// 'hide-actions': state.feed.closedActionIds.indexOf(track.id) > -1

},{"../actions/creators/player":26,"../texts":45,"../utils":46,"./Navbar":32,"object-assign":4,"snabbdom-jsx":15}],34:[function(require,module,exports){
/** @jsx html */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _snabbdomJsx = require('snabbdom-jsx');

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _Navbar = require('./Navbar');

var _Navbar2 = _interopRequireDefault(_Navbar);

exports['default'] = {
    view: function view(props) {
        var state = window.store.getState();

        (0, _objectAssign2['default'])(props, {
            id: 'search',
            classNames: 'view'
        });

        return (0, _snabbdomJsx.html)('div', props);
    }
};
module.exports = exports['default'];

},{"./Navbar":32,"object-assign":4,"snabbdom-jsx":15}],35:[function(require,module,exports){
/** @jsx html */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _snabbdomJsx = require('snabbdom-jsx');

var _texts = require('../texts');

var _texts2 = _interopRequireDefault(_texts);

var _actionsCreatorsView = require('../actions/creators/view');

var _actionsCreatorsPlayer = require('../actions/creators/player');

exports['default'] = {
    openAddTrack: function openAddTrack(evt) {
        evt.preventDefault();
        console.log('TODO: Add Track');
    },
    openPlayer: function openPlayer(evt) {
        evt.preventDefault();
        window.store.dispatch((0, _actionsCreatorsPlayer.togglePlayer)());
    },
    setView: function setView(viewName, evt) {
        evt.preventDefault();

        var state = window.store.getState();

        window.store.dispatch((0, _actionsCreatorsView.setView)(viewName));
    },
    view: function view() {
        var state = window.store.getState();

        return (0, _snabbdomJsx.html)(
            'nav',
            {
                id: 'tabbar',
                'class-hide': state.feed.isScrolling },
            (0, _snabbdomJsx.html)(
                'ul',
                null,
                (0, _snabbdomJsx.html)(
                    'li',
                    { 'class': {
                            feed: 1,
                            active: state.view.current === 'feed'
                        } },
                    (0, _snabbdomJsx.html)(
                        'a',
                        { href: '/feed',
                            title: _texts2['default'].tabbar.feed,
                            'on-click': this.setView.bind(this, 'feed') },
                        (0, _snabbdomJsx.html)('i', { classNames: 'mf mf-musicfeed' })
                    )
                ),
                (0, _snabbdomJsx.html)(
                    'li',
                    { 'class': {
                            me: 1,
                            active: state.view.current === 'me'
                        } },
                    (0, _snabbdomJsx.html)(
                        'a',
                        { href: '/me',
                            title: _texts2['default'].tabbar.me,
                            'on-click': this.setView.bind(this, 'me') },
                        (0, _snabbdomJsx.html)('i', { classNames: 'mf mf-person-solid' })
                    )
                ),
                (0, _snabbdomJsx.html)(
                    'li',
                    { 'class': {
                            'add-track': 1
                        } },
                    (0, _snabbdomJsx.html)(
                        'a',
                        { href: '/add-track',
                            title: _texts2['default'].tabbar.addTrack,
                            'on-click': this.openAddTrack },
                        (0, _snabbdomJsx.html)('i', { classNames: 'mf mf-plus-2pt' })
                    )
                ),
                (0, _snabbdomJsx.html)(
                    'li',
                    { 'class': {
                            search: 1,
                            active: state.view.current === 'search'
                        } },
                    (0, _snabbdomJsx.html)(
                        'a',
                        { href: '/search',
                            title: _texts2['default'].tabbar.search,
                            'on-click': this.setView.bind(this, 'search') },
                        (0, _snabbdomJsx.html)('i', { classNames: 'mf mf-magnifying-glass-2pt' })
                    )
                ),
                (0, _snabbdomJsx.html)(
                    'li',
                    { 'class': {
                            player: 1
                        } },
                    (0, _snabbdomJsx.html)(
                        'a',
                        { href: '/player',
                            title: _texts2['default'].tabbar.search,
                            'on-click': this.openPlayer },
                        (0, _snabbdomJsx.html)(
                            'div',
                            { classNames: 'eq' },
                            (0, _snabbdomJsx.html)('div', { style: { transform: 'scaleY(' + Math.max(.06, state.player.eq[0]) + ')' } }),
                            (0, _snabbdomJsx.html)('div', { style: { transform: 'scaleY(' + Math.max(.06, state.player.eq[1]) + ')' } }),
                            (0, _snabbdomJsx.html)('div', { style: { transform: 'scaleY(' + Math.max(.06, state.player.eq[2]) + ')' } }),
                            (0, _snabbdomJsx.html)('div', { style: { transform: 'scaleY(' + Math.max(.06, state.player.eq[3]) + ')' } }),
                            (0, _snabbdomJsx.html)('div', { style: { transform: 'scaleY(' + Math.max(.06, state.player.eq[4]) + ')' } }),
                            (0, _snabbdomJsx.html)('div', { style: { transform: 'scaleY(' + Math.max(.06, state.player.eq[5]) + ')' } })
                        )
                    )
                )
            )
        );
    }
};
module.exports = exports['default'];

},{"../actions/creators/player":26,"../actions/creators/view":27,"../texts":45,"snabbdom-jsx":15}],36:[function(require,module,exports){
/** @jsx html */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _snabbdomJsx = require('snabbdom-jsx');

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _texts = require('../texts');

var _texts2 = _interopRequireDefault(_texts);

var _Feed = require('./Feed');

var _Feed2 = _interopRequireDefault(_Feed);

var _Search = require('./Search');

var _Search2 = _interopRequireDefault(_Search);

var _Me = require('./Me');

var _Me2 = _interopRequireDefault(_Me);

exports['default'] = {
    onInsert: function onInsert() {
        if (typeof StatusBar !== 'undefined') StatusBar.show();
    },
    onPostpatch: function onPostpatch(state) {
        if (typeof StatusBar !== 'undefined') StatusBar[state.view.current == 'me' ? 'styleLightContent' : 'styleDefault']();
    },
    getViewProps: function getViewProps(state, view) {
        return (0, _objectAssign2['default'])({
            style: { zIndex: 0 }
        }, state.view.previous == view && {
            style: { zIndex: 1 }
        }, state.view.current == view && {
            style: { zIndex: 2 }
        });
    },
    view: function view(props) {
        var state = window.store.getState();

        (0, _objectAssign2['default'])(props, {
            id: 'views-container',
            'class': {
                feed: state.view.current === 'feed',
                search: state.view.current === 'search',
                me: state.view.current === 'me'
            },
            'hook-insert': this.onInsert.bind(this),
            'hook-postpatch': this.onPostpatch.bind(this, state)
        });

        return (0, _snabbdomJsx.html)(
            'div',
            props,
            (0, _snabbdomJsx.html)(_Feed2['default'], this.getViewProps(state, 'feed')),
            (0, _snabbdomJsx.html)(_Search2['default'], this.getViewProps(state, 'search')),
            (0, _snabbdomJsx.html)(_Me2['default'], this.getViewProps(state, 'me'))
        );
    }
};
module.exports = exports['default'];

},{"../texts":45,"./Feed":30,"./Me":31,"./Search":34,"object-assign":4,"snabbdom-jsx":15}],37:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});
exports['default'] = configurePatcher;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _snabbdom = require('snabbdom');

var _snabbdom2 = _interopRequireDefault(_snabbdom);

var _snabbdomModulesClass = require('snabbdom/modules/class');

var _snabbdomModulesClass2 = _interopRequireDefault(_snabbdomModulesClass);

// makes it easy to toggle classes

var _snabbdomModulesProps = require('snabbdom/modules/props');

var _snabbdomModulesProps2 = _interopRequireDefault(_snabbdomModulesProps);

// for setting properties on DOM elements

var _snabbdomModulesStyle = require('snabbdom/modules/style');

var _snabbdomModulesStyle2 = _interopRequireDefault(_snabbdomModulesStyle);

// handles styling on elements with support for animations

var _snabbdomModulesEventlisteners = require('snabbdom/modules/eventlisteners');

var _snabbdomModulesEventlisteners2 = _interopRequireDefault(_snabbdomModulesEventlisteners);

// attaches event listeners

var _componentsApp = require('./components/App');

var _componentsApp2 = _interopRequireDefault(_componentsApp);

var patch = _snabbdom2['default'].init([_snabbdomModulesClass2['default'], _snabbdomModulesProps2['default'], _snabbdomModulesStyle2['default'], _snabbdomModulesEventlisteners2['default']]);

function configurePatcher(placeholder, store) {
	window.store = store;
	window.patch = function (placeholder) {
		window.appNode = patch(placeholder || window.appNode, _componentsApp2['default'].view());
	};
	window.patch(placeholder);
}

module.exports = exports['default'];

},{"./components/App":29,"snabbdom":21,"snabbdom/modules/class":17,"snabbdom/modules/eventlisteners":18,"snabbdom/modules/props":19,"snabbdom/modules/style":20}],38:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports['default'] = configureStore;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _redux = require('redux');

var _reduxThunk = require('redux-thunk');

var _reduxThunk2 = _interopRequireDefault(_reduxThunk);

// import createLogger     	from 'redux-logger';

var _reducers = require('./reducers');

var _reducers2 = _interopRequireDefault(_reducers);

var createStoreWithMiddleware = (0, _redux.applyMiddleware)(_reduxThunk2['default'] /*, // lets us dispatch() functions
                                                                                    createLogger()   // neat middleware that logs actions*/
)(_redux.createStore);

function configureStore(initialState) {
    return createStoreWithMiddleware(_reducers2['default'], initialState);
}

module.exports = exports['default'];

},{"./reducers":41,"redux":7,"redux-thunk":5}],39:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _configureStore = require('./configureStore');

var _configureStore2 = _interopRequireDefault(_configureStore);

var _configurePatcher = require('./configurePatcher');

var _configurePatcher2 = _interopRequireDefault(_configurePatcher);

var _utils = require('./utils');

function init() {
    var initialState = {
        view: {
            current: 'feed',
            previous: null
        }
    },
        store = (0, _configureStore2['default'])(initialState);

    (0, _configurePatcher2['default'])(document.getElementById('placeholder'), store);
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
    window.onload = function () {
        return document.dispatchEvent(new CustomEvent('deviceready'));
    };
} else (0, _utils.loadScript)('cordova.js');

},{"./configurePatcher":37,"./configureStore":38,"./utils":46}],40:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports['default'] = feed;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _actionsTypes = require('../actions/types');

function feed(feed, action) {
    if (feed === undefined) feed = {
        isFetching: false,
        tracks: [],
        fetchError: null,
        updatedAt: null,
        isScrolling: false,
        openActionIds: [],
        closedActionIds: []
    };

    switch (action.type) {
        case _actionsTypes.FETCH_FEED_REQ:
            return (0, _objectAssign2['default'])({}, feed, {
                isFetching: true,
                fetchError: null
            });
        case _actionsTypes.FETCH_FEED_RES:
            return (0, _objectAssign2['default'])({}, feed, {
                isFetching: false,
                tracks: action.tracks,
                updatedAt: action.updatedAt
            });
        case _actionsTypes.FETCH_FEED_ERR:
            return (0, _objectAssign2['default'])({}, feed, {
                isFetching: false,
                fetchError: action.error
            });
        case _actionsTypes.SCROLL_FEED_START:
        case _actionsTypes.SCROLL_FEED_STOP:
            return (0, _objectAssign2['default'])({}, feed, {
                isScrolling: action.type == _actionsTypes.SCROLL_FEED_START
            });
        case _actionsTypes.OPEN_FEED_ITEM_ACTIONS:
            var ooCopy = feed.openActionIds.slice(),
                ocCopy = feed.closedActionIds.slice(),
                ocIdx = feed.closedActionIds.indexOf(action.id);

            ooCopy.push(action.id);
            if (ocIdx > -1) ocCopy.splice(ocIdx, 1);

            return (0, _objectAssign2['default'])({}, feed, {
                openActionIds: ooCopy,
                closedActionIds: ocCopy
            });
        case _actionsTypes.CLOSE_FEED_ITEM_ACTIONS:
            var coCopy = feed.openActionIds.slice(),
                ccCopy = feed.closedActionIds.slice();

            coCopy.splice(feed.openActionIds.indexOf(action.id), 1);
            ccCopy.push(action.id);

            return (0, _objectAssign2['default'])({}, feed, {
                openActionIds: coCopy,
                closedActionIds: ccCopy
            });
        default:
            return feed;
    }
}

module.exports = exports['default'];

},{"../actions/types":28,"object-assign":4}],41:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _redux = require('redux');

var _view = require('./view');

var _view2 = _interopRequireDefault(_view);

var _feed = require('./feed');

var _feed2 = _interopRequireDefault(_feed);

var _player = require('./player');

var _player2 = _interopRequireDefault(_player);

var _me = require('./me');

var _me2 = _interopRequireDefault(_me);

exports['default'] = (0, _redux.combineReducers)({
    view: _view2['default'],
    feed: _feed2['default'],
    player: _player2['default'],
    me: _me2['default']
});

/* The above combineReducers() is equivalent to this:
export default function Reducers(state, action) {
    return {
        view: view(state.view, action),
        feed: feed(state.feed, action),
        player: player(state.player, action),
        me: me(state.me, action),
    };
}*/
module.exports = exports['default'];

},{"./feed":40,"./me":42,"./player":43,"./view":44,"redux":7}],42:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports['default'] = me;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _actionsTypes = require('../actions/types');

function me(me, action) {
    if (me === undefined) me = {
        isFetching: false,
        fetchError: null,
        updatedAt: null,
        data: null
    };

    switch (action.type) {
        case _actionsTypes.FETCH_ME_REQ:
            return (0, _objectAssign2['default'])({}, me, {
                isFetching: true,
                fetchError: null
            });
        case _actionsTypes.FETCH_ME_RES:
            return (0, _objectAssign2['default'])({}, me, {
                isFetching: false,
                updatedAt: action.updatedAt,
                data: action.data
            });
        case _actionsTypes.FETCH_ME_ERR:
            return (0, _objectAssign2['default'])({}, me, {
                isFetching: false,
                fetchError: action.error
            });
        default:
            return me;
    }
}

module.exports = exports['default'];

},{"../actions/types":28,"object-assign":4}],43:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports['default'] = player;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _actionsTypes = require('../actions/types');

function player(player, action) {
    if (player === undefined) player = {
        isOpen: false,
        isClosed: false,
        isPlaying: false,
        track: null,
        idx: null,
        progress: 0,
        eq: [.03, .03, .03, .03, .03, .03]
    };

    switch (action.type) {
        case _actionsTypes.PLAYER_SET_TRACK:
            return (0, _objectAssign2['default'])({}, player, {
                isPlaying: false,
                track: action.track,
                idx: action.idx
            });
        case _actionsTypes.PLAYER_START:
            return (0, _objectAssign2['default'])({}, player, {
                isPlaying: true
            });
        case _actionsTypes.PLAYER_PAUSE:
            return (0, _objectAssign2['default'])({}, player, {
                isPlaying: false
            });
        case _actionsTypes.PLAYER_PROGRESS:
            return (0, _objectAssign2['default'])({}, player, {
                progress: action.progress
            });
        case _actionsTypes.PLAYER_OPEN:
            return (0, _objectAssign2['default'])({}, player, {
                isOpen: true,
                isClosed: false
            });
        case _actionsTypes.PLAYER_CLOSE:
            return (0, _objectAssign2['default'])({}, player, {
                isOpen: false,
                isClosed: true
            });
        case _actionsTypes.PLAYER_EQ:
            return (0, _objectAssign2['default'])({}, player, {
                eq: action.data
            });
        default:
            return player;
    }
}

module.exports = exports['default'];

},{"../actions/types":28,"object-assign":4}],44:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports['default'] = view;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _actionsTypes = require('../actions/types');

function view(view, action) {
    if (view === undefined) view = {
        current: 'feed',
        previous: null
    };

    switch (action.type) {
        case _actionsTypes.SET_VIEW:
            return (0, _objectAssign2['default'])({}, view, {
                current: action.viewName,
                previous: view.current
            });
        default:
            return view;
    }
}

module.exports = exports['default'];

},{"../actions/types":28,"object-assign":4}],45:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});
exports['default'] = {
	navbar: {
		feed: 'musicfeed',
		search: 'Search',
		me: 'My Profile'
	},
	tabbar: {
		feed: 'Feed',
		search: 'Search',
		me: 'My Profile',
		addTrack: 'Add track',
		player: 'Player'
	},
	me: {
		title: 'My Profile'
	},
	track: {
		repost: 'Repost',
		addToPlaylist: 'Add to playlist',
		share: 'Share'
	}
};
module.exports = exports['default'];

},{}],46:[function(require,module,exports){
(function (process){
'use strict';

//  Since resize events can fire at a high rate
//  we throttle calling it. implementation from:
//  developer.mozilla.org/en-US/docs/Web/Events/resize#requestAnimationFrame_customEvent
Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.hasClass = hasClass;
exports.safeStringify = safeStringify;
exports.checkNested = checkNested;
exports.getNested = getNested;
exports.getRef = getRef;
exports.loadStyleSheet = loadStyleSheet;
exports.loadScript = loadScript;
exports.parseJSON = parseJSON;
exports.supplantString = supplantString;
exports.compareISODates = compareISODates;
exports.addHttp = addHttp;
exports.navInternal = navInternal;
if (process.browser || typeof window !== 'undefined') (function defineThrottledResizeEvent() {
    var running = false;

    window.addEventListener('resize', function () {
        if (running) return;

        running = true;
        requestAnimationFrame(function () {
            //  see: https://developer.mozilla.org/en-US/docs/Web/Events/resize#requestAnimationFrame_customEvent
            window.dispatchEvent(new CustomEvent('throttledResize'));
            running = false;
        });
    });
})();

//  Polyfills
if (!Array.prototype.find) Array.prototype.find = function (predicate) {
    if (this === null) throw new TypeError('Array.prototype.find called on null or undefined');

    if (typeof predicate !== 'function') throw new TypeError('predicate must be a function');

    var list = Object(this),
        length = list.length >>> 0,
        thisArg = arguments[1],
        value,
        i;

    for (i = 0; i < length; i++) {
        value = list[i];
        if (predicate.call(thisArg, value, i, list)) return value;
    }

    return undefined;
};

if (!Array.prototype.findIndex) Array.prototype.findIndex = function (predicate) {
    if (this === null) throw new TypeError('Array.prototype.findIndex called on null or undefined');

    if (typeof predicate !== 'function') throw new TypeError('predicate must be a function');

    var list = Object(this),
        length = list.length >>> 0,
        thisArg = arguments[1],
        value,
        i;

    for (i = 0; i < length; i++) {
        value = list[i];
        if (predicate.call(thisArg, value, i, list)) return i;
    }

    return -1;
};

//  Text case transformations
if (!String.prototype.toSentenceCase) String.prototype.toSentenceCase = function () {
    return this.charAt(0).toUpperCase() + this.substring(1);
};

if (!String.prototype.toTitleCase) String.prototype.toTitleCase = function () {
    return this.split(/\s+/).map(function (word) {
        return word.charAt(0).toUpperCase() + word.substring(1);
    }).join(' ');
};

//  Pad with a leading zero when necessary
if (!Number.prototype.leadZero) Number.prototype.leadZero = function () {
    return ('0' + this).substr(-2);
};

if (!String.prototype.leadZero) String.prototype.leadZero = function () {
    return ('0' + this).substr(-2);
};

function hasClass(el, className) {
    return (' ' + el.className + ' ').replace(/[\n\t]/g, ' ').indexOf(' ' + className + ' ') > -1 ? true : false;
}

//  A utility function to safely escape JSON
//  for embedding in a <script> tag

function safeStringify(obj) {
    return JSON.stringify(obj).replace(/<\/script/g, '<\\/script').replace(/<!--/g, '<\\!--');
}

//  Check if deep object propery exists
//  see: stackoverflow.com/a/2631198
//
//  var test = {level1:{level2:{level3:'level3'}} };
//  checkNested(test, 'level1', 'level2', 'level3'); // true
//  checkNested(test, 'level1', 'level2', 'foo'); // false

function checkNested(obj /*, level1, level2, ... levelN*/) {
    var args = Array.prototype.slice.call(arguments, 1);

    for (var i = 0; i < args.length; i++) {

        if (!obj || !Object.prototype.hasOwnProperty.call(obj, args[i])) return false;

        obj = obj[args[i]];
    }

    return true;
}

//  does the same trick as the getRef() below

function getNested(obj /*, level1, level2, ... levelN*/) {
    var args = Array.prototype.slice.call(arguments, 1);

    for (var i = 0; i < args.length; i++) {

        if (!obj || !Object.prototype.hasOwnProperty.call(obj, args[i])) return undefined;

        obj = obj[args[i]];
    }

    return obj;
}

//  get (deeply nested) property value by dot-notation
//  see: stackoverflow.com/a/10934946

function getRef(obj, path) {
    return path.split('.').reduce(function (obj, prop) {
        return obj ? obj[prop] : obj;
    }, obj);
}

//  Asynchronously load stylesheet, returns a Promise
//  see: stackoverflow.com/a/28386674

function loadStyleSheet(url) {

    var timer,
        sheet = document.createElement('link');
    sheet.rel = 'stylesheet';
    sheet.type = 'text/css';
    sheet.href = url;

    document.head.appendChild(sheet);

    return new Promise(function (resolve, reject) {

        var resolveLink = function resolveLink() {
            resolve(sheet);
        };

        sheet.onload = resolveLink;
        sheet.addEventListener('load', resolveLink);
        sheet.onreadystatechange = function () {
            if (sheet.readyState === 'loaded' || sheet.readyState === 'complete') resolveLink();
        };

        timer = setInterval(function () {
            try {
                for (var i = 0; i < document.styleSheets.length; i++) if (document.styleSheets[i].href === sheet.href) resolveLink();
            } catch (e) {
                // the stylesheet wasn't loaded
                reject(e);
            }
        }, 250);
    }).then(function (stylesheet) {
        clearInterval(timer);
        return stylesheet;
    }, function (e) {
        console.log("the stylesheet wasn't loaded", e);
    });
}

//  based on the above, returns a Promise

function loadScript(url, async) {
    async = typeof async === 'undefined' ? false : true;

    var timer,
        script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = async;
    script.src = url;

    document.head.appendChild(script);

    return new Promise(function (resolve, reject) {
        var resolveLink = function resolveLink() {
            return resolve(script);
        };

        script.onload = resolveLink;
        script.addEventListener('load', resolveLink);
        script.onreadystatechange = function () {
            return (script.readyState === 'loaded' || script.readyState === 'complete') && resolveLink();
        };

        timer = setInterval(function () {
            try {
                for (var i = 0; i < document.scripts.length; i++) if (document.scripts[i].src === script.src) resolveLink();
            } catch (err) {
                // the script wasn't loaded
                reject(err);
            }
        }, 250);
    }).then(function (script) {
        return clearInterval(timer) || script;
    }, function (err) {
        return console.log("the script wasn't loaded", err);
    });
}

function parseJSON(resText) {
    var resJSON = null;

    if (resText) try {
        resJSON = JSON.parse(resText);
    } catch (e) {
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

function supplantString(string, replacements) {
    return string.replace(/{([^{}]*)}/g, function (a, b) {
        var r = replacements[b];
        return typeof r === 'string' || typeof r === 'number' ? r : '';
    });
}

//  see if DATE 1 is later than DATE 2

function compareISODates(dateStr1, dateStr2) {
    if (['now', 'yesterday'].indexOf(dateStr1) > -1) dateStr1 = new Date().toISOString();

    if (dateStr1 == 'yesterday') dateStr1.setDate(dateStr1.getDate() - 1);

    if (['now', 'yesterday'].indexOf(dateStr2) > -1) dateStr2 = new Date().toISOString();

    if (dateStr2 == 'yesterday') dateStr2.setDate(dateStr2.getDate() - 1);

    //  return true if second date is not defined
    if (!dateStr2) return true;

    //  return false if first date is not defined
    //  (but second date is)
    if (!dateStr1) return false;

    var d1 = new Date(dateStr1),
        d2 = new Date(dateStr2),
        diff = d1 - d2;

    //  return true if first date is later (greater)
    return diff > 0;
}

function addHttp(url) {
    return !/^(?:f|ht)tps?\:\/\//.test(url) ? 'http://' + url : url;
}

function navInternal(evt) {
    var href = evt.currentTarget.getAttribute('href'),
        isUrl = /^https?:\/\//.test(href),
        isSameDomain = href.indexOf(location.protocol + '//' + location.host) == 0,
        isInternal = !isUrl || isUrl && isSameDomain;

    if (isInternal && typeof this.transitionTo === 'function') {
        evt.preventDefault();
        this.transitionTo(href);
    }
}

}).call(this,require('_process'))

},{"_process":1}]},{},[39])


//# sourceMappingURL=bundle.js.map
