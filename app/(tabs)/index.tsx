// Tela Resumo (como no Controle de Viagens): números das duas abas e
// a lista de todos os cadastros juntos (Empresas + Parks/Postos).
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import {
  Buildings,
  CaretRight,
  CloudArrowUp,
  FilePdf,
  GasPump,
  MagnifyingGlass,
  MapPin,
  NotePencil,
  Plus,
} from "phosphor-react-native";
import { useMemo, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LocalIcon } from "@/src/components/LocalIcon";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { corBandeira } from "@/src/utils/bandeiras";
import { linkMapa, useEmpresas } from "@/src/utils/empresas";
import { NOME_TIPO, TipoLocal, useLocais } from "@/src/utils/locais";
import { gerarRelatorioGeralPdf } from "@/src/utils/relatorio";

const semAcento = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function heroFontSize(value: string): number {
  const len = value.length;
  if (len <= 4) return 64;
  if (len <= 6) return 52;
  return 42;
}

type Item = {
  key: string;
  id: string;
  nome: string;
  tipo: "empresa" | TipoLocal;
  bandeira: string;
  detalhe: string;
  lat: string;
  lng: string;
};

export default function ResumoScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { empresas, carregando: c1 } = useEmpresas();
  const { locais, carregando: c2 } = useLocais();
  const [busca, setBusca] = useState("");
  const [gerando, setGerando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const parks = locais.filter((l) => l.tipo === "park");
  const postos = locais.filter((l) => l.tipo === "posto");
  const total = empresas.length + locais.length;
  const comCoords =
    empresas.filter((e) => e.lat && e.lng).length + locais.filter((l) => l.lat && l.lng).length;

  // Postos agrupados por bandeira (mais postos primeiro).
  const porBandeira = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of postos) {
      const b = p.bandeira || "Sem bandeira";
      m.set(b, (m.get(b) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"));
  }, [postos]);

  // As duas abas juntas, em ordem alfabética.
  const todos = useMemo<Item[]>(() => {
    const lista: Item[] = [
      ...empresas.map((e) => ({
        key: `e-${e.id}`,
        id: e.id,
        nome: e.nome,
        tipo: "empresa" as const,
        bandeira: "",
        detalhe: [e.endereco, e.telefone].filter(Boolean).join(" · "),
        lat: e.lat,
        lng: e.lng,
      })),
      ...locais.map((l) => ({
        key: `l-${l.id}`,
        id: l.id,
        nome: l.nome,
        tipo: l.tipo,
        bandeira: l.bandeira,
        detalhe: [l.tipo === "posto" ? l.bandeira : "", l.referencia].filter(Boolean).join(" · "),
        lat: l.lat,
        lng: l.lng,
      })),
    ];
    const q = semAcento(busca.trim());
    const filtrada = q
      ? lista.filter((i) =>
          semAcento([i.nome, i.detalhe, i.tipo === "empresa" ? "empresa" : NOME_TIPO[i.tipo]].join(" ")).includes(q),
        )
      : lista;
    return filtrada.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
  }, [empresas, locais, busca]);

  const relatorio = async () => {
    if (total === 0) {
      setAviso("Nenhum cadastro para o relatório.");
      return;
    }
    setAviso(null);
    setGerando(true);
    try {
      const uri = await gerarRelatorioGeralPdf(empresas, locais);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf" });
      }
    } catch {
      setAviso("Não foi possível gerar o relatório.");
    } finally {
      setGerando(false);
    }
  };

  const abrir = (i: Item) =>
    router.push({ pathname: i.tipo === "empresa" ? "/empresa-form" : "/local-form", params: { id: i.id } });

  if (c1 || c2) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <View style={styles.heroContent}>
          <View style={styles.heroTopRow}>
            <NotePencil size={22} color={colors.brandPrimary} weight="fill" />
            <Text style={styles.heroBrand}>AGENDA DE EMPRESAS</Text>
          </View>
          <Text style={styles.heroLabel}>RESUMO</Text>
          <Text style={[styles.heroValue, { fontSize: heroFontSize(String(total)) }]}>{total}</Text>
          <Text style={styles.heroCaption}>cadastros na agenda</Text>
        </View>

        {/* Números de cada aba */}
        <View style={styles.metricsRow}>
          <StatCard label="EMPRESAS" value={empresas.length} onPress={() => router.navigate("/empresas")} />
          <StatCard label="PARKS" value={parks.length} onPress={() => router.navigate("/locais")} />
          <StatCard label="POSTOS" value={postos.length} onPress={() => router.navigate("/locais")} />
        </View>

        <View style={styles.shortcuts}>
          <Pressable style={styles.shortcutBtn} onPress={() => router.push("/empresa-form")}>
            <Plus size={20} color={colors.onBrandPrimary} weight="bold" />
            <Text style={styles.shortcutBtnText}>Nova empresa</Text>
          </Pressable>
          <Pressable style={styles.shortcutBtn} onPress={() => router.push("/local-form")}>
            <Plus size={20} color={colors.onBrandPrimary} weight="bold" />
            <Text style={styles.shortcutBtnText}>Park/Posto</Text>
          </Pressable>
        </View>

        <View style={styles.totalCard}>
          <View style={styles.totalIcon}>
            <MapPin size={22} color={colors.brandPrimary} weight="fill" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.totalLabel}>COM COORDENADAS GPS</Text>
            <Text style={styles.totalValue}>
              {comCoords}
              <Text style={styles.totalUnit}> de {total}</Text>
            </Text>
          </View>
        </View>

        <View style={styles.botoes}>
          <Pressable style={styles.pdfBtn} onPress={relatorio} disabled={gerando}>
            {gerando ? (
              <ActivityIndicator size="small" color={colors.brandPrimary} />
            ) : (
              <FilePdf size={18} color={colors.brandPrimary} weight="bold" />
            )}
            <Text style={styles.pdfText}>Relatório geral PDF</Text>
          </Pressable>
          <Pressable style={styles.pdfBtn} onPress={() => router.push("/backup")}>
            <CloudArrowUp size={18} color={colors.brandPrimary} weight="bold" />
            <Text style={styles.pdfText}>Backup</Text>
          </Pressable>
        </View>
        {aviso ? <Text style={styles.aviso}>{aviso}</Text> : null}

        {/* Postos por bandeira */}
        {porBandeira.length > 0 ? (
          <>
            <View style={styles.sectionRow}>
              <GasPump size={18} color={colors.brandPrimary} weight="bold" />
              <Text style={styles.sectionLabel}>POSTOS POR BANDEIRA</Text>
            </View>
            <View style={styles.rows}>
              {porBandeira.map(([b, n]) => (
                <View key={b} style={styles.row}>
                  <View style={[styles.dot, { backgroundColor: corBandeira(b) }]} />
                  <Text style={styles.rowLabel} numberOfLines={1}>
                    {b.toUpperCase()}
                  </Text>
                  <Text style={styles.rowValue}>{n}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {/* As duas abas juntas */}
        <View style={styles.sectionRow}>
          <Buildings size={18} color={colors.brandPrimary} weight="bold" />
          <Text style={styles.sectionLabel}>TODOS OS CADASTROS</Text>
        </View>
        <View style={styles.buscaBox}>
          <MagnifyingGlass size={18} color={colors.muted} />
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar em empresas, parks e postos"
            placeholderTextColor={colors.muted}
            style={styles.buscaInput}
          />
        </View>
        <View style={styles.rows}>
          {todos.map((i) => (
            <Pressable key={i.key} style={styles.item} onPress={() => abrir(i)}>
              {i.tipo === "empresa" ? (
                <View style={styles.empIcon}>
                  <Buildings size={17} color={colors.brandPrimary} weight="fill" />
                </View>
              ) : (
                <LocalIcon tipo={i.tipo} bandeira={i.bandeira} size={28} />
              )}
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.itemNome} numberOfLines={1}>
                  {i.nome}
                </Text>
                {i.lat && i.lng ? (
                  <Pressable onPress={() => Linking.openURL(linkMapa(i))} hitSlop={4}>
                    <Text style={styles.link}>{`${i.lat}, ${i.lng}`}</Text>
                  </Pressable>
                ) : null}
                <Text style={styles.itemDet} numberOfLines={1}>
                  {i.tipo === "empresa" ? "Empresa" : NOME_TIPO[i.tipo]}
                  {i.detalhe ? ` · ${i.detalhe}` : ""}
                </Text>
              </View>
              <CaretRight size={16} color={colors.muted} weight="bold" />
            </Pressable>
          ))}
          {todos.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                {busca ? "Nada encontrado." : "Nenhum cadastro ainda. Comece por uma empresa ou um park/posto."}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, onPress }: { label: string; value: number; onPress: () => void }) {
  const styles = useStyles();
  return (
    <Pressable style={styles.statCard} onPress={onPress} accessibilityRole="button">
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.surface },
  centered: { flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  content: { paddingBottom: 28 },
  heroContent: { paddingHorizontal: 20, paddingBottom: 8, alignItems: "center" },
  heroTopRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  heroBrand: { fontFamily: fonts.body, fontSize: 12, letterSpacing: 1.5, color: colors.onSurfaceSecondary },
  heroLabel: { fontFamily: fonts.body, fontSize: 12, letterSpacing: 1.2, color: colors.muted },
  heroValue: { fontFamily: fonts.displayBold, lineHeight: 68, color: colors.onSurface },
  heroCaption: { fontFamily: fonts.body, fontSize: 14, color: colors.onSurfaceSecondary },
  metricsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginTop: 16 },
  statCard: {
    flex: 1,
    flexBasis: 0,
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  statLabel: { fontFamily: fonts.body, fontSize: 11, letterSpacing: 0.3, color: colors.muted, marginBottom: 6 },
  statValue: { fontFamily: fonts.displayBold, fontSize: 30, lineHeight: 32, color: colors.onSurface },
  shortcuts: { flexDirection: "row", gap: 10, marginHorizontal: 16, marginTop: 12 },
  shortcutBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.brandPrimary,
    shadowColor: colors.brandPrimary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  shortcutBtnText: { fontFamily: fonts.displayBold, fontSize: 18, letterSpacing: 0.5, color: colors.onBrandPrimary },
  totalCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
  },
  totalIcon: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  totalLabel: { fontFamily: fonts.body, fontSize: 11, letterSpacing: 0.8, color: colors.muted, marginBottom: 2 },
  totalValue: { fontFamily: fonts.displayBold, fontSize: 28, color: colors.onSurface },
  totalUnit: { fontFamily: fonts.display, fontSize: 16, color: colors.muted },
  botoes: { flexDirection: "row", gap: 10, marginHorizontal: 16, marginTop: 12 },
  pdfBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.brandPrimary,
    backgroundColor: colors.brandTertiary,
  },
  pdfText: { fontFamily: fonts.displaySemiBold, fontSize: 16, color: colors.brandPrimary },
  aviso: { fontFamily: fonts.body, fontSize: 13, color: colors.error, marginTop: 8, marginHorizontal: 16 },
  sectionRow: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 24 },
  sectionLabel: { fontFamily: fonts.body, fontSize: 12, letterSpacing: 1, color: colors.muted },
  rows: { marginHorizontal: 16, marginTop: 12, gap: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  rowLabel: { flex: 1, fontFamily: fonts.body, fontSize: 13, letterSpacing: 0.6, color: colors.muted },
  rowValue: { fontFamily: fonts.displayBold, fontSize: 24, lineHeight: 26, color: colors.onSurface },
  buscaBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: colors.surfaceTertiary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  buscaInput: { flex: 1, minHeight: 44, fontFamily: fonts.body, fontSize: 15, color: colors.onSurface },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  empIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  itemNome: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.onSurface },
  itemDet: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  link: { fontFamily: fonts.body, fontSize: 12, color: colors.brandPrimary, textDecorationLine: "underline" },
  emptyBox: {
    padding: 16,
    borderRadius: 12,
    borderColor: colors.border,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  emptyText: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, textAlign: "center", lineHeight: 20 },
}));
