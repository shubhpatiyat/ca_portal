export function brandInitials(name: string): string {
  const words = name
    .replace(/&/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  if (!words.length) {
    return "CA";
  }

  const preferred = words.filter((word) => !["and", "associates", "co", "llp", "pvt", "ltd"].includes(word.toLowerCase()));
  const source = preferred.length ? preferred : words;
  return source
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function brandFaviconUrl(name: string): string {
  return `/api/brand/favicon?name=${encodeURIComponent(name)}`;
}
