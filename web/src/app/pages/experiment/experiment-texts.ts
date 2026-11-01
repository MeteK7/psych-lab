import { N1Today } from '../../api/types';

/** One line about today's experiment day, for the Home callout. */
export function experimentTodayLine(t: N1Today): string {
  switch (t.status) {
    case 'pending':
      return `Today: planned for ${t.plan?.planned_start}.`;
    case 'revealed':
      return "Today's exercise has been picked.";
    case 'session':
      return t.session?.status === 'in_progress'
        ? "Today's exercise is in progress."
        : "Today's exercise is done.";
    case 'ineligible':
    case 'late_barrier':
      return 'Today is marked as a day off.';
    default:
      return "Today isn't an experiment day.";
  }
}
