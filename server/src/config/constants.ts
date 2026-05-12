export const STUDENT_EMAIL_DOMAIN = 'campus.ca';

export const toBookingDate = (dateStr: string): Date =>
  new Date(dateStr + 'T00:00:00.000Z');
