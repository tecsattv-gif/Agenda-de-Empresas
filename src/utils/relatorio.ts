// Relatório PDF (A4) das empresas. Campos vazios não aparecem.
import * as Print from "expo-print";

import { Empresa, linkMapa } from "@/src/utils/empresas";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function bloco(e: Empresa): string {
  const linhas: string[] = [];
  if (e.lat && e.lng) {
    linhas.push(
      `<div class="l"><span class="k">Coordenadas</span><a href="${esc(linkMapa(e))}">${esc(`${e.lat}, ${e.lng}`)}</a></div>`,
    );
  }
  if (e.endereco) linhas.push(`<div class="l"><span class="k">Endereço</span>${esc(e.endereco)}</div>`);
  if (e.telefone) linhas.push(`<div class="l"><span class="k">Telefone</span>${esc(e.telefone)}</div>`);
  return `<div class="emp"><div class="nome">${esc(e.nome)}</div>${linhas.join("")}</div>`;
}

export async function gerarRelatorioPdf(empresas: Empresa[]): Promise<string> {
  const hoje = new Date().toLocaleDateString("pt-BR");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <style>
    *{font-family:-apple-system,Roboto,Arial,sans-serif;box-sizing:border-box}
    body{color:#1A1C19;font-size:11pt;margin:28px}
    .bar{height:4px;background:#FF6D00;border-radius:2px;margin-bottom:14px}
    .title{color:#E65C00;font-size:20pt;font-weight:800}
    .sub{color:#555;font-size:10pt;margin:4px 0 16px}
    .emp{border:1px solid #eee;border-left:4px solid #FF6D00;border-radius:6px;padding:10px 12px;margin-bottom:10px;page-break-inside:avoid}
    .nome{font-size:13pt;font-weight:800;margin-bottom:4px}
    .l{font-size:10pt;margin-top:3px;overflow-wrap:anywhere}
    .k{display:inline-block;min-width:90px;color:#777;font-weight:600}
    a{color:#E65C00}
    .total{margin-top:14px;background:#121212;color:#fff;border-radius:6px;padding:10px 14px;font-weight:700;display:flex;justify-content:space-between}
    .total span:last-child{color:#FF8A3D}
  </style></head><body>
    <div class="bar"></div>
    <div class="title">AGENDA DE EMPRESAS</div>
    <div class="sub">Relatório gerado em ${hoje}</div>
    ${empresas.map(bloco).join("")}
    <div class="total"><span>Total de empresas</span><span>${empresas.length}</span></div>
  </body></html>`;
  const { uri } = await Print.printToFileAsync({ html, width: 595, height: 842 });
  return uri;
}
