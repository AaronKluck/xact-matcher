import { useState, useEffect } from 'react';
import type { Order, Transaction, Match } from 'xact-matcher-shared';
import { mutateString, mutatePrice } from 'xact-matcher-shared';
import Cookies from 'js-cookie';
import { matchOrdersAndTransactions } from '../api/client';
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  Button,
  FormField,
} from '../components/ui';

// Redefine these types with all fields being strings so that they can be filled
// in with forms.
interface OrderFormData extends Omit<Order, 'price'> {
  price: string;
}

interface TransactionFormData extends Omit<Transaction, 'price' | 'txnAmount'> {
  price: string;
  txnAmount: string;
}

const initialOrderForm: OrderFormData = {
  customer: '',
  orderId: '',
  date: '',
  item: '',
  price: '',
};

const initialTransactionForm: TransactionFormData = {
  ...initialOrderForm,
  txnType: '',
  txnAmount: '',
};

const generateRandomTransactionType = () => {
  const types = ['CREDIT', 'DEBIT', 'PAYMENT', 'REFUND', 'ADJUSTMENT'];
  return types[Math.floor(Math.random() * types.length)];
};

const COOKIE_KEYS = {
  ORDERS: 'xact-matcher-orders',
  TRANSACTIONS: 'xact-matcher-transactions'
} as const;

const MatchPage = () => {
  const [orderForm, setOrderForm] = useState<OrderFormData>(initialOrderForm);
  const [transactionForm, setTransactionForm] = useState<TransactionFormData>(initialTransactionForm);
  const [orders, setOrders] = useState<Order[]>(() => {
    const savedOrders = Cookies.get(COOKIE_KEYS.ORDERS);
    return savedOrders ? JSON.parse(savedOrders) : [];
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const savedTransactions = Cookies.get(COOKIE_KEYS.TRANSACTIONS);
    return savedTransactions ? JSON.parse(savedTransactions) : [];
  });
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Cookies.set(COOKIE_KEYS.ORDERS, JSON.stringify(orders), { expires: 7 }); // Expires in 7 days
  }, [orders]);

  useEffect(() => {
    Cookies.set(COOKIE_KEYS.TRANSACTIONS, JSON.stringify(transactions), { expires: 7 }); // Expires in 7 days
  }, [transactions]);

  const handleOrderInputChange = (field: keyof OrderFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setOrderForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleTransactionInputChange = (field: keyof TransactionFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setTransactionForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const addOrder = () => {
    const price = parseFloat(orderForm.price);
    if (isNaN(price)) {
      setError('Price must be a valid number');
      return;
    }

    const newOrder: Order = {
      ...orderForm,
      price,
    };

    setOrders(prev => [...prev, newOrder]);
    setOrderForm(initialOrderForm);
    setError(null);
  };

  const addTransaction = () => {
    const price = parseFloat(transactionForm.price);
    const txnAmount = parseFloat(transactionForm.txnAmount);

    if (isNaN(price) || isNaN(txnAmount)) {
      setError('Price and transaction amount must be valid numbers');
      return;
    }

    const newTransaction: Transaction = {
      ...transactionForm,
      price,
      txnAmount,
    };

    setTransactions(prev => [...prev, newTransaction]);
    setTransactionForm(initialTransactionForm);
    setError(null);
  };

  const removeOrder = (index: number) => {
    setOrders(prev => prev.filter((_, i) => i !== index));
  };

  const removeTransaction = (index: number) => {
    setTransactions(prev => prev.filter((_, i) => i !== index));
  };

  const handleMatch = async () => {
    if (orders.length === 0 || transactions.length === 0) {
      setError('Please add at least one order and one transaction');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await matchOrdersAndTransactions({ orders, transactions });
      setMatches(data.matches);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTransaction = (order: Order) => {
    const newTransaction: Transaction = {
      customer: mutateString(order.customer),
      orderId: mutateString(order.orderId),
      date: mutateString(order.date),
      item: mutateString(order.item),
      price: mutatePrice(order.price),
      txnType: generateRandomTransactionType(),
      txnAmount: mutatePrice(order.price)
    };
    setTransactions([...transactions, newTransaction]);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all orders and transactions? This cannot be undone.')) {
      setOrders([]);
      setTransactions([]);
      setMatches([]);
      Cookies.remove(COOKIE_KEYS.ORDERS);
      Cookies.remove(COOKIE_KEYS.TRANSACTIONS);
    }
  };

  const renderInputForm = <T extends OrderFormData | TransactionFormData>(
    title: string,
    formData: T,
    onChange: (field: keyof T) => (e: React.ChangeEvent<HTMLInputElement>) => void,
    onAdd: () => void,
    isTransaction: boolean
  ) => (
    <div className="form-card">
      <h2 className="form-title">{title}</h2>
      <table className="form-table">
        <tbody>
          <FormField
            label="Customer"
            value={formData.customer}
            onChange={onChange('customer' as keyof T)}
          />
          <FormField
            label="Order ID"
            value={formData.orderId}
            onChange={onChange('orderId' as keyof T)}
          />
          <FormField
            label="Date"
            type="date"
            value={formData.date}
            onChange={onChange('date' as keyof T)}
          />
          <FormField
            label="Item"
            value={formData.item}
            onChange={onChange('item' as keyof T)}
          />
          <FormField
            label="Price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={onChange('price' as keyof T)}
          />
          {isTransaction && (
            <>
              <FormField
                label="Transaction Type"
                value={(formData as TransactionFormData).txnType}
                onChange={(e) => {
                  const txnForm = formData as TransactionFormData;
                  txnForm.txnType = e.target.value;
                  setTransactionForm({ ...txnForm });
                }}
              />
              <FormField
                label="Transaction Amount"
                type="number"
                step="0.01"
                value={(formData as TransactionFormData).txnAmount}
                onChange={(e) => {
                  const txnForm = formData as TransactionFormData;
                  txnForm.txnAmount = e.target.value;
                  setTransactionForm({ ...txnForm });
                }}
              />
            </>
          )}
        </tbody>
      </table>
      <div className="mt-6 flex justify-end">
        <Button variant="success" onClick={onAdd}>
          Add {isTransaction ? 'Transaction' : 'Order'}
        </Button>
      </div>
    </div>
  );

  const renderDataTable = (
    title: string,
    data: Order[] | Transaction[],
    onRemove: (index: number) => void,
    isTransaction: boolean
  ) => (
    <div className="data-table">
      <h3 className="table-title">{title}</h3>
      <div className="table-container">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Customer</TableHeader>
              <TableHeader>Order ID</TableHeader>
              <TableHeader>Date</TableHeader>
              <TableHeader>Item</TableHeader>
              <TableHeader>Price</TableHeader>
              {isTransaction && (
                <>
                  <TableHeader>Type</TableHeader>
                  <TableHeader>Amount</TableHeader>
                </>
              )}
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.customer}</TableCell>
                <TableCell>{item.orderId}</TableCell>
                <TableCell>{item.date}</TableCell>
                <TableCell>{item.item}</TableCell>
                <TableCell>${item.price.toFixed(2)}</TableCell>
                {isTransaction && (
                  <>
                    <TableCell>{(item as Transaction).txnType}</TableCell>
                    <TableCell>${(item as Transaction).txnAmount.toFixed(2)}</TableCell>
                  </>
                )}
                <TableCell className="space-x-2">
                  {!isTransaction && (
                    <Button
                      variant="default"
                      onClick={() => handleGenerateTransaction(item as Order)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Generate Transaction
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    onClick={() => onRemove(index)}
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Order Transaction Matcher</h1>
        <Button variant="danger" onClick={handleClearAll}>
          Clear All Data
        </Button>
      </div>

      <div className="form-container">
        <div className="form-section">
          {renderInputForm(
            'Add Order',
            orderForm,
            handleOrderInputChange,
            addOrder,
            false
          )}
        </div>

        <div className="form-section">
          {renderInputForm(
            'Add Transaction',
            transactionForm,
            handleTransactionInputChange,
            addTransaction,
            true
          )}
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {renderDataTable('Orders', orders, removeOrder, false)}
      {renderDataTable('Transactions', transactions, removeTransaction, true)}

      <div className="mt-6">
        <Button
          variant="primary"
          onClick={handleMatch}
          disabled={loading || orders.length === 0 || transactions.length === 0}
        >
          {loading ? 'Matching...' : 'Match Orders & Transactions'}
        </Button>
      </div>

      {matches.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Matching Results</h2>
          <div className="space-y-6">
            {matches.map((match, index) => (
              <div key={index} className="match-card">
                <div className="match-header">
                  <h3 className="match-title">Order {index + 1}</h3>
                </div>
                <div className="match-content">
                  <div className="data-table">
                    <h3 className="table-title">Order Details</h3>
                    <div className="table-container">
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableHeader>Customer</TableHeader>
                            <TableHeader>Order ID</TableHeader>
                            <TableHeader>Date</TableHeader>
                            <TableHeader>Item</TableHeader>
                            <TableHeader>Price</TableHeader>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell>{match.order.customer}</TableCell>
                            <TableCell>{match.order.orderId}</TableCell>
                            <TableCell>{match.order.date}</TableCell>
                            <TableCell>{match.order.item}</TableCell>
                            <TableCell>${match.order.price.toFixed(2)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="data-table mt-6">
                    <h3 className="table-title">Matched Transactions</h3>
                    {match.txns.length === 0 ? (
                      <p className="text-gray-500 italic">No matching transactions found</p>
                    ) : (
                      <div className="table-container">
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableHeader>Customer</TableHeader>
                              <TableHeader>Order ID</TableHeader>
                              <TableHeader>Date</TableHeader>
                              <TableHeader>Item</TableHeader>
                              <TableHeader>Price</TableHeader>
                              <TableHeader>Type</TableHeader>
                              <TableHeader>Amount</TableHeader>
                              <TableHeader>Score</TableHeader>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {match.txns.map(({ txn, score }, txnIndex) => (
                              <TableRow key={txnIndex}>
                                <TableCell>{txn.customer}</TableCell>
                                <TableCell>{txn.orderId}</TableCell>
                                <TableCell>{txn.date}</TableCell>
                                <TableCell>{txn.item}</TableCell>
                                <TableCell>${txn.price.toFixed(2)}</TableCell>
                                <TableCell>{txn.txnType}</TableCell>
                                <TableCell>${txn.txnAmount.toFixed(2)}</TableCell>
                                <TableCell>
                                  <span className={`score-badge ${score > 0.8 ? 'score-high' :
                                      score > 0.5 ? 'score-medium' :
                                        'score-low'
                                    }`}>
                                    {(Math.floor(score * 100) / 100).toFixed(2)}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchPage; 