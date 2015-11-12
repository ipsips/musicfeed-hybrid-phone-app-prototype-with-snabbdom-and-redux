/** @jsx html */
'use strict';

import {html}           from 'snabbdom-jsx';
import assign           from 'object-assign';
import texts            from '../texts';
import {getRef}         from '../utils';
import {setView}        from '../actions/creators/view';
import {fetchFeed}      from '../actions/creators/feed';
import {openActions}    from '../actions/creators/feed';
import {closeActions}   from '../actions/creators/feed';
import {scrollFeed}     from '../actions/creators/feed';
import {playTrack}      from '../actions/creators/player';
import {togglePlayer}   from '../actions/creators/player';
import Navbar           from './Navbar';

export default {
    onInsert(vnode) {
        setTimeout(() =>
            window.store.dispatch(fetchFeed()));
    },
    onScrollableInsert(vnode) {
        vnode.elm.addEventListener('scroll', this.onScroll.bind(this), true);
    },
    onScroll(evt) {
        if (!this.scrolling)
            this.scrollStart();

        clearTimeout(this.scrollTimer);
        this.scrollTimer = setTimeout(this.scrollStop.bind(this), 100);
    },
    scrollStart() {
        this.scrolling = true;
        window.store.dispatch(scrollFeed(true));
    },
    scrollStop() {
        this.scrolling = false;
        window.store.dispatch(scrollFeed(false));
    },
    onScrollableDestroy(vnode) {
        vnode.elm.removeEventListener('scroll', this.onScroll);
    },
    openActions(id) {
        window.store.dispatch(openActions(id));
    },
    closeActions(id) {
        window.store.dispatch(closeActions(id));
    },
    play(track, idx) {
        window.store.dispatch(playTrack(track, idx));
    },
    openPlayer() {
        window.store.dispatch(togglePlayer());
        window.store.dispatch(setView('player'));
    },
    view(props) {
        let state = window.store.getState();
        
        assign(props, {
            id: 'feed',
            classNames: 'view',
            class: {
                empty: !state.feed.tracks.length,
                loading: state.feed.isFetching
            },
            'hook-insert': this.onInsert.bind(this)
        });

        let scrollableProps = {
                id: 'scrollable',
                'hook-insert': this.onScrollableInsert.bind(this),
                'hook-destroy': this.onScrollableDestroy.bind(this)
            },
            playerTrackId = getRef(state.player, 'track.id');

        return <div {...props}>
            <Navbar view="feed"/>
            <div {...scrollableProps}>
                <ul>
                    {state.feed.tracks.map((track, idx) =>
                    <li {...{
                            classNames: 'track',
                            class: {
                                loved: track.is_liked,
                                'show-actions': state.feed.openActionIds.indexOf(track.id) > -1,
                                'hide-actions': state.feed.closedActionIds.indexOf(track.id) > -1,
                                'is-in-player': playerTrackId == track.id,
                                'is-playing': state.player.isPlaying
                            },
                            // 'data-cover': track.picture,
                            style: {
                                backgroundImage: 'url('+track.picture+')'
                            }
                        }}>
                        <div>
                            <div classNames="meta">
                                <h3 classNames="title">
                                    <span>{track.name}</span>
                                </h3>
                                <h6 classNames="author" class-verified={track.is_verified_user}>
                                    <u style={{
                                        backgroundImage: 'url('+track.author_picture+')'
                                    }}/>
                                    {track.author_name}
                                </h6>
                                <ul classNames="more">
                                    <li classNames="ellipsis"
                                        /*on-click={this.openActions.bind(this, track.id)}*/>
                                        <i classNames="mf mf-ellipsis-2pt"/>
                                    </li>
                                </ul>
                            </div>
                            <i  classNames="mf mf-play"
                                on-click={this.play.bind(this, track, idx)}/>
                            {/*playerTrackId == track.id ?
                            <div classNames="eq"
                                on-click={this.openPlayer}>
                                <div style={{transform: 'scaleY('+Math.max(.03, state.player.eq[0])+')'}}/>
                                <div style={{transform: 'scaleY('+Math.max(.03, state.player.eq[1])+')'}}/>
                                <div style={{transform: 'scaleY('+Math.max(.03, state.player.eq[2])+')'}}/>
                                <div style={{transform: 'scaleY('+Math.max(.03, state.player.eq[3])+')'}}/>
                                <div style={{transform: 'scaleY('+Math.max(.03, state.player.eq[4])+')'}}/>
                                <div style={{transform: 'scaleY('+Math.max(.03, state.player.eq[5])+')'}}/>
                            </div> : ''*/}
                            {playerTrackId == track.id ?
                            <div classNames="eq"
                                on-click={this.openPlayer}>
                                <div/>
                                <div/>
                                <div/>
                                <div/>
                                <div/>
                                <div/>
                            </div> : ''}
                            <div classNames="overlay"/>
                        </div>
                    </li>)}
                </ul>
            </div>
        </div>;
    }
};