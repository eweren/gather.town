import { asset } from "../../engine/assets/Assets";
import { Direction } from "../../engine/geom/Direction";
import { ScenePointerDownEvent } from "../../engine/scene/events/ScenePointerDownEvent";
import { ScenePointerMoveEvent } from "../../engine/scene/events/ScenePointerMoveEvent";
import { ImageNode } from "../../engine/scene/ImageNode";
import { SceneNode, SceneNodeArgs } from "../../engine/scene/SceneNode";
import { Gather } from "../Gather";

export class JitsiControlsNode extends SceneNode<Gather> {

    @asset("images/screenshare.png")
    public static ScreenShareImage: HTMLImageElement;

    @asset("images/settings.png")
    public static SettingsImage: HTMLImageElement;

    private shareScreenNode = new ImageNode<Gather>({ image: JitsiControlsNode.ScreenShareImage, anchor: Direction.LEFT, x: 0 });
    private settingsNode = new ImageNode<Gather>({ image: JitsiControlsNode.SettingsImage, anchor: Direction.LEFT, x: JitsiControlsNode.SettingsImage.width + 4 });
    private previousCursor?: string;

    public constructor(args?: SceneNodeArgs) {
        super({ anchor: Direction.CENTER, childAnchor: Direction.LEFT, backgroundColor: "#666a", padding: 4,  ...args });
    }

    public update(dt: number, time: number): void {
        super.update(dt, time);
        if (this.isHoverOver && this.getGame().canvas.style.cursor !== "pointer") {
            this.previousCursor = this.getGame().canvas.style.cursor;
            this.getGame().canvas.style.cursor = "pointer";
        } else if (this.previousCursor != null && !this.isHoverOver) {
            this.getGame().canvas.style.cursor = this.previousCursor;
            this.previousCursor = undefined;
        }
    }

    protected handlePointerDown(event: ScenePointerDownEvent<Gather>): void {
        let { x, y } = event.getScreenPosition();
        if (this.containsPoint(x, y) && event.getButton() === 0) {
            x -= this.getLeft();
            y -= this.getTop();
            if (this.shareScreenNode.containsPoint(x, y)) {
                this.getGame().JitsiInstance?.switchVideo();
            } else if (this.settingsNode.containsPoint(x, y)) {
                // TODO: Show drop-down or select like input
            }
            super.handlePointerDown(event);
        }
    }

    protected handlePointerMove(event: ScenePointerMoveEvent): void {
        const { x, y } = event.getScreenPosition();
        const isHoverOver = this.containsPoint(x, y);
        if (this.isHoverOver !== isHoverOver) {
            this.onHoverOverChange.emit(isHoverOver);
            this.isHoverOver = isHoverOver;
        }
    }

    public activate(): void {
        this.appendChild(this.shareScreenNode);
        this.appendChild(this.settingsNode);
        const width = this.settingsNode.width + 4 + this.shareScreenNode.width;
        this.resizeTo(width, this.shareScreenNode.height);
        super.activate();
    }
}
