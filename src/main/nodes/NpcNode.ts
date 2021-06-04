import { Aseprite } from "../../engine/assets/Aseprite";
import { CharacterNode, PostCharacterTags } from "./CharacterNode";
import { Direction, SimpleDirection, SimpleDirections } from "../../engine/geom/Direction";

import { SceneNodeArgs } from "../../engine/scene/SceneNode";
import { asset } from "../../engine/assets/Assets";
import { Rect } from "../../engine/geom/Rect";
import { rndItem } from "../../engine/util/random";
import { TextNode } from "../../engine/scene/TextNode";
import { BitmapFont } from "../../engine/assets/BitmapFont";
import { STANDARD_FONT, Layer } from "../constants";
import { Gather } from "../Gather";
import { clamp } from "../../engine/util/math";
import { PlayerNode } from "./PlayerNode";
import { Vector2 } from "../../engine/graphics/Vector2";

interface NpcNodeArgs extends SceneNodeArgs {
    spriteIndex?: number;
}

export class NpcNode extends CharacterNode {
    @asset(STANDARD_FONT)
    private static readonly font: BitmapFont;
    @asset([
        "sprites/characters/dark_staff_black.aseprite.json",
        "sprites/characters/character.aseprite.json",
        "sprites/characters/HalloweenGhost.aseprite.json",
        "sprites/characters/dark_casualjacket_orange_white.aseprite.json",
        "sprites/characters/light_male_pkmn_red.aseprite.json",
        "sprites/characters/femalenerdydark_green.aseprite.json",
        "sprites/characters/dark_graduation_orange.aseprite.json",
        "sprites/characters/light_female_pkmn_yellow.aseprite.json"

    ])
    public static sprites: Aseprite[];
    protected caption: string;
    protected isBot = true;
    private captionOpacity = 0;
    private target: CharacterNode | null = null;

    // Character settings
    private readonly acceleration = 10000;
    private readonly deceleration = 800;
    private lastDirectionChange = 0;
    private textNode: TextNode<Gather>;

    public constructor(args?: NpcNodeArgs) {
        super([], {
            aseprite: NpcNode.sprites[args?.spriteIndex ?? args?.tiledObject?.getOptionalProperty("spriteIndex", "int")?.getValue() ?? 0],
            anchor: Direction.BOTTOM,
            childAnchor: Direction.CENTER,
            tag: "idle",
            id: "player",
            sourceBounds: new Rect(7, 1, 20, 30),
            ...args
        });

        this.textNode = new TextNode<Gather>({
            font: NpcNode.font,
            color: "white",
            outlineColor: "black",
            y: 20,
            layer: Layer.OVERLAY
        }).appendTo(this);

        this.caption = "PRESS E TO INTERACT";
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
            this.captionOpacity = clamp(this.captionOpacity - dt * 8, 0, 1);
        }

        this.textNode.setOpacity(this.captionOpacity);
        this.textNode.setText(this.captionOpacity > 0 ? this.caption : "");

        if (!this.inConversation && time - this.lastDirectionChange > 3 && (this.getTag() !== PostCharacterTags.DANCE || this.getTimesPlayed(this.getTag()) > 10)) {
            this.lastDirectionChange = time;
            this.setDirection(rndItem(SimpleDirections));
        } else if (this.inConversation) {
            this.setDirection(SimpleDirection.NONE);
        }

        super.update(dt, time);
    }

    public canInteract(): boolean {
        const playerPos = this.getPlayer()?.getPosition() ?? new Vector2();
        const otherNpcs = this.getOtherNpcs()?.sort((npc1, npc2) => npc1.getPosition().getDistance(playerPos) - npc2.getPosition().getDistance(playerPos));

        return otherNpcs != null && otherNpcs[0] === this && !this.inConversation;
    }

    public interact(): void {
        if (Math.random() < 0.2) {
            this.direction = SimpleDirection.NONE;
            this.setTag(PostCharacterTags.DANCE);
            this.getPlayer()?.setTag(PostCharacterTags.DANCE);
            this.caption = "";
        } else {
            this.getGame().startDialog(0, this);
        }
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

    public say(line?: string, delay?: number): void {
        super.say(line, delay);
    }

    protected unstuck(): this {
        return this;
    }
    public getSpeed(): number {
        return 40;
    }
    public getAcceleration(): number {
        return this.acceleration;
    }
    public getDeceleration(): number {
        return this.deceleration;
    }
    protected getPlayer(): PlayerNode | undefined {
        return this.getScene()?.rootNode.getDescendantsByType<PlayerNode>(PlayerNode)[0];
    }
    protected getOtherNpcs(): Array<NpcNode> | undefined {
        return this.getScene()?.rootNode.getDescendantsByType<NpcNode>(NpcNode);
    }

}
