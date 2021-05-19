import JitsiTrack from "./typings/Jitsi/modules/RTC/JitsiTrack";
import AudioMixer from "./typings/Jitsi/modules/webaudio/AudioMixer";

/**
 * Class Implementing the effect interface expected by a JitsiLocalTrack.
 * The AudioMixerEffect, as the name implies, mixes two JitsiLocalTracks containing a audio track. First track is
 * provided at the moment of creation, second is provided through the effect interface.
 */
 export class AudioMixerEffect {
    /**
     * JitsiLocalTrack that is going to be mixed into the track that uses this effect.
     */
    _mixAudio: MediaStream;

    /**
     * MediaStream resulted from mixing.
     */
    _mixedMediaStream?: MediaStream;

    /**
     * MediaStreamTrack obtained from mixed stream.
     */
    _mixedMediaTrack?: MediaStreamTrack;

    /**
     * Original MediaStream from the JitsiLocalTrack that uses this effect.
     */
    _originalStream?: MediaStream;

    /**
     * MediaStreamTrack obtained from the original MediaStream.
     */
    _originalTrack?: MediaStreamTrack;

    /**
     * lib-jitsi-meet AudioMixer.
     */
    _audioMixer?: AudioMixer;

    /**
     * Creates AudioMixerEffect.
     *
     * @param {JitsiLocalTrack} mixAudio - JitsiLocalTrack which will be mixed with the original track.
     */
    constructor(mixAudio: MediaStream) {
        this._mixAudio = mixAudio;
    }

    /**
     * Checks if the JitsiLocalTrack supports this effect.
     *
     * @param {JitsiLocalTrack} sourceLocalTrack - Track to which the effect will be applied.
     * @returns {boolean} - Returns true if this effect can run on the specified track, false otherwise.
     */
    public isEnabled(sourceLocalTrack: JitsiTrack): boolean {
        return sourceLocalTrack.isAudioTrack();
    }

    /**
     * Effect interface called by source JitsiLocalTrack, At this point a WebAudio ChannelMergerNode is created
     * and and the two associated MediaStreams are connected to it; the resulting mixed MediaStream is returned.
     *
     * @param {MediaStream} audioStream - Audio stream which will be mixed with _mixAudio.
     * @returns {MediaStream} - MediaStream containing both audio tracks mixed together.
     */
    public startEffect(audioStream: MediaStream): MediaStream {
        this._originalStream = audioStream;
        this._originalTrack = audioStream.getTracks()[0];

        this._originalStream.addTrack(this._mixAudio.getAudioTracks()[0]);

        /*this._audioMixer = JitsiMeetJS.createAudioMixer();
        this._audioMixer.addMediaStream(this._mixAudio);
        this._audioMixer.addMediaStream(this._originalStream);

        this._mixedMediaStream = this._audioMixer.start();
        console.log(this._mixedMediaStream.getTracks());
        this._mixedMediaTrack = this._mixedMediaStream.getTracks()[0];*/

        // Sync the resulting mixed track enabled state with that of the track using the effect.
        this.setMuted(!this._originalTrack.enabled);
        this._originalTrack.enabled = true;

        return this._originalStream;
    }

    /**
     * Reset the AudioMixer stopping it in the process.
     *
     * @returns {void}
     */
    public stopEffect(): void {
         if (this._mixedMediaTrack && this._originalTrack) {
             // Match state of the original track with that of the mixer track, not doing so can
             // result in an inconsistent state e.g. redux state is muted yet track is enabled.
             this._originalTrack.enabled = this._mixedMediaTrack.enabled;
        }
        this._audioMixer?.reset();
    }

    /**
     * Change the muted state of the effect.
     *
     * @param {boolean} muted - Should effect be muted or not.
     * @returns {void}
     */
    public setMuted(muted: boolean): void {
         if (this._mixedMediaTrack) {
             this._mixedMediaTrack.enabled = !muted;
        }
    }

    /**
     * Check whether or not this effect is muted.
     *
     * @returns {boolean}
     */
    public isMuted(): boolean {
        return !this._mixedMediaTrack?.enabled;
    }
}
