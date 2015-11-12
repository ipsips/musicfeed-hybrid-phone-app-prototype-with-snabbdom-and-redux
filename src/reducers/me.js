'use strict';

import assign           from 'object-assign';
import {FETCH_ME_REQ,
        FETCH_ME_RES,
        FETCH_ME_ERR}   from '../actions/types';

export default function me(me = {
    isFetching: false,
    fetchError: null,
    updatedAt: null,
    data: null
}, action) {
    switch (action.type) {
        case FETCH_ME_REQ:
            return assign({}, me, {
                isFetching: true,
                fetchError: null
            });
        case FETCH_ME_RES:
            return assign({}, me, {
                isFetching: false,
                updatedAt: action.updatedAt,
                data: action.data
            });
        case FETCH_ME_ERR:
            return assign({}, me, {
                isFetching: false,
                fetchError: action.error
            });
        default:
            return me;
    }
}