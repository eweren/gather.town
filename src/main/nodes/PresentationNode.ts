import { Aseprite } from "../../engine/assets/Aseprite";
import { Direction } from "../../engine/geom/Direction";
import { InteractiveNode } from "./InteractiveNode";
import { SceneNodeArgs } from "../../engine/scene/SceneNode";
import { asset } from "../../engine/assets/Assets";
import { ControllerFamily } from "../../engine/input/ControllerFamily";
import { PreCharacterTags } from "./CharacterNode";
import { Gather } from "../Gather";
import { PresentationBoardNode } from "./PresentationBoardNode";
import { ControllerEvent } from "../../engine/input/ControllerEvent";

export interface PresentationNodeArgs extends SceneNodeArgs {
    onUpdate?: (state: boolean) => boolean | undefined;
}

export class PresentationNode extends InteractiveNode {
    @asset("sprites/empty.aseprite.json")
    private static readonly noSprite: Aseprite;
    private readonly presentationBoardId?: number;

    private presents: boolean = false;
    private presentationBoard?: PresentationBoardNode;

    public constructor({ onUpdate, ...args }: PresentationNodeArgs) {
        super({
            aseprite: PresentationNode.noSprite,
            anchor: Direction.CENTER,
            tag: "off",
            ...args
        }, "PRESS E TO PRESENT");
        this.presentationBoardId = args.tiledObject?.getOptionalProperty("forPresentationboard", "int")?.getValue();
    }


    protected getRange(): number {
        return 10;
    }

    public update(dt: number, time: number): void {
        this.caption = this.presents ? "" : `PRESS ${this.getGame().input.currentControllerFamily === ControllerFamily.GAMEPAD ? "Y" : "E"} TO PRESENT`;
        super.update(dt, time);
    }

    public interact(): void {
        if (this.canInteract()) {
            const player = this.getPlayer();
            player?.setX(this.x);
            player?.setY(this.y);
            player?.setPreTag(PreCharacterTags.FRONT);
            this.presentationBoard = this.getScene()?.rootNode.getDescendantsByType<PresentationBoardNode>(PresentationBoardNode).find(n => n.boardId === this.presentationBoardId);
            if (this.presentationBoard) {
                this.getGame().sendCommand("presentationUpdate", { presentationBoardId: this.presentationBoard.boardId, slide: this.presentationBoard.slideIndex });
                this.presents = true;
                const input = this.getScene()!.game.input;
                input.onButtonDown.connect(this.handleButtonPress, this);
                this.getScene()?.camera.focus(this.presentationBoard).then((successful) => {
                    if (successful) {
                        this.presentationBoard?.startPresentation(0, true);
                        if (player != null) {
                            player.startPresentation();
                        }
                        (this.getGame() as Gather).dimLights();
                    }
                });
            }
        }
    }

    private handleButtonPress(ev: ControllerEvent): void {
        if (ev.isPlayerMoveRight) {
            this.nextSlide();
        } else if (ev.isPlayerMoveLeft) {
            this.previousSlide();
        } else if (ev.isAbort) {
            const input = this.getScene()!.game.input;
            input.onButtonDown.disconnect(this.handleButtonPress, this);
            this.leavePresentation();
        }
    }

    private leavePresentation(): void {
        this.presents = false;
        this.presentationBoard?.endPresentation();
        const player = this.getPlayer();
        if (this.presentationBoard) {
            this.getGame().sendCommand("presentationUpdate", { presentationBoardId: this.presentationBoard.boardId, slide: -1 });
        }
        if (player != null) {
            player.endPresentation();
            this.getScene()?.camera.focus(player, { follow: true });
        }
        (this.getGame() as Gather).turnOnAllLights();
    }

    private nextSlide(): void {
        this.presentationBoard?.nextSlide();
    }

    private previousSlide(): void {
        this.presentationBoard?.previousSlide();
    }
}
