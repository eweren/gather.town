import type { TiledDrawOrder, TiledLayerJSON, TiledObjectGroupLayerJSON } from "*.tiledmap.json";
import { cacheResult } from "../util/cache";

import { AbstractTiledLayer } from "./AbstractTiledLayer";
import { TiledObject } from "./TiledObject";

export function isTiledObjectGroupLayerJSON(json: TiledLayerJSON): json is TiledObjectGroupLayerJSON {
    return json.type === "objectgroup";
}

export class TiledObjectGroupLayer extends AbstractTiledLayer<TiledObjectGroupLayerJSON> {
    public static fromJSON(json: TiledObjectGroupLayerJSON, baseURL: string | URL): TiledObjectGroupLayer {
        return new TiledObjectGroupLayer(json, baseURL);
    }

    public getDrawOrder(): TiledDrawOrder {
        return this.json.draworder;
    }

    @cacheResult
    public getObjects(): readonly TiledObject[] {
        return this.json.objects.map(json => TiledObject.fromJSON(json, this.baseURL));
    }
}
