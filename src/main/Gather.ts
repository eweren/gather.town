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
import JitsiInstance from "../Jitsi";
import JitsiConference from "../typings/Jitsi/JitsiConference";
import { HEADLINE_FONT, SMALL_FONT, STANDARD_FONT } from "./constants";
import { Dialog } from "./Dialog";
import { FxManager } from "./FxManager";
import { MusicManager } from "./MusicManager";
import { CharacterNode, PostCharacterTags } from "./nodes/CharacterNode";
import { LightNode } from "./nodes/LightNode";
import { OtherPlayerNode } from "./nodes/OtherPlayerNode";
import { PlayerNode } from "./nodes/PlayerNode";
import { PresentationBoardNode } from "./nodes/PresentationBoardNode";
import { GameScene } from "./scenes/GameScene";
import { LoadingScene } from "./scenes/LoadingScene";

export enum GameStage {
    NONE = 0,
    START = 1,
    GAME = 2
}

export class Gather extends Game {
    @asset(HEADLINE_FONT)
    public static readonly headlineFont: BitmapFont;
    @asset(STANDARD_FONT)
    public static readonly standardFont: BitmapFont;
    @asset(SMALL_FONT)
    public static readonly smallFont: BitmapFont;
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

    public preventPlayerInteraction = 0;
    public JitsiInstance?: JitsiInstance;

    private stageStartTime = 0;
    protected stageTime = 0;
    private dialogs: Dialog[] = [];
    private npcs: CharacterNode[] = [];
    private players: Record<string, OtherPlayerNode> = {};
    public room: JitsiConference | null = null;

    // Game progress
    private gameStage = GameStage.START;
    public keyTaken = false; // key taken from corpse

    // Dialog
    private currentDialogLine = 0;
    private currentDialog: Dialog | null = null;

    @asset("dialog/train.dialog.json")
    private static readonly trainDialog: DialogJSON;
    private dialogChar?: CharacterNode;
    private wasAudioMuted = false;
    private wasVideoMuted = false;
    public initialPlayerSprite = 0;

    public constructor() {
        super();
        this.JitsiInstance = new JitsiInstance();
        this.JitsiInstance.create().then(room => {
            this.room = room;
        });
    }

    // Called by GameScene
    public setupScene(): void {
        // TODO Enable this when npc can be synced
        // this.spawnNPCs();
        this.setStage(GameStage.GAME);
        // Assets cannot be loaded in constructor because the LoadingScene
        // is not initialized at constructor time and Assets are loaded in the LoadingScene
        this.dialogs = [
            new Dialog(Gather.trainDialog)
        ];

        this.input.onButtonPress.filter(e => e.isConfirm).connect(() => this.nextDialogLine(), this);
        this.input.onButtonUp.filter(e => e.isPlayerChat).connect(() => this.handleChat(), this);

        this.input.onDrag.filter(e => e.isRightStick && !!e.direction && e.direction.getLength() > 0.3).connect(this.getPlayer().handleControllerInput, this.getPlayer());
    }

    public update(dt: number, time: number): void {
        this.stageTime = time - this.stageStartTime;
        switch (this.gameStage) {
            case GameStage.GAME:
                this.updateGame();
                break;
        }
        super.update(dt, time);
    }

    public setStage(stage: GameStage): void {
        if (stage !== this.gameStage) {
            this.gameStage = stage;
            this.stageStartTime = this.getTime();
            this.initGame();
        }
    }

    /* private spawnNPCs(): void {
        const chars = [ new NpcNode({spriteIndex: 0}), new NpcNode({spriteIndex: 1}), new NpcNode({spriteIndex: 2}), new NpcNode({spriteIndex: 3}), new NpcNode({spriteIndex: 4}) ];
        const positions = [ 644, 680, 720, 760, 800 ];
        for (let i = 0; i < chars.length; i++) {
            chars[i].moveTo(positions[i], 512).appendTo(this.getGameScene().rootNode);
        }
        this.npcs = chars;
    }*/

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
            const newPlayer = new OtherPlayerNode(id, value.spriteIndex ?? 0, this.room?.getParticipantById(id).getDisplayName() ?? "anonymous", { x, y });
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
        if ("inGhostMode" in value) {
            player.inGhostMode = !!value.inGhostMode;
        }
        if ("spriteIndex" in value) {
            player.changeSprite(value.spriteIndex);
        }
        if ("playerName" in value) {
            player.changePlayerName(value.playerName);
        }
    }

    public sendCommand(eventName: string, value: any): void {
        const userId = this.room?.myUserId();
        if (userId != null) {
            this.room?.sendCommandOnce(eventName, { value: JSON.stringify({...value, spriteIndex: this.getPlayer().spriteIndex, id: userId}) });
        }
    }

    public handleOtherPlayerPresentationUpdate(args: { presentationBoardId: number, slide: number; id: string}): void {
        const presentationBoard = this.getGameScene()?.rootNode.getDescendantsByType(PresentationBoardNode)
            .find(n => n.boardId === args.presentationBoardId);
        if (args.slide === -1) {
            this.getCamera().focus(this.getPlayer(), { follow: true });
            presentationBoard?.endPresentation();
            this.preventPlayerInteraction = clamp(this.preventPlayerInteraction - 1, 0, Infinity);
            this.turnOnAllLights();
            if (!this.wasAudioMuted) {
                this.room?.getLocalAudioTrack()?.unmute();
            }
            if (!this.wasVideoMuted) {
                this.room?.getLocalVideoTrack()?.unmute();
            }
            this.room?.getParticipants()?.forEach(p => {
                const pId = p.getId();
                const parentElement = document.getElementById(`${pId}video`)?.parentElement;
                if (parentElement) {
                    parentElement.hidden = false;
                }
            });
            const localVid = document.getElementById("localVideo")?.parentElement;
            if (localVid != null) {
                localVid.hidden = false;
            }
        } else if (this.getCamera().getFollow() === presentationBoard && presentationBoard != null) {
            presentationBoard.setSlide(args.slide);
        } else if (presentationBoard != null) {
            this.getCamera().focus(presentationBoard).then((successful) => {
                if (successful) {
                    this.getCamera().setFollow(presentationBoard);
                    presentationBoard?.startPresentation();
                    this.preventPlayerInteraction++;
                    this.dimLights();
                    this.wasAudioMuted = !!this.room?.getLocalAudioTrack()?.isMuted();
                    this.wasVideoMuted = !!this.room?.getLocalAudioTrack()?.isMuted();
                    this.room?.getParticipants()?.filter(p => p.getId() !== args.id).forEach(p => {
                        const pId = p.getId();
                        const parentElement = document.getElementById(`${pId}video`)?.parentElement;
                        if (parentElement != null) {
                            parentElement.hidden = true;
                            console.log("Hide element");
                        }
                    });
                    this.room?.getLocalAudioTrack()?.mute();
                    // this.room?.getLocalVideoTrack()?.mute();
                    const localVid = document.getElementById("localVideo")?.parentElement;
                    if (localVid != null) {
                        localVid.hidden = true;
                    }
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

    private nextDialogLine(char = this.dialogChar): void {
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

    private handleChat(): void {
        if (document.getElementById("textInput")) {
            return;
        }
        const input = document.createElement("input");
        input.style.position = "absolute";
        input.style.margin = "20px auto";
        input.style.margin = "0 auto";
        input.style.left = "0";
        input.style.right = "0";
        input.style.top = "0";
        input.style.height = "20px";
        input.id = "textInput";
        document.body.append(input);
        input.textContent = "";
        input.focus();
        this.preventPlayerInteraction++;
        input.addEventListener("keypress", (ev) => {
            if (ev.key === "Enter") {
                ev.preventDefault();
                ev.stopImmediatePropagation();
                const text = input.value;
                const otherPlayers = this.getGameScene()?.rootNode.getDescendantsByType(OtherPlayerNode);
                const filteredPlayers = otherPlayers
                    .filter(p => p.getPosition().getDistance(this.getPlayer().getPosition()) < 50)
                    .map(p => p.getId()!);
                if (filteredPlayers.length > 0) {
                    filteredPlayers.forEach(p => {
                        this.room?.sendMessage(text, p);
                    });
                } else {
                    this.room?.sendMessage(text);
                }
                this.preventPlayerInteraction = clamp(this.preventPlayerInteraction - 1, 0, Infinity);
                if (text) {
                    this.getPlayer().say(text, 5);
                }
                input.remove();
            }
        });
    }

    public startDialog(num: number, char?: CharacterNode): void {
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

    public initGame(): void {
        // Place player into world
        const player = this.getPlayer();
        player.changeSprite(this.initialPlayerSprite);
        const pos = player.getScenePosition();
        player.remove().moveTo(pos.x, pos.y).appendTo(this.getGameScene().rootNode);
        MusicManager.getInstance().loopTrack(0);
        FxManager.getInstance().playSounds();
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

    public isInGameScene(): boolean {
        return this.scenes.getScene(GameScene) != null;
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
