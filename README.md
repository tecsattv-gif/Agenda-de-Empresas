# Agenda de Empresas — versão 1.1.0

App Android para guardar os contatos das empresas (**nome, endereço, telefone e coordenadas GPS**) e os **parks e postos** de combustível. Feito com Expo / React Native, com o mesmo visual do Controle de Viagens (tema escuro, laranja, fontes Barlow Condensed e DM Sans). Os dados ficam **só no telefone**: sem conta e sem servidor.

## Funções
- **Abas embaixo** (igual ao Controle de Viagens): **Resumo · Empresas · Park/Posto**.
- **Resumo**: total de cadastros, cartões com o número de Empresas, Parks e Postos (tocar abre a aba), atalhos **Nova empresa** e **Park/Posto**, quantos têm coordenadas GPS, **Postos por bandeira**, **Relatório geral PDF** (as duas abas juntas) e **Backup**. Embaixo, **Todos os cadastros**: as duas abas juntas numa lista só, em ordem alfabética, com busca e coordenadas embaixo do nome; tocar abre a edição.
- **Park/Posto**: mesmo padrão da aba Empresas.
  - Campos: **Nome** (obrigatório, com a linha 📍 das coordenadas embaixo), **Tipo** (seletor **Park** ou **Posto**, obrigatório) e **Referência de localidade** (opcional).
  - Ao escolher **Posto**, abre o pop-up das **bandeiras**, separado em 🇪🇺 Europa, 🇺🇸 EUA e 🇧🇷 Brasil (Shell, BP, Galp, Repsol, Petrobras, Ipiranga, Love's, Pilot Flying J…), com opção **Outra bandeira** digitada. Cada bandeira aparece como uma bomba na cor da rede; Park aparece como um "P" azul.
  - Lista com busca, filtro Todos / Parks / Postos, arrastar para apagar, Desfazer e **Relatório PDF** (só o que estiver filtrado).
- **Lista de empresas** em ordem alfabética, com busca por nome, endereço ou telefone (ignora acentos).
  - Tocar no telefone faz a ligação; tocar no endereço ou nas coordenadas abre o Google Maps.
- **Arrastar para apagar**: na lista, arraste a empresa para o lado para revelar o botão vermelho **Apagar** (igual ao Controle de Viagens); tocar no cartão abre a edição ("Toque para editar").
- **Cadastro**: só o **Nome** é obrigatório; Endereço e Telefone são opcionais.
  - Ao tocar no campo Nome, o app pega o GPS e mostra a linha 📍 com as coordenadas logo abaixo do nome.
  - 🗑 apaga as coordenadas. Enquanto houver coordenadas, a setinha ↻ fica escondida (não dá para atualizar); ela só aparece quando a empresa está sem coordenadas — por exemplo, depois de apagar — e aí busca o GPS de novo.
- **Relatório PDF (A4)**: uma ficha por empresa com o total no fim. Campos não preenchidos não aparecem. Compartilha por WhatsApp, e-mail, Drive etc. Respeita a busca: se houver filtro, sai só o que está na lista.
- **Backup**: gera um arquivo `.json` com todas as empresas e parks/postos pelo Compartilhar; **Restaurar backup** escolhe o arquivo e substitui os dados do telefone. Backups antigos (só empresas) continuam a funcionar e não mexem nos parks/postos.
- **Apagar com segurança**: tudo que apaga (empresa, park/posto, coordenadas, restauração de backup) pergunta "Tem certeza?" e depois mostra **Desfazer** por 8 segundos.
- **Splash** com a logo (fundo transparente), nome, créditos e barra de carregamento.

## Estrutura
| Arquivo | Função |
|---|---|
| `app/_layout.tsx` | Fontes, Splash, navegação e barra Desfazer |
| `app/(tabs)/_layout.tsx` | Abas de baixo: Resumo, Empresas, Park/Posto |
| `app/(tabs)/index.tsx` | Resumo (as duas abas juntas) |
| `app/(tabs)/empresas.tsx` | Lista de empresas, busca, Relatório PDF e Backup |
| `app/(tabs)/locais.tsx` | Lista de parks/postos, busca, filtro e Relatório PDF |
| `app/empresa-form.tsx` | Cadastro/edição/exclusão da empresa |
| `app/local-form.tsx` | Cadastro/edição/exclusão do park/posto |
| `app/backup.tsx` | Fazer e restaurar backup |
| `src/utils/empresas.ts` | Dados das empresas (AsyncStorage) |
| `src/utils/locais.ts` | Dados dos parks/postos (AsyncStorage) |
| `src/utils/bandeiras.ts` | Lista de bandeiras de postos (Europa, EUA, Brasil) |
| `src/utils/relatorio.ts` | Relatórios PDF (Empresas, Park/Posto e Geral) |
| `src/utils/backup.ts` | Arquivo de backup |
| `src/components/PlaceCoords.tsx` | Linha 📍 das coordenadas (GPS, ↻ e 🗑) |
| `src/components/BandeiraPicker.tsx` | Pop-up das bandeiras |
| `src/components/LocalIcon.tsx` | Ícone do Park ("P") e do Posto (bomba na cor da bandeira) |
| `src/components/SwipeableRow.tsx` | Cartão com arrastar para apagar |
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
