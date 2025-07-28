-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "parent_id" INTEGER;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
