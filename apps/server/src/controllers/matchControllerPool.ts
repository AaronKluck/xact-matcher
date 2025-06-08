import { Piscina } from 'piscina';
import { resolve } from 'path';
import os from 'os';
import { Match, Order, Transaction } from 'xact-matcher-shared';
import { matchOrders } from './matchController';

// On my 12-core machine, 150 is a good batch size for large requests, both for
// single requests and multiple requests in parallel.
const BATCH_SIZE = 150;

/**
 * Piscina expects a path to a file, not a function. That makes it awkward when
 * we're using TypeScript in dev mode, 'cuz the filename is different than prod.
 */
const resolveWorkerPath = () => {
    const isDev = process.env.NODE_ENV !== 'production';
    return resolve(
        __dirname,
        isDev ? 'matchController.ts' : 'matchController.js'
    );
};

/**
 * The worker pool. Scales to the number of cores on the machine.
 */
export const matchOrdersPool = new Piscina({
    filename: resolveWorkerPath(),
    maxThreads: os.cpus().length,
    minThreads: 1,
});

/**
 * Breaks the Transactions into batches and sends them to the worker pool.
 * Stitches the results back together after they're returned. This has the dual
 * benefit of being able to handle large requests more quickly as well as being
 * able to handle multiple requests in parallel by not doing any real work on
 * the main thread.
 */
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