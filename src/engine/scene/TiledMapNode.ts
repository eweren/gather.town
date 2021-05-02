import { Game } from "../Game";
import { Direction } from "../geom/Direction";
import { TiledMap } from "../tiled/TiledMap";
import { TiledObject } from "../tiled/TiledObject";
import { TiledObjectGroupLayer } from "../tiled/TiledObjectGroupLayer";
import { TiledTileLayer } from "../tiled/TiledTileLayer";
import { radians } from "../util/math";
import { SceneNode, SceneNodeArgs } from "./SceneNode";
import { TiledMapLayerNode } from "./TiledMapLayerNode";

export interface TiledSceneArgs extends SceneNodeArgs {
    tiledObject?: TiledObject;
}

/**
 * Constructor arguments for [[TiledMapNode]].
 */
export interface TiledMapNodeArgs<T extends Game> extends SceneNodeArgs {
    map: TiledMap,
    objects?: Record<string, new (args: TiledSceneArgs) => SceneNode<T>>
}

export class TiledMapNode<T extends Game> extends SceneNode<T> {
    /**
     * Creates a new scene node displaying the given Tiled Map.
     */
    public constructor({ map, objects, ...args }: TiledMapNodeArgs<T>) {
        super({
            width: map.getWidth() * map.getTileWidth(),
            height: map.getHeight() * map.getTileHeight(),
            anchor: Direction.TOP_LEFT,
            childAnchor: Direction.TOP_LEFT,
            ...args
        });
        for (const tiledLayer of map.getLayers()) {
            const layer = tiledLayer.getOptionalProperty("layer", "int")?.getValue();
            if (tiledLayer instanceof TiledTileLayer) {
                this.appendChild(new TiledMapLayerNode({ map, layer, name: tiledLayer.getName() }));
            } else if (tiledLayer instanceof TiledObjectGroupLayer) {
                for (const object of tiledLayer.getObjects()) {
                    const constructor = (objects != null ? objects[object.getType()] : null) ?? SceneNode;
                    const args: TiledSceneArgs = {
                        id: object.getName(),
                        x: object.getX(),
                        y: object.getY(),
                        showBounds: object.getOptionalProperty("showBounds", "bool")?.getValue(),
                        layer,
                        tiledObject: object
                    };
                    const width = object.getWidth();
                    const height = object.getHeight();
                    if (width > 0 && height > 0) {
                        args.width = width;
                        args.height = height;
                        args.anchor = Direction.TOP_LEFT;
                    }
                    const node = new constructor(args);
                    node.transform(m => m.rotate(radians(object.getRotation())));
                    this.appendChild(node);
                }
            } else if (tiledLayer instanceof Object) {
                console.log("Unknown layer", tiledLayer.constructor.name);
            }
        }
    }
}
