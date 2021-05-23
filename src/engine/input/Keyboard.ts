import { ControllerEvent } from "./ControllerEvent";
import { ControllerEventType } from "./ControllerEventType";
import { ControllerFamily } from "./ControllerFamily";
import { ControllerIntent } from "./ControllerIntent";
import { ControllerManager } from "./ControllerManager";
import { Signal } from "../util/Signal";

const preventDefaultKeyCodes: string[] = [
];

const keyToIntentMappings = new Map<string, ControllerIntent[]>();

keyToIntentMappings.set("KeyW", [ControllerIntent.PLAYER_MOVE_UP, ControllerIntent.MENU_UP]);
keyToIntentMappings.set("KeyA", [ControllerIntent.PLAYER_MOVE_LEFT, ControllerIntent.MENU_LEFT]);
keyToIntentMappings.set("KeyS", [ControllerIntent.PLAYER_MOVE_DOWN, ControllerIntent.MENU_DOWN]);
keyToIntentMappings.set("KeyD", [ControllerIntent.PLAYER_MOVE_RIGHT, ControllerIntent.MENU_RIGHT]);
keyToIntentMappings.set("KeyQ", [ControllerIntent.ABORT]);
keyToIntentMappings.set("KeyT", [ControllerIntent.CHAT]);
keyToIntentMappings.set("ArrowUp", [ControllerIntent.PLAYER_MOVE_UP, ControllerIntent.MENU_UP]);
keyToIntentMappings.set("ArrowDown", [ControllerIntent.PLAYER_MOVE_DOWN, ControllerIntent.MENU_DOWN]);
keyToIntentMappings.set("ArrowLeft", [ControllerIntent.PLAYER_MOVE_LEFT, ControllerIntent.MENU_LEFT]);
keyToIntentMappings.set("ArrowRight", [ControllerIntent.PLAYER_MOVE_RIGHT, ControllerIntent.MENU_RIGHT]);
keyToIntentMappings.set("Enter", [ControllerIntent.CONFIRM]);
keyToIntentMappings.set("NumpadEnter", [ControllerIntent.CONFIRM]);
keyToIntentMappings.set(" ", [ControllerIntent.CONFIRM]);
keyToIntentMappings.set("KeyP", [ControllerIntent.PAUSE]);
keyToIntentMappings.set("ShiftLeft", [ControllerIntent.PLAYER_RUN]);
keyToIntentMappings.set("ShiftRight", [ControllerIntent.PLAYER_RUN]);
keyToIntentMappings.set("KeyE", [ControllerIntent.PLAYER_INTERACT, ControllerIntent.CONFIRM]);
keyToIntentMappings.set("KeyF", [ControllerIntent.PLAYER_ACTION]);
keyToIntentMappings.set("KeyR", [ControllerIntent.PLAYER_RELOAD]);
keyToIntentMappings.set("Digit1", [ControllerIntent.PLAYER_DANCE_1]);
keyToIntentMappings.set("Digit2", [ControllerIntent.PLAYER_DANCE_2]);
keyToIntentMappings.set("Numpad1", [ControllerIntent.PLAYER_DANCE_1]);
keyToIntentMappings.set("Numpad2", [ControllerIntent.PLAYER_DANCE_2]);

export class Keyboard {
    public readonly onKeyDown = new Signal<KeyboardEvent>();
    public readonly onKeyUp = new Signal<KeyboardEvent>();
    public readonly onKeyPress = new Signal<KeyboardEvent>();
    public blockInput?: any;
    private readonly pressed = new Set<string>();
    private readonly controllerManager = ControllerManager.getInstance();

    public constructor() {
        document.addEventListener("keypress", event => this.handleKeyPress(event));
        document.addEventListener("keydown", event => this.handleKeyDown(event));
        document.addEventListener("keyup", event => this.handleKeyUp(event));
    }

    private handleKeyPress(event: KeyboardEvent): void {
        if (this.blockInput) {
            this.onKeyPress.getSlots().filter(slot => slot.context === this.blockInput).forEach(slot => slot.call(event));
            return;
        } else {
            this.onKeyPress.emit(event);
        }

        // Quick workaround to make sure, that modifier keys never trigger a game-related
        // controller event. Especially necessary to make other non-game related actions
        // possible. (Shift is used as a modifier key to enable running and is therefore
        // excluded from the list below)
        if (event.altKey || event.ctrlKey || event.metaKey) {
            return;
        }

        this.controllerManager.onButtonPress.emit(
            new ControllerEvent(
                ControllerFamily.KEYBOARD, ControllerEventType.PRESS,
                keyToIntentMappings.get(event.code) || [ControllerIntent.NONE], event.repeat
            )
        );
    }

    private handleKeyDown(event: KeyboardEvent): void {
        if (this.blockInput) {
            this.onKeyDown.getSlots().filter(slot => slot.context === this.blockInput).forEach(slot => slot.call(event));
            return;
        } else {
            this.onKeyDown.emit(event);
        }
        if (preventDefaultKeyCodes.includes(event.code)) {
            event.preventDefault();
        }

        if (!event.repeat) {
            this.pressed.add(event.key);
        }


        if (event.altKey || event.ctrlKey || event.metaKey) {
            return;
        }

        this.controllerManager.onButtonDown.emit(
            new ControllerEvent(
                ControllerFamily.KEYBOARD, ControllerEventType.DOWN,
                keyToIntentMappings.get(event.code) || [ControllerIntent.NONE], event.repeat
            )
        );
    }

    private handleKeyUp(event: KeyboardEvent): void {
        if (this.blockInput) {
            this.onKeyUp.getSlots().filter(slot => slot.context === this.blockInput).forEach(slot => slot.call(event));
            return;
        } else {
            this.onKeyUp.emit(event);
        }
        if (!event.repeat) {
            this.pressed.delete(event.key);
        }

        if (event.altKey || event.ctrlKey || event.metaKey) {
            return;
        }

        this.controllerManager.onButtonUp.emit(
            new ControllerEvent(
                ControllerFamily.KEYBOARD, ControllerEventType.UP,
                keyToIntentMappings.get(event.code) || [ControllerIntent.NONE], event.repeat
            )
        );
    }

    public isPressed(key: string): boolean {
        return this.pressed.has(key);
    }
}
