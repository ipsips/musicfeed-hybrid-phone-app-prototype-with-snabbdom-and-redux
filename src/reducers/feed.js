'use strict';

import assign                   from 'object-assign';
import {FETCH_FEED_REQ,
        FETCH_FEED_RES,
        FETCH_FEED_ERR,
        SCROLL_FEED_START,
        SCROLL_FEED_STOP,
        OPEN_FEED_ITEM_ACTIONS,
        CLOSE_FEED_ITEM_ACTIONS}from '../actions/types';

export default function feed(feed = {
    isFetching: false,
    tracks: [],
    fetchError: null,
    updatedAt: null,
    isScrolling: false,
    openActionIds: [],
    closedActionIds: []
}, action) {
    switch (action.type) {
        case FETCH_FEED_REQ:
            return assign({}, feed, {
                isFetching: true,
                fetchError: null
            });
        case FETCH_FEED_RES:
            return assign({}, feed, {
                isFetching: false,
                tracks: action.tracks,
                updatedAt: action.updatedAt
            });
        case FETCH_FEED_ERR:
            return assign({}, feed, {
                isFetching: false,
                fetchError: action.error
            });
        case SCROLL_FEED_START:
        case SCROLL_FEED_STOP:
            return assign({}, feed, {
                isScrolling: action.type == SCROLL_FEED_START
            });
        case OPEN_FEED_ITEM_ACTIONS:
            let ooCopy = feed.openActionIds.slice(),
                ocCopy = feed.closedActionIds.slice(),
                ocIdx = feed.closedActionIds.indexOf(action.id);
            
            ooCopy.push(action.id);
            if (ocIdx > -1)
                ocCopy.splice(ocIdx, 1);

            return assign({}, feed, {
                openActionIds: ooCopy,
                closedActionIds: ocCopy
            });
        case CLOSE_FEED_ITEM_ACTIONS:
            let coCopy = feed.openActionIds.slice(),
                ccCopy = feed.closedActionIds.slice();

            coCopy.splice(feed.openActionIds.indexOf(action.id), 1);
            ccCopy.push(action.id);

            return assign({}, feed, {
                openActionIds: coCopy,
                closedActionIds: ccCopy
            });
        default:
            return feed;
    }
}