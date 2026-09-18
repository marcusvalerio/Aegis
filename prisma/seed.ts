import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// Reference data required for the app to function at all (forklift types,
// energy types, the base checklist template, severity rules). This always
// runs. Demo users/equipment are opt-in via SEED_DEMO_DATA so a production
// seed doesn't create a known admin/operador login with a shared password.
const SEED_DEMO_DATA = process.env.SEED_DEMO_DATA === "true";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@aegis.com";
const ADMIN_NAME = process.env.ADMIN_NAME ?? "Administrador";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ORGANIZATION_NAME = process.env.ORGANIZATION_NAME ?? "Empresa principal";
const ORGANIZATION_SLUG = process.env.ORGANIZATION_SLUG ?? "empresa-principal";

const MIN_PASSWORD_LENGTH = 12;

async function main() {
  // No fallback password, ever — not even in SEED_DEMO_DATA mode. A
  // hardcoded literal here would be a known credential baked into source
  // control, exactly the failure mode this seed script must not have.
  if (!ADMIN_PASSWORD) {
    throw new Error(
      "ADMIN_PASSWORD não definida. Defina uma senha forte para o admin de bootstrap: " +
        "ADMIN_PASSWORD='...' npm run seed",
    );
  }
  if (ADMIN_PASSWORD.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`ADMIN_PASSWORD precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
  }

  const organization = await db.organization.upsert({
    where: { slug: ORGANIZATION_SLUG },
    update: { name: ORGANIZATION_NAME },
    create: { name: ORGANIZATION_NAME, slug: ORGANIZATION_SLUG },
  });

  const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  // update: {} means an existing admin's passwordHash is never touched by
  // re-running the seed — only a brand-new row gets this hash.
  const admin = await db.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { organizationId: organization.id },
    create: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      organizationId: organization.id,
    },
  });

  if (SEED_DEMO_DATA) {
    const demoPassword = process.env.DEMO_PASSWORD;
    if (!demoPassword) {
      throw new Error(
        "SEED_DEMO_DATA=true requer DEMO_PASSWORD (senha para os operadores de demonstração): " +
          "DEMO_PASSWORD='...' SEED_DEMO_DATA=true npm run seed",
      );
    }
    const demoPasswordHash = await bcrypt.hash(demoPassword, 10);
    await db.user.upsert({
      where: { email: "operador@aegis.com" },
      update: { organizationId: organization.id },
      create: { name: "João Silva", email: "operador@aegis.com", passwordHash: demoPasswordHash, role: "OPERADOR", organizationId: organization.id },
    });
    await db.user.upsert({
      where: { email: "carlos@aegis.com" },
      update: { organizationId: organization.id },
      create: { name: "Carlos Souza", email: "carlos@aegis.com", passwordHash: demoPasswordHash, role: "OPERADOR", organizationId: organization.id },
    });
  }

  const forkliftTypes = await Promise.all(
    [
      { key: "CONTRABALANCADA", name: "Empilhadeira contrabalançada" },
      { key: "RETRATIL", name: "Empilhadeira retrátil" },
      { key: "PALETEIRA_ELETRICA", name: "Paleteira elétrica" },
      { key: "PALETEIRA_MANUAL", name: "Paleteira manual" },
    ].map((t) => db.forkliftType.upsert({ where: { key: t.key }, update: {}, create: t } )),
  );

  const energyTypes = await Promise.all(
    [
      { key: "ELETRICA", name: "Elétrica" },
      { key: "GLP", name: "GLP" },
      { key: "DIESEL", name: "Diesel" },
      { key: "GASOLINA", name: "Gasolina" },
      { key: "NAO_APLICAVEL", name: "Não aplicável (manual)" },
    ].map((t) => db.energyType.upsert({ where: { key: t.key }, update: {}, create: t } )),
  );

  const type = (key: string) => forkliftTypes.find((t) => t.key === key)!;
  const energy = (key: string) => energyTypes.find((t) => t.key === key)!;

  await db.severityRule.upsert({
    where: { severity: "BAIXA" },
    update: {},
    create: { severity: "BAIXA", effect: "PERMITE" },
  });
  await db.severityRule.upsert({
    where: { severity: "MEDIA" },
    update: {},
    create: { severity: "MEDIA", effect: "PERMITE" },
  });
  await db.severityRule.upsert({
    where: { severity: "ALTA" },
    update: {},
    create: { severity: "ALTA", effect: "RESTRINGE" },
  });
  await db.severityRule.upsert({
    where: { severity: "CRITICA" },
    update: {},
    create: { severity: "CRITICA", effect: "BLOQUEIA" },
  });

  const categoryDefs: {
    name: string;
    items: {
      label: string;
      question: string;
      severity?: string;
      typeKeys?: string[];
      energyKeys?: string[];
      appliesToAllTypes?: boolean;
      appliesToAllEnergies?: boolean;
    }[];
  }[] = [
    {
      name: "Segurança Geral",
      items: [
        { label: "Placa de identificação", question: "A placa de identificação/capacidade está legível?" },
        { label: "Sinalizações e adesivos", question: "As sinalizações e adesivos de segurança estão em boas condições?" },
        { label: "Cinto de segurança", question: "O cinto de segurança apresenta boas condições?", severity: "ALTA" },
        { label: "Banco do operador", question: "O banco do operador está em boas condições?" },
        { label: "Espelhos retrovisores", question: "Os espelhos retrovisores estão presentes e íntegros?" },
        { label: "Proteção superior", question: "A proteção superior apresenta boas condições?", severity: "ALTA" },
        { label: "Proteções do operador", question: "As proteções do operador estão íntegras?", severity: "ALTA" },
        { label: "Estado geral da estrutura", question: "A estrutura não apresenta trincas, corrosão ou danos visíveis?", severity: "ALTA" },
      ],
    },
    {
      name: "Sistema de Elevação",
      items: [
        { label: "Garfos", question: "Os garfos não apresentam trincas, desgaste excessivo ou deformação?", severity: "CRITICA" },
        { label: "Travas dos garfos", question: "As travas dos garfos estão funcionando corretamente?", severity: "ALTA" },
        { label: "Mastro", question: "O mastro está em boas condições, sem deformações?", severity: "CRITICA" },
        { label: "Correntes de elevação", question: "As correntes de elevação estão em boas condições?", severity: "ALTA", typeKeys: ["CONTRABALANCADA", "RETRATIL"] },
        { label: "Rolamentos/roletes", question: "Rolamentos e roletes giram livremente, sem folgas?" },
        { label: "Cilindros hidráulicos", question: "Os cilindros hidráulicos não apresentam vazamentos ou danos?", severity: "ALTA" },
        { label: "Mangueiras hidráulicas", question: "As mangueiras hidráulicas estão íntegras, sem ressecamento?" },
        { label: "Vazamentos", question: "Não há vazamentos visíveis no sistema hidráulico?", severity: "ALTA" },
        { label: "Sistema de elevação", question: "O sistema de elevação sobe corretamente e sem ruídos anormais?", severity: "CRITICA" },
        { label: "Sistema de descida", question: "O sistema de descida funciona de forma suave e controlada?", severity: "CRITICA" },
        { label: "Inclinação do mastro", question: "O sistema de inclinação do mastro funciona corretamente?" },
      ],
    },
    {
      name: "Rodagem",
      items: [
        { label: "Pneus", question: "Os pneus estão em boas condições, sem cortes profundos?" },
        { label: "Rodas", question: "As rodas estão firmes e sem danos?" },
        { label: "Porcas e parafusos", question: "Porcas e parafusos das rodas estão apertados e completos?" },
        { label: "Desgaste dos pneus", question: "O desgaste dos pneus está dentro do aceitável?" },
        { label: "Danos ou deformações", question: "Não há danos ou deformações aparentes na rodagem?" },
      ],
    },
    {
      name: "Freios",
      items: [
        { label: "Freio de serviço", question: "O freio de serviço responde corretamente ao acionamento?", severity: "CRITICA" },
        { label: "Freio de estacionamento", question: "O freio de estacionamento trava firmemente o equipamento?", severity: "CRITICA" },
        { label: "Pedal de freio", question: "O pedal de freio não apresenta folga excessiva?", severity: "ALTA" },
        { label: "Funcionamento geral", question: "O funcionamento geral dos freios está adequado?", severity: "ALTA" },
      ],
    },
    {
      name: "Elétrica e Sinalização",
      items: [
        { label: "Faróis", question: "Os faróis estão funcionando corretamente?" },
        { label: "Lanternas", question: "As lanternas estão funcionando corretamente?" },
        { label: "Luz de ré", question: "A luz de ré está funcionando corretamente?" },
        { label: "Giroflex", question: "O giroflex está funcionando corretamente?", severity: "ALTA" },
        { label: "Buzina", question: "A buzina está funcionando corretamente?", severity: "ALTA" },
        { label: "Alarme de ré", question: "O alarme sonoro de ré está funcionando corretamente?", severity: "ALTA" },
        { label: "Painel e indicadores", question: "O painel e os indicadores estão funcionando corretamente?" },
        { label: "Sinalizações luminosas", question: "As sinalizações luminosas estão operantes?" },
      ],
    },
    {
      name: "Comandos e Direção",
      items: [
        { label: "Volante / direção", question: "O volante/direção responde sem folgas excessivas?", severity: "ALTA" },
        { label: "Pedais", question: "Os pedais retornam corretamente após o acionamento?" },
        { label: "Alavancas", question: "As alavancas de comando funcionam sem travamentos?" },
        { label: "Comandos hidráulicos", question: "Os comandos hidráulicos respondem corretamente?" },
        { label: "Chave de ignição", question: "A chave de ignição/partida funciona corretamente?" },
        { label: "Funcionamento do painel", question: "O painel de instrumentos funciona corretamente?" },
      ],
    },
    {
      name: "Energia / Combustível",
      items: [
        // Elétrica
        { label: "Estado da bateria", question: "A bateria apresenta boas condições, sem danos?", severity: "ALTA", appliesToAllTypes: true, energyKeys: ["ELETRICA"] },
        { label: "Cabos", question: "Os cabos da bateria estão íntegros, sem exposição de fios?", energyKeys: ["ELETRICA"] },
        { label: "Conectores", question: "Os conectores estão firmes e sem sinais de superaquecimento?", energyKeys: ["ELETRICA"] },
        { label: "Indicador de carga", question: "O indicador de carga funciona corretamente?", energyKeys: ["ELETRICA"] },
        { label: "Fixação da bateria", question: "A bateria está corretamente fixada?", severity: "ALTA", energyKeys: ["ELETRICA"] },
        { label: "Danos ou vazamentos (bateria)", question: "Não há sinais de danos ou vazamentos na bateria?", severity: "ALTA", energyKeys: ["ELETRICA"] },
        // GLP
        { label: "Cilindro fixado", question: "O cilindro de GLP está corretamente fixado?", severity: "CRITICA", energyKeys: ["GLP"] },
        { label: "Estado do cilindro", question: "O cilindro de GLP está em boas condições, sem amassados?", severity: "ALTA", energyKeys: ["GLP"] },
        { label: "Mangueira (GLP)", question: "A mangueira de GLP está íntegra, sem ressecamento?", severity: "ALTA", energyKeys: ["GLP"] },
        { label: "Conexões (GLP)", question: "As conexões do sistema de GLP estão firmes?", energyKeys: ["GLP"] },
        { label: "Ausência de vazamentos (GLP)", question: "Não há indícios de vazamento de gás?", severity: "CRITICA", energyKeys: ["GLP"] },
        { label: "Válvulas e componentes", question: "Válvulas e componentes aparentes estão em boas condições?", energyKeys: ["GLP"] },
        // Diesel
        { label: "Condição do sistema", question: "O sistema está conforme o procedimento da empresa?", energyKeys: ["DIESEL"] },
        { label: "Mangueiras (Diesel)", question: "As mangueiras de combustível estão íntegras?", severity: "ALTA", energyKeys: ["DIESEL"] },
        { label: "Vazamentos (Diesel)", question: "Não há vazamentos de combustível ou óleo?", severity: "ALTA", energyKeys: ["DIESEL"] },
        { label: "Sistema de combustível (Diesel)", question: "O sistema de combustível funciona corretamente?", energyKeys: ["DIESEL"] },
        { label: "Sistema de arrefecimento (Diesel)", question: "O sistema de arrefecimento está com nível e funcionamento adequados?", severity: "ALTA", energyKeys: ["DIESEL"] },
        { label: "Compartimento do motor (Diesel)", question: "O compartimento do motor está em boas condições gerais?", energyKeys: ["DIESEL"] },
        // Gasolina
        { label: "Condição do sistema (Gasolina)", question: "O sistema está conforme o procedimento da empresa?", energyKeys: ["GASOLINA"] },
        { label: "Mangueiras (Gasolina)", question: "As mangueiras de combustível estão íntegras?", severity: "ALTA", energyKeys: ["GASOLINA"] },
        { label: "Vazamentos (Gasolina)", question: "Não há vazamentos de combustível ou óleo?", severity: "ALTA", energyKeys: ["GASOLINA"] },
        { label: "Sistema de combustível (Gasolina)", question: "O sistema de combustível funciona corretamente?", energyKeys: ["GASOLINA"] },
        { label: "Sistema de arrefecimento (Gasolina)", question: "O sistema de arrefecimento está com nível e funcionamento adequados?", severity: "ALTA", energyKeys: ["GASOLINA"] },
        { label: "Compartimento do motor (Gasolina)", question: "O compartimento do motor está em boas condições gerais?", energyKeys: ["GASOLINA"] },
      ],
    },
    {
      name: "Estado Geral",
      items: [
        { label: "Limpeza geral", question: "O equipamento está em condições adequadas de limpeza?" },
        { label: "Vazamentos de óleo", question: "Não há vazamentos de óleo no chão sob o equipamento?", severity: "ALTA" },
        { label: "Ruídos anormais", question: "O equipamento não emite ruídos anormais em operação?", severity: "ALTA" },
        { label: "Documentação a bordo", question: "A documentação obrigatória está disponível no equipamento?" },
      ],
    },
  ];

  const existingCategories = await db.checklistCategory.count();
  if (existingCategories === 0) {
    for (let ci = 0; ci < categoryDefs.length; ci++) {
      const def = categoryDefs[ci];
      const category = await db.checklistCategory.create({
        data: { name: def.name, order: ci },
      });

      for (let ii = 0; ii < def.items.length; ii++) {
        const itemDef = def.items[ii];
        const appliesToAllTypes = itemDef.appliesToAllTypes ?? !itemDef.typeKeys;
        const appliesToAllEnergies = !itemDef.energyKeys;

        await db.checklistItem.create({
          data: {
            categoryId: category.id,
            label: itemDef.label,
            question: itemDef.question,
            order: ii,
            defaultSeverity: itemDef.severity ?? "MEDIA",
            requiresPhoto: (itemDef.severity === "CRITICA" || itemDef.severity === "ALTA") ? "OBRIGATORIA_NC" : "OPCIONAL",
            requiresNote: true,
            appliesToAllTypes,
            appliesToAllEnergies,
            createdById: admin.id,
            updatedById: admin.id,
            typeLinks: itemDef.typeKeys
              ? { create: itemDef.typeKeys.map((k) => ({ forkliftTypeId: type(k).id })) }
              : undefined,
            energyLinks: itemDef.energyKeys
              ? { create: itemDef.energyKeys.map((k) => ({ energyTypeId: energy(k).id })) }
              : undefined,
          },
        });
      }
    }
  }

  if (SEED_DEMO_DATA) {
    const forklifts = [
      {
        code: "EMP-001",
        brand: "Toyota",
        model: "8FG25",
        serialNumber: "TY8FG25-0001",
        forkliftTypeId: type("CONTRABALANCADA").id,
        energyTypeId: energy("GLP").id,
        capacityKg: 2500,
        hourmeter: 4812,
      },
      {
        code: "EMP-002",
        brand: "Hyster",
        model: "P2.0",
        serialNumber: "HY-P20-0002",
        forkliftTypeId: type("PALETEIRA_ELETRICA").id,
        energyTypeId: energy("ELETRICA").id,
        capacityKg: 2000,
        hourmeter: 1230,
      },
      {
        code: "EMP-003",
        brand: "Toyota",
        model: "8FBR15",
        serialNumber: "TY8FBR15-0003",
        forkliftTypeId: type("RETRATIL").id,
        energyTypeId: energy("ELETRICA").id,
        capacityKg: 1500,
        hourmeter: 2481,
      },
      {
        code: "EMP-004",
        brand: "Paletrans",
        model: "PM-2000",
        serialNumber: "PT-PM2000-0004",
        forkliftTypeId: type("PALETEIRA_MANUAL").id,
        energyTypeId: energy("NAO_APLICAVEL").id,
        capacityKg: 2000,
        hourmeter: 0,
      },
    ];

    for (const f of forklifts) {
      await db.forklift.upsert({
        where: { code: f.code },
        update: { organizationId: organization.id },
        create: { ...f, organizationId: organization.id },
      });
    }
  }

  console.log("Seed concluído.");
  console.log(`Admin: ${ADMIN_EMAIL} (senha definida via ADMIN_PASSWORD, não exibida).`);
  if (SEED_DEMO_DATA) {
    console.log("Dados de demonstração criados (operadores + 4 empilhadeiras de exemplo).");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
