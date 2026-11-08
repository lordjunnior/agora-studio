# Comece aqui

**Pra que serve:** a Máquina Preguiça 3D transforma um tema em um vídeo curto animado em 3D, pronto pra postar
(roteiro, animação, narração, legenda, som e capa). Você escolhe o assunto e aprova o roteiro; a IA faz o resto.

**Dúvidas?** Pergunte pra sua IA, com a pasta da Máquina aberta: **"Me ajuda a fazer isso"**. Ela conhece a Máquina
inteira. No painel, o menu **Ajuda** tem as perguntas mais comuns, com o pedido pronto pra copiar. O mesmo passo a
passo, com imagens, está no `COMECE-AQUI.pdf`, que vem no zip junto com esta pasta.

Do zero ao primeiro vídeo postado. Siga na ordem.

## Escolha o seu jeito

Funciona com qualquer IA, até gratuita. O que muda é quanto ela faz sozinha e o capricho do vídeo.

| | Jeito 1: IA de código, que trabalha na pasta (recomendado) | Jeito 2: qualquer IA de chat (grátis) |
|---|---|---|
| **Qual IA** | **Claude Code** (o que usamos no nosso canal, plano pago). Também leem estas instruções: Codex, Gemini CLI, Cursor e GitHub Copilot no VS Code, alguns com plano grátis | ChatGPT, Gemini, Claude, DeepSeek, Copilot, inclusive nos planos gratuitos |
| **Como funciona** | Você pede o vídeo e a IA faz tudo: roteiro, cena própria, prévias, render, capa e texto de postar | A IA escreve o roteiro, você copia a resposta e um comando faz o vídeo |
| **Como fica** | O melhor: uma cena feita sob medida pra cada frase, personagem atuando, ritmo de videogame | Mais simples: o objeto montado peça por peça; a câmera, o personagem e as peças mudam sozinhos a cada frase |
| **Passo a passo** | Continua abaixo | `comandos/modo-chat.md` |

Testado com o Claude Code. As outras IAs de código leem as mesmas instruções (`AGENTS.md`); o resultado depende de
quão bom é o modelo que você usa.

## O que você precisa

- **Um computador** com Windows, Mac ou Linux, e uns 2 GB livres
- **Uma IA** (veja a tabela acima)
- **Node.js 20 ou mais novo** (grátis, em nodejs.org: baixe a versão LTS). No jeito 1, a IA confere pra você
- **Uma voz pros vídeos** (a IA pergunta na instalação e te guia): a **ElevenLabs** (a melhor; tem plano grátis pra
  testar), o **VoiceStudio** (grátis, roda no seu computador) ou a voz do próprio computador (robótica, só pra testar).
  Detalhes em "A voz dos vídeos", no fim desta página

## São duas etapas, cada uma na sua conversa

1. **Instalar e configurar:** uma vez só, numa conversa com a IA (uns 15 minutos)
2. **Fazer os vídeos:** cada vídeo numa **conversa nova** com a IA

Por que separar? A IA tem uma memória de conversa com limite, e a instalação ocupa boa parte dela. Numa conversa nova,
ela lê tudo do seu canal do zero e o vídeo sai bem melhor. Nada se perde: tudo fica guardado na pasta.

## Já tinha a Máquina? Passe tudo pra versão nova

Se você usava uma versão anterior, o seu canal, os seus vídeos, o logo e a chave da voz vêm todos pra versão nova, sem
copiar nada na mão:

1. **Extraia a versão nova numa pasta nova**, ao lado da antiga. Não extraia por cima da antiga: se a IA tinha
   criado um personagem próprio dentro do motor antigo, ele se perderia
2. **Abra a pasta nova na sua IA e diga "instalar".** Ela instala e, se achar a versão antiga no computador, pergunta
   se pode trazer. Diga que sim. (Ou peça direto: **"traz o canal da minha pasta antiga"**)
3. **Antes de trazer, ela mostra o que vem:** o nome do canal, quantos vídeos, se tem logo e chave. Nada muda até você
   dizer sim
4. **Pronto:** o painel abre com o seu canal e os seus vídeos. O que for novidade desta versão (uma pergunta nova sobre
   o canal, por exemplo) aparece no painel, em **Meu canal**, pra você completar

Sem IA, pelo painel: dois cliques no **ABRIR-PAINEL** da pasta nova, e em **Comece aqui**, no quadro **"Já tinha a
Máquina?"**, clique em **Procurar a pasta antiga** e em **Trazer desta pasta**.

**O que é garantido:**
- A pasta antiga não muda nada: ela só é lida. Guarde ela até conferir tudo na nova, e depois apague se quiser
- Na pasta nova nada é apagado. Se você já tinha configurado o canal nela, ele fica, e o antigo só completa o que
  estava em branco
- Os vídeos vêm inteiros, com a narração guardada: refazer um vídeo antigo não gasta crédito da voz de novo. Se não
  couber no disco, eles vêm sem os arquivos de vídeo (.mp4), que continuam na pasta antiga
- Um canal por pasta: se a pasta antiga for de outro canal, ela não é misturada com o canal da pasta nova

**Personagem próprio:** se a IA tinha criado um personagem ou cenário só pro seu canal dentro do motor antigo, ele não
vem sozinho (o motor da versão nova é outro). A Máquina avisa, guarda uma cópia e você escolhe: pedir pra IA trazer
("traz as peças próprias do motor antigo pra canal/pecas/", com uma IA boa) ou trocar pra um dos personagens prontos,
no painel, em **Meu canal**. Daqui pra frente, as peças próprias ficam na pasta `canal/pecas/`, que a versão nova não
apaga.

## 1. Instalar e configurar (uma vez só, uns 15 minutos)

1. Abra esta pasta na sua IA de código
2. No Claude Code, digite **`/instalar`**. Nas outras, escreva **instalar**

Ou só diga "oi": a IA confere o que falta instalar ou configurar, te mostra um resumo e explica como funciona. Depois
ela instala o que falta, renderiza o vídeo de exemplo pra ver se está tudo certo, faz umas perguntas rápidas sobre o
seu canal (nome, tema, jeito de falar e o seu personagem) e te ajuda a escolher a voz. As respostas vão pra pasta
`canal/`. No fim, ela abre o **painel** da Máquina no seu navegador, pra você colocar o logo, o banner do YouTube e as
descrições do canal (veja "O painel", mais abaixo), e te pede pra abrir uma conversa nova pro primeiro vídeo.
Perdeu-se? Digite **`/ajuda`** (ou "me ajuda").

**Você não precisa abrir terminal nem mexer em arquivo:** quem roda tudo é a IA. Só duas coisas são suas:
- **Aceitar os pedidos de permissão.** A IA vai pedir pra instalar as peças da Máquina, abrir o navegador que desenha o
  vídeo (ele trabalha escondido, tirando a "foto" de cada quadro; às vezes aparece com o nome Chromium) e falar com a
  ElevenLabs. Pode aceitar: sem isso o vídeo não sai. No **Codex**, se ele pedir toda hora, escolha **"Acesso
  completo"** no seletor de acesso, embaixo da caixa de mensagem
- **Colar a chave da voz.** Na hora da ElevenLabs, abre uma **janelinha no seu navegador** com o passo a passo e uma
  caixa: é só colar a chave lá e clicar em **Salvar**. A janela já diz se funcionou

Não precisa instalar mais nada (Remotion, HyperFrames, outro programa de vídeo): a Máquina tem motor próprio. Se a IA
sugerir instalar outra coisa, diga que não precisa.

### Prefere responder tudo de uma vez?

Abra o arquivo **`CONFIGURAR-MEU-CANAL.txt`**, aqui na pasta, no Bloco de Notas (Windows) ou no TextEdit (Mac). Ele
tem todas as perguntas do canal, com exemplo. Responda cada uma depois de "Resposta:" (o que não souber, deixe em
branco), salve, selecione tudo, copie e cole na conversa com a IA. Ela roda um comando, salva tudo e abre o painel em
**Meu canal** pra você conferir. Funciona com qualquer IA, até a mais simples. A sua IA só conversa e não mexe na
pasta? Cole o texto no painel, em **Meu canal**, no quadro **Preencher tudo de uma vez**.

## 2. Fazer os vídeos (uma conversa nova pra cada um)

Primeiro, abra uma **conversa nova** com a IA:

| Programa | Conversa nova |
|---|---|
| Claude Code no VS Code | o botão de conversa nova, no alto do painel do Claude |
| Claude Code no terminal | digite `/clear` |
| Codex | o botão **+** no alto do painel do Codex |
| Cursor, GitHub Copilot | o botão **+** (nova conversa) no alto do chat |
| Gemini CLI | digite `/quit` e abra de novo |

Depois, no Claude Code, digite **`/novo-video`** e o tema. Nas outras, escreva o pedido. Exemplos:

```
/novo-video como funciona um guarda-chuva
faz um vídeo sobre como funciona um guarda-chuva
```

A IA:
1. escreve o roteiro na fórmula (pergunta curiosa no começo, objeto montado peça por peça) com a ideia de cena de cada
   frase, te mostra e pergunta o que você achou;
2. depois do seu ok, monta as cenas (o objeto peça por peça, o personagem atuando, a câmera mudando a cada frase),
   confere tudo sozinha e abre as cenas no **painel**, uma imagem por frase. Em cada cena você clica em **Gostei** ou
   em **Mudar** (e escreve o que mudar), clica em **Mandar pra IA** e diz pra ela "mandei". Ela arruma o que você
   marcou. Prefere falar na conversa? "A cena 4 ficou estranha" também vale;
3. renderiza o vídeo em `videos/<tema>/video.mp4`, já entrega a capa (`capa.png`) e o texto de postar
   (`publicacao.md`) e pede a sua opinião.

Quer mudar alguma coisa? É só pedir: "deixa a panela vermelha", "troca o gancho", "fala mais devagar".

**Onde fica cada coisa:** tudo de um vídeo fica na pasta dele, `videos/<tema>/`. Ali estão o vídeo, a capa e o texto
de postar. As imagens e vídeos de teste ficam em `testes/`, e as versões antigas, se você pediu pra refazer, em
`versoes/`. As amostras de voz ficam em `canal/testes-de-voz/`.

**Dica:** o primeiro vídeo fica melhor com uns 60 segundos. Depois que pegar o jeito, faça vídeos de mais de 1 minuto
(é o que conta pra monetização em várias redes).

**17 cenários prontos:** canteiro de obras, natureza com montanhas, cidade com trânsito, frente de casa, cozinha,
sala, praia, fundo do mar, espaço, Lua, fazenda, floresta, deserto com pirâmides, consultório, oficina mecânica,
escritório e estúdio. A IA escolhe o que combina com o tema, mas você pode pedir: "faz esse na cidade, de noite". Veja
todos na foto `referencias/cenarios/todos.jpg`. Também tem bichos prontos (gato, cachorro, camaleão, ornitorrinco,
mosca, mosquito) e personagens extras (um doutor e um operário de obra): é só pedir.

**Próximo vídeo?** Outra conversa nova. Os ajustes de um vídeo ("deixa a panela vermelha") você pede na conversa dele.

## 3. Postar

O vídeo já sai com o `publicacao.md`, com o título, a descrição, as hashtags e o comentário pra fixar. No painel, em
**Vídeos**, cada um tem botão de copiar. Quer outra versão do texto? No Claude Code, digite **`/publicar`**; nas outras,
peça "escreve o texto de postar".

- **TikTok, Instagram e Kwai:** envie o `capa.png` como capa
- **YouTube Shorts:** não aceita capa enviada; escolha o **1º quadro do vídeo**, que é a própria capa

## 4. A IA aprende com você

Tudo o que você pede, elogia ou corrige fica anotado na pasta `canal/`, e a IA lê isso antes de cada vídeo novo:
- `canal/historico.md`: tudo o que você disse, com a data
- `canal/aprendizados.md`: o resumo do que ela aprendeu do seu gosto. Pode abrir e editar: apagou uma linha, ela esquece

Pra ela aprender mais rápido:
- **Quanto mais você contar, melhor fica:** pra quem é o canal, um vídeo de outro canal que você admira (e o que você
  gosta nele), o que você não quer de jeito nenhum. Pode contar a qualquer hora, do seu jeito
- Comece com **"sempre"** ou **"nunca"** pra virar regra: "sempre de noite", "nunca use gíria"
- Responda quando ela perguntar o que você achou: uma nota de 1 a 5, a cena que mais gostou e a que ficou estranha (pelo
  número da folha) já ajudam muito. As cenas que você elogia viram modelo pros próximos vídeos
- Depois de postar, volte e conte como foi (visualizações, comentários): ela aprende o que dá certo no seu canal
- Pergunte **"o que você já aprendeu?"** pra ver o que ela sabe de você

## O painel

Uma página no seu navegador, só no seu computador, com tudo da Máquina. Ela atualiza sozinha enquanto a IA trabalha,
e abre sozinha quando a IA instala a Máquina, quando as cenas ficam prontas e quando o vídeo fica pronto. Pra abrir
quando quiser:
- Peça pra IA: **"abre o painel"** (ela também manda o link no fim de cada resposta: é só clicar)
- Ou dois cliques no arquivo **`ABRIR-PAINEL`**, aqui na pasta (`ABRIR-PAINEL.command` no Mac, `ABRIR-PAINEL.bat` no
  Windows). Na primeira vez, se o computador perguntar se pode abrir, pode: é a Máquina
- Dica: com o painel aberto, salve nos favoritos do navegador (Ctrl+D, ou Cmd+D no Mac)

O painel é só a parte visual: mostra o que a Máquina fez e facilita algumas configurações. Mudança no vídeo, no roteiro
ou nas cenas, você pede no chat da IA. O menu fica do lado:

- **Comece aqui:** como a Máquina funciona, o que já está pronto e o que falta, com a barra de progresso, o vídeo de
  exemplo (a lanterna, que vem pronta no zip e aparece em **Vídeos**) e o quadro pra subir modelos 3D
- **Meu canal:** a capa (o banner do YouTube), o logo, o nome e o @, do que o canal fala, quem assiste, o jeito de
  falar, a marca registrada, o estilo da capa, o personagem (e as cores dele), o cenário e a hora, a voz, a cor do canal
  e as descrições no YouTube, no TikTok e no Instagram, com botão de copiar. O que você salva lá vale pros próximos vídeos.
  Lá também fica o quadro **Preencher tudo de uma vez**, com o modelo de perguntas pra responder e colar
- **Vídeos:** um card pra cada vídeo. Dentro dele: o vídeo pronto pra assistir e baixar, o título do YouTube, a
  descrição e o comentário fixado com botão de copiar, as cenas (onde você dá a opinião de cada uma), o roteiro e
  quanto o vídeo gastou: os tokens da IA (no Claude Code e no Codex, que guardam essa conta) e os créditos da
  ElevenLabs (quando a voz é ela)
- **Modelos 3D:** tudo que a Máquina sabe desenhar (cenários, personagens, bichos, objetos e modelos prontos), com a
  foto e o pedido pronto pra copiar. Se você baixou um pacote extra na área de membros, é só arrastar o `.zip` (ou a
  pasta dele) pro quadro "Subir modelos 3D" (também tem em Comece aqui): a Máquina põe cada coisa no lugar, tira a
  foto de cada modelo, e a IA já usa no próximo vídeo. Ou diga pra IA: "instala o pacote que eu baixei"
- **Potencializar a máquina:** os extras que deixam a Máquina mais forte (30 Roteiros + 100 Temas, Canal Gringo,
  Checklist Viral + Plano de 30 Dias e Atualizações Para Sempre), com o link pra comprar. Comprou algum? Baixe o arquivo
  na área de membros da Cakto e solte no quadro dessa tela (vale também o arquivo que chegou pelo Google Drive): a
  Máquina põe cada coisa no lugar. Os 30 roteiros entram em Vídeos já com o personagem, a voz, a cor e o @ do seu canal,
  e a tela de cada extra mostra como usar, com os pedidos pra copiar. Em Atualizações Para Sempre fica o que mudou em
  cada versão (o mesmo do arquivo `NOVIDADES.md`)
- **Ajuda:** as perguntas mais comuns, separadas por assunto, com um campo pra procurar. Cada resposta traz o pedido
  pronto pra você copiar e mandar pra sua IA. Lá também estão as boas práticas, pra você se virar sozinho

## Se der erro

Diga pra IA: **"deu erro, roda o instalar de novo"**. Ela roda o instalador, que confere tudo, conserta o que dá e diz
o que falta em palavras simples. Se o erro apareceu num vídeo, copie a mensagem e cole pra IA: ela conhece o motor e
resolve. No Windows, se o navegador que desenha o vídeo não abrir, a Máquina usa sozinha o Microsoft Edge, que já vem
no computador. Não resolveu? Mande pra IA: **"Me ajuda a resolver esse erro"**, junto com a mensagem. Só se nem assim
resolver, escreva pra desconstruindouniverso@gmail.com com o print do erro, o sistema do computador (Windows, Mac ou
Linux) e o que você estava fazendo.

**Quer mostrar um exemplo pra IA?** Mande prints, fotos ou desenhos direto na conversa (arraste a imagem pra lá). Vídeo
a IA não assiste, mas ela tira umas fotos dele: diga onde está o arquivo ("o vídeo está em Downloads, chama
cidade.mp4") e peça pra ela olhar.

## A voz dos vídeos

A IA pergunta na instalação qual você quer e te guia. Dá pra trocar quando quiser: é só pedir "quero trocar a voz".

| | ElevenLabs | VoiceStudio | Voz do computador |
|---|---|---|---|
| **Como é** | voz de gente de verdade (a melhor) | boa, gerada no seu computador | robótica |
| **Custa** | plano grátis pra testar (uns 10 minutos de narração por mês); pago a partir de uns US$ 5 a 6 por mês | grátis, sem limite | grátis |
| **Pode monetizar?** | só nos planos pagos | a voz padrão não (licença não comercial); confira a licença do modelo no próprio VoiceStudio | serve só pra testar |
| **Precisa** | uma conta em elevenlabs.io e a "chave" dela | instalar o programa (uns 250 MB, mais o modelo de voz) e um computador mais forte (Mac M1 ou mais novo, ou Windows com placa de vídeo boa) | nada |

**ElevenLabs, o caminho:** a IA abre uma janelinha no seu navegador com tudo, na ordem: o botão pra criar a conta em
**elevenlabs.io**, o botão pra página das chaves (no menu, **Developers** e depois **API Keys**: clique em **Create API
Key** e copie o código que começa com **sk_**) e uma caixa pra colar a chave e clicar em **Salvar**. A janela guarda a
chave no lugar certo, só no seu computador, testa e diz quanto sobra do seu plano. Depois a IA lista as vozes da sua
conta e faz umas amostras pra você ouvir e escolher (ficam em `canal/testes-de-voz/`). Vozes brasileiras: no site,
**Voices** > **Voice Library**, filtre **Portuguese** e clique em **Add to my voices**. Fazendo na mão, sem IA: **`npm
run chave`** abre a mesma janelinha.

**Créditos:** 1 minuto de vídeo gasta uns 1.000 caracteres. Cada frase narrada fica guardada na pasta do vídeo:
renderizar de novo não gasta, só frase nova ou alterada. O `npm run conferir` mostra quanto sobra e quando o plano
renova. Acabou no meio de um vídeo? O motor para, explica e as frases prontas ficam guardadas: dá pra esperar renovar,
subir o plano, trocar pro VoiceStudio ou fazer com a voz do computador.

**VoiceStudio, o caminho:** a IA te guia tela por tela (o passo a passo completo está em `comandos/voicestudio.md`).
Em resumo: confira se o computador aguenta (Mac com chip M1 ou mais novo, ou Windows 10/11 de 64 bits, com uns 10 GB
livres), instale pelo site **github.com/debpalash/VoiceStudio/releases** (Mac: o arquivo `mac-arm64.dmg`; Windows: o
`win-x64.exe`) e abra. Na primeira vez ele baixa vários GB, de 10 a 40 minutos. Depois, crie a voz do canal em
**Clonar**, a partir de 10 a 20 segundos de uma voz **brasileira** clara (o sotaque sai igual ao do áudio; a "Demo Voice"
que vem nele fala inglês), e salve como perfil de voz com o nome **Narrador**. A IA testa e configura o resto. Do
VoiceStudio você só usa isso: as outras abas (dublagem, transcrição, audiolivro...) são pra outros usos e pode ignorar.
Deixe o programa aberto enquanto o vídeo é feito.
