import { Gather } from "./main/Gather";
import JitsiConference from "./typings/Jitsi/JitsiConference";
import { JitsiConferenceErrors } from "./typings/Jitsi/JitsiConferenceErrors";
import { JitsiConferenceEvents } from "./typings/Jitsi/JitsiConferenceEvents";
import JitsiConnection from "./typings/Jitsi/JitsiConnection";
import { JitsiConnectionEvents } from "./typings/Jitsi/JitsiConnectionEvents";
import JitsiMediaDevices from "./typings/Jitsi/JitsiMediaDevices";
import { JitsiMediaDevicesEvents } from "./typings/Jitsi/JitsiMediaDevicesEvents";
import { JitsiMeetJSType } from "./typings/Jitsi/JitsiMeetJS";
import { JitsiTrackEvents } from "./typings/Jitsi/JitsiTrackEvents";
import JitsiLocalTrack from "./typings/Jitsi/modules/RTC/JitsiLocalTrack";
import JitsiRemoteTrack from "./typings/Jitsi/modules/RTC/JitsiRemoteTrack";

export default async function (): Promise<JitsiConference | any> {
    return new Promise((resolve, reject) => {

        // Get the jitsi object from window (:D)
        const JitsiMeetJS = (window as any)["JitsiMeetJS"] as JitsiMeetJSType;
        const options = {
            hosts: {
                domain: "meet.ewer.rest",
                muc: "conference.meet.ewer.rest", // FIXME: use XEP-0030
            },
            bosh: "https://meet.ewer.rest/http-bind", // FIXME: use xep-0156 for that

            // The name of client node advertised in XEP-0115 'c' stanza
            clientNode: "http://meet.ewer.rest/jitsimeet",
        };

        const confOptions = {
            openBridgeChannel: true
        };

        let connection: JitsiConnection | null = null;
        let isJoined = false;
        let room: JitsiConference;
        let userName = "You";

        let localTracks: Array<JitsiLocalTrack> = [];
        const remoteTracks: Record<string, Array<JitsiRemoteTrack>> = {};

        JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);

        /**
         * Handles local tracks.
         * @param tracks Array with JitsiTrack objects
         */
        function onLocalTracks(tracks: Array<JitsiLocalTrack> | JitsiConferenceErrors) {
            if (!(tracks instanceof Array)) {
                return;
            }
            localTracks = tracks;
            for (let i = 0; i < localTracks.length; i++) {
                localTracks[i].addEventListener(
                    JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED,
                    (audioLevel: number) => console.log(`Audio Level local: ${audioLevel}`));
                localTracks[i].addEventListener(
                    JitsiTrackEvents.TRACK_MUTE_CHANGED,
                    () => console.log("local track muted"));
                localTracks[i].addEventListener(
                    JitsiTrackEvents.LOCAL_TRACK_STOPPED,
                    () => console.log("local track stoped"));
                localTracks[i].addEventListener(
                    JitsiTrackEvents.TRACK_AUDIO_OUTPUT_CHANGED,
                    (deviceId: string) =>
                        console.log(
                            `track audio output device was changed to ${deviceId}`));
                if (localTracks[i].getType() === "video") {
                    const element = document.createElement("video");
                    const name = document.createElement("span");
                    name.innerText = userName;
                    name.contentEditable = "true";
                    name.classList.add("userName");
                    name.addEventListener("input", function (ev: Event) {
                        ev.stopImmediatePropagation();
                        ev.stopPropagation();
                        if (name.innerText.includes("\n")) {
                            name.innerText = name.innerText.trim();
                            name.blur();
                        }
                    }, false);
                    name.addEventListener("blur", function () {
                        if (name.innerText !== "") {
                            userName = name.innerText;
                        }
                        room.setDisplayName(userName);
                    }, false);
                    const wrapper = document.createElement("div");
                    wrapper.classList.add("userVideo");
                    wrapper.appendChild(element);
                    wrapper.appendChild(name);
                    element.autoplay = true;
                    element.id = "localVideo";
                    element.style.borderRadius = "500px";
                    element.style.width = "150px";
                    element.style.height = "150px";
                    element.style.objectFit = "cover";
                    localTracks[i].attach(element);
                    document.getElementById("videos")?.append(wrapper);
                } else {
                    const audioEl = document.createElement("audio");
                    audioEl.muted = true;
                    audioEl.autoplay = true;
                    audioEl.id = `localAudio${i}`;
                    document.getElementById("body")?.append(audioEl);
                }
                if (isJoined) {
                    room.addTrack(localTracks[i]);
                }
            }
        }

        function onRemoteTrackRemoved(track: JitsiRemoteTrack) {
            if (track.isLocal()) {
                return;
            }
            const participant = track.getParticipantId();

            if (track.getType() === "video") {
                const element = document.getElementById(`${participant}video`);
                if (element?.parentElement?.classList.contains("userVideo")) {
                    element.parentElement.remove();
                } else {
                    element?.remove();
                }
            } else {
                const element = document.getElementById(`${participant}audio`);
                element?.remove();
            }
        }

        /**
         * Handles remote tracks
         * @param track JitsiTrack object
         */
        function onRemoteTrack(track: JitsiRemoteTrack) {
            if (track.isLocal()) {
                return;
            }
            const participant = track.getParticipantId();

            track.addEventListener(JitsiTrackEvents.NO_DATA_FROM_SOURCE, (val) => {
                const indexOfTrackToRemove = remoteTracks[participant].indexOf(track);
                if (indexOfTrackToRemove !== -1) {
                    remoteTracks[participant].splice(indexOfTrackToRemove, 1);
                    const element = document.getElementById(`${participant}${track.getType()}`);
                    if (element?.parentElement?.classList.contains("userVideo")) {
                        element.parentElement.remove();
                    } else {
                        element?.remove();
                    }
                }
                console.log(val);
            });

            if (!remoteTracks[participant]) {
                remoteTracks[participant] = [];
            } else if (remoteTracks[participant].find(el => el.getId() === track.getId()) != null) {
                // Skip if already video of user present
                return;
            }

            remoteTracks[participant].push(track);

            track.addEventListener(
                JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED,
                (audioLevel: number) => console.log(`Audio Level remote: ${audioLevel}`));
            track.addEventListener(
                JitsiTrackEvents.TRACK_VIDEOTYPE_CHANGED,
                (ev: "desktop" | "camera") => console.log("Other videotype", ev));
            track.addEventListener(
                JitsiTrackEvents.NO_DATA_FROM_SOURCE,
                (ev) => console.log("NO DATA"));
            track.addEventListener(
                JitsiTrackEvents.LOCAL_TRACK_STOPPED,
                () => console.log("remote track stopped"));
            track.addEventListener(JitsiTrackEvents.TRACK_AUDIO_OUTPUT_CHANGED,
                (deviceId: string) =>
                    console.log(
                        `track audio output device was changed to ${deviceId}`));
            let element;

            if (track.getType() === "video") {
                const wrapper = createVideoTrackForUser(track);
                document.getElementById("videos")?.append(wrapper);
            } else {
                element = document.createElement("audio");
                element.autoplay = true;
                element.id = `${participant}audio`;
                document.body.append(element);
                track.attach(element);
            }
        }

        /**
         * That function is executed when the conference is joined
         */
        function onConferenceJoined() {
            console.log("conference joined!");
            isJoined = true;
            for (let i = 0; i < localTracks.length; i++) {
                room.addTrack(localTracks[i]);
            }
        }

        /**
         *
         * @param id
         */
        function onUserLeft(id: string) {
            if (!remoteTracks[id]) {
                return;
            }
            Gather.instance.removePlayer(id);
            const tracks = remoteTracks[id];

            for (let i = 0; i < tracks.length; i++) {
                if (tracks[i].isVideoTrack()) {
                    removeVideoTrackForUser(tracks[i].getParticipantId());
                } else if (tracks[i].isAudioTrack()) {
                    const elementId = `${id}${tracks[i].getType()}`;
                    const element = document.getElementById(elementId);
                    if (element == null) {
                        continue;
                    }
                    element.remove();
                    tracks[i].detach(element);
                }
            }
        }

        /**
         * That function is called when connection is established successfully
         */
        function onConnectionSuccess() {
            if (connection == null) {
                return;
            }
            room = connection.initJitsiConference("gather", confOptions);
            (window as any)["room"] = room;
            room.on(JitsiConferenceEvents.TRACK_ADDED, onRemoteTrack);
            room.on(JitsiConferenceEvents.TRACK_REMOVED, onRemoteTrackRemoved);
            room.on(JitsiConferenceEvents.CONFERENCE_JOINED, onConferenceJoined);
            room.on(JitsiConferenceEvents.USER_JOINED, id => {
                Gather.instance.addPlayer(id);
                remoteTracks[id] = [];
            });
            room.on(JitsiConferenceEvents.USER_LEFT, onUserLeft);
            room.on(JitsiConferenceEvents.TRACK_MUTE_CHANGED, (track: JitsiRemoteTrack) => {
                if (track.isVideoTrack() && track.isMuted()) {
                    pauseVideoTrackForUser(track.getParticipantId());
                } else if (track.isVideoTrack()) {
                    resumeVideoTrackForUser(track);
                }
                console.log(`${track.getType()} - ${track.isMuted()}`);
            });
            room.on(
                JitsiConferenceEvents.DISPLAY_NAME_CHANGED,
                (userID: string, displayName: string) => {
                    const parent = document.getElementById(`${userID}video`)?.parentElement;
                    const textElement = parent?.getElementsByClassName("userName")[0] as HTMLSpanElement;
                    if (textElement) {
                        textElement.innerText = displayName;
                    }
                });
            room.addCommandListener("playerUpdate", (values: any) => {
                const parsedObj = JSON.parse(values.value);
                if (parsedObj.id !== room.myUserId()) {
                    console.log("Updatte");
                    Gather.instance.updatePlayer(parsedObj);
                }
            });
            room.on(
                JitsiConferenceEvents.TRACK_AUDIO_LEVEL_CHANGED,
                (userID: string, audioLevel: number) => console.log(`${userID} - ${audioLevel}`));
            room.on(
                JitsiConferenceEvents.PHONE_NUMBER_CHANGED,
                () => console.log(`${room.getPhoneNumber()} - ${room.getPhonePin()}`));
            console.log("JOINING NOW");
            room.join();
            resolve(room);
        }

        function createVideoTrackForUser(track: JitsiRemoteTrack | JitsiLocalTrack): HTMLDivElement {
            const nameOfParticipant = room.getParticipantById(track.getParticipantId())?.getDisplayName() ?? "anonymous";
            const element = document.createElement("video");
            const name = document.createElement("span");
            name.classList.add("userName");
            name.innerText = nameOfParticipant;
            const wrapper = document.createElement("div");
            wrapper.classList.add("userVideo");
            wrapper.appendChild(element);
            wrapper.appendChild(name);
            element.autoplay = true;
            element.id = `${track.getParticipantId()}video`;
            element.style.borderRadius = "500px";
            element.style.width = "150px";
            element.style.height = "150px";
            element.style.objectFit = "cover";
            element.poster = "https://www.dovercourt.org/wp-content/uploads/2019/11/610-6104451_image-placeholder-png-user-profile-placeholder-image-png.jpg";
            track.attach(element);
            return wrapper;
        }
    
        function removeVideoTrackForUser(userID: string): void {
            const vidEl = document.getElementById(`${userID}video`) as HTMLVideoElement;
            vidEl?.parentElement?.remove();
        }
    
        function pauseVideoTrackForUser(userID: string): void {
            const nameOfParticipant = room.getParticipantById(userID)?.getDisplayName() ?? "anonymous";
            const vidEl = document.getElementById(`${userID}video`) as HTMLVideoElement;
            if (vidEl == null) {
                return;
            }
            const name = document.createElement("span");
            name.classList.add("userName");
            name.innerText = nameOfParticipant;
            const wrapper = document.createElement("div");
            wrapper.classList.add("userVideo");
            wrapper.appendChild(name);
            const imEl = document.createElement("img");
            imEl.src = "https://www.dovercourt.org/wp-content/uploads/2019/11/610-6104451_image-placeholder-png-user-profile-placeholder-image-png.jpg";
            imEl.id = `${userID}placeholder`;
            imEl.style.borderRadius = "500px";
            imEl.style.width = "150px";
            imEl.style.height = "150px";
            imEl.style.objectFit = "cover";
            wrapper.appendChild(imEl);
            wrapper.appendChild(name);
            vidEl.parentElement?.replaceWith(wrapper);
            vidEl.srcObject = null;
        }
    
        function resumeVideoTrackForUser(track: JitsiRemoteTrack | JitsiLocalTrack): void {
            const newWrapper = createVideoTrackForUser(track);
            document.getElementById(`${track.getParticipantId()}placeholder`)?.replaceWith(newWrapper);
        }
    
        /**
         * This function is called when the connection fail.
         */
        function onConnectionFailed() {
            console.error("Connection Failed!");
        }
    
        /**
         * This function is called when the connection fail.
         */
        function onDeviceListChanged(devices: typeof JitsiMediaDevices) {
            console.info("current devices", devices);
        }
    
        /**
         * This function is called when we disconnect.
         */
        function disconnect() {
            if (connection == null) {
                return;
            }
            console.log("disconnect!");
            connection.removeEventListener(
                JitsiConnectionEvents.CONNECTION_ESTABLISHED,
                onConnectionSuccess);
            connection.removeEventListener(
                JitsiConnectionEvents.CONNECTION_FAILED,
                onConnectionFailed);
            connection.removeEventListener(
                JitsiConnectionEvents.CONNECTION_DISCONNECTED,
                disconnect);
        }
    
        /**
         *
         */
        async function unload(): Promise<void> {
            for (let i = 0; i < localTracks.length; i++) {
                localTracks[i].dispose();
            }
            console.log("LEAVING AND SHIT");
            await room.leave();
            connection?.disconnect();
        }
    
        /*
        let isVideo = true;
        function switchVideo() {
            isVideo = !isVideo;
            if (localTracks[1]) {
                localTracks[1].dispose();
                localTracks.pop();
            }
            JitsiMeetJS.createLocalTracks({
                devices: [ isVideo ? "video" : "desktop" ]
            })
                .then(tracks => {
                    if (tracks instanceof Array) {
                        localTracks.push(tracks[0]);
                        localTracks[1].addEventListener(
                            JitsiTrackEvents.TRACK_MUTE_CHANGED,
                            () => console.log("local track muted"));
                        localTracks[1].addEventListener(
                            JitsiTrackEvents.LOCAL_TRACK_STOPPED,
                            () => console.log("local track stoped"));
                        const element = document.getElementById("#localVideo1");
                        if (element != null) {
                            localTracks[1].attach(element);
                        }
                        room.addTrack(localTracks[1]);
                    }
                })
                .catch(error => console.log(error));
        }
        function changeAudioOutput(selected: any) {
            JitsiMeetJS.mediaDevices.setAudioOutputDevice(selected.value);
        } */
    
        window.addEventListener("beforeunload", unload);
        window.addEventListener("unload", unload);
    
        // JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);
        const initOptions = {
            disableAudioLevels: true
        };
    
        JitsiMeetJS.init(initOptions);
    
        connection = new JitsiMeetJS.JitsiConnection(undefined, undefined, options);
    
        connection.addEventListener(
            JitsiConnectionEvents.CONNECTION_ESTABLISHED,
            onConnectionSuccess);
        connection.addEventListener(
            JitsiConnectionEvents.CONNECTION_FAILED,
            onConnectionFailed);
        connection.addEventListener(
            JitsiConnectionEvents.CONNECTION_DISCONNECTED,
            disconnect);
    
        JitsiMeetJS.mediaDevices.addEventListener(
            JitsiMediaDevicesEvents.DEVICE_LIST_CHANGED,
            onDeviceListChanged);
    
        connection?.connect(undefined);
    
        JitsiMeetJS.createLocalTracks({ devices: ["audio", "video"] })
            .then(onLocalTracks)
            .catch(error => {
                throw error;
            });
    
        if (JitsiMeetJS.mediaDevices.isDeviceChangeAvailable("output")) {
            JitsiMeetJS.mediaDevices.enumerateDevices(devices => {
                const audioOutputDevices
                    = devices.filter(d => d.kind === "audiooutput");
    
                if (audioOutputDevices.length > 1) {
                    const outputSelector = document.getElementById("audioOutputSelect");
                    if (outputSelector == null) {
                        return;
                    }
                    outputSelector.innerHTML = audioOutputDevices
                        .map(
                            d =>
                                `<option value="${d.deviceId}">${d.label}</option>`)
                        .join("\n");
    
                    // $("#audioOutputSelectWrapper").show();
                }
            });
        }
    });
}
