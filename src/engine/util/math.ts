export function clamp(v: number, min: number, max: number): number {
    return v < min ? min : v > max ? max : v;
}

export function orientPow(v: number, exp: number): number {
    if (v < 0) {
        return -((-v) ** exp);
    } else {
        return v ** exp;
    }
}

/** Factor to convert radians to degrees. */
const RAD_TO_DEG = 180 / Math.PI;

/**
 * Converts degrees to radians.
 *
 * @param degrees - The value in degrees to convert to radians.
 * @return The given value converted to radians.
 */
export function radians(degrees: number): number {
    return degrees / RAD_TO_DEG;
}

/**
 * Converts radians to degrees.
 *
 * @param radians - The value in radians to convert to degrees.
 * @return The given value converted to degrees.
 */
export function degrees(radians: number): number {
    return radians * RAD_TO_DEG;
}

/**
 * Normalizes an angle in radians so it is between 0 (inclusive) and 2*PI (exclusive).
 *
 * @param degrees - The angle to normalize.
 * @return The normalized angle.
 */
export function normalizeRadians(angle: number): number {
    const pi2 = Math.PI * 2;
    return ((angle % pi2) + pi2) % pi2;
}

/**
 * Normalizes an angle in degrees so it is between 0 (inclusive) and 360 (exclusive).
 *
 * @param degrees - The angle to normalize.
 * @return The normalized angle.
 */
export function normalizeDegrees(degrees: number): number {
    return ((degrees % 360) + 360) % 360;
}
