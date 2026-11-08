# Começo da conversa: aviso, conferência, relatório e boas-vindas

> Na primeira resposta de toda conversa (regra número 1 do `AGENTS.md`), quando a pessoa pedir pra conferir ("tá
> instalado?", "confere") e quando pedir ajuda (`/ajuda`, "como usa?", "o que dá pra fazer?", "tô perdido").
> Quem usa pode nunca ter mexido com IA nem com terminal: fala simples, curta, sem termo técnico. Os modelos abaixo são
> um guia: adaptar ao canal e à conversa, com as suas palavras, sem ler como robô.

## 1. Aviso (antes de rodar qualquer coisa)

Uma frase, sozinha, antes do primeiro comando, pra pessoa não ficar olhando a tela parada sem saber o que acontece:

> Oi! Me dá um minutinho: vou ver se está tudo instalado e configurado por aqui. Se aparecer um pedido de permissão,
> pode aceitar: sou eu conferindo.

- A parte da permissão pode sair quando já dá pra ver que a pessoa usa há tempo (ela fala de um vídeo anterior, por
  exemplo). Na dúvida, fica: é uma frase só
- **Quando a pessoa perguntar de uma permissão** ("ele pediu acesso ao Chromium, tá certo?", "pediu pra usar a
  internet"): sim, pode aceitar. Explicar o que é em uma frase: o navegador que desenha o vídeo (ele trabalha escondido
  e tira a "foto" de cada quadro), a internet pra baixar as peças da Máquina ou falar com a ElevenLabs, a janelinha da
  chave. Sem essas permissões o vídeo não sai. No Codex, se ele pedir permissão toda hora, dá pra escolher "Acesso
  completo" no seletor de acesso, embaixo da caixa de mensagem
- Se a mensagem já era um pedido, juntar os dois: "Oi! Já vou ver o vídeo do guarda-chuva. Antes, deixa eu conferir
  rapidinho se está tudo pronto por aqui."
- Ainda não explicar o projeto: isso vem depois do relatório

## 2. Conferência

Rodar `npm run conferir`. Cada linha vem marcada: `[ok]` pronto, `[falta]` resolver antes do vídeo, `[aviso]` funciona
com um porém, `[opcional]` não precisa.

Se o comando nem rodar ("npm não é reconhecido", "command not found"), o Node.js não está instalado: é o único item que
a pessoa resolve sozinha (passo a passo abaixo), e os outros só dá pra conferir depois dele.

## 3. Relatório

Traduzir cada linha pro que a pessoa entende, dizendo quem resolve e mais ou menos quanto leva:

| Linha do conferir | No relatório | Quem resolve |
|---|---|---|
| Node.js | Programa base (Node.js) | A pessoa, com o passo a passo abaixo (uns 5 minutos) |
| motor de animação | Motor de animação | A IA, com o `npm run instalar` (uns 2 a 5 minutos, depende da internet) |
| navegador que desenha o vídeo | Navegador que desenha o vídeo | A IA, no mesmo `npm run instalar` (no Windows usa o Edge, que já vem instalado; no Mac, uns 2 minutos pra baixar) |
| voz de teste do computador | Voz de teste do computador | Linux: a IA instala (pode pedir a senha do computador). Mac: a pessoa, no caminho que o conferir mostra. Windows sem voz em português: nada a fazer, só avisar |
| canal | Seu canal (nome, assunto, personagem, voz) | As duas: a IA pergunta, a pessoa responde (uns 5 minutos) |
| voz do canal | A voz que narra os vídeos | `[falta]` (ainda não escolhida, sem chave, chave recusada): as duas, no passo 3 de `comandos/instalar.md` (a IA explica as 3 opções e guia; uns 5 minutos na ElevenLabs, 20 a 40 no VoiceStudio). `[aviso]`: dizer o que é e a saída (créditos acabando → as opções de `comandos/novo-video.md`; VoiceStudio fechado → `npm run voicestudio -- --abrir` ou a pessoa abre o programa (`comandos/voicestudio.md` se der problema); voz do computador → serve pra testar; chave no arquivo ou na linha com nome errado → a IA corrige sozinha: renomeia o arquivo pra `.env` ou acerta o nome da linha pra `ELEVENLABS_API_KEY=`, sem abrir nem mostrar a chave) |
| chave da ElevenLabs salva (a voz do canal é outra) | Não aparece | Só se a pessoa perguntar |
| logo do canal | Logo do canal | Opcional: a pessoa põe no painel (`npm run painel`) ou manda a imagem |
| banner do YouTube, descrições do canal | Banner e descrições do canal | Opcional: a IA escreve as descrições e a pessoa confere e põe o banner no painel (passo 4 de `comandos/instalar.md`) |

Modelo (primeira vez):

> Pronto, dei uma olhada. Olha o que encontrei:
>
> ✅ Programa base (Node.js): instalado
> ❌ Motor de animação: falta instalar. Eu instalo sozinho (uns 5 minutos)
> ❌ Navegador que desenha o vídeo: falta instalar. Eu instalo sozinho (uns 2 minutos)
> ✅ Voz de teste do computador: funcionando
> ❌ Seu canal: ainda não configurado. Eu te faço umas perguntas rápidas
> ❌ A voz dos vídeos: falta escolher. Te explico as 3 opções (uma é grátis) e configuro com você
> ⚪ Logo do canal: opcional
>
> Resumindo: faltam 4 coisas, e a gente resolve tudo junto em uns 15 minutos.

- Símbolos: ✅ pronto · ❌ falta · ⚠️ funciona, com um porém · ⚪ opcional
- Sem "npm", "playwright", "chromium", "node_modules" nem "dependências": os comandos ficam com a IA
- Todo ❌ diz quem resolve e quanto leva. Fechar com uma linha de resumo
- **Tudo pronto numa conversa de volta:** uma linha só ("Tudo certo por aqui: instalado e configurado."), sem lista.
  `[aviso]` entra numa linha curta; `[opcional]` não aparece
- **Pedido de conferir:** sempre o relatório completo

### Node.js não instalado (a pessoa instala)

> Falta uma coisa que eu não consigo instalar sozinho: o Node.js, o programa que faz a Máquina funcionar. É grátis e
> leva uns 5 minutos:
> 1. Entre em **nodejs.org** e baixe a versão **LTS** (o botão de download da página)
> 2. Abra o arquivo que baixou e vá clicando em **Next** até **Finish** (no Mac: **Continuar** e **Instalar**). Se o
>    computador pedir permissão ou a senha, pode dar: é o instalador
> 3. Feche este programa (o VS Code, ou a janela onde você fala comigo) e abra de novo
> 4. Me diga "instalei" que eu continuo daqui

- **Windows, se a pessoa preferir que a IA instale:** `winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements
  --accept-package-agreements`. Avisar antes que o Windows vai abrir uma janela pedindo permissão e que é só clicar em
  **Sim**. Depois ela fecha e abre de novo o programa da IA (sem isso o Node não aparece) e diz "instalei"
- **Node antigo** (o `npm run instalar` diz que a versão é antiga): é o mesmo passo a passo; a versão LTS do site
  substitui a antiga

**No fim do relatório, o painel** (regra número 4 do `AGENTS.md`): o `npm run conferir` termina com a linha `PAINEL:`.
`ligado`: mande o link dela, clicável. `desligado`: rode `npm run painel` (abre na tela da pessoa) e mande o link que
ele mostrar. Uma frase basta: "Seu painel, com tudo da Máquina: <link>". Se ela disser que não abriu, o link de novo e
o atalho: dois cliques no arquivo `ABRIR-PAINEL`, na pasta da Máquina.

## 4. Boas-vindas (depois do relatório)

| Situação | O que dizer |
|---|---|
| **Primeira vez:** o canal ainda não foi configurado, ou `canal/historico.md` ainda não tem nenhuma anotação | A apresentação, e no fim perguntar se pode começar |
| **Primeiro vídeo:** deu PRONTO, a configuração terminou numa conversa anterior e ainda não tem vídeo (fora o `exemplo`) | 2 ou 3 linhas: tudo pronto pro primeiro vídeo, o tema que você sugeriu na passagem (fim do `canal/historico.md` e da `canal/pauta.md`) e a pergunta "faço esse ou você tem outro tema?". Esta já é a conversa nova: seguir direto pro vídeo |
| **De volta:** deu PRONTO e já tem histórico | 2 ou 3 linhas (modelo abaixo) |
| **Pedido de ajuda** | A apresentação, as dicas e o "O que dá pra pedir" |

Uma vez só por conversa. Se a pessoa já fez um pedido, numa conversa de volta, só a linha do oi e o pedido segue.

### Apresentação (primeira vez)

> **O que é isto:** a Máquina Preguiça 3D transforma um tema (tipo "como funciona um guarda-chuva") num vídeo curto
> animado em 3D, pronto pra postar: roteiro, animação, narração, legenda, som e capa.
>
> **Como a gente vai trabalhar:**
> 1. **Uma vez só, nesta conversa:** eu instalo o que falta e te faço umas perguntas sobre o canal: nome, assunto,
>    personagem e voz. No fim, abro o painel da Máquina no seu navegador pra você pôr o logo, o banner e as descrições
> 2. **A cada vídeo, numa conversa nova comigo:** você me dá um tema, eu escrevo o roteiro e te mostro. Você aprova ou
>    pede mudança
> 3. Eu monto as cenas e você dá a opinião de cada uma no painel. Depois faço o vídeo, já com a capa e o texto de postar
>
> **Antes de começar:**
> - Escreva do seu jeito, como no WhatsApp. Não precisa saber programação nem decorar comando
> - Quando eu pedir permissão pra rodar um comando, sou eu instalando ou fazendo o vídeo: pode aceitar. Na dúvida,
>   pergunte que eu explico
>
> Posso começar? Primeiro eu instalo o que falta, depois a gente configura o seu canal.

A pergunta do fim acompanha o relatório: só falta o canal, "Posso começar as perguntas do canal?"; falta o Node.js, o
fim é o passo a passo dele.

### Dicas (no fim da instalação e no pedido de ajuda)

> - Não gostou de algo? É só falar: "deixa mais curto", "troca a cor da camiseta". Eu anoto toda opinião sua e uso nos
>   próximos vídeos
> - Quanto mais você me contar, melhor eu acerto: pra quem é o canal, um vídeo de outro canal que você admira (e o que
>   gosta nele), o que você não quer de jeito nenhum. Pode mandar a qualquer hora
> - Antes de cada vídeo eu te mando uma folha com uma imagem de cada cena, numerada: é só dizer "a cena 4 ficou
>   estranha" que eu arrumo
> - Quer que valha pra todo vídeo? Comece com "sempre" ou "nunca": "sempre de noite", "nunca use gíria"
> - Postou? Volte uns dias depois e me conte como foi (visualizações, comentários): é assim que eu aprendo o que dá
>   certo no seu canal
> - Cada vídeo novo, numa conversa nova comigo: eu leio tudo do seu canal de novo e o vídeo sai melhor
> - "Abre o painel" mostra todos os seus vídeos no navegador: as cenas, o roteiro, o vídeo pronto e o texto de postar,
>   com botão de copiar. Sem mim, dá pra abrir com dois cliques no arquivo ABRIR-PAINEL, na pasta da Máquina
> - `/ajuda` (ou "me ajuda") mostra estas dicas de novo, e "o que você já aprendeu?" mostra o que eu sei de você

Fora do Claude Code, os atalhos com `/` não existem: nessa dica, dizer só "me ajuda".

### De volta

Um oi, uma coisa que você lembra (onde a conversa anterior parou, no fim do `canal/historico.md`, o último vídeo da
`canal/pauta.md` ou uma preferência de `canal/aprendizados.md`) e o próximo passo, com uma sugestão sua. Exemplo:

> Tudo certo por aqui. O último foi o do guarda-chuva, com o começo de número que você curtiu. Já postou? Se sim, me
> conta como foi. Pro próximo eu iria na "geladeira" (é do dia a dia e tem peça escondida), ou me diz o seu tema.

No máximo uma pergunta sobre resultado por conversa, e só de vídeo postado há 2 dias ou mais que ainda está sem
"Resultado" na pauta.

### Pedido de ajuda: o que dá pra pedir

Depois da apresentação e das dicas, 4 ou 5 exemplos do que dá pra pedir agora, escolhidos pelo momento da pessoa:

- "faz um vídeo sobre como funciona a geladeira"
- "me dá 3 ideias de vídeo"
- "escreve o texto de postar do último vídeo"
- "muda a cor da camiseta do personagem pra azul, pra sempre"
- "o vídeo do guarda-chuva teve 3 mil views"
- "o que você já aprendeu?"
- "abre o painel"

## O que a IA aprendeu

Quando a pessoa perguntar "o que você aprendeu?" ou "o que você sabe de mim?": ler `canal/aprendizados.md` e contar em
tópicos curtos, por assunto (jeito de trabalhar, roteiro, visual, voz, capa e texto, o que dá resultado), em linguagem
simples, sem as lições técnicas. Se ainda não tiver nada, dizer que aprende a cada vídeo e com cada opinião. Fechar
perguntando se quer mudar ou apagar alguma coisa. Se ela pedir, mudar no arquivo e anotar no histórico.
