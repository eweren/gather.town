import { asset } from "../../engine/assets/Assets";
import { Direction } from "../../engine/geom/Direction";
import { ScenePointerDownEvent } from "../../engine/scene/events/ScenePointerDownEvent";
import { ScenePointerMoveEvent } from "../../engine/scene/events/ScenePointerMoveEvent";
import { ImageNode } from "../../engine/scene/ImageNode";
import { SceneNode, SceneNodeArgs } from "../../engine/scene/SceneNode";
import { TextNode } from "../../engine/scene/TextNode";
import { Layer } from "../constants";
import { Gather } from "../Gather";

export class JitsiControlsNode extends SceneNode<Gather> {

    @asset("images/screenshare.png")
    public static ScreenShareImage: HTMLImageElement;

    @asset("images/settings.png")
    public static SettingsImage: HTMLImageElement;

    private shareScreenNode = new ImageNode<Gather>({ image: JitsiControlsNode.ScreenShareImage, anchor: Direction.LEFT, x: 0 });
    private settingsNode = new ImageNode<Gather>({ image: JitsiControlsNode.SettingsImage, anchor: Direction.LEFT, x: JitsiControlsNode.SettingsImage.width + 4 });
    private previousCursor?: string;
    private options: SceneNode<Gather> = new SceneNode<Gather>({childAnchor: Direction.CENTER});

    public constructor(args?: SceneNodeArgs) {
        super({ anchor: Direction.BOTTOM, childAnchor: Direction.LEFT, layer: Layer.HUD, backgroundColor: "#666a", padding: 4,  ...args });
    }

    public update(dt: number, time: number): void {
        super.update(dt, time);
        if (this.isHoverOver && this.getGame().canvas.style.cursor !== "pointer") {
            this.previousCursor = this.getGame().canvas.style.cursor;
            this.getGame().canvas.style.cursor = "pointer";
        } else if (this.previousCursor != null && !this.isHoverOver) {
            this.getGame().canvas.style.cursor = this.previousCursor;
            this.previousCursor = undefined;
        }
    }

    protected handlePointerDown(event: ScenePointerDownEvent<Gather>): void {
        let { x, y } = event.getScreenPosition();
        if (this.containsPoint(x, y) && event.getButton() === 0) {
            x -= this.getLeft();
            y -= this.getTop() + this.height / 2;
            if (this.shareScreenNode.containsPoint(x, y)) {
                this.getGame().JitsiInstance?.switchVideo();
            } else if (this.settingsNode.containsPoint(x, y)) {
                if (this.options.isInScene()) {
                    console.log("clear");
                    this.clearOptions();
                } else {
                    this.showSoundControls();
                }
            }
            super.handlePointerDown(event);
        }
    }

    private showSoundControls(): void {
        const micDeviceId = localStorage.getItem("gatherDefaultAudioSrc") ?? undefined;
        const cameraDeviceId = localStorage.getItem("gatherDefaultVideoSrc") ?? undefined;
        const audioOutputDevice = localStorage.getItem("gatherDefaultAudioOutput") ?? undefined;
        this.getGame().JitsiInstance?.JitsiMeetJS.mediaDevices.enumerateDevices(devices => {
            let lastCategory = devices[0].kind;
            let offset = 0;
            devices.forEach((device, index) => {
                if (lastCategory !== device.kind) {
                    const header = new TextNode<Gather>({ font: Gather.standardFont, anchor: Direction.LEFT, text: lastCategory.toLocaleUpperCase(), y: -20 - offset - 2 - index * 10 });
                    this.options.appendChild(header);
                    lastCategory = device.kind;
                    offset += Gather.standardFont.charHeight * 1.5;
                }
                const node = new TextNode<Gather>({
                    font: Gather.standardFont, anchor: Direction.LEFT, text: device.label, color: (micDeviceId === device.deviceId && device.kind === "audioinput" || cameraDeviceId === device.deviceId  && device.kind === "videoinput" || audioOutputDevice === device.deviceId  && device.kind === "audiooutput" ? "white" : "lightgrey"), x: 0, y: -20 - offset - index * 10
                });
                node.onClick = (event) => {
                    const pos1 = node.getScenePosition();
                    const pos2 = event.getScreenPosition();
                    if (pos1.x < pos2.x && pos1.x + node.width > pos2.x && pos1.y - node.height / 2 < pos2.y && pos1.y + node.height / 2 > pos2.y) {
                        if (device.kind === "audiooutput") {
                            this.getGame().JitsiInstance?.changeAudioOutput(device.deviceId);
                        } else if (device.kind === "audioinput") {
                            this.getGame().JitsiInstance?.changeAudioInput(device.deviceId);
                        } else if (device.kind === "videoinput") {
                            this.getGame().JitsiInstance?.changeVideoInput(device.deviceId);
                        }
                        this.clearOptions();
                    }
                };
                this.options.appendChild(node);
            });
            const header = new TextNode<Gather>({ font: Gather.standardFont, anchor: Direction.LEFT, text: lastCategory.toLocaleUpperCase(), y: -20 - offset - 2 - devices.length * 10 });
            this.options.appendChild(header);
            this.appendChild(this.options);
            this.options.moveTo(-(this.options.getChildren().sort((c1, c2) => c2.getWidth() - c1.getWidth()).shift()?.getWidth() ?? 0) / 2 + this.width / 2, 0);
        });
    }

    private clearOptions(): void {
        this.options.remove();
    }

    protected handlePointerMove(event: ScenePointerMoveEvent<Gather>): void {
        const { x, y } = event.getScreenPosition();
        const isHoverOver = this.containsPoint(x, y);
        if (this.isHoverOver !== isHoverOver) {
            this.onHoverOverChange.emit(isHoverOver);
            this.isHoverOver = isHoverOver;
        }
    }

    public activate(): void {
        this.appendChild(this.shareScreenNode);
        this.appendChild(this.settingsNode);
        const width = this.settingsNode.width + 4 + this.shareScreenNode.width;
        this.resizeTo(width, this.shareScreenNode.height);
        super.activate();
    }

}
