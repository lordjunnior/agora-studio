# Ritmo e visual

O que o roteiro não mostra, mas segura a pessoa no vídeo. O `cena.js` de cada vídeo faz isso (ver `referencias/COMO-FAZER-O-VIDEO.md` e o exemplo em `videos/exemplo/`).

## Ritmo

- **~190 palavras por minuto.** Mais rápido que uma conversa: o motor acelera a voz até chegar perto disso
- **A imagem muda a cada 1 ou 2 segundos.** Uma frase = um plano de câmera. Nenhum plano parado
- **Cada frase é uma cena diferente, com 4 ingredientes:** a câmera se mexendo (e diferente da frase anterior), o
  personagem atuando, algo acontecendo (peça entrando, peça falhando, efeito) e um texto ou som. A mesma animação em
  várias frases seguidas é o que mais faz a pessoa sair do vídeo. A revisão (`--revisar`) confere isso sozinha
- **O que a voz fala aparece na hora:** "tropeça" → ele tropeçando quando a palavra sai, não um segundo depois
- **Volume em −14 LUFS**, o padrão das redes (o motor normaliza)

## Na tela

- **Legenda uma palavra por vez**, branca com contorno preto, no meio da tela. O termo-chave (`*palavra*` no roteiro)
  fica amarelo
- **Rótulo amarelo grande** no "Esse é o X", colado na peça. A peça fica amarela translúcida por um instante
- **Etiquetas** (pílula branca com ponto colorido) mostram o que a narração diz. A cor tem sentido:
  vermelho = problema, verde = funciona, as outras = neutras
- **✓ verde e ✗ vermelho** quando funciona ou falha
- **O invisível vira visível:** luz como feixe, calor como fogo, vapor subindo, água escorrendo

## Som

- **Um efeito em cada interação:** peça caindo, encaixando, luz acendendo, fogo, água
- **Trilha baixinha por baixo**, que abaixa sozinha quando a voz fala
- Os sons ficam em `motor/sons/`. Dá pra trocar a trilha por uma música sua (`trilha.arquivo` no roteiro.json)

## Capa e primeiro segundo

- A capa é o **1º quadro do vídeo**, e a pergunta fica escrita no topo enquanto o gancho é falado: quem vê a capa e
  toca no vídeo não percebe corte
- **Tudo que importa fica no meio da tela** (entre 1/8 e 7/8 da altura): o TikTok corta a capa em 3:4
- Contraste forte, o detalhe estranho bem à vista, a pergunta numa caixa branca com uma palavra na cor do canal

## Depois de postar, o que olhar

- **Retenção no 1º segundo** (TikTok e Shorts mostram): se a maioria sai no começo, o problema é o gancho ou a capa
- **Tempo médio assistido** e **% que viu até o fim**: se cai no meio, o meio tem ciclo sem problema visível
- **Seguidores por vídeo**: o número que diz se o canal está crescendo
