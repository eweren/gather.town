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
import { MusicManager } from "../MusicManager";
import { FxManager } from "../FxManager";
import { ControllerFamily } from "../../engine/input/ControllerFamily";

export class SuccessScene extends Scene<Hyperloop> {
    @asset(STANDARD_FONT)
    private static font: BitmapFont;

    @asset("images/success-image.png")
    private static image: HTMLImageElement;

    private imageNode: ImageNode = new ImageNode({ image: SuccessScene.image, anchor: Direction.TOP_LEFT});
    private creditNodes: TextNode[] = [];
    private textNode = new TextNode({ font: SuccessScene.font, anchor: Direction.RIGHT });

    public setup() {
        this.inTransition = new FadeTransition();
        this.outTransition = new FadeToBlackTransition({ duration: 0.5, exclusive: true });
        this.imageNode.appendTo(this.rootNode);
        this.buildCredits();
        const keyToPress = this.input.currentControllerFamily === ControllerFamily.GAMEPAD ? "B" : "Enter";
        this.textNode
            .setText(`Press ${keyToPress} to exit`)
            .moveTo(GAME_WIDTH - 56, GAME_HEIGHT - 64)
            .appendTo(this.rootNode);
        MusicManager.getInstance().loopTrack(3);
        FxManager.getInstance().stop();
    }

    public buildCredits (): void {

        const lineHeight = 12;
        const lines: string [] = [
            "Thank you for playing!",
            "",
            "This game was made for",
            "Ludum Dare 47 in three days!",
            "",
            "",
            "Credits",
            "",
            "Eduard But",
            "Nico Hülscher",
            "Stephanie Jahn",
            "Benjamin Jung",
            "Nils Kreutzer",
            "Bastian Lang",
            "Ranjit Mevius",
            "Markus Over",
            "Klaus Reimer",
            "Vladimir Sakhovski",
            "Christina Schneider",
            "Lisa Tsakiris",
            "Jennifer van Veen",
            "Moritz Vieth",
            "Matthias Wetter",
        ];

        lines.forEach((l, i) => {
            this.creditNodes.push(new TextNode({ font: SuccessScene.font, text: l, color: "white", anchor: Direction.TOP_LEFT }).moveTo(16, GAME_HEIGHT + lineHeight * i).appendTo(this.rootNode));
        });
    }

    public update (dt: number, time: number): void {
        super.update(dt, time);
        const keyToPress = this.input.currentControllerFamily === ControllerFamily.GAMEPAD ? "B" : "Enter";
        this.textNode.setText(`Press ${keyToPress} to exit`);

        this.creditNodes.forEach( n => {
            n.moveBy(0, -12 * dt);
        });
    }

    public cleanup(): void {
        this.rootNode.clear();
    }

    public backToStart (): void {
        this.game.scenes.setScene(TitleScene);
    }

    public activate(): void {
        this.game.input.onButtonDown.connect(this.handleButton, this);
    }

    public deactivate(): void {
        this.game.input.onButtonDown.disconnect(this.handleButton, this);
    }

    private handleButton(event: ControllerEvent): void {
        if (event.intents & ControllerIntent.CONFIRM || event.intents & ControllerIntent.ABORT) {
            this.backToStart();
        }
    }
}
