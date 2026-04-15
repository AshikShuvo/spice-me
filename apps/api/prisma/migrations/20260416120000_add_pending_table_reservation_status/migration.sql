-- AlterEnum
ALTER TYPE "TableReservationStatus" ADD VALUE 'PENDING';

-- AlterTable
ALTER TABLE "TableReservation" ALTER COLUMN "status" SET DEFAULT 'PENDING';
