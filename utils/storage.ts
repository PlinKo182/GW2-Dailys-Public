import localforage from 'localforage';
export interface CompletedEvent { eventId: string; instanceStartUTC: number; completedAtUTC: number; by: 'user'|'auto'; }
localforage.config({name:'GW2DailyTracker', storeName:'completedEvents'});
export async function saveCompletedEvent(event: CompletedEvent) { const key = `${event.eventId}|${event.instanceStartUTC}`; await localforage.setItem(key, event); }
export async function removeCompletedEvent(event: CompletedEvent) { const key = `${event.eventId}|${event.instanceStartUTC}`; await localforage.removeItem(key); }
export async function getAllCompletedEvents(): Promise<CompletedEvent[]> { const keys = await localforage.keys(); const values = await Promise.all(keys.map(k => localforage.getItem<CompletedEvent>(k))); return values.filter(Boolean) as CompletedEvent[]; }