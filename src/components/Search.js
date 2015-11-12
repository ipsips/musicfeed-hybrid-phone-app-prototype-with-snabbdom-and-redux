/** @jsx html */
'use strict';

import {html} 	from 'snabbdom-jsx';
import assign 	from 'object-assign';
import Navbar 	from './Navbar';

export default {
    view(props) {
        let state = window.store.getState();

        assign(props, {
            id: 'search',
            classNames: 'view'
        });

        return <div {...props}></div>;
    }
};