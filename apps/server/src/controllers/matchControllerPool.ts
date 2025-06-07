import { Piscina } from 'piscina';
import { resolve } from 'path';
import os from 'os';
import { Match, Order, Transaction } from 'xact-matcher-shared';
import { matchOrders } from './matchController';

const BATCH_SIZE = 100;

export const matchOrdersPool = new Piscina({
    filename: resolve(__dirname, 'matchController.ts'),
    maxThreads: os.cpus().length,
    minThreads: 1,
});

export const batchedMatchOrders = async (
    orders: Order[],
    transactions: Transaction[],
    batchSize: number = BATCH_SIZE
): Promise<Match[]> => {
    if (orders.length === 0 || transactions.length === 0) {
        // This stubs out the response with empty transactions for each order
        return matchOrders(orders, transactions);
    }

    // Every worker will need the full set of orders, but the transactions
    // are split into batches.
    const batches: Transaction[][] = [];
    for (let i = 0; i < transactions.length; i += batchSize) {
        batches.push(transactions.slice(i, i + batchSize));
    }

    // Spawn the workers and wait for the results
    const workerPromises: Promise<Match[]>[] = batches.map(batch => {
        return matchOrdersPool.run({
            orders,
            transactions: batch,
        });
    });
    const allResults = await Promise.all(workerPromises);

    // Start with the first batch's results and merge subsequent batches in
    const matches = allResults[0];
    for (let i = 1; i < allResults.length; i++) {
        const batchMatches = allResults[i];
        for (let j = 0; j < matches.length; j++) {
            matches[j].txns.push(...batchMatches[j].txns);
        }
    }
    return matches;
};