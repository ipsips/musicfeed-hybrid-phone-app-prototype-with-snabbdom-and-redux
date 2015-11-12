/** @jsx html */
'use strict';

import {html}           from 'snabbdom-jsx';
import Tabbar           from './Tabbar';
import Player           from './Player';
import ViewsContainer   from './ViewsContainer';

export default {
    onCreate() {
        if (!this.unsubscribe)
            this.unsubscribe = window.store.subscribe(window.patch);
    },
    view() {
        let state = window.store.getState(),
            props = {
                id: 'app',
                'hook-create': this.onCreate.bind(this)
            };

        return  <div {...props}>
                    {navigator.userAgent.match(/(Chrome|Safari)/i) ?
                        <ul classNames="statusbar"
                            class-white={state.view.current == 'me' ||
                                         state.view.current == 'add-track'}>
                            <li/><li/><li/></ul> :''}
                    <ViewsContainer/>
                    <Tabbar/>
                    <Player/>
                </div>;
    }
}
