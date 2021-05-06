import { DialogJSON } from "*.dialog.json";
import createCustomElements from "../customElements/createCustomElements";
import { Aseprite } from "../engine/assets/Aseprite";
import { asset } from "../engine/assets/Assets";
import { BitmapFont } from "../engine/assets/BitmapFont";
import { RGBColor } from "../engine/color/RGBColor";
import { Game } from "../engine/Game";
import { Camera } from "../engine/scene/Camera";
import { FadeToBlack } from "../engine/scene/camera/FadeToBlack";
import { clamp } from "../engine/util/math";
import { rnd } from "../engine/util/random";
import Jitsi from "../Jitsi";
import JitsiConference from "../typings/Jitsi/JitsiConference";
import { HEADLINE_FONT, STANDARD_FONT } from "./constants";
import { Dialog } from "./Dialog";
import { FxManager } from "./FxManager";
import { MusicManager } from "./MusicManager";
import { CharacterNode, PostCharacterTags } from "./nodes/CharacterNode";
import { LightNode } from "./nodes/LightNode";
import { NpcNode } from "./nodes/NpcNode";
import { OtherPlayerNode } from "./nodes/OtherPlayerNode";
import { PlayerNode } from "./nodes/PlayerNode";
import { PresentationBoardNode } from "./nodes/PresentationBoardNode";
import { GameScene } from "./scenes/GameScene";
import { LoadingScene } from "./scenes/LoadingScene";
import { SuccessScene } from "./scenes/SuccessScene";

export enum GameStage {
    NONE = 0,
    GAME = 1,
    DONE = 2
}

export class Gather extends Game {
    @asset(HEADLINE_FONT)
    public static readonly headlineFont: BitmapFont;
    @asset(STANDARD_FONT)
    public static readonly standardFont: BitmapFont;
    @asset([
        "sprites/characters/character.aseprite.json",
        "sprites/characters/dark_staff_black.aseprite.json",
        "sprites/characters/HalloweenGhost.aseprite.json",
        "sprites/characters/dark_casualjacket_orange_white.aseprite.json",
        "sprites/characters/light_male_pkmn_red.aseprite.json",
        "sprites/characters/femalenerdydark_green.aseprite.json",
        "sprites/characters/dark_graduation_orange.aseprite.json",
        "sprites/characters/light_female_pkmn_yellow.aseprite.json"

    ])
    public static characterSprites: Aseprite[];

    public static instance: Gather;

    public playerIsPresenting = false;

    private stageStartTime = 0;
    private stageTime = 0;
    private dialogs: Dialog[] = [];
    private npcs: CharacterNode[] = [];
    private players: Record<string, OtherPlayerNode> = {};
    private firstCommand = true;
    public room: JitsiConference | null = null;

    // Game progress
    private gameStage = GameStage.NONE;
    public keyTaken = false; // key taken from corpse
    private fadeOutInitiated = false;

    // Dialog
    private currentDialogLine = 0;
    private currentDialog: Dialog | null = null;

    @asset("dialog/train.dialog.json")
    private static readonly trainDialog: DialogJSON;
    private dialogChar?: CharacterNode;

    public constructor() {
        super();
        Jitsi().then(room => {
            this.room = room;
        });
    }

    // Called by GameScene
    public setupScene(): void {
        this.spawnNPCs();
        this.setStage(GameStage.GAME);
        // Assets cannot be loaded in constructor because the LoadingScene
        // is not initialized at constructor time and Assets are loaded in the LoadingScene
        this.dialogs = [
            new Dialog(Gather.trainDialog)
        ];

        this.input.onButtonPress.filter(e => e.isConfirm).connect(() => this.nextDialogLine(), this);

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
        const chars = [ new NpcNode({spriteIndex: 0}), new NpcNode({spriteIndex: 1}), new NpcNode({spriteIndex: 2}), new NpcNode({spriteIndex: 3}), new NpcNode({spriteIndex: 4}) ];
        const positions = [ 644, 680, 720, 760, 800 ];
        for (let i = 0; i < chars.length; i++) {
            chars[i].moveTo(positions[i], 512).appendTo(this.getGameScene().rootNode);
        }
        this.npcs = chars;
    }

    public removePlayer(id: string): void {
        this.players[id]?.remove();
    }

    public updatePlayer(value: Record<string, any>): void {
        if (value == null) {
            return;
        }
        const id = value.id;
        if (this.players[id] == null) {
            const { x, y } = this.getGameScene().mapNode.getPlayerSpawn();
            const newPlayer = new OtherPlayerNode(id, value.spriteIndex ?? 0, { x, y });
            this.players[id] = newPlayer;
            this.getGameScene().rootNode.appendChild(newPlayer);
        }
        const player = this.players[id];
        if (id === this.room?.myUserId() || player == null || player.isPlayer) {
            return;
        }
        if ("x" in value) {
            player.x = value.x;
        }
        if ("y" in value) {
            player.y = value.y;
        }
        if ("direction" in value) {
            player.setDirection(value.direction);
        }
        if ("dances" in value) {
            player.setTag(PostCharacterTags.DANCE);
        }
        if ("isRunning" in value) {
            player.isRunning = !!value.isRunning;
        }
        if ("spriteIndex" in value) {
            player.changeSprite(value.spriteIndex);
        }
    }

    public sendCommand(eventName: string, value: any): void {
        const userId = this.room?.myUserId();
        if (userId != null) {
            if (this.firstCommand) {
                this.firstCommand = false;
                this.room?.sendCommandOnce(eventName, { value: JSON.stringify({...value, spriteIndex: this.getPlayer().spriteIndex, id: userId}) });
            } else {
                this.room?.sendCommandOnce(eventName, { value: JSON.stringify({...value, id: userId}) });
            }
        }
    }

    public handleOtherPlayerPresentation(presentationBoardId: number): void {
        const presentationBoard = this.getGameScene()?.rootNode.getDescendantsByType(PresentationBoardNode).find(n => n.boardId === presentationBoardId);
        if (presentationBoard != null) {
            this.getGameScene()?.camera.focus(presentationBoard).then((successful) => {
                if (successful) {
                    presentationBoard?.startPresentation();
                    this.playerIsPresenting = true;
                    this.dimLights();
                }
            });
        }
    }

    public handleOtherPlayerPresentationUpdate(args: {presentationBoardId: number, slide: number}): void {
        const presentationBoard = this.getGameScene()?.rootNode.getDescendantsByType(PresentationBoardNode)
            .find(n => n.boardId === args.presentationBoardId);
        if (args.slide === -1) {
            this.getCamera().focus(this.getPlayer(), { follow: true });
            presentationBoard?.endPresentation();
            this.playerIsPresenting = false;
            this.turnOnAllLights();
        } else if (this.getCamera().getFollow() === presentationBoard && presentationBoard != null) {
            presentationBoard.setSlide(args.slide);
        } else if (presentationBoard != null) {
            this.getCamera().focus(presentationBoard).then((successful) => {
                if (successful) {
                    this.getCamera().setFollow(presentationBoard);
                    console.log("Follow other players presentation");
                    presentationBoard?.startPresentation();
                    this.playerIsPresenting = true;
                    this.dimLights();
                }
            });
        }

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

    private nextDialogLine(char = this.dialogChar) {
        // Shut up all characters
        this.npcs.forEach(npc => npc.say());
        this.getPlayer().say();
        this.currentDialogLine++;
        if (this.currentDialog && this.currentDialogLine >= this.currentDialog.lines.length) {
            this.currentDialog = null;
            this.currentDialogLine = 0;
        } else if (this.currentDialog) {
            // Show line
            const line = this.currentDialog.lines[this.currentDialogLine];
            char = line.charNum >= 1 ? char ?? this.npcs[line.charNum] : this.getPlayer();
            char.say(line.line, Infinity);
        }
        if (this.currentDialogLine > (this.currentDialog?.lines.length ?? 0) - 1) {
            if (this.dialogChar != null && this.dialogChar !== char) {
                this.dialogChar.inConversation = false;
            }
        }
    }

    public startDialog(num: number, char?: CharacterNode) {
        if (this.currentDialog) {
            return;
        }
        this.currentDialog = this.dialogs[num];
        this.currentDialogLine = -1;
        if (this.dialogChar != null && this.dialogChar !== char) {
            this.dialogChar.inConversation = false;
        }
        this.dialogChar = char;
        if (this.dialogChar) {
            this.dialogChar.inConversation = true;
        }
        this.nextDialogLine(char);
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
        MusicManager.getInstance().loopTrack(0);
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

    public getPlayer(id?: string): PlayerNode {
        return this.getGameScene().rootNode.getDescendantsByType(PlayerNode)[0];
    }

    public getOtherPlayerById(id: string): OtherPlayerNode | null {
        return this.players[id];
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

    public log(el: any) {
        console.log(el);
    }
}

(async () => {
    createCustomElements();
    const game = new Gather();
    Gather.instance = game;
    await game.scenes.setScene(LoadingScene);
    (window as any).game = game;
    game.start();
})();
