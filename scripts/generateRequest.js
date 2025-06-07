"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOrders = generateOrders;
exports.generateTransactions = generateTransactions;
const faker_1 = require("@faker-js/faker");
const fs_1 = __importDefault(require("fs"));
// Visual similarity map for character substitutions
const visualMap = {
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
function mutateString(str, variationRate = 0.15) {
    const chars = str.split('');
    const mutated = [];
    for (const char of chars) {
        if (Math.random() < variationRate) {
            const action = faker_1.faker.helpers.arrayElement(['substitute', 'drop', 'add']);
            if (action === 'substitute' && visualMap[char]) {
                mutated.push(faker_1.faker.helpers.arrayElement(visualMap[char]));
            }
            else if (action === 'drop') {
                continue; // skip character
            }
            else if (action === 'add') {
                mutated.push(char);
                mutated.push(faker_1.faker.string.alpha({ casing: 'mixed', length: 1 }));
            }
            else {
                mutated.push(char);
            }
        }
        else {
            mutated.push(char);
        }
    }
    return mutated.join('');
}
function mutatePrice(price, variationRate = 0.2) {
    const str = price.toFixed(2); // "123.45"
    const chars = str.split('');
    const mutated = [];
    for (const char of chars) {
        if (Math.random() < variationRate) {
            const action = faker_1.faker.helpers.arrayElement(['drop', 'add', 'substitute']);
            if (action === 'drop') {
                continue;
            }
            else if (action === 'add') {
                mutated.push(char);
                mutated.push(faker_1.faker.string.numeric(1));
            }
            else if (action === 'substitute' && /\d/.test(char)) {
                mutated.push(faker_1.faker.string.numeric(1));
            }
            else {
                mutated.push(char);
            }
        }
        else {
            mutated.push(char);
        }
    }
    const mutatedStr = mutated.join('');
    const parsed = parseFloat(mutatedStr);
    return isNaN(parsed) ? price : parsed;
}
function generateOrders(count) {
    return Array.from({ length: count }, () => ({
        customer: faker_1.faker.person.fullName(),
        orderId: faker_1.faker.string.uuid(),
        date: faker_1.faker.date.recent({ days: 30 }).toISOString(),
        item: faker_1.faker.commerce.product(),
        price: parseFloat(faker_1.faker.commerce.price({ min: 10, max: 500 })),
    }));
}
function generateTransactions(orders, transactionsPerOrder = 2) {
    const txnTypes = ['credit', 'debit', 'refund', 'chargeback'];
    const transactions = [];
    for (const order of orders) {
        for (let i = 0; i < transactionsPerOrder; i++) {
            transactions.push({
                customer: mutateString(order.customer),
                orderId: mutateString(order.orderId),
                date: mutateString(order.date),
                item: mutateString(order.item),
                price: mutatePrice(order.price),
                txnType: faker_1.faker.helpers.arrayElement(txnTypes),
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
fs_1.default.writeFileSync(`./request_${NUM_ORDERS}x${NUM_TRANSACTIONS_PER_ORDER}.json`, JSON.stringify({ orders, transactions }, null, 2), 'utf-8');
