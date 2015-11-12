/** @jsx html */
'use strict';

import {html}           from 'snabbdom-jsx';
import assign           from 'object-assign';
import texts            from '../texts';
import {getRef}         from '../utils';
import {setView}        from '../actions/creators/view';
import {togglePlayer}   from '../actions/creators/player';
import {visualize}      from '../actions/creators/player';
import {startPlayback}  from '../actions/creators/player';
import {pausePlayback}  from '../actions/creators/player';
import Navbar           from './Navbar';

Object.defineProperty(HTMLMediaElement.prototype, 'isPlaying', {
    get() {
        return !!(/*this.currentTime > 0 &&*/
                 !this.paused &&
                 !this.ended &&
                  this.readyState > 2);
    }
});

/*function AudioSource(audio, fftSize) {
    if (!window.AudioContext)
        return null;

    var _ = this,
        audioCtx = new AudioContext(), // new (window.AudioContext || window.webkitAudioContext)
        source = audioCtx.createMediaElementSource(audio);

    _.analyser = audioCtx.createAnalyser();
    _.analyser.minDecibels = -90;
    _.analyser.maxDecibels = 30;
    _.analyser.smoothingTimeConstant = 0.4;
    _.analyser.fftSize = fftSize;
    source.connect(_.analyser);
    _.analyser.connect(audioCtx.destination);
    _.streamData = new Uint8Array(fftSize/2);
}*/

export default {
    closePlayer(state, evt) {
        evt.preventDefault();
        window.store.dispatch(togglePlayer());
        window.store.dispatch(setView(state.view.previous));
    },
    onInsertPlayer(vnode) {
        this.player = vnode;
        this.playerWidth();
        window.addEventListener('resize', this.playerWidth.bind(this), true);
    },
    playerWidth() {
        requestAnimationFrame(() => this.width = this.player.elm.offsetWidth);
    },
    onPostPatch() {
        if (this.audio && !this.audio.isPlaying && window.store.getState().player.isPlaying)
            this.audio.play();
    },
    onInsertAudio(vnode) {
        this.audio = vnode.elm;
        // this.audioSource = new AudioSource(this.audio, 64);

        this.audio.addEventListener('error', evt => console.log('audio error:', evt), true);
        this.audio.addEventListener('canplay', this.onCanplay.bind(this), true);
        this.audio.addEventListener('playing', this.onPlaybackStarted.bind(this), true);
        this.audio.addEventListener('pause', this.onPlaybackPaused.bind(this), true);
    },
    onCanplay(evt) {
        if (!this.audio.isPlaying)
            this.audio.play();
    },
    onPlaybackStarted() {
        window.store.dispatch(startPlayback());
        this.visualFeedback();
    },
    onPlaybackPaused() {
        window.store.dispatch(pausePlayback());
    },
    visualFeedback() {
        let data = {};

        /*if (this.audioSource) {
            let eqData = [], i, j = 0;

            this.audioSource.analyser.getByteFrequencyData(this.audioSource.streamData);

            // collect freq data for first 12 channels out of 32
            // (that is the lower end of the spectrum)
            for (i = 0; i < 12; i++) {
                let val = this.audioSource.streamData[i] / 255;

                // cahce the average of channel 1 and 2, 3 and 4, ...
                // since we have 6 bars in the graphic eq we want
                // the length of eqData to be 6
                eqData[j] = typeof eqData[j] === 'undefined'
                            ? val
                            : (eqData[j] + val) / (i % 2 + 1);

                if (i != 0 && i % 2 == 0)
                    j++;
            }
            // console.log('eqData:', eqData);

            data.eq = eqData;
        }*/

        window.store.dispatch(visualize(assign(data, {
            elapsed: this.audio.currentTime,
            duration: this.audio.duration
        })));

        if (this.audio.isPlaying) {
            setTimeout(this.visualFeedback.bind(this), 40);
            // requestAnimationFrame(this.visualFeedback.bind(this));
        }
    },
    fmtTime(secs) {
        let f = Math.floor;
        return secs >= 3600
                ? f(secs / 3600)+':'+f((secs % 3600) / 60).leadZero()+':'+f((secs % 3600) % 60).leadZero()
                : f(secs / 60)+':'+f(secs % 60).leadZero();
    },
    view(props) {
        let state = window.store.getState(),
            p = state.player,
            track = p.track,
            idx = p.idx,
            audioProps = assign({
                'hook-insert': this.onInsertAudio.bind(this)
            }, track && {
                controls: true,
                src: location.protocol+'//'+location.host+'/audio/'+
                    (idx % 2
                        ? '15 Let It All Hang Out.mp3'
                        : "14 Beethoven's Piano Sonata No. 1 In F Minor.mp3"),
                type: 'audio/mpeg'
            });

        return <div {...{
                    id: 'player',
                    'hook-insert': this.onInsertPlayer.bind(this),
                    'hook-postpatch': this.onPostPatch.bind(this),
                    class: {
                        show: p.isOpen,
                        hide: p.isClosed
                    }}}>
                    <Navbar view="player" closePlayer={this.closePlayer.bind(this, state)}/>
                    {track ?
                    <div class-loved={track.is_liked}>
                        <div classNames="cover"
                            style={{backgroundImage: 'url('+track.picture+')'}}>
                            <div classNames="overlay"/>
                        </div>
                        <div classNames="progress">
                            <div classNames="bar">
                                <b style={{transform: 'scaleX('+p.progress+')'}}/>
                                <i style={{transform: 'translateX('+p.progress * this.width+'px)'}}/>
                            </div>
                        </div>
                        <div classNames="progress-times">
                            <time classNames="elapsed">{this.fmtTime(p.elapsed)}</time>
                            <time classNames="duration">{this.fmtTime(p.duration)}</time>
                        </div>
                        <div classNames="progress-bar-base"/>
                        <div classNames="meta">
                            <h2 classNames="title">
                                <span>{track.name}</span>
                            </h2>
                        </div>
                        <audio {...audioProps}></audio>
                        <div classNames="backdrop"
                            style={{backgroundImage: 'url('+track.picture+')'}}/>
                    </div> : ''}
                </div>;
    }
};