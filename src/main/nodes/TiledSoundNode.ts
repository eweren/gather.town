/* import { asset } from "../../engine/assets/Assets";
import { Sound } from "../../engine/assets/Sound";
import { SoundNode, } from "../../engine/scene/SoundNode";
import { TiledSceneArgs } from "../../engine/scene/TiledMapNode";
import { Gather } from "../Gather";

const soundAssets = [
];
const soundMapping: {[index: string]: number} = {
    "surf": 0
};
function getAssetIndexForName(name: string): number {
    return soundMapping[name] ?? -1;
}

export class TiledSoundNode extends SoundNode<Gather> {
    @asset(soundAssets)
    private static sounds: Sound[];

    public constructor(args?: TiledSceneArgs) {
        const range = args?.tiledObject?.getOptionalProperty("range", "float")?.getValue() ?? 10.0;
        const intensity = args?.tiledObject?.getOptionalProperty("intensity", "float")?.getValue() ?? 1.0;
        const soundName = args?.tiledObject?.getOptionalProperty("sound", "string")?.getValue() ?? "";

        const soundAssetIndex = getAssetIndexForName(soundName);
        let sound: Sound;
        if (soundAssetIndex !== -1) {
            sound = TiledSoundNode.sounds[soundAssetIndex].shallowClone();
        } else {
            throw new Error(`Sound '${soundName}' could not be loaded`);
        }

        super({ ...args, range, intensity, sound });
    }
}
 */
