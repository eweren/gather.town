import { Aseprite } from "../../engine/assets/Aseprite";
import { asset } from "../../engine/assets/Assets";
import { AsepriteNode } from "../../engine/scene/AsepriteNode";
import { SceneNodeArgs } from "../../engine/scene/SceneNode";
import { Hyperloop } from "../Hyperloop";

export class FocusNode extends AsepriteNode<Hyperloop> {
    @asset("sprites/empty.aseprite.json")
    private static readonly noSprite: Aseprite;

    public readonly presentationBoard?: number;
    public constructor(args?: SceneNodeArgs) {
        super({aseprite: FocusNode.noSprite, ...args});
        this.presentationBoard = args?.tiledObject?.getOptionalProperty("presentationboard")?.getValue() as number;
    }
}
