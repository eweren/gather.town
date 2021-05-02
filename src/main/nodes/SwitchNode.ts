import { Aseprite } from "../../engine/assets/Aseprite";
import { Direction } from "../../engine/geom/Direction";
import { InteractiveNode } from "./InteractiveNode";
import { SceneNodeArgs } from "../../engine/scene/SceneNode";
import { Sound } from "../../engine/assets/Sound";
import { asset } from "../../engine/assets/Assets";
import { ControllerFamily } from "../../engine/input/ControllerFamily";

export interface SwitchNodeArgs extends SceneNodeArgs {
    onlyOnce?: boolean;
    spriteHidden?: boolean;
    onUpdate?: (state: boolean) => boolean | undefined;
}

export class SwitchNode extends InteractiveNode {
    @asset("sprites/wallLever.aseprite.json")
    private static readonly sprite: Aseprite;

    @asset("sprites/empty.aseprite.json")
    private static readonly noSprite: Aseprite;

    @asset("sounds/fx/breakerSwitch.ogg")
    private static readonly clickSound: Sound;

    @asset("sounds/fx/stuck.ogg")
    private static readonly stuckSound: Sound;

    private turnedOn: boolean = false;
    private onlyOnce: boolean;
    private stateChanges = 0;
    private onUpdate?: (state: boolean) => boolean | undefined;

    public constructor({ onlyOnce = false, onUpdate, spriteHidden = false, ...args }: SwitchNodeArgs) {
        super({
            aseprite: spriteHidden ? SwitchNode.noSprite : SwitchNode.sprite,
            anchor: Direction.CENTER,
            tag: "off",
            ...args
        }, "PRESS E TO PULL LEVER");
        this.onlyOnce = onlyOnce;
        this.onUpdate = onUpdate;
    }

    public update(dt: number, time: number): void {
        this.caption = `PRESS ${this.getGame().input.currentControllerFamily === ControllerFamily.GAMEPAD ? "Y" : "E"} TO PULL LEVER`;
        super.update(dt, time);
    }

    public setOnUpdate(func: (state: boolean) => boolean): void {
        this.onUpdate = func;
    }

    public setOnlyOnce(once: boolean): void {
        this.onlyOnce = once;
    }

    public interact(): void {
        if (this.canInteract()) {
            const newState = !this.turnedOn;
            if (!this.onUpdate || this.onUpdate(newState) !== false) {
                SwitchNode.clickSound.stop();
                SwitchNode.clickSound.play();
                this.turnedOn = newState;
                this.setTag(this.turnedOn ? "on" : "off");
                console.log(this, this.getTag(), this.turnedOn);
                this.stateChanges++;
            } else {
                // Switch blocked
                SwitchNode.stuckSound.stop();
                SwitchNode.stuckSound.play();
            }
        }
    }

    public canInteract(): boolean {
        return this.stateChanges === 0 || !this.onlyOnce;
    }

    public getTurnedOn(): boolean {
        return this.turnedOn;
    }

    // public draw(context: CanvasRenderingContext2D): void {
    //     // Render switch
    //     const offY = 0;
    //     context.fillStyle = "#666";
    //     context.fillRect(-4, offY - 4, 8, 8);
    //     context.fillStyle = this.turnedOn ? "#ff0000" : "#603030";
    //     context.fillRect(-3, offY - 3, 6, 6);

    //     super.draw(context);
    // }

}
