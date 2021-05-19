import { UserVideoElement } from "./customElements/UserVideoElement";
import { isDev } from "./engine/util/env";
import { sleep } from "./engine/util/time";
import { AudioMixerEffect as MusicSource } from "./JitsiMixer";
import { Gather } from "./main/Gather";
import { IFrameNode } from "./main/nodes/IFrameNode";
import { SpeakerNode } from "./main/nodes/SpeakerNode";
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

        let localTracks: Array<JitsiLocalTrack> = [];
        const remoteTracks: Record<string, Array<JitsiRemoteTrack>> = {};

        JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);

        /**
         * Handles local tracks.
         * @param tracks Array with JitsiTrack objects
         */
        async function onLocalTracks(tracks: Array<JitsiLocalTrack> | JitsiConferenceErrors) {
            if (!(tracks instanceof Array)) {
                return;
            }
            localTracks = tracks;
            for (let i = 0; i < localTracks.length; i++) {
                if (localTracks[i].getType() === "video") {
                    const localVideo = (document.getElementById("localUserVideo") as UserVideoElement ?? await createLocalVideoElement());
                    if (localVideo) {
                        localVideo.setTrack(localTracks[i]);
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

        async function createLocalVideoElement(): Promise<UserVideoElement> {
            await sleep(1000);
            const videoElement = new UserVideoElement("You", room);
            document.getElementById("videos")?.append(videoElement);
            return videoElement;
        }

        function onRemoteTrackRemoved(track: JitsiRemoteTrack) {
            if (track.isLocal()) {
                return;
            }
            const participant = track.getParticipantId();

            if (track.getType() === "video") {
                removeVideoTrackForUser(participant);
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

            if (track.getOriginalStream().getAudioTracks().length > 1) {
                track.getOriginalStream().getAudioTracks().forEach(t => {
                    console.log("MUSIC IS SHARED");
                    if (document.getElementById(`${participant + t.id}audio`) == null) {
                        const element = document.createElement("audio");
                        element.autoplay = true;
                        element.id = `${participant + t.id}audio`;
                        document.body.append(element);
                        const stream = new MediaStream([t]);
                        element.srcObject = stream;
                    }
                });
            } else if (track.getOriginalStream().getAudioTracks().length === 1) {
                if (document.getElementById(`${participant + track.getOriginalStream().getAudioTracks()[0].id}audio`) == null) {
                    const element = document.createElement("audio");
                    element.autoplay = true;
                    element.id = `${participant + track.getOriginalStream().getAudioTracks()[0].id}audio`;
                    document.body.append(element);
                    element.srcObject = track.getOriginalStream();
                }
            }

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

            track.getOriginalStream().onremovetrack = (ev) => {
                console.log(ev);
                if (ev.track) {
                    console.log(document.getElementById(`${participant + ev.track.id}audio`));
                    document.getElementById(`${participant + ev.track.id}audio`)?.remove();
                }
            };

            if (!remoteTracks[participant]) {
                remoteTracks[participant] = [];
            }

            remoteTracks[participant].push(track);

            track.addEventListener(
                JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED,
                (audioLevel: number) => {
                    console.log(`Audio Level remote: ${audioLevel}`);
                });
            track.addEventListener(
                JitsiTrackEvents.TRACK_VIDEOTYPE_CHANGED,
                (ev: "desktop" | "camera") => {
                    console.log("Other videotype", ev);
                });
            track.addEventListener(
                JitsiTrackEvents.NO_DATA_FROM_SOURCE,
                (ev) => {
                    console.log("NO DATA");
                });
            track.addEventListener(
                JitsiTrackEvents.LOCAL_TRACK_STOPPED,
                () => {
                    console.log("remote track stopped");
                });

            if (track.getType() === "video") {
                const wrapper = createVideoTrackForUser(track);
                document.getElementById("videos")?.append(wrapper);
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
            room = connection.initJitsiConference(isDev() ? "mylittleconference" : "gather", confOptions);
            room.setReceiverConstraints({
                defaultConstraints: { maxHeight: 1080 }
            });
            (window as any)["room"] = room;
            room.on(JitsiConferenceEvents.TRACK_ADDED, onRemoteTrack);
            room.on(JitsiConferenceEvents.TRACK_REMOVED, onRemoteTrackRemoved);
            room.on(JitsiConferenceEvents.CONFERENCE_JOINED, onConferenceJoined);
            room.on(JitsiConferenceEvents.USER_JOINED, id => {
                setTimeout(() => {
                    if (Gather.instance.isInGameScene()) {
                        Gather.instance.sendCommand("playerUpdate", { spriteIndex: Gather.instance.getPlayer().spriteIndex });
                    }
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
                if (parsedObj.id !== room.myUserId() && Gather.instance.isInGameScene()) {
                    Gather.instance.updatePlayer(parsedObj);
                }
            });
            room.addCommandListener("presentationUpdate", (values: any) => {
                const parsedObj = JSON.parse(values.value);
                if (parsedObj.id !== room.myUserId()) {
                    Gather.instance.handleOtherPlayerPresentationUpdate(parsedObj);
                }
            });
            room.addCommandListener("speakerUpdate", (values: any) => {
                const parsedObj = JSON.parse(values.value);
                if (parsedObj.id !== room.myUserId()) {
                    const speakersToUpdate = Gather.instance.getGameScene().rootNode.getDescendantsByType(SpeakerNode)
                        .filter(n => n.getSoundbox() === parsedObj.soundBox);
                    speakersToUpdate.forEach(s => {
                        s.handleNewSoundIndex(parsedObj.soundIndex ?? -1);
                    });
                }
            });
            room.addCommandListener("IFrameUpdate", (values: any) => {
                const parsedObj = JSON.parse(values.value);
                if (parsedObj.id !== room.myUserId()) {
                    const iFrameToUpdate = Gather.instance.getGameScene().rootNode.getDescendantsByType(IFrameNode)
                        .filter(iFrame => iFrame.url === parsedObj.originalUrl);
                    iFrameToUpdate.forEach(iFrame => {
                        iFrame.url = parsedObj.newUrl;
                        iFrame.pasteInput?.remove();
                        if (iFrame.isOpen()) {
                            iFrame.close();
                            iFrame.open();
                        }
                    });
                }
            });
            room.on(
                JitsiConferenceEvents.TRACK_AUDIO_LEVEL_CHANGED,
                (userID: string, audioLevel: number) => {
                    console.log(`${userID} - ${audioLevel}`);
                });
            room.join();
            resolve(room);
        }

        function handleMessageReceived(participantId: string, text: string, ts: number): void {
            if (participantId === room.myUserId() && Gather.instance.isInGameScene()) {
                Gather.instance.getPlayer()?.say(text, 5);
                return;
            }
            const player = Gather.instance.getOtherPlayerById(participantId);
            player?.say(text, 5);
        }

        function createVideoTrackForUser(track: JitsiRemoteTrack | JitsiLocalTrack): UserVideoElement {
            const nameOfParticipant = room.getParticipantById(track.getParticipantId())?.getDisplayName() ?? "anonymous";
            const videoElement = new UserVideoElement(nameOfParticipant, undefined, track.getParticipantId());
            videoElement.id = `${track.getParticipantId()}video`;
            videoElement.setTrack(track);
            return videoElement;
        }

        function removeVideoTrackForUser(userID: string): void {
            const vidEl = document.getElementById(`${userID}video`) as UserVideoElement;
            vidEl?.remove();
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
            wrapper.id = `${userID}placeholder`;
            imEl.style.borderRadius = "500px";
            imEl.style.width = "150px";
            imEl.style.height = "150px";
            imEl.style.objectFit = "cover";
            wrapper.appendChild(imEl);
            wrapper.appendChild(name);
            vidEl?.replaceWith(wrapper);
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
            await room.leave();
            connection?.disconnect();
        }

        function shareTabAudio() {
            const audioMixer = JitsiMeetJS.createAudioMixer();
            const localStream = room.getLocalAudioTrack()?.getOriginalStream();
            if (localStream != null) {
                audioMixer.addMediaStream(localStream);
            }
            JitsiMeetJS.createLocalTracks({
                devices: [ "desktop" ],
            }).then(async (tracks: Array<JitsiLocalTrack> | JitsiConferenceErrors) => {
                if (tracks instanceof Array) {
                    const filteredTracks = tracks.filter(t => t.isLocalAudioTrack());
                    if (filteredTracks.length === 0) {
                        window.alert("You should have ticked the 'share audio' box");
                        return;
                    }
                    const newAudioTrack = filteredTracks[0];
                    const localAudioTrack = room.getLocalAudioTrack();
                    audioMixer.addMediaStream(newAudioTrack.getOriginalStream());
                    if (localAudioTrack) {
                        if (newAudioTrack != null) {
                            const stream = newAudioTrack.getOriginalStream();
                            newAudioTrack.addEventListener(JitsiTrackEvents.LOCAL_TRACK_STOPPED, async () => {
                                localAudioTrack.getOriginalStream().removeTrack(stream.getAudioTracks()[0]);
                                await localAudioTrack.setEffect(undefined);
                                console.log(localAudioTrack.getOriginalStream().getAudioTracks());
                                console.log("stoppend ");
                            });
                            await localAudioTrack.setEffect(new MusicSource(stream));
                            return;
                        }
                        room.replaceTrack(localAudioTrack, newAudioTrack);

                    }
                }
            }).catch(error => console.log(error));
        }

        function switchVideo() {
            // TODO if presentation try to redirect pc audio
            const previousTrack = room.getLocalVideoTrack();
            if (previousTrack != null) {
                localTracks.splice(localTracks.indexOf(previousTrack), 1);
            }
            const isVideo = !!room.getLocalVideoTrack()?.isScreenSharing();
            JitsiMeetJS.createLocalTracks({
                devices: [ isVideo ? "video" : "desktop" ]
            }).then(tracks => {
                    if (tracks instanceof Array) {
                        const element = document.getElementById("localUserVideo") as UserVideoElement;
                        localTracks.push(...tracks);
                        localTracks[1].addEventListener(
                            JitsiTrackEvents.LOCAL_TRACK_STOPPED, () => {
                                const trackToDispose = room.getLocalVideoTrack();
                                if (trackToDispose != null) {
                                    localTracks.splice(localTracks.indexOf(trackToDispose), 1);
                                    room.removeTrack(trackToDispose);
                                }
                                if (previousTrack) {
                                    localTracks.push(previousTrack);
                                    if (element) {
                                        element.setTrack(previousTrack);
                                    }
                                    if (room.getLocalVideoTrack()) {
                                        room.replaceTrack(room.getLocalVideoTrack()!, previousTrack);
                                    } else {
                                        room.addTrack(previousTrack);
                                    }
                                }
                            });
                        if (element != null) {
                            element.setTrack(localTracks[1]);
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
            localStorage.setItem("gatherDefaultAudioOutput", deviceId);
            JitsiMeetJS.mediaDevices.setAudioOutputDevice(deviceId);
        }

        function changeAudioInput(deviceId: string) {
            localStorage.setItem("gatherDefaultAudioSrc", deviceId);
            const cameraDeviceId = localStorage.getItem("gatherDefaultVideoSrc") ?? undefined;
            JitsiMeetJS.createLocalTracks({ devices: ["audio", "video"], micDeviceId: deviceId, cameraDeviceId })
                .then(onLocalTracks)
                .catch(error => {
                    throw error;
                });
        }

        function changeVideoInput(deviceId: string) {
            localStorage.setItem("gatherDefaultVideoSrc", deviceId);
            const micDeviceId = localStorage.getItem("gatherDefaultAudioSrc") ?? undefined;
            JitsiMeetJS.createLocalTracks({ devices: ["audio", "video"], cameraDeviceId: deviceId, micDeviceId })
                .then(onLocalTracks)
                .catch(error => {
                    throw error;
                });
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

        const micDeviceId = localStorage.getItem("gatherDefaultAudioSrc") ?? undefined;
        const cameraDeviceId = localStorage.getItem("gatherDefaultVideoSrc") ?? undefined;
        const audioOutputDevice = localStorage.getItem("gatherDefaultAudioOutput") ?? undefined;

        JitsiMeetJS.createLocalTracks({ devices: ["audio", "video"], cameraDeviceId, micDeviceId })
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
                    const backdrop = document.createElement("div");
                    backdrop.classList.add("backdrop");
                    document.body.appendChild(backdrop);
                    setTimeout(() => {
                        backdrop.addEventListener("click", (e) => {
                            e.preventDefault();
                            e.stopImmediatePropagation();
                            e.stopPropagation();
                            backdrop.remove();
                            optionsContainer.style.display = "none";
                            optionsButton.innerText = "Options ↧";
                        }, { once: true });
                    });
                    optionsContainer.style.display = optionsContainer.style.display === "flex" ? "none" : "flex";
                    optionsButton.innerText = optionsContainer.style.display === "flex" ? "Options ↥" : "Options ↧";
                });
                optionsContainer.style.display = "none";
                JitsiMeetJS.mediaDevices.enumerateDevices(devices => {
                    const audioOutputDevices
                        = devices.filter(d => d.kind === "audiooutput");
                    const audioInputDevices
                        = devices.filter(d => d.kind === "audioinput");
                    const videoInputDevices
                        = devices.filter(d => d.kind === "videoinput");

                    if (audioOutputDevices.length > 1) {
                        const selectAudioOutput = document.createElement("select");
                        selectAudioOutput.title = "Select audio output device";
                        selectAudioOutput.id = "audioOutputSelect";
                        optionsContainer.appendChild(selectAudioOutput);
                        const options = audioOutputDevices.map(d => {
                            const option = document.createElement("option");
                            option.selected = audioOutputDevice === d.deviceId;
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
                            option.selected = micDeviceId === d.deviceId;
                            option.value = d.deviceId;
                            option.innerText = d.label;
                            return option;
                        });
                        options.forEach(o => selectAudioInput.appendChild(o));
                        selectAudioInput.addEventListener("input", (ev) => {
                            changeAudioInput((ev.target as any).value);
                        });
                    }
                    if (videoInputDevices.length > 1) {
                        const selectVideoInput = document.createElement("select");
                        selectVideoInput.title = "Select video input device";
                        selectVideoInput.id = "videoInputSelect";
                        optionsContainer.appendChild(selectVideoInput);
                        const options = videoInputDevices.map(d => {
                            const option = document.createElement("option");
                            option.selected = cameraDeviceId === d.deviceId;
                            option.value = d.deviceId;
                            option.innerText = d.label;
                            return option;
                        });
                        options.forEach(o => selectVideoInput.appendChild(o));
                        selectVideoInput.addEventListener("input", (ev) => {
                            changeVideoInput((ev.target as any).value);
                        });
                    }

                    const selectVideoBtn = document.createElement("button");
                    selectVideoBtn.id = "shareScreenBtn";
                    selectVideoBtn.innerText = "Share screen 🖥️";
                    optionsContainer.appendChild(selectVideoBtn);
                    selectVideoBtn.addEventListener("click", (ev) => {
                        switchVideo();
                    });

                    const shareAudioButton = document.createElement("button");

                    shareAudioButton.id = "shareAudioBtn";
                    shareAudioButton.innerText = "Share audio ♪";
                    optionsContainer.appendChild(shareAudioButton);
                    shareAudioButton.addEventListener("click", (ev) => {
                        shareTabAudio();
                    });
                });
            }, 1000);
        }
    });
}
