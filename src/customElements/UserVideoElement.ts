import { clamp } from "../engine/util/math";
import JitsiConference from "../typings/Jitsi/JitsiConference";
import JitsiLocalTrack from "../typings/Jitsi/modules/RTC/JitsiLocalTrack";
import JitsiRemoteTrack from "../typings/Jitsi/modules/RTC/JitsiRemoteTrack";
import { HoverOver } from "./HoverOver";

/**
 * Class for showing/hiding elements on hover over.
 */
export class UserVideoElement extends HTMLElement {
    private readonly nameSpan = document.createElement("span");
    private readonly videoElement = document.createElement("video");
    private readonly wrapperElement = document.createElement("div");
    private readonly videoWrapperElement = document.createElement("div");
    private readonly hoverOver = new HoverOver();
    private track?: JitsiLocalTrack | JitsiRemoteTrack;
    private oldXPlacement = 0;
    private oldYPlacement = 0;
    private oldZoomFactor = 1;

    public constructor(private userName: string, private readonly room?: JitsiConference, private readonly participantId?: string) {
        super();
        if (room != null) {
            this.id = "localUserVideo";
        }
    }

    private initVideoElement(): void {
        this.videoElement.autoplay = true;
        if (this.room != null) {
            this.videoElement.id = "localVideo";
        }
        this.videoElement.poster = "https://www.dovercourt.org/wp-content/uploads/2019/11/610-6104451_image-placeholder-png-user-profile-placeholder-image-png.jpg";
        this.videoElement.classList.add("smallVideo");
        this.videoElement.style.height = "150px";
        this.videoElement.style.width = "150px";
        this.videoWrapperElement.classList.add("videoWrapper");
        this.videoWrapperElement.appendChild(this.videoElement);
    }

    private initNameSpanElement(): void {
        this.nameSpan.innerText = this.userName;
        this.nameSpan.contentEditable = this.room != null ? "true" : "false";
        this.nameSpan.classList.add("userName");
        if (this.room != null) {
            this.nameSpan.addEventListener("input", this.handleInput.bind(this), false);
            this.nameSpan.addEventListener("blur", this.handleBlur.bind(this), false);
        }
    }
    private initWrapperElement(): void {
        this.wrapperElement.style.position = "relative";
        if (this.room != null) {
            this.hoverOver.addButton("🎙️", (val) => {
                if (val) {
                    this.room!.getLocalAudioTrack()?.mute();
                } else {
                    this.room!.getLocalAudioTrack()?.unmute();
                }
            }, "❌", "Mute", "Unmute");
            this.hoverOver.addButton("📹", (val) => {
                if (val) {
                    this.room!.getLocalVideoTrack()?.mute();
                } else {
                    this.room!.getLocalVideoTrack()?.unmute();
                }
            }, "❌", "Hide video", "Show video");
            this.hoverOver.classList.add("hoverOver");
            this.wrapperElement.appendChild(this.hoverOver);
        }

        this.wrapperElement.classList.add("userVideo");
        this.wrapperElement.appendChild(this.videoWrapperElement);
        this.wrapperElement.appendChild(this.nameSpan);
        this.wrapperElement.addEventListener("click", this.handleWrapperClick.bind(this));
        this.wrapperElement.addEventListener("contextmenu", this.handleWrapperContext.bind(this));
    }

    private handleInput(ev: Event): void {
        ev.stopImmediatePropagation();
        ev.stopPropagation();
        if (this.nameSpan.innerText.includes("\n")) {
            this.nameSpan.innerText = this.nameSpan.innerText.trim();
            this.nameSpan.blur();
        }
    }

    private handleBlur(): void {
        if (this.nameSpan.innerText !== "") {
            this.userName = this.nameSpan.innerText.replace("\n", "");
        }
        this.room!.setDisplayName(this.userName);
    }

    private handleWrapperClick(): void {
        if (this.track?.isMuted()) {
            return;
        }
        Array.from((document.getElementsByTagName("user-video") as HTMLCollectionOf<UserVideoElement>))
            .filter(el => el.isExpanded())
            .forEach(el => el.minimize());
        if (this.videoElement.parentElement === this.videoWrapperElement && this.track != null) {
            document.body.append(this.videoElement);
            this.videoElement.style.width = "auto";
            this.videoElement.style.height = "auto";
            this.videoElement.style.transform = "";
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
        context.style.transform = `translate3d(${event.pageX}px, ${event.pageY}px, 0px)`;
    }

    private minimize(): void {
        this.videoElement.removeEventListener("click", this.handleWrapperClick.bind(this));
        this.videoElement.classList.remove("bigVideo");
        this.videoWrapperElement.prepend(this.videoElement);
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

    public resetPlacement(): void {
        // this.videoElement.style.transform = "";
        //this.videoElement.style.objectFit = "cover";
    }

    public updatePlacement(xCenter: number, yCenter: number, area: number): void {
        if (this.isExpanded()) {
            return;
        }
        const zoomFactor = clamp(area * 7, 0.2, 1);
        let newWidth = 150 / zoomFactor;
        let newHeight = 150 / zoomFactor;
        const factor = this.videoElement.videoHeight / this.videoElement.videoWidth;
        if (factor > 1) {
            newHeight /= factor;
        } else {
            newWidth *= factor;
        }
        this.videoElement.style.height = "150px";
        this.videoElement.style.width = "150px";
        this.videoElement.style.transformOrigin = "center";
        this.videoElement.style.objectFit = "contain";
        const newXPlacement = -(xCenter * newWidth) + newWidth / 2;
        const newYPlacement = -(yCenter * newHeight) + newHeight / 2;
        if (factor > 1) {
            if (Math.abs(newYPlacement - this.oldYPlacement) > 5 || Math.abs(this.oldZoomFactor - zoomFactor) > 0.1) {
                this.oldYPlacement = newYPlacement;
                this.oldZoomFactor = zoomFactor;
                this.videoElement.style.transform = `translateY(${newYPlacement / zoomFactor}px) scale(${1 / zoomFactor})`;
            }
        } else {
            if (Math.abs(newXPlacement - this.oldXPlacement) > 5 || Math.abs(this.oldZoomFactor - zoomFactor) > 0.1) {
                this.oldXPlacement = newXPlacement;
                this.oldZoomFactor = zoomFactor;
                this.videoElement.style.transform = `translateX(${newXPlacement / zoomFactor}px) scale(${1 / zoomFactor})`;
            }
        }
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
                cursor: zoom-in;
            }
            span {
                color: white;
            }
            .videoWrapper {
                border-radius: 500px;
                width: 150px;
                height: 150px;
                overflow: hidden;
            }
            .smallVideo {
                transition: transform 0.4s;
                object-fit: cover;
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
