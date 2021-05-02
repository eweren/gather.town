import { Gather } from "../Gather";
import { Scene } from "../../engine/scene/Scene";
import { ProgressBarNode } from "../../engine/scene/ProgressBarNode";
import { FadeTransition } from "../../engine/transitions/FadeTransition";
import { GameScene } from "./GameScene";

export class LoadingScene extends Scene<Gather> {
    private progressBar!: ProgressBarNode;

    public setup(): void {
        this.outTransition = new FadeTransition();
        this.progressBar = new ProgressBarNode({
            x: this.game.width >> 1,
            y: this.game.height >> 1
        }).appendTo(this.rootNode);
    }

    public cleanup(): void {
        this.rootNode.clear();
    }

    public async activate(): Promise<void> {
        this.game.assets.load(this.updateProgress.bind(this)).then(() => {
            this.game.scenes.setScene(GameScene);
        });
    }

    private updateProgress(total: number, loaded: number): void {
        if (loaded < total) {
            this.progressBar.setProgress(loaded / total);
        } else {
            this.progressBar.remove();
        }
    }
}
