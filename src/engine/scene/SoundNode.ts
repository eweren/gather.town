import { CollisionNode } from "../../main/nodes/CollisionNode";
import { Sound } from "../assets/Sound";
import { Game } from "../Game";
import { Vector2 } from "../graphics/Vector2";
import { cacheResult } from "../util/cache";
import { clamp } from "../util/math";
import { SceneNode, SceneNodeArgs, SceneNodeAspect } from "./SceneNode";

/**
 * Constructor arguments for [[Sound]].
 */
export interface SoundNodeArgs extends SceneNodeArgs {
    /** The sound to play. */
    sound: Sound;

    /** The sound range. */
    range: number;

    /** The sound intensity between 0.0 and 1.0. Defaults to 1.0. */
    intensity?: number;

    /** The width of the sound emitting source. Defaults to 30. */
    emitterWidth?: number;
}

/**
 * Scene node for playing an ambient sound depending on the distance to the screen center.
 *
 * @param T - Optional owner game class.
 */
export class SoundNode<T extends Game = Game> extends SceneNode<T> {
    /** The displayed aseprite. */
    private sound: Sound;

    /** The sound range. */
    private range: number;

    /** The sound intensity. */
    private intensity: number;

    /** The sounds-emitting source width. */
    private emitterWidth: number;

    /**
     * Creates a new scene node displaying the given Aseprite.
     */
    public constructor({ sound, range, intensity = 1.0, emitterWidth = 30, ...args }: SoundNodeArgs) {
        super({ ...args });
        this.sound = sound;
        this.range = range;
        this.intensity = intensity;
        this.emitterWidth = emitterWidth;
        this.sound.setLoop(true);
    }

    /**
     * Returns the played sound.
     *
     * @return The played sound.
     */
    public getSound(): Sound {
        return this.sound;
    }

    /**
     * Sets the sound.
     *
     * @param aseprite - The Aseprite to draw.
     */
    public setSound(sound: Sound): this {
        if (sound !== this.sound) {
            this.sound = sound;
            this.invalidate(SceneNodeAspect.RENDERING);
        }
        return this;
    }

    public set3d(): void {
        this.sound.setPositionedSound(new Vector2(this.getX(), this.getY()), this.intensity, this.range, this.emitterWidth);
    }

    public unset3d(): void {
        this.sound.setStereo();
    }

    /**
     * Returns the sound range.
     *
     * @return The sound range.
     */
    public getRange(): number {
        return this.range;
    }

    /**
     * Sets the sound range.
     *
     * @param range - The sound range to set.
     */
    public setRange(range: number): this {
        if (range !== this.range) {
            this.range = range;
            this.invalidate(SceneNodeAspect.RENDERING);
        }
        return this;
    }

    /**
     * Returns the sound intensity (0.0 - 1.0).
     *
     * @return The sound intensity (0.0 - 1.0).
     */
    public getIntensity(): number {
        return this.intensity;
    }

    /**
     * Sets the sound range.
     *
     * @param intensity - The sound range to set.
     */
    public setIntensity(intensity: number): this {
        if (intensity !== this.intensity) {
            this.intensity = intensity;
            this.invalidate(SceneNodeAspect.RENDERING);
        }
        return this;
    }

    /** @inheritDoc */
    public update(dt: number, time: number) {
        super.update(dt, time);
        let distance = 0;
        let horizontalDistance = 0;
        const scene = this.getScene();
        if (scene) {
            distance = this.getScenePosition().getDistance(new Vector2(scene.camera.getX(), scene.camera.getY()));
            horizontalDistance = this.getScenePosition().x - scene.camera.getX();
        }
        const volume = clamp(Math.max(0, this.range - distance) / this.range * this.intensity, 0, 1);
        if (volume > 0 && !this.sound.is3D()) {
            let soundDirection = horizontalDistance > 0 ? 1 : -1;
            if (Math.abs(distance) < 100) {
                soundDirection = horizontalDistance / 100;
            }
            this.sound.setVolume(volume, soundDirection);
            if (!this.sound.isPlaying()) {
                this.sound.play();
            }
        } else if (!this.sound.is3D()) {
            this.sound.stop();
        } else if (!this.sound.isPlaying() && this.sound.is3D()) {
            this.sound.play();
        } else if (this.isInView()) {
            this.sound.resume();
        } else {
            this.sound.pause();
        }
    }

    private isInView(): boolean {
        const direction = new Vector2().setVector(this.getScenePosition());
        const scene = this.getScene();
        if (scene) {
            direction.x -= scene.camera.getX();
            direction.y -= scene.camera.getY();
            return !this.isColliding(new Vector2().setVector(this.getScenePosition()), direction);
        }
        return false;
    }

    @cacheResult
    private getColliders(): CollisionNode[] {
        const colliders = this.getScene()?.rootNode.getDescendantsByType(CollisionNode) ?? [];
        return colliders;
    }

    private isColliding(startPoint: Vector2, directionVector: Vector2, stepSize = 5): boolean {
        let isColliding: CollisionNode | null = null;
        const nextCheckPoint = startPoint;
        const length = directionVector.getLength();
        const steps = Math.ceil(length / stepSize);
        const stepX = directionVector.x / steps, stepY = directionVector.y / steps;
        const colliders = this.getColliders();
        for (let i = 0; i <= steps; i++) {
            isColliding = this.getPointCollision(nextCheckPoint.x, nextCheckPoint.y, colliders);
            nextCheckPoint.add({ x: stepX, y: stepY });
            if (isColliding) {
                return true;
            }
        }
        return false;
    }

    private getPointCollision(x: number, y: number, colliders = this.getColliders()): CollisionNode | null {
        for (const c of colliders) {
            if (c.containsPoint(x, y)) {
                return c;
            }
        }
        return null;
    }
}
