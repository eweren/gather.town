import { Color } from "../../engine/color/Color";
import { RGBColor } from "../../engine/color/RGBColor";
import { Direction } from "../../engine/geom/Direction";
import { Polygon2 } from "../../engine/graphics/Polygon2";
import { Vector2 } from "../../engine/graphics/Vector2";
import { SceneNode, SceneNodeAspect } from "../../engine/scene/SceneNode";
import { TiledSceneArgs } from "../../engine/scene/TiledMapNode";
import { createCanvas, getRenderingContext } from "../../engine/util/graphics";
import { radians } from "../../engine/util/math";
import { Hyperloop } from "../Hyperloop";

export function intensifyColor(color: RGBColor, f: number): Color {
    let r = f * color.getRed(), g = f * color.getGreen(), b = f * color.getBlue();
    if (r > 1) {
        g += (r - 1) / 2;
        b += (r - 1) / 2;
        r = 1;
    }
    if (g > 1) {
        r += (g - 1) / 2;
        b += (b - 1) / 2;
        g = 1;
    }
    if (b > 1) {
        r += (b - 1) / 2;
        g += (b - 1) / 2;
        b = 1;
    }
    return new RGBColor(r, g, b);
}

export class LightNode extends SceneNode<Hyperloop> {
    private color: Color;
    private intensity: number;
    private readonly polygon: Polygon2 | null;
    private readonly spin: number;
    private gradient: CanvasGradient | null = null;

    public constructor(args?: TiledSceneArgs) {
        super({ anchor: Direction.TOP_LEFT, ...args });
        this.color = args?.tiledObject?.getOptionalProperty("color", "color")?.getValue() ?? new RGBColor(1, 1, 1);
        this.polygon = args?.tiledObject?.getPolygon() ?? null;
        this.intensity = args?.tiledObject?.getOptionalProperty("intensity", "int")?.getValue() ?? 100;
        this.spin = args?.tiledObject?.getOptionalProperty("spin", "float")?.getValue() ?? 0;
        this.updateGradient();
    }

    private updateGradient(): void {
        if (this.polygon === null && this.width !== 0 && this.height !== 0) {
            this.gradient = null;
        } else {
            const colors: Color[] = [];
            const color = this.color.toRGB();
            const steps = 16;
            const overshoot = 0.5;
            for (let step = 0; step < steps; step++) {
                const p = (1 + overshoot) * (1 - step / steps) ** 8;
                const col = intensifyColor(color, p);
                colors.push(col);
            }
            colors.push(new RGBColor(0, 0, 0));

            const canvas = createCanvas(8, 8);
            const ctx = getRenderingContext(canvas, "2d");
            const origin = this.polygon?.vertices[0] ?? new Vector2(0, 0);
            const intensity = this.polygon == null ? this.intensity / 2 : this.intensity;
            this.gradient = ctx.createRadialGradient(origin.x, origin.y, 0, origin.x, origin.y, intensity);
            for (let i = 0, count = colors.length - 1; i <= count; i++) {
                this.gradient.addColorStop(i / count, colors[i].toString());
            }
        }
    }

    public setColor(color: Color): this {
        if (this.color !== color) {
            this.color = color;
            this.updateGradient();
            this.invalidate(SceneNodeAspect.RENDERING);
        }
        return this;
    }

    public setIntensity(intensity: number): this {
        if (this.intensity !== intensity) {
            this.intensity = intensity;
            this.updateGradient();
            this.invalidate(SceneNodeAspect.RENDERING);
        }
        return this;
    }

    public updateBoundsPolygon(bounds: Polygon2) {
        if (this.polygon != null) {
            for (const vertex of this.polygon.vertices) {
                bounds.addVertex(vertex);
            }
        } else {
            super.updateBoundsPolygon(bounds);
        }
    }

    public update(dt: number) {
        if (this.spin !== 0) {
            this.transform(m => {
                const v = this.polygon?.vertices[0];
                if (v) {
                    m.translate(v.x, v.y);
                }
                m.rotate(radians(this.spin) * dt);
                if (v) {
                    m.translate(-v.x, -v.y);
                }
            });
        }
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.beginPath();
        const intensity = this.intensity;
        const width = this.getWidth();
        const height = this.getHeight();
        ctx.fillStyle = this.gradient ?? this.color.toString();
        if (this.polygon != null) {
            this.polygon.draw(ctx);
        } else if (width === 0 && height === 0) {
            const halfIntensity = intensity / 2;
            ctx.ellipse(0, 0, halfIntensity, halfIntensity, 0, 0, Math.PI * 2, true);
        } else {
            ctx.rect(0, 0, width, height);
        }
        ctx.fill();
        ctx.restore();
    }
}
