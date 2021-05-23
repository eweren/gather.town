import { Direction } from "../../engine/geom/Direction";
import { ScenePointerDownEvent } from "../../engine/scene/events/ScenePointerDownEvent";
import { SceneNode } from "../../engine/scene/SceneNode";
import { TextNode } from "../../engine/scene/TextNode";
import { TiledSceneArgs } from "../../engine/scene/TiledMapNode";
import { clamp } from "../../engine/util/math";
import { Signal } from "../../engine/util/Signal";
import { Gather } from "../Gather";

export class TextInputNode extends SceneNode<Gather> {

    public active = false;
    public onTextSubmit = new Signal<string>();
    public onTextChange = new Signal<string>();
    private textNode = new TextNode<Gather>({ font: Gather.standardFont });
    public placeholderNode = new TextNode<Gather>({ font: Gather.standardFont, color: "grey" });
    private cursorPosition: number;
    private startTime = 0;

    public constructor(public text = "", public placeholder = "TYPE HERE", private maxLength?: number, args?: TiledSceneArgs) {
        super({ anchor: Direction.CENTER, ...args });
        this.textNode.setText(text).appendTo(this);
        this.resizeTo(this.textNode.getWidth(), this.textNode.getHeight());
        this.updatePlaceholder();
        this.cursorPosition = text.length;
    }

    public focus(): void {
        this.getGame().keyboard.blockInput = this;
        this.getGame().keyboard.onKeyDown.connect(this.handleKeyPress, this);
        this.getScene()?.onPointerDown.connect(this.blur, this);
        this.placeholderNode.setColor("grey");
        this.active = true;
    }

    public blur(): void {
        this.getGame().keyboard.blockInput = undefined;
        this.getGame().keyboard.onKeyDown.disconnect(this.handleKeyPress, this);
        this.getScene()?.onPointerDown.disconnect(this.blur, this);
        this.active = false;
        this.onTextSubmit.emit(this.text);
    }

    private updatePlaceholder(): void {
        if (this.text === "") {
            this.placeholderNode.setText(this.placeholder).appendTo(this);
            this.resizeTo(this.placeholderNode.getWidth(), this.placeholderNode.getHeight());
            console.log("SHOULD BE ATTACHED");
        } else if (this.placeholderNode.getParent() != null) {
            this.placeholderNode.remove();
        }
    }

    protected handlePointerDown(event: ScenePointerDownEvent): void {
        super.handlePointerDown(event);
        if (this.active) {
            this.blur();
        } else {
            this.focus();
        }
    }

    private handleKeyPress(value: KeyboardEvent): void {
        value.stopImmediatePropagation();
        value.stopPropagation();
        value.preventDefault();
        if (isValidCharacter(value.key) && (this.maxLength == null || this.text.length + 1 <= this.maxLength)) {
            this.text = this.text.substr(0, this.cursorPosition) + value.key + this.text.substr(this.cursorPosition);
            this.textNode.setText(this.text);
            this.cursorPosition = clamp(this.cursorPosition + 1, 0, this.text.length);
            this.onTextChange.emit(this.text);
        } else if (value.key === "Backspace") {
            this.text = this.text.substr(0, this.cursorPosition - 1) + this.text.substr(this.cursorPosition);
            this.cursorPosition = clamp(this.cursorPosition - 1, 0, this.text.length);
            this.textNode.setText(this.text);
            this.onTextChange.emit(this.text);
        } else if (value.key === "ArrowLeft") {
            this.cursorPosition = clamp(this.cursorPosition - 1, 0, this.text.length);
        } else if (value.key === "ArrowRight") {
            this.cursorPosition = clamp(this.cursorPosition + 1, 0, this.text.length);
        } else if (value.key === "Enter") {
            this.blur();
        }
        this.resizeTo(this.textNode.getWidth(), this.textNode.getHeight());
        this.updatePlaceholder();
    }

    public update(dt: number, time: number): void {
        super.update(dt, time);
        this.startTime += dt;
    }

    public draw(ctx: CanvasRenderingContext2D ,width: number, height: number): void {
        super.draw(ctx, width, height);
        if (this.active && Math.round(this.startTime) % 2 === 0) {
            ctx.save();
            ctx.fillStyle = "white";
            let { width } = Gather.standardFont.measureText(this.text.substr(0, this.cursorPosition));
            if (this.text === "") {
                width = this.getWidth() / 2;
            }
            ctx.fillRect(Math.round(width), Gather.standardFont.charHeight * 0.1, 1, Math.round(Gather.standardFont.charHeight * 0.8));
            ctx.restore();
        }
    }
}

function isValidCharacter(str: string): boolean {
    return str.length === 1 && (/[\w\d\s]/g).test(str);
}
