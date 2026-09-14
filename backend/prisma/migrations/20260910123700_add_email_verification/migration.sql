-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "verificationToken" TEXT,
ADD COLUMN IF NOT EXISTS "verificationExpires" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_verificationToken_key" ON "User"("verificationToken");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_verificationToken_idx" ON "User"("verificationToken");
