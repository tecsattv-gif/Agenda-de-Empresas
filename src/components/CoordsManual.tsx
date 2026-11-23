// Pop-up para digitar as coordenadas à mão. Aceita latitude e longitude
// separadas ou coladas juntas ("41.1579, -8.6291", como o Google Maps copia).
import { useEffect, useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";

import { Coords } from "@/src/components/PlaceCoords";
import { fonts, makeStyles, useTheme } from "@/src/theme";

type Props = {
  visible: boolean;
  inicial: Coords;
  onClose: () => void;
  onSelect: (c: Coords) => void;
};

function num(s: string): number | null {
  const t = s.trim().replace(",", ".");
  if (!/^[-+]?\d+(\.\d+)?$/.test(t)) return null;
  return parseFloat(t);
}

// "41.1579, -8.6291" / "41,1579 -8,6291" / "41.1579;-8.6291" → [lat, lng]
export function separarCoords(texto: string): [string, string] | null {
  const t = texto.trim();
  let m = t.match(/^([-+]?\d+(?:\.\d+)?)\s*[,;\s]\s*([-+]?\d+(?:\.\d+)?)$/); // ponto decimal
  if (!m) m = t.match(/^([-+]?\d+(?:,\d+)?)\s*[;\s]\s*([-+]?\d+(?:,\d+)?)$/); // vírgula decimal
  return m ? [m[1], m[2]] : null;
}

export function CoordsManual({ visible, inicial, onClose, onSelect }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setLat(inicial.lat || "");
      setLng(inicial.lng || "");
      setErro(null);
    }
  }, [visible, inicial.lat, inicial.lng]);

  const mudarLat = (v: string) => {
    const par = separarCoords(v);
    if (par) {
      setLat(par[0]);
      setLng(par[1]);
    } else setLat(v);
  };

  const confirmar = () => {
    const a = num(lat);
    const b = num(lng);
    if (a === null || b === null) {
      setErro("Digite a latitude e a longitude em números (ex.: 41.157944 e -8.629105).");
      return;
    }
    if (a < -90 || a > 90) {
      setErro("A latitude tem de estar entre -90 e 90.");
      return;
    }
    if (b < -180 || b > 180) {
      setErro("A longitude tem de estar entre -180 e 180.");
      return;
    }
    onSelect({ lat: a.toFixed(6), lng: b.toFixed(6) });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.fundo}>
        <View style={styles.caixa}>
          <Text style={styles.title}>Digitar coordenadas</Text>
          <Text style={styles.dica}>Pode colar as duas juntas no primeiro campo (ex.: 41.157944, -8.629105).</Text>
          <Text style={styles.label}>Latitude</Text>
          <TextInput
            value={lat}
            onChangeText={mudarLat}
            placeholder="Ex.: 41.157944"
            placeholderTextColor={colors.muted}
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
            style={styles.input}
            autoFocus
          />
          <Text style={styles.label}>Longitude</Text>
          <TextInput
            value={lng}
            onChangeText={setLng}
            placeholder="Ex.: -8.629105"
            placeholderTextColor={colors.muted}
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
            style={styles.input}
            onSubmitEditing={confirmar}
          />
          {erro ? <Text style={styles.erro}>{erro}</Text> : null}
          <View style={styles.botoes}>
            <Pressable style={[styles.btn, styles.btnOutline]} onPress={onClose}>
              <Text style={[styles.btnText, { color: colors.brandPrimary }]}>Cancelar</Text>
            </Pressable>
            <Pressable style={[styles.btn, { backgroundColor: colors.brandPrimary }]} onPress={confirmar}>
              <Text style={[styles.btnText, { color: colors.onBrandPrimary }]}>Usar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((colors) => ({
  fundo: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: 20 },
  caixa: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 14,
    padding: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.onSurface },
  dica: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 4, marginBottom: 10 },
  label: { fontFamily: fonts.body, fontSize: 13, color: colors.onSurfaceSecondary, marginTop: 8, marginBottom: 4 },
  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 12,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.onSurface,
  },
  erro: { fontFamily: fonts.body, fontSize: 13, color: colors.error, marginTop: 8 },
  botoes: { flexDirection: "row", gap: 10, marginTop: 16 },
  btn: { flex: 1, height: 48, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  btnOutline: { borderWidth: 1, borderColor: colors.brandPrimary },
  btnText: { fontFamily: fonts.displaySemiBold, fontSize: 18 },
}));
