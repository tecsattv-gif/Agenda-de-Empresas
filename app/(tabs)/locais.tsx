import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { FilePdf, GasPump, MagnifyingGlass, MapPin, MapTrifold, Plus, Trash } from "phosphor-react-native";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Linking, Pressable, Text, TextInput, View } from "react-native";

import { LocalIcon } from "@/src/components/LocalIcon";
import { confirmarApagarCoords } from "@/src/components/PlaceCoords";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { SwipeableRow } from "@/src/components/SwipeableRow";
import { mostrarDesfazer } from "@/src/components/UndoBar";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { linkMapa } from "@/src/utils/empresas";
import { apagarLocal, Local, NOME_TIPO, restaurarLocal, salvarLocal, TipoLocal, useLocais } from "@/src/utils/locais";
import { gerarRelatorioLocaisPdf } from "@/src/utils/relatorio";

const semAcento = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

type Filtro = "todos" | TipoLocal;

export default function LocaisScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { locais, carregando } = useLocais();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [gerando, setGerando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const parks = locais.filter((l) => l.tipo === "park").length;
  const postos = locais.length - parks;

  const filtrados = useMemo(() => {
    const q = semAcento(busca.trim());
    return locais.filter(
      (l) =>
        (filtro === "todos" || l.tipo === filtro) &&
        (!q || semAcento([l.nome, l.referencia, l.bandeira, NOME_TIPO[l.tipo]].join(" ")).includes(q)),
    );
  }, [locais, busca, filtro]);

  const relatorio = async () => {
    if (filtrados.length === 0) {
      setAviso("Nenhum park/posto para o relatório.");
      return;
    }
    setAviso(null);
    setGerando(true);
    try {
      const uri = await gerarRelatorioLocaisPdf(filtrados);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf" });
      }
    } catch {
      setAviso("Não foi possível gerar o relatório.");
    } finally {
      setGerando(false);
    }
  };

  const abrirReferencia = (ref: string) =>
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ref)}`);

  const renderItem = ({ item }: { item: Local }) => (
    <SwipeableRow
      onEdit={() => router.push({ pathname: "/local-form", params: { id: item.id } })}
      onDelete={async () => {
        const removido = await apagarLocal(item.id);
        if (removido) mostrarDesfazer(`"${removido.nome}" apagado`, () => restaurarLocal(removido));
      }}
      deleteMessage={`Tem certeza que deseja apagar "${item.nome}"?`}
    >
      <View style={styles.nomeRow}>
        <LocalIcon tipo={item.tipo} bandeira={item.bandeira} size={26} />
        <Text style={styles.nome}>{item.nome}</Text>
      </View>
      {item.lat && item.lng ? (
        <Pressable style={styles.linha} onPress={() => Linking.openURL(linkMapa(item))} hitSlop={6}>
          <MapPin size={15} color={colors.brandPrimary} weight="fill" />
          <Text style={styles.link}>{`${item.lat}, ${item.lng}`}</Text>
          <Pressable
            hitSlop={10}
            onPress={() =>
              confirmarApagarCoords(async () => {
                const { id, criado_em, ...base } = item;
                await salvarLocal({ ...base, lat: "", lng: "" }, id);
                mostrarDesfazer(`Coordenadas de "${item.nome}" apagadas`, () =>
                  salvarLocal({ ...base, lat: item.lat, lng: item.lng }, id),
                );
              })
            }
          >
            <Trash size={16} color={colors.error} weight="bold" />
          </Pressable>
        </Pressable>
      ) : null}
      <View style={styles.linha}>
        <GasPump size={15} color={colors.muted} />
        <Text style={styles.info}>
          {item.tipo === "posto" ? `Posto${item.bandeira ? ` · ${item.bandeira}` : ""}` : "Park"}
        </Text>
      </View>
      {item.referencia ? (
        <Pressable style={styles.linha} onPress={() => abrirReferencia(item.referencia)} hitSlop={6}>
          <MapTrifold size={15} color={colors.muted} />
          <Text style={styles.info}>{item.referencia}</Text>
        </Pressable>
      ) : null}
    </SwipeableRow>
  );

  const chips: { id: Filtro; nome: string }[] = [
    { id: "todos", nome: `Todos (${locais.length})` },
    { id: "park", nome: `Parks (${parks})` },
    { id: "posto", nome: `Postos (${postos})` },
  ];

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Park/Posto" subtitle={`${parks} park(s) · ${postos} posto(s)`}>
        <View style={styles.buscaBox}>
          <MagnifyingGlass size={18} color={colors.muted} />
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar nome, bandeira ou referência"
            placeholderTextColor={colors.muted}
            style={styles.buscaInput}
          />
        </View>
        <View style={styles.chips}>
          {chips.map((c) => {
            const on = filtro === c.id;
            return (
              <Pressable key={c.id} style={[styles.chip, on && styles.chipOn]} onPress={() => setFiltro(c.id)}>
                <Text style={[styles.chipText, on && { color: colors.onBrandPrimary }]}>{c.nome}</Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable style={styles.pdfBtn} onPress={relatorio} disabled={gerando}>
          {gerando ? (
            <ActivityIndicator size="small" color={colors.brandPrimary} />
          ) : (
            <FilePdf size={18} color={colors.brandPrimary} weight="bold" />
          )}
          <Text style={styles.pdfText}>Relatório PDF</Text>
        </Pressable>
        {aviso ? <Text style={styles.aviso}>{aviso}</Text> : null}
      </ScreenHeader>

      {carregando ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        </View>
      ) : (
        <FlatList
          data={filtrados}
          keyExtractor={(l) => l.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.lista, { paddingBottom: 100 }]}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.vazio}>
              <GasPump size={48} color={colors.muted} />
              <Text style={styles.vazioText}>
                {busca || filtro !== "todos" ? "Nada encontrado." : "Nenhum park ou posto cadastrado ainda."}
              </Text>
            </View>
          }
        />
      )}

      <Pressable style={styles.fab} onPress={() => router.push("/local-form")} accessibilityRole="button">
        <Plus size={22} color={colors.onBrandPrimary} weight="bold" />
        <Text style={styles.fabText}>Novo park/posto</Text>
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
  buscaInput: { flex: 1, minHeight: 44, fontFamily: fonts.body, fontSize: 15, color: colors.onSurface },
  chips: { flexDirection: "row", gap: 8, marginTop: 10 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceTertiary,
  },
  chipOn: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  chipText: { fontFamily: fonts.displaySemiBold, fontSize: 15, color: colors.onSurface },
  pdfBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    marginTop: 10,
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
  nomeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  nome: { flex: 1, fontFamily: fonts.displayBold, fontSize: 20, color: colors.onSurface, letterSpacing: 0.3 },
  linha: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  info: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.onSurfaceSecondary },
  link: { flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.brandPrimary, textDecorationLine: "underline" },
  vazio: { alignItems: "center", gap: 12, paddingTop: 60 },
  vazioText: { fontFamily: fonts.body, fontSize: 15, color: colors.muted },
  fab: {
    position: "absolute",
    right: 16,
    left: 16,
    bottom: 16,
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
