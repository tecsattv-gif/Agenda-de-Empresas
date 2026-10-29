# Agenda de Empresas — versão 1.0.0

App Android para guardar os contatos das empresas: **nome, endereço, telefone e coordenadas GPS**. Feito com Expo / React Native, com o mesmo visual do Controle de Viagens (tema escuro, laranja, fontes Barlow Condensed e DM Sans). Os dados ficam **só no telefone**: sem conta e sem servidor.

## Funções
- **Lista de empresas** em ordem alfabética, com busca por nome, endereço ou telefone (ignora acentos).
  - Tocar no telefone faz a ligação; tocar no endereço ou nas coordenadas abre o Google Maps.
- **Cadastro**: só o **Nome** é obrigatório; Endereço e Telefone são opcionais.
  - Ao tocar no campo Nome, o app pega o GPS e mostra a linha 📍 com as coordenadas logo abaixo do nome.
  - ↻ busca as coordenadas de novo; 🗑 apaga (depois de apagar, só o ↻ volta a buscar).
- **Relatório PDF (A4)**: uma ficha por empresa com o total no fim. Campos não preenchidos não aparecem. Compartilha por WhatsApp, e-mail, Drive etc. Respeita a busca: se houver filtro, sai só o que está na lista.
- **Backup**: gera um arquivo `.json` com todas as empresas pelo Compartilhar; **Restaurar backup** escolhe o arquivo e substitui as empresas do telefone.
- **Apagar com segurança**: tudo que apaga (empresa, coordenadas, restauração de backup) pergunta "Tem certeza?" e depois mostra **Desfazer** por 8 segundos.
- **Splash** com a logo (fundo transparente), nome, créditos e barra de carregamento.

## Estrutura
| Arquivo | Função |
|---|---|
| `app/_layout.tsx` | Fontes, Splash, navegação e barra Desfazer |
| `app/index.tsx` | Lista, busca, botões Relatório PDF e Backup, botão Nova empresa |
| `app/empresa-form.tsx` | Cadastro/edição/exclusão da empresa |
| `app/backup.tsx` | Fazer e restaurar backup |
| `src/utils/empresas.ts` | Dados das empresas (AsyncStorage) |
| `src/utils/relatorio.ts` | Relatório PDF |
| `src/utils/backup.ts` | Arquivo de backup |
| `src/components/PlaceCoords.tsx` | Linha 📍 das coordenadas (GPS, ↻ e 🗑) |
| `src/components/UndoBar.tsx` | Barra "Desfazer" de 8 segundos |
| `src/components/AppSplash.tsx` | Tela Splash |
| `src/theme.ts` | Cores e fontes (as mesmas do Controle de Viagens) |
| `assets/images/` | Ícone, logo da Splash (fundo transparente) |

## Gerar o APK
O GitHub Actions (`.github/workflows/build.yml`) compila a cada envio para `main`. Baixe em **Actions → execução → artefato `agenda-empresas-apk`** (cerca de 20 minutos).

## Lançar uma nova versão
Atualize `version` no `app.json` e o texto `Versão:` em `src/components/AppSplash.tsx`.

## Autor
**Luiz Alberto Cardoso** · tecsattv@gmail.com
