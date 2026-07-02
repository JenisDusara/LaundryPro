// Single source of truth for "is this entry delivered?".
// The backend keeps entry.delivery_status in sync with its items, but item statuses are
// the ground truth (a partially-delivered entry is not fully delivered). Falling back to
// delivery_status handles entries fetched without their items included.

type ItemLike = { item_status: string };
type EntryLike = { delivery_status: string; items?: ItemLike[] | null };

export function isEntryDelivered(entry: EntryLike): boolean {
  if (entry.items && entry.items.length > 0) {
    return entry.items.every(i => i.item_status === "delivered");
  }
  return entry.delivery_status === "delivered";
}

export function isEntryPending(entry: EntryLike): boolean {
  return !isEntryDelivered(entry);
}
