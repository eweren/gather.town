import { Game } from "../../engine/Game";
import { Direction } from "../../engine/geom/Direction";
import { ScenePointerDownEvent } from "../../engine/scene/events/ScenePointerDownEvent";
import { SceneNode } from "../../engine/scene/SceneNode";
import { TextNode } from "../../engine/scene/TextNode";
import { TiledSceneArgs } from "../../engine/scene/TiledMapNode";
import { clamp } from "../../engine/util/math";
import { Signal } from "../../engine/util/Signal";
import { Gather } from "../Gather";

export class TextInputNode<T extends Game = Game> extends SceneNode<T> {

    public active = false;
    public onTextSubmit = new Signal<string>();
    public onTextChange = new Signal<string>();
    private textNode = new TextNode<T>({ font: Gather.standardFont });
    public placeholderNode = new TextNode<T>({ font: Gather.standardFont, color: "grey" });
    private cursorPosition: number;
    private startTime = 0;

    public constructor(public text = "", public placeholder = "TYPE HERE", private maxLength?: number, private filterValues = true, args?: TiledSceneArgs) {
        super({ anchor: Direction.CENTER, childAnchor: Direction.CENTER, ...args });
        this.textNode.setText(text).appendTo(this);
        this.resizeTo(this.textNode.getWidth(), this.textNode.getHeight());
        this.updatePlaceholder();
        this.cursorPosition = text.length;
    }

    public focus(): void {
        this.getGame().keyboard.blockInput = this;
        this.getGame().keyboard.onKeyDown.connect(this.handleKeyPress, this);
        this.getScene()?.onPointerDown.connect(this.blur, this);
        this.placeholderNode.setColor("white");
        this.active = true;
    }

    public blur(): void {
        if (this.isInScene()) {
            this.getGame().keyboard.blockInput = undefined;
            this.getGame().keyboard.onKeyDown.disconnect(this.handleKeyPress, this);
            this.onTextSubmit.emit(this.text);
        }
        this.placeholderNode.setColor("grey");
        this.getScene()?.onPointerDown.disconnect(this.blur, this);
        this.active = false;
    }

    private updatePlaceholder(): void {
        if (this.text === "") {
            this.placeholderNode.setText(this.placeholder).appendTo(this);
            this.resizeTo(this.placeholderNode.getWidth(), this.placeholderNode.getHeight());
        } else if (this.placeholderNode.getParent() != null) {
            this.placeholderNode.remove();
        }
    }

    protected handlePointerDown(event: ScenePointerDownEvent<T>): void {
        super.handlePointerDown(event);
        const scenePosition = this.getScenePosition();
        const sceneBounds = this.getSceneBounds().toRect().translate(scenePosition.x, scenePosition.y - this.getSceneBounds().minY - this.height / 2);
        const eventPosition = event.getScreenPosition();
        const containsCursor = sceneBounds.containsPoint(eventPosition.x, eventPosition.y);
        if (this.active && !containsCursor) {
            this.blur();
        } else if (containsCursor && !this.active) {
            this.focus();
        }
    }

    private handleKeyPress(value: KeyboardEvent): void {
        value.stopImmediatePropagation();
        value.stopPropagation();
        value.preventDefault();
        if (value.key === "Backspace") {
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
        } else if ((!this.filterValues || isValidCharacter(value.key)) && (this.maxLength == null || this.text.length + 1 <= this.maxLength)) {
            this.text = this.text.substr(0, this.cursorPosition) + value.key + this.text.substr(this.cursorPosition);
            this.textNode.setText(this.text);
            this.cursorPosition = clamp(this.cursorPosition + 1, 0, this.text.length);
            this.onTextChange.emit(this.text);
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
    public setText(text: string): void {
        this.text = text;
        this.textNode.setText(text);
        this.updatePlaceholder();
    }
}

function isValidCharacter(str: string): boolean {
    return str.length === 1 && (/[\w\d\s]/g).test(str);
}
