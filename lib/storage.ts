// lib/storage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "events";
export type EventItem = { id:string; time:string; label:string; text:string; audioUri?:string; topk?: {raw_label:string; confidence:number}[] };

export async function loadEvents(): Promise<EventItem[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveEvents(list: EventItem[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function addEvent(e: EventItem) {
  const list = await loadEvents();
  list.unshift(e);
  await saveEvents(list);
  return list;
}

// ⭐ 新增：清空所有事件
export async function clearEvents() {
  await AsyncStorage.removeItem(KEY);
}
