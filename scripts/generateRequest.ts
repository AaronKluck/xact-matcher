import { faker } from '@faker-js/faker';
import fs from 'fs';

export interface Order {
    customer: string;
    orderId: string;
    date: string;
    item: string;
    price: number;
}

export interface Transaction extends Order {
    txnType: string;
    txnAmount: number;
}

// Visual similarity map for character substitutions
const visualMap: Record<string, string[]> = {
    '0': ['O', 'Q'],
    '1': ['I', 'l'],
    '2': ['Z'],
    '3': ['E'],
    '4': ['A'],
    '5': ['S'],
    '6': ['G'],
    '7': ['T'],
    '8': ['B'],
    '9': ['g'],
    'O': ['0', 'Q'],
    'B': ['8'],
    'Z': ['2'],
    'G': ['6'],
    'T': ['7'],
    'I': ['1', 'l'],
    'S': ['5', '$'],
    'A': ['@', '4'],
    '@': ['A'],
    '$': ['S'],
};

function mutateString(str: string, variationRate = 0.15): string {
    const chars = str.split('');
    const mutated: string[] = [];

    for (const char of chars) {
        if (Math.random() < variationRate) {
            const action = faker.helpers.arrayElement(['substitute', 'drop', 'add']);
            if (action === 'substitute' && visualMap[char]) {
                mutated.push(faker.helpers.arrayElement(visualMap[char]));
            } else if (action === 'drop') {
                continue; // skip character
            } else if (action === 'add') {
                mutated.push(char);
                mutated.push(faker.string.alpha({ casing: 'mixed', length: 1 }));
            } else {
                mutated.push(char);
            }
        } else {
            mutated.push(char);
        }
    }

    return mutated.join('');
}

function mutatePrice(price: number, variationRate = 0.2): number {
    const str = price.toFixed(2); // "123.45"
    const chars = str.split('');
    const mutated: string[] = [];

    for (const char of chars) {
        if (Math.random() < variationRate) {
            const action = faker.helpers.arrayElement(['drop', 'add', 'substitute']);

            if (action === 'drop') {
                continue;
            } else if (action === 'add') {
                mutated.push(char);
                mutated.push(faker.string.numeric(1));
            } else if (action === 'substitute' && /\d/.test(char)) {
                mutated.push(faker.string.numeric(1));
            } else {
                mutated.push(char);
            }
        } else {
            mutated.push(char);
        }
    }

    const mutatedStr = mutated.join('');

    const parsed = parseFloat(mutatedStr);
    return isNaN(parsed) ? price : parsed;
}


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
