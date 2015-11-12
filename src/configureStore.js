'use strict';

import {createStore,
        applyMiddleware}	from 'redux';
import thunkMiddleware  	from 'redux-thunk';
// import createLogger     	from 'redux-logger';
import reducers         	from './reducers';

var createStoreWithMiddleware = applyMiddleware(
    thunkMiddleware/*, // lets us dispatch() functions
    createLogger()   // neat middleware that logs actions*/
)(createStore);

export default function configureStore(initialState) {
    return createStoreWithMiddleware(reducers, initialState);
}