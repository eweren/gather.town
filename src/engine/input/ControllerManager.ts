import { ControllerEvent } from "./ControllerEvent";
import { ControllerFamily, ControllerSpriteMap } from "./ControllerFamily";
import { GamepadStyle } from "./GamepadStyle";
import { Signal } from "../util/Signal";
import { ControllerIntent } from "./ControllerIntent";

/** Symbol to identify the current/active controller family. */
const currentControllerFamilySymbol = Symbol("currentControllerFamily");

/** Symbol to identify the currently active intents. */
const currentActiveIntentsSymbol = Symbol("currentActiveIntentsSymbol");

export class ControllerManager {
    private static readonly INSTANCE = new ControllerManager();

    public static getInstance(): ControllerManager {
        return ControllerManager.INSTANCE;
    }

    public readonly onButtonDown = new Signal<ControllerEvent>();
    public readonly onButtonUp = new Signal<ControllerEvent>();
    public readonly onButtonPress = new Signal<ControllerEvent>();
    public readonly onDrag = new Signal<ControllerEvent>();
    public readonly onControllerFamilyChange = new Signal<ControllerFamily>();

    public selectedGamepadStyle = GamepadStyle.XBOX;

    public get currentActiveIntents(): ControllerIntent {
        return this[currentActiveIntentsSymbol];
    }

    private [currentControllerFamilySymbol]: ControllerFamily;
    private [currentActiveIntentsSymbol]: ControllerIntent;

    private constructor(initialControllerFamily: ControllerFamily = ControllerFamily.KEYBOARD) {
        this.currentControllerFamily = initialControllerFamily;

        this.onButtonDown.connect(e => {
            this.currentControllerFamily = e.controllerFamily;
            this[currentActiveIntentsSymbol] |= e.intents;
        });

        this.onDrag.filter(event => !!event.direction && (event.direction.getLength() > 0.1)).connect(() => {
            this.currentControllerFamily = ControllerFamily.GAMEPAD;
        });

        this.onButtonUp.connect(e => {
            this[currentActiveIntentsSymbol] &= ~e.intents;
        });

        window.addEventListener("mousemove", () => { this.currentControllerFamily = ControllerFamily.KEYBOARD; });
    }

    public set currentControllerFamily(controllerFamily: ControllerFamily) {
        if (controllerFamily !== this[currentControllerFamilySymbol]) {
            this[currentControllerFamilySymbol] = controllerFamily;
            this.onControllerFamilyChange.emit(controllerFamily);
        }
    }

    /**
     * Returns the current (a.k.a. most recently used!) controller family.
     * Can be used to determine which tooltips (gamepad buttons or keyboard indicators) to show.
     */
    public get currentControllerFamily(): ControllerFamily {
        return this[currentControllerFamilySymbol];
    }

    public toggleSelectedGamepadStyle(): void {
        this.selectedGamepadStyle = this.selectedGamepadStyle === GamepadStyle.XBOX ? GamepadStyle.PLAYSTATION : GamepadStyle.XBOX;
    }

    public get controllerSprite(): ControllerSpriteMap {
        if (this.currentControllerFamily === ControllerFamily.GAMEPAD) {
            switch (ControllerManager.getInstance().selectedGamepadStyle) {
                case GamepadStyle.PLAYSTATION:
                    return ControllerSpriteMap.PLAYSTATION;
                case GamepadStyle.XBOX:
                    return ControllerSpriteMap.XBOX;
            }
        }

        // Fallback to Keyboard
        return ControllerSpriteMap.KEYBOARD;
    }
}
