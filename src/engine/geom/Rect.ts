export class Rect {
    public constructor(
        private left: number,
        private top: number,
        private width: number,
        private height: number
    ) {}

    public getLeft(): number {
        return this.left;
    }

    public getTop(): number {
        return this.top;
    }

    public getWidth(): number {
        return this.width;
    }

    public getHeight(): number {
        return this.height;
    }

    public getRight(): number {
        return this.width + this.left;
    }

    public getBottom(): number {
        return this.height + this.top;
    }

    public getCenterX(): number {
        return this.left + this.width / 2;
    }

    public getCenterY(): number {
        return this.top + this.height / 2;
    }

    public translate(x: number, y: number): Rect {
        this.top += y;
        this.left += x;
        return this;
    }

    /**
     * Checks if this bounding box contains the given point.
     *
     * @param x - The X coordinate in scene coordinate system.
     * @param y - The Y coordinate in scene coordinate system.
     * @return True if bounding box contains the point, false if not.
     */
     public containsPoint(x: number, y: number): boolean {
        return this.top <= y && this.getBottom() >= y && this.left <= x && this.getRight() >= x;
    }
}
