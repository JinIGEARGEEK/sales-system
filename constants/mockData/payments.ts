export const PAYMENT_METHOD_OPTIONS: Select[] = [
  { label: 'Cash', value: 'cash' },
  { label: 'Bank Transfer', value: 'transfer' },
  { label: 'Card', value: 'card' },
  { label: 'Other', value: 'other' },
]

export const MOCK_PAYMENTS: Payment[] = [
  { id: 1, deal_id: 4, amount: 270000, paid_at: new Date('2025-07-05'), method: 'transfer', note: 'Deposit (50%)' },
  { id: 2, deal_id: 4, amount: 270000, paid_at: new Date('2025-08-01'), method: 'transfer', note: 'Final payment on delivery' },
  { id: 3, deal_id: 1, amount: 200000, paid_at: new Date('2025-06-01'), method: 'transfer', note: 'Deposit' },
]
