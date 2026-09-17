import { Badge } from "@/components/ui/Badge";
import type { ForkliftStatus, NonConformityStatus, Severity } from "@/lib/types";

const FORKLIFT_STATUS_LABEL: Record<ForkliftStatus, string> = {
  LIBERADA: "Liberada",
  RESTRICAO: "Restrição",
  BLOQUEADA: "Bloqueada",
};

const FORKLIFT_STATUS_TONE: Record<ForkliftStatus, "green" | "yellow" | "red"> = {
  LIBERADA: "green",
  RESTRICAO: "yellow",
  BLOQUEADA: "red",
};

export function ForkliftStatusBadge({ status }: { status: ForkliftStatus }) {
  return <Badge tone={FORKLIFT_STATUS_TONE[status]}>{FORKLIFT_STATUS_LABEL[status]}</Badge>;
}

const SEVERITY_LABEL: Record<Severity, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  CRITICA: "Crítica",
};

const SEVERITY_TONE: Record<Severity, "green" | "yellow" | "red" | "black"> = {
  BAIXA: "green",
  MEDIA: "yellow",
  ALTA: "red",
  CRITICA: "black",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <Badge tone={SEVERITY_TONE[severity]}>{SEVERITY_LABEL[severity]}</Badge>;
}

const NC_STATUS_LABEL: Record<NonConformityStatus, string> = {
  ABERTA: "Aberta",
  EM_TRATAMENTO: "Em tratamento",
  RESOLVIDA: "Resolvida",
  CANCELADA: "Cancelada",
};

const NC_STATUS_TONE: Record<NonConformityStatus, "red" | "yellow" | "green" | "neutral"> = {
  ABERTA: "red",
  EM_TRATAMENTO: "yellow",
  RESOLVIDA: "green",
  CANCELADA: "neutral",
};

export function NonConformityStatusBadge({ status }: { status: NonConformityStatus }) {
  return <Badge tone={NC_STATUS_TONE[status]}>{NC_STATUS_LABEL[status]}</Badge>;
}
