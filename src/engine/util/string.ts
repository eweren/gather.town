/**
 * Formats a number to a string. The returned string is never in scientific notation so the string may get
 * pretty long. NaN und infinite numbers are rejected because they can't be represented as a numerical string.
 *
 * @param value   - The numeric value to convert.
 * @param options - Optional number format options. Defaults to english fullwide locale, not using number grouping
 *                  and using 6 maximum fraction digits.
 * @return The numerical string.
 */
export function formatNumber(value: number, options?: Intl.NumberFormatOptions & { locales?: string | string[] }):
        string {
    if (isNaN(value)) {
        throw new Error("Unable to convert NaN to string");
    }
    if (!isFinite(value)) {
        throw new Error("Unable convert infinite value to string");
    }
    return value.toLocaleString(options?.locales ?? [ "fullwide", "en" ],
        { useGrouping: false, maximumFractionDigits: 6, ...options });
}

/**
 * Converts the given value into a hex string.
 *
 * @param value  - The decimal value to convert.
 * @param length - The minimum length of the created hex string. Missing digits are filled with 0.
 * @return The hex string.
 */
export function toHex(value: number, length = 0): string {
    const hex = (value >>> 0).toString(16);
    return "0".repeat(Math.max(0, length - hex.length)) + hex;
}
