import { clamp } from "../util/math";
import { Easing, linear } from "../util/easings";

export type TransitionType = "in" | "out";

export interface TransitionOptions {
    duration?: number;
    reverse?: boolean;
    delay?: number;
    easing?: Easing;
    exclusive?: boolean;
}

export class Transition {
    private type: TransitionType = "out";
    private readonly duration: number;
    private readonly easing: Easing;
    private readonly delay: number;
    private readonly exclusive: boolean;
    private elapsed: number = 0;
    private resolve: (() => void) | null = null;
    private promise: Promise<void> | null = null;

    public constructor({ duration = 0.5, easing = linear, delay = 0, exclusive = false }: TransitionOptions = {}) {
        this.duration = duration;
        this.easing = easing;
        this.delay = delay;
        this.exclusive = exclusive;
    }

    public isExclusive(): boolean {
        return this.exclusive;
    }

    public valueOf(): number {
        const value = this.easing(clamp((Math.max(0, this.elapsed - this.delay)) / this.duration, 0, 1));
        return this.type === "out" ? value : (1 - value);
    }

    public update(dt: number): void {
        if (this.promise != null) {
            this.elapsed += dt;
            if (this.elapsed - this.delay >= this.duration) {
                this.stop();
            }
        }
    }

    public draw(ctx: CanvasRenderingContext2D, draw: () => void, width: number, height: number): void {}

    public async start(type: TransitionType): Promise<void> {
        if (this.promise == null) {
            this.type = type;
            this.elapsed = 0;
            this.promise = new Promise(resolve => { this.resolve = resolve; });
        }
        return this.promise;
    }

    public stop(): void {
        if (this.resolve != null) {
            this.resolve();
            this.resolve = null;
            this.promise = null;
        }
    }
}
