import { asset } from "../../engine/assets/Assets";
import { Sound } from "../../engine/assets/Sound";
import { SoundNode, } from "../../engine/scene/SoundNode";
import { TiledSceneArgs } from "../../engine/scene/TiledMapNode";
import { Hyperloop } from "../Hyperloop";

const soundAssets = [
    "sounds/loops/loop_breathing.mp3",
    "sounds/loops/loop_electronicmotor.ogg",
    "sounds/loops/loop_elektrostatic.mp3",
    "sounds/loops/loop_fan.ogg",
    "sounds/loops/loop_flamethrower.mp3",
    "sounds/loops/loop_flies.mp3",
    "sounds/loops/loop_gas.mp3",
    "sounds/loops/loop_halogen.ogg",
    "sounds/loops/loop_occupied.mp3",
    "sounds/loops/loop_staticRadioSound.mp3"
];
const soundMapping: {[index: string]: number} = {
    "breathing": 0,
    "electronicmotor": 1,
    "elektrostatic": 2,
    "fan": 3,
    "flamethrower": 4,
    "flies": 5,
    "gas": 6,
    "halogen": 7,
    "occupied": 8,
    "staticRadioSound": 9,
};
function getAssetIndexForName(name: string): number {
    return soundMapping[name] ?? -1;
}

export class TiledSoundNode extends SoundNode<Hyperloop> {
    @asset(soundAssets)
    private static sounds: Sound[];

    public constructor(args?: TiledSceneArgs) {
        const range = args?.tiledObject?.getOptionalProperty("range", "float")?.getValue() ?? 10.0;
        const intensity = args?.tiledObject?.getOptionalProperty("intensity", "float")?.getValue() ?? 1.0;
        const emitterWidth = args?.tiledObject?.getOptionalProperty("emitterWidth", "float")?.getValue() ?? 1.0;
        const soundName = args?.tiledObject?.getOptionalProperty("sound", "string")?.getValue() ?? "";

        const soundAssetIndex = getAssetIndexForName(soundName);
        let sound: Sound;
        if (soundAssetIndex !== -1) {
            sound = TiledSoundNode.sounds[soundAssetIndex].shallowClone();
        } else {
            throw new Error(`Sound '${soundName}' could not be loaded`);
        }

        super({ ...args, range, intensity, sound, emitterWidth });
        this.set3d();
    }
}
