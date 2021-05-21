import { clamp } from "../util/math";
import { ControllerManager } from "../input/ControllerManager";

// Get cross-browser AudioContext (Safari still uses webkitAudioContext…)
const AudioContext = window.AudioContext ?? (window as any).webkitAudioContext as AudioContext;

let audioContext: AudioContext | null = null;
let globalGainNode: GainNode | null = null;

export function getAudioContext(): AudioContext {
    const controllerManager = ControllerManager.getInstance();

    if (audioContext == null) {
        audioContext = new AudioContext();

        // When audio context is suspended then try to wake it up on next key or pointer press
        if (audioContext.state === "suspended") {
            const resume = () => {
                audioContext?.resume();
            };

            controllerManager.onButtonDown.connect(resume);
            document.addEventListener("pointerdown", resume);

            audioContext.addEventListener("statechange", () => {
                if (audioContext?.state === "running") {
                    controllerManager.onButtonDown.disconnect(resume);
                    document.removeEventListener("pointerdown", resume);
                }
            });
        }
    }

    return audioContext;
}

export function getGlobalGainNode(): GainNode {
    if (globalGainNode == null) {
        const audioContext = getAudioContext();
        globalGainNode = audioContext.createGain();
        globalGainNode.connect(audioContext.destination);
    }

    return globalGainNode;
}

export class Sound {
    private source: AudioBufferSourceNode | MediaStreamAudioSourceNode | null = null;
    private loop: boolean = false;
    private stereoPannerNode: StereoPannerNode | null = null;
    private gainNode: GainNode | null = null;
    private isPaused = false;

    public constructor(private readonly buffer?: AudioBuffer | MediaStreamAudioSourceNode, private defaultVolume = 1) {
        this.setStereo();
    }

    public static async load(url: string): Promise<Sound> {
        const arrayBuffer = await (await fetch(url)).arrayBuffer();

        return new Promise((resolve, reject) => {
            getAudioContext().decodeAudioData(arrayBuffer,
                buffer => resolve(new Sound(buffer)),
                error => reject(error)
            );
        });
    }

    public setStereo(): void {
        const ctx = getAudioContext();
        this.gainNode = ctx.createGain();
        this.stereoPannerNode = ctx.createStereoPanner();
        this.gainNode.connect(getGlobalGainNode());
        this.stereoPannerNode.connect(this.gainNode);
    }

    public setSoundSrc(src?: MediaStreamTrack): void {
        if (src) {
            this.source = getAudioContext().createMediaStreamSource(new MediaStream([src]));
            if (this.stereoPannerNode) {
                this.source.connect(this.stereoPannerNode);
            } else if (this.gainNode) {
                this.source.connect(this.gainNode);
            }
        } else {
            this.source = null;
        }
    }

    public static shallowClone(sound: Sound): Sound {
        const cloned = Object.create(sound.constructor.prototype);
        Object.keys(sound).forEach(key => {
            cloned[key] = (<any>sound)[key];
        });
        return cloned;
    }

    public shallowClone(): Sound {
        return Sound.shallowClone(this);
    }

    public isPlaying(): boolean {
        return this.source != null;
    }

    /**
     * Plays the sound with the given parameters.
     *
     * @param fadeIn    - Duration of the fadeIn in seconds.
     * @param delay     - The delay after which to play the sound in seconds.
     * @param duration  - The duration how long the sound should be played in seconds.
     * @param direction - The direction (left/right channel) and its dimension to play the sound.
     *                    Values between -1 (left) and 1 (right) are possible.
     */
    public play(args?: {fadeIn?: number, delay?: number, duration?: number, direction?: number}): void {
        if (!this.isPlaying() && this.buffer != null) {
            const source = this.buffer instanceof AudioBuffer ? getAudioContext().createBufferSource() : this.buffer;
            if (source instanceof AudioBufferSourceNode) {
                source.buffer = this.buffer as AudioBuffer;
                source.loop = this.loop;
            }
            if (this.stereoPannerNode) {
                source.connect(this.stereoPannerNode);
            }

            source.addEventListener("ended", () => {
                if (this.source === source) {
                    this.source = null;
                }
            });

            this.source = source;
            if (this.gainNode) {
                this.gainNode.gain.setValueAtTime(0, this.source.context.currentTime);
                this.gainNode.gain.linearRampToValueAtTime(this.defaultVolume, this.source.context.currentTime + (args?.fadeIn ?? 0));
            }
            if (args?.direction) {
                this.setDirection(args.direction);
            }
            if (source instanceof AudioBufferSourceNode) {
                source.start(this.source.context.currentTime, args?.delay, args?.duration);
            }
        }
    }

    public async stop(fadeOut = 0): Promise<void> {
        if (this.source) {
            if (fadeOut > 0 && this.gainNode) {
                const stopTime = this.source.context.currentTime + fadeOut;
                this.gainNode.gain.linearRampToValueAtTime(0, stopTime);
                if (this.source instanceof AudioBufferSourceNode) {
                    this.source.stop(stopTime);
                } else {
                    this.source.disconnect();
                }
            } else {
                try {
                    if (this.source instanceof AudioBufferSourceNode) {
                        this.source.stop();
                    } else {
                        this.source.disconnect();
                    }
                } catch (e) {
                    // Ignored. Happens on Safari sometimes. Can't stop a sound which may not be really playing?
                }
            }

            this.source = null;
        }
    }

    public pause(): void {
        if (!this.isPaused) {
            this.gainNode?.gain.setValueAtTime(0, this.gainNode.context.currentTime);
            this.isPaused = true;
        }
    }

    public resume(): void {
        if (this.isPaused) {
            this.gainNode?.gain.setValueAtTime(this.gainNode.gain.defaultValue, this.gainNode.context.currentTime);
            this.isPaused = false;
        }
    }

    public setLoop(loop: boolean): void {
        this.loop = loop;

        if (this.source) {
            if (this.source instanceof AudioBufferSourceNode) {
                this.source.loop = loop;
            }
        }
    }

    /**
     * Sets the volume and if given also the direction of a sound.
     *
     * @param volume    - The volume of the sound. Can have values between 0 and 1.
     * @param direction - The direction-channel of the sound. Can be from -1 (left) to 1 (right).
     */
    public setVolume(volume: number, direction?: number): void {
        if (direction !== undefined) {
            this.setDirection(direction);
        }
        if (this.gainNode) {
            const gain = this.gainNode.gain;
            gain.value = clamp(volume, gain.minValue, gain.maxValue);
        }
    }

    public getVolume(): number {
        if (this.gainNode) {
            return this.gainNode.gain.value;
        }
        return 0;
    }

    /**
     * Sets the direction of a sound.
     *
     * @param direction - The direction-channel of the sound. Can be from -1 (left) to 1 (right).
     */
    public setDirection(direction: number): void {
        if (this.stereoPannerNode) {
            this.stereoPannerNode.pan.setValueAtTime(direction, getAudioContext().currentTime);
        }
    }

    public getDirection(): number {
        if (this.stereoPannerNode) {
            return this.stereoPannerNode.pan.value;
        }
        return 0;
    }
}
