import { File, Paths } from 'expo-file-system';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import { Transaction, Category, Account } from '../types';

interface ExportOptions {
  startDate?: Date;
  endDate?: Date;
  accountId?: string;
}

function formatDateForCSV(date: Date): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

function formatDateForFilename(date: Date): string {
  return date.toISOString().split('T')[0].replace(/-/g, '');
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function exportTransactionsToCSV(
  transactions: Transaction[],
  categories: Category[],
  accounts: Account[],
  options: ExportOptions = {}
): Promise<void> {
  // Filter by date range if specified
  let filtered = [...transactions];

  if (options.startDate) {
    filtered = filtered.filter((t) => t.date >= options.startDate!);
  }
  if (options.endDate) {
    // Include the full end date
    const endOfDay = new Date(options.endDate);
    endOfDay.setHours(23, 59, 59, 999);
    filtered = filtered.filter((t) => t.date <= endOfDay);
  }
  if (options.accountId) {
    filtered = filtered.filter((t) => t.accountId === options.accountId);
  }

  // Sort by date descending
  filtered.sort((a, b) => b.date.getTime() - a.date.getTime());

  if (filtered.length === 0) {
    throw new Error('No transactions to export in the selected date range');
  }

  // Generate CSV header
  const headers = ['Date', 'Description', 'Category', 'Amount', 'Account', 'Type', 'Notes'];

  // Generate CSV rows
  const rows = filtered.map((tx) => {
    const category = categories.find((c) => c.id === tx.categoryId);
    const account = accounts.find((a) => a.id === tx.accountId);

    // Format amount (negative for expenses, positive for income)
    const amount =
      tx.type === 'income' || tx.type === 'transfer_in' ? tx.amount : -tx.amount;

    return [
      formatDateForCSV(tx.date),
      escapeCSV(tx.description),
      escapeCSV(category?.name || 'Uncategorized'),
      amount.toFixed(2),
      escapeCSV(account?.name || 'Unknown'),
      tx.type,
      escapeCSV(tx.notes || ''),
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');

  // Write to file using new expo-file-system API
  const filename = `transactions_${formatDateForFilename(new Date())}.csv`;
  const file = new File(Paths.cache, filename);

  await file.write(csv);

  // Share the file
  if (await isAvailableAsync()) {
    await shareAsync(file.uri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Transactions',
    });
  } else {
    throw new Error('Sharing is not available on this device');
  }
}

export function getTransactionCountInRange(
  transactions: Transaction[],
  startDate?: Date,
  endDate?: Date
): number {
  let count = 0;
  for (const tx of transactions) {
    if (startDate && tx.date < startDate) continue;
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (tx.date > endOfDay) continue;
    }
    count++;
  }
  return count;
}
