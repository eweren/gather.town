import { asset } from "../../engine/assets/Assets";
import { Sound } from "../../engine/assets/Sound";
import { Direction } from "../../engine/geom/Direction";
import { SceneNode } from "../../engine/scene/SceneNode";
import { TextNode } from "../../engine/scene/TextNode";
import { TiledSceneArgs } from "../../engine/scene/TiledMapNode";
import { Gather } from "../Gather";

export class NotificationNode extends SceneNode<Gather> {
    @asset("sounds/interface/back.mp3")
    private static notificationSound: Sound;

    private textNode = new TextNode<Gather>({ font: Gather.standardFont, anchor: Direction.TOP_RIGHT });
    private startTime?: number;
    private endTime?: number;
    private currentTime = 0;
    private currentX = 0;

    public constructor(private duration = 5, args?: TiledSceneArgs) {
        super({ anchor: Direction.TOP_RIGHT, childAnchor: Direction.TOP_RIGHT, ...args });
        this.textNode.appendTo(this);
        this.resizeTo(this.textNode.getWidth(), this.textNode.getHeight());
        (window as any)["notification"] = this;
    }

    public update(dt: number, time: number): void {
        super.update(dt, time);
        this.currentTime += dt;
        if (this.endTime && this.endTime < this.currentTime) {
            this.endTime = undefined;
            this.startTime = undefined;
            this.textNode.setText("");
            this.currentX = 0;
        } else if (this.startTime && this.currentTime <= this.startTime + 0.2) {
            this.currentX = (this.textNode.width + 10) * (1 - (this.currentTime - this.startTime) * 5);
            this.textNode.moveTo(this.currentX, 0);
        } else if (this.endTime && this.endTime - 0.2 <= this.currentTime) {
            this.currentX = (this.textNode.width + 10) * (1 - (this.endTime - this.currentTime) * 5);
            this.textNode.moveTo(this.currentX, 0);
        }
    }

    public showNotification(text: string, duration?: number): void {
        this.startTime = this.currentTime;
        this.endTime = this.startTime + (duration ?? this.duration);
        this.textNode.setText(text);
        this.resizeTo(this.textNode.getWidth(), this.textNode.getHeight());
        NotificationNode.notificationSound.setVolume(0.3);
        NotificationNode.notificationSound.play();
    }

    public draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
        if (this.startTime) {
            ctx.save();
            ctx.fillStyle = "#6e5e5e";
            ctx.fillRect(-4 + this.currentX, -2, this.textNode.width + 8, this.textNode.height + 4);
            super.draw(ctx, width, height);
            ctx.restore();
        }
    }

}
