// Pop-up do mapa para escolher o local: arraste o mapa até a mira ficar em
// cima do lugar (ou toque no lugar) e confirme. Usa OpenStreetMap (Leaflet)
// dentro de um WebView — não precisa de chave do Google. Precisa de internet.
import * as Location from "expo-location";
import { Check, Crosshair, MagnifyingGlass, X } from "phosphor-react-native";
import { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Modal, Platform, Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import { Coords } from "@/src/components/PlaceCoords";
import { fonts, makeStyles, useTheme } from "@/src/theme";

type Props = {
  visible: boolean;
  inicial: Coords;
  onClose: () => void;
  onSelect: (c: Coords) => void;
};

function num(s: string): number | null {
  const n = parseFloat((s || "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function html(lat: number, lng: number, zoom: number, cor: string) {
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
html,body,#map{margin:0;padding:0;height:100%;width:100%;background:#ddd}
#mira{position:absolute;left:50%;top:50%;width:40px;height:40px;margin:-40px 0 0 -20px;z-index:1000;pointer-events:none}
#erro{position:absolute;inset:0;display:none;align-items:center;justify-content:center;text-align:center;font:16px sans-serif;padding:24px;color:#333}
</style></head><body>
<div id="map"></div>
<svg id="mira" viewBox="0 0 24 24"><path fill="${cor}" stroke="#fff" stroke-width="1.2" d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>
<div id="erro">Sem internet: não foi possível carregar o mapa.<br>Use "Digitar coordenadas".</div>
<script>
function enviar(o){window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify(o));}
if(typeof L==="undefined"){document.getElementById("erro").style.display="flex";document.getElementById("mira").style.display="none";enviar({t:"erro"});}
else{
var map=L.map("map",{zoomControl:true,attributionControl:true}).setView([${lat},${lng}],${zoom});
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap"}).addTo(map);
function centro(){var c=map.getCenter();enviar({t:"centro",lat:c.lat,lng:c.lng});}
map.on("moveend",centro);
map.on("click",function(e){map.panTo(e.latlng);});
window.irPara=function(lat,lng,z){map.setView([lat,lng],z||map.getZoom());};
window.buscar=function(q){
  fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&q="+encodeURIComponent(q),{headers:{"Accept-Language":"pt"}})
  .then(function(r){return r.json();}).then(function(r){
    if(r&&r.length){map.setView([parseFloat(r[0].lat),parseFloat(r[0].lon)],16);enviar({t:"busca",ok:true});}
    else enviar({t:"busca",ok:false});
  }).catch(function(){enviar({t:"busca",ok:false});});
};
centro();
}
</script></body></html>`;
}

export function MapPicker({ visible, inicial, onClose, onSelect }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const web = useRef<WebView>(null);
  const [centro, setCentro] = useState<{ lat: number; lng: number } | null>(null);
  const [busca, setBusca] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [inicio, setInicio] = useState<{ lat: number; lng: number; zoom: number } | null>(null);

  // Ponto de partida: as coordenadas que já existem, senão a posição do GPS, senão a Europa.
  const abrir = async () => {
    setAviso(null);
    setBusca("");
    setCentro(null);
    const lat = num(inicial.lat);
    const lng = num(inicial.lng);
    if (lat !== null && lng !== null) {
      setInicio({ lat, lng, zoom: 17 });
      return;
    }
    setInicio(null);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status === "granted") {
        const pos =
          (await Location.getLastKnownPositionAsync().catch(() => null)) ||
          (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null));
        if (pos) {
          setInicio({ lat: pos.coords.latitude, lng: pos.coords.longitude, zoom: 16 });
          return;
        }
      }
    } catch {
      // sem GPS
    }
    setInicio({ lat: 46.5, lng: 2.5, zoom: 5 });
  };

  const pagina = useMemo(
    () => (inicio ? html(inicio.lat, inicio.lng, inicio.zoom, colors.brandPrimary) : ""),
    [inicio, colors.brandPrimary],
  );

  const minhaPosicao = async () => {
    setAviso(null);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") {
        setAviso("Permita o acesso à localização.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }).catch(() =>
        Location.getLastKnownPositionAsync(),
      );
      if (!pos) {
        setAviso("Não foi possível obter a localização.");
        return;
      }
      web.current?.injectJavaScript(`window.irPara(${pos.coords.latitude},${pos.coords.longitude},17);true;`);
    } catch {
      setAviso("Não foi possível obter a localização.");
    }
  };

  const pesquisar = () => {
    const q = busca.trim();
    if (!q) return;
    setAviso(null);
    setBuscando(true);
    web.current?.injectJavaScript(`window.buscar(${JSON.stringify(q)});true;`);
  };

  const confirmar = () => {
    if (!centro) return;
    onSelect({ lat: centro.lat.toFixed(6), lng: centro.lng.toFixed(6) });
  };

  return (
    <Modal visible={visible} animationType="slide" onShow={abrir} onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.iconBtn} hitSlop={10}>
            <X size={22} color={colors.onSurface} weight="bold" />
          </Pressable>
          <Text style={styles.title}>Escolher no mapa</Text>
        </View>

        <View style={styles.buscaRow}>
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Procurar endereço ou cidade"
            placeholderTextColor={colors.muted}
            style={styles.buscaInput}
            returnKeyType="search"
            onSubmitEditing={pesquisar}
          />
          <Pressable style={styles.buscaBtn} onPress={pesquisar} disabled={buscando}>
            {buscando ? (
              <ActivityIndicator color={colors.onBrandPrimary} />
            ) : (
              <MagnifyingGlass size={22} color={colors.onBrandPrimary} weight="bold" />
            )}
          </Pressable>
        </View>

        <View style={{ flex: 1 }}>
          {inicio && Platform.OS !== "web" ? (
            <WebView
              ref={web}
              source={{ html: pagina, baseUrl: "https://empresas-e-parks.app/" }}
              originWhitelist={["*"]}
              javaScriptEnabled
              domStorageEnabled
              onMessage={(e) => {
                try {
                  const m = JSON.parse(e.nativeEvent.data);
                  if (m.t === "centro") setCentro({ lat: m.lat, lng: m.lng });
                  else if (m.t === "busca") {
                    setBuscando(false);
                    if (!m.ok) setAviso("Endereço não encontrado.");
                  } else if (m.t === "erro") setAviso("Sem internet: o mapa não carregou.");
                } catch {
                  // ignora
                }
              }}
            />
          ) : (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.brandPrimary} />
            </View>
          )}
          <Pressable style={styles.gpsBtn} onPress={minhaPosicao} hitSlop={6}>
            <Crosshair size={26} color={colors.brandPrimary} weight="bold" />
          </Pressable>
        </View>

        <View style={[styles.bottom, { paddingBottom: insets.bottom + 14 }]}>
          {aviso ? <Text style={styles.aviso}>{aviso}</Text> : null}
          <Text style={styles.coords}>
            {centro ? `${centro.lat.toFixed(6)}, ${centro.lng.toFixed(6)}` : "Arraste o mapa até a mira ficar no local"}
          </Text>
          <Pressable style={[styles.okBtn, !centro && { opacity: 0.5 }]} onPress={confirmar} disabled={!centro}>
            <Check size={22} color={colors.onBrandPrimary} weight="bold" />
            <Text style={styles.okText}>Usar este local</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  iconBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, fontFamily: fonts.displayBold, fontSize: 22, color: colors.onSurface, letterSpacing: 0.3 },
  buscaRow: { flexDirection: "row", gap: 8, padding: 10 },
  buscaInput: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 12,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.onSurface,
  },
  buscaBtn: {
    width: 46,
    height: 46,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brandPrimary,
  },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  gpsBtn: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bottom: { paddingHorizontal: 16, paddingTop: 12, gap: 8, borderTopColor: colors.border, borderTopWidth: 1 },
  aviso: { fontFamily: fonts.body, fontSize: 13, color: colors.error, textAlign: "center" },
  coords: { fontFamily: fonts.body, fontSize: 14, color: colors.onSurface, textAlign: "center" },
  okBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 54,
    borderRadius: 12,
    backgroundColor: colors.brandPrimary,
  },
  okText: { fontFamily: fonts.displayBold, fontSize: 20, letterSpacing: 0.5, color: colors.onBrandPrimary },
}));
