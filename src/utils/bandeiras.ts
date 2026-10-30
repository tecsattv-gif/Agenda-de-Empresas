// Bandeiras (redes) de postos de combustível, por região.
// Cada bandeira é mostrada como um ícone de bomba na cor da rede + o nome.

export type Regiao = "europa" | "eua" | "brasil";

export type Bandeira = { nome: string; cor: string };

export const REGIOES: { id: Regiao; nome: string; flag: string }[] = [
  { id: "europa", nome: "Europa", flag: "🇪🇺" },
  { id: "eua", nome: "EUA", flag: "🇺🇸" },
  { id: "brasil", nome: "Brasil", flag: "🇧🇷" },
];

export const BANDEIRAS: Record<Regiao, Bandeira[]> = {
  europa: [
    { nome: "Shell", cor: "#F2C200" },
    { nome: "BP", cor: "#009B3A" },
    { nome: "TotalEnergies", cor: "#E2231A" },
    { nome: "Repsol", cor: "#F28C00" },
    { nome: "Galp", cor: "#F26522" },
    { nome: "Moeve (Cepsa)", cor: "#00A19A" },
    { nome: "Esso", cor: "#0047BB" },
    { nome: "Eni / Agip", cor: "#FFCC00" },
    { nome: "Q8", cor: "#00539F" },
    { nome: "Aral", cor: "#0063AF" },
    { nome: "OMV", cor: "#1E6EB4" },
    { nome: "Avia", cor: "#D71920" },
    { nome: "Circle K", cor: "#DA291C" },
    { nome: "Orlen", cor: "#E30613" },
    { nome: "MOL", cor: "#00843D" },
    { nome: "Prio", cor: "#00A3E0" },
    { nome: "Jet", cor: "#FFD200" },
    { nome: "Lukoil", cor: "#C8102E" },
    { nome: "Texaco", cor: "#E31837" },
    { nome: "Petronor", cor: "#007A3D" },
  ],
  eua: [
    { nome: "Shell", cor: "#F2C200" },
    { nome: "Chevron", cor: "#0054A4" },
    { nome: "Exxon", cor: "#E21A23" },
    { nome: "Mobil", cor: "#1A4E9C" },
    { nome: "BP", cor: "#009B3A" },
    { nome: "Marathon", cor: "#E0272F" },
    { nome: "Sunoco", cor: "#0033A0" },
    { nome: "Valero", cor: "#00A3E0" },
    { nome: "Texaco", cor: "#E31837" },
    { nome: "Citgo", cor: "#DA291C" },
    { nome: "Phillips 66", cor: "#E21A23" },
    { nome: "Conoco", cor: "#E21A23" },
    { nome: "76", cor: "#F58220" },
    { nome: "Sinclair", cor: "#00843D" },
    { nome: "Speedway", cor: "#C8102E" },
    { nome: "Circle K", cor: "#DA291C" },
    { nome: "Love's", cor: "#E31B23" },
    { nome: "Pilot Flying J", cor: "#C8102E" },
    { nome: "TA / Petro", cor: "#0054A4" },
    { nome: "Wawa", cor: "#BE1E2D" },
    { nome: "QuikTrip", cor: "#E31837" },
    { nome: "Casey's", cor: "#D71920" },
  ],
  brasil: [
    { nome: "Petrobras", cor: "#008542" },
    { nome: "Ipiranga", cor: "#0057A8" },
    { nome: "Shell", cor: "#F2C200" },
    { nome: "Ale", cor: "#0066B3" },
    { nome: "Rodoil", cor: "#E30613" },
    { nome: "Charrua", cor: "#F28C00" },
    { nome: "SIM", cor: "#E30613" },
    { nome: "TotalEnergies", cor: "#E2231A" },
    { nome: "Texaco", cor: "#E31837" },
    { nome: "Graal", cor: "#B5121B" },
    { nome: "Bandeira branca", cor: "#9E9E9E" },
  ],
};

/** Cor do ícone de uma bandeira gravada (cinza se for "Outra"). */
export function corBandeira(nome: string): string {
  for (const r of REGIOES) {
    const b = BANDEIRAS[r.id].find((x) => x.nome === nome);
    if (b) return b.cor;
  }
  return "#9E9E9E";
}
