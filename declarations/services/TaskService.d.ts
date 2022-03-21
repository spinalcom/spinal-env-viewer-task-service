import { SpinalGraph, SpinalNodeRef } from "spinal-env-viewer-graph-service";
import { EventInterface } from "../types/EventInterface";
export declare class SpinalEventService {
    static createEventContext(name: string, steps?: Array<{
        name: string;
        order: any;
        color: any;
    }>): Promise<SpinalNodeRef>;
    static getEventContexts(graph?: SpinalGraph<any>): Promise<SpinalNodeRef[]>;
    static getEventsCategories(nodeId: string): Promise<SpinalNodeRef[]>;
    static createEventCategory(contextId: string, name: string, icon: string): Promise<SpinalNodeRef>;
    static createEventGroup(contextId: string, catgoryId: string, name: string, color: string): Promise<SpinalNodeRef>;
    static getEventsGroups(nodeId: string): Promise<SpinalNodeRef[]>;
    static getFirstStep(nodeId: string): Promise<SpinalNodeRef>;
    static createEventBetween(begin: string, end: string, periodicity: number, contextId: string, groupId: any, nodeId: string, eventInfo: EventInterface, userInfo: any): Promise<SpinalNodeRef[]>;
    static createEvent(contextId: string, groupId: any, nodeId: string, eventInfo: EventInterface, userInfo: any): Promise<SpinalNodeRef | SpinalNodeRef[]>;
    static getEvents(nodeId: string, start?: Date, end?: Date): Promise<SpinalNodeRef[]>;
    static updateEvent(eventId: string, newEventInfo: EventInterface): Promise<SpinalNodeRef>;
    static removeEvent(eventId: string): Promise<boolean>;
    static createOrgetDefaultTreeStructure(graph?: SpinalGraph<any>): Promise<{
        context: SpinalNodeRef;
        category: SpinalNodeRef;
        group: SpinalNodeRef;
    }>;
    private static _updateEventInformation;
    private static _getSteps;
    private static _createGroupNode;
    private static _getDateInterval;
    private static createEventNode;
    private static createAttribute;
    private static _getGroupId;
    private static _getNodeId;
}
