import { Game } from "../../Game";
import { ScenePointerEvent } from "./ScenePointerEvent";

export class ScenePointerEndEvent<T extends Game = Game, A = void> extends ScenePointerEvent<T, A> {
}
