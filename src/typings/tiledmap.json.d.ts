declare module "*.tiledmap.json" {
    export type TiledMapOrientation = "orthogonal" | "isometric" | "staggered" | "hexagonal";
    export type TiledMapRenderOrder = "right-down" | "right-up" | "left-down" | "left-up";
    export type TiledMapStaggerAxis = "x" | "y";
    export type TiledMapStaggerIndex = "odd" | "even";
    export type TiledPropertyType = "string" | "int" | "float" | "bool" | "color" | "file";
    export type TiledEncoding = "csv" | "base64";
    export type TiledCompression = "zlib" | "gzip" | "zstd" | "";
    export type TiledDrawOrder = "topdown" | "index";
    export type TiledLayerType = "tilelayer" | "objectgroup" | "imagelayer" | "group";
    export type TiledTextVAlign = "center" | "bottom" | "top";
    export type TiledTextHAlign = "center" | "right" | "justify" | "left";
    export type TiledGridOrientation = "orthogonal" | "isometric";
    export type TiledPropertyValueTypeJSON<T extends TiledPropertyType = "string"> =
        T extends "int" ? number :
        T extends "float" ? number :
        T extends "bool" ? boolean :
        string;

    export interface TiledPropertyJSON<T extends TiledPropertyType = TiledPropertyType> {
        name: string;
        type?: T;
        value: TiledPropertyValueTypeJSON<T>;
    }

    export interface TiledPropertiesJSON {
        /** Array of properties */
        properties?: TiledPropertyJSON[];
    }

    /**
     * Chunks are used to store the tile layer data for infinite maps.
     */
    export interface TiledChunkJSON {
        /** Array of unsigned int (GIDs) or base64-encoded data */
        data: number[] | string;

        /** Width in tiles */
        width: number;

        /** Height in tiles */
        height: number;

        /** X coordinate in tiles */
        x: number;

        /** Y coordinate in tiles */
        y: number;
    }

    export interface TiledLayerJSON extends TiledPropertiesJSON{
        type: TiledLayerType;

        /** Incremental id - unique across all layers */
        id: number;

        /** Name assigned to this layer */
        name: string;

        /** Horizontal layer offset in pixels */
        offsetx: number;

        /** Vertical layer offset in pixels */
        offsety: number;

        /** Value between 0 and 1 */
        opacity: number;

        /** Whether layer is shown or hidden in editor */
        visible: boolean;

        /** Horizontal layer offset in tiles. Always 0. */
        x: number;

        /** Vertical layer offset in tiles. Always 0. */
        y: number;

        /** Column count. Same as map width for fixed-size maps. */
        width: number;

        /** Row count. Same as map height for fixed-size maps. */
        height: number;
    }

    export interface TiledTileLayerJSON extends TiledLayerJSON {
        type: "tilelayer";

        /** Array of chunks (optional). */
        chunks?: TiledChunkJSON[];

        /** zstd, zlib, gzip or empty (default). */
        compression?: TiledCompression;

        /** Array of unsigned int (GIDs) or base64-encoded data. */
        data: number[] | string;

        /** csv (default) or base64 */
        encoding: TiledEncoding;

        /** X coordinate where layer content starts (for infinite maps) */
        startx?: number;

        /** Y coordinate where layer content starts (for infinite maps) */
        starty?: number;
    }

    export interface TiledPointJSON {
        x: number;
        y: number;
    }

    export interface TiledTextJSON {
        /** Whether to use a bold font (default: false) */
        bold?: boolean;

        /** Hex-formatted color (#RRGGBB or #AARRGGBB) (default: #000000) */
        color?: string;

        /** Font family (default: sans-serif) */
        fontfamily?: string;

        /** Horizontal alignment (center, right, justify or left (default)) */
        halign?: TiledTextHAlign;

        /** Whether to use an italic font (default: false) */
        italic?: boolean;

        /** Whether to use kerning when placing characters (default: true)  */
        kerning?: boolean;

        /** Pixel size of font (default: 16) */
        pixelsize?: number;

        /** Whether to strike out the text (default: false) */
        strikeout?: boolean;

        /** Text */
        text: string;

        /** Whether to underline the text (default: false) */
        underline?: boolean;

        /** Vertical alignment (center, bottom or top (default)) */
        valign?: TiledTextVAlign;

        /** Whether the text is wrapped within the object bounds (default: false) */
        wrap?: boolean;
    }

    export interface TiledObjectJSON extends TiledPropertiesJSON {
        /** Used to mark an object as an ellipse */
        ellipse?: boolean;

        /** Global tile ID, only if object represents a tile */
        gid?: number;

        /** Width in pixels. */
        width: number;

        /** Height in pixels. */
        height: number;

        /** Incremental id, unique across all objects */
        id: number;

        /** String assigned to name field in editor */
        name: string;

        /** Used to mark an object as a point */
        point?: boolean;

        /** Array of Points, in case the object is a polygon */
        polygon?: TiledPointJSON[];

        /** Used to mark an object as a point */
        polyline?: TiledPointJSON[];

        /** Angle in degrees clockwise */
        rotation: number;

        /** Reference to a template file, in case object is a template instance */
        template?: string;

        /** Only used for text objects */
        text?: TiledTextJSON;

        /** String assigned to type field in editor */
        type: string;

        /** Whether object is shown in editor. */
        visible: boolean;

        /** X coordinate in pixels */
        x: number;

        /** Y coordinate in pixels */
        y: number;
    }

    export interface TiledObjectGroupLayerJSON extends TiledLayerJSON {
        type: "objectgroup";

        /** topdown (default) or index. */
        draworder: TiledDrawOrder;

        /** Array of objects */
        objects: TiledObjectJSON[];
    }

    export interface TiledImageLayerJSON extends TiledLayerJSON {
        type: "imagelayer";

        /** Image used by this layer. */
        image: string;

        /** Hex-formatted color (#RRGGBB) (optional)*/
        transparentcolor?: string;
    }

    export interface TiledGroupLayerJSON extends TiledLayerJSON{
        type: "group";

        /** Array of layers. */
        layers: TiledLayerJSON[];
    }

    export interface TiledGridJSON {
        /** Cell width of tile grid. */
        width: number;

        /** Cell height of tile grid. */
        height: number;

        /** `orthogonal` (default) or `isometric`. */
        orientation: TiledGridOrientation;
    }

    export interface TiledTileOffsetJSON {
        /** Horizontal offset in pixels */
        x: number;

        /** Vertical offset in pixels (positive is down) */
        y: number;
    }

    export interface TiledFrameJSON {
        /** Frame duration in milliseconds */
        duration: number;

        /** Local tile ID representing this frame */
        tileid: number;
    }

    export interface TiledTileJSON extends TiledPropertiesJSON {
        animation: TiledFrameJSON[];

        /** Local ID of the tile */
        id: number;

        /** Image representing this tile (optional) */
        image?: string;

        /** Height of the tile image in pixels */
        imagewidth: number;

        /** Width of the tile image in pixels */
        imageheight: number;

        /** Layer with type objectgroup, when collision shapes are specified (optional) */
        objectgroup?: TiledObjectGroupLayerJSON;

        /** Percentage chance this tile is chosen when competing with others in the editor (optional) */
        probability?: number;

        /** Index of terrain for each corner of tile (optional) */
        terrain?: number[];

        /** The type of the tile (optional) */
        type?: string;
    }

    export interface TiledTerrainJSON extends TiledPropertiesJSON {
        /** Name of terrain */
        name: string;

        /** Local ID of tile representing terrain */
        tile: number;
    }

    export interface TiledWangColorJSON {
        /** Hex-formatted color (#RRGGBB or #AARRGGBB) */
        color: string;

        /** Name of the Wang color */
        name: string;

        /** Probability used when randomizing */
        probability: number;

        /** Local ID of tile representing the Wang color */
        tile: number;
    }

    export interface TiledWangTileJSON {
        /** Tile is flipped diagonally (default: false) */
        dflip: boolean;

        /** Tile is flipped horizontally (default: false) */
        hflip: boolean;

        /** Local ID of tile */
        tileid: number;

        /** Tile is flipped vertically (default: false) */
        vflip: boolean;

        /** Array of Wang color indexes (uchar[8]) */
        wangid: number[];
    }

    export interface TiledWangsetJSON extends TiledPropertiesJSON {
        /** Array of Wang colors. */
        cornercolors: TiledWangColorJSON[];

        /** Array of Wang colors. */
        edgecolors: TiledWangColorJSON[];

        /** Name of the Wang set */
        name: string;

        /** Local ID of tile representing the Wang set */
        tile: number;

        /** Array of Wang tiles */
        wangtiles: TiledWangTileJSON[];
    }

    export interface TiledTilesetJSON extends TiledPropertiesJSON {
        /** Hex-formatted color (#RRGGBB or #AARRGGBB) (optional) */
        backgroundcolor?: string;

        /** The number of tile columns in the tileset */
        columns: number;

        /** GID corresponding to the first tile in the set */
        firstgid: number;

        /** Optional grid */
        grid?: TiledGridJSON;

        /** Image used for tiles in this set */
        image: string;

        /** Width of source image in pixels */
        imagewidth: number;

        /** Height of source image in pixels */
        imageheight: number;

        /** Buffer between image edge and first tile (pixels) */
        margin: number;

        /** Name given to this tileset */
        name: string;

        /** The external file that contains this tilesets data */
        source?: string;

        /** Spacing between adjacent tiles in image (pixels) */
        spacing: number;

        /** Array of Terrains (optional) */
        terrains?: TiledTerrainJSON[];

        /** The number of tiles in this tileset */
        tilecount: number;

        /** The Tiled version used to save the file */
        tiledversion: string;

        /** Maximum width of tiles in this set */
        tilewidth: number;

        /** Maximum height of tiles in this set */
        tileheight: number;

        /** Optional tile offset */
        tileoffset?: TiledTileOffsetJSON;

        /** Array of tiles (optional) */
        tiles: TiledTileJSON[];

        /** Hex-formatted color (#RRGGBB) (optional) */
        transparentcolor?: string;

        /** `tileset` (for tileset files, since 1.0) */
        type?: "tileset";

        /** The JSON format version */
        version: number;

        /** Array of Wang sets (since 1.1.5) */
        wangsets?: TiledWangsetJSON[];
    }

    export interface TiledMapJSON extends TiledPropertiesJSON {
        /** `map` (since 1.0) */
        type: "map";

        /** Hex-formatted color (#RRGGBB or #AARRGGBB) (optional). */
        backgroundcolor?: string;

        /** Number of tile columns. */
        width: number;

        /** Number of tile rows. */
        height: number;

        /** Length of the side of a hex tile in pixels (hexagonal maps only). */
        hexsidelength?: number;

        /** Whether the map has infinite dimensions. */
        infinite: boolean;

        /** Array of layers */
        layers: TiledLayerJSON[];

        /** orthogonal, isometric, staggered or hexagonal */
        orientation: TiledMapOrientation;

        /** right-down (the default), right-up, left-down or left-up (orthogonal maps only) */
        renderorder: TiledMapRenderOrder;

        /** x or y (staggered / hexagonal maps only) */
        staggeraxis?: TiledMapStaggerAxis;

        /** odd or even (staggered / hexagonal maps only) */
        staggerindex?: TiledMapStaggerIndex;

        /** The Tiled version used to save the file */
        tiledversion: string;

        /** Map grid width */
        tilewidth: number;

        /** Map grid height */
        tileheight: number;

        /** Array of Tilesets */
        tilesets: TiledTilesetJSON[];

        /** The JSON format version. */
        version?: number;
    }

    const value: TiledMapJSON;
    export default value;
}
