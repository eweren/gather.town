import { Direction } from "../../engine/geom/Direction";
import { Bounds2 } from "../../engine/graphics/Bounds2";
import { SceneNode, SceneNodeArgs } from "../../engine/scene/SceneNode";
import { Hyperloop } from "../Hyperloop";

export class CollisionNode extends SceneNode<Hyperloop> {
    public constructor(args?: SceneNodeArgs) {
        super({ anchor: Direction.TOP_LEFT, ...args });
        // this.setShowBounds(true);
    }

    public store: string = "";

    public collidesWithRectangle(x1: Bounds2): boolean;
    public collidesWithRectangle(x1: number, y1: number, x2: number, y2: number): boolean;
    public collidesWithRectangle(x1: number | Bounds2, y1: number = 0, w: number = 0, h: number = 0): boolean {
        const bounds = this.getBounds();
        const minX = bounds.minX + this.getX(), minY = bounds.minY + this.getY(), maxX = bounds.maxX + this.getX(),
                maxY = bounds.maxY + this.getY();
        if (x1 instanceof Bounds2) {
            y1 = x1.minY;
            w = x1.width;
            h = x1.height;
            x1 = x1.minX;
        }
        return minX <= x1 + w && maxX >= x1 && minY <= y1 + h && maxY >= y1;
    }

    public containsPoint(x: number, y: number): boolean {
        const bounds = this.getBounds();
        const minX = bounds.minX + this.getX(), minY = bounds.minY + this.getY(), maxX = bounds.maxX + this.getX(),
                maxY = bounds.maxY + this.getY();
        return x >= minX && x <= maxX && y >= minY && y <= maxY;
    }
}
