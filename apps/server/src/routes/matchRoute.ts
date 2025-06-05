import { Router } from 'express';
import { matchOrders } from '../controllers/matchController';
import { Match, Order, Transaction } from 'xact-matcher-shared';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       required:
 *         - customer
 *         - orderId
 *         - date
 *         - item
 *         - price
 *       properties:
 *         customer:
 *           type: string
 *         orderId:
 *           type: string
 *         date:
 *           type: string
 *         item:
 *           type: string
 *         price:
 *           type: number
 *     Transaction:
 *       type: object
 *       required:
 *         - customer
 *         - orderId
 *         - date
 *         - item
 *         - price
 *         - txnType
 *         - txnAmount
 *       properties:
 *         customer:
 *           type: string
 *         orderId:
 *           type: string
 *         date:
 *           type: string
 *         item:
 *           type: string
 *         price:
 *           type: number
 *         txnType:
 *           type: string
 *         txnAmount:
 *           type: number
 *     MatchRequest:
 *       type: object
 *       required:
 *         - orders
 *         - transactions
 *       properties:
 *        orders:
 *          type: array
 *          items:
 *            $ref: '#/components/schemas/Order'
 *        transactions:
 *          type: array
 *          items:
 *            $ref: '#/components/schemas/Transaction'
 *     MatchResponse:
 *       type: array
 *       items:
 *         type: object
 *         properties:
 *           order:
 *             $ref: '#/components/schemas/Order'
 *           txns:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/Transaction'
 */

/**
 * @swagger
 * /api/match:
 *   post:
 *     summary: Match transactions to their orders
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MatchRequest'
 *     responses:
 *       200:
 *         description: Successful matching
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MatchResponse'
 */
router.post<
  string,
  {}, // route params
  Match[], // response body
  { orders: Order[], transactions: Transaction[] }, // request body
  never // request query
>('/',
  async (req, res, next) => {
    try {
      const matches = await matchOrders(req.body.orders, req.body.transactions);
      res.json(matches);
    } catch (err) {
      next(err);
    }
  },
);



export default router;