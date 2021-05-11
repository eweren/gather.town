import { Aseprite } from "../../engine/assets/Aseprite";
import { Direction } from "../../engine/geom/Direction";
import { InteractiveNode } from "./InteractiveNode";
import { SceneNodeArgs } from "../../engine/scene/SceneNode";
import { asset } from "../../engine/assets/Assets";
import { ControllerFamily } from "../../engine/input/ControllerFamily";

export interface IFrameNodeArgs extends SceneNodeArgs {
    onUpdate?: (state: boolean) => boolean | undefined;
}

export class IFrameNode extends InteractiveNode {
    @asset("sprites/empty.aseprite.json")
    private static readonly noSprite: Aseprite;

    private inMiro: boolean = false;
    private url: string;
    private onUpdate?: (state: boolean) => boolean | undefined;
    private toStartString: string;
    private range: number;

    public constructor({ onUpdate, ...args }: IFrameNodeArgs) {
        super({
            aseprite: IFrameNode.noSprite,
            anchor: Direction.CENTER,
            tag: "off",
            ...args
        }, "PRESS E TO INTERACT");
        this.onUpdate = onUpdate;
        this.url = args.tiledObject?.getOptionalProperty("url", "string")?.getValue() ?? "";
        this.toStartString = args.tiledObject?.getOptionalProperty("startstring", "string")?.getValue() ?? "TO INTERACT";
        this.range = args.tiledObject?.getOptionalProperty("range", "int")?.getValue() ?? 30;
    }

    public update(dt: number, time: number): void {
        this.caption = `PRESS ${this.getGame().input.currentControllerFamily === ControllerFamily.GAMEPAD ? "Y" : "E"} ${this.toStartString}`;
        super.update(dt, time);
    }

    public setOnUpdate(func: (state: boolean) => boolean): void {
        this.onUpdate = func;
    }

    public interact(): void {
        if (this.canInteract()) {
            const newState = !this.inMiro;
            if (newState) {
                const miroBoard = document.createElement("iframe");
                miroBoard.src = this.url;
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
                    this.inMiro = !this.inMiro;

                    if (videos) {
                        videos.style.zIndex = "1000";
                    }
                });
                document.body.append(backdrop);
                document.body.append(miroBoard);
            }
            if (!this.onUpdate || this.onUpdate(newState) !== false) {
                this.inMiro = newState;
                this.setTag(this.inMiro ? "on" : "off");
            }
        }
    }

    public canInteract(): boolean {
        return !this.inMiro && this.url !== "";
    }

    protected getRange(): number {
        return this.range;
    }
}
