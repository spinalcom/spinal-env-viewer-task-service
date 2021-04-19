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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Period = exports.SpinalEventService = exports.SpinalEvent = exports.RELATION_NAME = exports.EVENT_TYPE = exports.CONTEXT_TYPE = void 0;
const TaskService_1 = require("./services/TaskService");
Object.defineProperty(exports, "SpinalEventService", { enumerable: true, get: function () { return TaskService_1.SpinalEventService; } });
const constants_1 = require("./types/constants");
Object.defineProperty(exports, "CONTEXT_TYPE", { enumerable: true, get: function () { return constants_1.CONTEXT_TYPE; } });
Object.defineProperty(exports, "EVENT_TYPE", { enumerable: true, get: function () { return constants_1.EVENT_TYPE; } });
Object.defineProperty(exports, "RELATION_NAME", { enumerable: true, get: function () { return constants_1.RELATION_NAME; } });
const SpinalEvent_1 = require("./models/SpinalEvent");
Object.defineProperty(exports, "SpinalEvent", { enumerable: true, get: function () { return SpinalEvent_1.SpinalEvent; } });
const EventInterface_1 = require("./types/EventInterface");
Object.defineProperty(exports, "Period", { enumerable: true, get: function () { return EventInterface_1.Period; } });
//# sourceMappingURL=index.js.map