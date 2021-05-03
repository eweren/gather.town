import { Aseprite } from "../../engine/assets/Aseprite";
import { Direction } from "../../engine/geom/Direction";
import { SceneNodeArgs } from "../../engine/scene/SceneNode";
import { asset } from "../../engine/assets/Assets";
import { Gather } from "../Gather";
import { AsepriteNode } from "../../engine/scene/AsepriteNode";

export enum PresentationBoardTags {
    IDLE = "idle",
    ROLL_OUT = "rollout",
    ROLL_IN = "rollin",
    OUT = "out"
}

export class PresentationBoardNode extends AsepriteNode<Gather> {
    @asset("sprites/presentation.aseprite.json")
    private static readonly sprite: Aseprite;
    public readonly boardId?: number;
    private presentationFrameIndex = -1;
    @asset(["images/health-overlay.png", "images/start-overlay.png", "images/title-image.png"])
    private static frames: Array<HTMLImageElement>;

    public constructor(args: SceneNodeArgs) {
        super({
            aseprite: PresentationBoardNode.sprite,
            anchor: Direction.BOTTOM,
            tag: "off",
            ...args
        });
        this.boardId = args.tiledObject?.getOptionalProperty("boardId", "int")?.getValue();
        (window as any)["board"] = this;
    }

    public update(dt: number, time: number): void {
        if ((this.getTag() !== "idle" && this.getTag() !== PresentationBoardTags.OUT) && this.getTimesPlayed(this.getTag()) >= 1) {
            console.log(this.getTimesPlayed(this.getTag()) >= 1);
            this.setTag(this.getTag() === PresentationBoardTags.ROLL_IN ? PresentationBoardTags.IDLE : PresentationBoardTags.OUT);
        }
        super.update(dt, time);
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        super.draw(ctx);
        if (this.presentationFrameIndex > -1 && this.presentationFrameIndex < PresentationBoardNode.frames.length) {
            const frame = PresentationBoardNode.frames[this.presentationFrameIndex];
            ctx.drawImage(frame, 1, 1, this.width - 2, this.height - 2);
        }
    }
}
