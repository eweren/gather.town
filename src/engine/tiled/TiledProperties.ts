import { TiledPropertiesJSON, TiledPropertyType } from "*.tiledmap.json";
import { cacheResult } from "../util/cache";

import { TiledProperty } from "./TiledProperty";

export abstract class TiledProperties<T extends TiledPropertiesJSON = TiledPropertiesJSON> {
    protected constructor(protected readonly json: T, protected readonly baseURL: string | URL) {}

    public toJSON(): T {
        return this.json;
    }

    /**
     * Returns the layer properties.
     *
     * @return The layer properties.
     */
    @cacheResult
    public getProperties(): readonly TiledProperty[] {
        return this.json.properties != null ? this.json.properties.map(json => TiledProperty.fromJSON(json)) : [];
    }

    /**
     * Returns the map property with the given name.
     *
     * @param name - The name of the property to return.
     * @param type - The expected property type. An exception is thrown when actual type doesn't match the expected one.
     * @return The map property or null if not found.
     */
    public getProperty<T extends TiledPropertyType = TiledPropertyType>(name: string, type?: T): TiledProperty<T> {
        const property = this.getOptionalProperty(name, type);
        if (property == null) {
            throw new Error(`No map property with name '${name}' found`);
        }
        return property;
    }

    /**
     * Returns the map property with the given name.
     *
     * @param name - The name of the property to return.
     * @param type - The expected property type. An exception is thrown when actual type doesn't match the expected one.
     * @return The map property or null if not found.
     */
    public getOptionalProperty<T extends TiledPropertyType = TiledPropertyType>(name: string, type?: T):
            TiledProperty<T> | null {
        const property = this.getProperties().find(property => property.getName() === name);
        if (property == null) {
            return null;
        }
        if (type != null && property.getType() !== type) {
            throw new Error(
                `Expected property with name '${name}' to be of type '${type}' but is '${property.getType()}'`);
        }
        return property as TiledProperty<T>;
    }

    /**
     * Checks if map contains a property with the given name.
     *
     * @param name - The name of the property to look for.
     * @return True if property exists, false if not.
     */
    public hasProperty(name: string): boolean {
        return this.getProperties().findIndex(property => property.getName() === name) >= 0;
    }
}
