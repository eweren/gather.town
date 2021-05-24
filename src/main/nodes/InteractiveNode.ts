
import { asset } from "../../engine/assets/Assets";
import { BitmapFont } from "../../engine/assets/BitmapFont";
import { AsepriteNode, AsepriteNodeArgs } from "../../engine/scene/AsepriteNode";
import { TextNode } from "../../engine/scene/TextNode";
import { clamp } from "../../engine/util/math";
import { Layer, STANDARD_FONT } from "../constants";
import { Gather } from "../Gather";
import { CharacterNode } from "./CharacterNode";
import { PlayerNode } from "./PlayerNode";

export abstract class InteractiveNode extends AsepriteNode<Gather> {
    @asset(STANDARD_FONT)
    private static readonly font: BitmapFont;

    private target: CharacterNode | null = null;
    protected caption: string;
    private captionOpacity = 0;
    protected hideSprite = false;
    private textNode: TextNode;

    public constructor(args: AsepriteNodeArgs, caption: string = "") {
        super(args);
        this.caption = caption;

        this.textNode = new TextNode({
            font: InteractiveNode.font,
            color: "white",
            outlineColor: "black",
            y: 20,
            layer: Layer.OVERLAY
        }).appendTo(this);
    }

    public setCaption(caption: string): void {
        this.caption = caption;
    }

    protected getRange(): number {
        return 50;
    }

    public update(dt: number, time: number): void {
        let target = null;
        if (this.canInteract()) {
            const player = this.getPlayer();
            if (player) {
                const dis = player.getScenePosition().getSquareDistance(this.getScenePosition());
                if (dis < this.getRange() ** 2) {
                    target = player;
                }
            }
        }
        this.setTarget(target);

        if (this.target) {
            this.captionOpacity = clamp(this.captionOpacity + dt * 2, 0, 1);
        } else {
            this.captionOpacity = clamp(this.captionOpacity - dt * 2, 0, 1);
        }

        this.textNode.setOpacity(this.captionOpacity);
        this.textNode.setText(this.captionOpacity > 0 ? this.caption : "");
        super.update(dt, time);
    }

    protected isInRange(): boolean {
        return !!this.target;
    }

    public abstract interact(): void;
    public reverseInteract(): void {}

    public canInteract(): boolean {
        return true;
    }

    private setTarget(target: CharacterNode | null): void {
        if (target !== this.target) {
            if (this.target) {
                this.target.unregisterInteractiveNode(this);
            }
            this.target = target;
            if (this.target) {
                this.target.registerInteractiveNode(this);
            }
        }
    }

    public getTarget(): CharacterNode | null {
        return this.target;
    }

    protected getPlayer(): PlayerNode | undefined {
        return this.getScene()?.rootNode.getDescendantsByType<PlayerNode>(PlayerNode)[0];
    }

    public draw(context: CanvasRenderingContext2D): void {
        if (!this.hideSprite) {
            super.draw(context);
        }
    }
}
