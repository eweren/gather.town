
import { Aseprite } from "../../engine/assets/Aseprite";
import { asset } from "../../engine/assets/Assets";
import { getAudioContext, Sound } from "../../engine/assets/Sound";
import { Direction } from "../../engine/geom/Direction";
import { ControllerFamily } from "../../engine/input/ControllerFamily";
import { SoundNode, } from "../../engine/scene/SoundNode";
import { TiledSceneArgs } from "../../engine/scene/TiledMapNode";
import { Gather } from "../Gather";
import { InteractiveNode } from "./InteractiveNode";

export class SpeakerNode extends InteractiveNode {
    @asset("sprites/empty.aseprite.json")
    private static readonly noSprite: Aseprite;

    private sound?: Sound;
    private soundNode?: SoundNode<Gather>;
    private range: number;
    private intensity: number;
    private soundbox: number;
    private userId?: string;

    public constructor(args?: TiledSceneArgs) {
        super({
            aseprite: SpeakerNode.noSprite,
            anchor: Direction.CENTER,
            tag: "off",
            ...args
        }, "PRESS E TO START MUSIC");
        this.range = args?.tiledObject?.getOptionalProperty("range", "float")?.getValue() ?? 600.0;
        this.intensity = args?.tiledObject?.getOptionalProperty("intensity", "float")?.getValue() ?? 1;
        this.soundbox = args?.tiledObject?.getOptionalProperty("soundbox", "int")?.getValue() ?? -1;
    }

    public update(dt: number, time: number): void {
        this.caption = this.canInteractHere()
            ? `${this.getGame().input.currentControllerFamily === ControllerFamily.GAMEPAD ? "Y" : "E"} TO SHARE AUDIO`
            : this.userId ? (this.getGame().JitsiInstance?.room.getParticipantById(this.userId).getDisplayName() ?? "Anonymous") + " IS SHARING AUDIO" : "";
        super.update(dt, time);
    }

    public getSoundbox(): number {
        return this.soundbox;
    }

    public getSoundOfBox(): Sound | undefined {
        return this.sound;
    }

    public canInteractHere(): boolean {
        return this.soundNode == null;
    }

    public async interact(): Promise<void> {
        if (this.canInteractHere()) {
            const sharedId = await this.getGame().JitsiInstance?.shareTabAudio();
            if (sharedId) {
                this.getPlayer()?.setSpeakerNode({node: this, sharedId});
            }
        }
    }

    public setAudioStream(userId?: string, streamTrack?: MediaStreamTrack): void {
        this.userId = userId;
        if (streamTrack) {
            this.sound = new Sound(getAudioContext().createMediaStreamSource(new MediaStream([streamTrack])));
            this.soundNode = new SoundNode({ sound: this.sound, range: this.range, intensity: this.intensity, pauses: false });
            this.appendChild(this.soundNode);
        } else {
            this.sound = undefined;
            this.soundNode?.remove();
            this.soundNode = undefined;
        }
    }
}
