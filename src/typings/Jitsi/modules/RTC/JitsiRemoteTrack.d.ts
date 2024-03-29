import JitsiTrack from"./JitsiTrack";
import RTC from"./RTC";
import JitsiConference from"../../JitsiConference";
import { JitsiTrackEvents } from "../../JitsiTrackEvents";

export default class JitsiRemoteTrack extends JitsiTrack {
    constructor(rtc: RTC, conference: JitsiConference, ownerEndpointId: string, stream: MediaStream, track: MediaStreamTrack, mediaType: any, videoType: any, ssrc: number, muted: boolean, isP2P: boolean);
    addEventListener(event: JitsiTrackEvents, callback: (val: any) => void): void;
    setMute: ( value: boolean ) => void;
    isMuted: () => boolean;
    getParticipantId: () => string;
    isLocal: () => false;
    getSSRC: () => number;
    toString: () => string;

    containerEvents: ["abort","canplay","canplaythrough","emptied","ended","error","loadeddata",
    "loadedmetadata","loadstart","pause","play","playing","ratechange","stalled","suspend",
    "waiting"]; // TODO: this might be private
}