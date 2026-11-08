# Cenários prontos

O lugar inteiro do vídeo com um nome só: chão, céu, luz, o cenário em volta (no tamanho certo perto do personagem) e o
que se mexe sozinho (guindaste, carros, ondas, peixes, vacas). **Use um cenário pronto em todo vídeo**: é o que deixa o
vídeo com cara de caprichado, e a IA não precisa montar o lugar peça por peça.

- **Ver os cenários:** `referencias/cenarios/todos.jpg` (todos numa grade) e uma foto de cada em
  `referencias/cenarios/<nome>.jpg` (o lugar todo, de frente e da esquerda). Mande a grade pra pessoa escolher.
  `npm run cenarios` fotografa tudo de novo (`npm run cenarios -- cidade --hora noite` mostra um cenário de noite)
- **Modelos prontos pra copiar, já com cenário:** `referencias/modelo-construcao/` (concreto armado, no canteiro) e
  `referencias/modelo-natureza/` (a árvore bebendo água, no campo com montanhas). O guarda-chuva de
  `referencias/modelo-de-cena/` é o modelo sem cenário pronto

## Como usar

No `montar()` do `cena.js`, no lugar do `K.mundo()`:

```js
const C = K.cenario('construcao');            // o lugar inteiro (os nomes estão na tabela abaixo)
objeto.position.set(...C.centro);             // o objeto do vídeo fica no centro (área livre)
menino.colocar(C.personagem, C.centro);       // o personagem do lado dele, olhando pra ele
```

No **jeito sem código** (cena-modelo `montagem` e jeito por chat), no topo do `roteiro.json`: `"cenario": "construcao"`
(no lugar de `"lugar"`).

Opções: `K.cenario('cidade', { hora: 'noite' })` (`dia`, `tarde`, `noite`: o céu muda e as luzes acendem),
`{ sem: ['operarios', 'guindaste'] }` (tira peças do cenário), `{ cor: 0xffe2c4 }` (a cor do fundo do estúdio),
`{ pedestal: false }` (o estúdio sem o pedestal).

**O cenário cuida sozinho** do céu, da neblina e da sombra em todo quadro (não chame `K.ceu` no `cena()`, a não ser pra
mudar a hora de propósito) e do que se mexe. **A câmera dos ajudantes** (`K.filmar`, `K.enquadrar`) não entra nem fica
atrás de prédio, parede ou máquina do cenário: ela para na frente sozinha.

## Os lugares (iguais em todo cenário)

Trocar o nome do cenário muda o vídeo de lugar sem mexer no resto, porque todo cenário tem estes lugares:

| Lugar | O que é |
|---|---|
| `C.centro` | onde fica o objeto do vídeo: área livre, sem nada alto em volta (quase sempre `[0, 0, 0]`) |
| `C.personagem` | do lado do objeto, um pouco pra frente (o lugar normal do personagem) |
| `C.entrada` | de onde o personagem chega andando: `menino.irPara(C.entrada, C.personagem, K.faixa(B.p, 0, 0.5), tc)` |
| `C.esquerda`, `C.direita` | outros lugares livres, dos lados do objeto (um segundo objeto, um ajudante) |
| `C.fundo` | o destaque do cenário, lá atrás (o prédio em obra, a montanha, a pirâmide): bom pro `'revelando'` |
| `C.vista` | `{ pos, alvo }`: a câmera que mostra o lugar todo. `K.plano(C.vista, C.vista, B.p)` ou `K.mirar(C.vista.pos, C.vista.alvo)` |
| `C.lugares` | todos os lugares com nome, com os próprios de cada cenário (`C.lugares.porta`, `C.lugares.guindaste`...) |
| `C.objetos` | as peças do cenário que dá pra filmar ou mexer (`K.filmar(C.objetos.betoneira, 'girando', B.p)`) |

Peça do cenário que você quer usar numa frase (a betoneira, o semáforo, a geladeira) já está no lugar: filme ela, ponha
uma etiqueta nela, faça ela falhar (`K.falhar(C.objetos.geladeira, 'congela', tc - t0)`). Só não mude o lugar dela.

## Qual cenário pra cada tema

| Tema do vídeo | Cenário |
|---|---|
| obra, prédio, casa sendo construída, concreto, tijolo, máquinas pesadas | `construcao` |
| bicho, planta, clima, montanha, rio, "como a natureza funciona" | `natureza` (ou `floresta`) |
| carro, trânsito, rua, semáforo, cidade, ônibus, poste | `cidade` |
| coisa da casa por fora: telhado, caixa d'água, jardim, cachorro, chuva | `casa` |
| comida, geladeira, fogão, micro-ondas, panela | `cozinha` |
| TV, sofá, coisas da sala, eletrônicos de casa | `sala` |
| mar, onda, sol, areia, verão | `praia` |
| peixe, tubarão, oceano, navio afundado, cabo submarino | `fundo_do_mar` |
| planeta, estrela, foguete, satélite, astronauta | `espaco` (ou `lua`) |
| comida da roça, plantação, vaca, trator, leite | `fazenda` |
| animais do mato, árvores, cogumelo, riacho, acampamento | `floresta` |
| Egito, pirâmide, história antiga, areia, calor | `deserto` |
| saúde, corpo humano, remédio, médico, doença | `consultorio` |
| motor, pneu, freio, peça de carro, ferramenta | `oficina` |
| dinheiro, imposto, salário, trabalho, empresa, banco | `escritorio` |
| objeto sem lugar certo, "por dentro de", tecnologia, átomo | `estudio` |

Apelidos que também funcionam: `obra`, `campo`, `montanha`, `rua`, `quintal`, `mar`, `oceano`, `sitio`, `mata`,
`egito`, `hospital`, `clinica`, `garagem`, `mecanica`, `banco`, `trabalho`, `palco` e outros (sem acento também vale).

## Cada cenário

### `construcao`: canteiro de obras

Prédio de 3 andares em obra (pilares, vigas, lajes, paredes de tijolo subindo, ferragem saindo do topo e escoras),
andaime com tábuas e tela verde, guindaste girando com um palete de tijolos pendurado, caminhão betoneira com o tambor
girando, escavadeira cavando, montes de areia e brita, paletes de tijolo, sacos de cimento, vergalhões, carrinho de mão,
cones, cavalete, contêiner do escritório da obra, banheiro químico, placa da obra, tapume, dois operários trabalhando e
poeira no ar. Cidade e morros lá fora.
- Lugares: `predio`, `andaime`, `laje` (o topo, com os ferros), `guindaste`, `betoneira`, `escavadeira`, `areia`,
  `tijolos`, `cimento`, `carrinho`, `placa`, `conteiner`
- Objetos: `predio`, `guindaste`, `carga` (o palete pendurado), `gancho`, `betoneira`, `tambor`, `escavadeira`, `areia`,
  `tijolos`, `cimento`, `carrinho`, `cones`, `conteiner`, `placa`, `operarios`
- Tirar: `sem: ['operarios', 'guindaste', 'betoneira', 'escavadeira']`

### `natureza`: campo de grama com poucas árvores, montanhas e céu azul

Grama com flores, poucas árvores (três copas redondas perto, pinheiros mais longe), trilha de terra, pedras, morros
verdes e montanhas com neve no fundo, céu azul limpo com poucas nuvens, borboletas e pássaros.
- Lugares: `arvore`, `trilha`, `pedra`, `montanha`

### `cidade`: calçadão, rua com carros passando e prédios

Calçadão (o palco), meio-fio, rua de duas mãos com faixa de pedestre, carros e um ônibus passando, semáforo trocando de
cor, postes, árvores de calçada, ponto de ônibus, banco, lixeira, hidrante, prédios coloridos do outro lado e os altos
atrás, pedestres andando. De noite (`hora: 'noite'`), as janelas e os postes acendem.
- Lugares: `rua`, `faixa`, `semaforo`, `ponto`, `predio`, `calcada_de_la`, `banco`
- Objetos: `semaforo`, `carros` (lista, com o ônibus)

### `casa`: frente de casa com quintal

Casa térrea com telhado de barro, caixa d'água azul em cima, antena, janelas com floreira, caminho de pedras até a
porta, cerca branca, árvore grande com balanço de pneu, casinha de cachorro, varal com roupa balançando, canteiro de
flores, caixa de correio, torneira do jardim e as casas vizinhas.
- Lugares: `porta`, `caixa_dagua`, `arvore`, `casinha`, `varal`, `jardim`, `portao`, `torneira`
- Objetos: `casa`, `arvore`, `casinha`

### `cozinha`

Bancada com gavetas e pedra, pia com torneira, fogão de 4 bocas com forno e panela, coifa, armários, geladeira, micro-
ondas, cafeteira, fruteira, azulejo, janela com cortina, relógio e a mesa redonda com cadeiras.
- Lugares: `mesa` (em cima da mesa), `fogao`, `pia`, `geladeira`, `bancada`, `microondas`, `janela`
- Objetos: `geladeira`, `microondas`, `mesa`

### `sala`

Sofá com almofadas, quadro, tapete redondo (o palco), mesinha de centro, abajur aceso, planta, estante de livros, TV no
rack (a tela muda de cor) e janela com cortina.
- Lugares: `sofa`, `tv`, `tapete`, `mesinha`, `estante`, `janela`, `abajur`
- Objetos: `sofa`, `tv`

### `praia`

Areia, mar com onda e espuma chegando, coqueiros, guarda-sol com cadeiras, toalha e isopor, posto de salva-vidas com a
bandeira tremulando, castelo de areia, bola, conchas, veleiros, ilha e gaivotas.
- Lugares: `mar`, `beira`, `guarda_sol`, `salva_vidas`, `coqueiro`, `castelo`, `barco`
- Objetos: `guardaSol`, `salvaVidas`

### `fundo_do_mar`

Areia com ondinhas, pedras com musgo, corais coloridos, algas balançando, navio afundado, baú do tesouro, estrelas-do-
mar, peixes nadando, um cardume, o tubarão passando longe, raios de sol vindo de cima e bolhas subindo.
- Lugares: `naufragio`, `bau`, `coral`, `pedra`, `superficie`
- Dica: no fundo do mar, ponha o capacete no personagem em todo plano: `menino.capaceteEspacial()` (vira capacete de
  mergulho)

### `espaco`

Em cima de um planetinha com crateras, a Terra grande no céu, a Lua, nebulosa colorida, asteroides passando, satélite,
bandeirinha e um cristal brilhante.
- Lugares: `terra`, `lua`, `satelite`, `cristal`, `bandeira`
- Dica: `menino.capaceteEspacial()` em todo plano

### `lua`

Chão cinza com crateras, a Terra no céu preto, o módulo lunar, pegadas e pedras.
- Lugares: `terra`, `modulo`, `cratera`
- Objetos: `modulo`

### `fazenda`

Celeiro vermelho, silo, plantação de milho, estrada de terra, pasto cercado com duas vacas pastando, galinhas
ciscando, trator, fardos de feno, bebedouro, cata-vento girando, casa da fazenda e árvores.
- Lugares: `celeiro`, `silo`, `trator`, `pasto`, `vaca`, `galinhas`, `cata_vento`, `feno`, `estrada`, `plantacao`
- Objetos: `celeiro`, `silo`, `vacas`, `galinhas`, `trator`, `cataVento`

### `floresta`

Clareira cercada de árvores, tronco caído com musgo, cogumelos, samambaias, pedras, riacho com pontezinha de madeira e
raios de sol entre as copas. De noite, vagalumes.
- Lugares: `tronco`, `cogumelos`, `riacho`, `ponte`, `clareira`
- Objetos: `tronco`

### `deserto`

Dunas, três pirâmides, oásis com lagoinha e coqueiros, blocos de pedra, o trenó de madeira com um bloco e as toras pra
puxar.
- Lugares: `piramide`, `oasis`, `treno`, `blocos`
- Objetos: `piramide`, `treno`

### `consultorio`

Maca com lençol de papel, cartaz do corpo humano, armário de remédios com a cruz vermelha, mesa do médico com
computador, balança, suporte de soro, pia com espelho, janela e a placa "Consultório". Combina com o doutor:
`K.boneco({ tipo: 'doutor' })`.
- Lugares: `maca`, `cartaz`, `armario`, `mesa`, `computador`, `balanca`, `soro`, `pia`
- Objetos: `maca`, `armario`, `mesa`

### `oficina`

Carro azul no elevador (dá pra passar por baixo), portão de enrolar com luz entrando, parede de ferramentas, bancada com
morsa, carrinho de ferramentas vermelho, pneus empilhados, tambores de óleo, compressor e a placa "Oficina".
- Lugares: `carro`, `elevador`, `baixo_do_carro`, `ferramentas`, `bancada`, `pneus`, `portao`
- Objetos: `carro`, `elevador`

### `escritorio`

Janelão com a cidade lá fora, duas mesas com computador e cadeira, quadro branco com o gráfico subindo, plantas,
bebedouro e arquivo.
- Lugares: `mesa`, `computador`, `mesa2`, `quadro`, `janela`, `bebedouro`
- Objetos: `mesas`, `quadro`

### `estudio`: fundo infinito

Fundo liso que vira chão numa curva (sem canto), luz macia e um pedestal redondo no centro. Pra explicar um objeto sem
lugar certo, mostrar algo por dentro ou fazer a capa. `{ cor: 0xffe2c4 }` troca a cor do fundo; `{ pedestal: false }`
tira o pedestal.
- Lugares: `pedestal`

## Personagens e bichos prontos

| O quê | Como |
|---|---|
| Doutor (velhinho de jaleco, óculos, bigode e estetoscópio) | `K.boneco({ tipo: 'doutor' })` |
| Operário (adulto de capacete, colete refletivo, jeans e bota) | `K.boneco({ tipo: 'operario' })` (`barba: false` tira a barba) |
| Gato (as duas metades giram separadas: o gato caindo em pé) | `const gato = K.gato()` e, no plano, `gato.em([x, gato.altura, z], tc, { rumo, cara: 'susto' })` |
| Cachorro (vira-lata caramelo, com raio-X) | `K.cachorro()` → `.em([x, 0, z], tc, { rumo, cara: 'feliz', abana: 1, andar })` |
| Ornitorrinco (com o filhote e o macho) | `K.ornitorrinco({ filhote: true })` → `.em([x, 0, z], tc, { rumo, nado, andar })` |
| Camaleão (olhos que giram, língua, cor que muda) | `K.camaleao()` → `.em([x, 0, z], tc, { rumo, cor: 'vermelho', lingua })` |
| Mosca e mosquita | `K.mosca()` → `.em(pos, tc, { voa: 1 })` · `K.mosquita()` → `.em(pos, tc, { voo: 1, asas: 1 })` |
| Estrelinhas da tontura, coraçõezinhos, fedor | `K.estrelinhas()`, `K.coracoes()`, `K.fedor()` → `.em(ponto, tc, ...)` |

Os bichos vêm do tamanho de verdade perto do personagem (o gato bate no joelho dele): pra explicar de perto, aumente com
`escala: 2` ou `3` no `em()`. As caras prontas de cada um ficam em `K.GATO_CARAS`, `K.CACHORRO_CARAS`,
`K.ORNITORRINCO_CARAS` e `K.CAMALEAO_CARAS`; tudo o que cada um faz está no comentário em cima dele, em `motor/bichos.js`.

## Modelos 3D prontos

Peças prontas de outros pacotes (hoje o `kenney-cidade`, do Kenney, licença CC0: domínio público, pode usar e vender):
`K.modelo('kenney-cidade/building-small-a', { escala: 6, pos: [x, 0, z], giro: 180 })`. Cada peça ocupa 1 x 1 no chão;
escala 5 ou 6 deixa a casa do tamanho certo perto do personagem. A lista fica em `K.MODELOS`; origem e licença em
`motor/modelos/ORIGEM.md`.
