import type { EnergyType, Forklift, ForkliftType } from "@prisma/client";
import { ForkliftImageField } from "@/components/admin/ForkliftImageField";
import { ForkliftFormSubmit } from "@/components/admin/ForkliftFormSubmit";

export function ForkliftForm({
  forklift,
  forkliftTypes,
  energyTypes,
  action,
  submitLabel,
}: {
  forklift?: Forklift;
  forkliftTypes: ForkliftType[];
  energyTypes: EnergyType[];
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
}) {
  return (
    <form action={action} className="max-w-2xl border border-black/10 bg-white p-6">
      <ForkliftImageField initialImageUrl={forklift?.imageUrl} />

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Código / patrimônio" required>
          <input name="code" defaultValue={forklift?.code} required className="input" />
        </Field>
        <Field label="Número de série">
          <input name="serialNumber" defaultValue={forklift?.serialNumber ?? ""} className="input" />
        </Field>
        <Field label="Marca" required>
          <input name="brand" defaultValue={forklift?.brand} required className="input" />
        </Field>
        <Field label="Modelo" required>
          <input name="model" defaultValue={forklift?.model} required className="input" />
        </Field>
        <Field label="Tipo de empilhadeira" required>
          <select name="forkliftTypeId" defaultValue={forklift?.forkliftTypeId} required className="input">
            <option value="">Selecione</option>
            {forkliftTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Tipo de energia" required>
          <select name="energyTypeId" defaultValue={forklift?.energyTypeId} required className="input">
            <option value="">Selecione</option>
            {energyTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Capacidade (kg)" required>
          <input type="number" name="capacityKg" defaultValue={forklift?.capacityKg} required className="input" />
        </Field>
        <Field label="Horímetro">
          <input type="number" step="0.1" name="hourmeter" defaultValue={forklift?.hourmeter ?? 0} className="input" />
        </Field>
        {forklift && (
          <Field label="Ativa">
            <label className="mt-2 flex items-center gap-2 font-aux text-sm text-black/70">
              <input type="checkbox" name="active" defaultChecked={forklift.active} />
              Equipamento ativo (disponível para operação)
            </label>
          </Field>
        )}
      </div>

      <Field label="Observações">
        <textarea name="notes" defaultValue={forklift?.notes ?? ""} rows={3} className="input" />
      </Field>

      <ForkliftFormSubmit label={submitLabel} />
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="mt-4 first:mt-0">
      <label className="font-aux text-xs font-medium uppercase tracking-wide text-black/60">
        {label} {required && <span className="text-red">*</span>}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
