import { Match, Order, Transaction } from 'xact-matcher-shared';
import { matchOrders } from "./matchController";


const STANDARD_ORDERS: Order[] = [
    { customer: 'Alex Abel', orderId: '18G', date: '2023-07-11', item: 'Tool A', price: 1.23 },
    { customer: 'Brian Bell', orderId: '20S', date: '2023-08-08', item: 'Toy B', price: 3.21 },
    { customer: 'Craig Cox', orderId: '75T', date: '2024-12-23', item: 'Trampoline C', price: 6.32 },
];

const STANDARD_TRANSACTIONS: Transaction[] = [
    { customer: 'Alexis Abe', orderId: '1B6', date: '2023-07-12', item: 'Tool A', price: 1.23, txnType: 'payment', txnAmount: 1.23 },
    { customer: 'Alex Able', orderId: 'I8G', date: '2023-07-13', item: 'Tool A', price: 1.23, txnType: 'refund', txnAmount: -1.23 },
    { customer: 'Brian Ball', orderId: 'ZOS', date: '2023-08-11', item: 'Toy B', price: 3.21, txnType: 'payment-1', txnAmount: 1.21 },
    { customer: 'Bryan', orderId: '705', date: '2023-08-13', item: 'Toy B', price: 3.21, txnType: 'payment-2', txnAmount: 2.00 },
    { customer: 'Creg', orderId: 'TS7', date: '2023-08-12', item: 'Trampoline C', price: 6.33, txnType: 'payment-3', txnAmount: 4.00 },
    { customer: 'Croc', orderId: '7ST', date: '2019-12-23', item: 'Trampoline B', price: 6.29, txnType: 'payment-4', txnAmount: 4.01 },
];


describe('matchController', () => {
    it('standard', () => {
        const expected: Match[] = [
            { order: STANDARD_ORDERS[0], txns: [STANDARD_TRANSACTIONS[0], STANDARD_TRANSACTIONS[1]] },
            { order: STANDARD_ORDERS[1], txns: [STANDARD_TRANSACTIONS[2], STANDARD_TRANSACTIONS[3]] },
            { order: STANDARD_ORDERS[2], txns: [STANDARD_TRANSACTIONS[4], STANDARD_TRANSACTIONS[5]] },
        ]
        const result = matchOrders(STANDARD_ORDERS, STANDARD_TRANSACTIONS);
        expect(result).toEqual(expected);
    });

    it('empty orders', () => {
        const result = matchOrders([], STANDARD_TRANSACTIONS);
        expect(result).toEqual([]);
    });

    it('empty transactions', () => {
        const result = matchOrders(STANDARD_ORDERS, []);
        expect(result).toEqual([]);
    });

    it('awul match', () => {
        // Some transactions that should not match any orders
        const extraTransactions: Transaction[] = [
            { customer: 'Unknown User', orderId: '999', date: '2023-01-01', item: 'Unknown Item', price: 0.00, txnType: 'payment', txnAmount: 0.00 },
        ];

        const expected: Match[] = [
            { order: STANDARD_ORDERS[0], txns: [STANDARD_TRANSACTIONS[0], STANDARD_TRANSACTIONS[1]] },
            { order: STANDARD_ORDERS[1], txns: [STANDARD_TRANSACTIONS[2], STANDARD_TRANSACTIONS[3]] },
            { order: STANDARD_ORDERS[2], txns: [STANDARD_TRANSACTIONS[4], STANDARD_TRANSACTIONS[5]] },
        ]
        const result = matchOrders(STANDARD_ORDERS, STANDARD_TRANSACTIONS);
        expect(result).toEqual(expected);
    });
});