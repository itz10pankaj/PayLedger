export function formatRupees(amountMinor: number): string {
  const rupees = amountMinor / 100;
  return rupees.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
}
