/** @jsx html */
'use strict';

import {html}   from 'snabbdom-jsx';
import assign   from 'object-assign';
import texts    from '../texts';
import Feed     from './Feed';
import Search   from './Search';
import Me       from './Me';

export default {
    onInsert() {
        if (typeof StatusBar !== 'undefined')
            StatusBar.show();
    },
    onPostpatch(state) {
        if (typeof StatusBar !== 'undefined')
            StatusBar[state.view.current == 'me'
                        ? 'styleLightContent'
                        : 'styleDefault']();
    },
    getViewProps(state, view) {
        return assign({
            style: {zIndex: 0}
        }, state.view.previous == view && {
            style: {zIndex: 1}
        }, state.view.current == view && {
            style: {zIndex: 2}
        });
    },
    view(props) {
        let state = window.store.getState();
        
        assign(props, {
            id: 'views-container',
            class: {
                feed: state.view.current === 'feed',
                search: state.view.current === 'search',
                me: state.view.current === 'me'
            },
            'hook-insert': this.onInsert.bind(this),
            'hook-postpatch': this.onPostpatch.bind(this, state)
        });

        return <div {...props}>
            <Feed {...this.getViewProps(state, 'feed')}/>
            <Search {...this.getViewProps(state, 'search')}/>
            <Me {...this.getViewProps(state, 'me')}/>
        </div>;
    }
};