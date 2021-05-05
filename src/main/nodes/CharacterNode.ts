import { asset } from "../../engine/assets/Assets";
import { BitmapFont } from "../../engine/assets/BitmapFont";
import { SimpleDirection } from "../../engine/geom/Direction";
import { Vector2 } from "../../engine/graphics/Vector2";
import { AsepriteNode, AsepriteNodeArgs } from "../../engine/scene/AsepriteNode";
import { cacheResult } from "../../engine/util/cache";
import { clamp } from "../../engine/util/math";
import { rnd } from "../../engine/util/random";
import { Layer, STANDARD_FONT } from "../constants";
import { Gather } from "../Gather";
import { CollisionNode } from "./CollisionNode";
import { DialogNode } from "./DialogNode";
import { InteractiveNode } from "./InteractiveNode";
import { NpcNode } from "./NpcNode";
import { ParticleNode, valueCurves } from "./ParticleNode";

export enum PreCharacterTags {
    FRONT = "Front",
    BACK = "Back",
    RIGHT = "Right",
    LEFT = "Left"
}

export enum PostCharacterTags {
    WALK = "walk",
    IDLE = "idle",
    DANCE = "dance"
}

export abstract class CharacterNode extends AsepriteNode<Gather> {

    @asset(STANDARD_FONT)
    private static readonly dialogFont: BitmapFont;

    private gameTime = 0;
    private preTag: PreCharacterTags = PreCharacterTags.FRONT;

    // Character settings
    public abstract getSpeed(): number;
    public abstract getAcceleration(): number;
    public abstract getDeceleration(): number;

    public inConversation = false;
    public isPlayer = false;
    protected isBot = false;
    public isRunning = false;

    // Dynamic player state
    protected updateTime = 0;
    protected direction: SimpleDirection = SimpleDirection.NONE;
    protected velocity: Vector2;
    protected debug = false;
    private canInteractWith: InteractiveNode | NpcNode | null = null;
    protected consecutiveXCollisions = 0;
    protected consecutiveYCollisions = 0;

    // Talking/Thinking
    private speakSince = 0;
    private speakUntil = 0;
    private speakLine = "";

    protected sparkEmitter: ParticleNode;
    private particleOffset: Vector2 = new Vector2(0, 0);
    private particleAngle = 0;

    private dialogNode: DialogNode;

    public constructor(args: AsepriteNodeArgs) {
        super(args);
        this.velocity = new Vector2(0, 0);
        // this.setShowBounds(true);
        this.sparkEmitter = new ParticleNode({
            offset: () => this.particleOffset,
            velocity: () => {
                const speed = rnd(40, 80);
                const angle = this.particleAngle + Math.PI + rnd(-1, 1) * rnd(0, Math.PI / 2) * rnd(0, 1) ** 2;
                return {
                    x: speed * Math.cos(angle),
                    y: speed * Math.sin(angle)
                };
            },
            color: () => {
                const g = rnd(130, 255), r = g + rnd(rnd(255 - g)), b = rnd(g);
                return `rgb(${r}, ${g}, ${b})`;
            },
            size: rnd(0.7, 1.8),
            gravity: {x: 0, y: -100},
            lifetime: () => rnd(0.5, 0.9),
            alphaCurve: valueCurves.trapeze(0.05, 0.2)
        }).appendTo(this);

        this.dialogNode = new DialogNode({
            font: CharacterNode.dialogFont,
            color: "white",
            outlineColor: "black",
            y: -30,
            layer: Layer.OVERLAY
        }).appendTo(this);
    }

    public update(dt: number, time: number): void {
        super.update(dt, time);
        this.gameTime = time;
        this.updateTime = time;

        // Acceleration
        let vx = 0;
        let vy = 0;
        if (this.direction !== SimpleDirection.NONE) {
            // Accelerate
            switch(this.direction) {
                case SimpleDirection.LEFT:
                    vx = clamp(this.velocity.x - this.getAcceleration() * dt,
                            -this.getSpeed(), this.getSpeed());
                    this.setPreTag(PreCharacterTags.LEFT);
                    this.setTag(PostCharacterTags.WALK);
                    break;
                case SimpleDirection.RIGHT:
                    vx = clamp(this.velocity.x + this.getAcceleration() * dt,
                            -this.getSpeed(), this.getSpeed());
                    this.setPreTag(PreCharacterTags.RIGHT);
                    this.setTag(PostCharacterTags.WALK);
                    break;
                case SimpleDirection.TOP:
                    vy = clamp(this.velocity.y - this.getAcceleration() * dt,
                            -this.getSpeed(), this.getSpeed());
                    this.setTag(PostCharacterTags.WALK);
                    break;
                case SimpleDirection.BOTTOM:
                    vy = clamp(this.velocity.y + this.getAcceleration() * dt,
                            -this.getSpeed(), this.getSpeed());
                    this.setTag(PostCharacterTags.WALK);
                    break;
            }
        } else {
            // Brake down
            if (this.getTag() !== PostCharacterTags.DANCE) {
                this.setTag(PostCharacterTags.IDLE);
            }
            if (this.velocity.x > 0) {
                vx = clamp(this.velocity.x * this.getDeceleration() * dt, 0, Infinity);
            } else {
                vx = clamp(this.velocity.x * this.getDeceleration() * dt, -Infinity, 0);
            }
            if (this.velocity.y > 0) {
                vy = clamp(this.velocity.y * this.getDeceleration() * dt, 0, Infinity);
            } else {
                vy = clamp(this.velocity.y * this.getDeceleration() * dt, -Infinity, 0);
            }
        }
        // Movement
        const x = this.getX(), y = this.getY();
        if (vx !== 0 || vy !== 0) {
            let newX = x + vx * dt,
                newY = y + vy * dt;
            // X collision
            if (this.getPlayerCollisionAt(newX, y)) {
                newX = x;
                vx = 0;
                this.velocity = new Vector2(0, vy);
                this.consecutiveXCollisions += dt;
            } else {
                this.consecutiveXCollisions = 0;
            }
            // Y collision
            if (this.getPlayerCollisionAt(x, newY)) {
                newY = y;
                vy = 0;
                this.velocity = new Vector2(0, vy);
                this.consecutiveYCollisions += dt;
            } else {
                this.consecutiveYCollisions = 0;
            }
            if (this.collidesWithNpc(newX, newY)) {
                newX = x;
                newY = y;
            }

            // Apply
            if (newX !== x || newY !== y) {
                this.setX(newX);
                this.setY(newY);
            }
        }
        // Talking/Thinking
        if (this.speakLine && time > this.speakUntil) {
            this.speakLine = "";
            this.speakUntil = 0;
            this.speakSince = 0;
        }

        if (this.speakLine && this.gameTime > this.speakSince && this.gameTime < this.speakUntil) {
            const progress = (this.gameTime - this.speakSince);
            const line = this.speakLine.substr(0, Math.ceil(28 * progress));
            this.dialogNode.setText(line);
        } else {
            this.dialogNode.setText("");
        }

        if (this.getPlayerCollisionAt(this.x, this.y)) {
            this.unstuck();
        }
    }

    protected unstuck(): this {
        for (let i = 1; i < 100; i++) {
            if (!this.getPlayerCollisionAt(this.x, this.y - i)) {
                return this.moveTo(this.x, this.y - i);
            } else if (!this.getPlayerCollisionAt(this.x, this.y + i)) {
                return this.moveTo(this.x, this.y + i);
            } else if (!this.getPlayerCollisionAt(this.x - i, this.y)) {
                return this.moveTo(this.x - i, this.y);
            } else if (!this.getPlayerCollisionAt(this.x + i, this.y)) {
                return this.moveTo(this.x + i, this.y);
            }
        }
        return this;
    }

    public setPreTag(preTag: PreCharacterTags): void {
        if (preTag !== this.preTag) {
            this.preTag = preTag;
        }
    }

    /**
     * Sets the animation tag. Null to display whole animation.
     *
     * @param tag - The animation tag to set. Null to unset.
     */
    public setTag(tag: PostCharacterTags | null): this {
        const oldTag = this.getTag();
        if (tag && ((oldTag !== this.preTag + tag) || (tag === PostCharacterTags.DANCE && oldTag !== tag))) {
            const newTag = (tag !== PostCharacterTags.DANCE ? this.preTag : "") + tag;
            if (this.getTag() !== PostCharacterTags.DANCE && tag === PostCharacterTags.DANCE) {
                this.getGame().sendCommand("playerUpdate", { dances: true });
            }
            super.setTag(newTag);
        }
        return this;
    }

    public setDirection(direction: SimpleDirection = SimpleDirection.BOTTOM): void {
        if (direction !== this.direction) {
            switch(direction) {
                case SimpleDirection.BOTTOM:
                    this.setPreTag(PreCharacterTags.FRONT);
                    break;
                case SimpleDirection.LEFT:
                    this.setPreTag(PreCharacterTags.LEFT);
                    break;
                case SimpleDirection.RIGHT:
                    this.setPreTag(PreCharacterTags.RIGHT);
                    break;
                case SimpleDirection.TOP:
                    this.setPreTag(PreCharacterTags.BACK);
                    break;
            }
            if (this.isPlayer) {
                this.getGame().sendCommand("playerUpdate", { x: this.x, y: this.y, direction });
            }
        }
        this.direction = direction;
    }

    public emitSparks(x: number, y: number, angle: number): void {
        const pos = this.getScenePosition();
        this.particleOffset = new Vector2(x - pos.x, y - pos.y + 20);
        this.particleAngle = -angle;
        this.sparkEmitter.emit(rnd(4, 10));
    }

    public reset(): void {
        this.velocity = new Vector2(0, 0);
        this.setTag(PostCharacterTags.IDLE);
    }

    public say(line = "", duration = 0, delay = 0): void {
        this.speakSince = this.gameTime + delay;
        this.speakUntil = this.speakSince + duration;
        this.speakLine = line;
    }

    private getPlayerCollisionAt(x = this.getX(), y = this.getY()): boolean {
        // Level collision
        const colliders = this.getColliders();
        const bounds = this.getSceneBounds();
        const w = bounds.width, h = bounds.height;
        const px = bounds.minX + x - this.getX(), py = bounds.minY + y - this.getY();
        return colliders.some(c => c.collidesWithRectangle(px, py, w, h));
    }

    @cacheResult
    private getColliders(): CollisionNode[] {
        const colliders = this.getScene()?.rootNode.getDescendantsByType(CollisionNode) ?? [];
        return colliders;
    }

    private collidesWithNpc(x = this.getX(), y = this.getY()): boolean {
        const oldX = this.x;
        const oldY = this.y;
        this.setX(x);
        this.setY(y);
        const collides = !!this.getScene()?.rootNode.getChildren().filter(c => c instanceof CharacterNode && c !== this && c.isBot)
            .some(c => c.collidesWithNode(this));
        this.x = oldX;
        this.y = oldY;
        return collides;
    }


    public getHeadPosition(): Vector2 {
        const p = this.getScenePosition();
        const h = this.height;
        return new Vector2(p.x, p.y - h * 0.8);
    }

    public containsPoint(x: number, y: number): boolean {
        const {minX, minY, maxX, maxY} = this.getSceneBounds();
        return x >= minX && x <= maxX && y >= minY && y <= maxY;
    }

    public registerInteractiveNode(node: InteractiveNode | NpcNode): void {
        this.canInteractWith = node;
    }

    public unregisterInteractiveNode(node: InteractiveNode | NpcNode): void {
        if (this.canInteractWith === node) {
            this.canInteractWith = null;
        }
    }

    public getNodeToInteractWith(): InteractiveNode | NpcNode | null {
        return this.canInteractWith;
    }
}
