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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpinalEventService = exports.SpinalEvent = void 0;
const TaskService_1 = require("./services/TaskService");
Object.defineProperty(exports, "SpinalEventService", { enumerable: true, get: function () { return TaskService_1.SpinalEventService; } });
const SpinalEvent_1 = require("./models/SpinalEvent");
Object.defineProperty(exports, "SpinalEvent", { enumerable: true, get: function () { return SpinalEvent_1.SpinalEvent; } });
__exportStar(require("./types/constants"), exports);
__exportStar(require("./types/EventInterface"), exports);
const globalRoot = typeof window === "undefined" ? global : window;
if (typeof globalRoot.spinal === 'undefined')
    globalRoot.spinal = {};
if (typeof globalRoot.spinal.SpinalEventService === 'undefined') {
    globalRoot.spinal.SpinalEventService = TaskService_1.SpinalEventService;
}
//# sourceMappingURL=index.js.map