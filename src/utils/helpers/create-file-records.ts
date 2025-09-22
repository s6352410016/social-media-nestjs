import { ContentType } from "generated/prisma";
import { ICreateFileRecord } from "../types";

export function createFileRecords(
  newFilesName: string[],
  contentId: string,
  contentType: ContentType,
): ICreateFileRecord[] {
  return newFilesName.map((file) => ({
    fileUrl: file,
    contentId,
    contentType,
  }));
}