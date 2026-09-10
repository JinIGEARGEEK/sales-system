// Converts the Quote editor's local row shape (QuoteItemRow — string|null
// product_id, a UI-only `key`/`kind`) into the QuoteItem[] shape the API
// expects (number|null product_id). Previously hand-rolled identically at
// three call sites (pages/crm/quotes/create.vue's create payload and its
// Quote-Template apply path, pages/crm/quotes/[id].vue's buildUpdatePayload
// and its Save-as-Template handler) — a future QuoteItem field would
// otherwise need updating in three places with nothing to catch a missed one.
//
// Not a reactive composable (no refs/lifecycle) — named/placed like one
// anyway so it's auto-imported the same way every other composables/utils/*
// helper is, same convention as useQuoteTotals.
export const serializeQuoteItems = (items: QuoteItemRow[]): QuoteItem[] =>
  items.map(({ description, qty, price, product_id, discount_percent }) => ({
    description, qty, price, product_id: product_id ? Number(product_id) : null, discount_percent,
  }))
