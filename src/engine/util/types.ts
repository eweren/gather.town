/**
 * Public constructor type.
 *
 * @param T - The class instance type.
 * @param A - The constructor argument types.
 */
export type Constructor<T = unknown, A extends unknown[] = any[]> = new (...args: A) => T;

/**
 * Class type which even works for classes with a private constructor. If you have a public constructor consider
 * using [[Constructor]] instead.
 *
 * @param T - The class instance type.
 */
// No other way than to use `Function` here as we definitely want to match class types and not just real functions
export type Class<T = unknown> = Function & { prototype: T };

/**
 * Recursively converts an immutable type into a mutable type.
 *
 * @param T - The immutable type to convert.
 */
export type Mutable<T> = {
    -readonly [P in keyof T]: Mutable<T[P]>;
};

/**
 * Recursively converts a mutable type into an immutable type.
 *
 * @param T - The mutable type to convert.
 */
export type Immutable<T> = {
    readonly [P in keyof T]: Immutable<T[P]>;
};

/** Groups all typed array types into one. */
export type TypedArray = Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array
    | Uint32Array | Float32Array | Float64Array;

/**
 * Array-like object with writable elements.
 *
 * @param T - The array item type.
 */
export interface WritableArrayLike<T> extends ArrayLike<T> {
    [n: number]: T;
    readonly length: number;
}
