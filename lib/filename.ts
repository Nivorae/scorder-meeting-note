const RESERVED = /[\\/:*?"<>|]/g;

export function buildExportFilename(restaurantName: string, isoDate: string): string {
  const cleaned = restaurantName.replace(RESERVED, "").replace(/^[\s.]+|[\s.]+$/g, "");
  const name = cleaned.length > 0 ? cleaned : "untitled";
  return `scorder-demo_${isoDate}_${name}.json`;
}

export function todayIsoDate(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}
