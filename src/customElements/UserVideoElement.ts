import { getAudioContext } from "../engine/assets/Sound";
import { SoundMeter } from "../SoundMeter";
import JitsiConference from "../typings/Jitsi/JitsiConference";
import JitsiLocalTrack from "../typings/Jitsi/modules/RTC/JitsiLocalTrack";
import JitsiRemoteTrack from "../typings/Jitsi/modules/RTC/JitsiRemoteTrack";
import { HoverOver } from "./HoverOver";

/**
 * Class for showing/hiding elements on hover over.
 */
export class UserVideoElement extends HTMLElement {
    public readonly nameSpan = document.createElement("span");
    private readonly videoElement = document.createElement("video");
    private readonly wrapperElement = document.createElement("div");
    private readonly hoverOver = new HoverOver();
    private track?: JitsiLocalTrack | JitsiRemoteTrack;
    private meterRefresh: any;
    private soundMeter?: SoundMeter;

    public constructor(private userName: string, private readonly room?: JitsiConference, private readonly participantId?: string) {
        super();
        if (room != null) {
            this.id = "localUserVideo";
        }
    }

    public connectAudioSource(stream?: MediaStream): void {
        this.soundMeter?.stop();
        if (stream == null) {
            this.soundMeter = undefined;
            return;
        }
        this.soundMeter = new SoundMeter(getAudioContext());
        clearInterval(this.meterRefresh);
        this.soundMeter.connectToSource(stream, (e) => {
            if (e) {
                return;
            }
            this.meterRefresh = setInterval(() => {
                if (this.soundMeter == null) {
                    return;
                }
                if (this.soundMeter.slow >= 0.01) {
                    this.videoElement.classList.add("speaking");
                    this.style.order = "1";
                } else {
                    this.videoElement.classList.remove("speaking");
                    this.style.order = "2";
                }
            }, 200);
         });
    }

    private initVideoElement(): void {
        this.videoElement.autoplay = true;
        if (this.room != null) {
            this.videoElement.id = "localVideo";
        }
        this.videoElement.poster = "https://www.dovercourt.org/wp-content/uploads/2019/11/610-6104451_image-placeholder-png-user-profile-placeholder-image-png.jpg";
        this.videoElement.classList.add("smallVideo");
    }

    private initNameSpanElement(): void {
        this.nameSpan.innerText = this.userName;
        this.nameSpan.classList.add("userName");
    }
    private initWrapperElement(): void {
        this.wrapperElement.style.position = "relative";
        if (this.room != null) {
            this.hoverOver.addButton("assets/images/mic.svg", (val) => {
                console.log(val);
                const track = this.room!.getLocalAudioTrack()?.getOriginalStream().getAudioTracks().slice(-1)[0];
                if (val && track) {
                    track.enabled = false;
                } else if (track) {
                    track.enabled = true;
                }
            }, "assets/images/mic_off.svg", "Mute", "Unmute");
            this.hoverOver.addButton("assets/images/video.svg", (val) => {
                if (val) {
                    this.room!.getLocalVideoTrack()?.mute();
                } else {
                    this.room!.getLocalVideoTrack()?.unmute();
                }
            }, "assets/images/video_off.svg", "Hide video", "Show video");
            this.hoverOver.classList.add("hoverOver");
            this.wrapperElement.appendChild(this.hoverOver);
        }

        this.wrapperElement.classList.add("userVideo");
        this.wrapperElement.appendChild(this.videoElement);
        this.wrapperElement.appendChild(this.nameSpan);
        this.wrapperElement.addEventListener("click", this.handleWrapperClick.bind(this));
        this.wrapperElement.addEventListener("contextmenu", this.handleWrapperContext.bind(this));
    }

    private handleWrapperClick(): void {
        if (this.track?.isMuted()) {
            return;
        }
        Array.from((document.getElementsByTagName("user-video") as HTMLCollectionOf<UserVideoElement>))
            .filter(el => el.isExpanded())
            .forEach(el => el.minimize());
        if (this.videoElement.parentElement === this.wrapperElement && this.track != null) {
            document.body.append(this.videoElement);
            this.videoElement.addEventListener("click", this.minimize.bind(this), { once: true });
            this.videoElement.classList.add("bigVideo");
            this.style.display = "none";
        } else {
            this.minimize();
        }
    }

    private handleWrapperContext(event: MouseEvent): void {
        event.preventDefault();
        if (this.participantId == null) {
            return;
        }
        const backdrop = document.createElement("div");
        backdrop.classList.add("backdrop");
        document.body.append(backdrop);
        const item = document.createElement("span");
        const context = document.createElement("div");
        setTimeout(() => {
            backdrop.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopImmediatePropagation();
                e.stopPropagation();
                backdrop.remove();
                context.remove();
            }, { once: true });
        });

        const audioEl = document.getElementById(`${this.id.replace("video", "audio")}`) as HTMLAudioElement;

        const button = document.createElement("button");
        button.innerText = "Mute for you";
        button.addEventListener("click", () => {
            audioEl.volume = Math.abs(audioEl.volume - 1);
            backdrop.remove();
            context.remove();
        });

        item.append(button);

        context.append(item);
        context.classList.add("contextMenu");
        document.body.append(context);
        context.style.position = "absolute";
        context.style.zIndex = "100000";
        button.style.cursor = "pointer";
        context.style.transform = `translate3d(${event.pageX}px, ${event.pageY}px, 0px)`;
    }

    private minimize(): void {
        this.videoElement.removeEventListener("click", this.handleWrapperClick.bind(this));
        this.videoElement.classList.remove("bigVideo");
        this.wrapperElement.prepend(this.videoElement);
        this.style.display = "block";
    }

    public setTrack(track: JitsiRemoteTrack | JitsiLocalTrack): void {
        track.attach(this.videoElement);
        this.track = track;
    }

    public changeTrack(): void {
    }

    public isExpanded(): boolean {
        return this.style.display === "none";
    }

    public remove(): void {
        this.minimize();
        super.remove();
    }

    public connectedCallback(): void {
        if (!this.isConnected) {
            return;
        }
        this.initVideoElement();
        this.initNameSpanElement();
        this.initWrapperElement();
        const shadowRoot = this.attachShadow({ mode: "open" });
        const style = document.createElement("style");

        style.textContent = `
            .hoverOver {
                position: absolute;
                bottom: 2em;
                z-index: 1008;
            }
            .userVideo {
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
            }
            .smallVideo {
                border-radius: 500px;
                width: 150px;
                height: 150px;
                object-fit: cover;
                border: 4px solid transparent;
                cursor: zoom-in;
            }
            .speaking {
                border: 4px solid green;
            }
            span {
                color: white;
            }
        `;
        shadowRoot.append(style, this.wrapperElement);
    }

    public getVideoElement(): HTMLVideoElement {
        return this.videoElement;
    }
}

export default function () {
    customElements.define("user-video", UserVideoElement);
}
