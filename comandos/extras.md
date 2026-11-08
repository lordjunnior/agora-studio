# Extras (Potencializar a máquina)

> Pra IA. Leia inteiro antes de mexer. Faça um passo de cada vez, na ordem. Não invente outro jeito.

Os extras são produtos que a pessoa compra à parte e que deixam a Máquina mais forte. Cada um tem o seu guia:

| Extra | O que é | Guia |
|---|---|---|
| 30 Roteiros + 100 Temas | 30 roteiros prontos, que viram vídeo, e 100 ideias de tema | `comandos/extras-30-roteiros.md` |
| Canal Gringo | o canal em inglês ou espanhol, numa cópia da Máquina | `comandos/extras-canal-gringo.md` |
| Checklist Viral + Plano de 30 Dias | o que conferir antes de postar e uma tarefa por dia | `comandos/extras-checklist.md` |
| Atualizações Para Sempre | toda versão nova da Máquina, sem pagar de novo | `comandos/extras-atualizacoes.md` |

No painel, tudo isso fica no menu **Potencializar a máquina** (`npm run painel -- --potencializar`).

## Antes de tudo: o canal configurado

Nenhum vídeo sai antes de o canal estar configurado (o render para e avisa). Se a pessoa ainda não terminou de
configurar, faça isso primeiro: `npm run conferir` e `comandos/instalar.md`, só no que falta. Os extras podem entrar
antes; o vídeo, não.

## Trazer o arquivo pra Máquina

A pessoa baixa o arquivo na área de membros da Cakto e você traz pra cá. Dois jeitos:

1. **Pelo painel (o mais fácil pra ela):** em Potencializar a máquina, ela arrasta o arquivo pro quadro.
2. **Por você, com um comando:**
   1. Rode `npm run extras` (no Windows, se o npm der erro: `npm.cmd run extras`). Ele mostra o que já está instalado
      e procura os arquivos dos extras nos Downloads, na Mesa e em Documentos, com o comando pronto pra cada um.
   2. Mostre pra pessoa o que ele achou e pergunte se pode trazer.
   3. Com o sim dela, rode o comando que apareceu, com o caminho entre aspas:
      `npm run extras -- "/Users/nome/Downloads/30-roteiros.zip"`
   4. Leia a resposta e siga a linha `PRA IA:` do fim.
   - Não achou nada? Pergunte onde ela salvou o arquivo (quase sempre em Downloads). Ela não baixou ainda? Explique em
     palavras simples: "Entre na área de membros da Cakto, pelo e-mail que chegou quando você comprou, abra a aula do
     produto e baixe o arquivo que fica embaixo do vídeo."

Trazer de novo o mesmo arquivo não estraga nada: o que já está na Máquina fica como está.

## Qual arquivo é de qual extra

| O arquivo | É de |
|---|---|
| `30-roteiros.zip` (ou a pasta `30-roteiros`, se o computador abriu o zip sozinho) | 30 Roteiros |
| `canal-gringo.zip` (ou a pasta `canal-gringo`) | Canal Gringo |
| `checklist-viral-e-plano-de-30-dias.md` e `.pdf` | Checklist |
| `atualizacoes-como-funciona.pdf` | Atualizações (é só o guia: guardar é opcional) |
| `30-roteiros-e-100-temas.pdf`, `canal-gringo-ingles-e-espanhol.pdf` | o guia de cada um (guardar é opcional) |
| Os do Google Drive (quem comprou no começo): "Comece Aqui - ....pdf", `30-roteiros.zip`, `canal-gringo.zip` | o mesmo de cima: funcionam igual |
| `maquina-preguica-3d-v2.3.zip` (com número) | **não é extra**: é uma versão nova da Máquina. Siga `comandos/extras-atualizacoes.md` |

## Como falar com a pessoa

- Frases curtas e palavras simples, como quem explica pra alguém que nunca mexeu num computador. Nada de "zip",
  "render", "terminal" ou "comando" sem explicar: diga "o arquivo que você baixou", "fazer o vídeo", "a janela preta".
- Sempre que precisar de uma resposta dela, dê a resposta pronta pra ela copiar. Ex.: `Pode responder: "Sim, pode
  trazer" ou "Me ajuda a achar o arquivo"`.
- Travou em alguma coisa? Ensine ela a pedir pra você: `Quando travar, me diga: "Me ajuda a fazer isso"`. O suporte
  (desconstruindouniverso@gmail.com) é só pra problema de compra ou de acesso à área de membros, ou se você tentou de
  verdade e não resolveu.
