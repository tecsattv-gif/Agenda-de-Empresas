// Cadastro de Parks e Postos guardado só no telefone (AsyncStorage).
// Mesmo funcionamento do cadastro de empresas.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useSyncExternalStore } from "react";

export type TipoLocal = "park" | "posto";

export type Local = {
  id: string;
  nome: string; // obrigatório
  tipo: TipoLocal;
  bandeira: string; // só para posto ("" = sem bandeira)
  referencia: string; // referência de localidade
  lat: string; // coordenadas GPS ("" = sem localização)
  lng: string;
  criado_em: string;
};

export const NOME_TIPO: Record<TipoLocal, string> = { park: "Park", posto: "Posto" };

const KEY = "locais_v1";

let lista: Local[] = [];
let carregado = false;
const ouvintes = new Set<() => void>();
const avisar = () => ouvintes.forEach((l) => l());

async function carregar() {
  if (carregado) return;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    lista = raw ? (JSON.parse(raw) as Local[]) : [];
  } catch {
    lista = [];
  }
  carregado = true;
  avisar();
}

async function gravar(nova: Local[]) {
  lista = nova;
  avisar();
  await AsyncStorage.setItem(KEY, JSON.stringify(nova));
}

function ordenar(a: Local[]): Local[] {
  return [...a].sort((x, y) => x.nome.localeCompare(y.nome, "pt-BR", { sensitivity: "base" }));
}

/** Lista de parks/postos em ordem alfabética (recarrega a tela ao mudar). */
export function useLocais(): { locais: Local[]; carregando: boolean } {
  useEffect(() => {
    carregar();
  }, []);
  useSyncExternalStore(
    (cb) => {
      ouvintes.add(cb);
      return () => ouvintes.delete(cb);
    },
    () => lista,
    () => lista,
  );
  return { locais: ordenar(lista), carregando: !carregado };
}

export async function salvarLocal(dados: Omit<Local, "id" | "criado_em">, id?: string) {
  await carregar();
  if (id) {
    await gravar(lista.map((l) => (l.id === id ? { ...l, ...dados } : l)));
  } else {
    const novo: Local = {
      ...dados,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      criado_em: new Date().toISOString(),
    };
    await gravar([...lista, novo]);
  }
}

/** Apaga e devolve o registro apagado (para poder desfazer). */
export async function apagarLocal(id: string): Promise<Local | undefined> {
  await carregar();
  const removido = lista.find((l) => l.id === id);
  await gravar(lista.filter((l) => l.id !== id));
  return removido;
}

/** Coloca de volta um registro apagado (Desfazer). */
export async function restaurarLocal(l: Local) {
  await carregar();
  if (lista.some((x) => x.id === l.id)) return;
  await gravar([...lista, l]);
}

/** Lista atual (para o backup). */
export async function todosLocais(): Promise<Local[]> {
  await carregar();
  return lista;
}

/** Troca todos os parks/postos pelos do backup. */
export async function substituirLocais(nova: Local[]) {
  await carregar();
  await gravar(nova);
}
