export function getFileDirFromPresignedUrl(url: string): string {
  const urlObj = new URL(url);
  const part = urlObj.pathname.substring(1);
  return part.split('/').shift()!;
}