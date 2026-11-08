# Identidade visual do canal

> É isso que faz o seu vídeo não parecer com o de ninguém. O `/instalar` preenche com você.
> O `/novo-video` copia o bloco "No roteiro.json" pra todo vídeo novo.

## Personagem

[Descreva. Ex: menino de camiseta coral, bermuda verde e tênis branco, cabelo castanho claro.]

- Tipo: `menino` ou `menina`
- Roupa: `camiseta` (camiseta + bermuda) ou `moletom` (moletom com capuz, mochila, calça)
- Cores que dá pra trocar: `camiseta`, `bermuda`, `tenis`, `cabelo`, `pele`, `moletom`, `punho`, `calca`, `mochila`, `vestido`
- Acessório opcional: `capacete` = `obra` ou `espaco`

## Cenário e hora padrão

[Ex: canteiro de obras (`construcao`) de dia. Cada vídeo pode ter o seu cenário, o que combinar com o tema; este é o do
canal quando o tema não pede outro. Noite quando o tema pede luz (lanterna, poste, farol).]

Cenários prontos (o lugar inteiro, com céu, luz e o que se mexe; fotos e qual usar pra cada tema em
`referencias/cenarios.md`): `construcao`, `natureza`, `cidade`, `casa`, `cozinha`, `sala`, `praia`, `fundo_do_mar`,
`espaco`, `lua`, `fazenda`, `floresta`, `deserto`, `consultorio`, `oficina`, `escritorio`, `estudio`. Horas: `dia`,
`tarde`, `noite`. No `cena.js`: `K.cenario('construcao', { hora: 'dia' })`; no `roteiro.json` da montagem: `"cenario"`.
(Os lugares simples de antes, `quintal`, `praia`, `cozinha`, `espaco`, `lua` e `escuro`, continuam valendo no campo
`"lugar"`.)

## Estilo

[Ex: redondo e mais realista. Sem o campo, sai o low-poly (facetado, mais simples).]

- `"estilo": "redondo"`: sombreamento liso, quinas arredondadas, cenário vivo (flores, arbustos, borboletas, pássaros,
  pólen, vento), sombra macia, personagem com olho de verdade
- `"fps": 60`: movimento mais fluido (o render leva o dobro do tempo)
- `"efeitos": {"abaixa": true}`: os efeitos sonoros ficam por baixo da voz, sem estourar

## Voz

[Ex: narradora mulher, voz calma e clara, da ElevenLabs.]

De onde a voz vem, a pessoa escolhe na instalação (`comandos/instalar.md`, passo 3). A escolha vira a linha `"voz"` do
bloco "No roteiro.json", lá embaixo (sem essa linha, o `npm run conferir` avisa que falta escolher a voz):
- **ElevenLabs** (a melhor; plano grátis pra testar, pago pra monetizar; a chave fica no arquivo `.env`, salva pela
  janelinha do `npm run chave`):
  `"voz": {"motor": "elevenlabs", "id": "<id da voz>", "velocidade": 1.1, "acelerar": "auto"},`
- **VoiceStudio** (grátis, roda no computador; abrir o programa antes de cada vídeo; passo a passo em
  `comandos/voicestudio.md`):
  `"voz": {"motor": "voicestudio", "id": "<nome da voz no VoiceStudio>", "idioma": "pt-BR", "acelerar": "auto"},`
  (com outro motor do VoiceStudio, junte `"modelo": "voxcpm2"` ou `"modelo": "moss-tts-nano"`; sem ele, é o OmniVoice)
- **Voz do computador** (robótica, só pra testar): `"voz": {"motor": "teste"},`

## Cor do canal

[Ex: coral `#ff7a59`.] Vai na palavra em destaque da capa e no botão "Seguir" do fim. Escolha uma cor sua, que combine
com o personagem. O texto em cima dela sai preto ou branco sozinho, o que ler melhor.

## Fim do vídeo

No fim de todo vídeo entra um cartão de seguir no topo da tela: o logo, o @ do canal e o botão "+ Seguir", que é apertado
e vira "Seguindo". O personagem aponta pro cartão e acena.

## Logo

Coloque o logo do canal em `canal/logo.png` (quadrado). Ele aparece redondo no cartão de seguir do fim. Sem logo, o
cartão mostra a inicial do canal na cor do canal.

## No roteiro.json

```json
"cor": "#ff7a59",
"arroba": "@pordentrodascoisas",
"estilo": "redondo",
"fps": 60,
"efeitos": {"abaixa": true},
"personagem": {"tipo": "menino", "roupa": "camiseta", "cores": {"camiseta": "#ff7a59", "bermuda": "#2f6f5e", "tenis": "#f4f1ea", "cabelo": "#7a4a22"}},
"cenario": "casa",
"hora": "dia"
```
