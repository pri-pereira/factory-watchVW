export type OperatorStatus = "presente" | "ausente" | "pendente" | "afastado" | "enfermaria";

export type Operator = {
  id: string;
  nome: string;
  funcao: string;
  matricula: string;
  status: OperatorStatus;
  batida: string | null;
  observacao?: string | null;
  equipe: string;
};

export const CELULAS = [
  "DORLESS",
  "MEZANINO",
  "BANCOS",
  "CHICOTES",
  "VIDROS",
  "PARA-CHOQUE",
  "DRESS-UP",
  "FAHRWERK",
  "MQB",
];

export const TURNOS = [
  { id: "1", nome: "1º Turno", inicio: "06:00", fim: "15:00" },
  { id: "2", nome: "2º Turno", inicio: "15:00", fim: "23:45" },
  { id: "3", nome: "3º Turno", inicio: "00:00", fim: "06:00" },
];
export const TURNO = TURNOS[0];

// Gerador de dados mock para 7 células, cada uma com 3 equipes de 20 pessoas
const firstNames = ["Ana", "Bruno", "Carlos", "Daniela", "Eduardo", "Fernanda", "Gabriel", "Helena", "Igor", "Juliana", "Kevin", "Larissa", "Mateus", "Nathalia", "Otávio", "Patrícia", "Ricardo", "Sandra", "Tiago", "Vanessa"];
const lastNames = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida", "Lopes", "Soares", "Fernandes", "Vieira", "Barbosa"];

const generateMockOperators = () => {
  const ops: Operator[] = [];
  const statusOptions: OperatorStatus[] = ["presente", "presente", "presente", "ausente", "pendente", "afastado", "enfermaria"];
  
  CELULAS.forEach((celula) => {
    for (let eq = 1; eq <= 3; eq++) {
      const equipeName = `Equipe ${eq}`;
      for (let p = 1; p <= 20; p++) {
        const id = `${celula}-${eq}-${p}`;
        const status: OperatorStatus = "pendente";
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        
        ops.push({
          id,
          nome: `${firstName} ${lastName}`,
          funcao: "Operador de Produção",
          matricula: String(10000 + ops.length),
          status,
          batida: null,
          observacao: null,
          equipe: equipeName,
        });
      }
    }
  });
  return ops;
};

export const operators: Operator[] = generateMockOperators();

// Helper to group by cell
export const getOperatorsByCelula = (celula: string) => {
  return operators.filter(op => op.id.startsWith(celula));
};
