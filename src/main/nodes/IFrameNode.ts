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

    private inIFrame: boolean = false;
    public url: string;
    private onUpdate?: (state: boolean) => boolean | undefined;
    private toStartString: string;
    private range: number;
    private needpasting: boolean;
    private pasteInput?: HTMLInputElement;
    private backdrop?: HTMLDivElement;
    private videos?: HTMLElement;
    private iFrame?: HTMLIFrameElement;

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
        this.needpasting = args.tiledObject?.getOptionalProperty("needpasting", "bool")?.getValue() ?? false;
        console.log(this.needpasting);
    }

    public deactivate() {
        this.pasteInput?.remove();
        super.deactivate();
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
            const newState = !this.inIFrame;
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
                if (this.needpasting) {
                    this.pasteInput = document.createElement("input");
                    this.pasteInput.addEventListener("keydown", (ev) => {
                        if (ev.key === "Enter") {
                            ev.preventDefault();
                            this.pasteInput?.blur();
                        }
                    });
                    this.pasteInput.addEventListener("blur", () => {
                        const copied = this.pasteInput?.value;
                        if (copied != null && copied !== "") {
                            this.getGame().sendCommand("IFrameUpdate", { originalUrl: this.url, newUrl: copied });
                            this.url = copied;
                        }
                        this.pasteInput?.remove();
                    });
                    this.pasteInput.style.position = "absolute";
                    this.pasteInput.placeholder = "Paste code here";
                    this.pasteInput.style.zIndex = "4001";
                    this.pasteInput.style.left = `calc(50% - ${this.pasteInput.width}px / 2)`;
                    this.pasteInput.style.top = "10px";
                    document.body.append(this.pasteInput);
                    console.log(this.pasteInput);
                }
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
                    this.inIFrame = !this.inIFrame;

                    if (videos) {
                        videos.style.zIndex = "1000";
                    }
                });
                document.body.append(backdrop);
                document.body.append(miroBoard);
            }
            if (!this.onUpdate || this.onUpdate(newState) !== false) {
                this.inIFrame = newState;
                this.setTag(this.inIFrame ? "on" : "off");
            }
        }
    }

    public open(): void {
        this.iFrame = document.createElement("iframe");
        this.iFrame.src = this.url;
        this.iFrame.frameBorder = "0";
        this.iFrame.scrolling = "no";
        this.iFrame.allowFullscreen = true;
        this.iFrame.height = this.getGame().canvas.height * this.getGame().canvasScale + "";
        this.iFrame.width = this.getGame().canvas.width * this.getGame().canvasScale + "";
        this.iFrame.style.position = "absolute";
        this.iFrame.style.zIndex = "4000";
        this.iFrame.style.left = `calc(50% - ${this.iFrame.width}px / 2)`;
        this.iFrame.style.top = `calc(50% - ${this.iFrame.height}px / 2)`;
        if (this.needpasting) {
            this.pasteInput = document.createElement("input");
            this.pasteInput.addEventListener("keydown", (ev) => {
                if (ev.key === "Enter") {
                    ev.preventDefault();
                    this.pasteInput?.blur();
                }
            });
            this.pasteInput.addEventListener("blur", () => {
                const copied = this.pasteInput?.value;
                if (copied != null && copied !== "") {
                    this.getGame().sendCommand("IFrameUpdate", { originalUrl: this.url, newUrl: copied });
                    this.url = copied;
                }
                this.pasteInput?.remove();
            });
            this.pasteInput.style.position = "absolute";
            this.pasteInput.placeholder = "Paste code here";
            this.pasteInput.style.zIndex = "4001";
            this.pasteInput.style.left = `calc(50% - ${this.pasteInput.width}px / 2)`;
            this.pasteInput.style.top = "10px";
            document.body.append(this.pasteInput);
            console.log(this.pasteInput);
        }
        this.videos = document.getElementById("videos") ?? undefined;
        if (this.videos) {
            this.videos.style.zIndex = "4001";
        }
        this.backdrop = document.createElement("div");
        this.backdrop.classList.add("backdrop");
        this.backdrop.addEventListener("click", (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            this.close();
        });
        document.body.append(this.backdrop);
        document.body.append(this.iFrame);
    }

    public close(): void {

        this.backdrop?.remove();
        this.iFrame?.remove();
        this.pasteInput?.remove();
        this.inIFrame = !this.inIFrame;

        if (this.videos) {
            this.videos.style.zIndex = "1000";
        }
    }

    public canInteract(): boolean {
        return !this.inIFrame && this.url !== "";
    }

    public isOpen(): boolean {
        return this.inIFrame;
    }

    protected getRange(): number {
        return this.range;
    }
}
