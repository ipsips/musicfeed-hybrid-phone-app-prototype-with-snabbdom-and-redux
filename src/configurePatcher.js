'use strict';

import snabbdom 	from 'snabbdom';
import classes 		from 'snabbdom/modules/class';          // makes it easy to toggle classes
import props 		from 'snabbdom/modules/props';          // for setting properties on DOM elements
import style 		from 'snabbdom/modules/style';          // handles styling on elements with support for animations
import listeners	from 'snabbdom/modules/eventlisteners'; // attaches event listeners
import App      	from './components/App';

var patch = snabbdom.init([classes, props, style, listeners]);

export default function configurePatcher(placeholder, store) {
	window.store = store;
	window.patch = placeholder => {
		window.appNode = patch(placeholder || window.appNode, App.view());
	}
	window.patch(placeholder);
}