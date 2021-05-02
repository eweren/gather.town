import { SceneNode } from "../engine/scene/SceneNode";
import { PlayerNode } from "./nodes/PlayerNode";

export class DoorHandler {
    private static theInstance: DoorHandler = new DoorHandler();

    private lastUsage: number = 0;
    // Delay between two door activations, in seconds
    private usageDelay: number = 4;

    private constructor() {
    }

    public transportToDoor(player: PlayerNode, door: SceneNode, currentTime: number): boolean {
        if (this.isReady(currentTime)) {
            this.lastUsage = currentTime;
            this.performTeleportation(player, door);
            return true;
        }
        return false;
    }

    private performTeleportation(player: PlayerNode, door: SceneNode) {
        // TODO fade out/in music as well
        // Fade out
        const scene = player.getScene();
        const camera = scene?.camera;
        camera?.fadeToBlack.fadeOut({ duration: 0.8 }).then(() => {
            // Teleport
            player.setX(door.getX());
            player.setY(door.getY());
        });
        // Fade in
        setTimeout(() => {
            camera?.fadeToBlack.fadeIn({ duration: 0.8 });
        }, 1200);
    }

    public isReady(currentTime: number): boolean {
        return currentTime - this.lastUsage > this.usageDelay;
    }

    public static getInstance() {
        return DoorHandler.theInstance;
    }
}
