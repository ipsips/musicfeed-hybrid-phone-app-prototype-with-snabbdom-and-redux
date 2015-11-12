'use strict';

import Api              from '../../Api';
import {FETCH_ME_REQ,
        FETCH_ME_RES,
        FETCH_ME_ERR}   from '../types';

export function fetchMe() {
    return (dispatch, getState) =>
        shouldFetch(getState())
            ? dispatch(doFetch())
            : null;
}

function shouldFetch(state) {
    return !state.me.data
        && !state.me.isFetching;
}

function doFetch() {
    return dispatch =>
        dispatch(send()) &&
        Api.me((err, res) =>
            err ? dispatch(fail(err))
                : dispatch(receive(res)));
}

function send() {
    return {
        type: FETCH_ME_REQ
    };
}

function receive(res) {
    return {
        type: FETCH_ME_RES,
        data: res,
        updatedAt: Date.now()
    };
}

function fail(err) {
    return {
        type: FETCH_ME_ERR,
        error: err
    };
}