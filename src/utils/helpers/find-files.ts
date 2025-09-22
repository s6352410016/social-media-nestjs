import { File } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';

export function findFiles(
  contentId: string,
  prismaService: PrismaService,
): Promise<File[]> {
  return prismaService.file.findMany({
    where: {
      contentId,
    },
  });
}
