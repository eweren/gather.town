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
    public pasteInput?: HTMLInputElement;
    public url: string;
    private onUpdate?: (state: boolean) => boolean | undefined;
    private toStartString: string;
    private range: number;
    private needpasting: boolean;
    private backdrop?: HTMLDivElement;
    private closeBtn?: HTMLDivElement;
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
    }

    /** @inheritdoc */
    public activate(): void {
        this.closeBtn = document.getElementById("close-in-frame-btn") as HTMLDivElement;
    }

    /** @inheritdoc */
    public deactivate(): void {
        this.pasteInput?.remove();
        this.closeBtn?.removeEventListener("click", this.close.bind(this));
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
                this.open();
            }
            if (!this.onUpdate || this.onUpdate(newState) !== false) {
                this.inIFrame = newState;
                this.setTag(this.inIFrame ? "on" : "off");
            }
        }
    }

    public open(): void {
        this.getGame().pauseGame();
        this.iFrame = document.createElement("iframe");
        this.iFrame.src = this.url;
        this.iFrame.frameBorder = "0";
        this.iFrame.scrolling = "no";
        this.iFrame.allowFullscreen = true;
        this.iFrame.style.position = "absolute";
        this.iFrame.style.zIndex = "4000";
        this.iFrame.style.left = "0";
        this.iFrame.style.top = "0";
        this.iFrame.style.bottom = "0";
        this.iFrame.style.right = "0";
        this.iFrame.classList.add("in-frame");
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
        }
        if (this.closeBtn) {
            this.closeBtn.style.display = "flex";
            this.closeBtn.addEventListener("click", this.close.bind(this));
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
        this.getGame().pauseGame();
        setTimeout(() => {
            this.iFrame?.focus();
            this.iFrame?.ownerDocument.body.focus();
        }, 1000);
    }

    public close(): void {
        this.getGame().pauseGame();
        this.backdrop?.remove();
        this.iFrame?.remove();
        this.pasteInput?.remove();
        this.inIFrame = !this.inIFrame;
        this.getGame().pauseGame();

        if (this.closeBtn) {
            this.closeBtn.style.display = "none";
        }

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
