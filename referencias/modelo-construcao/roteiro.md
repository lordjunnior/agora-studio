# Concreto armado: roteiro e ficha de cena

> **Modelo pra copiar o formato** (o tema é outro: TROQUE tudo). É assim que fica o `roteiro.md` de todo vídeo: o
> texto, a ciência conferida, os objetos do vídeo, o teste dos substantivos e **um bloco por frase**, com tudo o que
> aparece e se mexe, com as 10 linhas. O `roteiro.json` e o `cena.js` desta pasta saíram desta ficha, linha por linha:
> cada bloco virou um plano do `cena.js`, com as mesmas linhas como comentário e o código embaixo de cada uma.

## Roteiro

1. Por que todo prédio tem ferro escondido dentro do concreto? *(gancho)*
2. Se você precisa de uma coluna que segure um prédio, enche uma fôrma de concreto e espera secar.
3. Mas o concreto puro aguenta aperto e não aguenta puxão: quando o vento empurra, ele racha.
4. Então você põe dentro uma gaiola de vergalhões de aço, amarrados com arame.
5. Essa é a *armadura*.
6. Mas o ferro sozinho, na chuva, enferruja e fica fraco.
7. Então o concreto envolve o ferro inteiro e protege ele da água e do ar.
8. Esse é o *concreto armado*.
9. É por isso que numa obra você vê ferro saindo do topo das colunas.
10. Por fora, é só uma coluna cinza.
11. Por dentro, é aço que aguenta o puxão e concreto que aguenta o aperto.
12. E segue o canal pra ver o próximo.

134 palavras, uns 45 segundos (modelo curto; vídeo de verdade: 400 a 550 palavras).

## Ciência conferida

- Concreto resiste bem à compressão e mal à tração (puxão): por isso racha quando dobra
- O aço da armadura aguenta a tração; o concreto em volta protege o aço da corrosão (o "cobrimento")
- As barras que ficam saindo do topo das colunas na obra são as "esperas", pra emendar o próximo andar

## Ficha de cena

**Cenário:** `construcao` (canteiro de obras), porque o vídeo é sobre coluna de prédio. Peças do cenário que entram
nas frases: o prédio em obra com os ferros no topo (`predio`, frase 9), a betoneira girando lá atrás (frase 2), o
guindaste e os operários (no fundo, o tempo todo). Foto: `referencias/cenarios/construcao.jpg`.
**Hora:** dia. **Personagem:** o do canal, quase sempre em `C.personagem` (do lado da coluna, um pouco à frente).

### Objetos do vídeo

Tudo o que a câmera precisa mostrar. O nome da 1ª coluna é o mesmo no `cena.js` (a chave do `K.pecas` ou o
`K.nomear`) e no `"mostra"` do `roteiro.json`.

| Nome | O que é | Feito com | Tamanho e cor | Onde fica | Aparece |
|---|---|---|---|---|---|
| `coluna` | a coluna inteira (sapata + concreto + gaiola) | `THREE.Group` + `K.nomear('coluna', coluna)` | 3,3 de altura | `C.centro` | todas |
| `sapata` | a base de concreto, no chão | `K.pecas`: caixa | 1,3 × 0,3 × 1,3, cinza `#a9a59c` | embaixo, y = 0,15 | todas |
| `concreto` | o corpo da coluna | `K.pecas`: caixa | 0,62 × 2,7 × 0,62, cinza claro `#c3bfb6` | em cima da sapata, y = 1,65 | sobe na 2; some na 4 a 6; cresce de novo na 7 |
| `gaiola` | 4 vergalhões em pé + 6 estribos (anéis) | `K.pecas`: cilindros e anéis, num grupo + `K.nomear` | 3,3 de altura, ferrugem `#8a4b2a`, metal | dentro do concreto | cai na 4 |
| `predio` | o prédio em obra, com ferro saindo do topo | o cenário (`C.objetos.predio`) | | `C.fundo` | 9 |
| `personagem` | o personagem do canal | `K.boneco` com as cores de `canal/identidade.md` | 1,47 de altura | `C.personagem` | quase todas |
| vento, seta, lascas, chuva | efeitos | `K.vento`, `K.seta`, `K.lascas`, `K.chuva` | | em volta da coluna | 3 e 6 |

### Teste dos substantivos

Cada coisa que a narração cita aparece na frase em que é falada (ou fica escrito por que não):

| A narração fala | Aparece na frase | Como |
|---|---|---|
| prédio | 1 e 9 | o canteiro atrás; o `predio` do cenário |
| ferro, vergalhões, aço | 1, 4, 5, 6, 11 | a `gaiola` |
| concreto, coluna | 1, 2, 3, 7, 8, 10, 11 | o `concreto` e a `coluna` |
| fôrma | não aparece | a coluna já sobe no formato: é detalhe |
| vento | 3 | `K.vento` + a seta vermelha empurrando |
| arame | não aparece | pequeno demais no tamanho da coluna |
| chuva | 6 | `K.chuva` |
| obra, topo das colunas | 9 | o `predio`, com os ferros da laje |

### Cena por cena

Um bloco por frase, com as 10 linhas, nesta ordem. Escrito pra quem vai desenhar a cena sem ter ouvido a narração:
onde cada coisa está, o que se mexe e em que palavra, de onde a câmera olha, o que aparece escrito e o que se ouve.

**O fundo de todas as cenas** (o cenário cuida, ninguém programa): o canteiro de obras de dia; atrás da coluna, o
caminhão betoneira com o tambor laranja e branco girando, as pilhas de tijolos e os sacos de cimento; do lado, o monte
de areia e a escavadeira amarela; no fundo, o prédio em obra com o andaime e a tela verde, o guindaste e os operários
de capacete andando com o carrinho de mão.

#### 1 · plano `gancho` · ~4 s
> "Por que todo prédio tem ferro escondido dentro do concreto?"

- **NA TELA:** a coluna pronta no centro, com o ferro (a gaiola) aparecendo por dentro do concreto meio transparente;
  o personagem embaixo, à direita da coluna e um pouco à frente; a pergunta no topo
- **MOSTRA:** `["coluna", "personagem"]`
- **CENÁRIO:** o canteiro; bem atrás da coluna, o caminhão betoneira e os tijolos; o prédio em obra mais ao fundo
- **ENTRA AGORA:** nada (o gancho mostra o objeto pronto)
- **OBJETOS SE MEXENDO:** o tambor da betoneira girando devagar e os operários andando no fundo (o cenário cuida); a
  coluna parada, com o ferro à mostra
- **PERSONAGEM:** em `C.personagem`, à direita da coluna, meio de frente pra câmera · começo: `surpreso` · na palavra
  "ferro": aponta pra coluna (`apontar`)
- **INTERAÇÃO:** na palavra "ferro", ele aponta pro ferro dentro da coluna e leva o olhar de quem assiste até ele
- **CÂMERA:** alvo `[coluna, personagem]`, a coluna no centro e inteira, uns 2/3 da altura · `mergulho` (desce de
  cima até a altura da coluna) · `medio` · um pouco pela esquerda (lado -25) · topo livre pra pergunta
  (`espacoCima: 0.35`)
- **EFEITOS VISUAIS:** a pergunta da capa no topo (o motor põe) · o concreto meio transparente, deixando ver o ferro
- **SONS:** só a voz (a pergunta entra direto, sem efeito)

#### 2 · plano `coluna` · ~6 s
> "Se você precisa de uma coluna que segure um prédio, enche uma fôrma de concreto e espera secar."

- **NA TELA:** a sapata (a base cinza) no centro; o concreto subindo dela; o personagem chegando pela direita; a
  betoneira atrás
- **MOSTRA:** `["concreto", "personagem"]`
- **CENÁRIO:** atrás da sapata, o caminhão betoneira girando o tambor (é de onde sai o concreto), o carrinho de mão
  com areia e os tijolos
- **ENTRA AGORA:** o `concreto`, subindo do chão em cima da sapata (`sobe`), na palavra "concreto"
- **OBJETOS SE MEXENDO:** o concreto sobe de dentro da sapata até a altura da coluna (2,7 m), em menos de 1 segundo; o
  tambor da betoneira girando no fundo
- **PERSONAGEM:** anda de `C.entrada` até `C.personagem` (à direita da coluna) na 1ª metade, olhando a coluna · na 2ª
  metade: `pensando` (mão no queixo), esperando secar
- **INTERAÇÃO:** ele chega pra conferir o concreto e fica do lado dele, esperando secar
- **CÂMERA:** alvo `[coluna, personagem]`, a coluna no centro · `passando` (desliza de lado) · `medio` · `esquerda` ·
  altura `olho` (na frase 1: mergulho, médio, de cima)
- **EFEITOS VISUAIS:** etiqueta azul "Secando" em cima da coluna, na palavra "secar"
- **SONS:** whoosh do concreto subindo (palavra "concreto"; o `K.entraNo` põe) · o da etiqueta (o kit põe)

#### 3 · plano `racha` · ~6 s · jogo `falha`
> "Mas o concreto puro aguenta aperto e não aguenta puxão: quando o vento empurra, ele racha."

- **NA TELA:** a coluna de concreto (sem ferro) no centro, grande; o personagem à direita, na beira do quadro; o vento
  e a seta vermelha chegando pela direita; as lascas
- **MOSTRA:** `["concreto"]`
- **CENÁRIO:** atrás da coluna, a escavadeira amarela, o monte de areia e o andaime com a tela verde
- **ENTRA AGORA:** o vento e a seta, entrando pela direita (na palavra "vento"); as lascas, saltando do meio da coluna
  (na palavra "racha")
- **OBJETOS SE MEXENDO:** o vento sopra da direita pra esquerda a partir de "vento"; a coluna balança e quebra no meio
  na palavra "racha" (`K.falhar(concreto, 'quebra')`); as lascas sobem e caem em volta da base
- **PERSONAGEM:** em `C.personagem`, à direita da coluna, de frente pra câmera, olhando a coluna · começo: `duvida` ·
  na palavra "racha": `susto`
- **INTERAÇÃO:** a coluna assusta o personagem: ele acompanha ela balançar e leva o susto quando ela racha
- **CÂMERA:** alvo a `coluna`, no centro e inteira, uns 2/3 da altura · `chegando` · `perto` · `direita` · altura
  `olho` · começa com a coluna inteira e termina mais perto do meio dela (na frase 2: passando, médio, esquerda)
- **EFEITOS VISUAIS:** etiqueta vermelha "Não aguenta puxão" (palavra "vento") · ✗ vermelho em cima dela (palavra
  "racha") · as lascas · no fim, congela em preto e branco (o `jogo` faz)
- **SONS:** whoosh do vento (palavra "vento") · racha da coluna quebrando (palavra "racha"; o `K.falhar` põe) · o da
  etiqueta (o kit põe) · o congela do preto e branco (o `jogo` põe)

#### 4 · plano `gaiola` · ~5 s · jogo `conserta` (⏪)
> "Então você põe dentro uma gaiola de vergalhões de aço, amarrados com arame."

- **NA TELA:** a sapata vazia no centro (o ⏪ voltou pra antes do concreto); a gaiola de ferro caindo nela; o
  personagem embaixo, à direita
- **MOSTRA:** `["gaiola", "personagem"]`
- **CENÁRIO:** atrás, a escavadeira amarela, o monte de areia e os operários com o carrinho de mão
- **ENTRA AGORA:** a `gaiola`, caindo do alto (`cai`, de uns 5 m) e quicando na sapata, na palavra "gaiola", com
  poeira
- **OBJETOS SE MEXENDO:** a cena volta no tempo (⏪) até antes do concreto; a gaiola cai, bate na sapata e quica uma
  vez; a poeira sobe em volta da base
- **PERSONAGEM:** em `C.personagem`, à direita da sapata · depois do ⏪: `surpreso` · na palavra "gaiola": `ideia`
  (aponta pra cima, pulinho)
- **INTERAÇÃO:** a gaiola cai bem do lado dele, e ele tem a ideia na hora
- **CÂMERA:** alvo `[gaiola, personagem]`, a gaiola no centro e inteira · `subindo` · `medio` · `direita` (com `B.q`,
  o tempo depois do ⏪) (na frase 3: chegando, perto, só a coluna)
- **EFEITOS VISUAIS:** o ⏪ do jogo (o `jogo` faz) · etiqueta verde "Aço por dentro" logo depois da palavra "gaiola" ·
  a poeira
- **SONS:** rebobina do ⏪ (o `jogo` põe) · whoosh e baque da gaiola caindo (o `K.entraNo` põe) · o da etiqueta (o kit
  põe)

#### 5 · plano `armadura_rotulo` · ~1 s
> "Essa é a *armadura*."

- **NA TELA:** a gaiola de ferro amarela e brilhando, ocupando a tela de cima a baixo; o rótulo "Armadura" no topo
- **MOSTRA:** `["gaiola"]`
- **CENÁRIO:** o andaime com a tela verde e os operários lá atrás (a câmera está perto e de cima)
- **ENTRA AGORA:** nada
- **OBJETOS SE MEXENDO:** a gaiola brilha amarelo (`K.brilhar`) enquanto a câmera gira em volta dela
- **PERSONAGEM:** em `C.personagem`, `mostrando` a gaiola (no close ele sai do quadro, e tudo bem: a frase é curta)
- **INTERAÇÃO:** nenhuma na tela (ele está fora do quadro)
- **CÂMERA:** alvo a `gaiola`, no centro, ocupando a tela de cima a baixo · `girando` · `perto` · de cima (altura 25,
  ângulo 40) · topo livre pro rótulo (na frase 4: subindo, médio)
- **EFEITOS VISUAIS:** o brilho amarelo na gaiola · rótulo amarelo "Armadura" no topo
- **SONS:** o do rótulo (o kit põe)

#### 6 · plano `ferrugem` · ~4 s · jogo `falha`
> "Mas o ferro sozinho, na chuva, enferruja e fica fraco."

- **NA TELA:** a gaiola de ferro sozinha na sapata, no centro; a chuva caindo; o personagem à direita, embaixo, molhado
- **MOSTRA:** `["gaiola", "personagem"]`
- **CENÁRIO:** o canteiro debaixo de chuva; atrás, o caminhão betoneira, os tijolos e os sacos de cimento
- **ENTRA AGORA:** a chuva, desde o começo da frase
- **OBJETOS SE MEXENDO:** a chuva cai a frase toda; o ferro vai escurecendo, enferrujando (`K.falhar(gaiola,
  'apaga')`, 1,2 s), a partir da palavra "enferruja"
- **PERSONAGEM:** perto da gaiola, à direita · começo: `duvida`, olhando a chuva · na palavra "enferruja": `triste`
- **INTERAÇÃO:** a chuva molha o ferro e o personagem; ele vê o ferro escurecer e fica triste
- **CÂMERA:** alvo `[gaiola, personagem]`, a gaiola no centro · `descendo` · `medio` · `esquerda` · do `alto` (na frase
  5: girando, perto, de cima)
- **EFEITOS VISUAIS:** a chuva · etiqueta vermelha "Enferruja" e ✗ vermelho em cima dela (palavra "enferruja") · no
  fim, congela em preto e branco (o `jogo` faz)
- **SONS:** a água da chuva, baixinho, a frase toda · desliga do ferro apagando (palavra "enferruja"; o `K.falhar` põe)
  · o da etiqueta (o kit põe) · o congela (o `jogo` põe)

#### 7 · plano `cobre` · ~4 s · jogo `corrige`
> "Então o concreto envolve o ferro inteiro e protege ele da água e do ar."

- **NA TELA:** a coluna no centro, com o concreto crescendo em volta da gaiola (meio transparente, dá pra ver o ferro
  lá dentro); o personagem à direita
- **MOSTRA:** `["concreto", "personagem"]`
- **CENÁRIO:** o canteiro de volta ao normal, sem chuva; atrás, o andaime com a tela verde
- **ENTRA AGORA:** o `concreto`, crescendo em volta do ferro (`cresce`), na palavra "concreto"
- **OBJETOS SE MEXENDO:** a cena volta a ter cor (o `jogo` corrige); o concreto cresce de dentro pra fora até cobrir a
  gaiola, em 0,8 s, a partir da palavra "concreto"
- **PERSONAGEM:** em `C.personagem`, à direita · começo: `segurando` · quando o concreto fecha: `vitoria`
- **INTERAÇÃO:** ele segura a coluna enquanto o concreto cresce e comemora quando ela fecha
- **CÂMERA:** alvo `[coluna, personagem]`, a coluna no centro · `subindo` · `medio` · `frente` · altura `olho` (na
  frase 6: descendo, do alto, esquerda)
- **EFEITOS VISUAIS:** etiqueta verde "Protegido" quando o concreto fecha · ✓ verde do lado
- **SONS:** brilho do concreto crescendo (palavra "concreto"; o `K.entrar` põe) · o da etiqueta (o kit põe)

#### 8 · plano `concreto_rotulo` · ~2 s
> "Esse é o *concreto armado*."

- **NA TELA:** a coluna inteira no centro, amarela e brilhando, com os ferros aparecendo na ponta de cima; o rótulo
  "Concreto armado" no topo
- **MOSTRA:** `["coluna"]`
- **CENÁRIO:** o andaime e o prédio em obra atrás
- **ENTRA AGORA:** nada
- **OBJETOS SE MEXENDO:** a coluna brilha (`K.brilhar`) enquanto a câmera gira em volta dela, pro outro lado
- **PERSONAGEM:** em `C.personagem`, `mostrando` a coluna (só a mão aparece, na beira do quadro)
- **INTERAÇÃO:** ele mostra a coluna pra quem assiste
- **CÂMERA:** alvo a `coluna`, no centro, ocupando quase a altura toda · `girando` pro outro lado (`sentido: -1`) ·
  `medio` · do `alto` (ângulo 30) (na frase 7: subindo, de frente, altura olho)
- **EFEITOS VISUAIS:** o brilho amarelo na coluna · rótulo amarelo "Concreto armado" no topo
- **SONS:** o do rótulo (o kit põe)

#### 9 · plano `obra` · ~4 s
> "É por isso que numa obra você vê ferro saindo do topo das colunas."

- **NA TELA:** o prédio em obra do cenário no centro, com os ferros saindo do topo das colunas; o guindaste por cima;
  o personagem pequeno embaixo, apontando
- **MOSTRA:** `["predio", "personagem"]`
- **CENÁRIO:** a vida real é o assunto: o prédio em obra com o andaime e a tela verde, o guindaste com a carga
  pendurada, os cones e os operários embaixo
- **ENTRA AGORA:** nada (a câmera revela o fundo do cenário)
- **OBJETOS SE MEXENDO:** o guindaste gira com a carga pendurada; os operários andam (o cenário cuida)
- **PERSONAGEM:** em `C.personagem`, virado pra obra (`C.lugares.laje`) · começo: `surpreso` · na palavra "ferro":
  `mostrando` e aponta pro alto da obra
- **INTERAÇÃO:** na palavra "ferro", ele aponta pros ferros no topo do prédio
- **CÂMERA:** alvo `[personagem, ponto na frente do alto da obra]`, o prédio no centro · `revelando` (sobe do
  personagem até o topo da obra) · `medio` · um pouco pela direita (lado 20) · de `baixo` (na frase 8: girando, médio,
  do alto)
- **EFEITOS VISUAIS:** etiqueta laranja "Ferro esperando" na frente do alto da obra (palavra "ferro")
- **SONS:** o da etiqueta (o kit põe)

#### 10 · plano `por_fora` · ~2 s
> "Por fora, é só uma coluna cinza."

- **NA TELA:** a coluna cinza, fechada, no centro; o personagem à direita; o canteiro inteiro em volta
- **MOSTRA:** `["coluna", "personagem"]`
- **CENÁRIO:** o canteiro todo aparece: a betoneira, o carrinho de mão com areia, os tijolos e o prédio ao fundo
- **ENTRA AGORA:** nada
- **OBJETOS SE MEXENDO:** a betoneira girando no fundo; a câmera se afastando é o movimento principal
- **PERSONAGEM:** dá dois passos pra trás na 1ª metade, olhando a coluna · depois: `mostrando` a coluna
- **INTERAÇÃO:** ele se afasta pra ver a coluna inteira e mostra ela: "só uma coluna cinza"
- **CÂMERA:** alvo `[coluna, personagem]`, a coluna no centro, ficando menor · `afastando` · `aberto` · `esquerda` ·
  um pouco do alto (15) (na frase 9: revelando, médio, de baixo, na obra)
- **EFEITOS VISUAIS:** nenhum texto (o vídeo respira antes do fim)
- **SONS:** whoosh da câmera se afastando, no começo

#### 11 · plano `por_dentro` · ~5 s
> "Por dentro, é aço que aguenta o puxão e concreto que aguenta o aperto."

- **NA TELA:** a coluna no centro; o concreto (meio transparente) subindo e indo pro lado; a gaiola de ferro ficando no
  lugar; as duas etiquetas
- **MOSTRA:** `["concreto", "gaiola"]`
- **CENÁRIO:** o andaime e o prédio atrás, a areia no chão
- **ENTRA AGORA:** nada (as peças se separam)
- **OBJETOS SE MEXENDO:** na palavra "aço", o concreto sobe 1,2 m e vai 1,1 m pra esquerda em 0,8 s, deixando a gaiola
  à mostra; a gaiola fica parada na sapata
- **PERSONAGEM:** perto da coluna, à direita (sai do quadro quando a câmera gira) · começo: `surpreso` · na palavra
  "concreto": `ideia`
- **INTERAÇÃO:** as peças se abrem na frente dele, e cada uma ganha o seu trabalho escrito do lado
- **CÂMERA:** alvo `[coluna, ponto do concreto lá em cima]`, as duas peças no quadro · `girando` · `medio` · um pouco
  do alto (12, ângulo 35) (na frase 10: afastando, aberto)
- **EFEITOS VISUAIS:** etiqueta azul "Aço: aguenta o puxão" na gaiola (palavra "aço") · etiqueta azul "Concreto:
  aguenta o aperto" no concreto (palavra "concreto")
- **SONS:** whoosh do concreto saindo (palavra "aço") · o das etiquetas (o kit põe)

#### 12 · plano `segue` · ~2 s
> "E segue o canal pra ver o próximo."

- **NA TELA:** o cartão de seguir no topo; a coluna no meio; o personagem inteiro embaixo, à direita, apontando pro
  cartão
- **MOSTRA:** `["personagem"]`
- **CENÁRIO:** o prédio em obra e o andaime atrás
- **ENTRA AGORA:** o cartão de seguir (palavra "segue")
- **OBJETOS SE MEXENDO:** o botão "+ Seguir" é apertado e vira "Seguindo"
- **PERSONAGEM:** em `C.personagem`, feliz, apontando pro cartão
- **INTERAÇÃO:** ele aponta pro botão de seguir, convidando quem assiste
- **CÂMERA:** alvo `[coluna, personagem]` · `parado` · `aberto` (com o topo livre, o médio corta o personagem) ·
  `espacoCima: 0.45`
- **EFEITOS VISUAIS:** o cartão de seguir, com o @ e o botão
- **SONS:** brilho do cartão entrando (palavra "segue") · clique do botão

**Cauda (`cartao`, 1,6 s):** o cartão fica e o personagem acena (`chamando`), com a mesma câmera; toca o som `final`.

## Em palavras simples (o que vai pra pessoa aprovar)

1. A coluna pronta no meio da obra, com o ferro aparecendo por dentro. / Ele aponta pro ferro, surpreso; a câmera desce
   do alto até a coluna.
2. Ele chega andando e o concreto sobe do chão, com a betoneira girando atrás. / Ele espera secar, com a mão no
   queixo; a câmera passa de lado.
3. O vento empurra, a coluna balança e racha no meio, soltando lascas. / Ele leva um susto; a câmera chega pertinho.
4. ⏪ Volta no tempo: a gaiola de ferro cai do céu na base e levanta poeira. / Ele tem a ideia; a câmera sobe.
5. A gaiola brilha amarela, de cima a baixo na tela: "Armadura". / A câmera gira em volta dela.
6. Chove no ferro sem proteção, e ele escurece de ferrugem. / Ele fica triste, molhado; a câmera desce do alto.
7. O concreto cresce em volta do ferro e fecha a coluna. / Ele segura e comemora; a câmera sobe de frente.
8. A coluna inteira brilha: "Concreto armado". / A câmera gira em volta dela, do alto.
9. A câmera sobe até o prédio em obra, com os ferros saindo do topo e o guindaste girando. / Ele aponta pros ferros.
10. Ele dá dois passos pra trás e mostra a coluna cinza no meio da obra. / A câmera se afasta e mostra o canteiro todo.
11. O concreto sobe e sai de lado, e a gaiola fica: cada um ganha o seu trabalho escrito. / A câmera gira em volta.
12. O cartão de seguir aparece no topo e o botão vira "Seguindo". / Ele aponta pro cartão; a câmera fica parada.
