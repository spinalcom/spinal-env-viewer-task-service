export declare const Period: Readonly<{
    day: 86400000;
    week: 604800000;
    month: 2629800000;
    year: 31557600000;
}>;
export declare const invers_period: Readonly<{
    86400000: "day";
    604800000: "week";
    2629800000: "month";
    31557600000: "year";
}>;
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
    periodicity: {
        count: number;
        period: number;
    };
    repeat: boolean;
    name: string;
    done?: Boolean;
    creationDate?: string;
    repeatEnd?: string;
    [key: string]: any;
}
