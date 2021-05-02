import { DialogJSON } from "*.dialog.json";
import { asset } from "../engine/assets/Assets";
import { RGBColor } from "../engine/color/RGBColor";
import { Game } from "../engine/Game";
import { ControllerIntent } from "../engine/input/ControllerIntent";
import { Camera } from "../engine/scene/Camera";
import { FadeToBlack } from "../engine/scene/camera/FadeToBlack";
import { clamp } from "../engine/util/math";
import { rnd } from "../engine/util/random";
import { Dialog } from "./Dialog";
import { FxManager } from "./FxManager";
import { MusicManager } from "./MusicManager";
import { CharacterNode } from "./nodes/CharacterNode";
import { LightNode } from "./nodes/LightNode";
import { NpcNode } from "./nodes/NpcNode";
import { PlayerNode } from "./nodes/PlayerNode";
import { GameScene } from "./scenes/GameScene";
import { LoadingScene } from "./scenes/LoadingScene";
import { SuccessScene } from "./scenes/SuccessScene";

export enum GameStage {
    NONE = 0,
    GAME = 1,
    DONE = 2
}

export class Hyperloop extends Game {
    private stageStartTime = 0;
    private stageTime = 0;
    private dialogs: Dialog[] = [];
    private npcs: CharacterNode[] = [];

    // Game progress
    private gameStage = GameStage.NONE;
    public keyTaken = false; // key taken from corpse
    private fadeOutInitiated = false;

    // Dialog
    private dialogKeyPressed = false;
    private currentDialogLine = 0;
    private currentDialog: Dialog | null = null;

    @asset("dialog/train.dialog.json")
    private static readonly trainDialog: DialogJSON;

    public constructor() {
        super();
    }

    // Called by GameScene
    public setupScene(): void {
        this.spawnNPCs();
        this.setStage(GameStage.GAME);
        // Assets cannot be loaded in constructor because the LoadingScene
        // is not initialized at constructor time and Assets are loaded in the LoadingScene
        this.dialogs = [
            new Dialog(Hyperloop.trainDialog)
        ];

        this.input.onDrag.filter(e => e.isRightStick && !!e.direction && e.direction.getLength() > 0.3).connect(this.getPlayer().handleControllerInput, this.getPlayer());
    }

    public update(dt: number, time: number): void {
        this.stageTime = time - this.stageStartTime;
        switch (this.gameStage) {
            case GameStage.GAME:
                this.updateGame();
                break;
            case GameStage.DONE:
                this.updateDone(dt);
                break;
        }
        if (this.currentDialog) {
            this.updateDialog();
        }
        super.update(dt, time);
    }

    public setStage(stage: GameStage): void {
        if (stage !== this.gameStage) {
            this.gameStage = stage;
            this.stageStartTime = this.getTime();
            switch (this.gameStage) {
                case GameStage.GAME:
                    this.initGame();
                    break;
                case GameStage.DONE:
                    this.initDone();
                    break;
            }
        }
    }

    private spawnNPCs(): void {
        const chars = [ new NpcNode(0), new NpcNode(1), new NpcNode(2), new NpcNode(3), new NpcNode(4) ];
        const positions = [ -80, -40, 24, 60, 125 ];
        for (let i = 0; i < chars.length; i++) {
            chars[i].moveTo(positions[i], -20).appendTo(this.getGameScene().rootNode);
        }
        for (let i = 3; i < chars.length; i++) {
            chars[i].setMirrorX(true);
        }
        this.npcs = chars;
    }

    public dimLights() {
        const lights = this.getAllLights();
        for (const light of lights) {
            light.setColor(new RGBColor(1, 1, 0.8));
        }
        const ambients = this.getAmbientLights();
        for (const ambient of ambients) {
            ambient.setColor(new RGBColor(0.3, 0.3, 0.3));
        }
    }

    public turnOnAllLights() {
        const lights = this.getAllLights();
        for (const light of lights) {
            light.setColor(new RGBColor(0.8, 0.8, 1));
        }
        const ambients = this.getAmbientLights();
        for (const ambient of ambients) {
            ambient.setColor(new RGBColor(1, 1, 1));
        }
    }

    private updateDialog(): void {
        // Any key to proceed with next line
        const pressed = this.input.currentActiveIntents ?? 0;
        const moveButtonPressed = (this.input.currentActiveIntents & ControllerIntent.PLAYER_MOVE_LEFT) > 0
            || (this.input.currentActiveIntents & ControllerIntent.PLAYER_MOVE_RIGHT) > 0
            || (this.input.currentActiveIntents & ControllerIntent.PLAYER_MOVE_UP) > 0
            || (this.input.currentActiveIntents & ControllerIntent.PLAYER_MOVE_DOWN) > 0;
        if (moveButtonPressed) {
            return;
        }
        const prevPressed = this.dialogKeyPressed;
        this.dialogKeyPressed = pressed !== 0;
        if (pressed && !prevPressed) {
            this.nextDialogLine();
        }
    }

    private nextDialogLine() {
        // Shut up all characters
        this.npcs.forEach(npc => npc.say());
        this.currentDialogLine++;
        if (this.currentDialog && this.currentDialogLine >= this.currentDialog.lines.length) {
            this.currentDialog = null;
            this.currentDialogLine = 0;
        } else if (this.currentDialog) {
            // Show line
            const line = this.currentDialog.lines[this.currentDialogLine];
            const char = this.npcs[line.charNum];
            char.say(line.line, Infinity);
        }
    }

    private startDialog(num: number) {
        this.currentDialog = this.dialogs[num];
        this.currentDialogLine = -1;
        this.nextDialogLine();
    }

    private updateGame(): void {
        /* let player: PlayerNode;
        try {
            player = this.getPlayer();
        } catch (e) { return; } */
    }

    private updateDone(dt: number) {
        this.handleCamera(this.stageTime > 5 ? 1 : 0, this.stageTime / 3);
        // Fade out
        if (this.stageTime > 12 && !this.fadeOutInitiated) {
            this.fadeOutInitiated = true;
           this.getFader().fadeOut({ duration: 24 }).then(() => this.scenes.setScene(SuccessScene as any));
        }
    }

    private handleCamera(shakeForce = 0, toCenterForce = 1): void {
        const cam = this.getCamera();
        // Force towards center
        toCenterForce = clamp(toCenterForce, 0, 1);
        const p = 0.5 - 0.5 * Math.cos(toCenterForce * Math.PI);
        const playerX = this.getPlayer().getScenePosition().x;
        const diff = playerX;
        // Shake
        const angle = rnd(Math.PI * 2);
        const distance = rnd(shakeForce) ** 3;
        const dx = distance * Math.sin(angle), dy = distance * Math.cos(angle);
        cam.transform(m => m.setTranslation(diff * p + dx, dy));
    }

    public initGame(): void {
        // Place player into world
        const player = this.getPlayer();
        const pos = player.getScenePosition();
        player.remove().moveTo(pos.x, pos.y).appendTo(this.getGameScene().rootNode);
        MusicManager.getInstance().loopTrack(1);
        FxManager.getInstance().playSounds();
        // this.turnOnAllLights();
    }

    private initDone(): void {
        this.startDialog(6 - this.npcs.length);
        // Place player into train initially
        // const player = this.getPlayer();
        // const train = this.getTrain();
        // player.moveTo(25, 50).appendTo(train);
        // this.getCamera().setFollow(player);
        this.getCamera().moveTo(1740, 370); // hacky workaround
    }

    public getPlayer(): PlayerNode {
        return this.getGameScene().rootNode.getDescendantsByType(PlayerNode)[0];
    }

    public getGameScene(): GameScene {
        const scene = this.scenes.getScene(GameScene);
        if (!scene) {
            throw new Error("GameScene not available");
        }
        return scene;
    }

    public getFader(): FadeToBlack {
        return this.getCamera().fadeToBlack;
    }

    public getCamera(): Camera {
        return this.getGameScene().camera;
    }

    public getAmbientLights(lights = this.getAllLights()): LightNode[] {
        return lights.filter(light => light.getId()?.includes("ambient"));
    }

    public getAllLights(): LightNode[] {
        return this.getGameScene().rootNode.getDescendantsByType(LightNode);
    }
}

(async () => {
    const game = new Hyperloop();
    await game.scenes.setScene(LoadingScene);
    (window as any).game = game;
    game.start();
})();
