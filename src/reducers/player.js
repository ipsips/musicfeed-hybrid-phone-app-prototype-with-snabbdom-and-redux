'use strict';

import assign               from 'object-assign';
import {PLAYER_SET_TRACK,
        PLAYER_START,
        PLAYER_PAUSE,
        PLAYER_OPEN,
        PLAYER_CLOSE,
        PLAYER_VISUALIZE}   from '../actions/types';

export default function player(player = {
    isOpen: false,
    isClosed: false,
    isPlaying: false,
    track: null,
    idx: null,
    progress: 0,
    elapsed: null,
    duration: null,
    // eq: [.03,.03,.03,.03,.03,.03]
}, action) {
    switch (action.type) {
        case PLAYER_SET_TRACK:
            return assign({}, player, {
                isPlaying: false,
                track: action.track,
                idx: action.idx
            });
        case PLAYER_START:
            return assign({}, player, {
                isPlaying: true
            });
        case PLAYER_PAUSE:
            return assign({}, player, {
                isPlaying: false
            });
        case PLAYER_OPEN:
            return assign({}, player, {
                isOpen: true,
                isClosed: false
            });
        case PLAYER_CLOSE:
            return assign({}, player, {
                isOpen: false,
                isClosed: true
            });
        case PLAYER_VISUALIZE:
            return assign({}, player, {
                eq: action.eq,
                progress: action.progress,
                elapsed: action.elapsed,
                duration: action.duration
            });
        default:
            return player;
    }
}