import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CaretRight, FloppyDisk, Trash, Warning, X } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, Text, View } from "react-native";
import { KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BandeiraPicker } from "@/src/components/BandeiraPicker";
import { LocalIcon } from "@/src/components/LocalIcon";
import { CoordsRow, useCoordsField } from "@/src/components/PlaceCoords";
import { TextField } from "@/src/components/TextField";
import { mostrarDesfazer } from "@/src/components/UndoBar";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { apagarLocal, NOME_TIPO, restaurarLocal, salvarLocal, TipoLocal, useLocais } from "@/src/utils/locais";

export default function LocalFormScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = typeof params.id === "string" ? params.id : undefined;
  const { locais, carregando } = useLocais();
  const existente = editId ? locais.find((l) => l.id === editId) : undefined;

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoLocal | "">("");
  const [bandeira, setBandeira] = useState("");
  const [referencia, setReferencia] = useState("");
  const gps = useCoordsField();
  const [preenchido, setPreenchido] = useState(false);
  const [popup, setPopup] = useState(false);
  const [erroNome, setErroNome] = useState<string | undefined>();
  const [erroTipo, setErroTipo] = useState<string | undefined>();
  const [banner, setBanner] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (existente && !preenchido) {
      setNome(existente.nome);
      setTipo(existente.tipo);
      setBandeira(existente.bandeira || "");
      setReferencia(existente.referencia || "");
      gps.setCoords({ lat: existente.lat || "", lng: existente.lng || "" });
      setPreenchido(true);
    }
  }, [existente, preenchido, gps]);

  const escolherTipo = (t: TipoLocal) => {
    setTipo(t);
    setErroTipo(undefined);
    // Posto: abre logo o pop-up das bandeiras.
    if (t === "posto") setPopup(true);
  };

  const salvar = async () => {
    const semNome = !nome.trim();
    setErroNome(semNome ? "Informe o nome" : undefined);
    setErroTipo(!tipo ? "Escolha Park ou Posto" : undefined);
    if (semNome || !tipo) {
      setBanner("Verifique os campos destacados.");
      return;
    }
    setBanner(null);
    setSalvando(true);
    try {
      await salvarLocal(
        {
          nome: nome.trim(),
          tipo,
          bandeira: tipo === "posto" ? bandeira : "",
          referencia: referencia.trim(),
          lat: gps.coords.lat,
          lng: gps.coords.lng,
        },
        editId,
      );
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      setBanner("Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  };

  const apagar = () => {
    if (!editId) return;
    Alert.alert("Apagar", `Tem certeza que deseja apagar "${nome || "este registro"}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Apagar",
        style: "destructive",
        onPress: async () => {
          const removido = await apagarLocal(editId);
          router.back();
          if (removido) {
            mostrarDesfazer(`"${removido.nome}" apagado`, () => restaurarLocal(removido));
          }
        },
      },
    ]);
  };

  const titulo = editId ? "Editar park/posto" : "Novo park/posto";

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={10}>
          <X size={22} color={colors.onSurface} weight="bold" />
        </Pressable>
        <Text style={[styles.title, { flex: 1 }]}>{titulo}</Text>
        {editId ? (
          <Pressable onPress={apagar} style={styles.iconBtn} hitSlop={10}>
            <Trash size={22} color={colors.error} weight="bold" />
          </Pressable>
        ) : null}
      </View>

      {editId && carregando ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        </View>
      ) : (
        <>
          <KeyboardAwareScrollView
            bottomOffset={92}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {banner ? (
              <View style={styles.banner}>
                <Warning size={20} color={colors.error} weight="fill" />
                <Text style={styles.bannerText}>{banner}</Text>
              </View>
            ) : null}

            <TextField
              label="Nome *"
              value={nome}
              onChangeText={setNome}
              placeholder="Ex.: Área de serviço Fátima"
              autoCapitalize="words"
              error={erroNome}
              onFocus={() => gps.capture()}
            />
            <CoordsRow
              coords={gps.coords}
              locating={gps.locating}
              error={gps.error}
              onRefresh={() => gps.capture(true)}
              onClear={() => {
                const antes = gps.coords;
                gps.clear();
                mostrarDesfazer("Coordenadas apagadas", () => gps.setCoords(antes));
              }}
            />

            <Text style={styles.label}>Tipo *</Text>
            <View style={styles.tipos}>
              {(["park", "posto"] as TipoLocal[]).map((t) => {
                const on = tipo === t;
                return (
                  <Pressable
                    key={t}
                    style={[styles.tipo, on && styles.tipoOn, erroTipo && !on ? { borderColor: colors.error } : null]}
                    onPress={() => escolherTipo(t)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                  >
                    <LocalIcon tipo={t} bandeira={t === "posto" ? bandeira : undefined} size={28} />
                    <Text style={[styles.tipoText, on && { color: colors.brandPrimary }]}>{NOME_TIPO[t]}</Text>
                  </Pressable>
                );
              })}
            </View>
            {erroTipo ? <Text style={styles.erro}>{erroTipo}</Text> : null}

            {tipo === "posto" ? (
              <Pressable style={styles.bandeiraRow} onPress={() => setPopup(true)}>
                <LocalIcon tipo="posto" bandeira={bandeira} size={34} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.bandeiraLabel}>Bandeira</Text>
                  <Text style={styles.bandeiraNome}>{bandeira || "Escolher bandeira"}</Text>
                </View>
                <CaretRight size={18} color={colors.brandPrimary} weight="bold" />
              </Pressable>
            ) : null}

            <View style={{ height: 14 }} />
            <TextField
              label="Referência de localidade (opcional)"
              value={referencia}
              onChangeText={setReferencia}
              placeholder="Ex.: A1 sentido Porto, saída 12"
              multiline
            />
          </KeyboardAwareScrollView>

          <KeyboardStickyView>
            <View style={styles.saveBar}>
              <Pressable
                style={[styles.saveBtn, salvando && styles.saveBtnDisabled]}
                onPress={salvar}
                disabled={salvando}
                accessibilityRole="button"
              >
                {salvando ? (
                  <ActivityIndicator color={colors.onBrandPrimary} />
                ) : (
                  <>
                    <FloppyDisk size={22} color={colors.onBrandPrimary} weight="bold" />
                    <Text style={styles.saveText}>Salvar</Text>
                  </>
                )}
              </Pressable>
            </View>
          </KeyboardStickyView>
        </>
      )}

      <BandeiraPicker
        visible={popup}
        atual={bandeira}
        onClose={() => setPopup(false)}
        onSelect={(b) => {
          setBandeira(b);
          setPopup(false);
        }}
      />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  iconBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.onSurface, letterSpacing: 0.3 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  content: { padding: 16, paddingBottom: 110 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.error,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  bannerText: { flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.onSurfaceSecondary },
  label: { fontFamily: fonts.body, fontSize: 13, color: colors.onSurfaceSecondary, marginBottom: 6 },
  tipos: { flexDirection: "row", gap: 10 },
  tipo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 54,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceTertiary,
  },
  tipoOn: { borderColor: colors.brandPrimary, borderWidth: 2, backgroundColor: colors.brandTertiary },
  tipoText: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.onSurface },
  erro: { fontFamily: fonts.body, fontSize: 12, color: colors.error, marginTop: 4 },
  bandeiraRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  bandeiraLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  bandeiraNome: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.onSurface },
  saveBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 54,
    borderRadius: 12,
    backgroundColor: colors.brandPrimary,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { fontFamily: fonts.displayBold, fontSize: 20, letterSpacing: 0.5, color: colors.onBrandPrimary },
}));
