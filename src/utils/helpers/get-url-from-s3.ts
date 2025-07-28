export function getUrlFromS3(
  newFilesName: string[],
  bucketName: string,
  bucketRegion: string,
  path: string,
): string[] {
  return newFilesName.map((newFileName) => `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${path}/${newFileName}`);
}