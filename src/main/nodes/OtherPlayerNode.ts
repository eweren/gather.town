import { CharacterNode } from "./CharacterNode";
import { Direction } from "../../engine/geom/Direction";
import { SceneNodeArgs } from "../../engine/scene/SceneNode";
import { Vector2 } from "../../engine/graphics/Vector2";
import { ParticleNode, valueCurves } from "./ParticleNode";
import { rnd, rndItem, timedRnd } from "../../engine/util/random";
import { Rect } from "../../engine/geom/Rect";
import { AmbientPlayerNode } from "./player/AmbientPlayerNode";
import { Gather } from "../Gather";

const groundColors = [
    "#806057",
    "#504336",
    "#3C8376",
    "#908784"
];

export class OtherPlayerNode extends CharacterNode {

    // Character settings
    private readonly speed = 60;
    private readonly acceleration = 10000;
    private readonly deceleration = 600;
    private initDone = false;

    private dustParticles: ParticleNode;

    public constructor(id: string, public spriteIndex = 0, args?: SceneNodeArgs) {
        super({
            aseprite: Gather.characterSprites[spriteIndex],
            anchor: Direction.BOTTOM,
            childAnchor: Direction.CENTER,
            tag: "idle",
            id,
            sourceBounds: new Rect(7, 1, 20, 30),
            cameraTargetOffset: new Vector2(0, -30),
            ...args
        });
        const ambientPlayerLight = new AmbientPlayerNode();
        this.appendChild(ambientPlayerLight);

        this.dustParticles = new ParticleNode({
            y: this.getHeight() / 2,
            velocity: () => ({ x: rnd(-1, 1) * 26, y: rnd(0.7, 1) * 45 }),
            color: () => rndItem(groundColors),
            size: rnd(1, 2),
            gravity: {x: 0, y: -100},
            lifetime: () => rnd(0.5, 0.8),
            alphaCurve: valueCurves.trapeze(0.05, 0.2)
        }).appendTo(this);
    }

    public getSpeed(): number {
        return this.speed * (this.isRunning ? 2.4 : 1.2);
    }

    public getAcceleration(): number {
        return this.acceleration;
    }

    public getDeceleration(): number {
        return this.deceleration;
    }

    public changeSprite(spriteIndex: number): void {
        if (Gather.characterSprites.length > spriteIndex && spriteIndex > 0) {
            this.spriteIndex = spriteIndex;
            this.setAseprite(Gather.characterSprites[spriteIndex]);
        }
    }

    public update(dt: number, time: number) {
        super.update(dt, time);
        if (this.isInScene() && !this.initDone) {
            this.initDone = true;
        }

        // Spawn random dust particles while walking
        if (this.isVisible()) {
            if (this.getTag() === "walk") {
                if (timedRnd(dt, 0.2)) {
                    this.dustParticles.emit(1);
                }
            }
        }
    }

    public reset(): void {
        super.reset();
    }

    public setDebug(debug: boolean): void {
        this.debug = debug;
    }
}
