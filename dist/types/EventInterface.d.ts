export declare const Period: Readonly<{
    day: number;
    week: number;
    month: number;
    year: number;
}>;
export interface EventInterface {
    contextId?: string;
    groupId?: string;
    categoryId?: string;
    nodeId: string;
    assignedTo?: any;
    startDate?: number;
    user?: any;
    description?: string;
    endDate?: number;
    periodicity: {
        count: number;
        period: number;
    };
    repeat: boolean;
    name: string;
    done?: Boolean;
    creationDate?: number;
    repeatEnd?: number;
    [key: string]: any;
}
