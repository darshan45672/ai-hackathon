-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."ApplicationStatus" ADD VALUE 'TARGET_AUDIENCE_REVIEW';
ALTER TYPE "public"."ApplicationStatus" ADD VALUE 'BUSINESS_OUTCOME_REVIEW';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."ReviewType" ADD VALUE 'TARGET_AUDIENCE_ANALYSIS';
ALTER TYPE "public"."ReviewType" ADD VALUE 'BUSINESS_OUTCOME_ANALYSIS';

-- AlterTable
ALTER TABLE "public"."applications" ADD COLUMN     "businessOutcome" TEXT,
ADD COLUMN     "targetAudience" TEXT;
