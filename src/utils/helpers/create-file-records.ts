import { ContentType } from "generated/prisma";
import { ICreateFileRecord } from "../types";

export function createFileRecords(
  newFilesName: string[],
  contentId: number,
  contentType: ContentType,
): ICreateFileRecord[] {
  return newFilesName.map((file) => ({
    fileName: file,
    contentId,
    contentType,
  }));
}