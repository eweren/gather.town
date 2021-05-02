import { isLittleEndian } from "../util/env";

import { clamp } from "../util/math";
import { formatNumber, toHex } from "../util/string";
import { WritableArrayLike } from "../util/types";
import { Color } from "./Color";
import { RGBAColor } from "./RGBAColor";

/** Regular expression to parse RGB color in HTML format. */
const RGBColorHTMLRegExp = /^\s*#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})\s*$/i;

/** Regular expression to parse RGB color in CSS format. */
const RGBColorCSSRegExp = /^\s*rgb\s*\(\s*([+-]?\d*(?:\.\d+)?(?:e[+-]?\d+)?%?)\s*[\s,]\s*([+-]?\d*(?:\.\d+)?(?:e[+-]?\d+)?%?)\s*[\s,]\s*([+-]?\d*(?:\.\d+)?(?:e[+-]?\d+)?%?)\s*\)\s*$/i;

/**
 * Immutable color with red, green and blue component.
 */
export class RGBColor implements Color {
    /** The red color component (0.0 - 1.0) */
    private readonly red: number;

    /** The green color component (0.0 - 1.0) */
    private readonly green: number;

    /** The blue color component (0.0 - 1.0) */
    private readonly blue: number;

    /**
     * Creates a new RGB color with the given color components. Values are clamped into the valid range of 0.0 to 1.0.
     *
     * @param red   - The red color component (0.0 - 1.0).
     * @param green - The green color component (0.0 - 1.0).
     * @param blue  - The blue color component (0.0 - 1.0).
     */
    public constructor(red: number, green: number, blue: number) {
        this.red = clamp(red, 0, 1);
        this.green = clamp(green, 0, 1);
        this.blue = clamp(blue, 0, 1);
    }

    /**
     * Deserializes the given serialized RGB color. This simply does the same same as [[fromString]].
     *
     * @param The serialized RGB color.
     * @return The deserialized RGB color.
     */
    public static fromJSON(json: string): RGBColor {
        return this.fromString(json);
    }

    /**
     * Parses the given string into an RGB color object. The string can be defined in HTML or CSS format.
     *
     * @param string - The RGB color string to parse.
     * @return The parsed RGB color.
     */
    public static fromString(s: string): RGBColor {
        let match = RGBColorCSSRegExp.exec(s);
        if (match != null) {
            return new RGBColor(
                parseFloat(match[1]) / (match[1].endsWith("%") ? 100 : 255),
                parseFloat(match[2]) / (match[2].endsWith("%") ? 100 : 255),
                parseFloat(match[3]) / (match[3].endsWith("%") ? 100 : 255)
            );
        }
        match = RGBColorHTMLRegExp.exec(s);
        if (match != null) {
            return new RGBColor(
                parseInt(match[1], 16) / 255,
                parseInt(match[2], 16) / 255,
                parseInt(match[3], 16) / 255
            );
        }
        throw new Error("Invalid RGB color format: " + s);
    }

    /** @inheritDoc */
    public toJSON(): string {
        return this.toCSS();
    }

    /** @inheritDoc */
    public toString(): string {
        return this.toCSS();
    }

    /**
     * Returns the color as an HTML string.
     *
     * @return The color as an HTML string.
     */
    public toHTML(): string {
        return `#${toHex(this.red * 255, 2)}${toHex(this.green * 255, 2)}${toHex(this.blue * 255, 2)}`;
    }

    /**
     * Returns the color as a CSS string.
     *
     * @param maximumFractionDigits - Optional maximum number of fraction digits of percentage values in output.
     * @return The color as a CSS string.
     */
    public toCSS(maximumFractionDigits = 3): string {
        const red = formatNumber(this.red * 100, { maximumFractionDigits });
        const green = formatNumber(this.green * 100, { maximumFractionDigits });
        const blue = formatNumber(this.blue * 100, { maximumFractionDigits });
        return `rgb(${red}%,${green}%,${blue}%)`;
    }

    /** @inheritDoc */
    public toRGB(): RGBColor {
        return this;
    }

    /** @inheritDoc */
    public toRGBA(): RGBAColor {
        return new RGBAColor(this.red, this.green, this.blue, 1.0);
    }

    /**
     * Creates color from given 32 bit integer.
     *
     * @param value        - The 32 bit integer to read the color from.
     * @param littleEndian - True for little endian byte order. False for big-endian. Default is platform-specific to
     *                       be compatible with UInt32Array behavior.
     * @return The created color.
     */
    public static fromUint32(value: number, littleEndian = isLittleEndian()): RGBColor {
        if (littleEndian) {
            return new RGBColor(
                (value & 255) / 255,
                ((value >> 8) & 255) / 255,
                ((value >> 16) & 255) / 255
            );
        } else {
            return new RGBColor(
                ((value >> 24) & 255) / 255,
                ((value >> 16) & 255) / 255,
                ((value >> 8) & 255) / 255
            );
        }
    }

    /**
     * Converts the color into a 32 bit integer.
     *
     * @param littleEndian - True for little endian byte order. False for big-endian. Default is platform-specific to
     *                       be compatible with UInt32Array behavior.
     * @return The color as 32 bit integer.
     */
    public toUint32(littleEndian = isLittleEndian()): number {
        if (littleEndian) {
            return ((this.red * 255) | ((this.green * 255) << 8) | ((this.blue * 255) << 16) | (255 << 24)) >>> 0;
        } else {
            return (255 | ((this.blue * 255) << 8) | ((this.green * 255) << 16) | ((this.red * 255) << 24)) >>> 0;
        }
    }

    /**
     * Creates color from given 8 bit color components array.
     *
     * @param data   - The color components in RGB order.
     * @param offset - Optional offset within the data array to start reading the components from. Defaults to 0.
     * @return The created color.
     */
    public static fromUint8(data: ArrayLike<number>, offset = 0): RGBColor {
        return new RGBColor(data[offset] / 255, data[offset + 1] / 255, data[offset + 2] / 255);
    }

    /**
     * Writes the color into the given color component array starting at the given offset.
     *
     * @param data  - The array to write the color components to. If not specified then a new UInt8Array with three
     *                components is created.
     * @param offset - The offset to start writing the color components to.
     * @return The data array.
     */
    public toUint8<T extends WritableArrayLike<number>>(data: T = (new Uint8Array(3) as unknown as T), offset = 0): T {
        data[offset] = this.red * 255 | 0;
        data[offset + 1] = this.green * 255 | 0;
        data[offset + 2] = this.blue * 255 | 0;
        return data;
    }

    /**
     * Returns the red component of the color.
     *
     * @return The red component (0.0 - 1.0).
     */
    public getRed(): number {
        return this.red;
    }

    /**
     * Returns the green component of the color.
     *
     * @return The green component (0.0 - 1.0).
     */
    public getGreen(): number {
        return this.green;
    }

    /**
     * Returns the blue component of the color.
     *
     * @return The blue component (0.0 - 1.0).
     */
    public getBlue(): number {
        return this.blue;
    }

    /** @inheritDoc */
    public darken(factor: number): RGBColor {
        return new RGBColor(
            this.red * (1 - factor),
            this.green * (1 - factor),
            this.blue * (1 - factor)
        );
    }
}
