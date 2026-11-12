# Empresas e Parks — versão 1.4.1

> Antes chamado **Agenda de Empresas**. Só mudou o nome que aparece no celular: o pacote Android continua o mesmo, então a nova versão instala por cima da antiga sem perder dados, e os backups antigos continuam a ser restaurados.

App Android para guardar os contatos das empresas (**nome, endereço, telefone e coordenadas GPS**) e os **parks e postos** de combustível. Feito com Expo / React Native, com o mesmo visual do Controle de Viagens (tema escuro, laranja, fontes Barlow Condensed e DM Sans). Os dados ficam **só no telefone**: sem conta e sem servidor.

## Funções
- **Abas embaixo** (igual ao Controle de Viagens): **Resumo · Empresas · Park/Posto**.
- **Resumo**: total de cadastros, cartões com o número de Empresas, Parks e Postos (tocar abre a aba), atalhos **Nova empresa** e **Park/Posto**, quantos têm coordenadas GPS, **Postos por bandeira**, **Relatório geral PDF** (as duas abas juntas) e **Backup**. Embaixo, **Todos os cadastros**: as duas abas juntas numa lista só, em ordem alfabética, com busca e coordenadas embaixo do nome; tocar abre a edição.
- **Park/Posto**: mesmo padrão da aba Empresas.
  - Campos: **Nome** (obrigatório, com a linha 📍 das coordenadas embaixo), **Tipo** (seletor **Park** ou **Posto**, obrigatório) e **Referência de localidade** (opcional).
  - Ao escolher **Posto**, abre o pop-up das **bandeiras dos postos** (as redes: Shell, BP, Galp, Repsol, Petrobras, Ipiranga, Love's, Pilot Flying J…), separadas nas abas 🇪🇺 Europa, 🇺🇸 EUA e 🇧🇷 Brasil, com opção **Outra bandeira** digitada. Cada bandeira aparece como um selo na cor da rede com a sigla dela (ex.: SHELL, BP, BR, GALP); Park aparece como um "P" azul.
  - Lista com busca, filtro Todos / Parks / Postos, arrastar para apagar, Desfazer e **Relatório PDF** (só o que estiver filtrado).
- **Atualização pelo próprio app** (nova na 1.4.0): ao abrir (no máximo a cada 6 h) o app pergunta ao GitHub se há versão nova e mostra **"Nova versão do Empresas e Parks — Atualizar / Agora não"**. **Atualizar** baixa o APK e abre o instalador do Android (na 1ª vez o Android pede para liberar **Instalar apps desconhecidos**). "Agora não" não pergunta de novo pela mesma versão. Em **Backup → Procurar atualização do app** dá para verificar na hora. Os dados ficam no telefone e continuam depois da atualização.
- **Distância até você** (nova na 1.3.0): em cada cartão com coordenadas aparece a linha laranja ➤ **"12,4 km de você"** — nas abas Empresas, Park/Posto e na lista do Resumo. É a distância **em linha reta** (não pela estrada) e se atualiza sozinha conforme você anda (a cada ~50 m). O GPS só fica ligado enquanto uma dessas telas está aberta, para poupar bateria. Sem GPS ou sem coordenadas no cadastro, a linha não aparece.
- **Lista de empresas** em ordem alfabética, com busca por nome, endereço ou telefone (ignora acentos).
  - Tocar no telefone faz a ligação; tocar no endereço ou nas coordenadas abre o Google Maps.
- **Arrastar para apagar**: na lista, arraste a empresa para o lado para revelar o botão vermelho **Apagar** (igual ao Controle de Viagens); tocar no cartão abre a edição ("Toque para editar").
- **Cadastro**: só o **Nome** é obrigatório; Endereço e Telefone são opcionais.
  - Ao tocar no campo Nome, o app pega o GPS e mostra a linha 📍 com as coordenadas logo abaixo do nome.
  - 🗑 apaga as coordenadas. Enquanto houver coordenadas, a setinha ↻ fica escondida (não dá para atualizar); ela só aparece quando a empresa está sem coordenadas — por exemplo, depois de apagar — e aí busca o GPS de novo.
- **Relatório PDF (A4)**: uma ficha por empresa com o total no fim. Campos não preenchidos não aparecem. Compartilha por WhatsApp, e-mail, Drive etc. Respeita a busca: se houver filtro, sai só o que está na lista.
- **Backup** (igual ao Controle de Viagens): arquivo `.json` com todas as empresas e parks/postos.
  - **Salvar backup no telefone** (Android): na primeira vez escolhe uma pasta (ex.: Download); depois grava sempre `agenda-empresas-backup.json` nela, **substituindo o backup anterior** (não acumula arquivos). **Trocar pasta** escolhe outra.
  - **Enviar backup**: abre o Compartilhar (Drive, WhatsApp, e-mail).
  - **Restaurar backup** escolhe o arquivo e substitui os dados do telefone. Backups antigos (só empresas) continuam a funcionar e não mexem nos parks/postos.
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
| `app/backup.tsx` | Salvar no telefone, enviar e restaurar backup |
| `src/utils/empresas.ts` | Dados das empresas (AsyncStorage) |
| `src/utils/locais.ts` | Dados dos parks/postos (AsyncStorage) |
| `src/utils/bandeiras.ts` | Lista de bandeiras de postos (Europa, EUA, Brasil) |
| `src/utils/relatorio.ts` | Relatórios PDF (Empresas, Park/Posto e Geral) |
| `src/utils/distancia.ts` | Posição atual do GPS e distância até cada cadastro |
| `src/utils/backup.ts` | Arquivo de backup (pasta fixa do telefone e Compartilhar) |
| `src/components/PlaceCoords.tsx` | Linha 📍 das coordenadas (GPS, ↻ e 🗑) |
| `src/components/BandeiraPicker.tsx` | Pop-up das bandeiras |
| `src/components/LocalIcon.tsx` | Ícone do Park ("P") e do Posto (bomba na cor da bandeira) |
| `src/components/SwipeableRow.tsx` | Cartão com arrastar para apagar |
| `src/components/UndoBar.tsx` | Barra "Desfazer" de 8 segundos |
| `src/components/AppSplash.tsx` | Tela Splash |
| `src/components/UpdateChecker.tsx` | Atualização pelo próprio app (aviso, download e instalador) |
| `src/theme.ts` | Cores e fontes (as mesmas do Controle de Viagens) |
| `assets/images/` | Ícone, logo da Splash (fundo transparente) |

## Gerar o APK
O GitHub Actions (`.github/workflows/build.yml`) compila a cada envio para `main`. Leva cerca de 20 minutos. O APK fica em **Releases** (o mais novo é o "Latest") e também em **Actions → execução → artefato `agenda-empresas-apk`**.

## Atualização pelo próprio app
Cada build publica o APK numa **Release** `build-<número>`; o número também vai para o app em `extra.buildNumber` e no `versionCode`. O app compara esse número com o da última Release para saber se há atualização. O título da Release leva a versão (ex.: "Empresas e Parks 1.4.0"), que aparece no aviso.

- O repositório precisa continuar **público**: o app consulta o GitHub sem login.
- A primeira versão com essa função (1.4.0) precisa ser instalada à mão (Releases ou Actions). Daí em diante o app se atualiza sozinho.

## Assinatura do APK (chave de release)
Desde a **1.4.1** o APK é assinado com uma **chave de release própria**, e não mais com a chave de teste pública do Expo. Com a chave de teste, o Google Play Protect bloqueava a instalação ("App nocivo bloqueado"), porque o app também tem permissão para instalar atualizações.

- A chave fica nos **Secrets** do GitHub (Settings → Secrets and variables → Actions):
  - `ANDROID_KEYSTORE_BASE64`: o arquivo `empresasparks-release.jks` em Base64
  - `ANDROID_KEYSTORE_PASSWORD`: a senha da chave (alias `empresasparks`)
- Sem esses Secrets o build **para com erro** de propósito, para nunca publicar um APK com outra assinatura.
- O build confere se o APK saiu assinado com a chave certa.
- Se um dos Secrets estiver errado, o build para em 1 minuto e diz **qual** deles: a senha (`ANDROID_KEYSTORE_PASSWORD`) ou o arquivo da chave (`ANDROID_KEYSTORE_BASE64`).
- ⚠️ **Guarde uma cópia do `.jks` e da senha fora do GitHub.** Se a chave se perder, as próximas versões não instalam por cima: vai ser preciso desinstalar e instalar de novo.
- **Mudança da 1.4.0 para a 1.4.1:** como a assinatura mudou, a 1.4.1 não instala por cima da 1.4.0 (nem pela atualização do app). Faça **Backup → Salvar**, desinstale, instale a 1.4.1 e **Restaurar backup**. Só é preciso fazer isso uma vez.
- Se o Play Protect ainda avisar, dá para enviar o APK para análise do Google como falso positivo.

## Lançar uma nova versão
Suba `version` no `app.json` (1.4.0 → 1.5.0…). A tela Splash e o Backup mostram essa versão automaticamente, e o número do build muda sozinho a cada compilação.

## Autor
**Luiz Alberto Cardoso** · tecsattv@gmail.com
