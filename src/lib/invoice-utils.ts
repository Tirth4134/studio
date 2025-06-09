export function generateInvoiceNumber(counter: number): string {
  return `INV-${String(counter).padStart(4, '0')}`;
}

export function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
