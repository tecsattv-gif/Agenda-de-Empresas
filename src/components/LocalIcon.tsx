import { GasPump } from "phosphor-react-native";
import { Text, View } from "react-native";

import { fonts } from "@/src/theme";
import { corBandeira } from "@/src/utils/bandeiras";
import { TipoLocal } from "@/src/utils/locais";

const AZUL_PARK = "#1565C0";

/** Ícone quadrado: "P" azul para Park, bomba na cor da bandeira para Posto. */
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
  return <BandeiraIcon cor={bandeira ? corBandeira(bandeira) : "#9E9E9E"} size={size} />;
}

/** Bomba de combustível branca sobre a cor da bandeira. */
export function BandeiraIcon({ cor, size = 30 }: { cor: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: cor,
      }}
    >
      <GasPump size={size * 0.62} color="#FFFFFF" weight="fill" />
    </View>
  );
}
