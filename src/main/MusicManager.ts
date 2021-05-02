import { asset } from "../engine/assets/Assets";
import { Sound } from "../engine/assets/Sound";
import { mutedMusic } from "../engine/util/env";


export class MusicManager {

    @asset("music/01-riding-the-hyperloop.ogg")
    private static music0: Sound;
    @asset("music/02-down-in-the-tunnel.ogg")
    private static music1: Sound;
    @asset("music/03-uncertainty-ahead.ogg")
    private static music2: Sound;
    @asset("music/04-down-in-the-tunnel-with-lyrics.ogg")
    private static music3: Sound;

    private tracks: Sound[] = [];
    private volumes: number[] = [];

    private currentMusic = -1;

    private loaded = false;
    private loadInterval: number;

    private static theInstance = new MusicManager();

    public constructor() {
        this.currentMusic = -1;
        this.loaded = false;
        this.loadInterval = +setInterval(this.checkLoaded.bind(this), 200);
    }

    public static getInstance() {
        return MusicManager.theInstance;
    }

    private checkLoaded() {
        if (MusicManager.music0) {
            this.loaded = true;
            this.tracks = [ MusicManager.music0, MusicManager.music1, MusicManager.music2, MusicManager.music3 ];
            this.volumes = [1, 0.5, 1, 1];

            clearInterval(this.loadInterval);
            this.loadInterval = 0;
            if (this.currentMusic >= 0) {
                const id = this.currentMusic;
                this.currentMusic = -1;
                this.loopTrack(id);
            }
        }
    }

    public loopTrack(id: number): void {
        if (mutedMusic()) {
            return;
        }
        if (!this.loaded) {
            this.currentMusic = id;
            return;
        }
        if (id !== this.currentMusic) {
            if (this.currentMusic >= 0) {
                this.tracks[this.currentMusic].stop();
            }
            if (this.tracks[id] == null) {
                console.error("Couldn't load music track");
                return;
            }
            this.currentMusic = id;
            if (this.currentMusic >= 0) {
                this.tracks[this.currentMusic].setLoop(true);
                this.tracks[this.currentMusic].setVolume(this.volumes[this.currentMusic]);
                this.tracks[this.currentMusic].play();
            }
        }
    }

    public setVolume(factor = 1, direction?: number) {
        this.tracks[this.currentMusic].setVolume(this.volumes[this.currentMusic] * factor, direction);
    }

    public stop(): void {
        this.loopTrack(-1);
    }

}
