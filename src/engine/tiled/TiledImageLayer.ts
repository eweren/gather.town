import { TiledImageLayerJSON, TiledLayerJSON } from "*.tiledmap.json";

import { AbstractTiledLayer } from "./AbstractTiledLayer";

export function isTiledImageLayerJSON(json: TiledLayerJSON): json is TiledImageLayerJSON {
    return json.type === "imagelayer";
}

export class TiledImageLayer extends AbstractTiledLayer<TiledImageLayerJSON> {
    public static fromJSON(json: TiledImageLayerJSON, baseURL: string | URL): TiledImageLayer {
        return new TiledImageLayer(json, baseURL);
    }
}
