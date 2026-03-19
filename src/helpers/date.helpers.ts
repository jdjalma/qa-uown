export function calculateDate(daysFromToday: number | string, allowPast = false): string {
  if (typeof daysFromToday === 'string') {
    if (daysFromToday.toUpperCase() === 'NA') return 'NA';
    if (daysFromToday.toUpperCase() === 'TODAY' || daysFromToday.toUpperCase() === 'CURRENT_DATE') {
      return formatDate(new Date());
    }
    if (daysFromToday.toUpperCase() === 'FIRST_DAY_OF_MONTH') {
      const now = new Date();
      return formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
    }
    daysFromToday = parseInt(daysFromToday, 10);
  }

  if (isNaN(daysFromToday)) return 'NA';

  const target = new Date();
  target.setDate(target.getDate() + daysFromToday);

  if (!allowPast && target < new Date()) {
    return formatDate(new Date());
  }

  return formatDate(target);
}

export function formatDate(date: Date, separator = '/'): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  return separator ? `${mm}${separator}${dd}${separator}${yyyy}` : `${mm}${dd}${yyyy}`;
}

export function formatDateCompact(date: Date): string {
  return formatDate(date, '');
}

/**
 * Returns today + daysFromToday in ISO 8601 format (YYYY-MM-DD).
 * Required for API endpoints that deserialize postingDate as Java LocalDate.
 */
export function calculateDateISO(daysFromToday = 0): string {
  const target = new Date();
  target.setDate(target.getDate() + daysFromToday);
  const yyyy = target.getFullYear();
  const mm = String(target.getMonth() + 1).padStart(2, '0');
  const dd = String(target.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

