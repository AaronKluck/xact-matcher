import { fuzzyVisualScore } from '../utils/fuzzy';
import { Match, MATCH_FIELD, matchFields, Order, Transaction } from 'xact-matcher-shared';


const FIELD_WEIGHTS = {
    [MATCH_FIELD.customer]: 1.0,
    [MATCH_FIELD.orderId]: 1.0,
    [MATCH_FIELD.date]: 0.7,
    [MATCH_FIELD.item]: 0.8,
    [MATCH_FIELD.price]: 0.9,
} as const;

const WEIGHT_SUM = Object.values(FIELD_WEIGHTS).reduce((sum, weight) => sum + weight, 0);

const matchOrderIdx = (orders: Order[], transaction: Transaction): { orderIdx: number, score: number } => {
    const stringify = (arg: any): string => typeof arg === 'string' ? arg : `${arg}`;

    const scores: { [field: string]: number[] } = {
        [MATCH_FIELD.customer]: [],
        [MATCH_FIELD.orderId]: [],
        [MATCH_FIELD.date]: [],
        [MATCH_FIELD.item]: [],
        [MATCH_FIELD.price]: [],
    };
    for (const field of matchFields()) {
        // We're doing string comparisons across the board; convert non-
        // strings to strings when storing here.
        const txnVal = stringify(transaction[field]);

        for (let i = 0; i < orders.length; i++) {
            const orderVal = stringify(orders[i][field]);
            const score = fuzzyVisualScore(orderVal, txnVal);
            scores[field].push(score);
        }
    }

    // Sum up the scores for each order for this transaction
    const totalScores = orders.map((_, i) => {
        return matchFields().reduce((sum, field) => {
            return sum + (scores[field][i] * FIELD_WEIGHTS[field]);
        }, 0);
    });

    // Find the index of the order with the highest score
    const orderIdx = totalScores.reduce((bestIdx, score, idx) => {
        return score > totalScores[bestIdx] ? idx : bestIdx;
    }, 0);
    return { orderIdx, score: totalScores[orderIdx] / WEIGHT_SUM };
};

export const matchOrders = (
    orders: Order[], transactions: Transaction[]
): Match[] => {
    // If there are no orders, then there's nothing to match against
    if (orders.length === 0) {
        return [];
    }

    // Stub out the response with empty transactions for each order
    const matches: Match[] = orders.map(o => ({ order: o, txns: [] }));

    for (const txn of transactions) {
        const { orderIdx, score } = matchOrderIdx(orders, txn);
        matches[orderIdx].txns.push({ txn, score });
    }

    return matches;
};

export default ({ orders, transactions }: { orders: Order[], transactions: Transaction[] }) => {
    return matchOrders(orders, transactions);
};