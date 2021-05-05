/* eslint-disable no-undef */
/* global $, JitsiMeetJS */

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

let connection = null;
let isJoined = false;
let room = null;

let localTracks = [];
const remoteTracks = {};

JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.INFO);


/**
 * Handles local tracks.
 * @param tracks Array with JitsiTrack objects
 */
function onLocalTracks(tracks) {
    localTracks = tracks;
    for (let i = 0; i < localTracks.length; i++) {
        localTracks[i].addEventListener(
            JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
            audioLevel => console.log(`Audio Level local: ${audioLevel}`));
        localTracks[i].addEventListener(
            JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
            () => console.log("local track muted"));
        localTracks[i].addEventListener(
            JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
            () => console.log("local track stoped"));
        localTracks[i].addEventListener(
            JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
            deviceId =>
                console.log(
                    `track audio output device was changed to ${deviceId}`));
        if (localTracks[i].getType() === "video") {
            const element = document.createElement("video");
            var name = document.createElement("span");
            name.innerText = "YOU";
            var wrapper = document.createElement("div");
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
            $("#videos").append(wrapper);
        } else {
            $("body").append(
                `<audio autoplay='1' muted='true' id='localAudio${i}' />`);
            localTracks[i].attach($(`#localAudio${i}`)[0]);
        }
        if (isJoined) {
            room.addTrack(localTracks[i]);
        }
    }
}

/**
 * Handles remote tracks
 * @param track JitsiTrack object
 */
function onRemoteTrack(track) {
    if (track.isLocal()) {
        return;
    }
    const participant = track.getParticipantId();

    if (!remoteTracks[participant]) {
        remoteTracks[participant] = [];
    } else if (remoteTracks[participant].find(el => el.getId() === track.getId()) != null) {
        // Skip if already video of user present
        return;
    }

    remoteTracks[participant].push(track);

    track.addEventListener(
        JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
        audioLevel => console.log(`Audio Level remote: ${audioLevel}`));
    track.addEventListener(
        JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
        () => console.log("remote track muted"));
    track.addEventListener(
        JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
        () => console.log("remote track stoped"));
    track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
        deviceId =>
            console.log(
                `track audio output device was changed to ${deviceId}`));
    let element;

    var nameOfParticipant = room.participants[track.getParticipantId()]?.getDisplayName() ?? "anonymous";

    if (track.getType() === "video") {
        element = document.createElement("video");
        var name = document.createElement("span");
        name.innerText = nameOfParticipant;
        var wrapper = document.createElement("div");
        wrapper.classList.add("userVideo");
        wrapper.appendChild(element);
        wrapper.appendChild(name);
        element.autoplay = true;
        element.id = `${participant}video`;
        element.style.borderRadius = "500px";
        element.style.width = "150px";
        element.style.height = "150px";
        element.style.objectFit = "cover";
        $("#videos").append(wrapper);
    } else {
        element = document.createElement("audio");
        element.autoplay = true;
        element.id = `${participant}audio`;
        $("body").append(element);
    }
    track.attach(element);
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
function onUserLeft(id) {
    console.log("user left");
    if (!remoteTracks[id]) {
        return;
    }
    const tracks = remoteTracks[id];

    for (let i = 0; i < tracks.length; i++) {
        const elementId = `${id}${tracks[i].getType()}`;
        const element = document.getElementById(elementId);

        if (element == null) {
            continue;
        }

        if (element.parentElement.classList.contains("userVideo")) {
            element.parentElement.remove();
        } else {
            element.remove();
        }


        tracks[i].detach(element);
    }
}

/**
 * That function is called when connection is established successfully
 */
function onConnectionSuccess() {
    room = connection.initJitsiConference("myconference", confOptions);
    room.on(JitsiMeetJS.events.conference.TRACK_ADDED, onRemoteTrack);
    room.on(JitsiMeetJS.events.conference.TRACK_REMOVED, track => {
        console.log(`track removed!!!${track}`);
    });
    room.on(
        JitsiMeetJS.events.conference.CONFERENCE_JOINED,
        onConferenceJoined);
    room.on(JitsiMeetJS.events.conference.USER_JOINED, id => {
        console.log("user join");
        remoteTracks[id] = [];
    });
    room.on(JitsiMeetJS.events.conference.USER_LEFT, onUserLeft);
    room.on(JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, track => {
        console.log(`${track.getType()} - ${track.isMuted()}`);
    });
    room.on(
        JitsiMeetJS.events.conference.DISPLAY_NAME_CHANGED,
        (userID, displayName) => console.log(`${userID} - ${displayName}`));
    room.on(
        JitsiMeetJS.events.conference.TRACK_AUDIO_LEVEL_CHANGED,
        (userID, audioLevel) => console.log(`${userID} - ${audioLevel}`));
    room.on(
        JitsiMeetJS.events.conference.PHONE_NUMBER_CHANGED,
        () => console.log(`${room.getPhoneNumber()} - ${room.getPhonePin()}`));
    console.log("JOINING NOW");
    room.join();
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
function onDeviceListChanged(devices) {
    console.info("current devices", devices);
}

/**
 * This function is called when we disconnect.
 */
function disconnect() {
    console.log("disconnect!");
    connection.removeEventListener(
        JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
        onConnectionSuccess);
    connection.removeEventListener(
        JitsiMeetJS.events.connection.CONNECTION_FAILED,
        onConnectionFailed);
    connection.removeEventListener(
        JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
        disconnect);
}

/**
 *
 */
function unload() {
    for (let i = 0; i < localTracks.length; i++) {
        localTracks[i].dispose();
    }
    room.leave();
    connection.disconnect();
}

let isVideo = true;

/**
 *
 */
function switchVideo() { // eslint-disable-line no-unused-vars
    isVideo = !isVideo;
    if (localTracks[1]) {
        localTracks[1].dispose();
        localTracks.pop();
    }
    JitsiMeetJS.createLocalTracks({
        devices: [ isVideo ? "video" : "desktop" ]
    })
        .then(tracks => {
            localTracks.push(tracks[0]);
            localTracks[1].addEventListener(
                JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
                () => console.log("local track muted"));
            localTracks[1].addEventListener(
                JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
                () => console.log("local track stoped"));
            localTracks[1].attach($("#localVideo1")[0]);
            room.addTrack(localTracks[1]);
        })
        .catch(error => console.log(error));
}

/**
 *
 * @param selected
 */
function changeAudioOutput(selected) { // eslint-disable-line no-unused-vars
    JitsiMeetJS.mediaDevices.setAudioOutputDevice(selected.value);
}

window.addEventListener("beforeunload", unload);
window.addEventListener("unload", unload);

// JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);
const initOptions = {
    disableAudioLevels: true
};

JitsiMeetJS.init(initOptions);

connection = new JitsiMeetJS.JitsiConnection(null, null, options);

connection.addEventListener(
    JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
    onConnectionSuccess);
connection.addEventListener(
    JitsiMeetJS.events.connection.CONNECTION_FAILED,
    onConnectionFailed);
connection.addEventListener(
    JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
    disconnect);

JitsiMeetJS.mediaDevices.addEventListener(
    JitsiMeetJS.events.mediaDevices.DEVICE_LIST_CHANGED,
    onDeviceListChanged);

connection.connect();

JitsiMeetJS.createLocalTracks({ devices: [ "audio", "video" ] })
    .then(onLocalTracks)
    .catch(error => {
        throw error;
    });

if (JitsiMeetJS.mediaDevices.isDeviceChangeAvailable("output")) {
    JitsiMeetJS.mediaDevices.enumerateDevices(devices => {
        const audioOutputDevices
            = devices.filter(d => d.kind === "audiooutput");

        if (audioOutputDevices.length > 1) {
            $("#audioOutputSelect").html(
                audioOutputDevices
                    .map(
                        d =>
                            `<option value="${d.deviceId}">${d.label}</option>`)
                    .join("\n"));

            $("#audioOutputSelectWrapper").show();
        }
    });
}
