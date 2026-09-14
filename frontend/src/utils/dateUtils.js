/**
 * Universal Date Formatting Utilities for Organic Store
 * Formats dates safely for UI display, printable slips, and Excel/CSV spreadsheets.
 */

/**
 * Format date for UI and print sheets (e.g. "11 Sep 2026, 11:07 AM")
 */
export function formatOrderDate(dateVal, includeTime = true) {
  if (!dateVal) return '—';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '—';

  return d.toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit', hour12: true } : {}),
  });
}

/**
 * Formats date strictly for CSV / Excel exports.
 * Uses "DD-MMM-YYYY hh:mm AM/PM" (e.g. "11-Sep-2026 11:07 AM") so spreadsheet
 * software will never confuse DD/MM with MM/DD regardless of system locale.
 */
export function formatDateForCsv(dateVal) {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const strHours = String(hours).padStart(2, '0');

  return `${day}-${month}-${year} ${strHours}:${minutes} ${ampm}`;
}

/**
 * Format simple short date (e.g. "Sep 11, 2026")
 */
export function formatSimpleDate(dateVal) {
  if (!dateVal) return '—';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '—';

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
