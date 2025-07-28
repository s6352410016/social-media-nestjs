import { File } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';

export function findFiles(
  id: number,
  prismaService: PrismaService,
): Promise<File[]> {
  return prismaService.file.findMany({
    where: {
      contentId: id,
    },
  });
}
