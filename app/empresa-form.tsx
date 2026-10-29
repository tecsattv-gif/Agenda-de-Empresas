import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FloppyDisk, Trash, Warning, X } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, Text, View } from "react-native";
import { KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CoordsRow, useCoordsField } from "@/src/components/PlaceCoords";
import { TextField } from "@/src/components/TextField";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { apagarEmpresa, salvarEmpresa, useEmpresas } from "@/src/utils/empresas";

export default function EmpresaFormScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = typeof params.id === "string" ? params.id : undefined;
  const { empresas, carregando } = useEmpresas();
  const existente = editId ? empresas.find((e) => e.id === editId) : undefined;

  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [telefone, setTelefone] = useState("");
  const gps = useCoordsField();
  const [preenchido, setPreenchido] = useState(false);
  const [erroNome, setErroNome] = useState<string | undefined>();
  const [banner, setBanner] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (existente && !preenchido) {
      setNome(existente.nome);
      setEndereco(existente.endereco || "");
      setTelefone(existente.telefone || "");
      gps.setCoords({ lat: existente.lat || "", lng: existente.lng || "" });
      setPreenchido(true);
    }
  }, [existente, preenchido, gps]);

  const salvar = async () => {
    if (!nome.trim()) {
      setErroNome("Informe o nome da empresa");
      setBanner("Verifique os campos destacados.");
      return;
    }
    setErroNome(undefined);
    setBanner(null);
    setSalvando(true);
    try {
      await salvarEmpresa(
        {
          nome: nome.trim(),
          endereco: endereco.trim(),
          telefone: telefone.trim(),
          lat: gps.coords.lat,
          lng: gps.coords.lng,
        },
        editId,
      );
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      setBanner("Não foi possível salvar a empresa.");
    } finally {
      setSalvando(false);
    }
  };

  const apagar = () => {
    if (!editId) return;
    Alert.alert("Apagar empresa", `Apagar "${nome || "esta empresa"}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Apagar",
        style: "destructive",
        onPress: async () => {
          await apagarEmpresa(editId);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={10}>
          <X size={22} color={colors.onSurface} weight="bold" />
        </Pressable>
        <Text style={[styles.title, { flex: 1 }]}>{editId ? "Editar empresa" : "Nova empresa"}</Text>
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
              label="Nome da empresa *"
              value={nome}
              onChangeText={setNome}
              placeholder="Ex.: Transportes Silva"
              autoCapitalize="words"
              error={erroNome}
              onFocus={() => gps.capture()}
            />
            <CoordsRow
              coords={gps.coords}
              locating={gps.locating}
              error={gps.error}
              onRefresh={() => gps.capture(true)}
            />
            <TextField
              label="Endereço (opcional)"
              value={endereco}
              onChangeText={setEndereco}
              placeholder="Rua, número, cidade"
              multiline
            />
            <TextField
              label="Telefone (opcional)"
              value={telefone}
              onChangeText={setTelefone}
              placeholder="Ex.: +351 912 345 678"
              keyboardType="phone-pad"
              autoCapitalize="none"
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
                    <Text style={styles.saveText}>Salvar empresa</Text>
                  </>
                )}
              </Pressable>
            </View>
          </KeyboardStickyView>
        </>
      )}
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
