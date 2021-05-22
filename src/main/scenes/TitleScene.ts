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
import { ControllerEvent } from "../../engine/input/ControllerEvent";

export class TitleScene extends Scene<Gather> {
    @asset("sounds/interface/click.mp3")
    private static confirmSound: Sound;

    private characterNodes: Array<AsepriteNode<Gather>> =
        Gather.characterSprites.map(aseprite => new AsepriteNode<Gather>({ aseprite, tag: PostCharacterTags.IDLE, anchor: Direction.RIGHT }));
    private chooseNode = new TextNode<Gather>({ font: Gather.headlineFont, text: "CHOOSE CHARACTER" });
    private confirmNode = new TextNode<Gather>({ font: Gather.standardFont, text: "⤶ SELECT" });
    private containerNode = new SceneNode<Gather>();
    private index = 1;

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
        this.confirmNode.moveBy(0, 60);
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
        this.game.initialPlayerSprite = this.index;
        this.game.scenes.setScene(GameScene);
    }

    public activate(): void {
        this.input.onButtonPress.connect(this.handleButtonPress, this);
    }

    private handleButtonPress(ev: ControllerEvent): void {
        if (ev.isMenuLeft) {
            this.moveLeft();
        } else if (ev.isMenuRight) {
            this.moveRight();
        } else if (ev.isConfirm) {
            this.goToGame();
        }
    }

    public deactivate(): void {
        this.input.onButtonPress.disconnect(this.handleButtonPress, this);
    }
}
