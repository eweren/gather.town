import type {
    TiledMapJSON, TiledMapOrientation, TiledMapRenderOrder, TiledMapStaggerAxis, TiledMapStaggerIndex
} from "*.tiledmap.json";
import { Color } from "../color/Color";
import { RGBAColor } from "../color/RGBAColor";
import { Deserializable } from "../lang/Deserializable";
import { cacheResult } from "../util/cache";
import { Constructor } from "../util/types";

import { TiledLayer } from "./TiledLayer";
import { TiledProperties } from "./TiledProperties";
import { TiledTileset } from "./TiledTileset";

export class TiledMap extends TiledProperties<TiledMapJSON> {
    public static fromJSON(json: TiledMapJSON, baseURL: string | URL): TiledMap {
        return new TiledMap(json, baseURL);
    }

    /**
     * Loads the tiled map from the given source.
     *
     * @param source - The URL pointing to the JSON file of the tiled map.
     * @return The loaded tiled map.
     */
    public static async load(source: string): Promise<TiledMap> {
        const json = await (await fetch(source)).json() as TiledMapJSON;
        const baseURL = new URL(source, location.href);
        return TiledMap.fromJSON(json, baseURL);
    }
    /**
     * Returns the optional background color.
     *
     * @return The optional background color.
     */
    @cacheResult
    public getBackgroundColor(): RGBAColor | null {
        return this.json.backgroundcolor != null ? Color.fromJSON(this.json.backgroundcolor).toRGBA() : null;
    }

    /**
     * Returns the number of tile columns.
     *
     * @return The number of tile columns.
     */
    public getWidth(): number {
        return this.json.width;
    }

    /**
     * Returns the number of tile rows.
     *
     * @return The number of tile rows.
     */
    public getHeight(): number {
        return this.json.height;
    }

    /**
     * Returns the length of the side of a hex in pixels.
     *
     * @return The length of the side of a hex in pixels. Null if not a hexagonal map.
     */
    public getHexSideLength(): number | null {
        return this.json.hexsidelength ?? null;
    }

    /**
     * Checks whether the map has infinite dimensions.
     *
     * @return True when infinite dimensions, false if not.
     */
    public isInfinite(): boolean {
        return this.json.infinite;
    }

    /**
     * Returns the map orientation.
     *
     * @return The map orientation.
     */
    public getOrientation(): TiledMapOrientation {
        return this.json.orientation;
    }

    /**
     * Returns the render order.
     *
     * @return The render order.
     */
    public getRenderOrder(): TiledMapRenderOrder {
        return this.json.renderorder;
    }

    /**
     * Returns the stagger axis (x or y).
     *
     * @return The stagger axis. Null if map is not staggered and not hexagonal.
     */
    public getStaggerAxis(): TiledMapStaggerAxis | null {
        return this.json.staggeraxis ?? null;
    }

    /**
     * Returns the stagger index (odd or even).
     *
     * @return The stagger index. Null if map is not staggered and not hexagonal.
     */
    public getStaggerIndex(): TiledMapStaggerIndex | null {
        return this.json.staggerindex ?? null;
    }

    /**
     * Returns the Tiled version used to save the file.
     *
     * @return The Tiled version used to save the file.
     */
    public getTiledVersion(): string {
        return this.json.tiledversion;
    }

    /**
     * Returns the map grid width.
     *
     * @return The map grid width.
     */
    public getTileWidth(): number {
        return this.json.tilewidth;
    }

    /**
     * Returns the map grid height.
     *
     * @return The map grid height.
     */
    public getTileHeight(): number {
        return this.json.tileheight;
    }

    /**
     * Returns the tilesets.
     *
     * @return The tilesets.
     */
    @cacheResult
    public getTilesets(): readonly TiledTileset[] {
        return this.json.tilesets.map(json => TiledTileset.fromJSON(json, this.baseURL));
    }

    @cacheResult
    public getLayers(): readonly TiledLayer[] {
        return this.json.layers.map(json => TiledLayer.fromJSON(json, this.baseURL));
    }

    public getLayersByType<T extends TiledLayer>(type: Constructor<T>): readonly T[] {
        return this.getLayers().filter((layer): layer is T => layer instanceof type);
    }

    /**
     * Returns the map property with the given name.
     *
     * @param name - The name of the property to return.
     * @param type - The expected property type. An exception is thrown when actual type doesn't match the expected one.
     * @return The map property or null if not found.
     */
    public getLayer<T extends TiledLayer>(name: string, type?: Deserializable<T>): T {
        const layer = this.getLayers().find(layer => layer.getName() === name);
        if (layer == null) {
            throw new Error(`No map layer with name '${name}' found`);
        }
        if (type != null && !(layer instanceof type)) {
            throw new Error(
                `Expected layer with name '${name}' to be of type '${type.name}' but is '${layer.constructor.name}'`);
        }
        return layer as T;
    }
}
