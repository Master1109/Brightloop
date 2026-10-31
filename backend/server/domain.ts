export function money(value: number) { if (!Number.isFinite(value) || value < 0) throw new Error('Amount must be non-negative'); return Math.round(value * 100); }
export function totals(unit: number, quantity: number, tax: number, discount = 0) {
  if (!Number.isInteger(quantity) || quantity < 1 || tax < 0 || tax > 100 || discount < 0) throw new Error('Invalid billing inputs');
  const subtotal = money(unit) * quantity;
  const deducted = Math.min(subtotal, money(discount));
  const taxes = Math.round((subtotal - deducted) * tax / 100);
  return {subtotal: subtotal / 100, discount: deducted / 100, tax: taxes / 100, total: (subtotal - deducted + taxes) / 100};
}
export function nextPeriod(value: string, frequency: string, anchor?: number) {
  const date = new Date(value); if (!Number.isFinite(date.getTime())) throw new Error('Invalid billing date');
  const day = anchor ?? date.getUTCDate();
  if (frequency === 'Daily') date.setUTCDate(date.getUTCDate() + 1);
  else if (frequency === 'Weekly') date.setUTCDate(date.getUTCDate() + 7);
  else { date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() + (frequency === 'Yearly' ? 12 : 1)); const max = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate(); date.setUTCDate(Math.min(day, max)); }
  return date.toISOString().slice(0, 10);
}
export const transitions: Record<string,string[]> = {Draft:['Quotation'],Quotation:['Confirmed','Closed'],Confirmed:['Active','Closed'],Active:['Paused','Closed'],Paused:['Active','Closed'],Closed:[]};
