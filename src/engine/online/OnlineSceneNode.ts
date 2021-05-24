import { Game } from "../Game";
import { AsepriteNode, AsepriteNodeArgs } from "../scene/AsepriteNode";
import { ActionEvent, OnlineService } from "../online/OnlineService";
import { Vector2 } from "../graphics/Vector2";

/**
 * Scene node that extends an Ase
 */
export abstract class OnlineSceneNode<T extends Game = Game> extends AsepriteNode<T> {
    protected readonly onlineService = new OnlineService();
    protected readonly isPlayer: boolean;
    private lastSubmittedState: any = {};
    private keysOfPropertiesToSync: Array<string> = [];
    private updateFilter = (ev: any): boolean => ev.id === this.getIdentifier() && this.getIdentifier() !== this.onlineService.username;

    public constructor({ ...args }: AsepriteNodeArgs & { keysOfPropertiesToSync: Array<string>, isPlayer?: boolean }) {
        super(args);
        this.isPlayer = !!args.isPlayer;
        this.keysOfPropertiesToSync = args.keysOfPropertiesToSync;
        this.onlineService.onCharacterUpdate.filter(this.updateFilter).connect(this.handleCharacterUpdate.bind(this));
        this.onlineService.onCharacterAction.filter(this.updateFilter).connect(this.handleCharacterAction.bind(this));
    }

    public update(dt: number, time: number): void {
        super.update(dt, time);
        this.syncCharacterState();
    }

    /**
     * Checks if there are updates in this nodes data and emits the new data if changes have been found.
     * @param forceFullSync - if set to true all keys that should be hold in sync will be synced.
     */
    public syncCharacterState(forceFullSync = false): void {
        if (!this.isPlayer) {
            return;
        }

        const currentState: Record<string, any> = {id: this.getIdentifier()};

        this.keysOfPropertiesToSync.forEach(property => {
            if ((this as any)[property] != null) {
                if ((this as any)[property] instanceof Vector2 && (this as any)[property].getX) {
                    currentState[property] =
                        new Vector2((this as any)[property].getX(), (this as any)[property].getY());
                } else {
                    currentState[property] = (this as any)[property];
                }
            }
        });


        if (forceFullSync) {
            this.onlineService.emitCharacterUpdate(currentState);
            return;
        }

        const updateObj = {id: this.getIdentifier()};
        for (const property in currentState) {
            if ((currentState as any)[property] !== this.lastSubmittedState[property]) {
                if ((currentState as any)[property] instanceof Vector2 || property === "velocity") {
                    const { x, y } = (currentState as any)[property];
                    if (!this.lastSubmittedState[property] || x !== this.lastSubmittedState[property].x
                        || y !== this.lastSubmittedState[property].y) {
                        (updateObj as any)[property] = (currentState as any)[property];
                        if (property === "velocity") {
                            this.lastSubmittedState[property] = (currentState as any)[property];
                        } else {
                            this.lastSubmittedState[property] = ((currentState as any)[property] as Vector2).clone();
                        }
                    }
                } else {
                    (updateObj as any)[property] = (currentState as any)[property];
                    this.lastSubmittedState[property] = (currentState as any)[property];
                }
            }
        }
        // TODO: Only update if it is in anybodies view.
        if (Object.entries(updateObj).length > 1) {
            this.onlineService.emitCharacterUpdate(updateObj);
        }
    }

    /**
     * Emits an event to the server so that other clients can react to those changes.
     * @param type - the name of the function to be called on other clients side.
     * @param args - the args to give to the function.
     */
    public emitEvent(type: string, args?: any): void {
        if (!(this as any).username || (this as any).username === this.onlineService.username) {
            this.onlineService.emitCharacterEvent({ id: this.getIdentifier(), type, args });
        }
    }

    /**
     * Takes the update from the socket and updates the related properties of this node.
     * @param updateObj - The update to be handled.
     */
    public handleCharacterUpdate(updateObj: any): void {
        if (this.getIdentifier() === this.onlineService.username) {
            return;
        }
        Object.keys(updateObj).forEach(key => {
            if (typeof (this as any)[key] !== "undefined" && typeof (this as any)[key] !== undefined) {
                if (key === "position") {
                    this.setX(updateObj.position.x);
                    this.setY(updateObj.position.y);
                } else if (key !== "username") {
                    (this as any)[key] = updateObj[key];
                }
            }
        });

    }

    public handleCharacterAction(event: ActionEvent): void {
        if (typeof event.type === "string" && event.type !== "" && typeof (this as any)[event.type] === "function") {
            (this as any)[event.type](event.args);
        }
    }
}
