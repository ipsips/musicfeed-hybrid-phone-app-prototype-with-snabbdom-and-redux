/** @jsx html */
'use strict';

import {html}   from 'snabbdom-jsx';
import assign   from 'object-assign';
import {fetchMe}from '../actions/creators/me';
import texts    from '../texts';
import Navbar   from './Navbar';

export default {
    onPrepatch(state) {
        if (state.view.current == 'me')
            setTimeout(() =>
                window.store.dispatch(fetchMe()));
    },
    getProfilePicUrl(url, size) {
        if (!url)
            return '';

        if (url.indexOf('facebook.com') < 0)
            return url;

        let d = size == 'profile'
                ? [160, 160]
                : [1000, 600]; //[750/3*4, 750/3*4*.6];

        return url.replace(/picture(\?type=[a-z]*)$/, 'picture?width='+d[0]+'&height='+d[1]);
    },
    onClickFollowers(evt) {
        evt.preventDefault();
    },
    onClickFollowing(evt) {
        evt.preventDefault();
    },
    onClickMenu(sectionName, evt) {
        evt.preventDefault();
    },
    view(props) {
        let state = window.store.getState();

        assign(props, {
            id: 'me',
            classNames: 'view',
            class: {
                empty: !state.me.data,
                loading: state.me.isFetching
            },
            'hook-prepatch': this.onPrepatch.bind(this, state)
        });

        if (!state.me.data)
            return <div {...props}>
                <Navbar view="me"/>
                <div classNames="head">
                    <h3 classNames="name">
                        {texts.me.title}
                    </h3>
                </div>
                <div classNames="sections-container"><div/></div>
            </div>;

        let data = state.me.data,
            profilePic = this.getProfilePicUrl(data.profile_image, 'profile'),
            bgPic = this.getProfilePicUrl(data.profile_image, 'bg');

        return <div {...props}>
            <Navbar view="me"/>
            <div classNames="head">
                <u  classNames="profile-pic"
                    style={{backgroundImage: 'url('+profilePic+')'}}/>
                <u  classNames="backdrop"
                    style={{backgroundImage: 'url('+bgPic+')'}}/>
                <h3 classNames="name">
                    {data.name}
                </h3>
                <ul classNames="followings">
                    <li>
                        <a href="#" on-click={this.onClickFollowers}>
                            {data.followed_count} followers
                        </a>
                    </li>
                    <li>
                        <a href="#" on-click={this.onClickFollowing}>
                            {data.followings_count} following
                        </a>
                    </li>
                </ul>
            </div>
            <div classNames="menu">
                <ul>
                    <li class-active={true}>
                        <a href="#" on-click={this.onClickMenu.bind(this, 'activity')}>
                            Activity
                        </a>
                    </li>
                    <li>
                        <a href="#" on-click={this.onClickMenu.bind(this, 'playlists')}>
                            Playlists
                        </a>
                    </li>
                    <li>
                        <a href="#" on-click={this.onClickMenu.bind(this, 'posts')}>
                            Posts
                        </a>
                    </li>
                </ul>
            </div>
            <div classNames="sections-container">
                <div>
                    <div classNames="playlists scrollable">
                    </div>
                </div>
            </div>
        </div>;
    }
};