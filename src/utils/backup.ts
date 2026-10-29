// Backup e restauração: um arquivo .json com todas as empresas.
// Pode ser guardado no Google Drive, enviado por WhatsApp/e-mail
// e restaurado noutro telefone.
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import { Empresa, substituirEmpresas, todasEmpresas } from "@/src/utils/empresas";

const APP_ID = "agenda-de-empresas";
const FORMAT = 1;

type BackupFile = { app: string; format: number; created_at: string; empresas: Empresa[] };

/** Gera o arquivo e abre o "Compartilhar" (Drive, WhatsApp, e-mail...). Devolve quantas empresas. */
export async function fazerBackup(): Promise<number> {
  const empresas = await todasEmpresas();
  const b: BackupFile = { app: APP_ID, format: FORMAT, created_at: new Date().toISOString(), empresas };
  const nome = `agenda-empresas-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const f = new File(Paths.cache, nome);
  if (f.exists) f.delete();
  f.create();
  f.write(JSON.stringify(b));
  await Sharing.shareAsync(f.uri, {
    mimeType: "application/json",
    dialogTitle: "Backup da Agenda de Empresas",
    UTI: "public.json",
  });
  return empresas.length;
}

/** Escolhe o arquivo de backup e devolve as empresas (ainda sem restaurar). */
export async function escolherBackup(): Promise<Empresa[] | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/plain", "application/octet-stream", "*/*"],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (res.canceled || !res.assets?.length) return null;
  const texto = await new File(res.assets[0].uri).text();
  let b: BackupFile;
  try {
    b = JSON.parse(texto);
  } catch {
    throw new Error("Este arquivo não é um backup da Agenda de Empresas.");
  }
  if (b?.app !== APP_ID || !Array.isArray(b.empresas)) {
    throw new Error("Este arquivo não é um backup da Agenda de Empresas.");
  }
  if ((b.format ?? 0) > FORMAT) {
    throw new Error("Este backup foi feito numa versão mais nova do app. Atualize o aplicativo.");
  }
  return b.empresas
    .filter((e) => e && typeof e.nome === "string" && e.nome.trim())
    .map((e, i) => ({
      id: e.id || `${Date.now()}-${i}`,
      nome: e.nome.trim(),
      endereco: e.endereco || "",
      telefone: e.telefone || "",
      lat: e.lat || "",
      lng: e.lng || "",
      criado_em: e.criado_em || new Date().toISOString(),
    }));
}

export async function restaurarBackup(empresas: Empresa[]) {
  await substituirEmpresas(empresas);
}
