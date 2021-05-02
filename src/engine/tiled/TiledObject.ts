import type { TiledLayerJSON, TiledObjectGroupLayerJSON, TiledObjectJSON } from "*.tiledmap.json";
import { Polygon2 } from "../graphics/Polygon2";
import { Vector2 } from "../graphics/Vector2";
import { cacheResult } from "../util/cache";
import { TiledProperties } from "./TiledProperties";

export function isTiledObjectGroupLayerJSON(json: TiledLayerJSON): json is TiledObjectGroupLayerJSON {
    return json.type === "objectgroup";
}

export class TiledObject extends TiledProperties<TiledObjectJSON> {
    public toJSON(): TiledObjectJSON {
        return this.json;
    }

    public static fromJSON(json: TiledObjectJSON, baseURL: string | URL): TiledObject {
        return new TiledObject(json, baseURL);
    }

    @cacheResult
    public getPolygon(): Polygon2 | null {
        if (this.json.polygon == null) {
            return null;
        }
        const polygon = new Polygon2();
        for (const point of this.json.polygon) {
            polygon.addVertex(new Vector2(point.x, point.y));
        }
        return polygon;
    }

    public isEllipse(): boolean {
        return this.json.ellipse === true;
    }

    public getId(): number {
        return this.json.id;
    }

    public getName(): string {
        return this.json.name;
    }

    public getType(): string {
        return this.json.type;
    }

    public getHeight(): number {
        return this.json.height;
    }

    public getWidth(): number {
        return this.json.width;
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

    public getRotation(): number {
        return this.json.rotation;
    }
}
