import JitsiConference from "./JitsiConference";
import { JitsiConnectionEvents } from "./JitsiConnectionEvents";

export type JitsiConferenceOptions = {
    serviceUrl: string;
    /** @deprecated use serviceUrl instead */
    bosh?: string;
    hosts: {
        domain: string;
        muc: string;
        anonymousdomain?: string;
    };
    enableLipSync?: boolean;
    clientNode?: string;
    xmppPing?: {
        /** @default 10000 = 10s */
        interval: number;
        /** @default 5000 = 5s */
        timeout: number;
        /** @default 2 */
        threshold: number;
    };
    /** @default 1 minute */
    websocketKeepAlive?: number;
    websocketKeepAliveUrl?: string;
};

export type JitsiConferenceInitOptions = {
    openBridgeChannel?: "datachannel" | "websocket" | true | undefined | false;
    recordingType?: any; // TODO
    callStatsID?: string;
    callStatsSecret?: string;
    enableTalkWhileMuted?: boolean;
    ignoreStartMuted?: boolean;
    startSilent?: boolean;
    confID?: string;
    siteID?: string;
    statisticsId?: string;
    statisticsDisplayName?: string;
    focusUserJid?: string;
    enableNoAudioDetection?: boolean;
    enableNoisyMicDetection?: boolean;
    enableRemb?: boolean;
    enableTcc?: boolean;
    useRoomAsSharedDocumentName?: boolean;
    channelLastN?: string;
    startBitrate?: number;
    stereo?: boolean;
    forceJVB121Ratio?: number;
    hiddenDomain?: string;
    startAudioMuted?: boolean;
    startVideoMuted?: boolean;
    enableLayerSuspension?: boolean;
    deploymentInfo?: {
        shard?: string;
        userRegion?: string;
    };
    p2p?: {
        /** enables or disable peer-to-peer connection, if disabled all media will be routed through the Jitsi Videobridge. */
        enabled?: boolean;
        /** list of STUN servers e.g. { urls: 'stun:meet-jit-si-turnrelay.jitsi.net:443' } */
        stunServers?: any;
        /** a delay given in seconds, before the conference switches back to P2P, after the 3rd participant has left the room. */
        backToP2PDelay?: number;
        /** the mime type of the code that should not be negotiated on the peer-connection. */
        disabledCodec?: any;
        /** the mime type of the codec that needs to be made the preferred codec for the connection. */
        preferredCodec?: any;
    };
    rttMonitor?: {
        enabled?: boolean;
        initialDelay?: number;
        getStatsInterval?: number;
        analyticsInterval?: number;
        stunServers?: any;
    };
    e2eping?: {
        pingInterval?: number;
    };
    abTesting?: {
        enableSuspendVideoTest?: boolean;
        testing?: boolean;
        capScreenshareBitrate?: number;
        p2pTestMode?: boolean;
        octo?: {
            probability?: number;
        }
    };
};

export default class JitsiConnection {
  constructor( appID?: string, token?: unknown, options?: JitsiConferenceOptions );
  connect: ( options: unknown ) => void; // TODO:
  attach: ( options: unknown ) => void; // TODO:
  disconnect: ( ...args: unknown[] ) => Promise<unknown>; // TODO:
  getJid: () => string;
  setToken: ( token: unknown ) => void;
  initJitsiConference: ( name: string, options: JitsiConferenceInitOptions ) => JitsiConference;
  addEventListener: ( event: JitsiConnectionEvents, listener: unknown ) => void; // TODO:
  removeEventListener: ( event: JitsiConnectionEvents, listener: unknown ) => void; // TODO:
  getConnectionTimes: () => number; // TODO: check
  addFeature: ( feature: string, submit?: boolean ) => void;
  removeFeature: ( feature: string, submit?: boolean ) => void;
  getLogs: () => unknown | { metadata: { time: Date, url: string, ua: string, xmpp?: unknown } }; // TODO:
}
