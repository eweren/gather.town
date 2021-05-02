import { ControllerManager } from "../input/ControllerManager";
import { Game } from "../Game";
import { Keyboard } from "../input/Keyboard";
import { Scenes } from "./Scenes";
import { Transition } from "./Transition";
import { UpdateRootNode, DrawRootNode, RootNode } from "./RootNode";
import { SceneNode } from "./SceneNode";
import { Camera } from "./Camera";
import { createCanvas, getRenderingContext } from "../util/graphics";
import { Signal } from "../util/Signal";
import { ScenePointerMoveEvent } from "./events/ScenePointerMoveEvent";
import { ScenePointerDownEvent } from "./events/ScenePointerDownEvent";

/**
 * Constructor type of a scene.
 *
 * @param T - The game type.
 * @param A - Optional scene argument type. A value of this type must be specified when setting or pushing a scene.
 *            Defaults to no argument (void type)
 */
export type SceneConstructor<T extends Game = Game, A = void> = new (game: T) => Scene<T, A>;

/**
 * Abstract base class of a scene.
 *
 * @param T - The game type.
 * @param A - Optional scene argument type. A value of this type must be specified when setting or pushing a scene.
 *            Defaults to no argument (void type)
 */
export abstract class Scene<T extends Game = Game, A = void> {
    public zIndex: number = 0;
    public currentTransition: Transition | null = null;
    public inTransition: Transition | null = null;
    public outTransition: Transition | null = null;
    public readonly rootNode: RootNode<T>;
    private updateRootNode!: UpdateRootNode;
    private drawRootNode!: DrawRootNode;
    private usedLayers: number = 0;
    private hiddenLayers: number = 0;
    private lightLayers: number = 0;
    private hudLayers: number = 0;
    private backgroundStyle: string | null = null;

    public readonly camera: Camera<T>;

    public readonly onPointerMove = new Signal<ScenePointerMoveEvent<T, A>>(this.initPointerMove.bind(this));
    public readonly onPointerDown = new Signal<ScenePointerDownEvent<T, A>>(this.initPointerDown.bind(this));

    public constructor(public readonly game: T) {
        this.rootNode = new RootNode(this, (update, draw) => {
            this.updateRootNode = update;
            this.drawRootNode = draw;
        });
        this.rootNode.resizeTo(this.game.width, this.game.height);
        this.camera = new Camera(this);
    }

    public get keyboard(): Keyboard {
        return this.game.keyboard;
    }

    public get input(): ControllerManager {
        return ControllerManager.getInstance();
    }

    public get scenes(): Scenes<T> {
        return this.game.scenes;
    }

    /**
     * Shows the given layer when it was previously hidden.
     *
     * @param layer - The layer to show (0-31).
     */
    public showLayer(layer: number): this {
        this.hiddenLayers &= ~(1 << layer);
        return this;
    }

    /**
     * Hides the given layer when it was previously shown.
     *
     * @param layer - The layer to hide (0-31).
     */
    public hideLayer(layer: number): this {
        this.hiddenLayers |= 1 << layer;
        return this;
    }

    /**
     * Toggles the visibility of the given layer.
     *
     * @param layer   - The layer to toggle.
     * @param visible - Forced visibility state.
     */
    public toggleLayer(layer: number, visible?: boolean): this {
        if (visible ?? !this.isLayerShown(layer)) {
            this.showLayer(layer);
        } else {
            this.hideLayer(layer);
        }
        return this;
    }

    /**
     * Checks if given layer is hidden.
     *
     * @param layer - The layer to check (0-31).
     * @return True if layer is hidden, false if not.
     */
    public isLayerHidden(layer: number): boolean {
        return (this.hiddenLayers & (1 << layer)) !== 0;
    }

    /**
     * Checks if given layer is shown.
     *
     * @param layer - The layer to check (0-31).
     * @return True if layer is shown, false if not.
     */
    public isLayerShown(layer: number): boolean {
        return (this.hiddenLayers & (1 << layer)) === 0;
    }

    /**
     * Sets the layers which are handled as lighting layers. The nodes rendered in this layer are multiplied with the
     * layers beneath them to achieve dynamic illumination.
     *
     * @param lightLayers - The light layers to set.
     */
    public setLightLayers(lightLayers: number[]): this {
        this.lightLayers = lightLayers.reduce((layers, layer) => layers | (1 << layer), 0);
        return this;
    }

    /**
     * Returns the layers which are handled as lighting layers.
     *
     * @return The light layers.
     */
    public getLightLayers(): number[] {
        const lightLayers: number[] = [];
        for (let layer = 0; layer < 32; ++layer) {
            if ((this.lightLayers & (1 << layer)) !== 0) {
                lightLayers.push(layer);
            }
        }
        return lightLayers;
    }

    /**
     * Sets the layers which are not transformed by the camera. These layers can be used to display fixed information
     * on the screen which is independent from the current camera settings.
     *
     * @param hudLayers - The hud layers to set.
     */
    public setHudLayers(hudLayers: number[]): this {
        this.hudLayers = hudLayers.reduce((layers, layer) => layers | (1 << layer), 0);
        return this;
    }

    /**
     * Returns the HUD layers which are not transformed by the camera.
     *
     * @return The hud layers.
     */
    public getHudLayers(): number[] {
        const hudLayers: number[] = [];
        for (let layer = 0; layer < 32; ++layer) {
            if ((this.hudLayers & (1 << layer)) !== 0) {
                hudLayers.push(layer);
            }
        }
        return hudLayers;
    }

    /**
     * Returns the scene node with the given id.
     *
     * @param id - The ID to look for.
     * @return The matching scene node or null if none.
     */
    public getNodeById(id: string): SceneNode<T> | null {
        return this.rootNode.getDescendantById(id);
    }

    /**
     * Returns the background style of this scene. This style is used to fill the background of the scene when set.
     *
     * @return The scene background style.
     */
    public getBackgroundStyle(): string | null {
        return this.backgroundStyle;
    }

    /**
     * Sets the background style of this scene. This style is used to fill the background of the scene when set.
     *
     * @param backgroundStyle - The background style to set.
     */
    public setBackgroundStyle(backgroundStyle: string | null): this {
        this.backgroundStyle = backgroundStyle;
        return this;
    }

    private initPointerMove(signal: Signal<ScenePointerMoveEvent<T, A>>) {
        const listener = (event: PointerEvent) => {
            signal.emit(new ScenePointerMoveEvent(this, event));
        };
        this.game.canvas.addEventListener("pointermove", listener);
        return () => {
            this.game.canvas.removeEventListener("pointermove", listener);
        };
    }

    private initPointerDown(signal: Signal<ScenePointerDownEvent<T, A>>) {
        const listener = (event: PointerEvent) => {
            signal.emit(new ScenePointerDownEvent(this, event));
        };
        this.game.canvas.addEventListener("pointerdown", listener);
        return () => {
            this.game.canvas.removeEventListener("pointerdown", listener);
        };
    }

    /**
     * Checks if this scene is active.
     *
     * @return True if scene is active, false it not.
     */
    public isActive(): boolean {
        return this.scenes.activeScene === this;
    }

    /**
     * Called when the scene is pushed onto the stack and before any transitions.
     *
     * @param args - The scene arguments (if any).
     */
    public setup(args: A): Promise<void> | void {}

    /**
     * Called when the scene becomes the top scene on the stack and after the on-stage transition is complete.
     */
    public activate(): Promise<void> | void {}

    /**
     * Called when the scene is no longer the top scene on the stack and before the off-stage transition begins.
     */
    public deactivate(): Promise<void> | void {}

    /**
     * Called when the scene is popped from the scene stack, after any transitions are complete.
     */
    public cleanup(): Promise<void> | void {}

    /**
     * Updates the scene. Scenes can overwrite this method to do its own drawing but when you are going to use the
     * scene graph then make sure to call the super method in your overwritten method or the scene graph will not be
     * updated.
     */
    public update(dt: number, time: number): void {
        this.usedLayers = this.updateRootNode(dt, time);
        this.camera.update(dt);
    }

    /**
     * Draws the scene. Scenes can overwrite this method to do its own drawing but when you are going to use the
     * scene graph then make sure to call the super method in your overwritten method or the scene graph will not be
     * rendered.
     *
     * @param ctx    - The rendering context.
     * @param width  - The scene width.
     * @param height - The scene height.
     */
    public draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
        if (this.backgroundStyle != null) {
            ctx.save();
            ctx.fillStyle = this.backgroundStyle;
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
        }
        ctx.save();
        const reverseCameraTransformation = this.camera.getSceneTransformation().clone().invert();
        const postDraw = this.camera.draw(ctx, width, height);
        let layer = 1;
        let usedLayers = this.usedLayers & ~this.hiddenLayers;
        let debugLight = true;
        while (usedLayers !== 0) {
            if ((usedLayers & 1) === 1) {
                const light = (this.lightLayers & layer) !== 0;
                const hud = (this.hudLayers & layer) !== 0;
                if (light) {
                    ctx.save();
                    const canvas = createCanvas(width, height);
                    const tmpCtx = getRenderingContext(canvas, "2d");
                    tmpCtx.fillStyle = "#000";
                    tmpCtx.fillRect(0, 0, width * 200, height * 200);
                    this.camera.getSceneTransformation().setCanvasTransform(tmpCtx);
                    tmpCtx.globalCompositeOperation = "screen";
                    this.drawRootNode(tmpCtx, layer, width, height);
                    if (!debugLight) {
                        ctx.globalCompositeOperation = "multiply";
                    }
                    reverseCameraTransformation.transformCanvas(ctx);
                    ctx.drawImage(canvas, 0, 0);
                    ctx.restore();
                } else {
                    if (hud) {
                        ctx.save();
                        reverseCameraTransformation.transformCanvas(ctx);
                    }
                    this.drawRootNode(ctx, layer, width, height);
                    debugLight = false;
                    if (hud) {
                        ctx.restore();
                    }
                }
            }
            usedLayers >>>= 1;
            layer <<= 1;
        }
        if (postDraw != null) {
            if (postDraw === true) {
                // TODO
            } else if (postDraw !== false) {
                postDraw();
            }
        }
        ctx.restore();
    }
}
