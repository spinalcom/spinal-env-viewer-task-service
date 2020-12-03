import { Model } from "spinal-core-connectorjs_type";
import { EventInterface } from "../types/EventInterface";
export declare class SpinalEventService {
    static createEventContext(name: string, steps: Array<{
        name: string;
        order: any;
        color: any;
    }>): Promise<typeof Model>;
    static getEventContexts(): Promise<Array<typeof Model>>;
    static getEventsCategories(nodeId: string): Promise<Array<typeof Model>>;
    static createEventCategory(contextId: string, name: string, icon: string): Promise<typeof Model>;
    static createEventGroup(contextId: string, catgoryId: string, name: string, color: string): Promise<typeof Model>;
    static getEventsGroups(nodeId: string): Promise<Array<typeof Model>>;
    static getFirstStep(nodeId: string): Promise<typeof Model>;
    static createEventBetween(begin: string, end: string, periodicity: number, contextId: string, groupId: any, nodeId: string, eventInfo: EventInterface, userInfo: any): Promise<Array<typeof Model>>;
    static createEvent(contextId: string, groupId: any, nodeId: string, eventInfo: EventInterface, userInfo: any): Promise<typeof Model | Array<typeof Model>>;
    static getEvents(nodeId: string): Promise<any>;
    static updateEvent(eventId: string, newEventInfo: EventInterface): Promise<any | Array<typeof Model>>;
    static removeEvent(eventId: string): Promise<any>;
    private static _updateEventInformation;
    private static _getSteps;
    private static _createGroupNode;
    private static _getDateInterval;
    private static createEventNode;
    private static createAttribute;
}
