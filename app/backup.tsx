import { useRouter } from "expo-router";
import { CheckCircle, CloudArrowDown, CloudArrowUp, Warning, X } from "phosphor-react-native";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fonts, makeStyles, useTheme } from "@/src/theme";
import { escolherBackup, fazerBackup, restaurarBackup } from "@/src/utils/backup";
import { useEmpresas } from "@/src/utils/empresas";

export default function BackupScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { empresas } = useEmpresas();
  const [ocupado, setOcupado] = useState<"" | "fazer" | "restaurar">("");
  const [ok, setOk] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const fazer = async () => {
    setOk(null);
    setErro(null);
    setOcupado("fazer");
    try {
      const n = await fazerBackup();
      setOk(`Backup gerado com ${n} empresa(s). Guarde o arquivo no Google Drive, e-mail ou WhatsApp.`);
    } catch (e: any) {
      setErro(e?.message || "Não foi possível fazer o backup.");
    } finally {
      setOcupado("");
    }
  };

  const restaurar = async () => {
    setOk(null);
    setErro(null);
    setOcupado("restaurar");
    try {
      const lista = await escolherBackup();
      if (!lista) return;
      Alert.alert(
        "Restaurar backup",
        `O backup tem ${lista.length} empresa(s).\n\nAs ${empresas.length} empresa(s) que estão agora no telefone serão substituídas. Continuar?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Restaurar",
            style: "destructive",
            onPress: async () => {
              await restaurarBackup(lista);
              setOk(`Backup restaurado: ${lista.length} empresa(s).`);
            },
          },
        ],
      );
    } catch (e: any) {
      setErro(e?.message || "Não foi possível ler o backup.");
    } finally {
      setOcupado("");
    }
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={10}>
          <X size={22} color={colors.onSurface} weight="bold" />
        </Pressable>
        <Text style={styles.title}>Backup</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.texto}>
          O backup é um arquivo com todas as empresas (nome, endereço, telefone e coordenadas). Guarde-o fora do
          telefone para não perder os dados ao trocar de celular ou reinstalar o app.
        </Text>

        {ok ? (
          <View style={[styles.aviso, { borderColor: colors.success }]}>
            <CheckCircle size={20} color={colors.success} weight="fill" />
            <Text style={styles.avisoText}>{ok}</Text>
          </View>
        ) : null}
        {erro ? (
          <View style={[styles.aviso, { borderColor: colors.error }]}>
            <Warning size={20} color={colors.error} weight="fill" />
            <Text style={styles.avisoText}>{erro}</Text>
          </View>
        ) : null}

        <Pressable style={styles.card} onPress={fazer} disabled={!!ocupado}>
          {ocupado === "fazer" ? (
            <ActivityIndicator color={colors.brandPrimary} />
          ) : (
            <CloudArrowUp size={30} color={colors.brandPrimary} weight="bold" />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Fazer backup</Text>
            <Text style={styles.cardSub}>
              Gera o arquivo com {empresas.length} empresa(s) e abre o Compartilhar.
            </Text>
          </View>
        </Pressable>

        <Pressable style={styles.card} onPress={restaurar} disabled={!!ocupado}>
          {ocupado === "restaurar" ? (
            <ActivityIndicator color={colors.brandPrimary} />
          ) : (
            <CloudArrowDown size={30} color={colors.brandPrimary} weight="bold" />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Restaurar backup</Text>
            <Text style={styles.cardSub}>Escolha o arquivo de backup. As empresas atuais serão substituídas.</Text>
          </View>
        </Pressable>
      </ScrollView>
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
  content: { padding: 16, gap: 12 },
  texto: { fontFamily: fonts.body, fontSize: 14, color: colors.onSurfaceSecondary, lineHeight: 20 },
  aviso: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  avisoText: { flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.onSurfaceSecondary },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  cardTitle: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.onSurface },
  cardSub: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 2 },
}));
