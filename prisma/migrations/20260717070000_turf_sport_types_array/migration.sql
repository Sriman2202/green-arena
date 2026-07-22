-- AlterTable: migrate Turf.sportType (String) to Turf.sportTypes (String[])
ALTER TABLE "Turf" ADD COLUMN "sportTypes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "Turf" SET "sportTypes" = ARRAY["sportType"] WHERE "sportType" IS NOT NULL;

ALTER TABLE "Turf" DROP COLUMN "sportType";

ALTER TABLE "Turf" ALTER COLUMN "sportTypes" DROP DEFAULT;
