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
import { EVENT_TYPE, RELATION_NAME } from "../types/constants";
import { EventInterface } from "../types/EventInterface";

import * as moment from 'moment';

export class SpinalEventService {

    ///////////////////////////////////////////////////////////////////////
    //                          CONTEXTS                                 //
    ///////////////////////////////////////////////////////////////////////
    public static createEventContext(name: string, steps: Array<{ name: string, order, color }>): Promise<typeof Model> {
        return groupManagerService.createGroupContext(name, SpinalEvent.EVENT_TYPE).then((context) => {
            context.info.add_attr({ steps: new Ptr(new Lst(steps)) });
            return context.info;
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

    public static createEventBetween(begin: number, end: number, periodicity: number, contextId: string, groupId, nodeId: string, eventInfo: EventInterface, userInfo: any): Promise<Array<typeof Model>> {
        const dates = this._getDateInterval(begin, end, periodicity);

        const promises = dates.map(el => {
            const diff = moment(eventInfo.startDate).diff(moment(eventInfo.endDate));
            const temp_obj = { ...eventInfo, startDate: el, endDate: el + diff };
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

    public static getEvents(nodeId: string): Promise<any> {
        return SpinalGraphService.getChildren(nodeId, [RELATION_NAME]);
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
        return new Promise((resolve) => {
            info.steps.load((data) => {
                resolve(data.get());
            })
        });
    }

    private static _createGroupNode(contextId: string, categoryId: string, name: string, color: string, order: number) {
        return groupManagerService.addGroup(contextId, categoryId, name, color);
    }

    private static _getDateInterval(begin: number, end: number, interval: number): Array<number> {
        const dates = []

        let tempBegin = moment(begin);
        let tempEnd = moment(end);

        while (tempEnd.diff(tempBegin) >= 0) {
            dates.push(tempBegin.valueOf());

            tempBegin = tempBegin.add(interval, 'ms');
        }

        return dates;
    }

    private static createEventNode(contextId: string, groupId, nodeId: string, eventInfo: EventInterface, userInfo: any) {
        delete eventInfo.repeat;

        eventInfo.type = SpinalEvent.EVENT_TYPE;
        eventInfo.user = userInfo;

        const taskModel = new SpinalEvent(eventInfo);
        const eventId = SpinalGraphService.createNode(eventInfo, taskModel);
        return groupManagerService.linkElementToGroup(contextId, groupId, eventId).then(async (result) => {
            await SpinalGraphService.addChild(nodeId, eventId, RELATION_NAME, SPINAL_RELATION_PTR_LST_TYPE);

            return SpinalGraphService.getInfo(eventId);
        })
    }
}