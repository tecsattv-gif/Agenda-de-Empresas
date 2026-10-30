import { Text, View } from "react-native";

import { contrastOn, fonts } from "@/src/theme";
import { corBandeira, siglaBandeira } from "@/src/utils/bandeiras";
import { TipoLocal } from "@/src/utils/locais";

const AZUL_PARK = "#1565C0";

/** Ícone quadrado: "P" azul para Park, selo da bandeira (cor + sigla) para Posto. */
export function LocalIcon({ tipo, bandeira, size = 30 }: { tipo: TipoLocal; bandeira?: string; size?: number }) {
  const box = { width: size, height: size, borderRadius: size * 0.22, alignItems: "center", justifyContent: "center" } as const;
  if (tipo === "park") {
    return (
      <View style={[box, { backgroundColor: AZUL_PARK }]}>
        <Text style={{ fontFamily: fonts.displayBold, fontSize: size * 0.7, lineHeight: size * 0.8, color: "#FFFFFF" }}>
          P
        </Text>
      </View>
    );
  }
  return <BandeiraIcon nome={bandeira || ""} size={size} />;
}

/** Selo da bandeira do posto: a cor da rede com a sigla (ex.: SHELL, BP, BR, IPIRANGA). */
export function BandeiraIcon({ nome, size = 30 }: { nome: string; size?: number }) {
  const cor = nome ? corBandeira(nome) : "#9E9E9E";
  const sigla = nome ? siglaBandeira(nome) : "?";
  // Fonte encolhe conforme o tamanho da sigla para caber no quadrado.
  const fonte = size * (sigla.length <= 2 ? 0.48 : sigla.length <= 3 ? 0.4 : sigla.length <= 5 ? 0.3 : sigla.length <= 6 ? 0.25 : 0.2);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: cor,
        paddingHorizontal: 2,
      }}
    >
      <Text
        numberOfLines={1}
        style={{ fontFamily: fonts.displayBold, fontSize: fonte, lineHeight: fonte * 1.15, color: contrastOn(cor) }}
      >
        {sigla}
      </Text>
    </View>
  );
}
