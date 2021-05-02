import base64 from "base64-js";
import pako from "pako";

import { TiledChunkJSON, TiledCompression } from "*.tiledmap.json";

export class TiledChunk {
    private decoded: Uint32Array | null = null;

    private constructor(
        private readonly json: TiledChunkJSON,
        private readonly compression: TiledCompression | null
    ) {}

    public static fromJSON(json: TiledChunkJSON, compression: TiledCompression | null): TiledChunk {
        return new TiledChunk(json, compression);
    }

    public toJSON(): TiledChunkJSON {
        return this.json;
    }

    public getData(): Uint32Array {
        if (this.decoded == null) {
            const json = this.json;
            let decoded: Uint32Array;
            if (typeof json.data === "string") {
                const compressed = base64.toByteArray(json.data);
                let uncompressed: Uint8Array;
                switch (this.compression) {
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
                        throw new Error("Unknown layer compression: " + this.compression);
                }
                decoded = new Uint32Array(uncompressed.buffer);
            } else {
                decoded = new Uint32Array(json.data);
            }
            this.decoded = decoded;
        }
        return this.decoded;
    }

    public getWidth(): number {
        return this.json.width;
    }

    public getHeight(): number {
        return this.json.height;
    }

    public getX(): number {
        return this.json.x;
    }

    public getY(): number {
        return this.json.y;
    }
}
