import { asset } from "../../engine/assets/Assets";
import { BitmapFont } from "../../engine/assets/BitmapFont";
import { TextNode } from "../../engine/scene/TextNode";
import { TiledSceneArgs } from "../../engine/scene/TiledMapNode";
import { clamp } from "../../engine/util/math";
import { HEADLINE_FONT, STANDARD_FONT } from "../constants";
import { Gather } from "../Gather";


export class TiledTextNode extends TextNode<Gather> {

    @asset([
        HEADLINE_FONT,
        STANDARD_FONT
    ])
    private static fonts: Array<BitmapFont>;

    public constructor(args?: TiledSceneArgs) {
        const text = args?.tiledObject?.getOptionalProperty("text", "string")?.getValue() ?? "";
        const outlineColor = args?.tiledObject?.getOptionalProperty("outlined", "string")?.getValue() ?? undefined;
        const fontIndex = clamp(args?.tiledObject?.getOptionalProperty("font", "int")?.getValue() ?? 0, 0, TiledTextNode.fonts.length);

        super({ ...args, font: TiledTextNode.fonts[fontIndex], outlineColor, text});
    }
}
