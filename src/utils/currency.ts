import { Store } from '../types';

export function formatCurrency(value: number, store?: Store | null): string {
  const symbol = store?.currency_symbol || 'R$';
  return `${symbol} ${value.toFixed(2)}`;
}