import { Class } from "../util/types";

/**
 * Static interface for deserializable classes. This interface can't be implemented by classes but can be used as
 * a type in constructor lists of caches and factories and stuff like that.
 */
export interface Deserializable<T = unknown> extends Class {
    fromJSON(json: unknown, ...args: unknown[]): T;
}

/**
 * Checks if given class is deserializable.
 *
 * @param cls - The class to check.
 * @return True if class is deserializable, false if not.
 */
export function isDeserializable<T>(cls: Class): cls is Deserializable<T> {
    return typeof (cls as Deserializable).fromJSON === "function";
}
