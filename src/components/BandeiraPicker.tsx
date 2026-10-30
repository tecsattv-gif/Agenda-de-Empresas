// Pop-up para escolher a bandeira (rede) do posto: Shell, BP, Petrobras, Ipiranga...
import { Check, X } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { BandeiraIcon } from "@/src/components/LocalIcon";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { BANDEIRAS, Regiao, REGIOES } from "@/src/utils/bandeiras";

type Props = {
  visible: boolean;
  atual: string;
  onClose: () => void;
  onSelect: (bandeira: string) => void;
};

function regiaoDe(nome: string): Regiao {
  for (const r of REGIOES) if (BANDEIRAS[r.id].some((b) => b.nome === nome)) return r.id;
  return "europa";
}

export function BandeiraPicker({ visible, atual, onClose, onSelect }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [regiao, setRegiao] = useState<Regiao>(regiaoDe(atual));
  const [outra, setOutra] = useState("");

  useEffect(() => {
    if (visible) {
      setRegiao(regiaoDe(atual));
      const conhecida = REGIOES.some((r) => BANDEIRAS[r.id].some((b) => b.nome === atual));
      setOutra(atual && !conhecida ? atual : "");
    }
  }, [visible, atual]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.head}>
            <Text style={styles.title}>Bandeira do posto</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <X size={22} color={colors.onSurface} weight="bold" />
            </Pressable>
          </View>

          <View style={styles.regioes}>
            {REGIOES.map((r) => {
              const on = r.id === regiao;
              return (
                <Pressable
                  key={r.id}
                  style={[styles.regiao, on && styles.regiaoOn]}
                  onPress={() => setRegiao(r.id)}
                  accessibilityRole="tab"
                >
                  <Text style={styles.flag}>{r.flag}</Text>
                  <Text style={[styles.regiaoText, on && { color: colors.onBrandPrimary }]}>{r.nome}</Text>
                </Pressable>
              );
            })}
          </View>

          <ScrollView contentContainerStyle={styles.grid} keyboardShouldPersistTaps="handled">
            {BANDEIRAS[regiao].map((b) => {
              const on = b.nome === atual;
              return (
                <Pressable
                  key={`${regiao}-${b.nome}`}
                  style={[styles.tile, on && styles.tileOn]}
                  onPress={() => onSelect(b.nome)}
                >
                  <BandeiraIcon nome={b.nome} size={44} />
                  <Text style={styles.tileText} numberOfLines={2}>
                    {b.nome}
                  </Text>
                  {on ? (
                    <View style={styles.check}>
                      <Check size={12} color={colors.onBrandPrimary} weight="bold" />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}

            <View style={styles.outraBox}>
              <Text style={styles.outraLabel}>Outra bandeira</Text>
              <View style={styles.outraRow}>
                <TextInput
                  value={outra}
                  onChangeText={setOutra}
                  placeholder="Digite o nome"
                  placeholderTextColor={colors.muted}
                  style={styles.outraInput}
                  autoCapitalize="words"
                />
                <Pressable
                  style={[styles.okBtn, !outra.trim() && { opacity: 0.4 }]}
                  disabled={!outra.trim()}
                  onPress={() => onSelect(outra.trim())}
                >
                  <Text style={styles.okText}>OK</Text>
                </Pressable>
              </View>
              {atual ? (
                <Pressable onPress={() => onSelect("")} style={styles.semBtn}>
                  <Text style={styles.semText}>Tirar a bandeira</Text>
                </Pressable>
              ) : null}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const useStyles = makeStyles((colors) => ({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    backgroundColor: colors.surfaceSecondary,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
    maxHeight: "85%",
  },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  title: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.onSurface },
  regioes: { flexDirection: "row", gap: 8, marginBottom: 12 },
  regiao: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceTertiary,
  },
  regiaoOn: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  flag: { fontSize: 20 },
  regiaoText: { fontFamily: fonts.displaySemiBold, fontSize: 16, color: colors.onSurface },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingBottom: 8 },
  tile: {
    width: "31.5%",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceTertiary,
  },
  tileOn: { borderColor: colors.brandPrimary, borderWidth: 2 },
  tileText: { fontFamily: fonts.body, fontSize: 12, color: colors.onSurface, textAlign: "center" },
  check: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  outraBox: { width: "100%", marginTop: 8, gap: 6 },
  outraLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.onSurfaceSecondary },
  outraRow: { flexDirection: "row", gap: 8 },
  outraInput: {
    flex: 1,
    minHeight: 46,
    backgroundColor: colors.surfaceTertiary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.onSurface,
  },
  okBtn: {
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  okText: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.onBrandPrimary },
  semBtn: { alignSelf: "flex-start", paddingVertical: 6 },
  semText: { fontFamily: fonts.body, fontSize: 13, color: colors.error, textDecorationLine: "underline" },
}));
