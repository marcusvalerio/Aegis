-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ForkliftType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "EnergyType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Forklift" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "serialNumber" TEXT,
    "forkliftTypeId" TEXT NOT NULL,
    "energyTypeId" TEXT NOT NULL,
    "capacityKg" INTEGER NOT NULL,
    "hourmeter" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'LIBERADA',
    "imageUrl" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Forklift_forkliftTypeId_fkey" FOREIGN KEY ("forkliftTypeId") REFERENCES "ForkliftType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Forklift_energyTypeId_fkey" FOREIGN KEY ("energyTypeId") REFERENCES "EnergyType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChecklistCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "appliesToAllTypes" BOOLEAN NOT NULL DEFAULT true,
    "appliesToAllEnergies" BOOLEAN NOT NULL DEFAULT true,
    "requiresPhoto" TEXT NOT NULL DEFAULT 'OPCIONAL',
    "requiresNote" BOOLEAN NOT NULL DEFAULT true,
    "defaultSeverity" TEXT NOT NULL DEFAULT 'MEDIA',
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ChecklistItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ChecklistCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ChecklistItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ChecklistItem_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChecklistItemForkliftType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "forkliftTypeId" TEXT NOT NULL,
    CONSTRAINT "ChecklistItemForkliftType_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ChecklistItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChecklistItemForkliftType_forkliftTypeId_fkey" FOREIGN KEY ("forkliftTypeId") REFERENCES "ForkliftType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChecklistItemEnergyType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "energyTypeId" TEXT NOT NULL,
    CONSTRAINT "ChecklistItemEnergyType_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ChecklistItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChecklistItemEnergyType_energyTypeId_fkey" FOREIGN KEY ("energyTypeId") REFERENCES "EnergyType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SeverityRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "severity" TEXT NOT NULL,
    "effect" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Checklist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "forkliftId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "hourmeter" REAL,
    "status" TEXT NOT NULL DEFAULT 'EM_ANDAMENTO',
    "resultStatus" TEXT,
    "templateSnapshot" TEXT NOT NULL,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "conformCount" INTEGER NOT NULL DEFAULT 0,
    "nonConformCount" INTEGER NOT NULL DEFAULT 0,
    "naCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    CONSTRAINT "Checklist_forkliftId_fkey" FOREIGN KEY ("forkliftId") REFERENCES "Forklift" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Checklist_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChecklistAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "checklistId" TEXT NOT NULL,
    "snapshotItemId" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "itemLabel" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "answeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChecklistAnswer_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "Checklist" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NonConformity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "checklistId" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "forkliftId" TEXT NOT NULL,
    "itemLabel" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    "resolvedById" TEXT,
    "resolutionNotes" TEXT,
    CONSTRAINT "NonConformity_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "Checklist" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NonConformity_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "ChecklistAnswer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NonConformity_forkliftId_fkey" FOREIGN KEY ("forkliftId") REFERENCES "Forklift" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "NonConformity_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nonConformityId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attachment_nonConformityId_fkey" FOREIGN KEY ("nonConformityId") REFERENCES "NonConformity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaintenanceOccurrence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "forkliftId" TEXT NOT NULL,
    "nonConformityId" TEXT,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    CONSTRAINT "MaintenanceOccurrence_forkliftId_fkey" FOREIGN KEY ("forkliftId") REFERENCES "Forklift" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceOccurrence_nonConformityId_fkey" FOREIGN KEY ("nonConformityId") REFERENCES "NonConformity" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ForkliftType_key_key" ON "ForkliftType"("key");

-- CreateIndex
CREATE UNIQUE INDEX "EnergyType_key_key" ON "EnergyType"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Forklift_code_key" ON "Forklift"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistItemForkliftType_itemId_forkliftTypeId_key" ON "ChecklistItemForkliftType"("itemId", "forkliftTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistItemEnergyType_itemId_energyTypeId_key" ON "ChecklistItemEnergyType"("itemId", "energyTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "SeverityRule_severity_key" ON "SeverityRule"("severity");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistAnswer_checklistId_snapshotItemId_key" ON "ChecklistAnswer"("checklistId", "snapshotItemId");

-- CreateIndex
CREATE UNIQUE INDEX "NonConformity_answerId_key" ON "NonConformity"("answerId");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceOccurrence_nonConformityId_key" ON "MaintenanceOccurrence"("nonConformityId");
