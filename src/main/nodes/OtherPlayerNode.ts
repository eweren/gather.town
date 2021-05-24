import { CharacterNode } from "./CharacterNode";
import { Direction } from "../../engine/geom/Direction";
import { SceneNodeArgs } from "../../engine/scene/SceneNode";
import { Vector2 } from "../../engine/graphics/Vector2";
import { Rect } from "../../engine/geom/Rect";
import { AmbientPlayerNode } from "./player/AmbientPlayerNode";
import { Gather } from "../Gather";
import { TextNode } from "../../engine/scene/TextNode";
import { Layer } from "../constants";

export const playerSyncKeys = ["username", "speed", "acceleration", "deceleration"];

export class OtherPlayerNode extends CharacterNode {

    // Character settings
    private readonly speed = 60;
    private readonly acceleration = 10000;
    private readonly deceleration = 600;
    private initDone = false;

    private nameNode: TextNode<Gather>;

    public constructor(id: string, public spriteIndex = 0, args?: SceneNodeArgs) {
        super(playerSyncKeys, {
            aseprite: Gather.characterSprites[spriteIndex],
            anchor: Direction.BOTTOM,
            childAnchor: Direction.CENTER,
            tag: "idle",
            id,
            layer: Layer.FOREGROUND,
            sourceBounds: new Rect(7, 1, 20, 30),
            cameraTargetOffset: new Vector2(0, -30),
            ...args
        });
        this.identifier = id;
        const ambientPlayerLight = new AmbientPlayerNode();
        this.appendChild(ambientPlayerLight);

        this.nameNode = new TextNode<Gather>({ font: Gather.standardFont, text: this.identifier, layer: Layer.OVERLAY }).appendTo(this);
        this.nameNode.moveTo(0, -this.height / 2 - 5);
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

    public emitEvent(): void { }

    public syncCharacterState(): void {}

    public changePlayerName(playerName: string): void {
        this.nameNode.setText(playerName);
        this.identifier = playerName;
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
    }

    public reset(): void {
        super.reset();
    }

    public setDebug(debug: boolean): void {
        this.debug = debug;
    }
}
