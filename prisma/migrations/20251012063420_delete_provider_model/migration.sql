/*
  Warnings:

  - You are about to drop the `providers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "providers" DROP CONSTRAINT "providers_user_id_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "provider_type" "provider_type" NOT NULL DEFAULT 'LOCAL';

-- DropTable
DROP TABLE "providers";
