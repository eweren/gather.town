import { isLittleEndian } from "../util/env";
import { clamp } from "../util/math";
import { formatNumber } from "../util/string";
import { WritableArrayLike } from "../util/types";
import { Color } from "./Color";
import { RGBColor } from "./RGBColor";

/** Regular expression to parse RGBA color in HTML format. */
const RGBAColorHTMLRegExp = /^\s*#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})\s*$/i;

/** Regular expression to parse RGBA color in CSS format. */
const RGBAColorCSSRegExp = /^\s*rgba\s*\(\s*([+-]?\d*(?:\.\d+)?(?:e[+-]?\d+)?%?)\s*[\s,]\s*([+-]?\d*(?:\.\d+)?(?:e[+-]?\d+)?%?)\s*[\s,]\s*([+-]?\d*(?:\.\d+)?(?:e[+-]?\d+)?%?)\s*[\s,]\s*([+-]?\d*(?:\.\d+)?(?:e[+-]?\d+)?)\s*\)\s*$/i;

/**
 * Immutable color with red, green, blue and alpha component.
 */
export class RGBAColor implements Color {
    /** The red color component (0.0 - 1.0) */
    private readonly red: number;

    /** The green color component (0.0 - 1.0) */
    private readonly green: number;

    /** The blue color component (0.0 - 1.0) */
    private readonly blue: number;

    /** The alpha component (0.0 - 1.0) */
    private readonly alpha: number;

    /**
     * Creates a new RGBA color with the given color components. Values are clamped into the valid range of 0.0 to 1.0.
     *
     * @param red   - The red color component (0.0 - 1.0).
     * @param green - The green color component (0.0 - 1.0).
     * @param blue  - The blue color component (0.0 - 1.0).
     * @param alpha - Optional alpha component (0.0 - 1.0). Defaults to 1.
     */
    public constructor(red: number, green: number, blue: number, alpha = 1) {
        this.red = clamp(red, 0, 1);
        this.green = clamp(green, 0, 1);
        this.blue = clamp(blue, 0, 1);
        this.alpha = clamp(alpha, 0, 1);
    }

    /**
     * Deserializes the given serialized RGBA color. This simply does the same same as [[fromString]].
     *
     * @param The serialized RGBA color.
     * @return The deserialized RGBA color.
     */
    public static fromJSON(json: string): RGBAColor {
        return this.fromString(json);
    }

    /**
     * Parses the given string into an RGBA color object. The string can be defined in HTML or CSS format.
     *
     * @param string - The RGBA color string to parse.
     * @return The parsed RGBA color.
     */
    public static fromString(s: string): RGBAColor {
        let match = RGBAColorCSSRegExp.exec(s);
        if (match != null) {
            return new RGBAColor(
                parseFloat(match[1]) / (match[1].endsWith("%") ? 100 : 255),
                parseFloat(match[2]) / (match[2].endsWith("%") ? 100 : 255),
                parseFloat(match[3]) / (match[3].endsWith("%") ? 100 : 255),
                parseFloat(match[4])
            );
        }
        match = RGBAColorHTMLRegExp.exec(s);
        if (match != null) {
            return new RGBAColor(
                parseInt(match[2], 16) / 255,
                parseInt(match[3], 16) / 255,
                parseInt(match[4], 16) / 255,
                parseInt(match[1], 16) / 255
            );
        }
        throw new Error("Invalid RGBA color format: " + s);
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
     * Returns the color as a CSS string.
     *
     * @param maximumFractionDigits - Optional maximum number of fraction digits of values in output.
     * @return The color as a CSS string.
     */
    public toCSS(maximumFractionDigits = 5): string {
        const red = formatNumber(this.red * 100, { maximumFractionDigits });
        const green = formatNumber(this.green * 100, { maximumFractionDigits });
        const blue = formatNumber(this.blue * 100, { maximumFractionDigits });
        const alpha = formatNumber(this.alpha, { maximumFractionDigits });
        return `rgba(${red}%,${green}%,${blue}%,${alpha})`;
    }

    /** @inheritDoc */
    public toRGB(): RGBColor {
        return new RGBColor(this.red, this.green, this.blue);
    }

    /** @inheritDoc */
    public toRGBA(): RGBAColor {
        return this;
    }

    /**
     * Creates color from given 32 bit integer.
     *
     * @param value        - The 32 bit integer to read the color from.
     * @param littleEndian - True for little endian byte order. False for big-endian. Default is platform-specific to
     *                       be compatible with UInt32Array behavior.
     * @return The created color.
     */
    public static fromUint32(value: number, littleEndian = isLittleEndian()): RGBAColor {
        if (littleEndian) {
            return new RGBAColor(
                (value & 255) / 255,
                ((value >> 8) & 255) / 255,
                ((value >> 16) & 255) / 255,
                ((value >> 24) & 255) / 255
            );
        } else {
            return new RGBAColor(
                ((value >> 24) & 255) / 255,
                ((value >> 16) & 255) / 255,
                ((value >> 8) & 255) / 255,
                (value & 255) / 255
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
            return ((this.red * 255) | ((this.green * 255) << 8) | ((this.blue * 255) << 16)
                | ((this.alpha * 255) << 24)) >>> 0;
        } else {
            return ((this.alpha * 255) | ((this.blue * 255) << 8) | ((this.green * 255) << 16)
                | ((this.red * 255) << 24)) >>> 0;
        }
    }

    /**
     * Creates color from given 8 bit color components array.
     *
     * @param data   - The color components in RGB order.
     * @param offset - Optional offset within the data array to start reading the components from. Defaults to 0.
     * @return The created color.
     */
    public static fromUint8(data: ArrayLike<number>, offset = 0): RGBAColor {
        return new RGBAColor(data[offset] / 255, data[offset + 1] / 255, data[offset + 2] / 255,
            data[offset + 3] / 255);
    }

    /**
     * Writes the color into the given color component array starting at the given offset.
     *
     * @param data  - The array to write the color components to. If not specified then a new UInt8Array with four
     *                components is created.
     * @param offset - The offset to start writing the color components to.
     * @return The data array.
     */
    public toUint8<T extends WritableArrayLike<number>>(data: T = (new Uint8Array(4) as unknown as T), offset = 0): T {
        data[offset] = this.red * 255 | 0;
        data[offset + 1] = this.green * 255 | 0;
        data[offset + 2] = this.blue * 255 | 0;
        data[offset + 3] = this.alpha * 255 | 0;
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

    /**
     * Returns the alpha component of the color.
     *
     * @return The alpha component (0.0 - 1.0).
     */
    public getAlpha(): number {
        return this.alpha;
    }

    /** @inheritDoc */
    public darken(factor: number): RGBAColor {
        return new RGBAColor(
            this.red * (1 - factor),
            this.green * (1 - factor),
            this.blue * (1 - factor),
            this.alpha
        );
    }
}
