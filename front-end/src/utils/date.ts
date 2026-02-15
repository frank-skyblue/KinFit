/** Format date for display in list views (e.g. "Jan 15, 2025") */
export const formatDateShort = (dateString: string): string =>
  new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

/** Format date with weekday for detail views (e.g. "Monday, January 15, 2025") */
export const formatDateLong = (dateString: string): string =>
  new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

/** Format date with short weekday (e.g. "Mon, Jan 15, 2025") */
export const formatDateWithWeekday = (dateString: string): string =>
  new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
