import { Assets } from "./assets/Assets";
import { clamp } from "./util/math";
import { ControllerManager } from "./input/ControllerManager";
import { createCanvas, getRenderingContext } from "./util/graphics";
import { GamepadInput } from "./input/GamepadInput";
import { Keyboard } from "./input/Keyboard";
import { Scenes } from "./scene/Scenes";
import { getAudioContext } from "./assets/Sound";

/**
 * Max time delta (in s). If game freezes for a few seconds for whatever reason, we don't want
 * updates to jump too much.
 */
const MAX_DT = 0.1;

export abstract class Game {
    public readonly controllerManager = ControllerManager.getInstance();
    public readonly keyboard = new Keyboard();
    public readonly gamepad = new GamepadInput();
    public readonly scenes = new Scenes(this);
    public readonly assets = new Assets();

    public backgroundColor: string = "black";

    public canvasScale = 1;

    public canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D;
    private readonly gameLoopCallback = this.gameLoop.bind(this);
    private gameLoopId: number | null = null;
    private lastUpdateTime: number = performance.now();
    protected currentTime: number = 0;
    protected paused = false;

    public constructor(public width: number = window.innerWidth / 2, public height: number = window.innerHeight / 2) {
        const canvas = this.canvas = createCanvas(width, height);
        // Desynchronized sounds like a good idea but unfortunately it prevents pixelated graphics
        // on some systems (Chrome+Windows+NVidia for example which forces bilinear filtering). So
        // it is deactivated here.
        this.ctx = getRenderingContext(canvas, "2d", { alpha: false, desynchronized: false });
        const style = canvas.style;
        style.position = "absolute";
        style.margin = "auto";
        style.left = style.top = style.right = style.bottom = "0";
        style.imageRendering = "pixelated";
        style.imageRendering = "crisp-edges";
        document.body.appendChild(this.canvas);
        this.updateCanvasSize();
        window.addEventListener("resize", () => this.updateCanvasSize());
        canvas.addEventListener("contextmenu", event => {
            event.preventDefault();
        });

        // Use Alt+Enter to toggle fullscreen mode.
        window.addEventListener("keydown", async (event) => {
            if (event.altKey && event.key === "Enter") {
                const lockingEnabled = "keyboard" in navigator && "lock" in navigator.keyboard && typeof navigator.keyboard.lock === "function";
                // If the browser is in full screen mode AND fullscreen has been triggered by our own keyboard shortcut...
                if (window.matchMedia("(display-mode: fullscreen)").matches && document.fullscreenElement != null) {
                    if (lockingEnabled) {
                        navigator.keyboard.unlock();
                    }
                    await document.exitFullscreen();
                } else {
                    // if (lockingEnabled) {
                    //     await navigator.keyboard.lock(["Escape"]);
                    // }
                    await document.body.requestFullscreen();
                }
            }
        });
        this.input.onButtonDown.filter(ev => ev.isPause).connect(this.pauseGame, this);
    }

    public get input(): ControllerManager {
        return this.controllerManager;
    }

    public pauseGame(): void {
        if (this.paused) {
            this.paused = false;
            getAudioContext().resume();
        } else {
            this.paused = true;
            getAudioContext().suspend();
        }
    }

    private updateCanvasSize(): void {
        this.canvas.width = window.innerWidth / 2;
        this.canvas.height = window.innerHeight / 2;

        this.canvasScale = Math.max(
            1,
            Math.floor(Math.min(window.innerWidth / this.width, window.innerHeight / this.height))
        );

        this.width = window.innerWidth / 2;
        this.height = window.innerHeight / 2;


        this.scenes.activeScene?.resizeTo(this.width, this.height);

        const style = this.canvas.style;
        style.width = window.innerWidth + "px";
        style.height = window.innerHeight + "px";
    }

    private gameLoop(): void {
        const currentUpdateTime = performance.now();
        const dt = clamp((currentUpdateTime - this.lastUpdateTime) / 1000, 0, MAX_DT);
        this.currentTime += dt;
        this.update(dt, this.currentTime);
        this.lastUpdateTime = currentUpdateTime;

        if (!this.paused) {
            const { ctx, width, height } = this;
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            ctx.fillStyle = this.backgroundColor;
            ctx.fillRect(0, 0, width, height);
            this.draw(ctx, width, height);
            ctx.restore();
        }

        this.nextFrame();
    }

    private nextFrame(): void {
        this.gameLoopId = requestAnimationFrame(this.gameLoopCallback);
        // this.gameLoopId = window.setTimeout(this.gameLoopCallback, 1000 / 40); // limit framerate to nearly 30fps for
                                                                               // better performance
    }

    protected update(dt: number, time: number): void {
        this.gamepad.update();
        if (!this.paused) {
            this.scenes.update(dt, time);
        }
    }

    protected draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
        this.scenes.draw(ctx, width, height);
    }

    public start(): void {
        if (this.gameLoopId == null) {
            this.lastUpdateTime = performance.now();
            this.nextFrame();
        }
    }

    public stop(): void {
        if (this.gameLoopId != null) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
    }

    public getTime(): number {
        return this.currentTime;
    }
}
