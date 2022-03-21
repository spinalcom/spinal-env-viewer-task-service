import { Model } from "spinal-core-connectorjs_type";
import { EventInterface } from "../types/EventInterface";
export declare class SpinalEvent extends Model {
    static EVENT_TYPE: string;
    constructor(task: EventInterface);
}
