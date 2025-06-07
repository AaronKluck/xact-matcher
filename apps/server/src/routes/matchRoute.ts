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
 *         orders:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Order'
 *         transactions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Transaction'
 *     MatchResponse:
 *       type: object
 *       required:
 *         - matches
 *       properties:
 *         matches:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - order
 *               - txns
 *             properties:
 *               order:
 *                 $ref: '#/components/schemas/Order'
 *               txns:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Transaction'
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
 *           example: {"orders": [{"customer":"Alex Abel","orderId":"18G","date":"2023-07-11","item":"Tool A","price":1.23},{"customer":"Brian Bell","orderId":"20S","date":"2023-08-08","item":"Toy B","price":3.21},{"customer":"Craig Cox","orderId":"75T","date":"2024-12-23","item":"Trampoline C","price":6.32}], "transactions": [{"customer":"Alexis Abe","orderId":"1B6","date":"2023-07-12","item":"Tool A","price":1.23,"txnType":"payment","txnAmount":1.23},{"customer":"Alex Able","orderId":"I8G","date":"2023-07-13","item":"Tool A","price":1.23,"txnType":"refund","txnAmount":-1.23},{"customer":"Brian Ball","orderId":"ZOS","date":"2023-08-11","item":"Toy B","price":3.21,"txnType":"payment-1","txnAmount":1.21},{"customer":"Bryan","orderId":"705","date":"2023-08-13","item":"Toy B","price":3.21,"txnType":"payment-2","txnAmount":2},{"customer":"Creg","orderId":"TS7","date":"2023-08-12","item":"Trampoline C","price":6.33,"txnType":"payment-3","txnAmount":4},{"customer":"Croc","orderId":"7ST","date":"2019-12-23","item":"Trampoline B","price":6.29,"txnType":"payment-4","txnAmount":4.01}]}
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
  { matches: Match[] }, // response body
  { orders: Order[], transactions: Transaction[] }, // request body
  never // request query
>('/',
  async (req, res, next) => {
    try {
      const matches = matchOrders(req.body.orders, req.body.transactions);
      res.json({ matches });
    } catch (err) {
      next(err);
    }
  },
);



export default router;