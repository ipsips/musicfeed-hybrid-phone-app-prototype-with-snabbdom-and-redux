'use strict';

import assign       from 'object-assign';
import {SET_VIEW}   from '../actions/types';

export default function view(view = {
    current: 'feed',
    previous: null
}, action) {
    switch (action.type) {
        case SET_VIEW:
            return assign({}, view, {
                current: action.viewName,
                previous: view.current
            });
        default:
            return view;
    }
}