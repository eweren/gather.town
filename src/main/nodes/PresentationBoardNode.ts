import { Aseprite } from "../../engine/assets/Aseprite";
import { Direction } from "../../engine/geom/Direction";
import { SceneNodeArgs } from "../../engine/scene/SceneNode";
import { asset } from "../../engine/assets/Assets";
import { Gather } from "../Gather";
import { AsepriteNode } from "../../engine/scene/AsepriteNode";
import { LightNode } from "./LightNode";
import { Layer } from "../constants";
import { clamp } from "../../engine/util/math";
import { PresentationJSON } from "*.presentation.json";
import { TextNode } from "../../engine/scene/TextNode";

export enum PresentationBoardTags {
    IN = "in",
    ROLL_OUT = "rollout",
    ROLL_IN = "rollin",
    OUT = "out"
}

export class PresentationBoardNode extends AsepriteNode<Gather> {
    @asset("sprites/presentation.aseprite.json")
    private static readonly sprite: Aseprite;

    @asset(["sprites/presentations/demo.aseprite.json"])
    private static readonly presentations: Array<Aseprite>;
    private presentation?: Aseprite;

    public readonly boardId?: number;

    @asset("presentations/demo.presentation.json")
    private static presentationData: PresentationJSON;

    private headlineNode = new TextNode<Gather>({font: Gather.headlineFont, outlineColor: "grey"});
    private textNode = new TextNode<Gather>({font: Gather.standardFont,});

    private slideIndex = 0;

    private lightNode = new LightNode({x: this.x, y: this.y, width: PresentationBoardNode.sprite.width, height: PresentationBoardNode.sprite.height, anchor: Direction.CENTER, layer: Layer.LIGHT});
    private presentationIndex: number;
    private currentLine?: { slide: number; headline: string; subHeadline?: string, lines?: string[]; };

    public constructor(args: SceneNodeArgs) {
        super({
            aseprite: PresentationBoardNode.sprite,
            anchor: Direction.CENTER,
            tag: PresentationBoardTags.IN,
            ...args
        });
        this.boardId = args.tiledObject?.getOptionalProperty("boardId", "int")?.getValue();
        this.presentationIndex = args.tiledObject?.getOptionalProperty("presentation", "int")?.getValue() ?? 0;
        (window as any)["board"] = this;
    }

    public activate(): void {
        super.activate();
        this.presentation = PresentationBoardNode.presentations[this.presentationIndex];
        this.currentLine = PresentationBoardNode.presentationData[this.slideIndex];
    }

    public update(dt: number, time: number): void {
        super.update(dt, time);
        if (this.presentation == null) {
            this.setTag(PresentationBoardTags.IN);
        }
        if (this.getTimesPlayed(PresentationBoardTags.ROLL_IN) >= 1) {
            this.setTag(PresentationBoardTags.IN);
            this.lightNode.remove();
        }
        if (this.getTimesPlayed(PresentationBoardTags.ROLL_OUT) >= 1) {
            this.setTag(PresentationBoardTags.OUT);
            this.updateSlide();
            this.lightNode.appendTo(this.getScene()!.rootNode);
        }
        if (this.getTag() !== PresentationBoardTags.OUT) {
            this.updateSlide();
        }

    }

    public nextSlide(): void {
        if (this.presentation) {
            this.slideIndex = clamp(this.slideIndex + 1, 0, PresentationBoardNode.presentationData.length - 1);
            this.currentLine = PresentationBoardNode.presentationData[this.slideIndex];
            this.updateSlide();
        }
    }

    public previousSlide(): void {
        if (this.presentation) {
            this.slideIndex = clamp(this.slideIndex - 1, 0, this.slideIndex);
            this.currentLine = PresentationBoardNode.presentationData[this.slideIndex];
            this.updateSlide();
        }
    }

    private updateSlide(): void {
        if (this.currentLine == null || this.getTag() !== PresentationBoardTags.OUT) {
            this.headlineNode.remove();
            this.textNode.remove();
            return;
        }
        if (this.currentLine.headline) {
            this.headlineNode.moveTo(0, -10);
            this.headlineNode.setText(this.currentLine.headline);
            this.appendChild(this.headlineNode);
            if (this.currentLine.lines == null && this.currentLine.subHeadline) {
                this.textNode.setText(this.currentLine.subHeadline);
                this.textNode.moveTo(0, 10);
                this.appendChild(this.textNode);
            }
        } else {
            this.headlineNode.setText("");
            this.headlineNode.remove();
        }
        if (this.currentLine.lines != null) {
            if (this.currentLine.headline) {
                this.headlineNode.moveTo(0, -80);
            }
            this.textNode.setText(this.currentLine.lines.join("\n"));
            this.appendChild(this.textNode);
            this.textNode.moveTo(0, 0);
        } else if (this.currentLine.subHeadline == null) {
            this.textNode.setText("");
            this.textNode.remove();
        }
    }

    public startPresentation(startIndex = 0): void {
        if (this.getTag() !== PresentationBoardTags.OUT && this.getTag() !== PresentationBoardTags.ROLL_OUT) {
            this.slideIndex = startIndex;
            this.setTag(PresentationBoardTags.ROLL_OUT);
        }
    }

    public endPresentation(): void {
        if (this.getTag() !== PresentationBoardTags.IN && this.getTag() !== PresentationBoardTags.ROLL_IN) {
            this.setTag(PresentationBoardTags.ROLL_IN);
        }
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        super.draw(ctx);
        if (this.getTag() === PresentationBoardTags.OUT && this.currentLine) {
            this.presentation?.drawFrame(ctx, this.currentLine.slide, 0, 0);
        }
    }
}
