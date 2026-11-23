// Procura um cadastro repetido antes de salvar: mesmo nome (ignorando
// maiúsculas, acentos e espaços) ou o mesmo local (coordenadas a menos de 50 m).
import { Alert, Platform } from "react-native";

import { distanciaMetros, formatarDistancia } from "@/src/utils/distancia";

const RAIO_METROS = 50;

type Cadastro = { id: string; nome: string; lat: string; lng: string };

export function normalizarNome(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function num(s: string): number | null {
  const n = parseFloat((s || "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export type Repetido<T> = { item: T; motivo: string };

/** Devolve o primeiro cadastro repetido (ignora o próprio registro em edição). */
export function acharRepetido<T extends Cadastro>(
  lista: T[],
  novo: { nome: string; lat: string; lng: string },
  ignorarId?: string,
): Repetido<T> | null {
  const nome = normalizarNome(novo.nome);
  const lat = num(novo.lat);
  const lng = num(novo.lng);
  let perto: Repetido<T> | null = null;
  let menor = Infinity;
  for (const item of lista) {
    if (item.id === ignorarId) continue;
    if (nome && normalizarNome(item.nome) === nome) return { item, motivo: "com o mesmo nome" };
    const a = num(item.lat);
    const b = num(item.lng);
    if (lat !== null && lng !== null && a !== null && b !== null) {
      const d = distanciaMetros({ lat, lng }, { lat: a, lng: b });
      if (d < RAIO_METROS && d < menor) {
        menor = d;
        perto = { item, motivo: d < 5 ? "no mesmo local" : `no mesmo local (a ${formatarDistancia(d)})` };
      }
    }
  }
  return perto;
}

/** Pop-up "Cadastro repetido" com Cancelar / Substituir. Resolve true = substituir. */
export function perguntarSubstituir(tipo: string, r: Repetido<{ nome: string }>): Promise<boolean> {
  const msg = `Já existe ${tipo} "${r.item.nome}" ${r.motivo}.\n\nDeseja substituir o cadastro existente pelos dados novos?`;
  if (Platform.OS === "web") {
    return Promise.resolve(typeof window !== "undefined" && window.confirm(`Cadastro repetido\n\n${msg}`));
  }
  return new Promise((resolve) =>
    Alert.alert(
      "Cadastro repetido",
      msg,
      [
        { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
        { text: "Substituir", style: "destructive", onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    ),
  );
}
