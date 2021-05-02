import { Transition } from "../scene/Transition";

export class FadeToBlackTransition extends Transition {
    public draw(ctx: CanvasRenderingContext2D, draw: () => void): void {
        draw();
        ctx.globalAlpha = this.valueOf();
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
}
