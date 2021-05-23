import { Aseprite } from "../../engine/assets/Aseprite";
import { Direction } from "../../engine/geom/Direction";
import { SceneNodeArgs } from "../../engine/scene/SceneNode";
import { asset } from "../../engine/assets/Assets";
import { InteractiveNode } from "./InteractiveNode";
import { ControllerFamily } from "../../engine/input/ControllerFamily";

export class CatNode extends InteractiveNode {
    @asset("sprites/cat.aseprite.json")
    private static readonly sprite: Aseprite;

    public constructor(args: SceneNodeArgs) {
        super({
            aseprite: CatNode.sprite,
            anchor: Direction.CENTER,
            tag: "idle",
            ...args
        }, "PRESS E TO PET");
    }

    protected getRange(): number {
        return 40;
    }

    public update(dt: number, time: number): void {
        this.caption = `PRESS ${this.getGame().input.currentControllerFamily === ControllerFamily.GAMEPAD ? "Y" : "E"}` + (this.getPlayer()?.isPetting() ? " TO STOP" : " TO PET");
        if (!this.isInRange() && this.getPlayer()?.isPetting()) {
            this.getPlayer()?.stopPetting();
        }
        super.update(dt, time);
    }

    public interact(): void {
        if (this.getPlayer()?.isPetting()) {
            this.getPlayer()?.stopPetting();
        } else {
            this.getPlayer()?.startPetting();
        }
    }
}
