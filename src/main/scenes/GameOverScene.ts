import { Hyperloop } from "../Hyperloop";
import { Scene } from "../../engine/scene/Scene";
import { asset } from "../../engine/assets/Assets";
import { GAME_HEIGHT, GAME_WIDTH, STANDARD_FONT } from "../constants";
import { TextNode } from "../../engine/scene/TextNode";
import { BitmapFont } from "../../engine/assets/BitmapFont";
import { Direction } from "../../engine/geom/Direction";
import { ImageNode } from "../../engine/scene/ImageNode";
import { ControllerIntent } from "../../engine/input/ControllerIntent";
import { ControllerEvent } from "../../engine/input/ControllerEvent";
import { FadeToBlackTransition } from "../../engine/transitions/FadeToBlackTransition";
import { FadeTransition } from "../../engine/transitions/FadeTransition";
import { TitleScene } from "./TitleScene";
import { ControllerFamily } from "../../engine/input/ControllerFamily";

export class GameOverScene extends Scene<Hyperloop> {
    @asset(STANDARD_FONT)
    private static font: BitmapFont;

    @asset("images/gameover-image.png")
    private static image: HTMLImageElement;

    private imageNode: ImageNode = new ImageNode({ image: GameOverScene.image, anchor: Direction.TOP_LEFT});
    private textNode = new TextNode({ font: GameOverScene.font, anchor: Direction.BOTTOM });

    public setup() {
        this.inTransition = new FadeTransition();
        this.outTransition = new FadeToBlackTransition({ duration: 0.5, exclusive: true });
        this.imageNode.appendTo(this.rootNode);
        this.textNode
            .setText(`PRESS ${this.input.currentControllerFamily === ControllerFamily.GAMEPAD ? "A" : "ENTER"} TO RETURN TO MENU`)
            .moveTo(GAME_WIDTH / 2, GAME_HEIGHT - 64)
            .appendTo(this.rootNode);
    }

    public cleanup(): void {
        this.rootNode.clear();
    }

    public backToStart (): void {
        this.game.scenes.setScene(TitleScene);
    }

    public activate(): void {
        this.game.input.onButtonPress.connect(this.handleButton, this);
    }

    public deactivate(): void {
        this.game.input.onButtonPress.disconnect(this.handleButton, this);
    }

    private handleButton(event: ControllerEvent): void {
        if (event.intents & ControllerIntent.CONFIRM) {
            this.backToStart();
        }
    }
}
