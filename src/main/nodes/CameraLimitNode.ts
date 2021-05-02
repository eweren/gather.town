import { Rect } from "../../engine/geom/Rect";
import { SceneNode } from "../../engine/scene/SceneNode";
import { Gather } from "../Gather";

export class CameraLimitNode extends SceneNode<Gather> {
    public update(): void {
        const scene = this.getScene();
        if (scene != null) {
            const player = scene.getNodeById("Player");
            if (player != null && player === scene.camera.getFollow()) {
                if (this.collidesWithNode(player)) {
                    scene.camera.setLimits(new Rect(this.x, this.y, this.width, this.height));
                }
            }
        }
    }
}
