// Backup e restauração: um arquivo .json com todas as empresas e parks/postos.
// Pode ser guardado no Google Drive, enviado por WhatsApp/e-mail
// e restaurado noutro telefone.
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import { Empresa, substituirEmpresas, todasEmpresas } from "@/src/utils/empresas";
import { Local, substituirLocais, todosLocais } from "@/src/utils/locais";

const APP_ID = "agenda-de-empresas";
const FORMAT = 2; // 2 = com parks/postos

type BackupFile = { app: string; format: number; created_at: string; empresas: Empresa[]; locais?: Local[] };

/** Conteúdo de um backup. `locais` é null em backups antigos (só empresas). */
export type DadosBackup = { empresas: Empresa[]; locais: Local[] | null };

/** Gera o arquivo e abre o "Compartilhar" (Drive, WhatsApp, e-mail...). Devolve as quantidades. */
export async function fazerBackup(): Promise<{ empresas: number; locais: number }> {
  const empresas = await todasEmpresas();
  const locais = await todosLocais();
  const b: BackupFile = { app: APP_ID, format: FORMAT, created_at: new Date().toISOString(), empresas, locais };
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
  return { empresas: empresas.length, locais: locais.length };
}

/** Escolhe o arquivo de backup e devolve o conteúdo (ainda sem restaurar). */
export async function escolherBackup(): Promise<DadosBackup | null> {
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
  const empresas = b.empresas
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
  const locais = Array.isArray(b.locais)
    ? b.locais
        .filter((l) => l && typeof l.nome === "string" && l.nome.trim())
        .map((l, i) => ({
          id: l.id || `${Date.now()}-l${i}`,
          nome: l.nome.trim(),
          tipo: l.tipo === "posto" ? ("posto" as const) : ("park" as const),
          bandeira: l.bandeira || "",
          referencia: l.referencia || "",
          lat: l.lat || "",
          lng: l.lng || "",
          criado_em: l.criado_em || new Date().toISOString(),
        }))
    : null;
  return { empresas, locais };
}

/** Substitui os dados. Backup antigo (sem parks/postos) não mexe nos parks/postos. */
export async function restaurarBackup(d: DadosBackup) {
  await substituirEmpresas(d.empresas);
  if (d.locais) await substituirLocais(d.locais);
}
