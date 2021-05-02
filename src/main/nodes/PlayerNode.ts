import { Aseprite } from "../../engine/assets/Aseprite";
import { CharacterNode, PostCharacterTags } from "./CharacterNode";
import { ControllerIntent } from "../../engine/input/ControllerIntent";
import { Direction, SimpleDirection } from "../../engine/geom/Direction";
import { SceneNodeArgs, SceneNodeAspect } from "../../engine/scene/SceneNode";
import { Sound } from "../../engine/assets/Sound";
import { Vector2 } from "../../engine/graphics/Vector2";
import { asset } from "../../engine/assets/Assets";
import { Layer } from "../constants";
import { ParticleNode, valueCurves } from "./ParticleNode";
import { rnd, rndItem, timedRnd } from "../../engine/util/random";
import { Rect } from "../../engine/geom/Rect";
import { AmbientPlayerNode } from "./player/AmbientPlayerNode";
import { AsepriteNode } from "../../engine/scene/AsepriteNode";
import { ScenePointerDownEvent } from "../../engine/scene/events/ScenePointerDownEvent";
import { ControllerEvent } from "../../engine/input/ControllerEvent";
import { ControllerFamily } from "../../engine/input/ControllerFamily";

const groundColors = [
    "#806057",
    "#504336",
    "#3C8376",
    "#908784"
];

export class PlayerNode extends CharacterNode {

    @asset("sounds/fx/footsteps.ogg")
    private static readonly footsteps: Sound;

    @asset("sprites/characters/character.aseprite.json")
    private static readonly sprite: Aseprite;

    @asset("sprites/crosshair.aseprite.json")
    private static readonly crossHairSprite: Aseprite;

    // Character settings
    private readonly speed = 60;
    private readonly acceleration = 10000;
    private readonly deceleration = 600;
    private leftMouseDown = false;
    private rightMouseDown = false;
    private previouslyPressed = 0;
    private isRunning = false;
    private initDone = false;

    private dustParticles: ParticleNode;
    private crosshairNode: AsepriteNode;

    public constructor(args?: SceneNodeArgs) {
        super({
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
        (<any>window)["player"] = this;

        this.dustParticles = new ParticleNode({
            y: this.getHeight() / 2,
            velocity: () => ({ x: rnd(-1, 1) * 26, y: rnd(0.7, 1) * 45 }),
            color: () => rndItem(groundColors),
            size: rnd(1, 2),
            gravity: {x: 0, y: -100},
            lifetime: () => rnd(0.5, 0.8),
            alphaCurve: valueCurves.trapeze(0.05, 0.2)
        }).appendTo(this);

        this.crosshairNode = new AsepriteNode({
            aseprite: PlayerNode.crossHairSprite,
            tag: "idle",
            layer: Layer.HUD
        });
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

    public update(dt: number, time: number) {
        super.update(dt, time);
        if (this.isInScene() && !this.initDone) {
            this.initDone = true;
            this.getGame().input.onDrag.filter(ev => ev.isRightStick && !!ev.direction && ev.direction.getLength() > 0.3).connect(this.handleControllerInput, this);
            const handleControllerInputChange = (ev: ControllerEvent) => {
                this.isRunning = (this.getGame().input.currentActiveIntents & ControllerIntent.PLAYER_RUN) === ControllerIntent.PLAYER_RUN;
            };
            this.getGame().input.onButtonDown.connect(handleControllerInputChange, this);
            this.getGame().input.onButtonUp.connect(handleControllerInputChange, this);
        }
        if (this.getGame().input.currentControllerFamily === ControllerFamily.GAMEPAD) {
            this.crosshairNode.hide();
        } else {
            this.crosshairNode.show();
        }
        this.setOpacity(1);
        this.updateCrosshair();

        // Controls
        const input = this.getScene()!.game.input;

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

        if (input.currentActiveIntents & ControllerIntent.PLAYER_RELOAD) {
            this.setTag(PostCharacterTags.DANCE);
        }
        if (this.getTag() === "walk") {
            console.log("WALKING");
            PlayerNode.footsteps.setLoop(true);
            PlayerNode.footsteps.play({fadeIn: 0.5});
        } else {
            PlayerNode.footsteps.stop(0.3);
        }
        // Reload
        if (this.canInteract(ControllerIntent.PLAYER_RELOAD) || this.rightMouseDown) {
            this.rightMouseDown = false;
        }
        // TODO
        if (this.canInteract(ControllerIntent.PLAYER_ACTION) || this.leftMouseDown) {
            this.leftMouseDown = false;
        }
        // Interact
        if (this.canInteract(ControllerIntent.PLAYER_RELOAD)) {
            const node = this.getNodeToInteractWith();
            if (node) {
                node.interact();
            }
        }

        // Spawn random dust particles while walking
        if (this.isVisible()) {
            if (this.getTag() === "walk") {
                if (timedRnd(dt, 0.2)) {
                    this.dustParticles.emit(1);
                }
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

    private handlePointerDown(event: ScenePointerDownEvent): void {
        if (event.getButton() === 0) {
            this.leftMouseDown = true;
            event.onPointerEnd.connect(() => {
                this.leftMouseDown = false;
            });
        } else if (event.getButton() === 2) {
            this.rightMouseDown = true;
            event.onPointerEnd.connect(() => {
                this.rightMouseDown = false;
            });
        }
    }

    protected activate(): void {
        this.crosshairNode.appendTo(this.getScene()!.rootNode);
        this.getScene()?.onPointerDown.connect(this.handlePointerDown, this);
        this.getGame().canvas.style.cursor = "none";
    }

    protected deactivate(): void {
        this.getGame().canvas.style.cursor = "";
        this.getScene()?.onPointerDown.disconnect(this.handlePointerDown, this);
        this.crosshairNode.remove();
    }

    protected updateCrosshair(): void {
        const tag = "idle";
        this.crosshairNode.setTag(tag);
    }
}
