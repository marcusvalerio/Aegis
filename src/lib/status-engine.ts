import { db } from "@/lib/db";
import type { ForkliftStatus, Severity, SeverityEffect } from "@/lib/types";

const DEFAULT_RULES: Record<Severity, SeverityEffect> = {
  BAIXA: "PERMITE",
  MEDIA: "PERMITE",
  ALTA: "RESTRINGE",
  CRITICA: "BLOQUEIA",
};

/**
 * The mapping between non-conformity severity and its operational effect is
 * configuration, not a hardcoded UI rule (see spec 21). Admins can change it
 * via SeverityRule; if a level isn't configured yet we fall back to a sane
 * default so the system works out of the box.
 */
export async function getSeverityRules(): Promise<Record<Severity, SeverityEffect>> {
  const rules = await db.severityRule.findMany();
  const map = { ...DEFAULT_RULES };
  for (const rule of rules) {
    map[rule.severity as Severity] = rule.effect as SeverityEffect;
  }
  return map;
}

export async function computeForkliftStatus(severities: Severity[]): Promise<ForkliftStatus> {
  if (severities.length === 0) return "LIBERADA";

  const rules = await getSeverityRules();
  const effects = severities.map((s) => rules[s]);

  if (effects.includes("BLOQUEIA")) return "BLOQUEADA";
  if (effects.includes("RESTRINGE")) return "RESTRICAO";
  return "LIBERADA";
}
