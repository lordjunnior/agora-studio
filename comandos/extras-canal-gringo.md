# Canal Gringo (o canal em inglês ou espanhol)

> Pra IA. Faça um passo de cada vez, na ordem. Não invente outro jeito. Como falar com a pessoa: fim de
> `comandos/extras.md`.

O que é: os modelos de canal em inglês (`canal/extras/gringo/canal-en.md`) e em espanhol (`canal-es.md`). **Cada
idioma é um canal separado, numa CÓPIA da pasta da Máquina.** O canal em português nunca é trocado.

## Passo 1. Os modelos estão aqui?

Rode `npm run extras` e leia a linha do Canal Gringo.

- **"os modelos estão em canal/extras/gringo/":** vá pro passo 2.
- **"não está nesta pasta":** traga o `canal-gringo.zip` (seção "Trazer o arquivo pra Máquina" de
  `comandos/extras.md`). Traga **antes** de copiar a pasta, assim os modelos vão junto pra cópia.

## Passo 2. A cópia da Máquina (quem faz é a pessoa)

Diga pra pessoa, com estas palavras (troque o nome da pasta pelo nome desta pasta):

> Agora você vai fazer uma cópia da Máquina pro outro idioma. É assim:
> 1. Feche esta conversa.
> 2. Abra a pasta onde está a sua Máquina. Você vai ver a pasta **maquina-preguica-3d**.
> 3. Copie essa pasta e cole ali do lado (no Mac: clique com o botão direito e escolha "Duplicar").
> 4. Mude o nome da cópia pra **maquina-preguica-3d-en** (inglês) ou **maquina-preguica-3d-es** (espanhol).
> 5. Abra a cópia aqui na IA e me mande: "Esta é a cópia em inglês. Me ajuda a configurar."

Não copie a pasta você mesmo.

## Passo 3. Configurar a cópia (já dentro da cópia)

1. Confira o nome desta pasta: tem que terminar com `-en` ou `-es`. Se não terminar, **pare** e pergunte pra pessoa se
   esta é mesmo a cópia.
2. Pergunte pra pessoa, uma coisa de cada vez:
   - o nome do canal no outro idioma (ex.: Inside Things);
   - o @ nas redes (ex.: @insidethings);
   - a frase do fim do vídeo, no outro idioma (ex.: "And follow Inside Things.").
   Não sabe? Sugira 3 nomes e dê a resposta pronta: `Pode responder: "Pode ser o primeiro"`.
3. Rode (en pro inglês, es pro espanhol):
   `npm run extras -- --gringo en --nome "Inside Things" --arroba @insidethings --assinatura "And follow Inside Things."`
4. Tem que aparecer: `Pronto: esta pasta agora é o canal em inglês.`
   - Se aparecer `Esta pasta (...) já é o canal "..." em português`: o nome desta pasta não termina em `-en` ou `-es`.
     Pergunte pra pessoa se esta é a cópia. **Só se ela disser que sim**, rode o mesmo comando com `--confirmar` no fim
     (ou peça pra ela mudar o nome da pasta, como no passo 2).
5. Abra o `canal/canal.md` e confira: tem a linha **Idioma dos vídeos**, e o nome, o @ e a assinatura estão lá.

## Passo 4. A voz

- **ElevenLabs:** a voz do canal já fala inglês e espanhol. Uma voz nativa soa melhor: se a pessoa quiser, troque no
  painel, em Meu canal (a voz).
- **VoiceStudio:** o comando já mudou o idioma da voz. Teste com `npm run testar-voz` e, se soar estranho, escolha uma
  voz em inglês ou espanhol (`comandos/voicestudio.md`).
- **Voz do computador:** só serve pra teste.

## Passo 5. Fazer os vídeos

Igual a qualquer vídeo: `comandos/novo-video.md`. A diferença: **tudo que vai pro vídeo e pra postar sai no idioma do
canal** (roteiro, legenda, capa, rótulos, título, descrição, hashtags e comentário fixado), seguindo "A fórmula em
inglês" (ou em espanhol) do `canal/canal.md`. **A conversa com a pessoa continua em português.** Se ela pedir, mostre
a tradução de cada frase do lado.

O cartão de seguir do fim do vídeo já sai no idioma do canal ("+ Follow" no inglês).

**Aproveitar um vídeo em português:** copie o `roteiro.json` e o `cena.js` da pasta do vídeo na Máquina em português
(`../maquina-preguica-3d/videos/<tema>`) pra `videos/<tema>-en` aqui e:
1. reescreva cada frase no outro idioma, de um jeito natural, sem traduzir palavra por palavra, com o mesmo número de
   frases e os mesmos planos;
2. traduza a capa, os termos, as etiquetas e qualquer texto escrito dentro do `cena.js`;
3. troque as medidas pras do público do canal (no inglês: graus Fahrenheit, pés, milhas, libras e dólar);
4. faça a revisão, o vídeo e o texto de postar no idioma do canal.

## Não faça

- Não rode o `--gringo` na pasta do canal em português.
- Não traduza palavra por palavra.
- Não fale com a pessoa no outro idioma: só o vídeo e o texto de postar mudam.
