import { Game } from "../../Game";
import { Signal } from "../../util/Signal";
import { ScenePointerEvent } from "./ScenePointerEvent";
import { ScenePointerMoveEvent } from "./ScenePointerMoveEvent";
import { ScenePointerEndEvent } from "./ScenePointerEndEvent";

export class ScenePointerDownEvent<T extends Game = Game, A = void> extends ScenePointerEvent<T, A> {
    public readonly onPointerMove = new Signal<ScenePointerMoveEvent<T, A>>(this.initPointerMove.bind(this));
    public readonly onPointerEnd = new Signal<ScenePointerEndEvent<T, A>>(this.initPointerEnd.bind(this));

    private initPointerMove(signal: Signal<ScenePointerMoveEvent<T, A>>) {
        const listener = (event: PointerEvent) => {
            signal.emit(new ScenePointerMoveEvent(this.scene, event));
        };
        const canvas = this.scene.game.canvas;
        const cleanup = () => {
            canvas.removeEventListener("pointermove", listener);
            this.onPointerEnd.disconnect(cleanup);
        };
        canvas.addEventListener("pointermove", listener);
        return cleanup;
    }

    private initPointerEnd(signal: Signal<ScenePointerEndEvent<T, A>>) {
        const listener = (event: PointerEvent) => {
            signal.emit(new ScenePointerMoveEvent(this.scene, event));
            cleanup();
        };
        const cleanup = () => {
            canvas.removeEventListener("pointercancel", listener);
            canvas.removeEventListener("pointerup", listener);
            this.onPointerMove.clear();
            this.onPointerEnd.clear();
        };
        const canvas = this.scene.game.canvas;
        canvas.addEventListener("pointerup", listener);
        canvas.addEventListener("pointercancel", listener);
        return cleanup;
    }

    public getButton(): number {
        return this.event.button;
    }
}
