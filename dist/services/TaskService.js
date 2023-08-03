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
exports.SpinalEventService = void 0;
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
    static createEventContext(name, steps, graph) {
        steps = steps || [];
        return spinal_env_viewer_plugin_group_manager_service_1.groupManagerService.createGroupContext(name, SpinalEvent_1.SpinalEvent.EVENT_TYPE, graph).then((context) => {
            context.info.add_attr({ steps: new spinal_core_connectorjs_type_1.Ptr(new spinal_core_connectorjs_type_1.Lst(steps)) });
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(context.getId().get());
        });
    }
    static getEventContexts(graph) {
        return spinal_env_viewer_plugin_group_manager_service_1.groupManagerService.getGroupContexts(SpinalEvent_1.SpinalEvent.EVENT_TYPE, graph).then((contexts) => {
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
            return Promise.all(promises).then(() => spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(id));
        }));
    }
    ///////////////////////////////////////////////////////////////////////
    //                             STEPS                                 //
    ///////////////////////////////////////////////////////////////////////
    static createEventGroup(contextId, catgoryId, name, color) {
        return spinal_env_viewer_plugin_group_manager_service_1.groupManagerService.addGroup(contextId, catgoryId, name, color).then((node) => {
            //@ts-ignore
            spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(node);
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(node.getId().get());
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
        const isoEndDate = new Date(eventInfo.endDate).toISOString();
        const isoStartDate = new Date(eventInfo.startDate).toISOString();
        const diff = moment(isoEndDate).diff(moment(isoStartDate)).valueOf();
        const promises = dates.map(el => {
            const isoEl = new Date(el).toISOString();
            const temp_obj = Object.assign(Object.assign({}, eventInfo), { startDate: moment(isoEl).format('LLLL'), endDate: moment(isoEl).add(diff, "milliseconds").format('LLLL'), reference });
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
    static getEvents(nodeId, start, end) {
        return __awaiter(this, void 0, void 0, function* () {
            const children = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, [constants_1.RELATION_NAME]);
            if (start && end) {
                return children.filter(event => {
                    const isoDate = new Date(event.startDate.get()).toISOString();
                    const date = moment(isoDate);
                    return date.isSameOrAfter(start.getTime()) && date.isSameOrBefore(end.getTime());
                });
            }
            else if (start && !end) {
                return children.filter(event => {
                    const isoDate = new Date(event.startDate.get()).toISOString();
                    const date = moment(isoDate);
                    return date.isSameOrAfter(start.getTime());
                });
            }
            else if (!start && end) {
                return children.filter(event => {
                    const isoDate = new Date(event.startDate.get()).toISOString();
                    const date = moment(isoDate);
                    return date.isSameOrBefore(end.getTime());
                });
            }
            else {
                return children;
            }
        });
    }
    static updateEvent(eventId, newEventInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            this._updateEventInformation(eventId, newEventInfo);
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(eventId);
        });
    }
    static removeEvent(eventId) {
        return __awaiter(this, void 0, void 0, function* () {
            const groupInfo = yield this._getGroupId(eventId);
            if (groupInfo) {
                return spinal_env_viewer_plugin_group_manager_service_1.groupManagerService.unLinkElementToGroup(groupInfo.id.get(), eventId).then(() => __awaiter(this, void 0, void 0, function* () {
                    const nodeInfo = yield this._getNodeId(eventId);
                    if (nodeInfo)
                        return spinal_env_viewer_graph_service_1.SpinalGraphService.removeChild(nodeInfo.id.get(), eventId, constants_1.RELATION_NAME, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
                }));
            }
        });
    }
    static createOrgetDefaultTreeStructure(graph) {
        return __awaiter(this, void 0, void 0, function* () {
            const context = yield spinal_env_viewer_plugin_group_manager_service_1.groupManagerService.createGroupContext(constants_1.DEFAULT_CONTEXT_NAME, SpinalEvent_1.SpinalEvent.EVENT_TYPE, graph);
            const contextId = context.getId().get();
            const category = yield this.createEventCategory(contextId, constants_1.DEFAULT_CATEGORY_NAME, "");
            const group = yield this.createEventGroup(contextId, category.id.get(), constants_1.DEFAULT_GROUP_NAME, "#fff000");
            return {
                context: spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(contextId),
                category,
                group
            };
        });
    }
    ///////////////////////////////////////////////////////////////////////
    //                             LOGS                                  //
    ///////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////
    //                              PRIVATES                               //
    /////////////////////////////////////////////////////////////////////////
    static _updateEventInformation(eventId, newEventInfo) {
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
    }
    static _getSteps(contextId) {
        return new Promise((resolve) => {
            const info = spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(contextId);
            if (!info.steps)
                return resolve([]);
            info.steps.load((data) => {
                resolve(data.get());
            });
        });
    }
    static _createGroupNode(contextId, categoryId, name, color, order) {
        return spinal_env_viewer_plugin_group_manager_service_1.groupManagerService.addGroup(contextId, categoryId, name, color);
    }
    static _getDateInterval(begin, end, interval) {
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
    static createEventNode(contextId, groupId, nodeId, eventInfo, userInfo) {
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
    static _getGroupId(eventId) {
        return __awaiter(this, void 0, void 0, function* () {
            const info = spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(eventId);
            let groupInfo = spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(info.groupId);
            if (groupInfo) {
                return groupInfo;
            }
            const parents = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getParents(eventId, [`groupHas${constants_1.EVENT_TYPE}`]);
            return parents.find(el => el.id.get() === info.groupId.get());
        });
    }
    static _getNodeId(eventId) {
        return __awaiter(this, void 0, void 0, function* () {
            const info = spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(eventId);
            let nodeInfo = spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(info.nodeId);
            if (nodeInfo) {
                return nodeInfo;
            }
            const parents = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getParents(eventId, [constants_1.RELATION_NAME]);
            return parents.find(el => el.id.get() === info.nodeId.get());
        });
    }
}
exports.SpinalEventService = SpinalEventService;
//# sourceMappingURL=TaskService.js.map