import { Vector2, Vector2Like } from "../graphics/Vector2";
import { ControllerEventType } from "./ControllerEventType";
import { ControllerFamily } from "./ControllerFamily";
import { ControllerIntent } from "./ControllerIntent";
import { GamepadModel } from "./GamepadModel";

const controllerFamilySymbol = Symbol("controllerFamily");
const intentsSymbol = Symbol("intent");
const eventTypeSymbol = Symbol("eventType");
const repeatSymbol = Symbol("repeat");
const directionSymbol = Symbol("direction");

export class ControllerEvent extends Object {
    private [controllerFamilySymbol]: ControllerFamily;
    private [intentsSymbol]: ControllerIntent;
    private [eventTypeSymbol]: ControllerEventType;
    private [repeatSymbol]: boolean;
    private [directionSymbol]: Vector2Like | undefined;

    constructor(
        controllerFamily: ControllerFamily, eventType: ControllerEventType,
        intents: ControllerIntent[], repeat: boolean = false,
        direction?: Vector2Like
    ) {
        super();

        this[controllerFamilySymbol] = controllerFamily;
        this[intentsSymbol] = intents.reduce((prev, curr) => prev | curr);
        this[eventTypeSymbol] = eventType;
        this[repeatSymbol] = repeat;
        this[directionSymbol] = direction;
    }

    get controllerFamily(): ControllerFamily {
        return this[controllerFamilySymbol];
    }

    get eventType(): ControllerEventType {
        return this[eventTypeSymbol];
    }

    get intents(): ControllerIntent {
        return this[intentsSymbol];
    }

    get repeat(): boolean {
        return this[repeatSymbol];
    }

    get isMenuLeft(): boolean {
        return (this[intentsSymbol] & ControllerIntent.MENU_LEFT) === ControllerIntent.MENU_LEFT;
    }

    get isMenuRight(): boolean {
        return (this[intentsSymbol] & ControllerIntent.MENU_RIGHT) === ControllerIntent.MENU_RIGHT;
    }

    get isMenuUp(): boolean {
        return (this[intentsSymbol] & ControllerIntent.MENU_UP) === ControllerIntent.MENU_UP;
    }

    get isMenuDown(): boolean {
        return (this[intentsSymbol] & ControllerIntent.MENU_DOWN) === ControllerIntent.MENU_DOWN;
    }

    get isPlayerMoveLeft(): boolean {
        return (this[intentsSymbol] & ControllerIntent.PLAYER_MOVE_LEFT) === ControllerIntent.PLAYER_MOVE_LEFT;
    }

    get isPlayerMoveRight(): boolean {
        return (this[intentsSymbol] & ControllerIntent.PLAYER_MOVE_RIGHT) === ControllerIntent.PLAYER_MOVE_RIGHT;
    }

    get isPlayerJump(): boolean {
        return (this[intentsSymbol] & ControllerIntent.PLAYER_MOVE_UP) === ControllerIntent.PLAYER_MOVE_UP;
    }

    get isPlayerDrop(): boolean {
        return (this[intentsSymbol] & ControllerIntent.PLAYER_MOVE_DOWN) === ControllerIntent.PLAYER_MOVE_DOWN;
    }

    get isPlayerChat(): boolean {
        return (this[intentsSymbol] & ControllerIntent.CHAT) === ControllerIntent.CHAT;
    }

    get isPlayerInteract(): boolean {
        return (this[intentsSymbol] & ControllerIntent.PLAYER_INTERACT) === ControllerIntent.PLAYER_INTERACT;
    }

    get isPlayerAction(): boolean {
        return (this[intentsSymbol] & ControllerIntent.PLAYER_ACTION) === ControllerIntent.PLAYER_ACTION;
    }

    get isPlayerRun(): boolean {
        return (this[intentsSymbol] & ControllerIntent.PLAYER_RUN) === ControllerIntent.PLAYER_RUN;
    }

    get isPlayerReload(): boolean {
        return (this[intentsSymbol] & ControllerIntent.PLAYER_RELOAD) === ControllerIntent.PLAYER_RELOAD;
    }

    get isPlayerDance1(): boolean {
        return (this[intentsSymbol] & ControllerIntent.PLAYER_DANCE_1) === ControllerIntent.PLAYER_DANCE_1;
    }

    get isPlayerDance2(): boolean {
        return (this[intentsSymbol] & ControllerIntent.PLAYER_DANCE_2) === ControllerIntent.PLAYER_DANCE_2;
    }

    get isPause(): boolean {
        return (this[intentsSymbol] & ControllerIntent.PAUSE) === ControllerIntent.PAUSE;
    }

    get isConfirm(): boolean {
        return (this[intentsSymbol] & ControllerIntent.CONFIRM) === ControllerIntent.CONFIRM;
    }

    get isAbort(): boolean {
        return (this[intentsSymbol] & ControllerIntent.ABORT) === ControllerIntent.ABORT;
    }

    get isLeftStick(): boolean {
        return (this[intentsSymbol] & ControllerIntent.LEFT_STICK) === ControllerIntent.LEFT_STICK;
    }

    get isRightStick(): boolean {
        return (this[intentsSymbol] & ControllerIntent.RIGHT_STICK) === ControllerIntent.RIGHT_STICK;
    }

    get direction(): Vector2 | undefined {
        const direction = this[directionSymbol];
        if (direction) {
            return new Vector2().setVector(direction);
        }
        return direction;
    }
}

const gamepadModelSymbol = Symbol("gamepadModel");

export class GamepadControllerEvent extends ControllerEvent {
    private [gamepadModelSymbol]: GamepadModel;
    constructor(gamepadModel: GamepadModel, eventType: ControllerEventType, intents: ControllerIntent[], repeat: boolean = false, direction?: Vector2Like) {
        super(ControllerFamily.GAMEPAD, eventType, intents, repeat, direction);
        this[gamepadModelSymbol] = gamepadModel;
    }
    get gamepadModel(): GamepadModel {
        return this[gamepadModelSymbol];
    }
}
