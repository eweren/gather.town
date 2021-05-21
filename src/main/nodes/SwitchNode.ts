import { Aseprite } from "../../engine/assets/Aseprite";
import { Direction } from "../../engine/geom/Direction";
import { InteractiveNode } from "./InteractiveNode";
import { SceneNodeArgs } from "../../engine/scene/SceneNode";
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
        }, "PRESS E TO START MIRO");
        this.onlyOnce = onlyOnce;
        this.onUpdate = onUpdate;
    }

    public update(dt: number, time: number): void {
        this.caption = `PRESS ${this.getGame().input.currentControllerFamily === ControllerFamily.GAMEPAD ? "Y" : "E"} TO START MIRO`;
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
            if (newState) {
                const miroBoard = document.createElement("iframe");
                miroBoard.src = "https://miro.com/app/live-embed/o9J_lGBRCiU=/?moveToViewport=-717,-438,1433,876";
                miroBoard.frameBorder = "0";
                miroBoard.scrolling = "no";
                miroBoard.allowFullscreen = true;
                miroBoard.height = this.getGame().canvas.height * this.getGame().canvasScale + "";
                miroBoard.width = this.getGame().canvas.width * this.getGame().canvasScale + "";
                miroBoard.style.position = "absolute";
                miroBoard.style.zIndex = "4000";
                miroBoard.style.left = `calc(50% - ${miroBoard.width}px / 2)`;
                miroBoard.style.top = `calc(50% - ${miroBoard.height}px / 2)`;
                const videos = document.getElementById("videos");
                if (videos) {
                    videos.style.zIndex = "4001";
                }
                const backdrop = document.createElement("div");
                backdrop.classList.add("backdrop");
                backdrop.addEventListener("click", (ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    backdrop.remove();
                    miroBoard.remove();
                    this.turnedOn = !this.turnedOn;

                    if (videos) {
                        videos.style.zIndex = "1000";
                    }
                });
                document.body.append(backdrop);
                document.body.append(miroBoard);
            }
            if (!this.onUpdate || this.onUpdate(newState) !== false) {
                this.turnedOn = newState;
                this.setTag(this.turnedOn ? "on" : "off");
                this.stateChanges++;
            }
        }
    }

    public canInteract(): boolean {
        return this.stateChanges === 0 || !this.onlyOnce;
    }

    public getTurnedOn(): boolean {
        return this.turnedOn;
    }

}
