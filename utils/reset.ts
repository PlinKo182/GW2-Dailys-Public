import { startOfToday } from 'date-fns';
import { getAllCompletedEvents, removeCompletedEvent } from './storage';
export async function resetDailyIfNeeded() {
  const now = Date.now();
  const startOfDayUTC = startOfToday().getTime();
  if (now >= startOfDayUTC) {
    const completedEvents = await getAllCompletedEvents();
    for (const event of completedEvents) { await removeCompletedEvent(event); }
  }
}