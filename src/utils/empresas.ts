// Cadastro de empresas guardado só no telefone (AsyncStorage).
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useSyncExternalStore } from "react";

export type Empresa = {
  id: string;
  nome: string; // obrigatório
  endereco: string;
  telefone: string;
  lat: string; // coordenadas GPS ("" = sem localização)
  lng: string;
  criado_em: string;
};

const KEY = "empresas_v1";

let lista: Empresa[] = [];
let carregado = false;
const ouvintes = new Set<() => void>();
const avisar = () => ouvintes.forEach((l) => l());

async function carregar() {
  if (carregado) return;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    lista = raw ? (JSON.parse(raw) as Empresa[]) : [];
  } catch {
    lista = [];
  }
  carregado = true;
  avisar();
}

async function gravar(nova: Empresa[]) {
  lista = nova;
  avisar();
  await AsyncStorage.setItem(KEY, JSON.stringify(nova));
}

function ordenar(a: Empresa[]): Empresa[] {
  return [...a].sort((x, y) => x.nome.localeCompare(y.nome, "pt-BR", { sensitivity: "base" }));
}

/** Lista de empresas em ordem alfabética (recarrega a tela ao mudar). */
export function useEmpresas(): { empresas: Empresa[]; carregando: boolean } {
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
  return { empresas: ordenar(lista), carregando: !carregado };
}

export async function salvarEmpresa(dados: Omit<Empresa, "id" | "criado_em">, id?: string) {
  await carregar();
  if (id) {
    await gravar(lista.map((e) => (e.id === id ? { ...e, ...dados } : e)));
  } else {
    const nova: Empresa = {
      ...dados,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      criado_em: new Date().toISOString(),
    };
    await gravar([...lista, nova]);
  }
}

/** Apaga e devolve a empresa apagada (para poder desfazer). */
export async function apagarEmpresa(id: string): Promise<Empresa | undefined> {
  await carregar();
  const removida = lista.find((e) => e.id === id);
  await gravar(lista.filter((e) => e.id !== id));
  return removida;
}

/** Coloca de volta uma empresa apagada (Desfazer). */
export async function restaurarEmpresa(e: Empresa) {
  await carregar();
  if (lista.some((x) => x.id === e.id)) return;
  await gravar([...lista, e]);
}

export function linkMapa(e: { lat: string; lng: string }): string {
  return `https://www.google.com/maps/search/?api=1&query=${e.lat},${e.lng}`;
}

/** Lista atual (para o backup). */
export async function todasEmpresas(): Promise<Empresa[]> {
  await carregar();
  return lista;
}

/** Troca todas as empresas pelas do backup. */
export async function substituirEmpresas(nova: Empresa[]) {
  await carregar();
  await gravar(nova);
}
