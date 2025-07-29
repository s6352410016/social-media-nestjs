export function getDirFromPresignedUrl(url: string): string {
  const pathname = new URL(url).pathname;
  const parts = pathname.slice(1).split('/');
  return parts.shift()!;
}