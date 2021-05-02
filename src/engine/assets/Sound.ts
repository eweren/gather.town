import { clamp } from "../util/math";
import { ControllerManager } from "../input/ControllerManager";
import { Vector2Like } from "../graphics/Vector2";

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
    private source: AudioBufferSourceNode | null = null;
    private loop: boolean = false;
    private stereoPannerNode: StereoPannerNode | null = null;
    private pannerNode: PannerNode | null = null;
    private gainNode: GainNode | null = null;
    private uses3D = false;
    private isPaused = false;

    private constructor(private readonly buffer: AudioBuffer, private defaultVolume = 1) {
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
        this.pannerNode?.disconnect();
        this.pannerNode = null;
        const ctx = getAudioContext();
        this.gainNode = ctx.createGain();
        this.stereoPannerNode = ctx.createStereoPanner();
        this.gainNode.connect(getGlobalGainNode());
        this.stereoPannerNode.connect(this.gainNode);
        this.uses3D = false;
    }

    public setPositionedSound(positionInScene: Vector2Like, intensity = 1, range = 150, emitterWidth = 30): void {
        this.gainNode?.disconnect();
        this.gainNode = null;
        this.stereoPannerNode?.disconnect();
        this.stereoPannerNode = null;
        const ctx = getAudioContext();
        this.pannerNode = ctx.createPanner();
        this.pannerNode.connect(ctx.destination);
        this.pannerNode.panningModel = "HRTF";
        this.pannerNode.rolloffFactor = 1.5 / intensity;
        this.pannerNode.maxDistance = range;
        this.pannerNode.refDistance = emitterWidth;
        this.pannerNode.setPosition(positionInScene.x, positionInScene.y, 10);
        this.uses3D = true;
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

    public is3D(): boolean {
        return this.uses3D;
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
        if (!this.isPlaying()) {
            const source = getAudioContext().createBufferSource();
            source.buffer = this.buffer;
            source.loop = this.loop;
            if (this.stereoPannerNode) {
                source.connect(this.stereoPannerNode);
            } else if (this.pannerNode) {
                source.connect(this.pannerNode);
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
            source.start(this.source.context.currentTime, args?.delay, args?.duration);
        }
    }

    public async stop(fadeOut = 0): Promise<void> {
        if (this.source) {
            if (fadeOut > 0 && this.gainNode) {
                const stopTime = this.source.context.currentTime + fadeOut;
                this.gainNode.gain.linearRampToValueAtTime(0, stopTime);
                this.source.stop(stopTime);
            } else {
                try {
                    this.source.stop();
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
            if (this.pannerNode) {
                this.pannerNode.refDistance *= 0.2;
                this.pannerNode.maxDistance *= 0.2;
            }
            this.isPaused = true;
        }
    }

    public resume(): void {
        if (this.isPaused) {
            this.gainNode?.gain.setValueAtTime(this.gainNode.gain.defaultValue, this.gainNode.context.currentTime);
            if (this.pannerNode) {
                this.pannerNode.refDistance *= 5;
                this.pannerNode.maxDistance *= 5;
            }
            this.isPaused = false;
        }
    }

    public setLoop(loop: boolean): void {
        this.loop = loop;

        if (this.source) {
            this.source.loop = loop;
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
