import type { TiledPropertyJSON, TiledPropertyType } from "*.tiledmap.json";
import { Color } from "../color/Color";

export type TiledPropertyValueType<T extends TiledPropertyType> =
    T extends "int" ? number :
    T extends "float" ? number :
    T extends "bool" ? boolean :
    T extends "color" ? Color :
    string;

export class TiledProperty<T extends TiledPropertyType = TiledPropertyType> {
    public constructor(private readonly json: TiledPropertyJSON<T>) {}

    public static fromJSON<T extends TiledPropertyType>(json: TiledPropertyJSON<T>): TiledProperty<T> {
        return new TiledProperty(json);
    }

    public toJSON(): TiledPropertyJSON<T> {
        return this.json;
    }

    public getName(): string {
        return this.json.name;
    }

    public getValue(): TiledPropertyValueType<T> {
        return (this.json.type === "color" ? Color.fromJSON(this.json.value as string) : this.json.value) as
            TiledPropertyValueType<T>;
    }

    public getType(): T {
        return this.json.type ?? "string" as T;
    }

    public isInt(): this is TiledProperty<"int"> {
        return this.getType() === "int";
    }

    public isFloat(): this is TiledProperty<"float"> {
        return this.getType() === "float";
    }

    public isBoolean(): this is TiledProperty<"bool"> {
        return this.getType() === "bool";
    }

    public iString(): this is TiledProperty<"string"> {
        return this.getType() === "string";
    }

    public isColor(): this is TiledProperty<"color"> {
        return this.getType() === "color";
    }

    public isFile(): this is TiledProperty<"file"> {
        return this.getType() === "file";
    }
}
