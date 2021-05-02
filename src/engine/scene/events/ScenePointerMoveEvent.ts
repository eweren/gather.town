import { Game } from "../../Game";
import { ScenePointerEvent } from "./ScenePointerEvent";

export class ScenePointerMoveEvent<T extends Game = Game, A = void> extends ScenePointerEvent<T, A> {
}
