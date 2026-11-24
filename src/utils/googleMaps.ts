// "Escolher no Google Maps": abre o app do Google Maps no local, o usuário
// segura o dedo no lugar e copia as coordenadas; ao voltar, o app lê o que foi
// copiado (coordenadas ou link do Google Maps) e preenche. Sem chave e sem custo.
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import * as Location from "expo-location";
import { Alert, AppState, Linking } from "react-native";

import { separarCoords } from "@/src/components/CoordsManual";
import type { Coords } from "@/src/components/PlaceCoords";

const DICA_KEY = "gmaps_dica_vista_v1";

function valido(lat: number, lng: number) {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

function par(a: string, b: string): Coords | null {
  const lat = parseFloat(a.replace(",", "."));
  const lng = parseFloat(b.replace(",", "."));
  if (!valido(lat, lng) || (lat === 0 && lng === 0)) return null;
  return { lat: lat.toFixed(6), lng: lng.toFixed(6) };
}

/** Tira as coordenadas de um texto: "41.1, -8.6" ou um link do Google Maps. */
export function coordsDoTexto(texto: string): Coords | null {
  const t = (texto || "").trim();
  if (!t) return null;
  const s = separarCoords(t);
  if (s) return par(s[0], s[1]);
  let u = t;
  try {
    u = decodeURIComponent(t);
  } catch {
    // mantém
  }
  const N = "([-+]?\\d{1,3}\\.\\d+)";
  const padroes = [
    new RegExp(`!3d${N}!4d${N}`), // local marcado (mais preciso)
    new RegExp(`[?&](?:q|query|ll|center|destination|daddr)=${N},\\s*${N}`),
    new RegExp(`/place/${N},\\s*${N}`),
    new RegExp(`/search/${N},\\s*\\+?${N}`),
    new RegExp(`@${N},${N}`),
    new RegExp(`${N},\\s*${N}`),
  ];
  for (const p of padroes) {
    const m = u.match(p);
    if (m) {
      const c = par(m[1], m[2]);
      if (c) return c;
    }
  }
  return null;
}

/** Link curto (maps.app.goo.gl / goo.gl/maps): segue o redirecionamento para achar as coordenadas. */
async function expandirLink(texto: string): Promise<Coords | null> {
  const m = texto.match(/https?:\/\/(?:maps\.app\.goo\.gl|goo\.gl\/maps)\/\S+/i);
  if (!m) return null;
  try {
    const r = await fetch(m[0], { method: "GET" });
    const c = coordsDoTexto(r.url);
    if (c) return c;
    const html = await r.text();
    return coordsDoTexto(html.slice(0, 20000));
  } catch {
    return null;
  }
}

async function lerCopiado(): Promise<string> {
  try {
    return (await Clipboard.getStringAsync()) || "";
  } catch {
    return "";
  }
}

function esperarVolta(): Promise<void> {
  return new Promise((resolve) => {
    let saiu = false;
    const sub = AppState.addEventListener("change", (st) => {
      if (st !== "active") saiu = true;
      else if (saiu) {
        sub.remove();
        resolve();
      }
    });
  });
}

function perguntar(titulo: string, msg: string, botoes: { text: string; valor: string; style?: "cancel" | "destructive" }[]) {
  return new Promise<string>((resolve) =>
    Alert.alert(
      titulo,
      msg,
      botoes.map((b) => ({ text: b.text, style: b.style, onPress: () => resolve(b.valor) })),
      { cancelable: true, onDismiss: () => resolve("cancelar") },
    ),
  );
}

async function pontoInicial(atual: Coords): Promise<string | null> {
  if (atual.lat && atual.lng) return `${atual.lat},${atual.lng}`;
  try {
    const perm = await Location.getForegroundPermissionsAsync();
    if (perm.status === "granted") {
      const p = await Location.getLastKnownPositionAsync();
      if (p) return `${p.coords.latitude.toFixed(6)},${p.coords.longitude.toFixed(6)}`;
    }
  } catch {
    // sem GPS
  }
  return null;
}

/**
 * Fluxo completo. Devolve as coordenadas escolhidas, "manual" se o usuário
 * preferir digitar, ou null se cancelou.
 */
export async function escolherNoGoogleMaps(atual: Coords): Promise<Coords | "manual" | null> {
  let viu = false;
  try {
    viu = (await AsyncStorage.getItem(DICA_KEY)) === "1";
  } catch {
    // ignora
  }
  if (!viu) {
    const r = await perguntar(
      "Escolher no Google Maps",
      "1. No Google Maps, segure o dedo em cima do local até aparecer o alfinete vermelho.\n" +
        "2. Toque nas coordenadas que aparecem (na caixa de pesquisa, em cima) para copiar — ou toque em Compartilhar › Copiar link.\n" +
        "3. Volte para o Empresas e Parks: as coordenadas são preenchidas sozinhas.",
      [
        { text: "Cancelar", valor: "cancelar", style: "cancel" },
        { text: "Não mostrar mais", valor: "nunca" },
        { text: "Abrir", valor: "abrir" },
      ],
    );
    if (r === "cancelar") return null;
    if (r === "nunca") AsyncStorage.setItem(DICA_KEY, "1").catch(() => {});
  }

  const antes = await lerCopiado();
  const centro = await pontoInicial(atual);
  const url = centro
    ? `https://www.google.com/maps/search/?api=1&query=${centro}`
    : "https://www.google.com/maps/@?api=1&map_action=map";
  const volta = esperarVolta();
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert("Google Maps", "Não foi possível abrir o Google Maps neste telefone.");
    return null;
  }
  await volta;

  // O Android só deixa ler o que foi copiado depois que o app volta ao primeiro plano.
  let texto = "";
  for (let i = 0; i < 4; i++) {
    await new Promise((r) => setTimeout(r, 400));
    texto = await lerCopiado();
    if (texto) break;
  }

  const novo = texto && texto !== antes ? texto : "";
  const c = novo ? coordsDoTexto(novo) || (await expandirLink(novo)) : null;
  if (c) return c;

  const r = await perguntar(
    "Coordenadas não encontradas",
    novo
      ? "O que foi copiado no Google Maps não tem coordenadas.\n\nSegure o dedo no local até aparecer o alfinete e toque nas coordenadas (números como 41.157944, -8.629105) para copiar."
      : "Nada novo foi copiado no Google Maps.\n\nSegure o dedo no local até aparecer o alfinete e toque nas coordenadas (números como 41.157944, -8.629105) para copiar.",
    [
      { text: "Cancelar", valor: "cancelar", style: "cancel" },
      { text: "Digitar", valor: "manual" },
      { text: "Tentar de novo", valor: "denovo" },
    ],
  );
  if (r === "manual") return "manual";
  if (r === "denovo") return escolherNoGoogleMaps(atual);
  return null;
}
