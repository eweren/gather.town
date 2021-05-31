import { Aseprite } from "../../engine/assets/Aseprite";
import { Direction } from "../../engine/geom/Direction";
import { SceneNodeArgs } from "../../engine/scene/SceneNode";
import { asset } from "../../engine/assets/Assets";
import { Gather } from "../Gather";
import { AsepriteNode } from "../../engine/scene/AsepriteNode";
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

    @asset([
        "presentations/demo.presentation.json",
        "presentations/cloud.presentation.json"
    ])
    private static presentationData: Array<PresentationJSON>;
    private presentationData: PresentationJSON;

    private headlineNode = new TextNode<Gather>({ font: Gather.headlineFont, outlineColor: "grey", anchor: Direction.CENTER });
    private textNode = new TextNode<Gather>({ font: Gather.standardFont, anchor: Direction.CENTER });
    private controlsNode = new TextNode<Gather>({ font: Gather.standardFont, text: "→ next\n← previous\nQ quit", anchor: Direction.TOP_LEFT});

    public slideIndex = 0;

    private presentationIndex: number;
    private currentLine?: { slide: number; headline: string; subHeadline?: string, lines?: string[]; };
    private isPresenter = false;
    private canvasScale = 1;

    public constructor(args: SceneNodeArgs) {
        super({
            aseprite: PresentationBoardNode.sprite,
            anchor: Direction.TOP_LEFT,
            childAnchor: Direction.TOP_LEFT,
            tag: PresentationBoardTags.IN,
            ...args
        });
        this.boardId = args.tiledObject?.getOptionalProperty("boardId", "int")?.getValue();
        this.presentationIndex = args.tiledObject?.getOptionalProperty("presentation", "int")?.getValue() ?? 0;
        this.presentationData = PresentationBoardNode.presentationData[this.presentationIndex];
        (window as any)["board"] = this;
    }

    public activate(): void {
        super.activate();
        this.presentation = PresentationBoardNode.presentations[clamp(this.presentationIndex, 0, PresentationBoardNode.presentations.length - 1)];
        this.currentLine = this.presentationData[this.slideIndex];
        this.setLayer(Layer.OVERLAY);
        this.getScene()?.onResize.connect(this.updatePosition, this);
    }

    public deactivate(): void {
        this.getScene()?.onResize.disconnect(this.updatePosition, this);
    }

    public update(dt: number, time: number): void {
        super.update(dt, time);
        if (this.presentation == null) {
            this.setTag(PresentationBoardTags.IN);
        }
        if (this.getTimesPlayed(PresentationBoardTags.ROLL_IN) >= 1) {
            this.setTag(PresentationBoardTags.IN);
        }
        if (this.getTimesPlayed(PresentationBoardTags.ROLL_OUT) >= 1) {
            this.setTag(PresentationBoardTags.OUT);
            this.updateSlide();
        }
        if (this.getTag() !== PresentationBoardTags.OUT) {
            this.updateSlide();
        }

    }

    public nextSlide(): void {
        if (this.presentation) {
            this.slideIndex = clamp(this.slideIndex + 1, 0, this.presentationData.length - 1);
            this.currentLine = this.presentationData[this.slideIndex];
            this.updateSlide();
            this.getGame().sendCommand("presentationUpdate", { presentationBoardId: this.boardId, slide: this.slideIndex });
        }
    }

    public previousSlide(): void {
        if (this.presentation) {
            this.slideIndex = clamp(this.slideIndex - 1, 0, this.slideIndex);
            this.currentLine = this.presentationData[this.slideIndex];
            this.updateSlide();
            this.getGame().sendCommand("presentationUpdate", { presentationBoardId: this.boardId, slide: this.slideIndex });
        }
    }

    public setSlide(slideIndex: number) {
        if (this.presentation) {
            this.slideIndex = clamp(slideIndex, 0, this.presentationData.length - 1);
            this.currentLine = this.presentationData[this.slideIndex];
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
            this.headlineNode.moveTo(this.width / 2 / this.canvasScale, (this.height / 2 / this.canvasScale) -10);
            this.headlineNode.setText(this.currentLine.headline);
            this.appendChild(this.headlineNode);
            if (this.currentLine.lines == null && this.currentLine.subHeadline) {
                this.textNode.setText(this.currentLine.subHeadline);
                this.textNode.moveTo(this.width / 2 / this.canvasScale, (this.height / 2 / this.canvasScale) + 10);
                this.appendChild(this.textNode);
            }
        } else {
            this.headlineNode.setText("");
            this.headlineNode.remove();
        }
        if (this.currentLine.lines != null) {
            if (this.currentLine.headline) {
                this.headlineNode.moveTo(this.width / 2 / this.canvasScale, (this.height / 2 / this.canvasScale) -80);
            }
            this.textNode.setText(this.currentLine.lines.join("\n"));
            this.appendChild(this.textNode);
            this.textNode.moveTo(this.width / 2 / this.canvasScale, (this.height / 2 / this.canvasScale));
        } else if (this.currentLine.subHeadline == null) {
            this.textNode.setText("");
            this.textNode.remove();
        }
    }

    public startPresentation(startIndex = 0, isPresenter = false): void {
        if (this.getTag() !== PresentationBoardTags.OUT && this.getTag() !== PresentationBoardTags.ROLL_OUT) {
            this.updatePosition();
            this.slideIndex = startIndex;
            this.setTag(PresentationBoardTags.ROLL_OUT);
            if (isPresenter) {
                this.appendChild(this.controlsNode);
                this.controlsNode.moveTo(this.getWidth() + 4, 0);
            }
            this.isPresenter = isPresenter;
        }
    }

    private updatePosition(): void {
        const widthRatio = window.innerWidth / (this.width / this.scale) / 2;
        const heightRatio = window.innerHeight / (this.height / this.scale) / 2;
        const minRatio = Math.floor(Math.min(widthRatio, heightRatio));
        console.log(minRatio);
        this.scaleBy(minRatio);
        this.canvasScale = minRatio;
        this.moveTo((this.getScene()!.rootNode.width - this.width) / 2, (this.getScene()!.rootNode.height - this.height) / 2);
    }

    public endPresentation(): void {
        if (this.getTag() !== PresentationBoardTags.IN && this.getTag() !== PresentationBoardTags.ROLL_IN) {
            this.setTag(PresentationBoardTags.ROLL_IN);
        }
        if (this.isPresenter) {
            this.controlsNode.remove();
        }
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        super.draw(ctx);
        if (this.getTag() === PresentationBoardTags.OUT && this.currentLine) {
            this.presentation?.drawFrame(ctx, this.currentLine.slide, 0, 0);
        }
    }
}
