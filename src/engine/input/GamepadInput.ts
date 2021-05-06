import { ControllerManager } from "./ControllerManager";
import { ControllerIntent } from "./ControllerIntent";
import { ControllerEventType } from "./ControllerEventType";
import { GamepadControllerEvent } from "./ControllerEvent";
import { GamepadModel } from "./GamepadModel";
import { Vector2 } from "../graphics/Vector2";
import { clamp } from "../util/math";

/**
 * Game Pad Buttons
 */
enum GamePadButtonId {
    /** Button A / Cross*/
    BUTTON_1 = 0,
    /** Button B / Circle*/
    BUTTON_2 = 1,
    /** Button X / Square*/
    BUTTON_3 = 2,
    /** Button Y / Triangle */
    BUTTON_4 = 3,
    SHOULDER_TOP_LEFT = 4,
    SHOULDER_TOP_RIGHT = 5,
    SHOULDER_BOTTOM_LEFT = 6,
    SHOULDER_BOTTOM_RIGHT = 7,
    SELECT = 8,
    START = 9,
    STICK_BUTTON_LEFT = 10,
    STICK_BUTTON_RIGHT = 11,
    D_PAD_UP = 12,
    D_PAD_DOWN = 13,
    D_PAD_LEFT = 14,
    D_PAD_RIGHT = 15,
    VENDOR = 16,
    RIGHT_STICK = 17,
    LEFT_STICK = 18
}

enum StickAxisId {
    /** Left stick X axis */
    RIGHT_HORIZONTAL = 0,
    /** Left stick Y axis */
    RIGHT_VERTICAL = 1,
    /** Right stick X axis */
    LEFT_HORIZONTAL = 2,
    /** Right stick Y axis */
    LEFT_VERTICAL = 3
}

const axisMapping = new Map<number, {button1: number|undefined, button2: number|undefined}>();
axisMapping.set(StickAxisId.RIGHT_HORIZONTAL, { button1: GamePadButtonId.D_PAD_LEFT, button2: GamePadButtonId.D_PAD_RIGHT });
axisMapping.set(StickAxisId.RIGHT_VERTICAL, { button1: GamePadButtonId.D_PAD_UP, button2: GamePadButtonId.D_PAD_DOWN });

const vectorAxes = new Map<GamePadButtonId, { x: StickAxisId, y: StickAxisId, intents: ControllerIntent[] }>();
vectorAxes.set(GamePadButtonId.LEFT_STICK, { x: StickAxisId.LEFT_HORIZONTAL, y: StickAxisId.LEFT_VERTICAL, intents: [ControllerIntent.LEFT_STICK] });
vectorAxes.set(GamePadButtonId.RIGHT_STICK, { x: StickAxisId.RIGHT_HORIZONTAL, y: StickAxisId.RIGHT_VERTICAL, intents: [ControllerIntent.RIGHT_STICK] });

const intentMappings = new Map<number, ControllerIntent[]>();
intentMappings.set(GamePadButtonId.D_PAD_UP, [ControllerIntent.MENU_UP]);
intentMappings.set(GamePadButtonId.D_PAD_DOWN, [ControllerIntent.PLAYER_MOVE_DOWN, ControllerIntent.MENU_DOWN]);
intentMappings.set(GamePadButtonId.D_PAD_LEFT, [ControllerIntent.PLAYER_MOVE_LEFT, ControllerIntent.MENU_LEFT]);
intentMappings.set(GamePadButtonId.D_PAD_RIGHT, [ControllerIntent.PLAYER_MOVE_RIGHT, ControllerIntent.MENU_RIGHT]);
intentMappings.set(GamePadButtonId.BUTTON_1, [ControllerIntent.PLAYER_MOVE_UP, ControllerIntent.CONFIRM]);
intentMappings.set(GamePadButtonId.BUTTON_2, [ControllerIntent.ABORT]);
intentMappings.set(GamePadButtonId.BUTTON_3, [ControllerIntent.PLAYER_RELOAD]);
intentMappings.set(GamePadButtonId.BUTTON_4, [ControllerIntent.PLAYER_INTERACT]);
intentMappings.set(GamePadButtonId.SHOULDER_TOP_LEFT, [ControllerIntent.PLAYER_DANCE_1, ControllerIntent.PLAYER_ACTION]);
intentMappings.set(GamePadButtonId.SHOULDER_TOP_RIGHT, [ControllerIntent.PLAYER_DANCE_2]);
intentMappings.set(GamePadButtonId.SHOULDER_BOTTOM_RIGHT, [ControllerIntent.PLAYER_ACTION]);
intentMappings.set(GamePadButtonId.STICK_BUTTON_LEFT, [ControllerIntent.PLAYER_RUN]);
intentMappings.set(GamePadButtonId.START, [ControllerIntent.PAUSE]);
intentMappings.set(GamePadButtonId.RIGHT_STICK, [ControllerIntent.LEFT_STICK]);
intentMappings.set(GamePadButtonId.LEFT_STICK, [ControllerIntent.RIGHT_STICK]);

class GamepadButtonWrapper {
    public readonly index: number;
    private pressed: boolean;
    private gamepad: GamepadWrapper;

    constructor(index: number, wrapped: GamepadButton, gamepad: GamepadWrapper) {
        this.index = index;
        this.pressed = wrapped.pressed;
        this.gamepad = gamepad;
    }

    public setPressed(pressed: boolean): void {
        const controllerManager = ControllerManager.getInstance();
        const oldPressed = this.pressed;
        this.pressed = pressed;

        if (oldPressed !== pressed) {
            if (pressed) {
                controllerManager.onButtonDown.emit(
                    new GamepadControllerEvent(
                        this.gamepad.gamepadModel, ControllerEventType.DOWN,
                        intentMappings.get(this.index) || [ControllerIntent.NONE]
                    )
                );
            } else {
                controllerManager.onButtonUp.emit(
                    new GamepadControllerEvent(
                        this.gamepad.gamepadModel, ControllerEventType.UP,
                        intentMappings.get(this.index) || [ControllerIntent.NONE]
                    )
                );
            }
        }
    }

}

class GamepadAxisWrapper {
    /**
     * Threshold to use to emulate virtual buttons.
     * Values between 0.1 (slight touches of the axis trigger button presses)
     * 0.9 (much force needed) can be used here.
     *
     * Avoid using 0.0 and 1.0 as they cannot be reached on some gamepads or
     * might lead to button flibber flubber...
     */
    private threshold = 0.5;

    public readonly index: number;
    private value: number = 0.0;
    private gamepad: GamepadWrapper;

    constructor(index: number, gamepad: GamepadWrapper) {
        this.index = index;
        this.gamepad = gamepad;
    }

    public setValue(newValue: number): void {
        const controllerManager = ControllerManager.getInstance();
        const oldValue = this.value;
        this.value = newValue;
        let emulatedButtonId: number|undefined = undefined;

        if (oldValue <= -this.threshold && newValue > -this.threshold) {
            // Virtual button 1 released
            emulatedButtonId = axisMapping.get(this.index)?.button1;

            if (emulatedButtonId != null) {
                controllerManager.onButtonUp.emit(
                    new GamepadControllerEvent(
                        this.gamepad.gamepadModel, ControllerEventType.UP,
                        intentMappings.get(emulatedButtonId) || [ControllerIntent.NONE]
                    )
                );
            }
        } else if (oldValue > -this.threshold && newValue <= -this.threshold) {
            // Virtual button 1 pressed
            emulatedButtonId = axisMapping.get(this.index)?.button1;

            if (emulatedButtonId != null) {
                controllerManager.onButtonDown.emit(
                    new GamepadControllerEvent(
                        this.gamepad.gamepadModel, ControllerEventType.DOWN,
                        intentMappings.get(emulatedButtonId) || [ControllerIntent.NONE]
                    )
                );
            }
        }

        if (oldValue > this.threshold && newValue <= this.threshold) {
            // Virtual button 2 released
            emulatedButtonId = axisMapping.get(this.index)?.button2;

            if (emulatedButtonId != null) {
                controllerManager.onButtonUp.emit(
                    new GamepadControllerEvent(
                        this.gamepad.gamepadModel, ControllerEventType.UP,
                        intentMappings.get(emulatedButtonId) || [ControllerIntent.NONE]
                    )
                );
            }
        } else if (oldValue < this.threshold && newValue >= this.threshold) {
            // Virtual button 2 pressed
            emulatedButtonId = axisMapping.get(this.index)?.button2;

            if (emulatedButtonId != null) {
                controllerManager.onButtonDown.emit(
                    new GamepadControllerEvent(
                        this.gamepad.gamepadModel, ControllerEventType.DOWN,
                        intentMappings.get(emulatedButtonId) || [ControllerIntent.NONE]
                    )
                );
            }
        }
    }
}


class GamepadVectorWrapper {
    /**
     * Threshold to use to indicate weather a direction was set.
     *
     * Avoid using 0.0 and 1.0 as they cannot be reached on some gamepads or
     * might lead to button flibber flubber...
     */
    private maxValueThreshold = 0.95;
    private threshold = 0.1;

    public readonly intent: number;
    public readonly xIndex: number;
    public readonly yIndex: number;
    private value = new Vector2(0, 0);
    private gamepad: GamepadWrapper;

    constructor(intent: GamePadButtonId, xIndex: number, yIndex: number, gamepad: GamepadWrapper) {
        this.intent = intent;
        this.xIndex = xIndex;
        this.yIndex = yIndex;
        this.gamepad = gamepad;
    }

    public setValue(xValue: number, yValue: number): void {
        const controllerManager = ControllerManager.getInstance();
        const currentAxis = vectorAxes.get(this.intent);
        const oldValue = this.value.clone();
        if (!currentAxis) {
            return;
        }
        if (currentAxis.x === this.xIndex && Math.abs(xValue) > this.threshold) {
            this.value.x = this.normalizeControllerInput(xValue);
        } else {
            this.value.x = 0;
        }
        if (currentAxis.y === this.yIndex && Math.abs(yValue) > this.threshold) {
            this.value.y = this.normalizeControllerInput(yValue);
        } else {
            this.value.y = 0;
        }

        if (this.value.x !== oldValue.x || this.value.y !== oldValue.y) {
            controllerManager.onDrag.emit(
                new GamepadControllerEvent(
                    this.gamepad.gamepadModel, ControllerEventType.DRAG,
                    intentMappings.get(this.intent) || [ControllerIntent.NONE], false, this.value
                )
            );
        }
    }

    private normalizeControllerInput(value: number): number {
        const threshold = value < 0 ? -this.maxValueThreshold : this.threshold;
        const maxValueThreshold = value < 0 ? -this.threshold : this.maxValueThreshold;
        return (clamp(value, threshold, maxValueThreshold) - (value < 0 ? -1 : 1) * this.threshold) / (this.maxValueThreshold - this.threshold);
    }
}

/**
 * Some obscure magic to make sure that gamepad buttons and axes are mapped onto unified controller
 * events.
 */
class GamepadWrapper {
    private index: number;
    private id: string;
    private buttons: GamepadButtonWrapper[];
    private axes: GamepadAxisWrapper[];
    private vectorControls: GamepadVectorWrapper[];
    public gamepadModel: GamepadModel;
    constructor(gamepad: Gamepad) {
        this.index = gamepad.index;
        this.id = gamepad.id;
        this.gamepadModel = GamepadModel.fromString(this.id);
        this.buttons = new Array(gamepad.buttons.length);

        for (let i = 0; i < this.buttons.length; i++) {
            this.buttons[i] = new GamepadButtonWrapper(i, gamepad.buttons[i], this);
        }

        this.axes = new Array(gamepad.axes.length);
        this.vectorControls = new Array(gamepad.axes.length);

        for (let i = 0; i < this.axes.length; i++) {
            this.axes[i] = new GamepadAxisWrapper(i, this);
        }
        for (let i = 0; i < this.vectorControls.length; i++) {
            const entry = Array.from(vectorAxes.entries())[i];
            if (entry) {
                const vectorAxis = vectorAxes.get(entry[0]);
                if (!vectorAxis) {
                    return;
                }
                this.vectorControls[i] = new GamepadVectorWrapper(entry[0], vectorAxis.x, vectorAxis.y, this);
            }
        }
    }

    public update(): void {
        const gamepad = navigator.getGamepads()[this.index];

        if (gamepad != null) {
            this.buttons.forEach(button => button.setPressed(gamepad.buttons[button.index].pressed));
            this.axes.forEach(axis => axis.setValue(gamepad.axes[axis.index]));
            this.vectorControls.forEach(control => control.setValue(gamepad.axes[control.xIndex], gamepad.axes[control.yIndex]));
        }
    }

    public toString(): string {
        return `Gamepad (index: ${this.index}, id: ${this.id})`;
    }
}

export class GamepadInput {
    private gamepads: Map<string, GamepadWrapper>;

    constructor() {
        this.gamepads = new Map();

        window.addEventListener("gamepadconnected", (e: any) => {
            console.debug("Gamepad connected: ", e);
            const gamepad = (e as GamepadEventInit).gamepad;

            if (gamepad != null) {
                this.gamepads.set(gamepad.id, new GamepadWrapper(gamepad));
            }
        });

        window.addEventListener("gamepaddisconnected", (e) => {
            console.debug("Gamepad disconnected: ", e);
            const gamepad = (e as any as GamepadEventInit).gamepad;

            if (gamepad != null) {
                this.gamepads.delete(gamepad.id);
            }
        });
    }

    public update(): void {
        this.gamepads.forEach(gamepad => gamepad.update());
    }

}
