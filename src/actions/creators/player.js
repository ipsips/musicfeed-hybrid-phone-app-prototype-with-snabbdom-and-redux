'use strict';

import Api                  from '../../Api';
import {getRef}             from '../../utils';
import {PLAYER_SET_TRACK,
        PLAYER_START,
        PLAYER_PAUSE,
        PLAYER_OPEN,
        PLAYER_CLOSE,
        PLAYER_VISUALIZE}   from '../types';

export function playTrack(track, idx) {
    return (dispatch, getState) => {
        let state = getState();
        
        if (shouldSetTrack(track, state))
            return dispatch(setTrack(track, idx))/*
                && dispatch(startPlayback())*/;

        // else if (shouldStart(state))
        //     return dispatch(startPlayback());

        else    
            return null;
    };
}

function shouldSetTrack(track, state) {
    return getRef(state.player, 'track.id') != track.id;
}

function shouldStart(state) {
    return !state.player.isPlaying;
}

function setTrack(track, idx) {
    return {
        type: PLAYER_SET_TRACK,
        track: track,
        idx: idx
    };
}

export function startPlayback() {
    return {
        type: PLAYER_START
    };
}

export function pausePlayback() {
    return {
        type: PLAYER_PAUSE
    };
}

export function togglePlayer() {
    return (dispatch, getState) =>
        getState().player.isOpen
            ? dispatch({type: PLAYER_CLOSE})
            : dispatch({type: PLAYER_OPEN});
}

export function visualize({elapsed, duration, eq}) {
    return {
        type: PLAYER_VISUALIZE,
        progress: elapsed / duration,
        elapsed: elapsed,
        duration: duration,
        eq: eq
    };
}