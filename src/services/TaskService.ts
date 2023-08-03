/*
 * Copyright 2020 SpinalCom - www.spinalcom.com
 * 
 * This file is part of SpinalCore.
 * 
 * Please read all of the following terms and conditions
 * of the Free Software license Agreement ("Agreement")
 * carefully.
 * 
 * This Agreement is a legally binding contract between
 * the Licensee (as defined below) and SpinalCom that
 * sets forth the terms and conditions that govern your
 * use of the Program. By installing and/or using the
 * Program, you agree to abide by all the terms and
 * conditions stated or referenced herein.
 * 
 * If you do not agree to abide by these terms and
 * conditions, do not demonstrate your acceptance and do
 * not install or use the Program.
 * You should have received a copy of the license along
 * with this file. If not, see
 * <http://resources.spinalcom.com/licenses.pdf>.
 */


import { Ptr, Lst, Model } from "spinal-core-connectorjs_type";
import { SpinalGraph, SpinalGraphService, SpinalNode, SpinalNodeRef, SPINAL_RELATION_PTR_LST_TYPE } from "spinal-env-viewer-graph-service";
import { groupManagerService } from "spinal-env-viewer-plugin-group-manager-service";
import { SpinalEvent } from '../models/SpinalEvent';
import { DEFAULT_CATEGORY_NAME, DEFAULT_CONTEXT_NAME, DEFAULT_GROUP_NAME, EVENT_TYPE, RELATION_NAME } from "../types/constants";
import { EventInterface, invers_period } from "../types/EventInterface";
import { serviceDocumentation } from "spinal-env-viewer-plugin-documentation-service";

import * as moment from 'moment';
import { SpinalAttribute } from "spinal-model-timeseries";

export class SpinalEventService {

    ///////////////////////////////////////////////////////////////////////
    //                          CONTEXTS                                 //
    ///////////////////////////////////////////////////////////////////////
    public static createEventContext(name: string, steps?: Array<{ name: string, order, color }>, graph?: SpinalGraph): Promise<SpinalNodeRef> {
        steps = steps || [];
        return groupManagerService.createGroupContext(name, SpinalEvent.EVENT_TYPE, graph).then((context) => {
            context.info.add_attr({ steps: new Ptr(new Lst(steps)) });
            return SpinalGraphService.getInfo(context.getId().get());
        })
    }

    public static getEventContexts(graph?: SpinalGraph<any>): Promise<SpinalNodeRef[]> {
        return groupManagerService.getGroupContexts(SpinalEvent.EVENT_TYPE, graph).then((contexts) => {
            return contexts.map(el => SpinalGraphService.getInfo(el.id));
        })
    }

    ///////////////////////////////////////////////////////////////////////
    //                          CATEGORIES                               //
    ///////////////////////////////////////////////////////////////////////

    public static getEventsCategories(nodeId: string): Promise<SpinalNodeRef[]> {
        return groupManagerService.getCategories(nodeId);
    }

    public static createEventCategory(contextId: string, name: string, icon: string): Promise<SpinalNodeRef> {
        return groupManagerService.addCategory(contextId, name, icon).then(async (node) => {
            (<any>SpinalGraphService)._addNode(node);
            const id = node.getId().get();
            const steps: any = await this._getSteps(id);

            const promises = steps.map(el => this._createGroupNode(contextId, id, el.name, el.color, el.order));

            return Promise.all(promises).then(() => SpinalGraphService.getInfo(id));
        })
    }



    ///////////////////////////////////////////////////////////////////////
    //                             STEPS                                 //
    ///////////////////////////////////////////////////////////////////////

    public static createEventGroup(contextId: string, catgoryId: string, name: string, color: string): Promise<SpinalNodeRef> {
        return groupManagerService.addGroup(contextId, catgoryId, name, color).then((node) => {
            //@ts-ignore
            SpinalGraphService._addNode(node)
            return SpinalGraphService.getInfo(node.getId().get());
        })
    }

    public static getEventsGroups(nodeId: string): Promise<SpinalNodeRef[]> {
        return groupManagerService.getGroups(nodeId);
    }

    public static getFirstStep(nodeId: string): Promise<SpinalNodeRef> {
        return this.getEventsGroups(nodeId).then((steps) => {
            return steps.find((el: any) => el.order.get() === 0);
        })
    }

    ///////////////////////////////////////////////////////////////////////
    //                             Events                                 //
    ///////////////////////////////////////////////////////////////////////

    public static createEventBetween(begin: string, end: string, periodicity: number, contextId: string, groupId, nodeId: string, eventInfo: EventInterface, userInfo: any): Promise<SpinalNodeRef[]> {
        const dates = this._getDateInterval(begin, end, periodicity);
        const reference = Date.now()
        const isoEndDate = new Date(eventInfo.endDate).toISOString();
        const isoStartDate = new Date(eventInfo.startDate).toISOString();

        const diff = moment(isoEndDate).diff(moment(isoStartDate)).valueOf();

        const promises = dates.map(el => {
            const isoEl = new Date(el).toISOString();

            const temp_obj = { ...eventInfo, startDate: moment(isoEl).format('LLLL'), endDate: moment(isoEl).add(diff, "milliseconds").format('LLLL'), reference };
            return this.createEventNode(contextId, groupId, nodeId, temp_obj, userInfo);
        })

        return Promise.all(promises);
    }

    public static createEvent(contextId: string, groupId, nodeId: string, eventInfo: EventInterface, userInfo: any): Promise<SpinalNodeRef | SpinalNodeRef[]> {
        if (eventInfo.repeat) {
            const periodicity = eventInfo.periodicity.count * eventInfo.periodicity.period;
            return this.createEventBetween(eventInfo.startDate, eventInfo.repeatEnd, periodicity, contextId, groupId, nodeId, eventInfo, userInfo);
        } else {
            return this.createEventNode(contextId, groupId, nodeId, eventInfo, userInfo);
        }
    }

    public static async getEvents(nodeId: string, start?: Date, end?: Date): Promise<SpinalNodeRef[]> {
        const children = await SpinalGraphService.getChildren(nodeId, [RELATION_NAME]);

        if (start && end) {
            return children.filter(event => {
                const isoDate = new Date(event.startDate.get()).toISOString();
                const date = moment(isoDate);
                return date.isSameOrAfter(start.getTime()) && date.isSameOrBefore(end.getTime());
            })

        } else if (start && !end) {
            return children.filter(event => {
                const isoDate = new Date(event.startDate.get()).toISOString();
                const date = moment(isoDate);
                return date.isSameOrAfter(start.getTime());
            })
        } else if (!start && end) {
            return children.filter(event => {
                const isoDate = new Date(event.startDate.get()).toISOString();
                const date = moment(isoDate);
                return date.isSameOrBefore(end.getTime());
            })
        } else {
            return children;
        }
    }

    public static async updateEvent(eventId: string, newEventInfo: EventInterface): Promise<SpinalNodeRef> {

        this._updateEventInformation(eventId, newEventInfo);

        return SpinalGraphService.getInfo(eventId);
    }

    public static async removeEvent(eventId: string): Promise<boolean> {

        const groupInfo = await this._getGroupId(eventId);

        if (groupInfo) {
            return groupManagerService.unLinkElementToGroup(groupInfo.id.get(), eventId).then(async () => {

                const nodeInfo = await this._getNodeId(eventId);
                if (nodeInfo) return SpinalGraphService.removeChild(nodeInfo.id.get(), eventId, RELATION_NAME, SPINAL_RELATION_PTR_LST_TYPE);
            })
        }

    }

    public static async createOrgetDefaultTreeStructure(graph?: SpinalGraph<any>): Promise<{ context: SpinalNodeRef; category: SpinalNodeRef; group: SpinalNodeRef; }> {
        const context = await groupManagerService.createGroupContext(DEFAULT_CONTEXT_NAME, SpinalEvent.EVENT_TYPE, graph);
        const contextId = context.getId().get();
        const category = await this.createEventCategory(contextId, DEFAULT_CATEGORY_NAME, "");
        const group = await this.createEventGroup(contextId, (<any>category).id.get(), DEFAULT_GROUP_NAME, "#fff000");
        return {
            context: SpinalGraphService.getInfo(contextId),
            category,
            group
        }
    }

    ///////////////////////////////////////////////////////////////////////
    //                             LOGS                                  //
    ///////////////////////////////////////////////////////////////////////


    /////////////////////////////////////////////////////////////////////////
    //                              PRIVATES                               //
    /////////////////////////////////////////////////////////////////////////

    private static _updateEventInformation(eventId: string, newEventInfo: EventInterface) {
        const event = SpinalGraphService.getRealNode(eventId);
        if (typeof event === "undefined") return;

        for (const key in newEventInfo) {
            if (Object.prototype.hasOwnProperty.call(newEventInfo, key)) {
                if (event.info[key]) {
                    event.info.mod_attr(key, newEventInfo[key]);
                } else {
                    event.info.add_attr({ [key]: newEventInfo[key] });
                }
            }
        }


    }

    private static _getSteps(contextId: string): Promise<{ name: string; order: number; color: string }[]> {
        return new Promise((resolve) => {
            const info = SpinalGraphService.getInfo(contextId);
            if (!info.steps) return resolve([]);
            info.steps.load((data) => {
                resolve(data.get());
            })
        });
    }

    private static _createGroupNode(contextId: string, categoryId: string, name: string, color: string, order?: number): Promise<SpinalNode<any>> {
        return groupManagerService.addGroup(contextId, categoryId, name, color);
    }

    private static _getDateInterval(begin: string, end: string, interval: number): number[] {
        const dates = [];

        const beginDate = new Date(begin).toISOString();
        const endDate = new Date(end).toISOString();

        let tempBegin = moment(beginDate);
        let tempEnd = moment(endDate);

        while (tempEnd.diff(tempBegin) >= 0) {
            dates.push(tempBegin.valueOf());

            tempBegin = tempBegin.add(interval, 'ms');
        }

        return dates;
    }

    private static createEventNode(contextId: string, groupId, nodeId: string, eventInfo: EventInterface, userInfo: any): Promise<SpinalNodeRef> {
        if (!eventInfo.repeat) {
            delete eventInfo.periodicity;
            delete eventInfo.repeatEnd;
        }

        if (eventInfo.startDate) {
            let date = new Date(eventInfo.startDate).toISOString();
            eventInfo.startDate = moment(date).format("LLLL");
        }
        if (eventInfo.endDate) {
            let date = new Date(eventInfo.endDate).toISOString();
            eventInfo.endDate = moment(date).format("LLLL");
        }
        if (eventInfo.creationDate) {
            let date = new Date(eventInfo.creationDate).toISOString();
            eventInfo.creationDate = moment(date).format("LLLL");
        }
        if (eventInfo.repeatEnd) {
            let date = new Date(eventInfo.repeatEnd).toISOString();
            eventInfo.repeatEnd = moment(date).format("LLLL");
        }

        eventInfo.contextId = contextId;
        eventInfo.groupId = groupId;
        eventInfo.nodeId = nodeId;
        eventInfo.type = SpinalEvent.EVENT_TYPE;
        eventInfo.user = userInfo;


        // const taskModel = new SpinalEvent(eventInfo);
        const eventId = SpinalGraphService.createNode(eventInfo, new Model());
        return groupManagerService.linkElementToGroup(contextId, groupId, eventId).then(async (result) => {
            await SpinalGraphService.addChild(nodeId, eventId, RELATION_NAME, SPINAL_RELATION_PTR_LST_TYPE);
            await this.createAttribute(eventId);

            return SpinalGraphService.getInfo(eventId);
        })
    }

    private static createAttribute(nodeId: string): Promise<SpinalAttribute[]> {
        const categoryName: string = "default";
        const realNode = SpinalGraphService.getRealNode(nodeId);
        return serviceDocumentation.addCategoryAttribute(realNode, categoryName).then((attributeCategory) => {
            const promises = []

            promises.push(serviceDocumentation.addAttributeByCategory(realNode, attributeCategory, "name", <any>realNode.info.name));
            const attributes = ["startDate", "endDate", "creationDate", "repeatEnd"];

            for (const key of attributes) {
                if (realNode.info[key]) {
                    // const date = moment(realNode.info[key].get()).format('LL')
                    promises.push(serviceDocumentation.addAttributeByCategory(realNode, attributeCategory, key, realNode.info[key]));
                }
            }

            if (realNode.info.periodicity) {
                const value = `${realNode.info.periodicity.count.get()} ${invers_period[realNode.info.periodicity.period.get()]}`
                promises.push(serviceDocumentation.addAttributeByCategory(realNode, attributeCategory, "periodicity", value));
            }

            return Promise.all(promises);
        })
    }

    private static async _getGroupId(eventId: string): Promise<SpinalNodeRef> {
        const info = SpinalGraphService.getInfo(eventId);
        let groupInfo = SpinalGraphService.getInfo(info.groupId);
        if (groupInfo) {
            return groupInfo;
        }

        const parents = await SpinalGraphService.getParents(eventId, [`groupHas${EVENT_TYPE}`]);
        return parents.find(el => el.id.get() === info.groupId.get());
    }

    private static async _getNodeId(eventId): Promise<SpinalNodeRef> {
        const info = SpinalGraphService.getInfo(eventId);
        let nodeInfo = SpinalGraphService.getInfo(info.nodeId);
        if (nodeInfo) {
            return nodeInfo;
        }

        const parents = await SpinalGraphService.getParents(eventId, [RELATION_NAME]);
        return parents.find(el => el.id.get() === info.nodeId.get());
    }
}