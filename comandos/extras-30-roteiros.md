# 30 Roteiros + 100 Temas

> Pra IA. Faça um passo de cada vez, na ordem. Não invente outro jeito. Como falar com a pessoa: fim de
> `comandos/extras.md`.

O que é: 30 roteiros prontos, nas pastas `videos/01-guarda-chuva` até `videos/30-cadeira-de-escritorio` (a lista está
no fim), e 100 temas com gancho, em `canal/extras/roteiros/100-temas.md`. **As frases dos 30 roteiros já estão escritas
e conferidas: não mude nenhuma palavra.**

## Passo 1. Os roteiros estão aqui, com o canal?

Rode `npm run extras` e leia a linha do 30 Roteiros:

- **"30 roteiros em videos/ ... com o canal":** tudo certo. Vá pro passo 2.
- **"não está nesta pasta":** traga o `30-roteiros.zip` (seção "Trazer o arquivo pra Máquina" de
  `comandos/extras.md`) e rode `npm run extras` de novo.
- **"AINDA SEM O CANAL":** os roteiros estão com o personagem e a voz padrão. Faça assim:
  1. Rode `npm run conferir`. Se o canal não estiver PRONTO, termine a configuração primeiro (`comandos/instalar.md`,
     só o que falta).
  2. Rode `npm run extras -- --canal`.
  3. Tem que aparecer: `Pronto: 30 roteiros com o canal de agora.`

**Não edite os `roteiro.json` à mão pra trocar o personagem, a voz, a cor ou o @.** O `npm run extras -- --canal` faz
isso certo, em todos. Rode de novo sempre que a pessoa mudar o personagem, a voz, a cor ou o @ do canal.

## Passo 2. Fazer o vídeo de um roteiro (o jeito rápido)

A pessoa diz algo como "faz o vídeo de videos/02-descarga", "faz o roteiro 2" ou "faz o da descarga".

1. Ache a pasta na lista do fim. "Roteiro 2" é `videos/02-descarga`.
2. Avise a pessoa: "Vou fazer o vídeo. Leva uns minutos."
3. Rode: `node motor/render.js videos/02-descarga`
   - A pasta não tem `cena.js`: está certo, esses roteiros são assim (a Máquina monta as cenas sozinha).
   - Se aparecer `O VÍDEO NÃO FOI FEITO: falta terminar de configurar`: termine a configuração
     (`comandos/instalar.md`, só o que falta), rode `npm run extras -- --canal` e tente de novo.
   - Se o vídeo saiu em `testes/video-voz-teste.mp4` em vez de `video.mp4`: falta a voz do canal. Resolva a voz
     (`comandos/instalar.md`, passo 3), rode `npm run extras -- --canal` e faça o vídeo de novo.
4. No fim tem que aparecer `pronto: .../video.mp4`.
5. Faça a entrega completa, como manda o passo 5 de `comandos/novo-video.md` (o texto de postar com
   `comandos/publicar.md`, os custos e o link do painel).
6. No jeito rápido, a Máquina escolhe as cenas sozinha. Ofereça o caprichado: `Quer as cenas feitas só pra esse
   vídeo, mais bonitas? Pode responder: "Faz mais bonito"`.

## Passo 3. O jeito caprichado (uma cena só pra esse roteiro)

A pessoa diz "com cena própria", "caprichado" ou "faz mais bonito".

1. Leia o `roteiro.json` e o `roteiro.md` da pasta. **As frases não mudam: nenhuma palavra.**
2. Siga `comandos/novo-video.md` a partir do passo 1, mas sem escrever roteiro novo: use as frases deste roteiro, na
   mesma ordem, e escreva só a ficha de cena (o cenário, os objetos, o teste dos substantivos e um bloco de 10 linhas
   por frase, como manda a seção 4 de `referencias/COMO-FAZER-O-VIDEO.md`), no fim do `roteiro.md` que já existe.
3. Depois, o `cena.js` e o `roteiro.json` do jeito do `comandos/novo-video.md` (passo 2), com o texto de cada frase
   igualzinho ao de antes. Daí em diante, igual a qualquer vídeo: revisão, prévias, vídeo e entrega.

## Passo 4. Os 100 temas (quando acabarem os 30)

A lista está em `canal/extras/roteiros/100-temas.md`: o tema, o gancho (a primeira frase) e a pergunta da capa.
Quando a pessoa escolher um, siga `comandos/novo-video.md` com esse tema, usando o gancho da lista na primeira frase e a
pergunta da lista na capa. Aqui o roteiro é você que escreve: os 100 são só ideias.

A pessoa não sabe qual escolher? Sugira 3 da lista que combinem com o canal e dê a resposta pronta: `Pode responder:
"Faz o primeiro" ou "Me mostra outros 3"`.

## Não faça

- Não mude as frases dos 30 roteiros.
- Não copie pastas do arquivo baixado pra `videos/` com as suas mãos: use o `npm run extras` (ele põe o canal em cada um).
- Não apague nada de `videos/`.

## Os 30 roteiros

| Nº | Pasta | Nº | Pasta | Nº | Pasta |
|---|---|---|---|---|---|
| 1 | `videos/01-guarda-chuva` | 11 | `videos/11-torneira` | 21 | `videos/21-para-raios` |
| 2 | `videos/02-descarga` | 12 | `videos/12-secador-de-cabelo` | 22 | `videos/22-painel-solar` |
| 3 | `videos/03-chuveiro-eletrico` | 13 | `videos/13-liquidificador` | 23 | `videos/23-barco-a-vela` |
| 4 | `videos/04-caneta` | 14 | `videos/14-ventilador` | 24 | `videos/24-farol` |
| 5 | `videos/05-ferro-de-passar` | 15 | `videos/15-filtro-de-barro` | 25 | `videos/25-campainha` |
| 6 | `videos/06-pneu` | 16 | `videos/16-pipa` | 26 | `videos/26-cafeteira-italiana` |
| 7 | `videos/07-extintor` | 17 | `videos/17-balao-de-ar-quente` | 27 | `videos/27-guindaste` |
| 8 | `videos/08-cadeado` | 18 | `videos/18-semaforo` | 28 | `videos/28-caminhao-betoneira` |
| 9 | `videos/09-garrafa-termica` | 19 | `videos/19-fogao-a-gas` | 29 | `videos/29-hidrometro` |
| 10 | `videos/10-elevador` | 20 | `videos/20-bomba-de-encher-pneu` | 30 | `videos/30-cadeira-de-escritorio` |
