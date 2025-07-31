import { FileDir } from "../types";

export function getFileDirFromFile(
  file: Express.Multer.File,
): FileDir {
  return file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/webp'
    ? 'post-image'
    : 'post-video';
}
