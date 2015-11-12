'use strict';

import {combineReducers}from 'redux';
import view             from './view';
import feed             from './feed';
import player           from './player';
import me          		from './me';

export default combineReducers({
    view,
    feed,
    player,
    me
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