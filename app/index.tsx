import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import {
  Buildings,
  CloudArrowUp,
  FilePdf,
  MagnifyingGlass,
  MapPin,
  MapTrifold,
  Phone,
  Plus,
  Trash,
} from "phosphor-react-native";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Linking, Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { confirmarApagarCoords } from "@/src/components/PlaceCoords";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { SwipeableRow } from "@/src/components/SwipeableRow";
import { mostrarDesfazer } from "@/src/components/UndoBar";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { apagarEmpresa, Empresa, linkMapa, restaurarEmpresa, salvarEmpresa, useEmpresas } from "@/src/utils/empresas";
import { gerarRelatorioPdf } from "@/src/utils/relatorio";

const semAcento = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function EmpresasScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { empresas, carregando } = useEmpresas();
  const [busca, setBusca] = useState("");
  const [gerando, setGerando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const filtradas = useMemo(() => {
    const q = semAcento(busca.trim());
    if (!q) return empresas;
    return empresas.filter((e) =>
      semAcento([e.nome, e.endereco, e.telefone].join(" ")).includes(q),
    );
  }, [empresas, busca]);

  const relatorio = async () => {
    if (filtradas.length === 0) {
      setAviso("Nenhuma empresa para o relatório.");
      return;
    }
    setAviso(null);
    setGerando(true);
    try {
      const uri = await gerarRelatorioPdf(filtradas);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf" });
      }
    } catch {
      setAviso("Não foi possível gerar o relatório.");
    } finally {
      setGerando(false);
    }
  };

  const ligar = (tel: string) => Linking.openURL(`tel:${tel.replace(/[^\d+]/g, "")}`);
  const abrirEndereco = (end: string) =>
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(end)}`);

  const renderItem = ({ item }: { item: Empresa }) => (
    <SwipeableRow
      onEdit={() => router.push({ pathname: "/empresa-form", params: { id: item.id } })}
      onDelete={async () => {
        const removida = await apagarEmpresa(item.id);
        if (removida) {
          mostrarDesfazer(`Empresa "${removida.nome}" apagada`, () => restaurarEmpresa(removida));
        }
      }}
      deleteMessage={`Tem certeza que deseja apagar "${item.nome}"?`}
    >
      <Text style={styles.nome}>{item.nome}</Text>
      {item.lat && item.lng ? (
        <Pressable style={styles.linha} onPress={() => Linking.openURL(linkMapa(item))} hitSlop={6}>
          <MapPin size={15} color={colors.brandPrimary} weight="fill" />
          <Text style={styles.link}>{`${item.lat}, ${item.lng}`}</Text>
          <Pressable
            hitSlop={10}
            onPress={() =>
              confirmarApagarCoords(async () => {
                const base = { nome: item.nome, endereco: item.endereco, telefone: item.telefone };
                await salvarEmpresa({ ...base, lat: "", lng: "" }, item.id);
                mostrarDesfazer(`Coordenadas de "${item.nome}" apagadas`, () =>
                  salvarEmpresa({ ...base, lat: item.lat, lng: item.lng }, item.id),
                );
              })
            }
          >
            <Trash size={16} color={colors.error} weight="bold" />
          </Pressable>
        </Pressable>
      ) : null}
      {item.endereco ? (
        <Pressable style={styles.linha} onPress={() => abrirEndereco(item.endereco)} hitSlop={6}>
          <MapTrifold size={15} color={colors.muted} />
          <Text style={styles.info}>{item.endereco}</Text>
        </Pressable>
      ) : null}
      {item.telefone ? (
        <Pressable style={styles.linha} onPress={() => ligar(item.telefone)} hitSlop={6}>
          <Phone size={15} color={colors.muted} />
          <Text style={styles.info}>{item.telefone}</Text>
        </Pressable>
      ) : null}
    </SwipeableRow>
  );

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Agenda de Empresas"
        subtitle={`${empresas.length} empresa(s) cadastrada(s)`}
      >
        <View style={styles.buscaBox}>
          <MagnifyingGlass size={18} color={colors.muted} />
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar empresa, endereço ou telefone"
            placeholderTextColor={colors.muted}
            style={styles.buscaInput}
          />
        </View>
        <View style={styles.botoes}>
        <Pressable style={styles.pdfBtn} onPress={relatorio} disabled={gerando}>
          {gerando ? (
            <ActivityIndicator size="small" color={colors.brandPrimary} />
          ) : (
            <FilePdf size={18} color={colors.brandPrimary} weight="bold" />
          )}
          <Text style={styles.pdfText}>Relatório PDF</Text>
        </Pressable>
        <Pressable style={styles.pdfBtn} onPress={() => router.push("/backup")}>
          <CloudArrowUp size={18} color={colors.brandPrimary} weight="bold" />
          <Text style={styles.pdfText}>Backup</Text>
        </Pressable>
        </View>
        {aviso ? <Text style={styles.aviso}>{aviso}</Text> : null}
      </ScreenHeader>

      {carregando ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        </View>
      ) : (
        <FlatList
          data={filtradas}
          keyExtractor={(e) => e.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.lista, { paddingBottom: insets.bottom + 100 }]}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.vazio}>
              <Buildings size={48} color={colors.muted} />
              <Text style={styles.vazioText}>
                {busca ? "Nenhuma empresa encontrada." : "Nenhuma empresa cadastrada ainda."}
              </Text>
            </View>
          }
        />
      )}

      <Pressable
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={() => router.push("/empresa-form")}
        accessibilityRole="button"
      >
        <Plus size={22} color={colors.onBrandPrimary} weight="bold" />
        <Text style={styles.fabText}>Nova empresa</Text>
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.surface },
  buscaBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    backgroundColor: colors.surfaceTertiary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  buscaInput: {
    flex: 1,
    minHeight: 44,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.onSurface,
  },
  botoes: { flexDirection: "row", gap: 10, marginTop: 10 },
  pdfBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.brandPrimary,
    backgroundColor: colors.brandTertiary,
  },
  pdfText: { fontFamily: fonts.displaySemiBold, fontSize: 16, color: colors.brandPrimary },
  aviso: { fontFamily: fonts.body, fontSize: 13, color: colors.error, marginTop: 8 },
  centro: { flex: 1, alignItems: "center", justifyContent: "center" },
  lista: { padding: 16, gap: 10 },
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  nome: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.onSurface, letterSpacing: 0.3 },
  linha: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  info: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.onSurfaceSecondary },
  link: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.brandPrimary,
    textDecorationLine: "underline",
  },
  vazio: { alignItems: "center", gap: 12, paddingTop: 60 },
  vazioText: { fontFamily: fonts.body, fontSize: 15, color: colors.muted },
  fab: {
    position: "absolute",
    right: 16,
    left: 16,
    height: 54,
    borderRadius: 12,
    backgroundColor: colors.brandPrimary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  fabText: { fontFamily: fonts.displayBold, fontSize: 20, letterSpacing: 0.5, color: colors.onBrandPrimary },
}));
