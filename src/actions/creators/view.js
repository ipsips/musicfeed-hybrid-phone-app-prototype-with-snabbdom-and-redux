'use strict';

import fetch        from 'isomorphic-fetch';
import {SET_VIEW}   from '../types';

export function setView(viewName) {
	return (dispatch, getState) =>
        shouldSetView(viewName, getState())
        	? dispatch(doSetView(viewName))
        	: null;
}

function shouldSetView(viewName, state) {
	return viewName != state.view.current;
}

function doSetView(viewName) {
    return {
        type: SET_VIEW,
        viewName: viewName
    };
}