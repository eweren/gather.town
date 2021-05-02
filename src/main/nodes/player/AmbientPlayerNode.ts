import { Color } from "../../../engine/color/Color";
import { RGBColor } from "../../../engine/color/RGBColor";
import { Direction } from "../../../engine/geom/Direction";
import { Vector2 } from "../../../engine/graphics/Vector2";
import { SceneNode, SceneNodeAspect } from "../../../engine/scene/SceneNode";
import { TiledSceneArgs } from "../../../engine/scene/TiledMapNode";
import { createCanvas, getRenderingContext } from "../../../engine/util/graphics";
import { Layer } from "../../constants";
import { Hyperloop } from "../../Hyperloop";
import { intensifyColor } from "../LightNode";

export class AmbientPlayerNode extends SceneNode<Hyperloop> {
    private color: Color;
    private readonly intensity: number;
    private gradient: CanvasGradient | null = null;

    public constructor(args?: TiledSceneArgs) {
        super({
            anchor: Direction.CENTER,
            id: "flashlight",
            layer: Layer.LIGHT,
            ...args
        });
        this.color = args?.tiledObject?.getOptionalProperty("color", "color")?.getValue() ?? new RGBColor(0.2, 0.3, 0.2);
        this.intensity = args?.tiledObject?.getOptionalProperty("intensity", "int")?.getValue() ?? 250;
        this.updateGradient();
    }

    private updateGradient(): void {
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
        const origin = new Vector2(0, 0);
        const intensity = this.intensity;
        this.gradient = ctx.createRadialGradient(origin.x, origin.y, 0, origin.x, origin.y, intensity);
        for (let i = 0, count = colors.length - 1; i <= count; i++) {
            this.gradient.addColorStop(i / count, colors[i].toString());
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

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.beginPath();
        const intensity = this.intensity;
        ctx.fillStyle = this.gradient ?? this.color.toString();
        const halfIntensity = intensity / 2;
        ctx.ellipse(0, 0, halfIntensity, halfIntensity, 0, 0, Math.PI * 2, true);
        ctx.fill();
        ctx.restore();
    }
}
