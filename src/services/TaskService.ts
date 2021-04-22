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
import { SpinalGraphService, SPINAL_RELATION_PTR_LST_TYPE } from "spinal-env-viewer-graph-service";
import { groupManagerService } from "spinal-env-viewer-plugin-group-manager-service";
import { SpinalEvent } from '../models/SpinalEvent';
import { DEFAULT_CATEGORY_NAME, DEFAULT_CONTEXT_NAME, DEFAULT_GROUP_NAME, EVENT_TYPE, RELATION_NAME } from "../types/constants";
import { EventInterface, invers_period } from "../types/EventInterface";
import { serviceDocumentation } from "spinal-env-viewer-plugin-documentation-service";

import * as moment from 'moment';

export class SpinalEventService {

    ///////////////////////////////////////////////////////////////////////
    //                          CONTEXTS                                 //
    ///////////////////////////////////////////////////////////////////////
    public static createEventContext(name: string, steps: Array<{ name: string, order, color }>): Promise<typeof Model> {
        return groupManagerService.createGroupContext(name, SpinalEvent.EVENT_TYPE).then((context) => {
            context.info.add_attr({ steps: new Ptr(new Lst(steps)) });
            return SpinalGraphService.getInfo(context.getId().get());
        })
    }

    public static getEventContexts(): Promise<Array<typeof Model>> {
        return groupManagerService.getGroupContexts(SpinalEvent.EVENT_TYPE).then((contexts) => {
            return contexts.map(el => SpinalGraphService.getInfo(el.id));
        })
    }

    ///////////////////////////////////////////////////////////////////////
    //                          CATEGORIES                               //
    ///////////////////////////////////////////////////////////////////////

    public static getEventsCategories(nodeId: string): Promise<Array<typeof Model>> {
        return groupManagerService.getCategories(nodeId);
    }

    public static createEventCategory(contextId: string, name: string, icon: string): Promise<typeof Model> {
        return groupManagerService.addCategory(contextId, name, icon).then(async (node) => {
            (<any>SpinalGraphService)._addNode(node);
            const id = node.getId().get();
            const steps: any = await this._getSteps(id);

            const promises = steps.map(el => this._createGroupNode(contextId, id, el.name, el.color, el.order));

            return Promise.all(promises).then(() => node.info);
        })
    }



    ///////////////////////////////////////////////////////////////////////
    //                             STEPS                                 //
    ///////////////////////////////////////////////////////////////////////

    public static createEventGroup(contextId: string, catgoryId: string, name: string, color: string): Promise<typeof Model> {
        return groupManagerService.addGroup(contextId, catgoryId, name, color).then((node) => {
            return node.info;
        })
    }

    public static getEventsGroups(nodeId: string): Promise<Array<typeof Model>> {
        return groupManagerService.getGroups(nodeId);
    }

    public static getFirstStep(nodeId: string): Promise<typeof Model> {
        return this.getEventsGroups(nodeId).then((steps) => {
            return steps.find((el: any) => el.order.get() === 0);
        })
    }

    ///////////////////////////////////////////////////////////////////////
    //                             Events                                 //
    ///////////////////////////////////////////////////////////////////////

    public static createEventBetween(begin: string, end: string, periodicity: number, contextId: string, groupId, nodeId: string, eventInfo: EventInterface, userInfo: any): Promise<Array<typeof Model>> {
        const dates = this._getDateInterval(begin, end, periodicity);
        const reference = Date.now()
        const diff = moment(eventInfo.endDate).diff(moment(eventInfo.startDate)).valueOf();

        const promises = dates.map(el => {
            const temp_obj = { ...eventInfo, startDate: moment(el).format('LLLL'), endDate: moment(el).add(diff, "milliseconds").format('LLLL'), reference };
            return this.createEventNode(contextId, groupId, nodeId, temp_obj, userInfo);
        })

        return Promise.all(promises);
    }

    public static createEvent(contextId: string, groupId, nodeId: string, eventInfo: EventInterface, userInfo: any): Promise<typeof Model | Array<typeof Model>> {
        if (eventInfo.repeat) {
            const periodicity = eventInfo.periodicity.count * eventInfo.periodicity.period;
            return this.createEventBetween(eventInfo.startDate, eventInfo.repeatEnd, periodicity, contextId, groupId, nodeId, eventInfo, userInfo);
        } else {
            return this.createEventNode(contextId, groupId, nodeId, eventInfo, userInfo);
        }
    }

    public static async getEvents(nodeId: string, start?: Date, end?: Date): Promise<any> {
        const children = await SpinalGraphService.getChildren(nodeId, [RELATION_NAME]);
        if (start && end) {
            return children.filter(event => {
                const date = moment(event.startDate.get(), "x");
                return date.isSameOrAfter(start.getTime()) && date.isSameOrBefore(end.getTime());
            })

        } else if (start && !end) {
            return children.filter(event => {
                const date = moment(event.startDate.get(), "x");
                return date.isSameOrAfter(start.getTime());
            })
        } else if (!start && end) {
            return children.filter(event => {
                const date = moment(event.startDate.get(), "x");
                return date.isSameOrBefore(end.getTime());
            })
        } else {
            return children;
        }
    }

    public static async updateEvent(eventId: string, newEventInfo: EventInterface): Promise<any | Array<typeof Model>> {

        this._updateEventInformation(eventId, newEventInfo);

        // if (newEventInfo.repeat) {
        //     let info = SpinalGraphService.getInfo(eventId).get();
        //     const periodicity = newEventInfo.periodicity.count * newEventInfo.periodicity.period;
        //     const begin = newEventInfo.startDate + periodicity;
        //     const end = newEventInfo.endDate;

        //     info = { ...newEventInfo, contextId: info.contextId, groupId: info.groupId, nodeId: info.nodeId, user: info.user }

        //     return this.createTaskBetween(begin, end, periodicity, info.contextId, info.groupId, info.nodeId, newEventInfo, info.userInfo)
        // }

        return SpinalGraphService.getInfo(eventId);
    }

    public static async removeEvent(eventId: string): Promise<any> {

        const info = SpinalGraphService.getInfo(eventId).get();

        return groupManagerService.unLinkElementToGroup(info.groupId, eventId).then((result) => {
            // console.log(result);

            const node = SpinalGraphService.getRealNode(eventId);

            return SpinalGraphService.removeChild(info.nodeId, eventId, RELATION_NAME, SPINAL_RELATION_PTR_LST_TYPE);
        })
    }

    public static async createOrgetDefaultTreeStructure(): Promise<{ context: typeof Model; category: typeof Model; group: typeof Model; }> {
        const context = await groupManagerService.createGroupContext(DEFAULT_CONTEXT_NAME, SpinalEvent.EVENT_TYPE)
        const contextId = context.getId().get();
        const category = await this.createEventCategory(contextId, DEFAULT_CATEGORY_NAME, "");
        const group = await this.createEventGroup(contextId, (<any>category).id.get(), DEFAULT_GROUP_NAME, "#fff000");
        return {
            context: <any>SpinalGraphService.getInfo(contextId),
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

    private static async _updateEventInformation(eventId: string, newEventInfo: EventInterface) {
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

    private static async _getSteps(contextId: string) {
        const info = SpinalGraphService.getInfo(contextId);
        if (!info.steps) return [];

        return new Promise((resolve) => {
            info.steps.load((data) => {
                resolve(data.get());
            })
        });
    }

    private static _createGroupNode(contextId: string, categoryId: string, name: string, color: string, order: number) {
        return groupManagerService.addGroup(contextId, categoryId, name, color);
    }

    private static _getDateInterval(begin: string, end: string, interval: number): Array<number> {
        const dates = [];

        let tempBegin = moment(begin);
        let tempEnd = moment(end);

        while (tempEnd.diff(tempBegin) >= 0) {
            dates.push(tempBegin.valueOf());

            tempBegin = tempBegin.add(interval, 'ms');
        }

        return dates;
    }

    private static createEventNode(contextId: string, groupId, nodeId: string, eventInfo: EventInterface, userInfo: any) {
        if (!eventInfo.repeat) {
            delete eventInfo.periodicity;
            delete eventInfo.repeatEnd;
        }

        if (eventInfo.startDate) { eventInfo.startDate = moment(eventInfo.startDate).format("LLLL"); }
        if (eventInfo.endDate) { eventInfo.endDate = moment(eventInfo.endDate).format("LLLL"); }
        if (eventInfo.creationDate) { eventInfo.creationDate = moment(eventInfo.creationDate).format("LLLL"); }
        if (eventInfo.repeatEnd) { eventInfo.repeatEnd = moment(eventInfo.repeatEnd).format("LLLL"); }


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

    private static createAttribute(nodeId: string): any {
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
}