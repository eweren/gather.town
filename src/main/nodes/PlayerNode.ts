import { Aseprite } from "../../engine/assets/Aseprite";
import { asset } from "../../engine/assets/Assets";
import { Direction, SimpleDirection } from "../../engine/geom/Direction";
import { Rect } from "../../engine/geom/Rect";
import { Vector2 } from "../../engine/graphics/Vector2";
import { ControllerEvent } from "../../engine/input/ControllerEvent";
import { ControllerIntent } from "../../engine/input/ControllerIntent";
import { SceneNodeArgs, SceneNodeAspect } from "../../engine/scene/SceneNode";
import { isDev } from "../../engine/util/env";
import { clamp } from "../../engine/util/math";
import { Gather } from "../Gather";
import { CharacterNode, PostCharacterTags } from "./CharacterNode";
import { InteractiveNode } from "./InteractiveNode";
import { AmbientPlayerNode } from "./player/AmbientPlayerNode";

export const playerSyncKeys = ["username", "speed", "acceleration", "deceleration"];

export class PlayerNode extends CharacterNode {

    @asset("sprites/characters/character.aseprite.json")
    private static readonly sprite: Aseprite;

    // Character settings
    private readonly speed = 100;
    private readonly acceleration = 10000;
    private readonly deceleration = 600;
    private leftMouseDown = false;
    private rightMouseDown = false;
    private previouslyPressed = 0;
    public spriteIndex = 0;

    public isPlayer = true;

    private gPressed = false;

    public constructor(args?: SceneNodeArgs) {
        super(playerSyncKeys, {
            aseprite: PlayerNode.sprite,
            anchor: Direction.BOTTOM,
            childAnchor: Direction.CENTER,
            tag: "idle",
            id: "player",
            sourceBounds: new Rect(7, 1, 20, 30),
            cameraTargetOffset: new Vector2(0, -30),
            ...args
        });
        const ambientPlayerLight = new AmbientPlayerNode();
        this.appendChild(ambientPlayerLight);

        if (isDev()) {
            (<any>window)["player"] = this;
        }
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

    public changeSprite(index = 0): void {
        if (Gather.characterSprites.length > index && index >= 0) {
            this.spriteIndex = index;
            this.setAseprite(Gather.characterSprites[index]);
            this.emitEvent("changeSprite", index);
        }
    }

    public update(dt: number, time: number) {
        super.update(dt, time);
        this.setOpacity(1);

        if (this.gPressed) {
            this.gPressed = false;
            this.inGhostMode = !this.inGhostMode;
        }

        // Controls
        const input = this.getScene()!.game.input;

        if (this.getGame().preventPlayerInteraction === 0) {
            // Move left/right
            const direction = (input.currentActiveIntents & ControllerIntent.PLAYER_MOVE_RIGHT)
                ? SimpleDirection.RIGHT
                : (input.currentActiveIntents & ControllerIntent.PLAYER_MOVE_LEFT)
                    ? SimpleDirection.LEFT
                    : (input.currentActiveIntents & ControllerIntent.PLAYER_MOVE_UP)
                        ? SimpleDirection.TOP
                        : (input.currentActiveIntents & ControllerIntent.PLAYER_MOVE_DOWN)
                            ? SimpleDirection.BOTTOM
                            : SimpleDirection.NONE;

            this.setDirection(direction);
        }

        if (input.currentActiveIntents & ControllerIntent.PLAYER_RELOAD && this.getGame().preventPlayerInteraction === 0) {
            this.setTag(PostCharacterTags.DANCE);
        }
        if (this.rightMouseDown) {
            this.rightMouseDown = false;
        }
        // TODO
        if (this.canInteract(ControllerIntent.PLAYER_ACTION) || this.leftMouseDown) {
            this.leftMouseDown = false;
        }
        // Interact
        if (this.canInteract(ControllerIntent.PLAYER_INTERACT)) {
            const node = this.getNodeToInteractWith();
            if (node) {
                node.interact();
            }
        }
        // Interact
        if (this.canInteract(ControllerIntent.ABORT)) {
            const node = this.getNodeToInteractWith();
            if (node && node instanceof InteractiveNode) {
                node.reverseInteract();
            }
        }
        this.updatePreviouslyPressed();
    }

    public handleControllerInput(event: ControllerEvent) {
        if (event.direction) {
            this.invalidate(SceneNodeAspect.SCENE_TRANSFORMATION);
            return;
        }
    }

    public startPresentation(): void {
        this.getGame().preventPlayerInteraction++;
    }
    public endPresentation(): void {
        this.getGame().preventPlayerInteraction = clamp(this.getGame().preventPlayerInteraction - 1, 0, Infinity);
    }

    private updatePreviouslyPressed(): void {
        const input = this.getGame().input;
        this.previouslyPressed = input.currentActiveIntents;
    }

    /**
     * Checks if the given intent is the same as the last intent to prevent auto-key-handling on button being hold.
     */
    private canInteract(intent: ControllerIntent): boolean {
        const input = this.getGame().input;
        return (this.previouslyPressed & intent) === 0 && (input.currentActiveIntents & intent) !== 0;
    }

    public reset(): void {
        super.reset();
    }

    public setDebug(debug: boolean): void {
        this.debug = debug;
    }

    public getIdentifier(): string {
        return this.getGame().onlineService.username;
    }

    public activate(): void {
        super.activate();
        this.identifier = this.getGame().onlineService.username;
        this.getGame().input.onDrag.filter(ev => ev.isRightStick && !!ev.direction && ev.direction.getLength() > 0.3).connect(this.handleControllerInput, this);
        const handleControllerInputChange = () => {
            this.isRunning = (this.getGame().input.currentActiveIntents & ControllerIntent.PLAYER_RUN) === ControllerIntent.PLAYER_RUN;
        };
        this.getGame().input.onButtonDown.connect(handleControllerInputChange, this);
        this.getGame().input.onButtonUp.connect(handleControllerInputChange, this);
        this.getGame().keyboard.onKeyPress.filter(ev => ev.key === "g").connect(() => {
            this.gPressed = true;
        }, this);
    }
}
