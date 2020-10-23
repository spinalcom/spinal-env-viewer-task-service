"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const spinal_core_connectorjs_type_1 = require("spinal-core-connectorjs_type");
const spinal_env_viewer_graph_service_1 = require("spinal-env-viewer-graph-service");
const spinal_env_viewer_plugin_group_manager_service_1 = require("spinal-env-viewer-plugin-group-manager-service");
const SpinalEvent_1 = require("../models/SpinalEvent");
const constants_1 = require("../types/constants");
const EventInterface_1 = require("../types/EventInterface");
const spinal_env_viewer_plugin_documentation_service_1 = require("spinal-env-viewer-plugin-documentation-service");
const moment = require("moment");
class SpinalEventService {
    ///////////////////////////////////////////////////////////////////////
    //                          CONTEXTS                                 //
    ///////////////////////////////////////////////////////////////////////
    static createEventContext(name, steps) {
        return spinal_env_viewer_plugin_group_manager_service_1.groupManagerService.createGroupContext(name, SpinalEvent_1.SpinalEvent.EVENT_TYPE).then((context) => {
            context.info.add_attr({ steps: new spinal_core_connectorjs_type_1.Ptr(new spinal_core_connectorjs_type_1.Lst(steps)) });
            return context.info;
        });
    }
    static getEventContexts() {
        return spinal_env_viewer_plugin_group_manager_service_1.groupManagerService.getGroupContexts(SpinalEvent_1.SpinalEvent.EVENT_TYPE).then((contexts) => {
            return contexts.map(el => spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(el.id));
        });
    }
    ///////////////////////////////////////////////////////////////////////
    //                          CATEGORIES                               //
    ///////////////////////////////////////////////////////////////////////
    static getEventsCategories(nodeId) {
        return spinal_env_viewer_plugin_group_manager_service_1.groupManagerService.getCategories(nodeId);
    }
    static createEventCategory(contextId, name, icon) {
        return spinal_env_viewer_plugin_group_manager_service_1.groupManagerService.addCategory(contextId, name, icon).then((node) => __awaiter(this, void 0, void 0, function* () {
            spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(node);
            const id = node.getId().get();
            const steps = yield this._getSteps(id);
            const promises = steps.map(el => this._createGroupNode(contextId, id, el.name, el.color, el.order));
            return Promise.all(promises).then(() => node.info);
        }));
    }
    ///////////////////////////////////////////////////////////////////////
    //                             STEPS                                 //
    ///////////////////////////////////////////////////////////////////////
    static createEventGroup(contextId, catgoryId, name, color) {
        return spinal_env_viewer_plugin_group_manager_service_1.groupManagerService.addGroup(contextId, catgoryId, name, color).then((node) => {
            return node.info;
        });
    }
    static getEventsGroups(nodeId) {
        return spinal_env_viewer_plugin_group_manager_service_1.groupManagerService.getGroups(nodeId);
    }
    static getFirstStep(nodeId) {
        return this.getEventsGroups(nodeId).then((steps) => {
            return steps.find((el) => el.order.get() === 0);
        });
    }
    ///////////////////////////////////////////////////////////////////////
    //                             Events                                 //
    ///////////////////////////////////////////////////////////////////////
    static createEventBetween(begin, end, periodicity, contextId, groupId, nodeId, eventInfo, userInfo) {
        const dates = this._getDateInterval(begin, end, periodicity);
        const reference = Date.now();
        const diff = moment(eventInfo.endDate).diff(moment(eventInfo.startDate)).valueOf();
        const promises = dates.map(el => {
            const temp_obj = Object.assign(Object.assign({}, eventInfo), { startDate: moment(el).format('LLLL'), endDate: moment(el).add(diff, "milliseconds").format('LLLL'), reference });
            return this.createEventNode(contextId, groupId, nodeId, temp_obj, userInfo);
        });
        return Promise.all(promises);
    }
    static createEvent(contextId, groupId, nodeId, eventInfo, userInfo) {
        if (eventInfo.repeat) {
            const periodicity = eventInfo.periodicity.count * eventInfo.periodicity.period;
            return this.createEventBetween(eventInfo.startDate, eventInfo.repeatEnd, periodicity, contextId, groupId, nodeId, eventInfo, userInfo);
        }
        else {
            return this.createEventNode(contextId, groupId, nodeId, eventInfo, userInfo);
        }
    }
    static getEvents(nodeId) {
        return spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, [constants_1.RELATION_NAME]);
    }
    static updateEvent(eventId, newEventInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            this._updateEventInformation(eventId, newEventInfo);
            // if (newEventInfo.repeat) {
            //     let info = SpinalGraphService.getInfo(eventId).get();
            //     const periodicity = newEventInfo.periodicity.count * newEventInfo.periodicity.period;
            //     const begin = newEventInfo.startDate + periodicity;
            //     const end = newEventInfo.endDate;
            //     info = { ...newEventInfo, contextId: info.contextId, groupId: info.groupId, nodeId: info.nodeId, user: info.user }
            //     return this.createTaskBetween(begin, end, periodicity, info.contextId, info.groupId, info.nodeId, newEventInfo, info.userInfo)
            // }
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(eventId);
        });
    }
    static removeEvent(eventId) {
        return __awaiter(this, void 0, void 0, function* () {
            const info = spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(eventId).get();
            return spinal_env_viewer_plugin_group_manager_service_1.groupManagerService.unLinkElementToGroup(info.groupId, eventId).then((result) => {
                // console.log(result);
                const node = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(eventId);
                return spinal_env_viewer_graph_service_1.SpinalGraphService.removeChild(info.nodeId, eventId, constants_1.RELATION_NAME, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            });
        });
    }
    ///////////////////////////////////////////////////////////////////////
    //                             LOGS                                  //
    ///////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////
    //                              PRIVATES                               //
    /////////////////////////////////////////////////////////////////////////
    static _updateEventInformation(eventId, newEventInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            const event = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(eventId);
            if (typeof event === "undefined")
                return;
            for (const key in newEventInfo) {
                if (Object.prototype.hasOwnProperty.call(newEventInfo, key)) {
                    if (event.info[key]) {
                        event.info.mod_attr(key, newEventInfo[key]);
                    }
                    else {
                        event.info.add_attr({ [key]: newEventInfo[key] });
                    }
                }
            }
        });
    }
    static _getSteps(contextId) {
        return __awaiter(this, void 0, void 0, function* () {
            const info = spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(contextId);
            return new Promise((resolve) => {
                info.steps.load((data) => {
                    resolve(data.get());
                });
            });
        });
    }
    static _createGroupNode(contextId, categoryId, name, color, order) {
        return spinal_env_viewer_plugin_group_manager_service_1.groupManagerService.addGroup(contextId, categoryId, name, color);
    }
    static _getDateInterval(begin, end, interval) {
        const dates = [];
        let tempBegin = moment(begin);
        let tempEnd = moment(end);
        while (tempEnd.diff(tempBegin) >= 0) {
            dates.push(tempBegin.valueOf());
            tempBegin = tempBegin.add(interval, 'ms');
        }
        return dates;
    }
    static createEventNode(contextId, groupId, nodeId, eventInfo, userInfo) {
        if (!eventInfo.repeat) {
            delete eventInfo.periodicity;
            delete eventInfo.repeatEnd;
        }
        if (eventInfo.startDate) {
            eventInfo.startDate = moment(eventInfo.startDate).format("LLLL");
        }
        if (eventInfo.endDate) {
            eventInfo.endDate = moment(eventInfo.endDate).format("LLLL");
        }
        if (eventInfo.creationDate) {
            eventInfo.creationDate = moment(eventInfo.creationDate).format("LLLL");
        }
        if (eventInfo.repeatEnd) {
            eventInfo.repeatEnd = moment(eventInfo.repeatEnd).format("LLLL");
        }
        eventInfo.type = SpinalEvent_1.SpinalEvent.EVENT_TYPE;
        eventInfo.user = userInfo;
        // const taskModel = new SpinalEvent(eventInfo);
        const eventId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode(eventInfo, new spinal_core_connectorjs_type_1.Model());
        return spinal_env_viewer_plugin_group_manager_service_1.groupManagerService.linkElementToGroup(contextId, groupId, eventId).then((result) => __awaiter(this, void 0, void 0, function* () {
            yield spinal_env_viewer_graph_service_1.SpinalGraphService.addChild(nodeId, eventId, constants_1.RELATION_NAME, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            yield this.createAttribute(eventId);
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(eventId);
        }));
    }
    static createAttribute(nodeId) {
        const categoryName = "default";
        const realNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(nodeId);
        return spinal_env_viewer_plugin_documentation_service_1.serviceDocumentation.addCategoryAttribute(realNode, categoryName).then((attributeCategory) => {
            const promises = [];
            promises.push(spinal_env_viewer_plugin_documentation_service_1.serviceDocumentation.addAttributeByCategory(realNode, attributeCategory, "name", realNode.info.name));
            const attributes = ["startDate", "endDate", "creationDate", "repeatEnd"];
            for (const key of attributes) {
                if (realNode.info[key]) {
                    // const date = moment(realNode.info[key].get()).format('LL')
                    promises.push(spinal_env_viewer_plugin_documentation_service_1.serviceDocumentation.addAttributeByCategory(realNode, attributeCategory, key, realNode.info[key]));
                }
            }
            if (realNode.info.periodicity) {
                const value = `${realNode.info.periodicity.count.get()} ${EventInterface_1.invers_period[realNode.info.periodicity.period.get()]}`;
                promises.push(spinal_env_viewer_plugin_documentation_service_1.serviceDocumentation.addAttributeByCategory(realNode, attributeCategory, "periodicity", value));
            }
            return Promise.all(promises);
        });
    }
}
exports.SpinalEventService = SpinalEventService;
//# sourceMappingURL=TaskService.js.map