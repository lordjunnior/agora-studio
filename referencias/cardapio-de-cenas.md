# Cardápio de cenas

> Ideias prontas, com código, pra cada tipo de frase do roteiro. Use junto com `referencias/COMO-FAZER-O-VIDEO.md` e o
> modelo `referencias/modelo-de-cena/cena.js` (os nomes `menino`, `pc`, `fx`, `mais`, `quando`, `BASE` e `LADO` são os de
> lá). **Como usar:** pra cada linha da ficha de cena, escolha uma receita do tipo da frase, **diferente da frase
> anterior**, e troque as peças, os lugares e as palavras. Misturar duas receitas também vale.
>
> Lembrete dos 4 ingredientes de toda frase: CÂMERA mexendo, PERSONAGEM atuando, ALGO ACONTECENDO e TEXTO ou SOM.

## 1. O gancho (a pergunta curiosa da 1ª frase)

A capa ganhando vida: o objeto pronto, funcionando, e a pergunta escrita no topo (o motor põe). Topo livre: `espacoCima`.

**A. Do alto até o detalhe.** A câmera vem do céu e chega no que intriga.
```js
gancho(B, tc) {
  menino.colocar(LADO, BASE);
  menino.reagir('surpreso', B.t);
  menino.apontar(0.6);
  K.filmar([pc.tampa, menino], 'mergulho', B.p, { plano: 'medio', lado: -20, espacoCima: 0.35 });
},
```

**B. Revelando o tamanho.** Começa no detalhe e abre até mostrar tudo ("olha o tamanho disso").
```js
K.filmar(pc.pilha, 'revelando', B.p, { plano: 'aberto', espacoCima: 0.35 });
```

**C. Funcionando de verdade.** O efeito ligado no gancho: a luz acesa, a água correndo, o motor girando. É a promessa
do vídeo: no fim a pessoa vai entender aquilo.

## 2. "Se você..." (o jeito simples que dá errado)

O personagem tenta o jeito mais óbvio e se dá mal. É a cena mais engraçada do vídeo: capriche na atuação.

**A. Tropeço.** Anda, tropeça e cai, com poeira e baque. A câmera na altura dele.
```js
tropeca(B, tc) {
  const anda = K.faixa(B.p, 0, 0.6);
  const pos = menino.irPara([3, 0, 2], [0.8, 0, 0.6], anda, tc);
  if (anda >= 1) {
    const tQ = B.inicio + 0.62 * B.dur;
    menino.cair(K.faixa(tc, tQ, tQ + 0.4));
    K.som('baque', tQ + 0.15, 0.8);
    fx.poeira.em([pos[0], 0, pos[2] - 0.3], tc - tQ - 0.15, 0.7);
  }
  for (let k = 0.05; k < 0.6; k += 0.1) K.som('passo', B.inicio + k * B.dur, 0.5);
  fx.et.escuro.em(mais(pos, [0, 2.0, 0]), tc - (B.inicio + 0.3 * B.dur));
  K.filmar(menino, 'passando', B.p, { plano: 'medio', lado: 'direita', altura: 'olho' });
},
```

**B. A gambiarra que não aguenta.** Ele usa um objeto qualquer no lugar da peça certa (um pano, uma caixa, um balde) e
ela falha: molha, tomba, quebra. `K.peca` cria o objeto improvisado; `K.falhar` faz ele falhar.
```js
K.falhar(fx.gambiarra, 'tomba', tc - quando('cai', B, 0.6));
menino.reagir(B.p < 0.6 ? 'empurrando' : 'susto', B.t);
```

**C. Sofrendo com o problema.** Calor (suando, `K.fogo` perto), frio (`congela`), escuro (céu de noite), chuva
(`K.chuva`), barulho (`K.ondas`). `menino.reagir('cansado', B.t)` e uma etiqueta vermelha.

## 3. "Mas..." (o problema)

O problema tem que **dar pra ver**. Na frase com `"jogo": "falha"`, a cena congela em preto e branco no fim.

**A. A peça falhando.** A peça nova não dá conta: treme, apaga, tomba, esquenta. Close nela; ele leva um susto.
```js
apagada(B, tc) {
  menino.colocar(LADO, BASE);
  const tA = quando('apaga', B, 0.4);
  K.falhar(pc.lampada, 'apaga', tc - tA);
  menino.reagir(tc > tA ? 'susto' : 'duvida', tc - tA);
  fx.et.apagada.em(mais(BASE, [0, 2.2, 0]), tc - tA - 0.2);
  K.filmar([pc.lampada, menino], 'chegando', B.p, { plano: 'perto', lado: 'esquerda' });
},
```
Falhas: `treme` (não aguenta), `tomba` (cai de lado), `murcha` (amassa), `apaga` (escurece), `esquenta` (fica vermelha e
brilha), `congela` (fica azul), `pisca` (falhando), `quebra` (treme e solta lascas).

**B. A consequência exagerada.** A água espirrando pra todo lado (`K.esguicho`), a fumaça subindo (`K.fumaca`), a luz
fraquinha que não chega (o personagem longe, no escuro). A câmera mostra o tamanho do estrago: `afastando`, `aberto`.

**C. O problema crescendo.** Um contador subindo (`K.contador`), um termômetro (`K.termometro`), a peça ficando cada vez
mais vermelha (`K.falhar(peca, 'esquenta', ...)` com `forca` subindo com `B.p`).

**D. Pensando.** Quando o problema é uma dúvida ("mas como ela sabe a hora de desligar?"): `menino.reagir('duvida', B.t)`,
câmera `girando` em volta dele, etiqueta laranja.

## 4. "Então você..." (a solução, a peça nova)

A peça entra com movimento, som e brilho amarelo, na palavra que a descreve. Na frase com `"jogo": "corrige"` (ou
`"conserta"` com ⏪), a falha some e corta pra montagem.

**A. Cai do céu e encaixa.** O jeito clássico. No `montar`: `K.entraNo('pilha', pc.pilha, 'cai', { palavra: 'pilha' })`.
No plano, só o personagem e a câmera:
```js
pilha(B, tc) {
  menino.colocar(LADO, BASE);
  const tC = quando('pilha', B, 0.3) + 0.4;          // quando ela chega
  menino.reagir(tc < tC ? 'surpreso' : 'vitoria', tc - tC);
  fx.et.acendeu.em(mais(BASE, [0, 2.2, 0]), tc - tC - 0.3);
  K.filmar(pc.pilha, 'subindo', B.p, { plano: 'perto', lado: 'direita' });
},
```

**B. Ele traz na mão.** A peça vai na mão dele e encaixa no lugar (como a lâmpada do exemplo). A peça segue
`menino.mao(1)` até a metade da frase e depois fica no lugar dela:
```js
const m = menino.mao(1), k = K.suave(K.faixa(B.p, 0.35, 0.6));
const casa = pc.lampada.userData.casa.pos;                 // onde ela mora (no grupo da peça)
pc.lampada.position.set(K.lerp(m[0], casa.x, k), K.lerp(m[1], casa.y, k), K.lerp(m[2], casa.z, k));
if (k < 1) menino.reagir('segurando', B.t); else menino.reagir('ideia', B.t);
```
(Só funciona assim se a peça estiver direto na cena; dentro de um grupo, converta o ponto da mão com
`grupo.worldToLocal`.)

**C. Desliza pro lugar e liga.** `'desliza'` com `de: [x, y, z]` (de onde ela vem) e, quando encaixa, o efeito liga: a
luz acende, a água corre, o motor gira. A câmera acompanha: `passando` ou `chegando`.

**D. Várias peças juntas.** Um `K.entraNo` por peça, cada uma na sua palavra ("um esqueleto de *hastes* presas num
*cabo*"). Câmera `subindo` mostrando o conjunto.

## 5. "Esse é o X" (o nome da peça)

Frase curta: close na peça brilhando, o rótulo amarelo em cima, a câmera girando devagar.

**A. Girando em volta.**
```js
pilha_rotulo(B, tc) {
  K.brilhar(pc.pilha, B.t);
  fx.rot.pilha.em(mais(BASE, [0, 1.6, 0]), B.t - 0.05);
  K.filmar(pc.pilha, 'girando', B.p, { plano: 'perto', altura: 0, angulo: 40 });
},
```

**B. De baixo pra cima.** Peça embaixo de outra (a trava embaixo do pano): `altura: 'baixo'` ou `0`. Nunca de cima.

**C. A peça no ar.** Ela sobe um pouco do lugar e gira sozinha enquanto o nome aparece:
`pc.botao.position.y += 0.3 * K.suave(B.p); pc.botao.rotation.y = B.t * 2;`

## 6. "É por isso que..." (o dia a dia)

O momento "ah, então é por isso". **Mude de lugar ou de hora**: é a cena que a pessoa reconhece da vida real.

**A. A vida real dentro do cenário pronto.** A peça do vídeo aparecendo no lugar de verdade que o cenário já tem:
o prédio em obra (`C.lugares.laje`), o carro passando (`C.objetos.carros`), a geladeira (`C.objetos.geladeira`).
Câmera `revelando`, com o personagem apontando (a frase `obra` do `referencias/modelo-construcao/` é o exemplo).

**A2. Outro lugar.** A mesma peça em outro canto do cenário (`C.esquerda`, `C.direita`, `C.fundo`) ou de noite
(`K.ceu('noite')`). Câmera `revelando`.

**B. Antes e depois.** Tela dividida: `K.dividir()` e as câmeras `K.camCima` e `K.camBaixo` posicionadas com
`K.mirar(pos, alvo, K.camCima)`. Em cima sem a peça, embaixo com ela.

## 7. Números e comparações

**Número concreto:** `K.contador()` no `montar`, e no plano `fx.contador.em('3 HORAS', mais(BASE, [0, 2.4, 0]), tc - t0, 'COM UMA PILHA')`.
Medidas: `K.medida().em(a, b, '1,5 m', tc - t0)`. Temperatura: `K.termometro(0, 100).em(graus, ponto, tc - t0)`.

**Comparação caseira** ("igual a uma mangueira com o dedo na ponta"): monte a comparação com formas simples (`K.peca`) ou
um objeto pronto (`K.torneira`, `K.balde`), do lado do objeto, e mostre as duas coisas fazendo a mesma coisa.

## 8. O fim

- **Por fora:** o objeto inteiro, a câmera `afastando`, o personagem do lado `mostrando`. Um som leve (`K.som('whoosh', ...)`)
- **Por dentro:** as peças se separam no ar, uma por vez, cada uma na palavra dela, com o nome do lado (etiqueta azul).
  Câmera `girando` aberta. Exemplo pronto: `por_dentro` do modelo
- **Segue:** `fx.seguir.em(tc - tS)` (o `K.cartaoSeguir`), `K.som('brilho', tS)` e `K.som('clique', tS + K.SEGUIR_CLIQUE)`;
  ele aponta pra cima (`menino.apontar(1)`); câmera `parado` com `espacoCima: 0.55`
- **Cartão (cauda):** o cartão fica (`fx.seguir.em(9)`), ele acena (`menino.reagir('chamando', tc)`), `K.som('final', B.inicio)`
- **Capa:** como o gancho, parada (`K.filmar(..., 'parado', 0, { espacoCima: 0.35 })`), mostrando o detalhe que intriga

## 9. O invisível vira visível

| O que a frase fala | Como mostrar | No kit |
|---|---|---|
| eletricidade, corrente | pontinhos amarelos correndo no fio | `K.cano` (o fio) + `K.fluxo(K.caminho(pontos), 26, 0xffe14a)` e `.em(tc, 0.6)` |
| água correndo num cano | pontinhos claros no cano translúcido | `K.fluxo(caminho)` |
| água caindo, vazando | fio de água, gotas, respingo | `K.jato(0.05).em(origem, comprimento, tc)`, `K.pingos(3, 8).em(origem, tc, ritmo, queda)`, `K.respingo(6).em(centro, tc - t0)` |
| cano furado, mangueira | esguicho | `K.esguicho(8).em(origem, [dx, dy, dz], velocidade, tc, 0)` |
| chuva | chuva (sem chover embaixo do teto) | `K.chuva(12).em([0, 0, -5], tc, 1, { pos: [x, alturaDoTeto, z], raio })` |
| calor, queimando | fogo, fumaça, a peça vermelha | `K.fogo(14).em(pos, tc, escala, forca)`, `K.fumaca(15).em(origem, tc, { altura: 3 })`, `K.falhar(peca, 'esquenta', ...)` |
| vapor, panela | vapor branco subindo | `K.fumaca(16, 0xffffff).em(origem, tc, { altura: 2, ritmo: 0.5 })` |
| frio | a peça azul, vapor branco | `K.falhar(peca, 'congela', ...)` + `K.fumaca(16, 0xffffff)` |
| vento, ar empurrando | traços brancos passando | `K.vento(13).em(centro, tc, intensidade, direcao)` |
| som, sinal, Wi-Fi, grito | ondas saindo de um ponto | `K.ondas(0xffffff).em(origem, rumo, tc, alcance)` |
| dados, internet | bits correndo num caminho | `K.bits(K.caminho(pontos)).em(tc, velocidade)` |
| luz | facho, brilho em volta | `K.halo(0xfff2a0, 1)` (mostrar com `.visible`, `.position`, `.scale`), `brilho` na peça |
| força, peso, pressão | seta vermelha | `K.seta().em(origem, [dx, dy, dz], comprimento, tc - t0)` |
| impacto, queda | poeira, tremida da câmera | `K.poeira(2).em([x, 0, z], tc - t0, escala)`, `K.tremer(tc - t0)` depois do `K.filmar` |
| quebrar | lascas voando | `K.lascas(4).em(centro, tc - t0, 0)` ou `K.falhar(peca, 'quebra', ...)` |
| comemorar, deu certo | confete | `K.festa(centro).em(tc - t0)` |
| o tempo passando | ⏩ na frase | `"jogo": "avanca"` no `roteiro.json` |

Efeito, texto e personagem: **criados uma vez no `montar`** (`fx.fogo = K.fogo(14)`) e mostrados no plano com `.em()`.
Fora do plano que chama `.em()`, eles somem sozinhos.

## 10. Câmera: sequências que funcionam

- **Alterne a distância:** aberto → perto → médio → detalhe → aberto. Duas frases seguidas no mesmo plano cansam
- **Troque o lado** a cada 1 ou 2 frases (`direita`, `esquerda`, `frente`) e a altura de vez em quando (`baixo` deixa o
  objeto imponente; `alto` mostra o caminho, a poça, o mapa)
- **Problema:** `chegando` (tensão) ou `afastando` (o tamanho do estrago). **Solução:** `subindo` ou `girando` (a peça
  chegando). **Nome:** `girando` perto. **Dia a dia:** `revelando`
- **Personagem andando:** `passando`, com ele como alvo (a câmera vai junto)
- **Impacto:** `K.tremer(tc - tImpacto, 1)` logo depois do `K.filmar`

**A câmera de cada tipo de frase** (o ponto de partida; troque o lado e a altura pra não repetir a da frase anterior):

| Frase | Alvo | Câmera |
|---|---|---|
| gancho | o objeto pronto e o personagem | `K.filmar([obj, menino], 'mergulho', B.p, { plano: 'medio', lado: -25, espacoCima: 0.35 })` |
| "Se você..." | o personagem em ação | `K.filmar([obj, menino], 'passando', B.p, { plano: 'medio', lado: 'esquerda', altura: 'olho' })` |
| "Mas..." (o problema) | a peça que falha | `K.filmar(peca, 'chegando', B.p, { plano: 'perto', lado: 'direita', altura: 'olho' })` |
| "Então você..." (a solução) | a peça nova e o personagem | `K.filmar([peca, menino], 'subindo', B.p, { plano: 'medio', lado: 'direita' })` |
| "Esse é o X" | só a peça | `K.filmar(peca, 'girando', B.p, { plano: 'perto', altura: 25, espacoCima: 0.3 })` |
| peça pequena (botão, trava) | ela e um ponto do lado | `K.filmar([peca, ponto], 'chegando', B.p, { plano: 'detalhe', tam: 0.5 })` |
| "É por isso que..." | a vida real no cenário | `K.filmar([menino, C.fundo], 'revelando', B.p, { plano: 'medio', altura: 'baixo' })` |
| "Por fora" | o objeto inteiro e o personagem | `K.filmar([obj, menino], 'afastando', B.p, { plano: 'aberto', lado: 'esquerda', altura: 15 })` |
| "Por dentro" | as peças se separando | `K.filmar([obj, pontoDeCima], 'girando', B.p, { plano: 'medio', altura: 12 })` |
| "segue" e a cauda | o personagem inteiro e o objeto | `K.filmar([obj, menino], 'parado', B.p, { plano: 'aberto', espacoCima: 0.45 })` |

**Câmera no lugar errado, os erros que mais aparecem:**
- A frase fala da peça e o alvo é só o personagem: a peça fica fora do quadro. O alvo é sempre o que a frase fala
- Topo livre (`espacoCima`) com plano `medio`: o personagem fica cortado embaixo. Com o topo livre, `aberto`
- Peça pequena num plano `medio` com o objeto inteiro: ela some na tela. Peça pequena é `perto` ou `detalhe`
- O personagem de costas: ele olha pra peça e a câmera está atrás dele. Troque o `lado` ou vire ele (`menino.colocar(pos,
  ponto)`, com o ponto pro lado da câmera)
- A câmera dentro de uma peça ou atrás de uma parede: filme a peça com `K.filmar` (ele não atravessa o cenário pronto) e,
  pra peça que fica dentro de outra, `fora: objetoDeFora`

## 11. Personagem: o verbo da frase vira ação

**Duas ações por frase** (uma no começo, outra numa palavra), pra ele nunca ficar parado que nem espantalho:

```js
const tR = quando('racha', B, 0.8);                                          // a palavra da 2ª ação
if (tc > tR) menino.reagir('susto', tc - tR); else menino.reagir('duvida', B.t);
// andando e depois reagindo
menino.irPara(C.entrada, LADO, K.faixa(B.p, 0, 0.45), tc, { olhar: BASE });
if (B.p > 0.45) menino.reagir('pensando', tc - (B.inicio + 0.45 * B.dur));
```

Combinações que funcionam: `duvida` → `susto` (o problema aparece) · `surpreso` → `ideia` (a solução) · `segurando` →
`vitoria` (funcionou) · `pensando` → `ideia` · `triste` → `bravo` · anda (`irPara`) → `mostrando` · `surpreso` →
`apontar` (o "olha isso"). No "Esse é o X" (frase curta), uma só: `mostrando` ou `apontar`.

| A frase fala | Ação |
|---|---|
| tropeça, cai, escorrega | `menino.cair(x)` + poeira + baque |
| anda, vai, atravessa, chega | `menino.irPara(de, ate, x, tc)` (`{ correr: true }` pra correr) |
| assusta, explode, estoura, quebra | `menino.reagir('susto', t)` |
| não funciona, falha, apaga | `'triste'`, `'bravo'`, `'duvida'` |
| esquenta, cansa, molha, sofre | `'cansado'` (sua) |
| descobre, então você..., inventa | `'ideia'` (aponta pra cima, pulinho) |
| funciona, deu certo, acende | `'vitoria'` (comemora) |
| esse é o..., olha, por fora | `'mostrando'` (braço aberto apresentando) ou `menino.apontar(0.5)` |
| segura, pega, traz | `'segurando'` (ou `'erguendo'`, acima da cabeça) |
| empurra, aperta, força | `'empurrando'` |
| segue o canal, tchau | `'chamando'` (acena) e `menino.apontar(1)` pro cartão |

## 12. Sons (`motor/sons/`)

`K.som(nome, instante, volume)`. A peça entrando, a falha e os textos já tocam os deles.

| Pra quê | Sons |
|---|---|
| peça entrando, encaixando | `whoosh`, `baque`, `tampa`, `trava`, `clique`, `metal`, `madeira`, `pedra` |
| funcionando | `liga`, `brilho`, `ding`, `certo`, `turbina`, `zumbido`, `bip` |
| problema | `errado`, `desliga`, `racha`, `range`, `estalo`, `zap`, `buzina`, `apito` |
| água | `agua`, `pingo`, `respingo`, `bolhas`, `esguicho`, `torneira`, `ondas` |
| fogo, calor, ar | `fogo`, `vapor`, `bomba`, `estrondo`, `foguete`, `paraquedas` |
| personagem | `passo`, `festa` |
| videogame e fim | `rebobina`, `avanca`, `congela`, `final` |
| outros | `mosquito`, `fissao`, `desconstrucao` |

## 13. Cenários prontos: uma ideia de cena pra cada um

O cenário do vídeo (`K.cenario`, lista e fotos em `referencias/cenarios.md`) tem peças que dão frase. Algumas:

| Cenário | Cena pronta |
|---|---|
| `construcao` | `K.filmar(C.objetos.carga, 'subindo', B.p, { plano: 'medio' })`: a câmera acompanha o palete subindo no guindaste |
| `construcao` | `K.filmar(C.objetos.betoneira, 'girando', B.p, { plano: 'medio' })` + etiqueta "Misturando" em `C.lugares.betoneira` |
| `natureza` | `K.plano(C.vista, C.vista, B.p)` no gancho: o campo, as montanhas e o céu azul antes do objeto aparecer |
| `cidade` | `K.filmar(C.lugares.semaforo, 'chegando', B.p, { plano: 'perto', tam: 1.5 })`: o semáforo trocando de cor sozinho |
| `cidade` | personagem esperando na faixa (`C.lugares.faixa`) enquanto os carros passam atrás |
| `casa` | `K.filmar(C.lugares.caixa_dagua, 'revelando', B.p, { tam: 2 })`: a caixa d'água no telhado |
| `cozinha` | `K.falhar(C.objetos.geladeira, 'congela', tc - t0)` ou a panela no `C.lugares.fogao` com `K.fumaca` (vapor) |
| `praia` | o personagem anda até a beira (`C.lugares.beira`) e a onda chega no pé dele |
| `fundo_do_mar` | `menino.capaceteEspacial()` + peixe passando na frente da câmera; `K.filmar(C.lugares.naufragio, 'revelando', B.p)` |
| `espaco` / `lua` | `menino.capaceteEspacial()` e `menino.pular(x, 1.2)` (pulo alto, sem peso) |
| `fazenda` | `K.filmar(C.objetos.vacas[0], 'chegando', B.p, { plano: 'perto' })`: a vaca pastando |
| `consultorio` | o doutor (`K.boneco({ tipo: 'doutor' })`) apontando o cartaz do corpo (`C.lugares.cartaz`) |
| `oficina` | o personagem embaixo do carro no elevador (`C.lugares.baixo_do_carro`) olhando pra cima |
| `escritorio` | `K.filmar(C.objetos.quadro, 'chegando', B.p)`: o gráfico subindo no quadro branco |
| `estudio` | o objeto girando no pedestal, sem nada em volta: bom pro "por dentro" e pra capa |
