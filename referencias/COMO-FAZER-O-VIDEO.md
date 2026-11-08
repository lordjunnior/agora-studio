# Como fazer o vídeo (o método completo, pra qualquer IA)

> Vale pra qualquer IA, da mais simples à mais forte. **Leia este arquivo inteiro antes de escrever o `roteiro.json` e o
> `cena.js`** e siga os passos na ordem, sem pular nenhum. Na dúvida, copie do modelo e mude pouco: o modelo já funciona.
>
> - **O jeito fácil (comece por ele):** um modelo pronto pra copiar, com `TROQUE` marcado onde mudar. Copie o
>   `roteiro.json` e o `cena.js` pra `videos/<tema>/`. Os modelos **com cenário pronto** são os melhores:
>   `referencias/modelo-construcao/` (canteiro de obras) e `referencias/modelo-natureza/` (campo com montanhas). O
>   `referencias/modelo-de-cena/` (guarda-chuva) é o modelo sem cenário pronto
> - **A ficha de cena completa, pra copiar o formato:** `referencias/modelo-construcao/roteiro.md` (cada frase com o que
>   aparece na tela, o que se mexe, a câmera e as ações do personagem). É ela que faz o vídeo sair sem objeto esquecido,
>   sem câmera no lugar errado e sem personagem parado
> - **O lugar do vídeo:** um dos 17 cenários prontos (`K.cenario('cidade')`): fotos e o que tem em cada um em
>   `referencias/cenarios.md` (a grade com todos: `referencias/cenarios/todos.jpg`). Não monte o lugar peça por peça
> - **O exemplo caprichado:** `videos/exemplo/` (lanterna). Abra o `video.mp4` dele pra ver o nível (se a pessoa
>   apagou, a `capa.png` mostra; não renderize o exemplo). O `cena.js` dele tem coordenadas na mão; use como
>   inspiração, não como base
> - **Ideias prontas pra cada frase:** `referencias/cardapio-de-cenas.md`
> - **Tudo o que o motor sabe fazer:** `referencias/kit-indice.md`
>
> A cena-modelo `montagem` (só o `roteiro.json`, sem código) é pra rascunho rápido ou pro jeito por chat.

## As 5 regras de ouro

O erro mais comum de IA é fazer **a mesma animação o vídeo todo**: a mesma câmera, o personagem parado do lado e o objeto
lá no meio. Estas regras existem pra isso não acontecer:

1. **Cada frase é uma cena diferente.** Câmera nova, o personagem fazendo outra coisa, algo novo acontecendo. Se duas
   frases seguidas parecem a mesma imagem, uma delas está errada
2. **Toda frase tem os 4 ingredientes:**
   - **CÂMERA** se mexendo, com um movimento diferente da frase anterior (`K.filmar`)
   - **PERSONAGEM** atuando: reagindo, andando, apontando, segurando (`menino.reagir`, `menino.irPara`)
   - **ALGO ACONTECENDO:** peça entrando, peça falhando, efeito (água, fogo, luz, fumaça, faísca, vento)
   - **TEXTO OU SOM:** etiqueta, ✓/✗, rótulo, contador, o som da peça caindo ou encaixando
3. **Mostre o que a frase diz, na hora da palavra.** "Ele tropeça" → ele tropeçando quando a voz fala "tropeça".
   "A água passa" → água passando. "Esquenta" → a peça ficando vermelha. Use `K.quando('palavra')` pra acertar o instante.
   A coisa de que a frase fala fica na tela, inteira, e no alvo da câmera: o `"mostra"` de cada frase diz o que é, e a
   revisão confere
4. **Use os ajudantes do kit** (`K.filmar`, `menino.reagir`, `K.entraNo`, `K.entrar`, `K.falhar`, `K.brilhar`) em vez
   de calcular coordenadas de câmera na mão. São poucas linhas e já saem enquadrados no 9:16
5. **Nada de vídeo completo antes da revisão dar APROVADO** (`--revisar`) e de você abrir a folha
   (`testes/folha.jpg`) e ver uma imagem diferente em cada frase. O vídeo completo confere sozinho e para se tiver
   algo pra corrigir
6. **A ficha de cena vem antes do código, completa:** um bloco por frase, com tudo o que aparece, a câmera e as ações
   do personagem (Passo 1). O código só copia a ficha

## O que ler antes

| Arquivo | Pra quê |
|---|---|
| `canal/canal.md` e `canal/identidade.md` | Tom, personagem, cores, lugar, cor do canal, voz e o bloco que vai no `roteiro.json` |
| `canal/aprendizados.md` | O gosto da pessoa (vale mais que este guia), as cenas que ela já elogiou e as lições técnicas |
| `metodo/formula-roteiro.md` | A fórmula do roteiro e o checklist |
| `metodo/ritmo-e-visual.md` | Ritmo, cortes e o que mostrar |
| `referencias/modelo-construcao/` ou `referencias/modelo-natureza/` | **A base do `cena.js`, com cenário pronto**: copie e troque o que está marcado com `TROQUE` (o guarda-chuva de `referencias/modelo-de-cena/` é a base sem cenário) |
| `referencias/cenarios.md` | Os 17 cenários prontos (o lugar inteiro com um nome): qual usar pra cada tema, os lugares e as peças de cada um |
| `referencias/cardapio-de-cenas.md` | Ideias prontas (com código) pra cada tipo de frase, efeitos, câmeras, reações e sons |
| `referencias/kit-indice.md` | Tudo o que o motor tem pronto (objetos, efeitos, personagem, textos), com a linha no `motor/kit.js` |

## Os arquivos de cada vídeo

`videos/<tema>/`: `roteiro.md` → (ok da pessoa) → `roteiro.json` + `cena.js` → revisão e prévias (`testes/`) → render
(`narracao/`, `timeline.json`, `capa.png`, `video.mp4`) → `publicacao.md`. Todo teste vai pra `testes/`; na pasta do
vídeo fica só a entrega e o roteiro.

## Passo 1: o roteiro (`roteiro.md`) e a ficha de cena

Escreva o texto seguindo `metodo/formula-roteiro.md`. **Primeiro vídeo da pessoa ou pedido de vídeo curto:** ~60 s, 150
a 200 palavras, 3 ou 4 ciclos. **Senão:** 400 a 550 palavras, 7 a 10 ciclos (mais de 1 minuto).

Embaixo do texto, a **ficha de cena**: é ela que vira o `cena.js` depois, linha por linha. **O que não está na ficha
não aparece no vídeo**, e os três erros que mais estragam um vídeo nascem de ficha pobre: **o objeto principal
esquecido** (a frase fala da pilha e a pilha não está na tela), **a câmera no lugar errado** (filmando o personagem
quando a frase é sobre a peça, cortando a peça na borda, de costas, longe demais) e **o personagem parado que nem
espantalho** a frase inteira. Então detalhe tudo, frase por frase, sem pular nenhuma e sem resumir "igual à anterior".

**O exemplo completo pra copiar o formato: `referencias/modelo-construcao/roteiro.md`** (o concreto armado, as 12
frases detalhadas). Abra antes de escrever a sua ficha. O `cena.js` daquela pasta foi feito a partir dela.

A ficha tem 4 partes, nesta ordem:

**1. O cenário, a hora e o lugar do personagem**, em 3 linhas: qual dos cenários prontos (`referencias/cenarios.md`)
e por quê, que peças dele vão entrar nas frases (a betoneira girando, o carro passando, a geladeira) e onde o
personagem fica quase sempre (`C.personagem`).

**2. Os objetos do vídeo**: uma tabela com **tudo o que a câmera vai precisar mostrar**. Cada objeto ganha um nome
curto, sem acento e sem espaço (`pilha`, `lampada`, `coluna`), que vai ser o mesmo no `cena.js` e no `"mostra"` do
`roteiro.json`:

| Nome | O que é | Feito com | Tamanho e cor | Onde fica | Aparece |
|---|---|---|---|---|---|
| `pilha` | a pilha, de pé dentro da lanterna | `K.pecas`: cilindro | raio 0,3, altura 0,9, preta com faixa laranja | dentro do corpo, em `C.centro` | entra na 5; fica até o fim |

- **Feito com:** uma peça simples (`K.pecas`), um objeto pronto do kit (`K.carro()`, `K.torneira()`, lista em
  `referencias/kit-indice.md`), um objeto do cenário (`C.objetos.betoneira`, lista em `referencias/cenarios.md`) ou um
  efeito (`K.fogo`, `K.chuva`...)
- **Tamanho:** na régua do personagem (ele tem 1,47; 1 unidade é 1 metro, tabela em "O tamanho das coisas")
- **Aparece:** em que frase entra, quando some e quando volta

**3. O teste dos substantivos** (é ele que não deixa esquecer objeto): leia o roteiro e anote **toda coisa concreta
que a narração cita** (objeto, peça, bicho, lugar, efeito: "pilha", "fio", "chuva", "prédio"). Cada uma aparece na
frase em que é falada, ou fica escrito por que não aparece ("arame: pequeno demais, é detalhe"). Faltou alguma coisa
importante? Ela entra na tabela de objetos.

**4. Cena por cena**: **um bloco por frase**, sempre com as mesmas 10 linhas, nesta ordem (copie do modelo). Escreva
**como se fosse explicar a cena pra alguém que vai desenhar sem ter ouvido a narração**: tudo o que aparece e onde
está, o que se mexe, de onde pra onde e em que palavra, quem mexe em quê, de onde a câmera olha, o que aparece escrito e
o que se ouve. Quanto mais detalhe aqui, melhor a cena sai: é a ficha que faz o vídeo, não o código.

```
#### 3 · plano `racha` · ~6 s · jogo `falha`
> "Mas o concreto puro aguenta aperto e não aguenta puxão: quando o vento empurra, ele racha."

- NA TELA: a coluna de concreto (sem ferro) no centro; o personagem à esquerda dela; o vento e a seta vermelha
  chegando pela direita; as lascas
- MOSTRA: ["concreto"]
- CENÁRIO: o canteiro de obras de dia; atrás da coluna, o andaime e o prédio em obra; o guindaste girando devagar
  no fundo (o cenário cuida)
- ENTRA AGORA: o vento e a seta, entrando pela direita (na palavra "vento"); as lascas, saltando do meio da coluna
  (na palavra "racha")
- OBJETOS SE MEXENDO: o vento sopra da direita pra esquerda a partir de "vento"; a coluna balança e quebra no meio na
  palavra "racha" (K.falhar 'quebra'); as lascas sobem e caem em volta da base
- PERSONAGEM: em C.personagem, à esquerda da coluna, de frente pra câmera, olhando a coluna · começo: duvida ·
  na palavra "racha": susto
- INTERAÇÃO: a coluna assusta o personagem: ele acompanha ela balançar e leva o susto quando ela racha
- CÂMERA: alvo a coluna, no centro do quadro, inteira e ocupando uns 2/3 da altura · chegando · perto · direita ·
  altura olho · começa com a coluna inteira e termina mais perto da rachadura (na frase 2: passando, médio, esquerda)
- EFEITOS VISUAIS: etiqueta vermelha "Não aguenta puxão" (palavra "vento") · ✗ vermelho em cima dela (palavra
  "racha") · as lascas · no fim, congela em preto e branco (o jogo faz)
- SONS: whoosh do vento (palavra "vento") · racha da coluna quebrando (palavra "racha"; o K.falhar põe) · o congela do
  preto e branco (o jogo põe)
```

O que vai em cada linha:

- **NA TELA:** tudo o que aparece no quadro nesta frase **e onde está na tela** (no centro, à esquerda, à direita, na
  frente, atrás): o objeto da frase, o personagem, as peças do cenário que importam e os efeitos. **A coisa de que a
  frase fala tem que estar aqui.** "Então você encaixa uma pilha" → a pilha está na tela, no centro, e grande
- **MOSTRA:** a lista, com os nomes da tabela de objetos, do que **tem que** aparecer bem visível (1 a 3 coisas: a
  principal da frase e o personagem, quando ele importa). Vai igual pro `roteiro.json` (Passo 2), e a revisão confere
  se cada uma aparece na tela, inteira e no quadro
- **CENÁRIO:** o lugar e a hora, o que do cenário aparece atrás do objeto nesta frase e **o que se mexe no fundo** (a
  betoneira girando, o carro passando, as folhas balançando, os operários trabalhando: as peças de cada cenário estão em
  `referencias/cenarios.md`). Na frase "É por isso que...", o cenário vira o assunto: a câmera vai até a peça dele
- **ENTRA AGORA:** o que aparece nesta frase pela primeira vez, **como entra** (`cai`, `desliza`, `encaixa`, `cresce`,
  `gira`, `sobe`, `surge`), **de onde vem** (de cima, da direita, do chão) e **em que palavra**. Nada novo: escreva
  "nada"
- **OBJETOS SE MEXENDO:** **cada coisa que se mexe**, uma por uma: o que ela faz, **de onde pra onde**, **quanto**
  (uma volta, sobe meio metro, enche até a metade), **devagar ou rápido** e **em que palavra começa**. A peça entrando,
  a falha (`treme`, `tomba`, `murcha`, `apaga`, `esquenta`, `congela`, `pisca`, `quebra`), o efeito (água correndo,
  fumaça subindo, faísca, vento). O invisível vira visível: eletricidade como pontinhos andando no fio, calor como
  fumaça, som como ondas
- **PERSONAGEM:** onde ele está (`C.personagem`, `C.esquerda`, andando de `C.entrada` até...) e **de que lado do
  objeto**, pra onde olha (de frente pra câmera, olhando a peça) e **duas ações**: uma no começo e outra numa palavra da
  frase ("começo: `duvida` · na palavra 'racha': `susto`"). Frase curta (menos de 2 s, como o "Esse é o X") pode ter uma
  ação só. Use os nomes do kit (`susto`, `surpreso`, `ideia`, `vitoria`, `cansado`, `duvida`, `bravo`, `triste`,
  `mostrando`, `chamando`, `empurrando`, `segurando`, `erguendo`, `pensando`, `apontar`, andar, correr, cair, pular): a
  tabela "o verbo vira ação" do `referencias/cardapio-de-cenas.md` diz qual combina com cada verbo. **Proibido:**
  "parado", "do lado", "observando", "olhando" sozinho: isso é o espantalho
- **INTERAÇÃO:** **quem age sobre quem, e em que palavra**. O personagem mexe no objeto (segura, empurra, gira, aponta,
  encaixa, puxa, sopra) ou o objeto mexe com o personagem (molha, assusta, derruba, ilumina, esquenta). Toda frase com o
  personagem e o objeto juntos tem uma interação: é ela que conta a história. Só na frase em que eles não aparecem
  juntos vale "nenhuma"
- **CÂMERA:** **alvo** (o que ela enquadra: a peça da frase, ou a peça e o personagem juntos), **onde o alvo fica no
  quadro** (no centro, inteiro, e quanto da tela ele ocupa: metade, 2/3, a tela toda no detalhe), **movimento**
  (`chegando`, `afastando`, `girando`, `subindo`, `descendo`, `passando`, `mergulho`, `revelando`, `parado`), **plano**
  (`aberto`, `medio`, `perto`, `detalhe`), **lado** (`frente`, `direita`, `esquerda`, `tras`, `perfil_direita`,
  `perfil_esquerda`), **altura** (`cima`, `alto`, `olho`, `baixo`), **onde começa e onde termina** e, entre
  parênteses, a câmera da frase anterior, pra conferir que mudou. As regras da câmera estão logo abaixo
- **EFEITOS VISUAIS:** tudo o que aparece por cima ou em volta, **com a palavra em que entra**: a etiqueta (a cor e o
  texto exato: vermelho = problema, verde = funciona, azul = informação, laranja = curiosidade), o ✓ ou ✗, o rótulo do
  "Esse é o X", o contador, a seta, o brilho, a fumaça, a faísca, a água, o preto e branco do jogo. No máximo 2 textos
  na tela ao mesmo tempo
- **SONS:** **cada som, com a palavra em que toca**. Uns o kit já põe sozinho: a peça entrando (`cai`: whoosh e baque;
  `encaixa`: trava; `cresce` e `surge`: brilho; `desliza`, `gira` e `sobe`: whoosh), a falha (`quebra`: racha;
  `treme`: range; `tomba`: baque; `murcha` e `apaga`: desliga; `esquenta`: fogo; `congela`: estalo; `pisca`: zap), a
  etiqueta, o rótulo e o jogo (congela, rebobina). Os outros você põe com `K.som('nome', instante)`, escolhendo destes:
  `whoosh`, `baque`, `metal`, `madeira`, `pedra`, `tampa`, `trava`, `clique`, `estalo`, `racha`, `range`, `agua`,
  `pingo`, `respingo`, `esguicho`, `bolhas`, `vapor`, `fogo`, `zap`, `zumbido`, `turbina`, `buzina`, `apito`, `bip`,
  `ding`, `liga`, `desliga`, `passo`, `estrondo`, `bomba`, `foguete`, `ondas`, `mosquito`, `brilho`, `certo`,
  `errado`, `festa`. Toda coisa que bate, quebra, liga, esguicha ou passa rápido tem som

**As regras da câmera** (é aqui que a IA mais erra):
1. **O alvo é o que a frase fala, no centro do quadro e inteiro.** Frase sobre a pilha → alvo a pilha (ou
   `[pilha, personagem]`), centralizada, sem cortar nas bordas. Só o personagem no alvo quando a frase é sobre ele (ele
   anda, cai, se molha)
2. **Peça pequena** (botão, trava, parafuso, pilha) → `perto` ou `detalhe`, com só ela (ou ela e um ponto do lado) no
   alvo, ocupando boa parte da tela. **Objeto grande ou o lugar** → `medio` ou `aberto`
3. **Duas frases seguidas nunca com a mesma câmera:** mude o plano (perto ↔ aberto) **e** o lado ou a altura. Alterne:
   aberto → perto → médio → detalhe → aberto
4. **O personagem de frente pra câmera:** com a câmera na `frente` (olhando do +z), ele olha pra peça ou pro +z, nunca
   pro -z (fica de costas). A câmera `tras` só de propósito
5. **Topo livre** no gancho, na capa e no fim (`espacoCima` de 0,35 a 0,45): a pergunta e o cartão de seguir ficam lá.
   Com o topo livre, use `aberto`: o `medio` corta o personagem embaixo
6. **Que câmera pra cada tipo de frase:** gancho → `mergulho` ou `revelando`, médio; "Se você..." → o personagem em
   ação, `passando`, médio; "Mas..." (o problema) → a peça que falha, `chegando`, perto; "Então você..." (a solução) →
   a peça nova e o personagem, `subindo` ou `chegando`, médio; "Esse é o X" → só a peça, `girando`, perto; "É por isso
   que..." → a vida real no cenário, `revelando`, médio ou aberto; "Por fora" → `afastando`, aberto; "Por dentro" →
   `girando`, médio; "segue" → `parado`, aberto, topo livre. Exemplos com código em `referencias/cardapio-de-cenas.md`

Regras gerais da ficha:
- **Toda frase tem os 4 ingredientes** (câmera mexendo, personagem atuando, algo acontecendo, texto ou som), e nenhuma
  linha da ficha fica vazia. Frase com mais de ~4 segundos: duas coisas acontecendo (uma no começo, outra numa palavra
  do meio)
- **Cada frase é uma cena diferente da anterior:** se dois blocos seguidos têm o mesmo NA TELA, a mesma CÂMERA e a mesma
  ação, um deles está errado
- Um assunto do dia a dia ("É por isso que..."): mude de lugar ou de hora. É o momento de mostrar a vida real, com as
  peças do cenário
- **Nunca resuma:** nada de "igual à anterior", "idem", "mesma coisa" ou "frases 5 a 8: igual". Cada frase tem o seu
  bloco inteiro, com as 10 linhas escritas por extenso
- Escreva a ficha inteira antes de escrever qualquer código

**Antes de mostrar pra pessoa, confira a ficha** (uma vez, com calma, bloco por bloco):
- [ ] Toda coisa que a narração cita está no teste dos substantivos, e as importantes estão na tabela de objetos
- [ ] Em cada bloco, a coisa de que a frase fala está no NA TELA, no MOSTRA e no alvo da CÂMERA, no centro do quadro
- [ ] Todo bloco tem as 10 linhas, nenhuma vazia e nenhuma "igual à anterior"
- [ ] Todo bloco tem PERSONAGEM com lugar e ação (duas nas frases com mais de 2 s), sem "parado" nem "observando", e
      uma INTERAÇÃO quando ele e o objeto aparecem juntos
- [ ] Nenhuma CÂMERA igual à da frase anterior (plano e lado ou altura diferentes)
- [ ] Todo ENTRA AGORA, toda falha, todo EFEITO VISUAL e todo SOM têm a palavra em que acontecem
- [ ] Toda coisa que se mexe está no OBJETOS SE MEXENDO, com de onde pra onde

Mostre o roteiro pra pessoa e, embaixo, **cada cena em 2 linhas, em palavras simples** (como no fim do `roteiro.md`
do modelo): a 1ª diz o que ela vai ver e o que acontece; a 2ª, o que o personagem faz e de onde a câmera mostra. Ex.:
"3. A coluna no meio da obra balança com o vento e racha no meio, soltando lascas. / Ele leva um susto; a câmera chega
pertinho da rachadura." Depois, as perguntas do `comandos/novo-video.md`, e **espere o ok**, a não ser que ela tenha
pedido pra seguir direto. A ficha completa, com as 10 linhas de cada cena, fica no `roteiro.md` (no painel, em Vídeos,
no roteiro do vídeo): a pessoa lê se quiser; a IA precisa dela.

## Passo 2: o `roteiro.json`

Copie o `roteiro.json` do modelo (`referencias/modelo-de-cena/`) e troque título, capa e frases. `cor`, `arroba`,
`estilo`, `fps`, `efeitos` e a `voz` vêm do bloco "No roteiro.json" de `canal/identidade.md` (a voz é a que a pessoa
escolheu na instalação). **Sem `modelo` e sem `objeto`**: quem desenha tudo é o `cena.js`.

Cada frase: `{ "texto", "plano", "mostra", "jogo"?, "rebobina"?, "gancho"? }`
- `plano`: **um nome próprio pra cada frase** (`"tropeca"`, `"pilha"`, `"pilha_rotulo"`, `"porta"`...). É o nome da função
  em `P` no `cena.js`. Duas frases nunca com o mesmo plano (frases seguidas com o mesmo plano viram uma cena só)
- `mostra`: **a linha MOSTRA da ficha daquela frase**, igualzinha: `"mostra": ["pilha", "personagem"]`. A revisão
  confere, frase por frase, se cada coisa da lista aparece na tela, no quadro e num tamanho que dá pra ver, e manda
  corrigir quando a câmera não mostra, quando a peça está escondida ou quando o nome não existe no `cena.js`. Os nomes:
  a chave do `K.pecas` (`pilha`), o nome dado com `K.nomear`, um objeto do cenário (`betoneira`, `predio`, `geladeira`:
  as chaves de `C.objetos`) ou `personagem`. Toda frase com texto tem `mostra`
- 1ª frase: `"plano": "gancho", "gancho": true`. A cauda: `"cauda": {"segundos": 1.6, "plano": "cartao"}`
- `"Esse é o *X*."`: o `*X*` fica amarelo na legenda; plano próprio (`"x_rotulo"`) com o nome grande da peça
- **`jogo`, o ritmo de videogame:**
  - `"falha"` na frase do problema: no fim da frase a cena congela em preto e branco
  - `"corrige"` na frase da solução: a falha some e corta direto pra montagem. **É o padrão**
  - `"conserta"` (com `"rebobina": 0.6`): ⏪ volta no tempo até antes da falha. **No máximo 2 por vídeo**
  - `"pausa"` ⏸, `"play"` ▶, `"avanca"` ⏩ (o tempo passando)

## Passo 3: o `cena.js`

### Comece copiando o modelo

Copie o `roteiro.json` e o `cena.js` de um modelo com cenário pronto (`referencias/modelo-construcao/` ou
`referencias/modelo-natureza/`) pra `videos/<tema>/` (o `roteiro.md` não: o seu já está lá, com a ficha). O `cena.js`
tem 4 partes:

1. **O cenário e os lugares:** `const C = K.cenario('construcao')` monta o lugar inteiro (chão, céu, luz, o cenário em
   volta e o que se mexe) e devolve os lugares: o objeto fica em `C.centro`, o personagem em `C.personagem`. **Escolha o
   cenário pelo tema** (tabela em `referencias/cenarios.md`) e troque só o nome: os lugares básicos existem em todos.
   `y = 0` é o chão; o personagem tem 1,55 de altura
2. **`montar()`** (roda uma vez): o cenário, **cada objeto da tabela de objetos da ficha** (com `K.pecas`, um objeto
   pronto ou o do cenário), com o mesmo nome da tabela, em que plano cada peça entra (`K.entraNo`, a coluna "Aparece"),
   o personagem (`K.boneco`, com as cores do canal) e os efeitos e textos (cada um criado uma vez só)
3. **`P`**: **uma função por plano do `roteiro.json`**, com os 4 ingredientes. É aqui que cada frase vira uma cena: cada
   bloco da ficha vira um plano (a receita está logo abaixo)
4. **`cena()`**: escolhe o plano do instante e esconde o que só aparece em algumas frases

### As peças do objeto: `K.pecas`

O mesmo formato das peças do jeito por chat (forma, tam, cor, pos, giro em graus, metal, brilho, transparente):

```js
pc = K.pecas({
  tecido: { forma: 'funil', tam: [0.06, 1.08, 0.46], cor: '#2f7fe0', pos: [0, 1.99, 0] },
  haste: { forma: 'cilindro', tam: [0.025, 1.9], cor: '#2b2f36', metal: true, pos: [0, 1.25, 0] },
  trava: { forma: 'cilindro', tam: [0.06, 0.16], cor: '#e8352b', pos: [0, 1.62, 0] }
}, grupo);   // grupo: um THREE.Group pra mover o objeto inteiro (ou deixe sem, e elas vão direto pra cena)
```

Formas: `caixa` [larg, alt, prof] · `cilindro` [raio, alt] ou [raioCima, raioBaixo, alt] · `tubo` [raio, alt] (oco) ·
`funil` [raioCima, raioBaixo, alt] (oco) · `esfera` [raio] · `cone` [raio, alt] · `anel` [raio, grossura] · `cano`
(`pontos: [[x,y,z],...]`, `tam: [raio]`) · `placa` (`texto`, `tam: [larg, alt]`) · `kit` (`kit: 'carro'`, `'balde'`,
`'torneira'`... a lista está em `referencias/montagem.md`). `pos` é o **centro** da peça: uma peça de altura 0,4 apoiada
no chão fica em y = 0,2. Monte de baixo pra cima.

Precisa de uma peça mais caprichada? Junte várias formas num `THREE.Group` (como a lanterna do exemplo) ou use um objeto
pronto do kit (`K.carro()`, `K.torneira()`, `K.computador()`...). Peça feita fora do `K.pecas`: chame `K.lugar(peca)` no
`montar`, já no lugar, pra os ajudantes saberem onde ela mora.

**O nome de cada objeto** (o da tabela de objetos da ficha, que vai no `"mostra"`): as peças do `K.pecas` já têm o nome
da chave (`pilha`), os objetos do cenário já têm o nome deles (`betoneira`) e o personagem se chama `personagem`. Grupo
ou objeto feito de outro jeito ganha o nome no `montar`, logo depois de criado:

```js
coluna = new THREE.Group();
K.lugar(coluna);
K.nomear('coluna', coluna);       // agora "coluna" vale no "mostra" do roteiro.json
carro = K.carro(0x2f7fe0);
K.nomear('carro', carro);         // objeto pronto do kit: passe o que ele devolveu
```

### O tamanho das coisas (o personagem é a régua)

O personagem tem **1,47 de altura** (uma criança de uns 1,45 m): na prática, **1 unidade do motor é mais ou menos 1
metro**. Tudo o que aparece perto dele precisa do tamanho de verdade em relação a ele, senão o vídeo parece maquete.
Alguns objetos do kit vêm pequenos de propósito, pra caber no quadro como peça explicada, e precisam de escala quando
viram cenário:

| Coisa | No kit (sem escala) | Perto do personagem, fica certo com |
|---|---|---|
| Carro (`K.carro()`) | 2,0 de comprimento e 1,14 de altura: menor que ele | `carro.scale.setScalar(1.35)`: o teto na altura da cabeça dele |
| Prédio (`K.predio(andares)`) | 0,9 por andar: a porta fica menor que ele | `p.g.scale.setScalar(2.6)` perto dele (a porta fica com 2,1, como uma porta de verdade). Bem no fundo, pode ficar sem escala |
| Porta de casa | | 2,1 de altura (1,4 personagem) |
| Árvore | | de 4 a 8 de altura |
| Poste de rua | | de 6 a 8 de altura |
| Rua (uma faixa) | | uns 3,5 de largura |

Cenário de cidade: use o pronto (`K.cenario('cidade')`), que já tem rua, calçada, carros na escala certa e prédios
atrás. Montando na mão, a regra é a mesma: um céu vazio atrás da rua fica pobre. Na dúvida, compare na folha: se o carro
parece brinquedo do lado do personagem, aumente.

### O cenário pronto em cada frase

O cenário não é só fundo: use as peças dele nas frases (`C.objetos` e `C.lugares`, lista em `referencias/cenarios.md`).
Uma frase "É por isso que..." fica ótima mostrando a vida real dentro do cenário, como a frase `obra` do
`modelo-construcao` (a câmera revela o prédio em obra com os ferros saindo das colunas):

```js
K.filmar(C.objetos.betoneira, 'girando', B.p, { plano: 'medio' });          // filmar uma peça do cenário
fx.et.algo.em(C.lugares.semaforo, tc - t0);                                 // etiqueta em cima dela
K.plano(C.vista, C.vista, B.p);                                             // o lugar todo (no gancho ou no fim)
menino.irPara(C.entrada, C.personagem, K.faixa(B.p, 0, 0.5), tc);          // ele chega andando
```

O cenário já põe o céu e a luz em todo quadro: não chame `K.ceu` no `cena()` (só se quiser mudar a hora de propósito, ou
use `K.cenario('cidade', { hora: 'noite' })`). A câmera do `K.filmar` não entra em prédio, parede nem máquina do
cenário. Bichos e personagens prontos (gato, cachorro, doutor, operário...) também estão em `referencias/cenarios.md`.

### Quando cada peça aparece: `K.entraNo`

```js
K.entraNo('tecido', pc.tecido, 'cai', { palavra: 'tecido' });          // cai do céu na palavra "tecido"
K.entraNo('varetas', pc.haste, 'sobe', { palavra: 'esqueleto' });      // brota do chão
K.entraNo('trava', pc.trava, 'desliza', { palavra: 'sobe', de: [0, -1, 0] });  // vem de baixo
```

Antes do plano a peça não aparece (só no gancho e na capa, que mostram o objeto pronto); no plano, entra com o movimento,
o som e o brilho amarelo; depois, fica no lugar. Funciona sozinho com o ⏪ e com as prévias. Entradas: `cai`, `desliza`
(de `op.de`, relativo), `encaixa`, `cresce`, `gira`, `sobe`, `surge`.

### A receita de uma frase (o bloco da ficha vira o plano)

Pra não esquecer nada: **cole primeiro as linhas do bloco da ficha como comentário** dentro do plano e escreva o código
embaixo de cada linha. Quando todas as linhas tiverem o seu código, o plano está pronto. É assim no
`referencias/modelo-construcao/cena.js` (compare com o `roteiro.md` de lá). Copie e troque:

```js
racha(B, tc) {
  // NA TELA: a coluna de concreto no centro; o personagem à direita; o vento, a seta vermelha, as lascas · MOSTRA: concreto
  // CENÁRIO: atrás, a escavadeira, a areia e o andaime (o K.cenario lá em cima cuida: aqui, só se uma peça dele fizer algo)
  // PERSONAGEM: em C.personagem, olhando a coluna · começo: duvida · na palavra "racha": susto
  // INTERAÇÃO: a coluna assusta o personagem quando racha
  menino.colocar(LADO, BASE);                     // de frente pra BASE. Andando: menino.irPara(de, ate, K.faixa(B.p, 0, 0.5), tc)
  const tV = quando('vento', B, 0.55), tR = quando('racha', B, 0.8);   // o instante de cada palavra (ou a fração da frase)
  if (tc > tR) menino.reagir('susto', tc - tR); else menino.reagir('duvida', B.t);   // as duas ações
  // ENTRA AGORA e OBJETOS SE MEXENDO: o vento, pela direita (palavra "vento"); a coluna quebra no meio (palavra "racha")
  fx.vento.em(BASE, tc, K.clamp((tc - tV) / 0.5), -1);
  K.falhar(pc.concreto, 'quebra', tc - tR);       // treme, tomba, murcha, apaga, esquenta, congela, pisca, quebra
  // EFEITOS VISUAIS: etiqueta vermelha "Não aguenta puxão" (palavra "vento") · ✗ em cima dela (palavra "racha")
  fx.et.puxa.em(mais(TOPO, [0, 0.4, 0]), tc - tV);   // a etiqueta aparece na palavra (e toca o som dela)
  const [ex, ey] = K.tela(mais(TOPO, [0, 0.4, 0]));
  fx.errado.em({ tela: [ex, ey - 150] }, tc - tR);
  // SONS: whoosh do vento (palavra "vento") · racha (o K.falhar já põe)
  K.som('whoosh', tV, 0.5);                       // K.som('nome', instante, volume); a lista dos nomes está no Passo 1
  // CÂMERA (sempre por último): alvo a coluna, no centro · chegando · perto · direita · altura olho
  K.filmar(coluna, 'chegando', B.p, { plano: 'perto', lado: 'direita', altura: 'olho' });
},
```

**As duas ações do personagem** são sempre assim: `if (tc > tPalavra) menino.reagir('segunda', tc - tPalavra); else
menino.reagir('primeira', B.t);`. Andando e depois reagindo: `menino.irPara(C.entrada, LADO, K.faixa(B.p, 0, 0.45), tc,
{ olhar: BASE }); if (B.p > 0.45) menino.reagir('pensando', tc - (B.inicio + 0.45 * B.dur));`. Toda reação já se mexe
sozinha (o corpo balança, as mãos gesticulam), mas é a troca de ação na palavra certa que faz ele atuar.

O tempo que cada ajudante recebe é **"segundos desde que começou"**: `tc - instante`. Antes do instante ele é
negativo e nada aparece. É assim que tudo acontece na hora da palavra. O `quando('palavra', B, fração)` já vem pronto
no modelo (ele usa o `K.quando` do kit e, se a palavra não estiver na frase, cai na fração da frase).

### Os ajudantes

**Câmera: `K.filmar(alvo, movimento, B.p, opções)`**. O alvo pode ser uma peça, o personagem, um ponto `[x, y, z]` ou
uma lista (enquadra tudo junto). A câmera calcula sozinha a distância pra caber no 9:16.

| Movimento | O que faz | Bom pra |
|---|---|---|
| `chegando` | aproxima devagar | quase tudo; peça nova; tensão |
| `afastando` | se afasta | mostrar o resultado, o "por fora" |
| `girando` | gira em volta (`angulo`, `sentido: -1`) | o "Esse é o X", o objeto funcionando |
| `subindo` / `descendo` | sobe ou desce | algo crescendo, algo caindo, ver de cima |
| `passando` | passa de lado | acompanhar alguém andando |
| `mergulho` | vem do alto até o plano | o gancho, a chegada num lugar |
| `revelando` | do detalhe até o plano aberto | o gancho, a virada, o "olha o tamanho disso" |
| `parado` | quase parado, respirando | o cartão de seguir, a capa |

Opções: `plano` (`aberto`, `medio`, `perto`, `detalhe`), `lado` (`frente`, `direita`, `esquerda`, `tras`,
`perfil_direita`, `perfil_esquerda` ou graus; frente = olhando do lado do +z), `altura` (`cima`, `alto`, `olho`,
`baixo` ou graus), `espacoCima` (0 a 1: o assunto desce e sobra espaço em cima pro cartão ou pra pergunta),
`espacoBaixo`, `tam` (o tamanho da caixa quando o alvo é um ponto). Peça que se mexe fora dos ajudantes (carregada na
mão, por exemplo): filme o ponto onde ela está, não a peça.

**Personagem** (criado com `K.boneco`; o kit volta ele ao neutro em todo quadro):

| Ajudante | O que faz |
|---|---|
| `menino.colocar(pos, olhar)` | põe no lugar, de frente pra um ponto `[x, y, z]` (ou um ângulo) |
| `menino.irPara(de, ate, x, t, { correr, olhar })` | anda (ou corre) de um lugar até outro; `x` de 0 a 1, ex. `K.faixa(B.p, 0, 0.5)` |
| `menino.olharPara(ponto)` | vira pro ponto |
| `menino.reagir(tipo, t)` | `susto`, `surpreso`, `ideia`, `vitoria`, `cansado`, `duvida`, `bravo`, `triste`, `mostrando`, `chamando`, `empurrando`, `segurando`, `erguendo`, `pensando` |
| `menino.andar(t)`, `correr(t)`, `pular(x)`, `cair(x)`, `apontar(alto)`, `acenar(t)`, `comemorar(t)`, `suar(t)`, `pensar()`, `segurar()` | as ações do kit |
| `menino.humor(h)` | só a cara: `feliz`, `triste`, `surpreso`, `bravo`, `nojo`, `assustado` |
| `menino.mao(1)` | onde está a mão direita (pra ele segurar uma peça) |

**Peças:**

| Ajudante | O que faz |
|---|---|
| `K.entraNo(plano, peca, tipo, op)` | no `montar`: em que plano a peça entra (ela some antes e fica depois) |
| `K.entrar(peca, tipo, tc - t0, op)` | a peça entrando agora (`cai`, `desliza`, `encaixa`, `cresce`, `gira`, `sobe`, `surge`) |
| `K.falhar(peca, tipo, tc - t0, op)` | o problema na peça: `treme`, `tomba`, `murcha`, `apaga`, `esquenta`, `congela`, `pisca`, `quebra` |
| `K.brilhar(peca, B.t)` | o brilho amarelo do "Esse é o X" |

**Textos** (criados no `montar`, mostrados com `.em(ponto, tc - t0)`): `K.rotulo('Pilha')` (o nome grande, só no
"Esse é o X"), `K.etiqueta('Luz fraca', 'vermelho')` (vermelho = problema, verde = funciona, azul = informação,
laranja = curiosidade), `K.marca('certo' ou 'errado')` (✓/✗: **do lado ou em cima** da etiqueta, nunca por cima do texto
dela), `K.contador()` (número grande), `K.cartaoSeguir()` (o fim).

**Efeitos** (o invisível vira visível): `K.chuva`, `K.fogo`, `K.fumaca` (fumaça ou vapor), `K.jato` (fio de água),
`K.pingos`, `K.respingo`, `K.esguicho`, `K.vento`, `K.ondas` (som, sinal), `K.fluxo` (eletricidade ou água num cano),
`K.bits` (dados), `K.halo` (brilho de luz), `K.seta` (força), `K.poeira`, `K.lascas`, `K.festa`. Cada um com exemplo no
cardápio.

**Sons:** `K.som(nome, instante, volume)`, com os nomes de `motor/sons/`. A peça entrando, a falha e os textos já tocam o
som deles sozinhos.

### As regras do código

1. **Tudo é função do tempo da cena (`tc`).** Nada de guardar estado de um quadro pro outro: o ⏪, as prévias e o
   `--trecho` pulam pra qualquer instante. Use `B.p` (0 a 1 na frase), `B.t` (segundos na frase), `B.q`/`B.tq`
   (progresso e tempo depois do ⏪, na frase com `conserta`), `K.faixa`, `K.suave`, `quando('palavra', B, fração)`
2. **Uma função em `P` pra cada plano do `roteiro.json`**, mais `capa` e `cartao` (a cauda). Faltando uma, o render avisa
3. **O personagem começa escondido em todo quadro** (`menino.g.visible = false` no `cena()`) e cada plano põe ele onde
   quer com `menino.colocar` ou `menino.irPara`. Nunca colado na câmera nem na frente da peça
4. **Câmera depois de tudo:** chame `K.filmar` no fim do plano, com o personagem e as peças já no lugar
5. **Textos:** no máximo 2 na tela. A legenda fica em y ~1180 a 1300: nada importante atrás dela. A capa e o fim precisam
   do topo livre (`espacoCima`)
6. **Final:** `por_fora` (o objeto inteiro), `por_dentro` (as peças se separam no ar, uma por vez, cada uma na palavra
   dela, com o nome do lado), `segue` (o `K.cartaoSeguir`, o personagem aponta pra ele) e `cartao` na cauda (o cartão
   fica e o personagem acena)
7. **Capa (`P.capa`):** a pergunta vai no topo sozinha (o motor põe, numa caixa branca); o objeto no meio mostrando o
   detalhe mais curioso; o personagem perto, sem tampar o detalhe. Tudo entre y 240 e 1680 (o TikTok corta em 3:4)

## Passo 4: a revisão (obrigatória)

```
node motor/render.js videos/<tema> --voz-teste --revisar
```

Leva uns 15 segundos e não faz vídeo. Ela confere, frase por frase, os 4 ingredientes e faz a **folha**:
`videos/<tema>/testes/folha.jpg`, uma imagem por frase, numerada. O relatório também fica em `testes/revisao.txt`.

- `[corrigir]`: tem que arrumar no `cena.js` antes do vídeo completo
- `[conferir]`: olhe na folha se foi de propósito (um close sem o personagem, por exemplo, pode ser)
- **Abra a folha** e responda: cada imagem é diferente da anterior? O personagem aparece inteiro e fazendo algo? A peça
  certa aparece? Algum texto encavalado ou cortado? Se a IA não enxerga imagem, confie no relatório
- Repita até aparecer **`RESULTADO: APROVADO`**

| O relatório diz | O que fazer no plano |
|---|---|
| câmera parada | `K.filmar(alvo, 'chegando', B.p, ...)` (ou outro movimento); nada de `K.mirar` sozinho |
| mesma câmera da frase N | outro `plano` (perto ↔ aberto), outro `lado` ou outra `altura` |
| imagem quase igual à da frase N | mostre outra coisa: outra peça de perto, outro lugar, o personagem em outra ação |
| personagem parado | `menino.reagir('...', B.t)`, `menino.irPara(...)`, `apontar`, `segurar` |
| personagem colado na câmera | `plano: 'medio'` ou `'aberto'`, ou ponha ele mais longe |
| a cabeça do personagem sai por cima | afaste a câmera ou mire mais alto |
| nada acontece | uma peça entrando (`K.entrar`), uma falha (`K.falhar`), um efeito, uma etiqueta ou um som |
| a câmera não mostra X | X entra no alvo do `K.filmar` desta frase (`K.filmar([X, menino], ...)`), e confira o lado: a câmera pode estar do lado de trás |
| X aparece cortada pela borda | X no alvo do `K.filmar`, ou plano mais aberto (`perto` → `medio` → `aberto`); com `espacoCima`, use `aberto` |
| X não aparece nesta frase | ela ainda não entrou (o `K.entraNo` dela é de uma frase depois) ou algum `.visible = false` esconde: confira a coluna "Aparece" da ficha |
| X aparece pequena demais | plano `perto` ou `detalhe`, com só ela (ou ela e um ponto do lado) no alvo |
| "X" está no "mostra", mas nenhuma peça tem esse nome | use o nome da chave do `K.pecas` ou de um objeto do cenário (o relatório lista os que existem), ou dê o nome com `K.nomear('X', peça)` no `montar`; se a peça nem existe, ela foi esquecida: faça a peça |
| falta o "mostra" | a linha MOSTRA da ficha daquela frase vai pro `roteiro.json`: `"mostra": ["pilha", "personagem"]` |
| frase longa sem nada novo na 2ª metade | uma segunda coisa na palavra do meio: `quando('palavra', B, 0.6)` |
| X em cima de Y / em cima da legenda | mude o ponto do texto; ✓/✗ acima da etiqueta: `{ tela: [x, y - 150] }` com `K.tela(ponto)` |
| o plano "x" aparece nas frases a, b | cada frase com o seu plano e a sua função em `P` |

Depois da revisão aprovada, prévias de instantes específicos e um trecho com som, pra ver o movimento e o ⏪:

```
node motor/render.js videos/<tema> --voz-teste --previa 1,6,12      (os tempos ficam em timeline.json)
node motor/render.js videos/<tema> --voz-teste --capa
node motor/render.js videos/<tema> --voz-teste --trecho 20,35
```

## Passo 5: mostrar pra pessoa

Mande os links da **folha**, da **capa** e de 2 ou 3 prévias e pergunte (com a sua sugestão): "O personagem, as cores e o
lugar estão como você imaginou? Tem alguma cena (pelo número da folha) que você mudaria? Posso fazer o vídeo completo?"
A resposta vai pro `canal/historico.md`. Cena elogiada vai pra "Cenas que funcionaram" de `canal/aprendizados.md`.

## Passo 6: render e entrega

`node motor/render.js videos/<tema>` e a **entrega completa** do `comandos/novo-video.md` (capa conferida, texto de
postar, pauta marcada, testes guardados em `testes/`), sem esperar pedido. O render roda a revisão rápida antes: se ela
achar algo pra corrigir, **ele para sem fazer o vídeo** e mostra a lista (`O VÍDEO COMPLETO NÃO FOI FEITO`). Arrume e
rode o `--revisar` de novo; a voz que já foi feita não gasta crédito de novo. Só se a pessoa pedir pra fazer assim
mesmo, com os erros: o mesmo comando com `--mesmo-assim`.

## Erros comuns e como resolver

| Aconteceu | Por quê | Conserto |
|---|---|---|
| `erro na cena: ... is not defined` | nome errado ou variável fora do lugar | a mensagem diz a linha; confira o nome no `kit-indice.md` |
| `Falta o plano "x" no cena.js` | o `roteiro.json` tem um plano sem função em `P` | crie a função `x(B, tc) { ... }` em `P` |
| `página: K.entraNo: o plano "x" não existe` | o nome no `K.entraNo` não bate com o `roteiro.json` | use o mesmo nome do campo `plano` |
| `página: câmera: lado "x" não existe` | opção com nome errado | use os nomes das tabelas acima |
| tela toda de uma cor, ou só céu | a câmera dentro de uma peça ou olhando pro nada | use `K.filmar` com a peça como alvo |
| a peça não aparece | ela entra num plano depois deste, ou está embaixo do chão | confira o `K.entraNo` e o `pos` (y = metade da altura) |
| a peça aparece antes da hora | ela não tem `K.entraNo` | ponha o `K.entraNo` no `montar` |
| tudo escuro | céu de noite sem luz | `K.ceu('dia')` ou `'tarde'`, ou `brilho` na peça |
| o personagem fica de costas | ele olha pra peça e a câmera está atrás | `menino.colocar(pos, ponto)` virado pra câmera, ou outro `lado` na câmera |
| o vídeo passou de 3:00 | roteiro longo demais | encurte (o Shorts corta em 3:00) |
| `K.cenario: o cenário "x" não existe` | nome errado | a mensagem lista os nomes certos (sem acento também vale) |
| o céu ficou diferente do cenário | o `cena()` chama `K.ceu` em todo quadro | apague o `K.ceu` do `cena()`: o cenário já põe o céu dele |
| o objeto ficou enterrado ou flutuando | ele não está em `C.centro` (a calçada da cidade é mais alta) | `grupo.position.set(...C.centro)` |
| `K.modelo: o modelo "x" não existe` | peça de um pacote que não está em `motor/modelos/` | use um nome de `K.MODELOS` (`referencias/cenarios.md`) |

Resolveu um erro que deu trabalho? Uma linha em "Lições técnicas" de `canal/aprendizados.md` (o que deu errado e como
resolveu), pra não repetir no próximo vídeo.

## Checklist antes do vídeo completo

- [ ] `roteiro.md` com a ficha de cena completa: cenário, tabela de objetos, teste dos substantivos e um bloco por
      frase (Passo 1)
- [ ] `cena.js` próprio (nada de `"modelo": "montagem"`), um plano por frase, cada um com as linhas do bloco da ficha
- [ ] Todo objeto da tabela existe no `cena.js`, com o mesmo nome, e toda frase tem o `"mostra"` no `roteiro.json`
- [ ] Um cenário pronto que combina com o tema (`K.cenario`), e as peças dele aparecendo em alguma frase
- [ ] `--revisar` deu **APROVADO** e você abriu a folha
- [ ] Cada frase tem câmera mexendo (diferente da anterior), personagem atuando (duas ações nas frases com mais de 2 s),
      algo acontecendo e texto ou som
- [ ] O que a frase diz aparece na tela, na hora da palavra
- [ ] Tem `jogo`: as falhas consertadas com `corrige`, e no máximo 2 `conserta` (⏪)
- [ ] O objeto parece o que é, e cada peça nova aparece de perto quando é nomeada
- [ ] Tudo perto do personagem no tamanho de verdade em relação a ele ("O tamanho das coisas")
- [ ] A capa e o fim com o topo livre; nenhum texto em cima de outro
