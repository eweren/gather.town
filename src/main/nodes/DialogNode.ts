import { TextNode } from "../../engine/scene/TextNode";
import { Hyperloop } from "../Hyperloop";

export class DialogNode extends TextNode<Hyperloop> {
    /** @inheritDoc */
    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        super.draw(ctx);
        ctx.restore();
        ctx.save();
        /*
        if (this.outlineColor != null) {
            this.font.drawTextWithOutline(ctx, this.text, 0, 0, this.color, this.outlineColor);
        } else {
            this.font.drawText(ctx, this.text, 0, 0, this.color);
        }
        */
        if (this.getText() !== "") {
            ctx.beginPath();

            // Hack to get pixel boundaries correct
            const transform = ctx.getTransform();
            ctx.translate(
                Math.round(transform.e) - transform.e,
                Math.round(transform.f) - transform.f
            );
            const scale = this.getSceneTransformation().getScaleX();
            ctx.translate(0.5 * scale, 0.5 * scale);

            const w = this.getWidth();
            const h = this.getHeight();
            const w2 = w >> 1;
            const h2 = h >> 1;

            ctx.beginPath();
            ctx.moveTo(-5, h2 - 1);
            ctx.lineTo(-5, h + 2);
            ctx.lineTo(w2 - 3, h + 2);
            ctx.lineTo(w2, h + 6);
            ctx.lineTo(w2 + 3, h + 2);
            ctx.lineTo(w + 4, h + 2);
            ctx.lineTo(w + 4, h2 - 1);
            ctx.strokeStyle = "white";
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(-6, h2);
            ctx.lineTo(-6, h + 3);
            ctx.lineTo(w2 - 5, h + 3);
            ctx.lineTo(w2, h + 8);
            ctx.lineTo(w2 + 5, h + 3);
            ctx.lineTo(w + 5, h + 3);
            ctx.lineTo(w + 5, h2);
            ctx.strokeStyle = "black";
            ctx.stroke();
        }
        ctx.restore();
    }
}
