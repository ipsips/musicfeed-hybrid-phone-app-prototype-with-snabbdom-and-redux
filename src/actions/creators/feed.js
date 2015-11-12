'use strict';

import Api                      from '../../Api';
import {FETCH_FEED_REQ,
        FETCH_FEED_RES,
        FETCH_FEED_ERR,
        SCROLL_FEED_START,
        SCROLL_FEED_STOP,
        OPEN_FEED_ITEM_ACTIONS,
        CLOSE_FEED_ITEM_ACTIONS}from '../types';

export function fetchFeed() {
    return (dispatch, getState) =>
        shouldFetch(getState())
            ? dispatch(doFetch())
            : null;
}

function shouldFetch(state) {
    return !state.feed.tracks.length
        && !state.feed.isFetching;
}

function doFetch() {
    return dispatch =>
        dispatch(send()) &&
        Api.feed((err, res) =>
            err ? dispatch(fail(err))
                : dispatch(receive(res)));
}

function send() {
    return {
        type: FETCH_FEED_REQ
    };
}

function receive(json) {
    return {
        type: FETCH_FEED_RES,
        tracks: json,
        updatedAt: Date.now()
    };
}

function fail(err) {
    return {
        type: FETCH_FEED_ERR,
        error: err
    };
}

export function scrollFeed(start) {
    return {
        type: start
                ? SCROLL_FEED_START
                : SCROLL_FEED_STOP
    };
}

export function openActions(id) {
    return (dispatch, getState) =>
        shouldOpenActions(getState(), id)
            ? dispatch(doOpenActions(id))
            : null;
}

function shouldOpenActions(state, id) {
    return state.feed.openActionIds.indexOf(id) < 0;
}

function doOpenActions(id) {
    return {
        type: OPEN_FEED_ITEM_ACTIONS,
        id: id
    };
}

export function closeActions(id) {
    return (dispatch, getState) =>
        shouldCloseActions(getState(), id)
            ? dispatch(doCloseActions(id))
            : null;
}

function shouldCloseActions(state, id) {
    return state.feed.openActionIds.indexOf(id) > -1;
}

function doCloseActions(id) {
    return {
        type: CLOSE_FEED_ITEM_ACTIONS,
        id: id
    };
}