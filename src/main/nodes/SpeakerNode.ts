
import { Aseprite } from "../../engine/assets/Aseprite";
import { asset } from "../../engine/assets/Assets";
import { Sound } from "../../engine/assets/Sound";
import { Direction } from "../../engine/geom/Direction";
import { ControllerFamily } from "../../engine/input/ControllerFamily";
import { SoundNode, } from "../../engine/scene/SoundNode";
import { TiledSceneArgs } from "../../engine/scene/TiledMapNode";
import { Gather } from "../Gather";
import { InteractiveNode } from "./InteractiveNode";

export const soundAssets = [
    "music/surf.ogg",
    "music/fun.ogg",
    "music/norf_norf.ogg"
];
export const soundMapping: {[index: string]: number} = {
    "surf": 0
};
export function getAssetIndexForName(name: string): number {
    return soundMapping[name] ?? -1;
}

export class SpeakerNode extends InteractiveNode {
    @asset("sprites/empty.aseprite.json")
    private static readonly noSprite: Aseprite;

    @asset(soundAssets)
    private static sounds: Sound[];

    private sound?: Sound;
    private soundNode?: SoundNode<Gather>;
    private range: number;
    private intensity: number;
    private soundbox: number;
    private soundIndex = -1;

    public constructor(args?: TiledSceneArgs) {
        super({
            aseprite: SpeakerNode.noSprite,
            anchor: Direction.CENTER,
            tag: "off",
            ...args
        }, "PRESS E TO START MUSIC");
        this.range = args?.tiledObject?.getOptionalProperty("range", "float")?.getValue() ?? 800.0;
        this.intensity = args?.tiledObject?.getOptionalProperty("intensity", "float")?.getValue() ?? 1;
        this.soundbox = args?.tiledObject?.getOptionalProperty("soundbox", "int")?.getValue() ?? -1;
    }

    public update(dt: number, time: number): void {
        this.caption = `PRESS ${this.getGame().input.currentControllerFamily === ControllerFamily.GAMEPAD ? "Y" : "E"}`
            + (this.sound != null ? " TO PLAY NEXT SONG" : " TO START MUSIC");
        super.update(dt, time);
    }

    public getSoundbox(): number {
        return this.soundbox;
    }

    public getSoundOfBox(): Sound | undefined {
        return this.sound;
    }

    public interact(): void {
        this.handleNewSoundIndex(this.soundIndex + 1);
        this.getGame().sendCommand("speakerUpdate", {soundIndex: this.soundIndex, soundBox: this.soundbox});
    }

    public handleNewSoundIndex(soundIndex: number): void {
        if (this.soundIndex === soundIndex) {
            return;
        }
        this.soundIndex = soundIndex;
        if (this.soundIndex === SpeakerNode.sounds.length) {
            this.soundIndex = -1;
            this.soundNode?.remove();
            this.soundNode = undefined;
            this.sound?.stop();
            this.sound = undefined;
        } else {
            this.sound?.stop();
            this.sound = SpeakerNode.sounds[this.soundIndex].shallowClone();
            if (this.sound != null) {
                this.soundNode?.remove();
                this.soundNode = new SoundNode({ sound: this.sound, range: this.range, intensity: this.intensity });
                this.appendChild(this.soundNode);
            }
        }

    }
}
