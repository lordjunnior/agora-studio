# Publicar [pasta do vídeo]

> No Claude Code: `/publicar`. Em outra IA que trabalha na pasta: "escreve o texto de postar".

Sem pasta, usar o vídeo mais recente em `videos/` (fora o `exemplo`).

## Antes

Ler o `roteiro.json` (frases, peças nomeadas, `capa`) e o `roteiro.md` do vídeo, o `canal/canal.md` (assinatura,
hashtags, tom) e o `canal/aprendizados.md` (o estilo de título e de texto que a pessoa prefere, e o que deu resultado).

## Título (YouTube Shorts)

- A pergunta que uma criança curiosa faria e alguém digitaria na busca, **com o detalhe que intriga**.
  Ex: "Como um avião tão pesado consegue voar?", "Como uma pilha tão pequena acende uma lanterna?"
- Até ~60 caracteres (o limite é 100). Sem hashtag e sem emoji
- O vídeo tem que responder o título
- Dar também uma **outra opção**, de outro jeito (mais direta, ou mais intrigante), e perguntar qual a pessoa prefere.
  A escolhida fica como título principal no `publicacao.md`. Se ela escolher o mesmo jeito em 2 vídeos, vira
  preferência em "Capa e texto de postar" de `canal/aprendizados.md`

## Descrição

Quatro blocos, sem emoji:
1. **Abertura** de uma ou duas frases (pergunta + começo da resposta, ou "não basta X: precisa Y")
2. **O que o vídeo mostra:** "Acompanhe [as peças, na ordem] trabalhando juntas. Veja também [1 ou 2 viradas]."
3. **Assinatura** do canal (de `canal/canal.md`)
4. **Até 5 hashtags** em minúsculas e sem acento: o tema + as do canal

## Comentário pra fixar

1. A pergunta do gancho em CAIXA ALTA, entre dois emojis do tema
2. Uma linha de espanto: por que aquilo parece impossível, com uma palavra em CAIXA ALTA
3. 4 a 7 itens `<emoji> <n>️⃣ NOME: explicação em 1 a 3 frases!`, um por peça, na ordem do vídeo.
   Pelo menos um número que não está na narração (só se tiver certeza) e uma comparação caseira
4. O último item é uma pergunta que abre um assunto extra

## Regras

- Conferir a ciência. Simplificar pode, inventar não. Na dúvida, deixar o número de fora
- Não prometer o que o vídeo não mostra
- Não copiar texto de outro canal

## Saída

Salvar `videos/<tema>/publicacao.md` neste formato. O painel (`npm run painel`) lê esse arquivo e mostra cada parte com
botão de copiar, então os títulos das seções ficam exatamente assim:

```
# Publicação: <tema>

## Título

<o título principal, numa linha só>

**Outra opção:** <o outro título>

## Descrição

<os 4 blocos da descrição>

## Capa

`capa.png` como capa no TikTok, no Instagram e no Kwai. No YouTube Shorts, escolha o 1º quadro do vídeo: é a própria capa.

## Comentário fixado

<o comentário>
```

Mostrar o título, a descrição e o comentário na conversa, prontos pra copiar, e perguntar qual título ela prefere (se
ela escolher a outra opção, trocar as duas de lugar). Avisar que o painel também mostra tudo isso, com botão de copiar.

## Depois de postar (é assim que a IA aprende o que dá certo)

- A pessoa avisou que postou: marcar "Postado" na `canal/pauta.md` com a data e pedir pra ela voltar em 2 ou 3 dias
  com os números (visualizações, curtidas, comentários e, se souber, quanto tempo o pessoal assistiu)
- Ela trouxe os números: anotar na coluna "Resultado" da pauta e no `canal/historico.md`, comparar com os outros vídeos
  e dizer em 1 ou 2 frases o que você acha que pesou (o tema, o começo, a capa, o tamanho). Com poucos vídeos é
  palpite: falar como palpite
- O mesmo padrão em 3 vídeos ou mais vira regra em "O que dá resultado nas redes" de `canal/aprendizados.md`
- Ela contou um comentário do público (dúvida, pedido de tema): anotar no histórico e sugerir como tema na pauta
