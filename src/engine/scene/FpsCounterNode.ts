import { Game } from "../Game";
import { TextNode } from "./TextNode";

export class FpsCounterNode<T extends Game> extends TextNode<T> {
    private frameCounter = 0;
    private lastUpdate = 0;

    public update(dt: number, time: number) {
        super.update(dt, time);
        if (this.lastUpdate + 1 < time) {
            this.setText(`${this.frameCounter} FPS`);
            this.lastUpdate = time;
            this.frameCounter = 0;
        }
        this.frameCounter++;
    }
}
