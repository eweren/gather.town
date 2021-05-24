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
import { FadeToBlackTransition } from "../../engine/transitions/FadeToBlackTransition";
import { ChairNode } from "../nodes/ChairNode";
import { FocusNode } from "../nodes/FocusNode";
import { SwitchNode } from "../nodes/SwitchNode";
import { NpcNode } from "../nodes/NpcNode";
import { PresentationBoardNode } from "../nodes/PresentationBoardNode";
import { PresentationNode } from "../nodes/PresentationNode";
import { IFrameNode } from "../nodes/IFrameNode";
import { SpeakerNode } from "../nodes/SpeakerNode";
import { CatNode } from "../nodes/CatNode";
import { TiledTextNode } from "../nodes/TiledTextNode";
import { JitsiControlsNode } from "../nodes/JitsiControlsNode";
import { NotificationNode } from "../nodes/NotificationNode";

export class GameScene extends Scene<Gather> {
    @asset(STANDARD_FONT)
    private static font: BitmapFont;

    @asset("map/map.tiledmap.json")
    private static map: TiledMap;

    private debugMode: boolean = false;

    private controlsNode = new JitsiControlsNode({ x: Math.round(this.rootNode.width / 2), y: Math.round(this.rootNode.height - 10)});

    public mapNode = new TiledMapNode<Gather>({ map: GameScene.map, objects: {
        "collision": CollisionNode,
        "player": PlayerNode,
        "light": LightNode,
        "cameraLimit": CameraLimitNode,
        /* "sound": TiledSoundNode, */
        "chair": ChairNode,
        "powerswitch": SwitchNode,
        "focus": FocusNode,
        "npc": NpcNode,
        "presentationBoard": PresentationBoardNode,
        "presentation": PresentationNode,
        "iframe": IFrameNode,
        "speaker": SpeakerNode,
        "cat": CatNode,
        "text": TiledTextNode
    }});
    public notificationNode?: NotificationNode;

    public setup() {
        this.inTransition = new FadeToBlackTransition({ duration: 2, delay: 1 });
        this.mapNode.moveTo(0, 0).appendTo(this.rootNode).transform(m => m.scale(1));
        const player = this.mapNode.getDescendantById("Player");
        this.camera.setFollow(player);
        this.setLightLayers([ Layer.LIGHT ]);
        this.setHudLayers([Layer.HUD]);
        this.notificationNode = new NotificationNode(3, { x: this.rootNode.width - 12, y: 4, layer: Layer.HUD }).appendTo(this.rootNode);

        if (isDev()) {
            this.rootNode.appendChild(new FpsCounterNode({
                font: GameScene.font,
                anchor: Direction.TOP_LEFT,
                x: 10,
                y: 10,
                layer: Layer.HUD
            }));
        }

        this.rootNode.appendChild(this.controlsNode);

        setTimeout(() => {
            this.game.setupScene();
        });
    }

    public resizeTo(width: number, height: number): void {
        super.resizeTo(width, height);
        this.controlsNode.moveTo(Math.round(this.rootNode.width / 2), Math.round(this.rootNode.height - 10));
        this.notificationNode?.moveTo(this.rootNode.width - 12, 4);
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
        if (event.key === "o") {
            if (!event.repeat) {
                this.enterDebugMode();
            }
            event.preventDefault();
            event.stopPropagation();
        }
    }

    private handleKeyUp(event: KeyboardEvent): void {
        if (event.key === "o") {
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
            const player = this.rootNode.getDescendantById("Player");
            if (player != null) {
                this.camera.setFollow(player).setZoom(1);
            }
            this.onPointerDown.disconnect(this.handleTeleportClick, this);
            this.debugMode = false;
        }
    }

    private handleTeleportClick(event: ScenePointerDownEvent<Gather>): void {
        const player = this.rootNode.getDescendantById("Player");
        if (player != null) {
            player.moveTo(event.getX(), event.getY());
        }
    }
}
