// Barra "Desfazer" que aparece por 8 segundos depois de apagar algo.
import { ArrowCounterClockwise } from "phosphor-react-native";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fonts, makeStyles, useTheme } from "@/src/theme";

const SEGUNDOS = 8;

type Pendente = { id: number; mensagem: string; desfazer: () => void | Promise<void> };

let atual: Pendente | null = null;
let seq = 0;
const ouvintes = new Set<() => void>();
const avisar = () => ouvintes.forEach((l) => l());

/** Mostra a barra "Desfazer" por 8 s. Tocar em Desfazer chama `desfazer`. */
export function mostrarDesfazer(mensagem: string, desfazer: () => void | Promise<void>) {
  atual = { id: ++seq, mensagem, desfazer };
  avisar();
}

function fechar(id: number) {
  if (atual?.id === id) {
    atual = null;
    avisar();
  }
}

export function UndoBar() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const p = useSyncExternalStore(
    (cb) => {
      ouvintes.add(cb);
      return () => ouvintes.delete(cb);
    },
    () => atual,
    () => atual,
  );
  const [resta, setResta] = useState(SEGUNDOS);
  const barra = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!p) return;
    setResta(SEGUNDOS);
    barra.setValue(1);
    Animated.timing(barra, {
      toValue: 0,
      duration: SEGUNDOS * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
    const inicio = Date.now();
    const tick = setInterval(() => {
      const r = SEGUNDOS - Math.floor((Date.now() - inicio) / 1000);
      setResta(Math.max(0, r));
    }, 250);
    const fim = setTimeout(() => fechar(p.id), SEGUNDOS * 1000);
    return () => {
      clearInterval(tick);
      clearTimeout(fim);
    };
  }, [p, barra]);

  if (!p) return null;

  return (
    <View style={[styles.wrap, { bottom: insets.bottom + 86 }]} pointerEvents="box-none">
      <View style={styles.bar}>
        <Text style={styles.msg} numberOfLines={2}>
          {p.mensagem}
        </Text>
        <Pressable
          style={styles.btn}
          hitSlop={8}
          onPress={async () => {
            fechar(p.id);
            await p.desfazer();
          }}
        >
          <ArrowCounterClockwise size={18} color={colors.brandPrimary} weight="bold" />
          <Text style={styles.btnText}>{`Desfazer (${resta})`}</Text>
        </Pressable>
        <Animated.View
          style={[
            styles.progress,
            { width: barra.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) },
          ]}
        />
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: { position: "absolute", left: 16, right: 16, zIndex: 50 },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surfaceInverse,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    overflow: "hidden",
    elevation: 8,
  },
  msg: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.onSurfaceInverse },
  btn: { flexDirection: "row", alignItems: "center", gap: 6 },
  btnText: { fontFamily: fonts.displayBold, fontSize: 17, color: colors.brandPrimary },
  progress: { position: "absolute", left: 0, bottom: 0, height: 3, backgroundColor: colors.brandPrimary },
}));
