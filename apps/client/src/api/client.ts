import { API_CONFIG, API_ENDPOINTS } from './config';
import type { Order, Transaction, Match } from 'xact-matcher-shared';

interface MatchRequest {
  orders: Order[];
  transactions: Transaction[];
}

interface MatchResponse {
  matches: Match[];
}

/**
 * Matches orders with transactions using the API
 */
export async function matchOrdersAndTransactions(request: MatchRequest): Promise<MatchResponse> {
  const response = await fetch(`${API_CONFIG.baseUrl}${API_ENDPOINTS.match}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('Failed to match orders and transactions');
  }

  return response.json();
} 