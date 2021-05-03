import { Aseprite } from "../../engine/assets/Aseprite";
import { Direction } from "../../engine/geom/Direction";
import { InteractiveNode } from "./InteractiveNode";
import { SceneNodeArgs } from "../../engine/scene/SceneNode";
import { asset } from "../../engine/assets/Assets";
import { ControllerFamily } from "../../engine/input/ControllerFamily";
import { PreCharacterTags } from "./CharacterNode";
import { Gather } from "../Gather";
import { PresentationBoardTags, PresentationBoardNode } from "./PresentationBoardNode";

export interface PresentationNodeArgs extends SceneNodeArgs {
    onUpdate?: (state: boolean) => boolean | undefined;
}

export class PresentationNode extends InteractiveNode {
    @asset("sprites/empty.aseprite.json")
    private static readonly noSprite: Aseprite;
    private readonly presentationBoard?: number;

    private presents: boolean = false;
    public constructor({ onUpdate, ...args }: PresentationNodeArgs) {
        super({
            aseprite: PresentationNode.noSprite,
            anchor: Direction.CENTER,
            tag: "off",
            ...args
        }, "PRESS E TO PRESENT");
        this.presentationBoard = args.tiledObject?.getOptionalProperty("forPresentationboard", "int")?.getValue();
    }


    protected getRange(): number {
        return 10;
    }

    public update(dt: number, time: number): void {
        this.caption = this.playerSitsDown() ? "" :  `PRESS ${this.getGame().input.currentControllerFamily === ControllerFamily.GAMEPAD ? "Y" : "E"} TO PRESENT`;
        super.update(dt, time);
    }

    private playerSitsDown(): boolean {
        const isSitting = this.presents ? this.getPlayer()?.getPosition().getDistance(this.getPosition()) === 0 : false;
        if (isSitting !== this.presents && !isSitting) {
            this.presents = false;
            const presentationBoard = this.getScene()?.rootNode.getDescendantsByType(PresentationBoardNode).find(n => n.boardId === this.presentationBoard);
            if (presentationBoard != null) {
                presentationBoard.setTag(PresentationBoardTags.ROLL_IN);
            }
            this.getScene()?.camera.focus(this.getPlayer()!, {follow: true});
            (this.getGame() as Gather).turnOnAllLights();

        }
        return isSitting;
    }

    public interact(): void {
        if (this.canInteract()) {
            this.getPlayer()?.setX(this.x);
            this.getPlayer()?.setY(this.y);
            this.getPlayer()?.setPreTag(PreCharacterTags.FRONT);
            this.presents = true;
            const presentationBoard = this.getScene()?.rootNode.getDescendantsByType(PresentationBoardNode).find(n => n.boardId === this.presentationBoard);
            if (presentationBoard) {
                this.getScene()?.camera.focus(presentationBoard).then((successful) => {
                    if (successful) {
                        if (presentationBoard.getTag() !== PresentationBoardTags.OUT)
                        presentationBoard.setTag(PresentationBoardTags.ROLL_OUT);
                        (this.getGame() as Gather).dimLights();
                    }
                });
            }
        }
    }
}
