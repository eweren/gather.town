import { TiledLayerJSON, TiledLayerType } from "*.tiledmap.json";

import type { TiledLayer } from "./TiledLayer";
import { TiledProperties } from "./TiledProperties";

export abstract class AbstractTiledLayer<T extends TiledLayerJSON = TiledLayerJSON>
        extends TiledProperties<TiledLayerJSON> implements TiledLayer<T> {
    public constructor(protected readonly json: T, protected readonly baseURL: string | URL) {
        super(json, baseURL);
    }

    public toJSON(): T {
        return this.json;
    }

    public getType(): TiledLayerType {
        return this.json.type;
    }

    public getId(): number {
        return this.json.id;
    }

    public getName(): string {
        return this.json.name;
    }

    public getOffsetX(): number {
        return this.json.offsetx;
    }

    public getOffsetY(): number {
        return this.json.offsety;
    }

    public getOpacity(): number {
        return this.json.opacity;
    }

    public isVisible(): boolean {
        return this.json.visible;
    }

    public getX(): number {
        return this.json.x;
    }

    public getY(): number {
        return this.json.y;
    }

    public getWidth(): number {
        return this.json.width;
    }

    public getHeight(): number {
        return this.json.height;
    }
}
