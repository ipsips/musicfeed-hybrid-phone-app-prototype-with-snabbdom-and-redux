/** @jsx html */
'use strict';

import {html}   from 'snabbdom-jsx';
import texts    from '../texts';

export default {
    feedNavbar(props) {
        let state = window.store.getState();

        return <nav
            classNames="navbar feed"
            class-invisible={!state.feed.tracks.length}
            class-hide={state.feed.isScrolling}>
            <ul>
                <li/>
                <li>
                    {texts.navbar.feed}
                </li>
                <li/>
            </ul>
        </nav>;
    },
    meNavbar(props) {
        let state = window.store.getState();

        return <nav
            classNames="navbar me"
            class-invisible={!state.me.data}>
            <ul>
                <li>
                    <a href="#" on-click={evt => evt.preventDefault()}>
                        <i className="mf mf-gear"/>
                    </a>
                </li>
                <li/>
                <li/>
            </ul>
        </nav>;
    },
    playerNavbar(props) {
        let state = window.store.getState();

        return <nav classNames="navbar player">
            <ul>
                <li/>
                <li>
                    <a href="#" on-click={props.closePlayer}>
                        <i className="mf mf-arrow-down-obtuse"/>
                    </a>
                </li>
                <li/>
            </ul>
        </nav>;
    },
    view(props) {
        return this[props.view+'Navbar'](props);
    }
};