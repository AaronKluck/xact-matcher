import { useState, useEffect } from 'react';
import type { Order, Transaction, Match } from 'xact-matcher-shared';
import { mutateString, mutatePrice } from 'xact-matcher-shared';
import Cookies from 'js-cookie';

interface MatchResult {
  matches: Match[];
}

interface OrderFormData {
  customer: string;
  orderId: string;
  date: string;
  item: string;
  price: string;
}

interface TransactionFormData extends OrderFormData {
  txnType: string;
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
      const response = await fetch('http://localhost:3000/api/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orders, transactions }),
      });

      if (!response.ok) {
        throw new Error('Failed to match orders and transactions');
      }

      const data: MatchResult = await response.json();
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
    <div className="bg-white p-6 rounded-lg shadow w-[500px]">
      <h2 className="text-xl font-semibold mb-6">{title}</h2>
      <table className="w-full">
        <tbody className="space-y-4">
          <tr>
            <td className="w-[140px] py-2">
              <label className="text-sm font-medium text-gray-700 text-right block">Customer</label>
            </td>
            <td className="py-2">
              <input
                type="text"
                value={formData.customer}
                onChange={onChange('customer' as keyof T)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </td>
          </tr>
          <tr>
            <td className="w-[140px] py-2">
              <label className="text-sm font-medium text-gray-700 text-right block">Order ID</label>
            </td>
            <td className="py-2">
              <input
                type="text"
                value={formData.orderId}
                onChange={onChange('orderId' as keyof T)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </td>
          </tr>
          <tr>
            <td className="w-[140px] py-2">
              <label className="text-sm font-medium text-gray-700 text-right block">Date</label>
            </td>
            <td className="py-2">
              <input
                type="date"
                value={formData.date}
                onChange={onChange('date' as keyof T)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </td>
          </tr>
          <tr>
            <td className="w-[140px] py-2">
              <label className="text-sm font-medium text-gray-700 text-right block">Item</label>
            </td>
            <td className="py-2">
              <input
                type="text"
                value={formData.item}
                onChange={onChange('item' as keyof T)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </td>
          </tr>
          <tr>
            <td className="w-[140px] py-2">
              <label className="text-sm font-medium text-gray-700 text-right block">Price</label>
            </td>
            <td className="py-2">
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={onChange('price' as keyof T)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </td>
          </tr>
          {isTransaction && (
            <>
              <tr>
                <td className="w-[140px] py-2">
                  <label className="text-sm font-medium text-gray-700 text-right block">Transaction Type</label>
                </td>
                <td className="py-2">
                  <input
                    type="text"
                    value={(formData as TransactionFormData).txnType}
                    onChange={(e) => {
                      const txnForm = formData as TransactionFormData;
                      txnForm.txnType = e.target.value;
                      setTransactionForm({ ...txnForm });
                    }}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </td>
              </tr>
              <tr>
                <td className="w-[140px] py-2">
                  <label className="text-sm font-medium text-gray-700 text-right block">Transaction Amount</label>
                </td>
                <td className="py-2">
                  <input
                    type="number"
                    step="0.01"
                    value={(formData as TransactionFormData).txnAmount}
                    onChange={(e) => {
                      const txnForm = formData as TransactionFormData;
                      txnForm.txnAmount = e.target.value;
                      setTransactionForm({ ...txnForm });
                    }}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </td>
              </tr>
            </>
          )}
        </tbody>
      </table>
      <div className="mt-6 flex justify-end">
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Add {isTransaction ? 'Transaction' : 'Order'}
        </button>
      </div>
    </div>
  );

  const renderDataTable = (
    title: string,
    data: Order[] | Transaction[],
    onRemove: (index: number) => void,
    isTransaction: boolean
  ) => (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              {isTransaction && (
                <>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.customer}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.orderId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.item}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.price.toFixed(2)}</td>
                {isTransaction && (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{(item as Transaction).txnType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${(item as Transaction).txnAmount.toFixed(2)}</td>
                  </>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 space-x-2">
                  <button
                    onClick={() => handleGenerateTransaction(item as Order)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Generate Transaction
                  </button>
                  <button
                    onClick={() => onRemove(index)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-[1200px] mx-auto bg-gray-50">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Order Transaction Matcher</h1>
        <button
          onClick={handleClearAll}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear All Data
        </button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'row', gap: '2rem', justifyContent: 'center' }}>
        <div style={{ flex: '0 0 500px' }}>
          {renderInputForm(
            'Add Order',
            orderForm,
            handleOrderInputChange,
            addOrder,
            false
          )}
        </div>
        
        <div style={{ flex: '0 0 500px' }}>
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
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Orders Table */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Orders</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.customer}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.orderId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.item}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${order.price}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 space-x-2">
                    <button
                      onClick={() => handleGenerateTransaction(order)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Generate Transaction
                    </button>
                    <button
                      onClick={() => removeOrder(index)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {renderDataTable('Transactions', transactions, removeTransaction, true)}

      <div className="mt-6">
        <button
          className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 text-lg"
          onClick={handleMatch}
          disabled={loading || orders.length === 0 || transactions.length === 0}
        >
          {loading ? 'Matching...' : 'Match Orders & Transactions'}
        </button>
      </div>

      {matches.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Matching Results</h2>
          <div className="space-y-6">
            {matches.map((match, index) => (
              <div key={index} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-xl font-semibold">Order {index + 1}</h3>
                </div>
                <div className="p-6">
                  <table className="min-w-full divide-y divide-gray-200 mb-6">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{match.order.customer}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{match.order.orderId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{match.order.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{match.order.item}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${match.order.price.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="mt-6">
                    <h4 className="text-lg font-semibold mb-4 text-gray-700">Matched Transactions</h4>
                    {match.txns.length === 0 ? (
                      <p className="text-gray-500 italic">No matching transactions found</p>
                    ) : (
                      <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {match.txns.map(({ txn, score }, txnIndex) => (
                              <tr key={txnIndex} className={txnIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{txn.customer}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{txn.orderId}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{txn.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{txn.item}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${txn.price.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{txn.txnType}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${txn.txnAmount.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <span className={`px-2 py-1 rounded ${
                                    score > 0.8 ? 'bg-green-100 text-green-800' :
                                    score > 0.5 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {score.toFixed(2)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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