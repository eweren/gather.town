import { Gather } from "../Gather";
import { Scene } from "../../engine/scene/Scene";
import { asset } from "../../engine/assets/Assets";
import { GameScene } from "./GameScene";
import { FadeToBlackTransition } from "../../engine/transitions/FadeToBlackTransition";
import { MusicManager } from "../MusicManager";
import { FadeTransition } from "../../engine/transitions/FadeTransition";
import { Sound } from "../../engine/assets/Sound";
import { AsepriteNode } from "../../engine/scene/AsepriteNode";
import { SceneNode } from "../../engine/scene/SceneNode";
import { Direction } from "../../engine/geom/Direction";
import { PostCharacterTags } from "../nodes/CharacterNode";
import { TextNode } from "../../engine/scene/TextNode";
import { TextInputNode } from "../nodes/TextInputNode";
import { OnlineService } from "../../engine/online/OnlineService";

export class TitleScene extends Scene<Gather> {
    @asset("sounds/interface/click.mp3")
    private static confirmSound: Sound;

    private characterNodes: Array<AsepriteNode<Gather>> =
        Gather.characterSprites.map(aseprite => new AsepriteNode<Gather>({ aseprite, tag: PostCharacterTags.IDLE, anchor: Direction.RIGHT }));
    private chooseNode = new TextNode<Gather>({ font: Gather.headlineFont, text: "CHOOSE CHARACTER" });
    private confirmNode = new TextNode<Gather>({ font: Gather.standardFont, text: "⤶ SELECT", color: "grey" });
    private containerNode = new SceneNode<Gather>();
    private nameInputNode = new TextInputNode<Gather>("", "ENTER USERNAME", 12);
    private index = 1;
    private name = "";

    public setup() {
        this.inTransition = new FadeTransition();
        this.outTransition = new FadeToBlackTransition({ duration: 0.5, exclusive: true });
        this.characterNodes.forEach(node => {
            this.containerNode.appendChild(node);
        });
        this.updatePositions();
        this.rootNode.setChildAnchor(Direction.CENTER);
        this.rootNode.appendChild(this.containerNode);
        this.rootNode.appendChild(this.chooseNode);
        this.chooseNode.moveBy(0, -60);
        this.rootNode.appendChild(this.confirmNode);
        this.rootNode.appendChild(this.nameInputNode);
        this.nameInputNode.onTextSubmit.connect(this.updateName, this);
        this.nameInputNode.moveBy(0, 60);
        this.confirmNode.moveBy(0, 90);
        this.moveLeft();

        MusicManager.getInstance().loopTrack(0);
    }
    private moveLeft(): void {
        this.characterNodes[this.index]?.scaleBy(1);
        this.index = (this.index + this.characterNodes.length - 1) % this.characterNodes.length;
        this.characterNodes[this.index]?.scaleBy(2);
        this.updatePositions();

    }
    private moveRight(): void {
        this.characterNodes[this.index]?.scaleBy(1);
        this.index = (this.index + 1) % this.characterNodes.length;
        this.characterNodes[this.index]?.scaleBy(2);
        this.updatePositions();
    }
    private goToGame(): void {
        TitleScene.confirmSound.play();
        this.startGame();
    }

    private updatePositions(): void {
        let posX = - Gather.characterSprites[0].width - 10;
        this.characterNodes.forEach(node => {
            posX += node.width + 10;
            node.moveTo(posX, 0);
        });
        this.containerNode.moveTo(-this.index * (Gather.characterSprites[0].width + 10), 0);
    }

    public cleanup(): void {
        this.rootNode.clear();
    }

    public startGame(): void {
        this.game.onlineService = new OnlineService(this.nameInputNode.text);
        this.game.initialPlayerSprite = this.index;
        this.game.scenes.setScene(GameScene);
    }

    public activate(): void {
        this.game.keyboard.onKeyDown.connect(this.handleButtonPress, this);
    }

    private handleButtonPress(ev: KeyboardEvent): void {
        if (ev.key === "ArrowLeft" || ev.key === "a") {
            this.moveLeft();
        } else if (ev.key === "ArrowRight" || ev.key === "d") {
            this.moveRight();
        } else if ((ev.key === "Enter" || ev.key === " ") && this.name !== "") {
            this.goToGame();
        } else if ((ev.key === "Enter" || ev.key === " ") && this.name === "" || (ev.key === "s" || ev.key === "ArrowDown")) {
            this.nameInputNode.focus();
        }
    }

    private updateName(name: string): void {
        this.game.userName = name;
        this.name = name;
        if (name.length > 0) {
            this.confirmNode.setColor("white");
        } else {
            this.confirmNode.setColor("grey");
        }
    }

    public deactivate(): void {
        this.nameInputNode.onTextSubmit.disconnect(this.updateName, this);
        this.game.keyboard.onKeyDown.disconnect(this.handleButtonPress, this);
    }
}
