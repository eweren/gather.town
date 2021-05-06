import { HoverOver } from "./customElements/HoverOver";
import { isDev } from "./engine/util/env";
import { Gather } from "./main/Gather";
import JitsiConference from "./typings/Jitsi/JitsiConference";
import { JitsiConferenceErrors } from "./typings/Jitsi/JitsiConferenceErrors";
import { JitsiConferenceEvents } from "./typings/Jitsi/JitsiConferenceEvents";
import JitsiConnection, { JitsiConferenceInitOptions, JitsiConferenceOptions } from "./typings/Jitsi/JitsiConnection";
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
        const options: JitsiConferenceOptions = {
            hosts: {
                domain: "meet.ewer.rest",
                muc: "conference.meet.ewer.rest"
            },
            serviceUrl: "https://meet.ewer.rest/http-bind",
            clientNode: "http://meet.ewer.rest/jitsimeet",
        };

        const confOptions: JitsiConferenceInitOptions = {
            openBridgeChannel: true,
            p2p: {
                enabled: false
            }
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
            console.log(localTracks);
            for (let i = 0; i < localTracks.length; i++) {
                localTracks[i].addEventListener(
                    JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED,
                    (audioLevel: number) => console.log(`Audio Level local: ${audioLevel}`));
                localTracks[i].addEventListener(
                    JitsiTrackEvents.TRACK_MUTE_CHANGED,
                    () => console.log("local track muted"));
                localTracks[i].addEventListener(
                    JitsiTrackEvents.LOCAL_TRACK_STOPPED,
                    () => console.log("local track stopped"));
                localTracks[i].addEventListener(
                    JitsiTrackEvents.TRACK_AUDIO_OUTPUT_CHANGED,
                    (deviceId: string) =>
                        console.log(
                            `track audio output device was changed to ${deviceId}`));
                if (localTracks[i].getType() === "video") {
                    const localVideo = document.getElementById("localVideo") ?? createLocalVideoElement();
                    if (localVideo) {
                        localTracks[i].attach(localVideo);
                    }
                    if (isJoined) {
                        if (room.getLocalVideoTrack() != null) {
                            room.replaceTrack(room.getLocalVideoTrack()!, localTracks[i]);
                        } else {
                            room.addTrack(localTracks[i]);
                        }
                    }
                } else {
                    const localAudio = document.getElementById("localAudi") ?? createLocalAudio();
                    if (localAudio) {
                        localTracks[i].attach(localAudio);
                    }
                    if (isJoined) {
                        if (room.getLocalAudioTrack() != null) {
                            room.replaceTrack(room.getLocalAudioTrack()!, localTracks[i]);
                        } else {
                            room.addTrack(localTracks[i]);
                        }
                    }
                }
            }
        }

        function createLocalAudio(): HTMLAudioElement {
            const audioEl = document.createElement("audio");
            audioEl.muted = true;
            audioEl.autoplay = true;
            audioEl.id = "localAudio";
            document.getElementById("body")?.append(audioEl);
            return audioEl;
        }

        function createLocalVideoElement(): HTMLVideoElement {
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
            wrapper.style.position = "relative";
            const hoverOver = new HoverOver();
            hoverOver.addButton("🎙️", (val) => {
                if (val) {
                    room.getLocalAudioTrack()?.mute();
                } else {
                    room.getLocalAudioTrack()?.unmute();
                }
            }, "❌", "Mute", "Unmute");
            hoverOver.addButton("📹", (val) => {
                if (val) {
                    room.getLocalVideoTrack()?.mute();
                } else {
                    room.getLocalVideoTrack()?.unmute();
                }
            }, "❌", "Hide video", "Show video");
            hoverOver.style.position = "absolute";
            hoverOver.style.bottom = "2em";
            hoverOver.style.zIndex = "1008";
            wrapper.classList.add("userVideo");
            wrapper.appendChild(element);
            wrapper.appendChild(hoverOver);
            wrapper.appendChild(name);
            element.autoplay = true;
            element.id = "localVideo";
            element.style.borderRadius = "500px";
            element.style.width = "150px";
            element.style.height = "150px";
            element.style.objectFit = "cover";
            element.poster = "https://www.dovercourt.org/wp-content/uploads/2019/11/610-6104451_image-placeholder-png-user-profile-placeholder-image-png.jpg";
            document.getElementById("videos")?.append(wrapper);
            return element;
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
            });

            if (!remoteTracks[participant]) {
                remoteTracks[participant] = [];
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
                    console.log(`track audio output device was changed to ${deviceId}`));
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
            room = connection.initJitsiConference(isDev() ?  "mylittleconference" : "gather", confOptions);
            (window as any)["room"] = room;
            room.on(JitsiConferenceEvents.TRACK_ADDED, onRemoteTrack);
            room.on(JitsiConferenceEvents.TRACK_REMOVED, onRemoteTrackRemoved);
            room.on(JitsiConferenceEvents.CONFERENCE_JOINED, onConferenceJoined);
            room.on(JitsiConferenceEvents.USER_JOINED, id => {
                setTimeout(() => {
                    Gather.instance.sendCommand("playerUpdate", { spriteIndex: Gather.instance.getPlayer().spriteIndex });
                }, 100);
                remoteTracks[id] = [];
            });
            room.on(JitsiConferenceEvents.MESSAGE_RECEIVED, handleMessageReceived);
            room.on(JitsiConferenceEvents.PRIVATE_MESSAGE_RECEIVED, handleMessageReceived);
            room.on(JitsiConferenceEvents.USER_LEFT, onUserLeft);
            room.on(JitsiConferenceEvents.TRACK_MUTE_CHANGED, (track: JitsiRemoteTrack) => {
                if (track.isLocal()) {
                    return;
                }
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
                    Gather.instance.updatePlayer(parsedObj);
                }
            });
            room.addCommandListener("presentationUpdate", (values: any) => {
                const parsedObj = JSON.parse(values.value);
                if (parsedObj.id !== room.myUserId()) {
                    Gather.instance.handleOtherPlayerPresentationUpdate(parsedObj);
                }
            });
            room.on(
                JitsiConferenceEvents.TRACK_AUDIO_LEVEL_CHANGED,
                (userID: string, audioLevel: number) => console.log(`${userID} - ${audioLevel}`));
            room.on(
                JitsiConferenceEvents.PHONE_NUMBER_CHANGED,
                () => console.log(`${room.getPhoneNumber()} - ${room.getPhonePin()}`));
            room.join();
            resolve(room);
        }

        function handleMessageReceived(participantId: string, text: string, ts: number): void {
            if (participantId === room.myUserId()) {
                Gather.instance.getPlayer()?.say(text, 5);
                return;
            }
            const player = Gather.instance.getOtherPlayerById(participantId);
            player?.say(text, 5);
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
            document.getElementById(`${track.getParticipantId()}placeholder`)?.parentElement?.replaceWith(newWrapper);
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
            await room.leave();
            connection?.disconnect();
        }

        function switchVideo() {
            const previousTrack = localTracks.pop();
            const isVideo = !!room.getLocalVideoTrack()?.isScreenSharing();
            JitsiMeetJS.createLocalTracks({
                devices: [ isVideo ? "video" : "desktop" ]
            })
                .then(tracks => {
                    if (tracks instanceof Array) {
                        const element = document.getElementById("localVideo");
                        localTracks.push(tracks[0]);
                        localTracks[1].addEventListener(
                            JitsiTrackEvents.TRACK_MUTE_CHANGED,
                            () => console.log("local track muted"));
                        localTracks[1].addEventListener(
                            JitsiTrackEvents.LOCAL_TRACK_STOPPED, () => {
                                if (localTracks[1]) {
                                    const trackToDispose = localTracks.pop();
                                    room.removeTrack(trackToDispose!);
                                }
                                if (previousTrack) {
                                    localTracks.push(previousTrack);
                                    if (element) {
                                        previousTrack?.attach(element);
                                    }
                                    if (room.getLocalVideoTrack()) {
                                        room.replaceTrack(room.getLocalVideoTrack()!, previousTrack);
                                    } else {
                                        room.addTrack(previousTrack);
                                    }
                                }
                            });
                        if (element != null) {
                            localTracks[1].attach(element);
                        }

                        if (previousTrack) {
                            room.replaceTrack(previousTrack, localTracks[1]);
                        } else {
                            room.addTrack(localTracks[1]);
                        }
                    }
                })
                .catch(error => console.log(error));
        }
        function changeAudioOutput(deviceId: string) {
            JitsiMeetJS.mediaDevices.setAudioOutputDevice(deviceId);
        }
        function changeAudioInput(deviceId: string) {

            JitsiMeetJS.createLocalTracks({ devices: ["audio", "video"], micDeviceId: deviceId })
                .then(onLocalTracks)
                .catch(error => {
                    throw error;
                });
            // TODO: fix change of inputDevices
            // JitsiMeetJS.mediaDevices.setAudioOutputDevice(deviceId);
        }

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
            setTimeout(() => {
                const optionsButton = document.getElementById("options");
                const optionsContainer = document.getElementById("options-container");
                if (optionsButton == null || optionsContainer == null) {
                    return;
                }
                optionsButton.addEventListener("click", (ev) => {
                    ev.stopImmediatePropagation();
                    optionsContainer.style.display = optionsContainer.style.display === "flex" ? "none" : "flex";
                    optionsButton.innerText = optionsContainer.style.display === "flex" ? "Options ↥" : "Options ↧";
                });
                optionsContainer.style.display = "none";
                JitsiMeetJS.mediaDevices.enumerateDevices(devices => {
                    const audioOutputDevices
                        = devices.filter(d => d.kind === "audiooutput");
                    const audioInputDevices
                        = devices.filter(d => d.kind === "audioinput");

                    if (audioOutputDevices.length > 1) {
                        const selectAudioOutput = document.createElement("select");
                        selectAudioOutput.title = "Select audio output device";
                        selectAudioOutput.id = "audioOutputSelect";
                        optionsContainer.appendChild(selectAudioOutput);
                        const options = audioOutputDevices.map(d => {
                            const option = document.createElement("option");
                            option.value = d.deviceId;
                            option.innerText = d.label;
                            return option;
                        });
                        options.forEach(o => selectAudioOutput.appendChild(o));
                        selectAudioOutput.addEventListener("input", (ev) => {
                            changeAudioOutput((ev.target as any).value);
                        });
                    }
                    if (audioInputDevices.length > 1) {
                        const selectAudioInput = document.createElement("select");
                        selectAudioInput.title = "Select audio input device";
                        selectAudioInput.id = "audioInputSelect";
                        optionsContainer.appendChild(selectAudioInput);
                        const options = audioInputDevices.map(d => {
                            const option = document.createElement("option");
                            option.value = d.deviceId;
                            option.innerText = d.label;
                            return option;
                        });
                        options.forEach(o => selectAudioInput.appendChild(o));
                        selectAudioInput.addEventListener("input", (ev) => {
                            changeAudioInput((ev.target as any).value);
                        });
                    }

                    const selectVideoBtn = document.createElement("button");

                    selectVideoBtn.id = "shareScreenBtn";
                    selectVideoBtn.innerText = "Share screen 🖥️";
                    optionsContainer.appendChild(selectVideoBtn);
                    selectVideoBtn.addEventListener("click", (ev) => {
                        switchVideo();
                    });
                });
            }, 1000);
        }
    });
}
