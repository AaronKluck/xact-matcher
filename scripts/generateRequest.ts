import { faker } from '@faker-js/faker';
import fs from 'fs';
import { Order, Transaction, mutateString, mutatePrice } from 'xact-matcher-shared';


export function generateOrders(count: number): Order[] {
    return Array.from({ length: count }, () => ({
        customer: faker.person.fullName(),
        orderId: faker.string.uuid(),
        date: faker.date.recent({ days: 30 }).toISOString(),
        item: faker.commerce.product(),
        price: parseFloat(faker.commerce.price({ min: 10, max: 500 })),
    }));
}

export function generateTransactions(
    orders: Order[],
    transactionsPerOrder = 2
): Transaction[] {
    const txnTypes = ['credit', 'debit', 'refund', 'chargeback'];

    const transactions: Transaction[] = [];

    for (const order of orders) {
        for (let i = 0; i < transactionsPerOrder; i++) {
            transactions.push({
                customer: mutateString(order.customer),
                orderId: mutateString(order.orderId),
                date: mutateString(order.date),
                item: mutateString(order.item),
                price: mutatePrice(order.price),
                txnType: faker.helpers.arrayElement(txnTypes),
                txnAmount: parseFloat(mutatePrice(order.price).toFixed(2)),
            });
        }
    }

    return transactions;
}

const NUM_ORDERS = 5;
const NUM_TRANSACTIONS_PER_ORDER = 30;

// Generate X many orders, each of which has Y many transactions based on it
const orders = generateOrders(NUM_ORDERS);
const transactions = generateTransactions(orders, NUM_TRANSACTIONS_PER_ORDER);

fs.writeFileSync(
    `./request_${NUM_ORDERS}x${NUM_TRANSACTIONS_PER_ORDER}.json`,
    JSON.stringify({ orders, transactions }, null, 2), 'utf-8',
);
