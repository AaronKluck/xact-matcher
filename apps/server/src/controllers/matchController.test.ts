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
    it('purposely mixed up matches still have scores over .5', () => {
        const expected: Match[] = [
            { order: STANDARD_ORDERS[0], txns: [{ txn: STANDARD_TRANSACTIONS[0], score: expect.any(Number) }, { txn: STANDARD_TRANSACTIONS[1], score: expect.any(Number) }] },
            { order: STANDARD_ORDERS[1], txns: [{ txn: STANDARD_TRANSACTIONS[2], score: expect.any(Number) }, { txn: STANDARD_TRANSACTIONS[3], score: expect.any(Number) }] },
            { order: STANDARD_ORDERS[2], txns: [{ txn: STANDARD_TRANSACTIONS[4], score: expect.any(Number) }, { txn: STANDARD_TRANSACTIONS[5], score: expect.any(Number) }] },
        ]
        const result = matchOrders(STANDARD_ORDERS, STANDARD_TRANSACTIONS);
        expect(result).toEqual(expected);
        result.forEach(o => { return o.txns.forEach(t => expect(t.score).toBeGreaterThan(.5)); });
    });

    it('exact matches have a score of 1', () => {
        const exactMatchingTxns: Transaction[] = [
            { ...STANDARD_ORDERS[0], txnType: 'payment-99', txnAmount: 1.23 },
            { ...STANDARD_ORDERS[1], txnType: 'payment-98', txnAmount: 4.56 },
            { ...STANDARD_ORDERS[2], txnType: 'payment-97', txnAmount: 7.89 },
        ];
        const expected: Match[] = [
            { order: STANDARD_ORDERS[0], txns: [{ txn: exactMatchingTxns[0], score: 1.0 }] },
            { order: STANDARD_ORDERS[1], txns: [{ txn: exactMatchingTxns[1], score: 1.0 }] },
            { order: STANDARD_ORDERS[2], txns: [{ txn: exactMatchingTxns[2], score: 1.0 }] },
        ]
        const result = matchOrders(STANDARD_ORDERS, exactMatchingTxns);
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

    it('low scoring match', () => {
        // A transaction that should not (conceptually) match any orders will
        // still get stuck with one, albeit with a very low score.
        const nonMatchingTxn: Transaction[] = [
            { customer: 'Unknown User', orderId: 'banana', date: '3/5/99', item: 'Unknown Item', price: 0.00, txnType: 'payment', txnAmount: 0.00 },
        ];

        const expected: Match[] = [
            { order: STANDARD_ORDERS[0], txns: [{ txn: nonMatchingTxn[0], score: expect.any(Number) }] },
            { order: STANDARD_ORDERS[1], txns: [] },
            { order: STANDARD_ORDERS[2], txns: [] },
        ]
        const result = matchOrders(STANDARD_ORDERS, nonMatchingTxn);
        expect(result).toEqual(expected);
        expect(result[0].txns[0].score).toBeLessThan(0.1);
    });
});