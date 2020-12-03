export declare const Period: Readonly<{
    day: number;
    week: number;
    month: number;
    year: number;
}>;
export declare const invers_period: Readonly<{
    86400000: string;
    604800000: string;
    2629800000: string;
    31557600000: string;
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
