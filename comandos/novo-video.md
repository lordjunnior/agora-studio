# Novo vídeo

> No Claude Code: `/novo-video <tema>`. Em outra IA que trabalha na pasta: "faz um vídeo sobre <tema>".

Do tema ao vídeo pronto pra postar. A pessoa não escreve código: a IA escreve o `roteiro.json` e o `cena.js` do vídeo,
seguindo **`referencias/COMO-FAZER-O-VIDEO.md`** (o método completo, passo a passo), um modelo pronto pra copiar
(`referencias/modelo-construcao/` ou `referencias/modelo-natureza/`, com cenário pronto, ou o guarda-chuva de
`referencias/modelo-de-cena/`), um dos **cenários prontos** de `referencias/cenarios.md` e as ideias de
`referencias/cardapio-de-cenas.md`.

A IA conduz e a pessoa opina: o roteiro, as cenas e o vídeo pronto terminam com perguntas, e cada resposta (pedido,
mudança, nota, "tá ótimo") vai na hora pro `canal/historico.md`, como manda o `AGENTS.md`.

## Antes

**Conversa certa (regra número 3 do `AGENTS.md`):** se nesta conversa você fez a entrevista do canal, ou já fez um
vídeo inteiro, o vídeo novo fica melhor numa conversa nova: anotar o tema em `canal/pauta.md` e passar a mensagem de
passagem (passo 6 de `comandos/instalar.md`). Se a pessoa preferir seguir aqui, seguir. Numa conversa que acabou de
começar, nunca pedir outra: é aqui que o vídeo é feito.

Rodar `npm run conferir`. Se não der **PRONTO**, parar aqui e seguir `comandos/instalar.md` (só o que falta); depois
voltar pro tema que a pessoa pediu.

Ler `canal/canal.md`, `canal/identidade.md`, `canal/aprendizados.md`, `metodo/formula-roteiro.md`,
`referencias/COMO-FAZER-O-VIDEO.md` (inteiro), `referencias/cardapio-de-cenas.md` e a pasta
`referencias/modelo-construcao/` inteira (o `roteiro.md` com a ficha de cena completa, e o `roteiro.json` e o `cena.js`
feitos a partir dela). Pra saber o que o motor já tem pronto, `referencias/kit-indice.md`.
Do canal, aplicar em todo vídeo: o nicho e o estilo do vídeo (tom da narração), o **mecanismo único** (no gancho e no
fechamento), o **estilo da capa** (no `P.capa` e no campo `capa`), a voz e o personagem de `canal/identidade.md`.
De `canal/aprendizados.md`, aplicar o gosto da pessoa (vale mais que o padrão do guia), as **cenas que funcionaram**
(reaproveitar o jeito, sem repetir igual) e as lições técnicas (pra não repetir erro de vídeo anterior).
Se o usuário não deu tema, sugerir 3 da `canal/pauta.md` ou que passem no teste de tema da fórmula, cada um com a
pergunta do gancho, e dizer qual você escolheria e por quê (puxando pro que já deu resultado, se os aprendizados
disserem).

Se a voz do canal for a ElevenLabs, olhar no relatório do conferir quanto sobra de crédito: 1 minuto de vídeo gasta uns
1.000 caracteres. Não dá pro vídeo? Avisar já no começo, com as saídas de "Se algo der errado" (abaixo).

## 1. Roteiro e ficha de cena (`videos/<tema>/roteiro.md`)

Pasta: `videos/<tema-curto-sem-acento-com-hifen>/` (ex: `videos/guarda-chuva/`). Escrever como manda o passo 1 do
guia: fórmula, tamanho (primeiro vídeo ~60 s; depois, mais de 1 minuto), ciência conferida e a **ficha de cena
completa**, no formato de `referencias/modelo-construcao/roteiro.md` (abrir e copiar o formato):
1. **O cenário** (um dos prontos, pelo tema: tabela "Qual cenário pra cada tema" de `referencias/cenarios.md`; na
   dúvida, o padrão do canal em `canal/identidade.md`), a hora e por quê, com as peças dele que vão entrar nas frases (a
   betoneira girando, o carro passando, a geladeira): é o que deixa o vídeo caprichado
2. **Os objetos do vídeo:** a tabela com tudo o que a câmera vai mostrar, cada um com o nome que vai no código, do que
   é feito, o tamanho e a cor, onde fica e em que frase aparece
3. **O teste dos substantivos:** toda coisa que a narração cita, com a frase em que aparece. Coisa importante que não
   aparece em lugar nenhum foi esquecida: entra na tabela de objetos
4. **Um bloco por frase**, sem pular nenhuma e sem resumir, com as 10 linhas: NA TELA (tudo o que aparece e onde
   está na tela), MOSTRA, CENÁRIO (o lugar e o que se mexe no fundo), ENTRA AGORA (como, de onde e em que palavra),
   OBJETOS SE MEXENDO (cada coisa, de onde pra onde, quanto e em que palavra), PERSONAGEM (onde, pra onde olha e duas
   ações, uma no começo e outra numa palavra), INTERAÇÃO (quem mexe em quê, e em que palavra), CÂMERA (alvo no centro
   e inteiro, quanto da tela ele ocupa, movimento, plano, lado, altura, onde começa e termina, diferente da frase
   anterior), EFEITOS VISUAIS (etiqueta com a cor e o texto, ✓/✗, rótulo, efeitos, com a palavra) e SONS (cada som,
   com a palavra). Escreva como se fosse explicar pra alguém que vai desenhar a cena sem ouvir a narração

Antes de mostrar, conferir a ficha com a lista do fim do passo 1 do guia: o objeto de cada frase na tela, no centro e
no alvo da câmera, o personagem sempre com ação e interação (nunca parado ou só observando), nenhuma câmera repetida e
nenhuma linha vazia ou "igual à anterior".

Mostrar o roteiro na conversa e, embaixo, **cada cena em 2 linhas, em palavras simples**: a 1ª com o que a pessoa vai
ver e o que acontece; a 2ª com o que o personagem faz e de onde a câmera mostra (ex.: "2. Ele atravessa o quintal com
um pano na cabeça e a chuva encharca ele. / Ele chega reclamando; a câmera passa de lado, na altura dele"). A ficha
completa, com as 10 linhas de cada cena, fica no `roteiro.md` (a pessoa vê no painel, em Vídeos, no roteiro do vídeo):
é ela que você usa no `cena.js`. Fechar com:
- uma linha com o que aplicou de `canal/aprendizados.md`, se tiver algo ("Usei o que você me ensinou: ...")
- o cenário escolhido, com o link da foto dele (`referencias/cenarios/<nome>.jpg`): "O vídeo vai ser no canteiro de
  obras. Quer outro lugar? Os 17 estão em `referencias/cenarios/todos.jpg`"
- 2 ou 3 perguntas curtas, com a sua sugestão. Modelo:
  1. "O começo prende? Tenho outra opção: '<gancho B>'. Eu ficaria com o <A ou B>, porque..."
  2. "Tá bom de tamanho (uns <n> segundos) ou prefere mais curto ou mais longo?"
  3. "Quer mudar alguma cena ou alguma frase? Se tá bom, é só dizer 'segue'."

**Esperar o ok**, a não ser que o usuário tenha pedido pra seguir direto ("faz tudo", "pode seguir") ou isso esteja em
"Jeito de trabalhar" de `canal/aprendizados.md`. Pediu mudança: ajustar, mostrar só o que mudou e perguntar de novo.

## 2. `roteiro.json` e `cena.js`

Passos 2 e 3 do guia:
- Copiar o `roteiro.json` e o `cena.js` de um modelo pra `videos/<tema>/` (o `roteiro.md` não: o seu já está lá) e
  trocar tudo o que está marcado com `TROQUE`. Com cenário pronto (o melhor): `referencias/modelo-construcao/` ou
  `referencias/modelo-natureza/`, trocando o nome do cenário na linha `K.cenario('...')` pelo escolhido na ficha (os
  lugares `C.centro`, `C.personagem`, `C.entrada`, `C.esquerda`, `C.direita`, `C.fundo` e `C.vista` existem em todos).
  Sem cenário pronto: `referencias/modelo-de-cena/`
- `roteiro.json`: um `plano` com nome próprio por frase, o **`mostra`** (a linha MOSTRA do bloco da frase, igualzinha:
  `"mostra": ["pilha", "personagem"]`) e o `jogo` (falha → corrige; no máximo 2 `conserta` com ⏪). `cor`, `arroba`,
  `estilo`, `fps`, `efeitos` e **a `voz`** vêm do bloco "No roteiro.json" de `canal/identidade.md`: a voz é a que a
  pessoa escolheu na instalação, nunca inventar outra. Sem `voz` no roteiro, o motor usa a do canal
- `cena.js`: **cada objeto da tabela de objetos**, com o mesmo nome (a chave do `K.pecas`, ou `K.nomear('nome', peça)`
  pra grupo e objeto pronto), em que plano cada um entra (`K.entraNo`), o personagem com as cores de
  `canal/identidade.md`, e **uma função em `P` por plano**: cole as linhas do bloco da ficha como comentário e escreva o
  código embaixo de cada uma (como no `referencias/modelo-construcao/cena.js`), com a câmera por último. Ideias:
  `referencias/cardapio-de-cenas.md`

## 3. Revisão e prévias (sempre antes do render)

```
node motor/render.js videos/<tema> --voz-teste --revisar
```

Ler o relatório e **abrir a folha** (`videos/<tema>/testes/folha.jpg`, uma imagem por frase). Arrumar cada `[corrigir]`
no `cena.js` e rodar de novo, **até dar `RESULTADO: APROVADO`**. Os `[conferir]`: olhar na folha se foram de propósito.
A tabela "O relatório diz → o que fazer" está no passo 4 do guia.

Depois, a capa e prévias de instantes que você quer ver de perto (os tempos de cada frase ficam em
`videos/<tema>/timeline.json`):

```
node motor/render.js videos/<tema> --voz-teste --capa
node motor/render.js videos/<tema> --voz-teste --previa <tempos>
```

**Abrir as imagens** e conferir: personagem atuando e inteiro no quadro, câmera mudando, peça certa aparecendo, nenhum
texto encavalado, capa no nível da `videos/exemplo/capa.png`. Ajustar e repetir.

As prévias, a folha e os trechos ficam em `videos/<tema>/testes/`; a capa, em `videos/<tema>/capa.png`. Quadro, capa
alternativa ou comparação que a IA fizer por conta própria também vai em `testes/` (regras em "Onde fica cada coisa",
no `AGENTS.md`).

Revisão aprovada: **a opinião de cada cena, no painel.** O `--revisar` grava cada cena solta (`testes/cenas/`), e o
painel mostra uma por uma, com a frase:
1. O `--revisar` já abre o painel nas cenas do vídeo (a linha `PAINEL:` do fim dele traz o link; se ela não aparecer,
   rode `npm run painel -- <tema>`). Mande o link, clicável, e diga pra pessoa, com as suas palavras: "As
   cenas estão prontas, uma imagem por frase. Abri no painel: em cada cena, clique em Gostei ou em Mudar (e escreva o
   que mudar). No fim, clique em Mandar pra IA e me diga 'mandei'. Mudar agora é mais rápido que depois do vídeo
   pronto." Junto, o link da capa (`capa.png`), que ainda não aparece no painel antes do vídeo
2. Ela disse "mandei": rodar `npm run painel -- <tema> --opiniao` e seguir a linha `PRA IA:` de lá. Cada cena marcada
   "mudar" vem com o pedido: arrumar no `cena.js`, anotar no `canal/historico.md`, rodar o `--revisar` de novo (o
   painel mostra as cenas novas sozinho) e pedir pra ela conferir de novo no painel ("Gostei das que faltam" confirma
   as que não mudaram com um clique)
3. Todas "gostei": seguir pro render. Cena elogiada no "No geral" ou com motivo vai pra "Cenas que funcionaram" de
   `canal/aprendizados.md`
- Ela pode responder aqui mesmo, sem o painel ("a cena 4 ficou estranha"): vale igual. O painel não abriu: mandar o
  link da folha (`testes/folha.jpg`) e perguntar aqui
- Pular só se "Jeito de trabalhar" de `canal/aprendizados.md` disser que ela não quer ver prévia

## 4. Render

```
node motor/render.js videos/<tema>
```

Leva uns minutos (dizer isso antes). O render roda a revisão rápida antes: se ela achar algo pra corrigir, ele para
sem fazer o vídeo (`O VÍDEO COMPLETO NÃO FOI FEITO`) e mostra a lista. Arrumar, rodar o `--revisar` até APROVADO e
renderizar de novo (a voz já feita não gasta de novo); `--mesmo-assim` só se a pessoa pedir. Mostrar a duração (teto do
Shorts: 3:00) e seguir direto pro passo 5.

## 5. Entrega completa (logo depois do render, sem esperar pedido)

O vídeo só está pronto com **`video.mp4`, `capa.png` e `publicacao.md`** na pasta. Na mesma hora do render:

1. Conferir que saíram o `video.mp4` e a `capa.png` (o render gera a capa sozinho; se faltar, rodar com `--capa`)
2. Seguir `comandos/publicar.md` nesta pasta: gera o `publicacao.md` (título de busca, descrição, hashtags e comentário fixado)
3. Marcar o tema em `canal/pauta.md` (Roteiro ✅, Vídeo ✅)
   E anotar o gasto: rodar `npm run custos -- <tema>`. Ele mede os tokens desta conversa (no Claude Code e no Codex;
   nas outras IAs ele diz que não dá pra medir, e aí não invente número) e junta com os créditos da ElevenLabs que o
   render já anotou. Fica em `videos/<tema>/custos.json`, e o painel mostra no vídeo
4. Os testes ficam em `testes/`, sem apagar: é ali que a pessoa acha o que foi conferido. Na pasta do vídeo, só a
   entrega e o roteiro
5. Mostrar: o gasto do vídeo em uma linha (o que o `npm run custos` mostrou: "Esse vídeo gastou 1,2 milhão de tokens
   da IA e 1.034 créditos da ElevenLabs"), a duração, os 3 arquivos (com links e a pasta onde estão), o título e a descrição prontos pra copiar, e
   avisar que a capa é o 1º quadro do vídeo (0:00): no YouTube Shorts é só escolher esse quadro; no TikTok, no
   Instagram e no Kwai vai a `capa.png`. O render já abre o painel no vídeo pronto (a linha `PAINEL:` do fim dele):
   mande o link, clicável. Lá ela assiste, baixa o vídeo e a capa e copia o título, a descrição e o comentário fixado
   com um clique
6. **Pedir a opinião** do vídeo pronto: "O que achou? Me dá uma nota de 1 a 5, me diz qual cena você mais gostou e qual
   ficou estranha (pelo número da folha), e o que mudaria." Pode responder aqui ou no painel (aba Vídeo, "Mandar pra
   IA": `npm run painel -- <tema> --opiniao` mostra). Junto, uma sugestão sua do que dá pra melhorar no próximo.
   A resposta vai pro histórico; cena elogiada vai pra "Cenas que funcionaram" de `canal/aprendizados.md` (com o vídeo e
   o nome do plano), e o que ela não gostou, pra "Visual". Pediu ajuste neste vídeo: mover o vídeo e a capa atuais pra
   `versoes/` com a data e refazer (frase que não mudou não gasta voz de novo)
7. Fechar com uma linha: "Postou? Volta em 2 ou 3 dias e me conta como foi: eu uso isso pra acertar os próximos. Pro
   próximo vídeo, abra uma conversa nova: eu leio tudo do canal de novo e sai melhor."
8. Se este é o 5º, 10º, 15º... vídeo pronto (fora o exemplo), fazer a revisão dos aprendizados (`AGENTS.md`)

## Rascunho rápido (opcional)

Se o usuário pedir só um rascunho bem rápido, dá pra usar a cena-modelo `montagem`: o `roteiro.json` descreve o objeto e
ninguém escreve `cena.js` (campos em `referencias/montagem.md`). Ela já varia câmera, lugar, ação e entrada a cada frase,
mas sai mais simples que uma cena própria, então avisar antes. Com `"cenario": "<nome>"` no topo do `roteiro.json`, ela
monta o vídeo dentro do cenário pronto. Rodar o `--revisar` nela também.

## Se algo der errado

- **Acabaram os créditos da ElevenLabs** (o render para e explica): as frases já narradas ficaram guardadas. Contar pra
  pessoa em uma frase e perguntar o que ela prefere, com a sua sugestão:
  1. esperar o plano renovar (a data aparece na mensagem) e fazer depois
  2. comprar mais créditos ou subir o plano no site da ElevenLabs
  3. usar a voz grátis do VoiceStudio (`comandos/instalar.md`, passo 3; leva uns 20 minutos na primeira vez)
  4. fazer com a voz do computador (robótica, só pra testar)
  A escolha vai pro histórico; se ela trocar a voz do canal de vez, mudar o `voz` em `canal/identidade.md`
- **A ElevenLabs recusou a chave:** rodar `npm run chave` (abre a janelinha) e pedir pra pessoa criar uma chave nova no
  site e colar lá; depois, rodar o `npm run conferir`
- **O navegador não abriu** (o render para com "Não consegui abrir o navegador que desenha o vídeo"): rodar
  `npm run instalar`, que testa o Chromium, o Edge e o Chrome e explica o que fazer
- **VoiceStudio fechado** ("O VoiceStudio não está aberto"): rodar `npm run voicestudio -- --abrir` (abre e espera
  ficar pronto); se ele não conseguir abrir, pedir pra pessoa abrir o programa e esperar carregar. Outros problemas da
  voz do VoiceStudio: `npm run voicestudio` e a seção "Se travar" de `comandos/voicestudio.md`
- **O vídeo saiu em `testes/video-voz-teste.mp4` em vez do `video.mp4`:** faltou a voz do canal (o render explica o
  porquê). Resolver a voz e renderizar de novo
- Erro no `cena.js`: a mensagem do navegador aparece no terminal (`erro na cena: ...` ou `página: ...`); corrigir e
  rodar a revisão de novo. A tabela de erros comuns está no fim do guia
- Personagem fora do quadro ou colado na câmera: `plano: 'medio'` ou `'aberto'` no `K.filmar`, ou mudar o lugar dele
- Duração acima de 3:00: encurtar o roteiro (o Shorts corta em 3:00)
- Cena escura demais: trocar o céu (`K.ceu('dia')`, `'tarde'`) ou dar `brilho` na peça principal
- Resolveu um erro que deu trabalho: uma linha em "Lições técnicas" de `canal/aprendizados.md` (o que deu errado e
  como resolveu), pra não repetir no próximo vídeo
