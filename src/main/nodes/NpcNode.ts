import { Aseprite } from "../../engine/assets/Aseprite";
import { CharacterNode } from "./CharacterNode";
import { Direction } from "../../engine/geom/Direction";

import { SceneNodeArgs } from "../../engine/scene/SceneNode";
import { asset } from "../../engine/assets/Assets";
import { Rect } from "../../engine/geom/Rect";

export class NpcNode extends CharacterNode {
    @asset([
        "sprites/male.aseprite.json",
        "sprites/female.aseprite.json",
        "sprites/male2.aseprite.json",
        "sprites/male3.aseprite.json",
        "sprites/female2.aseprite.json",
        "sprites/female3.aseprite.json"
    ])
    private static sprites: Aseprite[];

    // Character settings
    private readonly acceleration = 600;
    private readonly deceleration = 800;
    private readonly jumpPower = 295;

    public constructor(spriteIndex: number, args?: SceneNodeArgs) {
        super({
            aseprite: NpcNode.sprites[spriteIndex] ? NpcNode.sprites[spriteIndex] : NpcNode.sprites[0],
            anchor: Direction.BOTTOM,
            childAnchor: Direction.CENTER,
            tag: "idle",
            id: "player",
            sourceBounds: new Rect(6, 10, 8, 26),
            ...args
        });
    }

    protected unstuck(): this {
        return this;
    }
    public getSpeed(): number {
        return 1;
    }
    public getAcceleration(): number {
        return this.acceleration;
    }
    public getDeceleration(): number {
        return this.deceleration;
    }
    public getJumpPower(): number {
        return this.jumpPower;
    }

    public update(dt: number, time: number) {
        super.update(dt, time);
    }

}
