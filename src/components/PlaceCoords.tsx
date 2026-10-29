import * as Location from "expo-location";
import { ArrowClockwise, MapPin, Trash } from "phosphor-react-native";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Alert, Linking, Platform, Pressable, Text, View } from "react-native";

import { fonts, makeStyles, useTheme } from "@/src/theme";
import { linkMapa } from "@/src/utils/empresas";

export type Coords = { lat: string; lng: string };

// Coordenadas de um campo. capture() busca a posição atual do GPS;
// sem "force", só busca se ainda não houver coordenadas.
export function useCoordsField() {
  const [coords, setCoords] = useState<Coords>({ lat: "", lng: "" });
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  // Depois de apagar, tocar no campo não busca de novo (só a setinha ↻).
  const cleared = useRef(false);
  const latest = useRef(coords);
  latest.current = coords;

  const capture = useCallback(async (force = false) => {
    if (Platform.OS === "web" || busy.current) return;
    if (!force && ((latest.current.lat && latest.current.lng) || cleared.current)) return;
    cleared.current = false;
    busy.current = true;
    setLocating(true);
    setError(null);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") {
        setError("Permita o acesso à localização para gravar as coordenadas.");
        return;
      }
      let pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(
        () => null,
      );
      if (!pos) pos = await Location.getLastKnownPositionAsync();
      if (!pos) {
        setError("Não foi possível obter a localização. Verifique se o GPS está ligado.");
        return;
      }
      setCoords({ lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) });
    } catch {
      setError("Não foi possível obter a localização. Verifique se o GPS está ligado.");
    } finally {
      busy.current = false;
      setLocating(false);
    }
  }, []);

  const clear = useCallback(() => {
    cleared.current = true;
    setCoords({ lat: "", lng: "" });
    setError(null);
  }, []);

  return { coords, setCoords, locating, error, capture, clear };
}

type Props = {
  coords: Coords;
  locating: boolean;
  error: string | null;
  onRefresh: () => void;
  onClear?: () => void;
};

// Linha "📍 coordenadas" logo abaixo do campo.
export function CoordsRow({ coords, locating, error, onRefresh, onClear }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const has = !!(coords.lat && coords.lng);

  return (
    <View style={styles.row}>
      <MapPin size={16} color={colors.brandPrimary} weight="fill" />
      {locating ? (
        <>
          <ActivityIndicator size="small" color={colors.brandPrimary} />
          <Text style={[styles.text, { flex: 1 }]}>Obtendo localização...</Text>
        </>
      ) : has ? (
        <Pressable style={{ flex: 1 }} onPress={() => Linking.openURL(linkMapa(coords))}>
          <Text style={styles.link}>{`${coords.lat}, ${coords.lng}`}</Text>
        </Pressable>
      ) : (
        <Text style={[styles.text, { flex: 1 }, error ? { color: colors.error } : null]}>
          {error || "Sem coordenadas"}
        </Text>
      )}
      {has && !locating && onClear ? (
        <Pressable onPress={() => confirmarApagarCoords(onClear)} hitSlop={10}>
          <Trash size={18} color={colors.error} weight="bold" />
        </Pressable>
      ) : null}
      {Platform.OS !== "web" && !locating ? (
        <Pressable onPress={onRefresh} hitSlop={10}>
          <ArrowClockwise size={18} color={colors.brandPrimary} weight="bold" />
        </Pressable>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 2,
    marginTop: -4,
    marginBottom: 12,
  },
  text: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  link: { fontFamily: fonts.body, fontSize: 13, color: colors.brandPrimary, textDecorationLine: "underline" },
}));

// Confirmação antes de apagar as coordenadas.
export function confirmarApagarCoords(onConfirm: () => void) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.confirm("Apagar as coordenadas?")) onConfirm();
    return;
  }
  Alert.alert("Apagar coordenadas", "Apagar as coordenadas desta empresa?", [
    { text: "Cancelar", style: "cancel" },
    { text: "Apagar", style: "destructive", onPress: onConfirm },
  ]);
}
