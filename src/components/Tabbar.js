/** @jsx html */
'use strict';

import {html}           from 'snabbdom-jsx';
import texts            from '../texts';
import {setView}        from '../actions/creators/view';
import {togglePlayer}   from '../actions/creators/player';

export default {
    openAddTrack(evt) {
        evt.preventDefault();
        console.log('TODO: Add Track');
        window.store.dispatch(setView('add-track'));
    },
    openPlayer(evt) {
        evt.preventDefault();
        window.store.dispatch(togglePlayer());
        window.store.dispatch(setView('player'));
    },
    setView(viewName, evt) {
        evt.preventDefault();

        let state = window.store.getState();

        window.store.dispatch(setView(viewName));
    },
    view() {
        let state = window.store.getState();

        return <nav {...{
            id: 'tabbar',
            class: {
                hide: state.feed.isScrolling,
                'player-active': state.player.track,
                'player-playing': state.player.isPlaying
            }}}>
            <ul>
                <li class={{
                        feed: 1,
                        active: state.view.current === 'feed'
                    }}>
                    <a  href="/feed"
                        title={texts.tabbar.feed}
                        on-click={this.setView.bind(this, 'feed')}>
                        <i {...{
                            class: {
                                'mf': 1,
                                'mf-musicfeed-outline': state.view.current !== 'feed',
                                'mf-musicfeed': state.view.current === 'feed'
                            }}}/>
                    </a>
                </li>
                <li class={{
                        me: 1,
                        active: state.view.current === 'me'
                    }}>
                    <a  href="/me"
                        title={texts.tabbar.me}
                        on-click={this.setView.bind(this, 'me')}>
                        <i {...{
                            class: {
                                'mf': 1,
                                'mf-person-outline': state.view.current !== 'me',
                                'mf-person-solid': state.view.current === 'me'
                            }}}/>
                    </a>
                </li>
                <li class={{
                        'add-track': 1,
                        active: state.view.current === 'add-track'
                    }}>
                    <a  href="/add-track"
                        title={texts.tabbar.addTrack}
                        on-click={this.openAddTrack}>
                        <i {...{
                            class: {
                                'mf': 1,
                                'mf-plus': state.view.current !== 'add-track',
                                'mf-plus-2pt': state.view.current === 'add-track'
                            }}}/>
                    </a>
                </li>
                <li class={{
                        search: 1,
                        active: state.view.current === 'search'
                    }}>
                    <a  href="/search"
                        title={texts.tabbar.search}
                        on-click={this.setView.bind(this, 'search')}>
                        <i {...{
                            class: {
                                'mf': 1,
                                'mf-magnifying-glass': state.view.current !== 'search',
                                'mf-magnifying-glass-2pt': state.view.current === 'search'
                            }}}/>
                    </a>
                </li>
                <li class={{
                        player: 1,
                        active: state.view.current === 'player'
                    }}>
                    <a  href="/player"
                        title={texts.tabbar.search}
                        on-click={this.openPlayer}>
                        {/*<div classNames="eq">
                            <div style={{transform: 'scaleY('+Math.max(.06, state.player.eq[0])+')'}}/>
                            <div style={{transform: 'scaleY('+Math.max(.06, state.player.eq[1])+')'}}/>
                            <div style={{transform: 'scaleY('+Math.max(.06, state.player.eq[2])+')'}}/>
                            <div style={{transform: 'scaleY('+Math.max(.06, state.player.eq[3])+')'}}/>
                            <div style={{transform: 'scaleY('+Math.max(.06, state.player.eq[4])+')'}}/>
                            <div style={{transform: 'scaleY('+Math.max(.06, state.player.eq[5])+')'}}/>
                        </div>*/}
                        <div classNames="eq">
                            <div/>
                            <div/>
                            <div/>
                            <div/>
                            <div/>
                            <div/>
                        </div>
                    </a>
                </li>
            </ul>
        </nav>;
    }
};