import { Game } from "../Game";
import { Direction } from "../geom/Direction";
import { TiledMap } from "../tiled/TiledMap";
import { TiledTileLayer } from "../tiled/TiledTileLayer";
import { createCanvas, getRenderingContext } from "../util/graphics";
import { SceneNode, SceneNodeArgs } from "./SceneNode";

/**
 * Constructor arguments for [[TiledNode]].
 */
export interface TiledMapLayerNodeArgs extends SceneNodeArgs {
    map: TiledMap,
    name: string
}

export class TiledMapLayerNode<T extends Game> extends SceneNode<T> {
    private map: TiledMap;
    private name: string;

    /**
     * Creates a new scene node displaying the given Tiled Map.
     */
    public constructor({ map, name, ...args }: TiledMapLayerNodeArgs) {
        super({
            width: map.getWidth() * map.getTileWidth(),
            height: map.getHeight() * map.getTileHeight(),
            anchor: Direction.TOP_LEFT,
            ...args
        });
        this.map = map;
        this.name = name;
    }

    private renderedMap: HTMLCanvasElement | null = null;

    private getRenderedMap(): HTMLCanvasElement | null {
        if (this.renderedMap == null) {
            const canvas = createCanvas(this.map.getWidth() * this.map.getTileWidth(), this.map.getHeight() * this.map.getTileHeight());
            const ctx = getRenderingContext(canvas, "2d");
            const layer = this.map.getLayer(this.name, TiledTileLayer);
            const tileset = this.map.getTilesets()[0];
            const tilesetImage = tileset.getImage();
            if (tilesetImage === null) {
                return null;
            }
            const data = layer.getData();
            const height = layer.getHeight();
            const width = layer.getWidth();
            for (let y = layer.getY(); y < height; ++y) {
                for (let x = layer.getX(); x < width; ++x) {
                    const tile = data[y * width + x];
                    const tileId = (tile & 0x1FFFFFFF) - tileset.getFirstGID();
                    if (tileId < 0) {
                        continue;
                    }
                    const flippedHorizontally = (tile & 0x80000000);
                    const flippedVertically = (tile & 0x40000000);
                    const flippedDiagonally = (tile & 0x20000000);
                    const tileY = Math.floor(tileId / tileset.getColumns());
                    const tileX = tileId % tileset.getColumns();
                    ctx.save();
                    ctx.translate(x * tileset.getTileWidth(), y * tileset.getTileHeight());
                    if (flippedHorizontally || flippedDiagonally) {
                        ctx.translate(tileset.getTileWidth(), 0);
                        ctx.scale(-1, 1);
                        // offsetX = tileset.getTileWidth();
                    }
                    if (flippedVertically || flippedDiagonally) {
                        ctx.translate(0, tileset.getTileHeight());
                        ctx.scale(1, -1);

                    }
                    ctx.drawImage(
                        tilesetImage,
                        tileX * tileset.getTileWidth(), tileY * tileset.getTileHeight(), tileset.getTileWidth(), tileset.getTileHeight(),
                        0, 0, tileset.getTileWidth(), tileset.getTileHeight()
                    );
                    ctx.restore();
                }
            }
            this.renderedMap = canvas;
        }
        return this.renderedMap;
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        const renderedMap = this.getRenderedMap();
        if (renderedMap != null) {
            ctx.drawImage(renderedMap, 0, 0);
        }
    }
}
