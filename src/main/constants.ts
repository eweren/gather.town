/** Width of the game in pixels. */
export const GAME_WIDTH = 384;

/** Height of the game in pixels. */
export const GAME_HEIGHT = 216;

/** Fonts */
export const STANDARD_FONT = "fonts/pixcelsior.font.json";

/** Gravity in m/s² */
export const GRAVITY = 35;

/** Layers */
export enum Layer {
    BACKGROUND = 0,
    DEFAULT = 1,
    FOREGROUND = 2,
    LIGHT = 3,
    OVERLAY = 4,
    DIALOG = 5,
    HUD = 6
}
