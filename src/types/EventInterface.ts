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

export const Period = Object.freeze({
    day: 86400000,
    week: 604800000,
    month: 2629800000,
    year: 31557600000
})

export const invers_period = Object.freeze({
    86400000: "day",
    604800000: "week",
    2629800000: "month",
    31557600000: "year"
})

export interface EventInterface {
    contextId?: string;
    groupId?: string;
    categoryId?: string;
    nodeId: string;
    assignedTo?: any;
    startDate?: string;
    user?: any;
    description?: string;
    endDate?: string;
    periodicity: { count: number, period: number };
    repeat: boolean;
    name: string;
    done?: Boolean;
    creationDate?: string;
    repeatEnd?: string;
    [key: string]: any;
}