// Relatórios PDF (A4): Empresas, Parks/Postos e o Relatório Geral (os dois juntos).
// Campos vazios não aparecem.
import * as Print from "expo-print";

import { Empresa, linkMapa } from "@/src/utils/empresas";
import { Local, NOME_TIPO } from "@/src/utils/locais";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const linha = (k: string, v: string) => `<div class="l"><span class="k">${k}</span>${v}</div>`;

function coords(e: { lat: string; lng: string }): string {
  if (!(e.lat && e.lng)) return "";
  return linha("Coordenadas", `<a href="${esc(linkMapa(e))}">${esc(`${e.lat}, ${e.lng}`)}</a>`);
}

function blocoEmpresa(e: Empresa): string {
  const ls = [coords(e)];
  if (e.endereco) ls.push(linha("Endereço", esc(e.endereco)));
  if (e.telefone) ls.push(linha("Telefone", esc(e.telefone)));
  return `<div class="emp"><div class="nome">${esc(e.nome)}</div>${ls.join("")}</div>`;
}

function blocoLocal(l: Local): string {
  const tag = `<span class="tag ${l.tipo}">${NOME_TIPO[l.tipo]}</span>`;
  const ls = [coords(l)];
  if (l.tipo === "posto" && l.bandeira) ls.push(linha("Bandeira", esc(l.bandeira)));
  if (l.referencia) ls.push(linha("Referência", esc(l.referencia)));
  return `<div class="emp"><div class="nome">${tag}${esc(l.nome)}</div>${ls.join("")}</div>`;
}

const total = (rotulo: string, n: number) =>
  `<div class="total"><span>${rotulo}</span><span>${n}</span></div>`;

async function gerar(titulo: string, corpo: string): Promise<string> {
  const hoje = new Date().toLocaleDateString("pt-BR");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <style>
    *{font-family:-apple-system,Roboto,Arial,sans-serif;box-sizing:border-box}
    body{color:#1A1C19;font-size:11pt;margin:28px}
    .bar{height:4px;background:#FF6D00;border-radius:2px;margin-bottom:14px}
    .title{color:#E65C00;font-size:20pt;font-weight:800}
    .sub{color:#555;font-size:10pt;margin:4px 0 16px}
    .sec{font-size:13pt;font-weight:800;color:#E65C00;margin:20px 0 8px;letter-spacing:.5px}
    .emp{border:1px solid #eee;border-left:4px solid #FF6D00;border-radius:6px;padding:10px 12px;margin-bottom:10px;page-break-inside:avoid}
    .nome{font-size:13pt;font-weight:800;margin-bottom:4px}
    .tag{display:inline-block;font-size:8pt;font-weight:700;color:#fff;border-radius:4px;padding:1px 6px;margin-right:8px;vertical-align:middle}
    .tag.park{background:#1565C0}.tag.posto{background:#E65C00}
    .l{font-size:10pt;margin-top:3px;overflow-wrap:anywhere}
    .k{display:inline-block;min-width:90px;color:#777;font-weight:600}
    a{color:#E65C00}
    .total{margin-top:14px;background:#121212;color:#fff;border-radius:6px;padding:10px 14px;font-weight:700;display:flex;justify-content:space-between}
    .total span:last-child{color:#FF8A3D}
    .vazio{color:#777;font-size:10pt}
  </style></head><body>
    <div class="bar"></div>
    <div class="title">${titulo}</div>
    <div class="sub">Relatório gerado em ${hoje}</div>
    ${corpo}
  </body></html>`;
  const { uri } = await Print.printToFileAsync({ html, width: 595, height: 842 });
  return uri;
}

export function gerarRelatorioPdf(empresas: Empresa[]): Promise<string> {
  return gerar("AGENDA DE EMPRESAS", empresas.map(blocoEmpresa).join("") + total("Total de empresas", empresas.length));
}

export function gerarRelatorioLocaisPdf(locais: Local[]): Promise<string> {
  const parks = locais.filter((l) => l.tipo === "park").length;
  return gerar(
    "PARKS E POSTOS",
    locais.map(blocoLocal).join("") +
      total("Parks", parks) +
      total("Postos", locais.length - parks),
  );
}

/** Relatório Geral: as duas abas juntas. Seções vazias não aparecem. */
export function gerarRelatorioGeralPdf(empresas: Empresa[], locais: Local[]): Promise<string> {
  const parks = locais.filter((l) => l.tipo === "park").length;
  let corpo = "";
  if (empresas.length) corpo += `<div class="sec">EMPRESAS</div>${empresas.map(blocoEmpresa).join("")}`;
  if (locais.length) corpo += `<div class="sec">PARKS E POSTOS</div>${locais.map(blocoLocal).join("")}`;
  if (!corpo) corpo = `<div class="vazio">Nenhum cadastro.</div>`;
  corpo +=
    total("Empresas", empresas.length) + total("Parks", parks) + total("Postos", locais.length - parks);
  return gerar("AGENDA DE EMPRESAS — RESUMO", corpo);
}
