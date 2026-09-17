export type Role = "ADMIN" | "OPERADOR";

export type AnswerValue = "CONFORME" | "NAO_CONFORME" | "NA";

export type Severity = "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";

export type SeverityEffect = "PERMITE" | "RESTRINGE" | "BLOQUEIA";

export type ForkliftStatus = "LIBERADA" | "RESTRICAO" | "BLOQUEADA";

export type RequiresPhoto = "NUNCA" | "OPCIONAL" | "OBRIGATORIA_NC";

export type ChecklistStatus = "EM_ANDAMENTO" | "CONCLUIDO";

export type NonConformityStatus = "ABERTA" | "EM_TRATAMENTO" | "RESOLVIDA" | "CANCELADA";

export interface SnapshotItem {
  snapshotItemId: string;
  sourceItemId: string;
  label: string;
  question: string;
  order: number;
  requiresPhoto: RequiresPhoto;
  requiresNote: boolean;
  defaultSeverity: Severity;
}

export interface SnapshotCategory {
  categoryId: string;
  name: string;
  order: number;
  items: SnapshotItem[];
}

export interface ChecklistSnapshot {
  assembledAt: string;
  forkliftId: string;
  forkliftCode: string;
  forkliftTypeName: string;
  energyTypeName: string;
  categories: SnapshotCategory[];
}
