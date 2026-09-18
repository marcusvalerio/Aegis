-- Multi-company tenancy for Aegis
CREATE TABLE "Organization" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

INSERT INTO "Organization" ("id", "name", "slug")
VALUES ('org_default_aegis', 'Empresa principal', 'empresa-principal');

ALTER TABLE "User" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "Forklift" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "ChecklistCategory" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "ChecklistItem" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "Checklist" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "NonConformity" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "MaintenanceOccurrence" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "organizationId" TEXT;

UPDATE "User" SET "organizationId" = 'org_default_aegis' WHERE "organizationId" IS NULL;
UPDATE "Forklift" SET "organizationId" = 'org_default_aegis' WHERE "organizationId" IS NULL;
UPDATE "Checklist" SET "organizationId" = 'org_default_aegis' WHERE "organizationId" IS NULL;
UPDATE "NonConformity" SET "organizationId" = 'org_default_aegis' WHERE "organizationId" IS NULL;
UPDATE "MaintenanceOccurrence" SET "organizationId" = 'org_default_aegis' WHERE "organizationId" IS NULL;
UPDATE "AuditLog" SET "organizationId" = 'org_default_aegis' WHERE "organizationId" IS NULL;

ALTER TABLE "User" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Forklift" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Checklist" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "NonConformity" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "MaintenanceOccurrence" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "AuditLog" ALTER COLUMN "organizationId" SET NOT NULL;

ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Forklift" ADD CONSTRAINT "Forklift_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChecklistCategory" ADD CONSTRAINT "ChecklistCategory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Checklist" ADD CONSTRAINT "Checklist_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NonConformity" ADD CONSTRAINT "NonConformity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MaintenanceOccurrence" ADD CONSTRAINT "MaintenanceOccurrence_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");
CREATE INDEX "Forklift_organizationId_idx" ON "Forklift"("organizationId");
CREATE INDEX "Checklist_organizationId_idx" ON "Checklist"("organizationId");
CREATE INDEX "NonConformity_organizationId_idx" ON "NonConformity"("organizationId");
CREATE INDEX "MaintenanceOccurrence_organizationId_idx" ON "MaintenanceOccurrence"("organizationId");
CREATE INDEX "AuditLog_organizationId_idx" ON "AuditLog"("organizationId");
