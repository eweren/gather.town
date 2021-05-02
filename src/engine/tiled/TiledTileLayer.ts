import base64 from "base64-js";
import pako from "pako";

import type { TiledCompression, TiledLayerJSON, TiledTileLayerJSON } from "*.tiledmap.json";

import { AbstractTiledLayer } from "./AbstractTiledLayer";
import { TiledChunk } from "./TiledChunk";
import { cacheResult } from "../util/cache";

export function isTiledTileLayerJSON(json: TiledLayerJSON): json is TiledTileLayerJSON {
    return json.type === "tilelayer";
}

export class TiledTileLayer extends AbstractTiledLayer<TiledTileLayerJSON> {
    public static fromJSON(json: TiledTileLayerJSON, baseURL: string | URL): TiledTileLayer {
        return new TiledTileLayer(json, baseURL);
    }

    @cacheResult
    public getData(): Uint32Array {
        const json = this.json;
        let decoded: Uint32Array;
        if (typeof json.data === "string") {
            const compressed = base64.toByteArray(json.data);
            let uncompressed: Uint8Array;
            switch (json.compression) {
                case "":
                    // Data is not compressed
                    uncompressed = compressed;
                    break;
                case "gzip":
                    uncompressed = pako.ungzip(compressed);
                    break;
                case "zlib":
                    uncompressed = pako.inflate(compressed);
                    break;
                default:
                    // zstd is not supported because there is only a very large emscripten port available for
                    // JavaScript. Stick to gzip or zlib for now.
                    throw new Error("Unknown layer compression: " + json.compression);
            }
            decoded = new Uint32Array(uncompressed.buffer);
        } else {
            decoded = new Uint32Array(json.data);
        }
        return decoded;
    }

    @cacheResult
    public getChunks(): readonly TiledChunk[] | null {
        return this.json.chunks?.map(json => TiledChunk.fromJSON(json, this.getCompression())) ?? null;
    }

    public getCompression(): TiledCompression | null{
        return this.json.compression ?? null;
    }

    public getStartX(): number | null {
        return this.json.startx ?? null;
    }

    public getStartY(): number | null {
        return this.json.starty ?? null;
    }
}
