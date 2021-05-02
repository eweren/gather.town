import { Aseprite } from "../assets/Aseprite";
import { Game } from "../Game";
import { Rect } from "../geom/Rect";
import { Polygon2 } from "../graphics/Polygon2";
import { SceneNode, SceneNodeArgs, SceneNodeAspect } from "./SceneNode";

/**
 * Constructor arguments for [[AsepriteNode]].
 */
export interface AsepriteNodeArgs extends SceneNodeArgs {
    /** The Aseprite to display. */
    aseprite: Aseprite;

    /** Optional animation tag to draw. */
    tag?: string;

    /** Optional initial X mirroring of the sprite. */
    mirrorX?: boolean;

    /** Optional forced source bounds. If not set then bounds are read from the sprite. */
    sourceBounds?: Rect;
}

/**
 * Scene node for displaying an [[Aseprite]].
 *
 * @param T - Optional owner game class.
 */
export class AsepriteNode<T extends Game = Game> extends SceneNode<T> {
    /** The displayed aseprite. */
    private aseprite: Aseprite;

    /** The animation tag to draw. Null to draw whole animation. */
    private tag: string | null;

    /** Counter how often a tag was played. */
    private timesTagPlayed = 0;

    /** The current time index of the animation. */
    private time = 0;

    private mirrorX: boolean;
    private tagPlayTime = 0;
    private tagStartTime = 0;

    /** Forcers source bounds. Null to read bounds from sprite. */
    private sourceBounds: Rect | null;

    /**
     * Creates a new scene node displaying the given Aseprite.
     */
    public constructor({ aseprite, sourceBounds, ...args }: AsepriteNodeArgs) {
        super({
            ...args,
            width: aseprite.width,
            height: aseprite.height,
        });
        this.aseprite = aseprite;
        this.tag = args.tag ?? null;
        this.mirrorX = args.mirrorX ?? false;
        this.sourceBounds = sourceBounds ?? null;
    }

    /** @inheritDoc */
    protected updateBoundsPolygon(bounds: Polygon2): void {
        if (this.sourceBounds != null) {
            bounds.addRect(this.sourceBounds);
        } else {
            if (this.aseprite.hasTag("bounds")) {
                bounds.addRect(this.aseprite.getTaggedSourceBounds("bounds", 0));
            } else if (this.tag != null) {
                bounds.addRect(this.aseprite.getTaggedSourceBounds(this.tag, this.time * 1000));
            } else {
                bounds.addRect(this.aseprite.getSourceBounds(this.time * 1000));
            }
        }
    }

    /**
     * Returns the displayed Aseprite.
     *
     * @return The displayed Aseprite.
     */
    public getAseprite(): Aseprite {
        return this.aseprite;
    }

    /**
     * Sets the Aseprite.
     *
     * @param aseprite - The Aseprite to draw.
     */
    public setAseprite(aseprite: Aseprite): this {
        if (aseprite !== this.aseprite) {
            this.aseprite = aseprite;
            this.resizeTo(aseprite.width, aseprite.height);
            this.invalidate(SceneNodeAspect.RENDERING);
        }
        return this;
    }

    /**
     * Returns the current animation tag. Null if whole animation is displayed.
     *
     * @return The current animation tag or null for whole animation.
     */
    public getTag(): string | null {
        return this.tag;
    }

    /**
     * Sets the animation tag. Null to display whole animation.
     *
     * @param tag - The animation tag to set. Null to unset.
     */
    public setTag(tag: string | null): this {
        if (tag !== this.tag) {
            this.tag = tag;
            this.invalidate(SceneNodeAspect.RENDERING);
            if (this.tag) {
                this.timesTagPlayed = 0;
                this.tagPlayTime = this.aseprite.getAnimationDurationByTag(this.tag);
                this.tagStartTime = 0;
                this.time = 0;
            }
        }
        return this;
    }

    public getTimesPlayed(tag: string | null): number {
        if (tag != null && tag === this.tag) {
            return this.timesTagPlayed;
        }

        return 0;
    }

    public setMirrorX(mirrorX: boolean): this {
        if (mirrorX !== this.mirrorX) {
            this.mirrorX = mirrorX;
            this.invalidate(SceneNodeAspect.RENDERING);
        }
        return this;
    }

    public isMirrorX(): boolean {
        return this.mirrorX;
    }

    /** @inheritDoc */
    public update(dt: number, time: number) {
        this.time += dt;
    }

    /** @inheritDoc */
    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        if (this.mirrorX) {
            ctx.translate(this.aseprite.width, 0);
            ctx.scale(-1, 1);
        }
        if (this.tag != null) {
            if (this.tagPlayTime > 0) {
                // Calculate the times the tag was played since tagStartTime.
                this.timesTagPlayed = Math.floor((50 + (this.time - this.tagStartTime) * 1000) / this.tagPlayTime);
            }
            this.aseprite.drawTag(ctx, this.tag, 0, 0, this.time * 1000);
        } else {
            this.aseprite.draw(ctx, 0, 0, this.time * 1000);
        }
        ctx.restore();
    }
}
