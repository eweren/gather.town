import { asset } from "../engine/assets/Assets";
import { Sound } from "../engine/assets/Sound";
import { mutedRandomFx } from "../engine/util/env";
import { clamp } from "../engine/util/math";
import { sleep } from "../engine/util/time";


export class FxManager {

    @asset("sounds/ambient/zombieScream.ogg")
    private static scream: Sound;

    @asset("sounds/ambient/drip.ogg")
    private static drip: Sound;

    @asset("sounds/ambient/metalDoor.ogg")
    private static metalDoor: Sound;

    @asset("sounds/ambient/womanHeavyBreathing.ogg")
    private static womanHeavyBreathing: Sound;

    private sounds: Array<Sound> = [];

    private static theInstance = new FxManager();

    private loaded = false;
    private loadInterval: number;
    private currentSoundToPlay = -1;
    private active = false;

    public constructor() {
        this.loaded = false;
        this.loadInterval = +setInterval(this.checkLoaded.bind(this), 200);
    }

    private checkLoaded() {
        if (FxManager.scream) {
            this.loaded = true;
            this.sounds = [FxManager.scream, FxManager.drip, FxManager.metalDoor, FxManager.womanHeavyBreathing];
            clearInterval(this.loadInterval);
            this.loadInterval = 0;
        }
    }

    public static getInstance() {
        return FxManager.theInstance;
    }

    public playSounds(): void {
        this.active = true;
        if (this.loaded) {
            this.setupNewTimeout();
        }
    }

    private async setupNewTimeout(): Promise<void> {
        if (this.active && !mutedRandomFx()) {
            const timeToNextScream = clamp(Math.random() * 20000 + 10000, 15000, 350000);
            await sleep(timeToNextScream);
            this.currentSoundToPlay = Math.floor(Math.random() * this.sounds.length);
            this.sounds[this.currentSoundToPlay];
            // Randomize direction of random sounds
            this.sounds[this.currentSoundToPlay].setVolume(clamp(Math.random() + 0.3, 0.3, 1), (Math.random() * 2) - 1);
            this.sounds[this.currentSoundToPlay].play();
            await this.setupNewTimeout();
        }
    }

    public stop(): void {
        this.active = false;

        if (this.currentSoundToPlay > -1) {
            this.sounds[this.currentSoundToPlay].stop();
        }
    }

}
