# Índice do kit (`motor/kit.js`, `motor/bichos.js` e `motor/cenarios.js`)

> Gerado a partir dos comentários do motor. Cada item: assinatura, linha no arquivo e o que faz.
> Pra detalhes, abrir o arquivo na linha. O `cena.js` dos exemplos mostra o uso. Os ajudantes de cada frase (câmera,
> ator, peças) estão em "Direção"; o jeito de usar, em `referencias/COMO-FAZER-O-VIDEO.md`. Os bichos e os cenários
> prontos (`K.cenario`) estão no fim, e explicados com fotos em `referencias/cenarios.md`.
- `K.W` (linha 29)
- `K.cores` (linha 31)
- `K.rand(seed)` (linha 44): Aleatório com semente: o vídeo sai igual toda vez que renderiza
- `K.mat(color, opts = {})` (linha 55): Estilo redondo (roteiro.estilo = 'redondo', ligado em K.preparar): sombreamento liso no lugar do facetado
- `K.malha(geo, mat, sombra = true)` (linha 58)
- `K.clamp(x, a = 0, b = 1)` (linha 117): Curvas de tempo
- `K.lerp(a, b, x)` (linha 118)
- `K.faixa(p, a, b)` (linha 119)
- `K.suave(x)` (linha 120)
- `K.suavissimo(x)` (linha 121)
- `K.saiVolta(x)` (linha 122)
- `K.quica(x)` (linha 123)
- `K.QUICA_IMPACTO` (linha 130)
- `K.pulso(x)` (linha 131)
- `K.lerp3(a, b, x)` (linha 132)
- `K.queda(tempo, altura = 8, dur = 0.7)` (linha 135): Peça caindo do céu e quicando: deslocamento em y (altura → 0)
- `K.componente(c)` (linha 139)
- `K.vivo(fn)` (linha 144)
- `K.degrade` (linha 158): Mancha redonda em degradê, pros cenários prontos (brilho de luz, raio de sol, bolha)
- `K.manchaSombra(raio = 0.5, forca = 0.45)` (linha 162)

## Céu, hora do dia e luz

- `K.ceus` (linha 253)
- `K.ceu(a, b, x = 0)` (linha 309): Mistura duas predefinições de céu: K.ceu('dia', 'tarde', 0.5)
- `K.sombraEm` (linha 330): Centro da área com sombra (a caixa de sombra do sol tem 32 x 32)
- `K.focoSombra(x, z)` (linha 331)
- `K.caixaSombra(meia = 16)` (linha 338): Tamanho da caixa de sombra (meia largura; o quadro volta aos 16 sozinho). Palco grande visto do alto pede mais
- `K.init()` (linha 345)
- `K.mirar(pos, alvo, cam = K.camera)` (linha 389)
- `K.plano(de, ate, p, cam = K.camera)` (linha 396): Plano de câmera com movimento leve do começo ao fim do trecho. de/ate: { pos, alvo, fov? }
- `K.tremer(dt, forca = 1, cam = K.camera)` (linha 406): Tremida de impacto: dt = tempo desde o impacto
- `K.neblina(perto = 45, longe = 140, alcance = 400)` (linha 415): Neblina e alcance da câmera (o quadro volta ao padrão sozinho). Palcos grandes vistos do alto pedem mais
- `K.dividir()` (linha 422): Tela dividida: posicionar K.camCima e K.camBaixo e chamar K.dividir() no quadro
- `K.tela(ponto, op = {})` (linha 426)

## Mundo enfeitado (estilo redondo)

- `K.enfeitar(g, seed = 7, op = {})` (linha 597): Enfeites do mundo vivo (flores, arbustos, pedrinhas, borboletas, pássaros, pólen) dentro do grupo g, longe do centro. Pros cenários prontos: op como no enfeitarMundo (quantos de cada)
- `K.texGrao(repete = 100)` (linha 602)
- `K.mundo(seed = 7)` (linha 629)
- `K.arvore(x, z, s, pinheiro, r)` (linha 681)
- `K.nuvem(x, y, z, s, r)` (linha 723)
- `K.casa()` (linha 739): Casa padrão: 6 x 3 x 5, frente virada pra +z, cumeeira no eixo x (topo ~ y 4.8). g.userData: { paredes, placas: [frente, fundo], matParede }

## Objetos do dia a dia

- `K.cano(pontos, raio = 0.06, cor = K.cores.cano)` (linha 781): Cano por uma lista de pontos, com cotovelos. c.em(x) faz o cano crescer de 0 a 1 ao longo do caminho.
- `K.placa(texto, op = {})` (linha 843): Placa ou bilhete com texto (textura desenhada em canvas). Plano virado pra +z.
- `K.fluxo(cano, n = 40, cor = K.cores.aguaClara, tam = 1)` (linha 863): Água correndo dentro de um cano (pontinhos claros seguindo o caminho). Deixar o cano translúcido.
- `K.jato(raio = 0.045, cor = K.cores.aguaClara)` (linha 888): Jato caindo de um ponto (fio de água). em(origem, comprimento, t, grossura)
- `K.pingos(seed = 2, n = 6, cor = K.cores.aguaClara)` (linha 907): Gotas pingando de um ponto até o chão. em(origem, t, ritmo (gotas/s), queda (m))
- `K.torneira(pos, comPoste = true)` (linha 933): Torneira de parede ou poste. t.bico = ponto de saída da água (coordenadas locais + posição)
- `K.registro()` (linha 955): Registro (válvula com alavanca vermelha) pra pôr num cano vertical
- `K.balde(cor = 0x3a8fe0)` (linha 970)
- `K.regador(cor = 0x3fae5a)` (linha 986)
- `K.flor(cor = 0xff5a8a)` (linha 1005): Flor no vaso. f.em(vida): 0 = murcha, 1 = viva
- `K.tambor(cor = 0x2a6fd6)` (linha 1049): Tambor (bombona azul)
- `K.carro(cor = 0xe8352b)` (linha 1067): Carro low-poly (frente pra +x)
- `K.predio(andares = 20, larg = 4, prof = 4, cor = 0xd9d2c5, pe = 0.9)` (linha 1096): Prédio com janelas. p.altura = andares * pe; frente pra +z
- `K.mosquito()` (linha 1127)
- `K.folha(cor = 0x6cb548)` (linha 1164)

## Tecnologia, mar e céu

- `K.noMundo(obj, local)` (linha 1179)
- `K.caminho(pontos)` (linha 1187): Caminho por pontos, sem malha (pra coisas que andam sobre fios e trilhas). c.ponto(f), c.total
- `K.halo(cor = 0xfff2a0, tam = 1)` (linha 1210)
- `K.telaCanvas` (linha 1249)
- `K.computador(op = {})` (linha 1252): Computador (com mesa, se op.mesa !== false). Tela virada pra +z. c.tela.desenhar(...), c.cabo = ponto local de onde sai o fio
- `K.celular()` (linha 1286): Celular (tela pra +z)
- `K.navio(op = {})` (linha 1297): Navio (proa pra +x, linha d'água em y = 0). op: { cor, corCasco, comp, larg, bobina }
- `K.peixe(cor = 0xf7941d, tam = 1)` (linha 1357): Peixe (frente pra +x). em(pos, t, rumo)
- `K.tubarao()` (linha 1395): Tubarão (frente pra +x). em(pos, t, rumo, boca 0..1)
- `K.coqueiro(pos, s = 1, seed = 5)` (linha 1469): Coqueiro inclinado. Base em pos
- `K.satelite()` (linha 1508): Satélite com painéis solares
- `K.bandeira(desenhar, op = {})` (linha 1527): Bandeira no mastro, desenhada em canvas: desenhar(c2, w, h). b.em(t) faz ela tremular
- `K.ondas(cor = 0xffffff, n = 4, abertura = 0.6)` (linha 1559): Ondas saindo de um ponto (grito, Wi-Fi, sinal), viradas pra +x do grupo. em(origem, rumo, t, alcance, ritmo)
- `K.bits(caminho, n = 30, seed = 21, op = {})` (linha 1594): Bits correndo num caminho: bolinhas acesas (1) e apagadas (0), ou só luz (op.soLuz). em(t, vel, ate, desde, forca): forca(f) de 0 a 1 encolhe e apaga cada bit pela posição (sinal enfraquecendo)

## Energia, fogo e fumaça

- `K.bicicleta(cor = 0x2f7fe0)` (linha 1639): Bicicleta (frente pra +z). b.selim = onde o quadril do boneco senta; b.em(t, vel) gira rodas e pedais
- `K.fogo(seed = 14, n = 9)` (linha 1696): Fogo: chamas em cone que tremem. em(pos, t, escala, força 0 a 1)
- `K.fumaca(seed = 15, cor = 0x2a2a2a, n = 18)` (linha 1734): Fumaça ou vapor subindo de um ponto. em(origem, t, op): op = { altura, escala, vento: [x, z], ritmo, forca }

## Espaço

- `K.ligarPontos(m, a, b, raio)` (linha 1770)
- `K.foguete()` (linha 1784): Foguete de 3 estágios (estilo Saturno V), base em y = 0 e ~14,4 de altura. Cada peça é um grupo em f.partes (e1, e2, e3, sla, sm, cm, torre), posto na altura f.base[nome]; a cena move ou solta as peças e chama f.reset() pra empilhar de novo. f.corte(true) tira a metade da frente do casco e mostra os tanques (laranja = combustível, azul = oxigênio líquido) e o módulo lunar guardado no sla. f.nivel(nome, k): líquido dos tanques (1 = cheio). f.bocal[nome]: saída do jato, no espaço da peça
- `K.jatoFoguete(seed = 31)` (linha 1934): Jato de foguete: chama em cone apontando pra −y do grupo, tremendo. em(pos, t, op): op = { comp, larg, forca, quat }
- `K.planeta(tipo = 'terra', raio = 1, seed = 3)` (linha 1969): Terra ou Lua low-poly, com cor por face (sem neblina: dá pra pôr bem longe, no céu). tipo: 'terra' | 'lua'
- `K.moduloLunar()` (linha 2004): Módulo lunar: descida dourada com 4 pernas e subida prateada (a cabine) em cima. Pé das pernas em y = 0. m.amortecer(k): as pernas encolhem no pouso (0 a 1). m.bocalDescida e m.bocalSubida: saída dos jatos (local de m.g / m.subida)
- `K.capsula()` (linha 2072): Cápsula de volta (cone), base em y = 0. c.escudo: a camada marrom embaixo (escudo térmico), c.matCorpo pra esquentar
- `K.paraquedas(cor = 0xf39a1e, cor2 = 0xffffff, alt = 2.6, raio = 1.5)` (linha 2092): Paraquedas: cúpula em faixas e cordas até o ponto de baixo (y = 0 do grupo). p.abrir(k, t, murcho)
- `K.balao(cor = 0xe8352b)` (linha 2130): Balão de aniversário com cordinha (bico pra baixo). Origem no nó

## Boneco

- `K.bonecos` (linha 2148): Todos os personagens da cena: o kit volta cada um ao neutro no começo do quadro (b.reset) e a revisão confere
- `K.boneco(op = {})` (linha 2157): op.tipo: 'menino' (padrão, mascote) | 'menina' (vestido vermelho) | 'doutor' (médico velhinho: jaleco, óculos, bigode branco e estetoscópio) | 'operario' (adulto de obra: camiseta laranja, colete refletivo, calça jeans, bota, barba e o capacete sempre na cabeça; op.barba: false tira a barba). Cores próprias em op.cores, como nos outros op.roupa: 'moletom' = roupa do logo (moletom amarelo com capuz, mochila, calça azul-noite, tênis branco)
  - boneco: `b.humor(h)` (linha 2479): humor: 'feliz' | 'triste' | 'surpreso' | 'bravo' | 'nojo' | 'assustado'
  - boneco: `b.pose(esq, dir)` (linha 2493): pose: braços como { x, z, c } por lado (-1 = esquerda da tela quando de frente, 1 = direita)
  - boneco: `b.pernasEm(e, d)` (linha 2499)
  - boneco: `b.parado()` (linha 2500)
  - boneco: `b.reset(t = 0)` (linha 2503): Volta tudo ao neutro e pisca de vez em quando. Chamar no começo de cada quadro.
  - boneco: `b.capacete(cor = 0xf5c518)` (linha 2530)
  - boneco: `b.capaceteEspacial()` (linha 2549)
  - boneco: `b.suar(t)` (linha 2564)
  - boneco: `b.andar(t, vel = 1)` (linha 2588)
  - boneco: `b.correr(t, vel = 1)` (linha 2595)
  - boneco: `b.pular(x, altura = 0.6)` (linha 2608): x de 0 a 1 ao longo do pulo; devolve a altura
  - boneco: `b.cair(x)` (linha 2623): Cai de costas: x de 0 a 1
  - boneco: `b.acenar(t, lado = 1)` (linha 2631)
  - boneco: `b.comemorar(t)` (linha 2636)
  - boneco: `b.segurar()` (linha 2642): Segurando algo com as duas mãos na frente do corpo
  - boneco: `b.apontar(alto = 0.5)` (linha 2645): Apontando com a mão direita (pra cima: alto = 1)
  - boneco: `b.pensar()` (linha 2647): Mão no queixo, pensando
  - boneco: `b.mao(i = 1)` (linha 2650)
  - boneco: `b.colocar(pos, olhar)` (linha 2667): Põe o personagem num lugar, de frente pra um ponto [x, y, z] (ou num ângulo em radianos). Sem olhar: de frente pro +z, o lado de onde a câmera 'frente' olha
  - boneco: `b.olharPara(ponto)` (linha 2673)
  - boneco: `b.irPara(de, ate, x, t, op = {})` (linha 2679): Anda (ou corre, op.correr) de um lugar até outro: x de 0 a 1 no caminho. Vira pro lado que anda e, chegando, olha pra op.olhar. Devolve onde ele está
  - boneco: `b.reagir(tipo, t = 0)` (linha 2693): Reações prontas (corpo + cara), pra cada frase ter uma atuação: t = segundos desde que a reação começou. 'susto' 'surpreso' 'ideia' 'vitoria' 'cansado' 'duvida' 'bravo' 'triste' 'mostrando' 'chamando' 'empurrando' 'segurando' 'erguendo' 'pensando'; outro nome vira só a cara (b.humor). A pose segurada também se mexe (o corpo balança, a cabeça acompanha e as mãos gesticulam de leve)
  - boneco: `b.falar(t)` (linha 2768): Falando com a câmera: a boca abre e fecha no ritmo de sílaba e a cabeça acompanha (chamar depois do humor)

## Efeitos de cena

- `K.festa(centro, seed = 3)` (linha 2792): Confete e corações que caem a partir de t0 em volta de um ponto
- `K.poeira(seed = 1, cor = 0xd8ccb4, n = 26)` (linha 2843)
- `K.lascas(seed = 4, cor = 0xc8442f, n = 16)` (linha 2878): Lascas voando (madeira, telha, concreto). em(centro, tempo, chão)
- `K.respingo(seed = 6, cor = K.cores.aguaClara, n = 22)` (linha 2906): Respingo: gotas pra cima + anel na superfície. em(centro, tempo, força)
- `K.esguicho(seed = 8, n = 90, cor = K.cores.aguaClara)` (linha 2941): Esguicho contínuo (cano furado, mangueira). em(origem, direção, velocidade, t, chão)
- `K.chuva(seed = 12, n = 700)` (linha 2972): Chuva em volta de um ponto. em(centro, t, intensidade 0 a 1, abrigo). abrigo: { pos: [x, y, z], raio } (o guarda-chuva, o telhado): embaixo dele não chove
- `K.vento(seed = 13, n = 26)` (linha 3001): Vento: traços brancos passando. em(centro, t, intensidade, direção x)
- `K.destaque(obj)` (linha 3029): Peça nova em amarelo translúcido, como fantasma brilhando. em(tempo desde a apresentação, duração)
- `K.seta(cor = K.cores.vermelho, esp = 1)` (linha 3055): Seta de força 3D. em(origem, direção, comprimento, tempo desde que apareceu)

## Texto e indicadores na tela

- `K.rotulo(texto)` (linha 3099): Nome da peça: amarelo, grande, caixa alta. em(ponto 3D | {tela:[x,y]}, tempo, op)
- `K.etiqueta(texto, cor = 'azul')` (linha 3117): Etiqueta de explicação: pílula branca com ponto colorido (vermelho = problema, verde = funciona)
- `K.marca(tipo = 'certo')` (linha 3134): ✓ verde ou ✗ vermelho. tipo: 'certo' | 'errado'
- `K.contador()` (linha 3151): Cartão branco com número (contador). em(texto, ponto, tempo, legenda pequena)
- `K.numero(n)` (linha 3166)
- `K.medida()` (linha 3185): Linha de medida entre dois pontos 3D, com texto ao lado. em(a, b, texto, tempo)
- `K.termometro(min = 0, max = 45)` (linha 3204): Termômetro com a temperatura. em(graus, ponto, tempo)
- `K.cta(html)` (linha 3222): CTA fixo no topo da tela no fim do vídeo (aceita <em> pra destacar em amarelo)
- `K.SEGUIR_CLIQUE` (linha 3252)
- `K.cartaoSeguir(texto)` (linha 3253): Cartão de seguir, o fim padrão: cartão branco no topo com o logo (canal/logo.png; sem logo, a inicial na cor do canal), o @ (roteiro.arroba) e o botão "+ Seguir", que é apertado em K.SEGUIR_CLIQUE segundos e vira "Seguindo". em(tempo desde que entrou). A cena põe o som do aperto: K.som('clique', t0 + K.SEGUIR_CLIQUE)
- `K.mostrarLegenda(tl, t)` (linha 3443): Legenda palavra por palavra; palavra-chave (marcada com *asteriscos* no roteiro) em amarelo

## Sons

- `K.sons` (linha 3482): A cena registra cada efeito sonoro no instante em que acontece (tempo da cena). Repetir a chamada a cada quadro não duplica. O render junta tudo em K.sons e mixa no ffmpeg. dur: corta o som nesse tamanho (pra loops como água correndo)
- `K.som(nome, em, ganho = 1, dur)` (linha 3484)

## Videogame: falha, rebobina, pausa, play, avança

- `K.REBOBINA` (linha 3500): Eventos por frase no roteiro (campo "jogo"): falha     congela em preto e branco no fim da frase (congela: fração da frase, padrão 0.85) conserta  ⏪ rebobina até antes da falha (volta: quantas frases antes) e fica em ⏸ enquanto monta (rebobina: duração do ⏪ em segundos, padrão K.REBOBINA). Use pouco: 1 ou 2 por vídeo corrige   conserto sem voltar no tempo: a falha some e a cena corta direto pra montagem (mais fluido) pausa     só ⏸      play  ▶ no começo da frase      avanca  ⏩ o tempo passando
- `K.FOV` (linha 3501)
- `K.prepararJogo(tl)` (linha 3502)
- `K.estadoJogo(t)` (linha 3537)

## Direção: câmera, ator e peças (cada frase com a sua cena)

- `K.lugar(obj)` (linha 3606): Guarda o lugar da peça agora (as feitas com K.peca já guardam). Chamar no montar, com a peça já no lugar
- `K.nomear(nome, obj)` (linha 3613): Dá nome a uma peça, pro "mostra" de cada frase no roteiro.json: a revisão (--revisar) confere se o que a frase mostra aparece na tela, no quadro e num tamanho que dá pra ver. O K.pecas, o K.boneco ("personagem") e os cenários prontos (os C.objetos) já dão nome; o resto, no montar: K.nomear('lanterna', lanterna). Acento, maiúscula e espaço não contam ("Lâmpada" acha "lampada")
- `K.semNome(obj)` (linha 3622): Tira os nomes de uma peça (os figurantes dos cenários não contam como "personagem")
- `K.nomesDasPecas()` (linha 3624): Os nomes que existem na cena (a revisão mostra quando o "mostra" pede um nome que não existe)
- `K.obstaculos` (linha 3676): Caixas (THREE.Box3) que a câmera dos ajudantes não atravessa: os cenários prontos põem aqui os prédios, as paredes e as máquinas. Vazio nos vídeos sem cenário pronto
- `K.enquadrar(alvo, op = {})` (linha 3696): Câmera que enquadra o alvo no 9:16 (mira e posição). op: plano ('aberto' 'medio' 'perto' 'detalhe' ou número), lado ('frente' 'direita' 'esquerda' 'tras' 'perfil_direita' 'perfil_esquerda' ou graus; frente = olhando do +z), altura ('cima' 'alto' 'olho' 'baixo' ou graus), espacoCima / espacoBaixo (0 a 1: o assunto desce ou sobe na tela e sobra espaço pro texto), desliza (o assunto vai pro lado: -1 a 1), tam (lado da caixa quando o alvo é um ponto), fora (a câmera fica fora desse objeto, com folga de op.folga = 0,5: passe o objeto inteiro quando filmar de perto uma peça que fica dentro dele)
- `K.MOVIMENTOS` (linha 3744)
- `K.filmar(alvo, mov = 'chegando', p = 0, op = {})` (linha 3749): Câmera viva numa frase: um movimento com nome, do começo ao fim do plano (p de 0 a 1, normalmente B.p). 'chegando' (aproxima) 'afastando' 'girando' (em volta; op.sentido -1 gira pro outro lado, op.angulo em graus) 'subindo' 'descendo' 'passando' (de lado) 'parado' (quase parado, respirando) 'mergulho' (do alto até o plano) 'revelando' (do detalhe até o plano aberto). Aceita as mesmas opções do K.enquadrar. Devolve { de, ate }
- `K.ENTRADAS` (linha 3771)
- `K.entrar(obj, tipo = 'cai', tempo = 0, op = {})` (linha 3777): Peça nova entrando com movimento, som e o brilho amarelo (K.destaque). tempo: segundos desde que ela começou a entrar (negativo = ainda não apareceu). tipo: 'cai' (do céu, quicando) 'desliza' (de op.de = [x, y, z] relativo, padrão vindo da esquerda) 'encaixa' (de cima, curto, com clique) 'cresce' 'gira' 'sobe' (brota do chão) 'surge'. op: dur, altura, de, som (nome ou false), ganho, destaque (false tira o brilho). Devolve o quanto já entrou (0 a 1)
- `K.brilhar(obj, tempo = 0, dur = 1.6)` (linha 3816): A peça brilha em amarelo (o destaque do "Esse é o X"): tempo desde que começou, dur em segundos
- `K.FALHAS` (linha 3823)
- `K.falhar(obj, tipo = 'treme', tempo = 0, op = {})` (linha 3829): O problema na tela: a peça falhando. tempo: segundos desde que a falha começou. tipo: 'treme' 'tomba' (cai de lado; op.lado -1 pro outro) 'murcha' 'apaga' 'esquenta' (fica vermelha e brilha) 'congela' (fica azul) 'pisca' (falhando) 'quebra' (treme e solta lascas). op: dur, forca (0 a 1), som (nome ou false), ganho
- `K.entraNo(plano, obj, tipo = 'cai', op = {})` (linha 3873): Agenda das peças: K.entraNo('pilha', pilha, 'desliza', op) diz em que plano do roteiro.json a peça entra (chamar no montar). Antes desse plano ela não aparece (só no gancho e na capa, que mostram o objeto pronto; op.noGancho: false tira); no plano, entra com o movimento (logo no começo, depois do ⏪, ou na palavra op.palavra); depois, fica no lugar. Aceita as opções do K.entrar e op.atraso (segundos depois do começo do plano)
- `K.peca(p, pai = K.scene)` (linha 3920): Peça a partir de uma descrição (o mesmo formato das peças da cena-modelo montagem e do jeito por chat): { forma, tam, cor, pos, giro (graus), metal, brilho, transparente (0 a 1), pontos (cano), texto (placa), kit } caixa [larg, alt, prof] · cilindro [raio, alt] ou [raioCima, raioBaixo, alt] · tubo [raio, alt] (oco) funil [raioCima, raioBaixo, alt] (oco) · esfera [raio] · cone [raio, alt] · anel [raio, grossura] (deitado) cano (pontos: [[x,y,z],...], tam: [raio]) · placa (texto, tam: [larg, alt]) · kit (kit: 'carro', 'balde'...) Devolve um grupo já no lugar, dentro de pai (padrão: a cena), com o lugar guardado pros ajudantes
- `K.pecas(lista, pai = K.scene)` (linha 3954): Várias peças de uma vez: K.pecas({ tecido: {...}, haste: {...} }, pai) → { tecido: grupo, haste: grupo }

## Revisão (render --revisar)

- `K.medir(nomes)` (linha 3996): O que está na tela neste quadro: câmera, cada personagem (caixa na tela e pose) e os textos. nomes: as peças do "mostra" da frase (com mais de uma peça com o mesmo nome, como os carros, vale a que aparece melhor)
- `K.miniatura(w = 27, h = 48)` (linha 4027): Miniatura em tons de cinza do quadro (pra comparar se duas cenas estão parecidas demais)

## Quadro

- `K.render()` (linha 4040)
- `K.preparar(tl)` (linha 4080)
- `K.quando(palavra, desde = 0)` (linha 4109)
- `K.quadro(t)` (linha 4116): Um quadro completo no tempo real t
- `K.capa(titulo)` (linha 4138): Capa / thumbnail: a cena monta a composição em CENA.capa() e o kit põe a pergunta no topo, numa caixa branca. Área segura: o TikTok corta a capa em 3:4 pelo centro, então tudo que importa fica entre y 240 e 1680. (*palavra* ganha a cor do canal, \n quebra a linha)
- `K.blocos(tl)` (linha 4158): Junta frases seguidas com o mesmo plano em blocos com início e fim
- `K.blocoEm(bl, t)` (linha 4169): p: progresso no bloco (0 a 1). q e tq: progresso e tempo depois do ⏪ (o que a cena usa pra montar a peça)

# Bichos prontos (`motor/bichos.js`)

## Mosquita

- `K.CORES_AGULHAS` (bichos.js linha 18)
- `K.mosquita(op = {})` (bichos.js linha 27): Mosquita: a fêmea fofa de olhão e cílios, de frente pra +x. Asas batendo, seis pernas com joelho, antenas, a probóscide com o estojo que dobra e as 6 agulhas que saem (e abrem em leque, coloridas, pra explicar), e a barriga que enche de vermelho. op.macho: antena peluda, sem cílio. Tamanho ~1,6 do bico ao rabo. fareja (0 a 1): antenas mexendo, cheirando em(pos, t, op): op = { rumo, incl (nariz pra baixo +), giro (de lado), escala, voo (0 pousada, 1 voando), asas (0 dobradas, 1 batendo), barriga (0 a 1), dobra (estojo dobrando, 0 a 1), agulhas (quanto as agulhas passam da ponta, 0 a 1), leque (agulhas abertas e coloridas, 0 a 1), olhar ([x, y] da pupila), feliz (0 a 1: bochecha corada), pernas e bico (comprimento, 1 = normal; maior = pernilongo exagerado, como na capa do mosquito) }

## Gato

- `K.GATO_CARAS` (bichos.js linha 273)
- `K.gato(op = {})` (bichos.js linha 287): Gato: laranja rajado de barriga e meias brancas, olhão, coleira com guizo e feijõezinhos rosa embaixo das patas. O corpo é em duas metades com o pivô na cintura, e cada uma gira no seu eixo (o reflexo de endireitamento). De frente pra +x, costas pra +y. em(pos da cintura, t, op); em pé, a cintura fica a `altura` do chão (vezes a escala). op.cores troca as cores; op.rabo = false faz o gato sem rabo

## Ornitorrinco

- `K.ORNITORRINCO_CARAS` (bichos.js linha 658): Caras do ornitorrinco. lid: pálpebra (0 aberta, 1 fechada); pup: pupila; olho: tamanho do olho; sobr: [inclinação, altura] das sobrancelhas (inclinação positiva = bravo); boca: abre o bico de baixo; rosado: bochecha corada; fecha: fecha olho, ouvido e narina (o mergulho); torta: uma sobrancelha lá em cima ("que foi?"); nariz: empina o bico
- `K.ornitorrinco(op = {})` (bichos.js linha 678): Ornitorrinco de desenho (frente pra +x): marrom-chocolate de barriga clara, bico cinza mole com os sensores, olhinho com pálpebra e sobrancelha, bochecha que estufa, rabo chato de castor, patas da frente com a pele que dobra pra trás e mostra as unhas, patas de trás de leme e, no macho (op.macho), o esporão no calcanhar. op.filhote: rosinha, pelado e de olho fechado. Sem chapéu e sem azul-esverdeado: não pode lembrar o ornitorrinco de desenho mais famoso

## Cachorro

- `K.CACHORRO_CARAS` (bichos.js linha 1089): Caras do cachorro. lid: pálpebra (0 aberta, 1 fechada); pup: pupila; olho: tamanho do olho; sobr: [inclinação, altura] das sobrancelhas (inclinação positiva = de dó, o pidão); boca: abre a boca; lingua: língua de fora; orelha: [abre, pra trás]; verde: a cabeça esverdeia (enjoo)
- `K.cachorro(op = {})` (bichos.js linha 1105): Vira-lata caramelo: focinho e peito creme, orelha caída, rabo enrolado pra cima, coleira azul com medalha. O pos do em() é o chão embaixo do meio do corpo (ele mesmo sobe as patas), virado pra +x com rumo 0

## Camaleão e mosca

- `K.CAMALEAO_CORES` (bichos.js linha 1449): Cores da pele (a cena passa o nome, um número ou { de, para, k } em op.cor)
- `K.CAMALEAO_CARAS` (bichos.js linha 1455): Caras: abre (abertura do olho: 1 aberto, 0 fechado), pup (pupila), olho (tamanho da torrinha), boca, aperta (olho espremido), treme (tremedeira de força), sobr: [inclinação, altura] da sobrancelha (inclinação positiva = brava)
- `K.camaleao()` (bichos.js linha 1471): Camaleão-pantera: corpo achatado dos lados (parece folha), capacete na cabeça, crista nas costas, olhos de torrinha que giram cada um pro seu lado, língua elástica com a bolinha grudenta na ponta, pés de pegador (dois feixes de dedos) e rabo que enrola em espiral. A cor muda inteira (op.cor) por cima das escaminhas, das faixas e da listra clara. O pos do em() é o galho (ou o chão) embaixo do meio do corpo, virado pra +x com rumo 0
- `K.mosca()` (bichos.js linha 1887): Mosca de desenho: corpo escuro com reflexo verde, olhão vermelho e asas transparentes, de frente pra +x. em(pos, t, op): rumo, escala, voa (0 pousada, 1 voando: asas batendo e sobe-e-desce), dorme (asas baixas)

## Efeitos: estrelinhas, coraçõezinhos e fedor

- `K.estrelinhas(n = 5)` (bichos.js linha 1938): Estrelinhas da tontura: rodam em volta da cabeça. em(centro, t, op = { raio, forca })
- `K.coracoes(seed = 23, n = 9)` (bichos.js linha 1970): Coraçõezinhos subindo de um ponto (alguém apaixonado). em(origem, t, forca)
- `K.fedor(seed = 17, n = 4, nMosq = 4)` (bichos.js linha 2007): Cheiro ruim visível: linhas onduladas verdes subindo e mosquitinhos rodando em volta (pé, queijo, lixo). em(pos, t, op): op = { forca, escala, mosquitos (quantos rodam) }
- `K.BICHOS` (bichos.js linha 2069): Os bichos deste arquivo (o nome de cada função)

# Cenários prontos e modelos 3D (`motor/cenarios.js`)

## Modelos 3D prontos (motor/modelos/*.js)

- `K.MODELOS` (cenarios.js linha 303): Os nomes das peças prontas carregadas (pra K.modelo)
- `K.modelo(nome, op = {})` (cenarios.js linha 307): Peça pronta de um pacote de modelos (motor/modelos/, lista em K.MODELOS): K.modelo('kenney-cidade/building-small-a', { escala: 5, pos: [x, y, z], giro: graus em y, pai }). As peças do kenney-cidade ocupam 1 x 1 no chão: escala 5 deixa a casa do tamanho certo perto do personagem. Devolve a malha, já na cena (ou dentro de op.pai)

## Montagem do cenário

- `K.CENARIOS` (cenarios.js linha 2184): Os nomes dos cenários prontos (pra K.cenario)
- `K.cenario(nome, op = {})` (cenarios.js linha 2186): Cenário pronto: o lugar inteiro com um nome só (explicação no topo deste arquivo). Chamar uma vez, no montar
