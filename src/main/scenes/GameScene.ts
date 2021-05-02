import { Gather } from "../Gather";
import { Scene } from "../../engine/scene/Scene";
import { PlayerNode } from "../nodes/PlayerNode";
import { asset } from "../../engine/assets/Assets";
import { TiledMap } from "../../engine/tiled/TiledMap";
import { TiledMapNode } from "../../engine/scene/TiledMapNode";
import { CollisionNode } from "../nodes/CollisionNode";
import { LightNode } from "../nodes/LightNode";
import { GAME_HEIGHT, GAME_WIDTH, Layer, STANDARD_FONT } from "../constants";
import { CameraLimitNode } from "../nodes/CameraLimitNode";
import { ScenePointerDownEvent } from "../../engine/scene/events/ScenePointerDownEvent";
import { isDev } from "../../engine/util/env";
import { BitmapFont } from "../../engine/assets/BitmapFont";
import { FpsCounterNode } from "../../engine/scene/FpsCounterNode";
import { Direction } from "../../engine/geom/Direction";
import { TiledSoundNode } from "../nodes/TiledSoundNode";
import { FadeToBlackTransition } from "../../engine/transitions/FadeToBlackTransition";
import { ChairNode } from "../nodes/ChairNode";
import { FocusNode } from "../nodes/FocusNode";
import { SwitchNode } from "../nodes/SwitchNode";
import { NpcNode } from "../nodes/NpcNode";

export class GameScene extends Scene<Gather> {
    @asset(STANDARD_FONT)
    private static font: BitmapFont;

    @asset([
        "map/debug.tiledmap.json"
    ])
    private static maps: TiledMap[];

    private targetMap = 0;

    private debugMode: boolean = false;

    private mapNode = new TiledMapNode<Gather>({ map: GameScene.maps[this.targetMap], objects: {
        "collision": CollisionNode,
        "player": PlayerNode,
        "light": LightNode,
        "cameraLimit": CameraLimitNode,
        "sound": TiledSoundNode,
        "chair": ChairNode,
        "powerswitch": SwitchNode,
        "focus": FocusNode,
        "npc": NpcNode
    }});

    public setup() {
        this.inTransition = new FadeToBlackTransition({ duration: 2, delay: 1 });
        this.mapNode.moveTo(0, 0).appendTo(this.rootNode).transform(m => m.scale(1));
        const player = this.mapNode.getDescendantById("Player");
        this.camera.setFollow(player);
        this.setLightLayers([ Layer.LIGHT ]);
        this.setHudLayers([ Layer.HUD ]);

        if (isDev()) {
            this.rootNode.appendChild(new FpsCounterNode({
                font: GameScene.font,
                anchor: Direction.TOP_LEFT,
                x: 10,
                y: 10,
                layer: Layer.HUD
            }));
        }

        setTimeout(() => {
            this.game.setupScene();
        });
    }

    public cleanup() {
        this.rootNode.clear();
    }

    public activate() {
        if (isDev()) {
            this.game.keyboard.onKeyDown.connect(this.handleKeyDown, this);
            this.game.keyboard.onKeyUp.connect(this.handleKeyUp, this);
        }
    }

    public deactivate() {
        if (isDev()) {
            this.game.keyboard.onKeyDown.disconnect(this.handleKeyDown, this);
            this.game.keyboard.onKeyUp.disconnect(this.handleKeyUp, this);
        }
    }

    private handleKeyDown(event: KeyboardEvent): void {
        if (event.key === "Tab") {
            if (!event.repeat) {
                this.enterDebugMode();
            }
            event.preventDefault();
            event.stopPropagation();
        }
    }

    private handleKeyUp(event: KeyboardEvent): void {
        if (event.key === "Tab") {
            if (!event.repeat) {
                this.leaveDebugMode();
            }
            event.preventDefault();
            event.stopPropagation();
        }
    }

    private enterDebugMode(): void {
        if (!this.debugMode) {
            this.debugMode = true;
            const bounds = this.mapNode.getSceneBounds();
            const scale = Math.min(GAME_WIDTH / bounds.width, GAME_HEIGHT / bounds.height);
            this.camera.setFollow(null).setLimits(this.mapNode.getBounds().toRect()).moveTo(bounds.centerX, bounds.centerY).setZoom(scale);
            this.onPointerDown.connect(this.handleTeleportClick, this);
        }
    }

    public leaveDebugMode(): void {
        if (this.debugMode) {
            const player = this.mapNode.getDescendantById("Player");
            if (player != null) {
                this.camera.setFollow(player).setZoom(1);
            }
            this.onPointerDown.disconnect(this.handleTeleportClick, this);
            this.debugMode = false;
        }
    }

    private handleTeleportClick(event: ScenePointerDownEvent): void {
        const player = this.mapNode.getDescendantById("Player");
        if (player != null) {
            player.moveTo(event.getX(), event.getY());
        }
    }
}
