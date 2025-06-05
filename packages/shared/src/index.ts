export interface Order {
    customer: string,
    orderId: string,
    date: string,
    item: string,
    price: number,
}

export interface Transaction extends Order {
    txnType: string
    txnAmount: number,
}

export interface Match {
    order: Order,
    txns: Transaction[],
}