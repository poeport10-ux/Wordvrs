export function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ").trim();
  if (!text) return 0;
  return text.split(/\s+/).length;
}

export function uniqueSlug(base: string, suffix: string): string {
  const cleaned = base
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${cleaned || "book"}-${suffix}`;
}
