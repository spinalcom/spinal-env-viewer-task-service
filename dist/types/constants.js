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
exports.RELATION_NAME = exports.EVENT_TYPE = exports.CONTEXT_TYPE = exports.DEFAULT_GROUP_NAME = exports.DEFAULT_CATEGORY_NAME = exports.DEFAULT_CONTEXT_NAME = void 0;
const SpinalEvent_1 = require("../models/SpinalEvent");
exports.DEFAULT_CONTEXT_NAME = "Default_event_context";
exports.DEFAULT_CATEGORY_NAME = "Default_category";
exports.DEFAULT_GROUP_NAME = "Default_group";
exports.CONTEXT_TYPE = `${SpinalEvent_1.SpinalEvent.EVENT_TYPE}GroupContext`;
exports.EVENT_TYPE = "SpinalEvent";
exports.RELATION_NAME = "hasEvent";
//# sourceMappingURL=constants.js.map