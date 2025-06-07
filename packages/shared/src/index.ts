
// Define these field names here so that they can be referenced and even
// iterated without having to use string literals all over the place.
export const MATCH_FIELD = {
    customer: 'customer',
    orderId: 'orderId',
    date: 'date',
    item: 'item',
    price: 'price'
} as const;

export type MatchFieldType = typeof MATCH_FIELD[keyof typeof MATCH_FIELD];

export const matchFields = () => Object.keys(MATCH_FIELD) as MatchFieldType[];

export interface Order {
    [MATCH_FIELD.customer]: string,
    [MATCH_FIELD.orderId]: string,
    [MATCH_FIELD.date]: string,
    [MATCH_FIELD.item]: string,
    [MATCH_FIELD.price]: number,
}

export interface Transaction extends Order {
    txnType: string
    txnAmount: number,
}

export interface Match {
    order: Order,
    txns: Transaction[],
}