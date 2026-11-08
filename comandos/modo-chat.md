# Jeito por chat (qualquer IA, até gratuita)

> Pra quem não tem uma IA que trabalha direto na pasta. Funciona com qualquer IA de chat: ChatGPT, Gemini, Claude,
> DeepSeek, Copilot, inclusive nos planos gratuitos. A IA escreve o roteiro, você copia a resposta e um comando faz o
> vídeo. Os vídeos saem na cena-modelo (o objeto montado peça por peça, com a câmera, o personagem e a entrada de cada
> peça mudando a cada frase), mais simples que os feitos por uma IA de código, que escreve uma cena própria pra cada vídeo.
> Dúvidas: pergunte pra própria IA ("Me ajuda a fazer isso") ou veja o menu Ajuda do painel. Só se não resolver:
> desconstruindouniverso@gmail.com

## 1. Instalar (uma vez só, uns 10 minutos)

1. Instale o **Node.js** (versão LTS, em nodejs.org)
2. Abra o terminal **dentro desta pasta**:
   - **Mac:** abra o app Terminal, digite `cd ` (com espaço), arraste esta pasta pra janela e aperte Enter
   - **Windows:** abra esta pasta no Explorador de Arquivos, clique na barra de endereço, digite `cmd` e aperte Enter
3. Rode:

```
npm run instalar
```

Ele faz tudo sozinho: baixa as peças do motor, acha um navegador que desenhe o vídeo (no Windows, usa o Edge, que já vem
no computador) e faz duas imagens de teste do vídeo de exemplo (a lanterna), em `videos/exemplo/testes/`. No fim ele
escreve `RESULTADO: INSTALADO` (pode apagar a pasta `testes/` depois) ou o que falta, em palavras simples. Deu erro?
Rode de novo: ele continua de onde parou.

## 2. Configurar o canal (uma vez só)

Abra o arquivo **`CONFIGURAR-MEU-CANAL.txt`**, nesta pasta, no Bloco de Notas (Windows) ou no TextEdit (Mac), responda
cada pergunta depois de "Resposta:" e salve. O que não souber, deixe em branco: a Máquina usa o padrão. Depois, salve
de um destes jeitos:
- **No painel:** rode `npm run painel`, vá em **Meu canal** e cole o texto inteiro no quadro **Preencher tudo de uma
  vez**. Ele mostra o que salvou e o que ficou faltando
- **No terminal:** copie o texto inteiro e rode `npm run canal` (ele lê o que você copiou e também acha o arquivo
  respondido)

Ainda dá pra trocar à mão o que está entre colchetes em `canal/canal.md` e `canal/identidade.md`, ou usar o **Prompt
A** (no fim desta página) pra IA te ajudar a pensar nas respostas.

## 3. Escolher a voz (uma vez só)

O vídeo só sai com a voz escolhida. São 3 jeitos; escolha um e ponha a linha dele no bloco "No roteiro.json" de
`canal/identidade.md` (o Prompt A já entrega a linha pronta):

**ElevenLabs (a melhor):** voz de gente de verdade. Plano grátis pra testar (uns 10 minutos de narração por mês, sem
poder monetizar); pra monetizar, o plano pago mais barato (uns 5 a 6 dólares por mês).
1. No terminal, dentro da pasta, rode `npm run chave`. Abre uma janelinha no seu navegador com o passo a passo
2. Pela janela, crie a conta em **elevenlabs.io** e a chave (no menu da esquerda, **Developers**, depois **API Keys** e
   **Create API Key**; se aparecer uma lista de permissões, deixe tudo liberado). Copie o código que começa com **sk_**
3. Cole a chave na caixa da janela e clique em **Salvar**. Ela salva no arquivo certo (`.env`), testa e diz se
   funcionou. Não precisa criar arquivo nenhum na mão
4. Rode `npm run vozes`: aparecem as vozes da sua conta, cada uma com um **id**. Pra ouvir:
   `npm run testar-voz -- <id>` (a amostra fica em `canal/testes-de-voz/`). Pra ter vozes brasileiras: no site, abra
   **Voices** e depois **Voice Library**, filtre **Portuguese** e clique em **Add to my voices**
5. Linha da voz: `"voz": {"motor": "elevenlabs", "id": "<o id escolhido>", "velocidade": 1.1, "acelerar": "auto"},`

**VoiceStudio (grátis, no seu computador):** sem limite, mas precisa de computador mais forte (Mac com chip M1 ou mais
novo, ou Windows com placa de vídeo boa; sem isso funciona, só demora). A voz padrão dele tem licença não comercial (não
serve pra vídeo que ganha dinheiro).
O passo a passo completo, tela por tela, está em `comandos/voicestudio.md`. Em resumo:
1. Baixe em **github.com/debpalash/VoiceStudio/releases** (a versão mais nova): Windows, o arquivo que termina em
   **win-x64.exe**; Mac, o **mac-arm64.dmg**; Linux, o **.AppImage**. Instale e abra
2. Espere ele baixar as peças e o modelo de voz (de 10 a 40 minutos na primeira vez)
3. Crie a voz do canal em **Clonar**, com 10 a 20 segundos de uma voz **brasileira** clara (o sotaque sai igual ao do
   áudio), e salve como perfil de voz com um nome curto, tipo **Narrador**
4. Com ele aberto, rode `npm run voicestudio`: ele confere tudo e diz o que falta. Pra ouvir:
   `npm run testar-voz -- --voicestudio Narrador`
5. Linha da voz: `"voz": {"motor": "voicestudio", "id": "Narrador", "idioma": "pt-BR", "acelerar": "auto"},`
6. Antes de cada vídeo, abra o VoiceStudio (ou rode `npm run voicestudio -- --abrir`)

**Voz do computador (só pra testar):** robótica, não serve pra postar. Linha da voz: `"voz": {"motor": "teste"},`

## 4. Fazer um vídeo

1. Cole o **Prompt B, parte 1** na sua IA, com o seu tema no lugar indicado. Ela escreve o roteiro e a ficha de cada
   cena, com tudo o que aparece, o que se mexe, o personagem e a câmera
2. Leia o roteiro e as cenas. Quer mudar? Peça ("troca o gancho", "deixa mais curto", "na cena 5 ele podia levar um
   susto"). As cenas vieram curtinhas, de uma linha? Mande: **"As cenas estão curtas. Refaz a ficha de cada cena com as
   10 linhas, bem detalhada, sem pular nenhuma."** A resposta parou no meio? Mande: **"continua"**
3. Gostou? Cole o **Prompt B, parte 2**, na mesma conversa, e copie a resposta inteira da IA (o bloco que começa com
   `{`)
4. Primeiro, veja as cenas (leva uns 20 segundos e não gasta voz). No terminal, rode (troque `guarda-chuva` pelo nome do
   seu vídeo, sem espaço):

```
npm run colar -- guarda-chuva --voz-teste --revisar
```

Ele confere cada frase (câmera, personagem, se o que está no `"mostra"` aparece na tela, o que acontece, textos) e faz
a **folha**: uma imagem de cada cena, numerada, em `videos/guarda-chuva/testes/folha.jpg`. Abra a folha: cada cena tem
que ser diferente da anterior. Se o relatório disser `CORRIGIR`, ou alguma cena estiver estranha, mande a folha (e o
relatório, que fica em `testes/revisao.txt`) pra IA e peça: "ajusta as cenas que estão com problema; onde diz que a
câmera não mostra uma peça, troque a camera daquela frase". Copie o roteiro novo e rode de novo.

5. Gostou das cenas? Faça o vídeo:

```
npm run colar -- guarda-chuva
```

Antes de tudo, ele confere se a Máquina está instalada, o canal configurado e a voz escolhida (se faltar algo, ele diz
o quê, sem gastar nada). Depois pega o roteiro da área de transferência, aplica a identidade do seu canal e faz o vídeo
em `videos/guarda-chuva/`: `video.mp4` e `capa.png`. Se der erro, ele te diz o que colar pra IA.

**Ficou estranho?** A maioria das IAs gratuitas aceita imagem: mande a `folha.jpg` ou a `capa.png` e peça "ajusta as
peças pra ficar mais parecido com o objeto de verdade" ou "a cena 6 está igual à 5, muda". Copie o roteiro novo e rode
o `colar` de novo.

**A voz parou no meio** (acabaram os créditos da ElevenLabs, o VoiceStudio fechou): o comando explica o que fazer, e as
frases já narradas ficam guardadas. Dá pra esperar o plano renovar, subir o plano, trocar pro VoiceStudio (passo 3) ou
fazer com a voz do computador (`npm run colar -- guarda-chuva --voz-teste`, só pra testar).

## 5. Texto de postar

Cole o **Prompt C** na sua IA, junto com o roteiro do vídeo. Ela devolve título, descrição, hashtags e o comentário pra
fixar.

## Os extras (30 Roteiros, Canal Gringo, Checklist)

Comprou algum? Solte o arquivo que você baixou no painel, em **Potencializar a máquina**. Ou rode no terminal, que ele
procura o arquivo nos Downloads e mostra o comando pra trazer:

```
npm run extras
```

- **30 Roteiros:** eles já entram com o seu canal. Pra fazer o vídeo de um, rode (troque pelo roteiro que quiser; a
  lista está no painel):

  ```
  npm run video -- videos/02-descarga
  ```

  Mudou o personagem, a voz ou a cor do canal? Rode `npm run extras -- --canal` antes.
- **Canal Gringo:** faça uma cópia da pasta da Máquina pro outro idioma (o painel mostra como) e, dentro da cópia, rode
  (com o nome, o @ e a frase do fim do seu canal no outro idioma):

  ```
  npm run extras -- --gringo en --nome "Inside Things" --arroba @insidethings --assinatura "And follow Inside Things."
  ```

  Depois, use as duas partes do Prompt B normalmente, colando o `canal/canal.md` da cópia: ele diz o idioma, e a IA escreve o roteiro
  nele.
- **Checklist:** abra no painel e passe item por item antes de postar.

## 6. Ensinar a IA (cada vídeo sai mais com a sua cara)

A IA de chat esquece tudo quando a conversa acaba. Pra ela aprender o seu gosto:
1. Depois de pedir mudanças num roteiro ("troca o gancho", "menos gíria"), cole o **Prompt D**
2. Copie os tópicos que ela mandar e cole em `canal/aprendizados.md`, na seção do assunto
3. No próximo vídeo, esse arquivo vai junto no Prompt B (na linha "O QUE EU PREFIRO")

Postou e teve um resultado bom ou ruim? Anote na coluna "Resultado" da `canal/pauta.md`: com o tempo, dá pra ver que
tipo de tema e de gancho funciona no seu canal.

**Quanto mais você conta, melhor fica.** Na primeira mensagem de cada conversa, cole junto o `canal/canal.md` e o
`canal/aprendizados.md` (o Prompt B já pede). Conte pra IA o que gostou e o que não gostou de cada vídeo, e mande a
folha das cenas: ela enxerga a imagem e ajusta.

---

## Prompt A · Configurar o canal

```
Vou criar um canal de vídeos curtos animados em 3D. O formato monta uma coisa peça por peça,
então funciona melhor com temas de "como funciona" ou "como foi feito". Me faça estas perguntas,
uma por vez, com um exemplo em cada, e aceite "escolhe você":
1. Nome do canal e @ nas redes
2. Nicho: do que o canal fala (se for história, games ou outro, sugira o ângulo de "como
   funciona" ou "como foi feito" que encaixa)
3. Estilo do vídeo: o tom da narração (conversado, sério, engraçado) e o que evitar
4. Estilo visual: o personagem (menino ou menina, camiseta ou moletom, cores da roupa e do
   cabelo em #rrggbb, diferente de canais conhecidos), o cenário padrão do canal (um destes:
   construcao, natureza, cidade, casa, cozinha, sala, praia, fundo_do_mar, espaco, lua, fazenda,
   floresta, deserto, consultorio, oficina, escritorio ou estudio) e a hora (dia, tarde ou noite)
5. Voz: de homem ou de mulher, o tom, e de onde ela vem: ElevenLabs (a melhor; grátis pra
   testar, paga pra monetizar), VoiceStudio (grátis, no computador) ou a voz do computador
   (só pra testar)
6. Mecanismo único: o que todo vídeo do canal tem e os outros não têm
7. Estilo da capa
8. A cor do canal em #rrggbb (vai na palavra da capa e no botão "Seguir" do fim) e a frase de
   assinatura ("E segue o [canal].")
No fim, me entregue o texto pronto pra eu colar no meu canal.md e no identidade.md, trocando
todos os campos entre colchetes, e o bloco "No roteiro.json" com o personagem, o "cenario", a hora,
a cor ("cor": "#rrggbb"), o @ ("arroba": "@meucanal") e a linha da voz, conforme a escolha:
"voz": {"motor": "elevenlabs", "id": "ID_DA_VOZ", "velocidade": 1.1, "acelerar": "auto"}
"voz": {"motor": "voicestudio", "id": "NOME_DA_VOZ", "idioma": "pt-BR", "acelerar": "auto"}
"voz": {"motor": "teste"}
```

## Prompt B · O roteiro e as cenas (parte 1 de 2)

```
Você vai escrever o roteiro de um vídeo curto animado em 3D (em pé, 9:16, uns 60 a 90 segundos)
e a FICHA DE CADA CENA, com todos os detalhes. Nesta resposta, NADA de código: só o roteiro, as
peças, o cenário e as fichas. O código vem depois, na parte 2.

TEMA: [escreva aqui o tema, ex.: como funciona um guarda-chuva]
MEU CANAL: [cole aqui o que está no seu canal/canal.md, ou apague esta linha]
O QUE EU PREFIRO: [cole aqui o que está no seu canal/aprendizados.md, ou apague esta linha]

A FÓRMULA (quem assiste monta o objeto do zero, junto com o vídeo):
- 1ª frase: uma pergunta BEM curiosa, de até 10 palavras, que o vídeo responde
- Depois: "Se você..." com uma cena em que algo dá errado
- 3 a 6 ciclos: "Mas..." (um problema que dá pra ver) -> "Então você..." (a peça que resolve,
  descrita pelo que ela faz) -> "Esse é o *nome*."
- Pelo menos 1 "É por isso que..." e 1 número concreto
- Fim: "Por fora, é só...", "Por dentro, é..." e a assinatura do canal
- Frases curtas, sempre falando com "você". Ciência certa: simplificar pode, inventar não

AS PEÇAS DO OBJETO: uma por linha, de baixo pra cima: o nome (a palavra que a narração usa), a
forma (caixa, cilindro, tubo, funil, esfera, cone, anel ou cano), o tamanho em metros, a cor e
onde fica. O objeto inteiro tem de 1,5 a 3 metros de altura (o personagem tem 1,55). Toda coisa
que a narração cita (peça, parte, objeto) vira uma peça aqui.

O CENÁRIO: escolha UM, o que combina com o tema: construcao, natureza, cidade, casa, cozinha,
sala, praia, fundo_do_mar, espaco, lua, fazenda, floresta, deserto, consultorio, oficina,
escritorio ou estudio. E a hora: dia, tarde ou noite.

A FICHA DE CADA CENA (a parte mais importante: é ela que deixa o vídeo bom). Pra CADA frase do
roteiro, um bloco com as 10 linhas abaixo, escritas por extenso. Escreva como se fosse explicar
a cena pra alguém que vai desenhar sem ouvir a narração. NUNCA escreva "igual à anterior", NUNCA
pule uma frase e use SÓ as palavras que estão entre parênteses:

CENA [número]: "[a frase]"
1. O QUE APARECE: tudo o que está na tela e onde fica (no centro, à esquerda, à direita, atrás)
2. NÃO PODE FALTAR: a peça de que a frase fala (sempre) e "personagem", se ele importa
3. CENÁRIO: o que se vê atrás do objeto e o que se mexe lá no fundo
4. PEÇA NOVA: qual peça entra e como entra (cai, desliza, encaixa, cresce, gira, sobe), ou "nenhuma"
5. O QUE DÁ ERRADO: o problema na peça (treme, tomba, murcha, apaga, esquenta, congela, pisca,
   quebra), ou "nada"
6. PERSONAGEM: onde fica (direita, esquerda ou frente do objeto) e o que faz, combinando com o
   verbo da frase (susto, surpreso, ideia, vitoria, cansado, duvida, bravo, triste, mostrando,
   chamando, empurrando, segurando, erguendo, andar, correr, cair, suar, pensar, pular,
   comemorar, apontar, acenar). NUNCA parado
7. INTERAÇÃO: o que o personagem faz com a peça (segura, empurra, aponta, mostra) ou o que a peça
   faz com ele (molha, assusta, derruba)
8. CÂMERA: o que fica no centro da tela, inteiro; o movimento (chegando, afastando, girando,
   subindo, descendo, passando, mergulho, revelando); o plano (aberto, medio, perto, detalhe); o
   lado (frente, direita, esquerda, perfil_direita, perfil_esquerda); a altura (alto, olho,
   baixo). Peça pequena: perto ou detalhe. SEMPRE diferente da cena anterior
9. NA TELA, POR CIMA: etiqueta (até 25 letras, com a cor: vermelho pra problema, verde pra
   solução, azul pra explicação, laranja pra curiosidade), marca (certo ou errado), contador (um
   número grande com uma legenda), efeito (luz, brilho, fogo, fumaca, vapor, agua, chuva, vento,
   festa), ou "nada"
10. CARA E SOM: a cara do personagem (feliz, triste, surpreso, bravo, assustado) e, se uma peça
   entra, o barulho dela (metal, tampa, baque, madeira, pedra)

EXEMPLO DE UMA CENA BEM FEITA:
CENA 6: "Mas solto, ele murcha e a água empoça em cima da sua cabeça."
1. O QUE APARECE: o tecido azul no centro, murcho; o personagem embaixo dele, de frente; a chuva
2. NÃO PODE FALTAR: tecido, personagem
3. CENÁRIO: a frente da casa, de tarde; atrás, a porta e o jardim com a chuva caindo
4. PEÇA NOVA: nenhuma
5. O QUE DÁ ERRADO: murcha
6. PERSONAGEM: na frente do objeto; bravo
7. INTERAÇÃO: a água empoça no tecido murcho e pinga na cabeça dele
8. CÂMERA: o tecido no centro, inteiro, com o personagem embaixo; descendo; medio; frente; alto
9. NA TELA, POR CIMA: etiqueta vermelha "Murchou"
10. CARA E SOM: bravo; nenhuma peça entra

Antes de responder, confira, cena por cena:
- Toda frase tem a sua cena, com as 10 linhas preenchidas?
- A peça de que a frase fala está no "NÃO PODE FALTAR" e no centro da CÂMERA?
- O personagem está fazendo alguma coisa em toda cena (nunca parado)?
- A câmera de cada cena é diferente da cena anterior?
- Toda coisa que a narração cita virou peça na lista de peças?
Responda com o roteiro numerado, a lista de peças, o cenário e as fichas, sem código.
```

## Prompt B · O arquivo do vídeo (parte 2 de 2)

Mande este na mesma conversa, depois de aprovar o roteiro e as cenas da parte 1:

```
Agora transforme o roteiro e as fichas que você escreveu num bloco JSON, no formato do exemplo
abaixo. Não mude nenhuma frase e não pule nenhuma cena. Cada linha da ficha vira um campo:
- a lista de peças vira "objeto": {"pecas": [...]}, de baixo pra cima, com "nome", "forma", "tam",
  "cor" e "pos" (o CENTRO da peça; o chão é y = 0). O barulho da peça vai em "som"
- o cenário e a hora viram "cenario" e "hora", no topo
- NÃO PODE FALTAR vira "mostra" (a lista, com o "nome" das peças e "personagem")
- PEÇA NOVA vira "peca" (o número da peça, contando do 0) e "entra"
- O QUE DÁ ERRADO vira "falha"
- PERSONAGEM vira "onde" e "acao"
- CÂMERA vira "camera": {"movimento": "...", "plano": "...", "lado": "...", "altura": "..."}
- NA TELA, POR CIMA vira "etiqueta" com "cor", "marca", "contador" ({"texto": "3 HORAS", "sub":
  "COM UMA PILHA"}) ou "efeito" ({"tipo": "chuva", "forca": 1, "mantem": true})
- CARA vira "humor"
Cada frase também tem "plano", pelo tipo dela: "gancho" na 1ª (com "gancho": true), "problema" no
"Se você..." e em todo "Mas...", "monta" no "Então você...", "nome" no "Esse é o...", "mostra" no
"É por isso que..." e no número, "por_fora", "por_dentro" e "segue" no fim.
No topo: "titulo" e "capa" (a pergunta da capa em 2 a 4 linhas, com \n entre as linhas e uma
*palavra* entre asteriscos).
Formas e "tam" das peças: caixa [largura, altura, profundidade] · cilindro [raio, altura] ·
tubo [raio, altura] · funil [raio de cima, raio de baixo, altura] · esfera [raio] · cone [raio,
altura] · anel [raio, grossura] · cano: "pontos" [[x,y,z], ...] e "tam" [raio]. Opcionais:
"giro" [x,y,z] em graus, "metal": true, "brilho": 0 a 1, "transparente": 0 a 1.

EXEMPLO COMPLETO (guarda-chuva):
{
  "titulo": "Guarda-chuva",
  "capa": "Como o guarda-chuva\nsegura a *chuva*?",
  "cenario": "casa",
  "hora": "tarde",
  "objeto": {"pecas": [
    {"nome": "tecido", "forma": "funil", "tam": [0.06, 1.08, 0.46], "cor": "#2f7fe0", "pos": [0, 1.99, 0]},
    {"nome": "haste", "forma": "cilindro", "tam": [0.025, 1.9], "cor": "#2b2f36", "metal": true, "pos": [0, 1.25, 0]},
    {"nome": "cabo", "forma": "cano", "pontos": [[0, 0.35, 0], [0, 0.15, 0], [0.07, 0.04, 0], [0.17, 0.09, 0]], "tam": [0.04], "cor": "#7a4a22", "pos": [0, 0, 0]},
    {"nome": "varetas", "forma": "cano", "pontos": [[0, 2.2, 0], [0.998, 1.76, 0.413], [0, 2.2, 0], [0.413, 1.76, 0.998], [0, 2.2, 0], [-0.413, 1.76, 0.998], [0, 2.2, 0], [-0.998, 1.76, 0.413], [0, 2.2, 0], [-0.998, 1.76, -0.413], [0, 2.2, 0], [-0.413, 1.76, -0.998], [0, 2.2, 0], [0.413, 1.76, -0.998], [0, 2.2, 0], [0.998, 1.76, -0.413], [0, 2.2, 0]], "tam": [0.014], "cor": "#c9ced6", "metal": true, "pos": [0, 0, 0]},
    {"nome": "trava", "forma": "cilindro", "tam": [0.06, 0.16], "cor": "#e8352b", "pos": [0, 1.62, 0], "som": "trava"}
  ]},
  "frases": [
    {"texto": "Como um pano tão fino segura um temporal inteiro?", "plano": "gancho", "gancho": true, "mostra": ["tecido", "personagem"], "acao": "surpreso", "camera": "mergulho"},
    {"texto": "Se você precisa atravessar a rua na chuva, põe um pano em cima da cabeça e chega encharcado do mesmo jeito.", "plano": "problema", "mostra": ["personagem"], "etiqueta": "Encharcado", "acao": "cair", "onde": "esquerda", "camera": "personagem", "efeito": {"tipo": "chuva", "forca": 1, "mantem": true}},
    {"texto": "Mas o pano comum é cheio de furinhos, e a água passa direto.", "plano": "problema", "mostra": ["personagem"], "etiqueta": "A água passa", "acao": "cansado", "onde": "esquerda", "camera": "de_baixo"},
    {"texto": "Então você usa um tecido de fios bem fechadinhos, com uma camada que faz a gota escorrer.", "plano": "monta", "peca": 0, "mostra": ["tecido", "personagem"], "entra": "cai", "acao": "ideia", "onde": "direita", "camera": {"movimento": "subindo", "plano": "medio", "lado": "direita", "altura": "olho"}, "etiqueta": "A gota escorre", "cor": "verde"},
    {"texto": "Esse é o *tecido impermeável*.", "plano": "nome", "peca": 0, "mostra": ["tecido"], "acao": "mostrando", "camera": "girando"},
    {"texto": "Mas solto, ele murcha e a água empoça em cima da sua cabeça.", "plano": "problema", "mostra": ["tecido", "personagem"], "falha": "murcha", "acao": "bravo", "humor": "bravo", "onde": "frente", "camera": {"movimento": "descendo", "plano": "medio", "lado": "frente", "altura": "alto"}, "etiqueta": "Murchou", "cor": "vermelho"},
    {"texto": "Então você estica ele num esqueleto de hastes de metal, presas num cabo.", "plano": "monta", "peca": [3, 1, 2], "mostra": ["varetas", "personagem"], "entra": "cresce", "acao": "vitoria", "onde": "direita", "camera": "chegando", "etiqueta": "Esticado"},
    {"texto": "Essas são as *varetas*.", "plano": "nome", "peca": 3, "mostra": ["varetas"], "acao": "apontar", "camera": "de_baixo"},
    {"texto": "Mas aberto o tempo todo, ele não passa nem na porta.", "plano": "problema", "mostra": ["tecido", "personagem"], "falha": "treme", "acao": "empurrando", "onde": "esquerda", "camera": {"movimento": "passando", "plano": "medio", "lado": "perfil_direita", "altura": "olho"}, "etiqueta": "Não passa na porta", "cor": "vermelho"},
    {"texto": "Então você põe no cabo uma pecinha que desliza: sobe, abre tudo, e uma molinha prende lá em cima.", "plano": "monta", "peca": 4, "mostra": ["trava", "personagem"], "entra": "desliza", "acao": "segurando", "onde": "direita", "camera": {"movimento": "chegando", "plano": "medio", "lado": "direita", "altura": "olho"}, "etiqueta": "Clique!", "cor": "verde"},
    {"texto": "Essa é a *trava*.", "plano": "nome", "peca": 4, "mostra": ["trava"], "acao": "mostrando", "camera": "detalhe"},
    {"texto": "É por isso que ele faz aquele clique quando abre.", "plano": "mostra", "mostra": ["tecido", "personagem"], "marca": "certo", "acao": "vitoria", "onde": "frente", "camera": "revelando"},
    {"texto": "Por fora, é só um pano esticado num cabo.", "plano": "por_fora", "mostra": ["tecido", "personagem"], "acao": "mostrando", "camera": "afastando"},
    {"texto": "Por dentro, é um tecido que a água não atravessa, varetas que esticam tudo e uma molinha que segura até o vento chegar.", "plano": "por_dentro", "mostra": ["tecido", "varetas"], "acao": "surpreso"},
    {"texto": "E segue o canal pra ver o próximo.", "plano": "segue", "mostra": ["personagem"], "acao": "apontar"}
  ]
}
Antes de responder, confira: toda frase tem "mostra", "camera" e "acao"? Nenhuma frase ficou de
fora? A peça de que a frase fala está no "mostra"?
Responda SÓ com o bloco JSON completo, sem explicação antes ou depois.
```

## Prompt C · Texto de postar

```
Escreva o texto de postar deste vídeo curto (cole o roteiro abaixo):
1. TÍTULO pro YouTube Shorts: a pergunta que uma criança curiosa faria e alguém digitaria na
   busca, com o detalhe que intriga. Até 60 caracteres, sem hashtag e sem emoji
2. DESCRIÇÃO: uma abertura de 1 ou 2 frases, uma linha com o que o vídeo mostra, a assinatura do
   canal e até 5 hashtags em minúsculas
3. COMENTÁRIO PRA FIXAR: a pergunta do vídeo em CAIXA ALTA, uma linha de espanto e um item
   curto por peça, na ordem do vídeo, terminando com uma pergunta pra quem assiste
Ciência certa: simplificar pode, inventar não. Não prometa o que o vídeo não mostra.

[cole aqui o roteiro]
```

## Prompt D · O que a IA aprendeu

```
Com base no que eu pedi, corrigi e elogiei nesta conversa, me escreva em tópicos curtos o que
você aprendeu sobre o meu gosto, pra eu guardar e usar no próximo vídeo. Só o que vale pra
todos os vídeos (não o que era só deste tema), separado por assunto: roteiro e narração,
visual, capa e texto de postar. Um tópico por linha, começando com "- ".
```
