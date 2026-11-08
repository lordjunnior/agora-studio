# Preguiça 3D

Pasta de produção de vídeos curtos animados em 3D (9:16) para um canal de curiosidades. Estas instruções valem pra
qualquer IA que trabalhe nesta pasta (Claude Code, Codex, Gemini CLI, Cursor, GitHub Copilot e outras).

## Começo de toda conversa (regra número 1)

Na primeira resposta da conversa, seja qual for a mensagem (até um "oi"), e antes de qualquer pedido (vídeo, roteiro,
capa, texto de postar), seguir `comandos/boas-vindas.md`:
1. **Avisar** em uma frase, antes de rodar qualquer coisa, que vai dar uma olhada rápida se está tudo instalado e
   configurado
2. **Conferir:** rodar `npm run conferir` (se o comando nem existir, o Node.js não está instalado). Respondeu
   **PRONTO**: ler `canal/canal.md`, `canal/identidade.md`, `canal/aprendizados.md`, `canal/pauta.md` e as últimas ~15
   linhas de `canal/historico.md` (onde a conversa anterior parou)
3. **Relatório:** contar em palavras simples o que está pronto, o que falta, quem resolve e quanto leva. Tudo pronto
   numa conversa de volta: uma linha só
4. **Boas-vindas:** a apresentação na primeira vez, 2 ou 3 linhas nas outras. Uma vez só por conversa
5. **PRONTO**: seguir com o pedido. **FALTA CONFIGURAR**: não começar o pedido. Se a pessoa já tinha pedido um vídeo,
   explicar em uma frase que sem a instalação e o canal configurados o vídeo sai genérico e gasta a cota da IA à toa.
   Perguntar se pode resolver e conduzir `comandos/instalar.md` (só o que o relatório marcou como falta). Terminou e o
   conferir deu PRONTO: se foi preciso fazer a entrevista do canal, o pedido vai pra uma conversa nova (regra número 3,
   com o pedido anotado na pauta e pronto pra copiar); se faltava só um conserto rápido, voltar ao pedido aqui mesmo

## Rodar os comandos sem travar (regra número 2)

Quem roda os comandos é você, a IA. **Nunca peça pra pessoa abrir o terminal, o PowerShell ou o arquivo `.env`**: ela
provavelmente nunca fez isso, e é aí que a instalação trava.
- **Instalar ou consertar a instalação:** `npm run instalar`. Ele faz tudo sozinho (peças do motor, navegador que
  desenha o vídeo e um teste com o vídeo de exemplo), fala em palavras simples e termina com `RESULTADO:` e uma linha
  `PRA IA:` com o próximo passo. Siga essa linha. Pode rodar quantas vezes precisar: o que já está pronto ele só confere
- **Chave da ElevenLabs:** `npm run chave` abre uma janelinha no navegador da pessoa, com o passo a passo e uma caixa pra
  colar a chave. A janela salva no `.env` certo, testa e diz se funcionou; a pessoa só volta e diz "salvei"
- **Não instale nada além do que o `npm run instalar` instala.** A Máquina tem motor próprio: o Three.js desenha a cena,
  um navegador escondido tira a foto de cada quadro e o ffmpeg junta o vídeo. Remotion, HyperFrames, Python, outro
  navegador, editor de vídeo ou biblioteca nova não são usados e só confundem
- **Comando demorado** (instalar, render): rodar com tempo limite longo, de 15 minutos ou mais. Se parar no meio, rodar
  de novo: o `npm run instalar` continua de onde parou
- **Pedido de permissão do seu programa** (pra rodar um comando, usar a internet, abrir o navegador que desenha o vídeo
  ou a janelinha da chave): avisar a pessoa em uma frase que é a Máquina trabalhando e que pode aceitar. Com a internet
  bloqueada ou numa "sandbox", o download e o navegador não funcionam: peça a permissão (no Codex, a pessoa pode
  escolher "Acesso completo")
- **Windows:** se o `npm` der "a execução de scripts foi desabilitada neste sistema" (é o `npm.ps1` do PowerShell), use
  `npm.cmd` no lugar de `npm` (`npm.cmd run instalar`) ou rode o arquivo direto (`node motor/instalar.js`). Não mexa na
  política de execução do Windows
- **O navegador não abre** ("o Chromium falhou ao iniciar", "erro de configuração do Windows"): não precisa consertar
  na mão. O motor tenta sozinho, nesta ordem, o Chromium da Máquina, o Microsoft Edge (vem em todo Windows) e o Google
  Chrome. Rode `npm run instalar`: ele testa, baixa de novo se precisar e explica o que fazer se nenhum abrir

## O painel sempre à mão (regra número 4)

O painel é como a pessoa vê a Máquina: os vídeos, as cenas, o texto de postar, o canal. Ela pode não saber abrir uma
página no navegador sozinha, então **quem abre é você**, e **toda resposta sua termina com o link do painel**.
- **Os comandos abrem sozinhos:** o `npm run instalar` (no fim, em "Comece aqui"), o `--revisar` (nas cenas), o vídeo
  completo (no vídeo pronto) e o `npm run canal` (em "Meu canal"). Quando um comando mostrar a linha `PAINEL:`, mande
  o link dela pra pessoa, clicável, e siga a linha `PRA IA:` logo abaixo
- **Começo da conversa:** o `npm run conferir` mostra `PAINEL: ligado` (com o link) ou `PAINEL: desligado`. Desligado:
  rode `npm run painel`, que abre na tela dela. No Claude Code, o painel já liga sozinho quando a conversa começa
- **Fim de toda resposta que entrega alguma coisa** (o relatório do começo, o roteiro, as cenas, o vídeo, o texto de
  postar, uma mudança no canal): o link do painel, clicável, e uma frase do que ela vê lá. Sem o link à mão,
  `npm run painel -- --link` liga o painel sem abrir aba nova e mostra o link
- **"Não abriu", "cadê o painel?", "não achei":** rode `npm run painel` de novo, mande o link clicável e diga que também
  dá pra abrir com **dois cliques no arquivo `ABRIR-PAINEL`**, na pasta da Máquina (`ABRIR-PAINEL.command` no Mac,
  `ABRIR-PAINEL.bat` no Windows)
- Nunca diga "abre o painel" ou "olhe no painel" sem ter rodado o comando você mesmo, e nunca peça pra pessoa abrir o
  terminal pra isso

## Uma conversa pra configurar, uma conversa nova pra cada vídeo (regra número 3)

A Máquina tem duas etapas, e cada uma fica na sua conversa:
1. **Configurar** (uma vez só, numa conversa): instalar, a entrevista do canal, a voz e o perfil no painel
   (`comandos/instalar.md`). Ela termina na passagem pra conversa nova (passo 6 de lá): nenhum vídeo começa nela
2. **Vídeos** (uma conversa nova pra cada vídeo): do tema à entrega, com os ajustes daquele vídeo

Por quê: a memória de uma conversa tem limite. A instalação e a entrevista enchem boa parte dela; quando enche, a IA
resume a conversa e esquece detalhes do método, e o vídeo sai bem pior (aconteceu no teste com IA grátis: a entrevista
e o vídeo na mesma conversa, e a conversa foi resumida duas vezes antes do vídeo ficar pronto). Numa conversa nova, a IA
lê o canal e o método do zero. Nada se perde: o que importa está em `canal/` e em `videos/<tema>/`.
- **Pedido de vídeo na conversa que fez a entrevista do canal**, ou **um segundo vídeo numa conversa que já fez um vídeo
  inteiro:** explicar em uma frase por que fica melhor numa conversa nova, anotar o tema em `canal/pauta.md` e passar a
  mensagem de passagem (modelo no passo 6 de `comandos/instalar.md`). Se a pessoa preferir seguir aqui mesmo, seguir
- **Numa conversa que acabou de começar, nunca pedir conversa nova:** é nela que o vídeo é feito
- Conserto rápido (trocar a voz, instalar de novo, mudar uma cor, escrever o texto de postar) não pede conversa nova
- **Como abrir uma conversa nova**, pra dizer à pessoa no programa dela:

| Programa | Conversa nova |
|---|---|
| Claude Code no VS Code | o botão de conversa nova, no alto do painel do Claude |
| Claude Code no terminal | digitar `/clear` |
| Codex | o botão **+** no alto do painel do Codex (no terminal: `/new`) |
| Cursor, GitHub Copilot | o botão **+** (nova conversa) no alto do chat |
| Gemini CLI | digitar `/quit` e abrir de novo (`gemini`) |
| Outro, ou na dúvida | o botão "Nova conversa" do programa, ou fechar e abrir o programa de novo |

## O painel (`npm run painel`)

Uma página no navegador da pessoa, com o menu do lado. É a parte visual: mostra o que a Máquina fez e facilita umas
configurações; mudança de vídeo, roteiro e cena a pessoa pede pra você. Ela atualiza sozinha quando você muda um
arquivo, então a pessoa acompanha tudo lá:
- **Comece aqui:** como a Máquina funciona, o que falta instalar ou configurar (o `npm run conferir` em palavras
  simples), com a barra de progresso, e o quadro pra subir um pacote extra de modelos 3D
- **Meu canal:** a capa (banner do YouTube) e o logo, o nome, o @ e a assinatura, os textos do canal (do que fala, quem
  assiste, jeito de falar, o que evitar, marca registrada, estilo da capa), o personagem e as cores dele, o cenário e a
  hora, a voz, a cor e as descrições nas redes (`canal/perfil.md`). **O que a pessoa salva lá muda os arquivos do
  canal** (`canal/canal.md`, `canal/identidade.md`, com o bloco "No roteiro.json"): leia de novo antes de cada vídeo,
  e não desfaça o que ela mudou no painel sem perguntar. O quadro "Preencher tudo de uma vez" dá o modelo de prompt
  (`CONFIGURAR-MEU-CANAL.txt`, o mesmo do `npm run canal`) e aceita o texto respondido colado ali mesmo
- **Vídeos:** um card por pasta de `videos/`, com o vídeo completo, o texto de postar com botão de copiar, as cenas (a
  folha do `--revisar`, uma imagem por frase) e o roteiro. **Nas cenas, a pessoa marca Gostei ou Mudar em cada uma e clica
  em "Mandar pra IA"**: a opinião fica em `videos/<tema>/opiniao.json`, e `npm run painel -- <tema> --opiniao` mostra em
  texto, com a linha `PRA IA:` do que fazer
- **Modelos 3D:** tudo que a Máquina sabe desenhar, por tipo, com a foto de cada um e o pedido pra copiar. As fotos e o
  catálogo ficam em `referencias/modelos/` (`catalogo.json`: o nome, como pedir e o código do `cena.js` de cada item):
  bom pra mostrar à pessoa o que dá pra usar. `npm run modelos` tira as fotos que faltam (`--todos` refaz todas,
  depois de mudar o motor); o painel roda sozinho quando um pacote extra é vinculado
- **Potencializar a máquina:** os extras vendidos à parte (30 Roteiros + 100 Temas, Canal Gringo, Checklist Viral +
  Plano de 30 Dias e Atualizações Para Sempre), com o link de compra, onde achar o arquivo na área de membros e o quadro
  pra soltar o arquivo baixado (o de hoje ou o que veio pelo Google Drive). `motor/potencializar.js` põe cada coisa no
  lugar: os 30 roteiros em `videos/<NN-tema>/`, já com o bloco "No roteiro.json" do canal e a assinatura do fim, e o
  resto em `canal/extras/` (vai junto no `npm run importar`). "Faz o vídeo de videos/<NN-tema>: o roteiro já está
  pronto" = `node motor/render.js videos/<NN-tema>` (cena-modelo montagem, sem `cena.js`); "com cena própria" = o
  `comandos/novo-video.md` partindo desse roteiro, sem reescrever a narração. Os modelos do Canal Gringo ficam em
  `canal/extras/gringo/canal-en.md` e `canal-es.md`. Sem o painel, o mesmo pelo `npm run extras`; o passo a passo de
  cada extra está em `comandos/extras.md`
- **Ajuda:** as perguntas mais comuns, separadas por assunto, com um campo pra procurar, e as boas práticas. Cada
  resposta traz o pedido pronto pra pessoa copiar e mandar pra você

Quando abrir: no fim da configuração (`comandos/instalar.md`, passo 4), quando as cenas de um vídeo ficam prontas
(`npm run painel -- <tema>`, passo 3 de `comandos/novo-video.md`), na entrega do vídeo e sempre que a pessoa pedir
("abre o painel", "cadê o meu vídeo?"). Rodar de novo reabre o mesmo painel, **sem encher o navegador de abas**: se o
painel já está na tela da pessoa, ele só troca de tela ali mesmo; se abrir uma aba nova, a velha se fecha sozinha. O
`--revisar` só abre o painel quando dá APROVADO (antes, o que já estiver aberto atualiza sozinho). O comando volta na hora e o painel fica
aberto por 12 horas; se o seu programa fechar o painel quando o comando termina, use `npm run painel -- --esperar` (fica
preso ao comando até a pessoa clicar em "Mandar pra IA" ou "Terminei", e mostra o que ela mandou). O painel não troca a
conversa: tudo o que dá pra fazer nele dá pra pedir aqui também.

## Comandos

| O usuário pede | Siga |
|---|---|
| `/instalar`, "instalar", "configurar", primeiro uso | `comandos/instalar.md` |
| `/novo-video <tema>`, "faz um vídeo sobre...", um tema | `comandos/novo-video.md` |
| `/publicar`, "texto de postar", "legenda", "título" | `comandos/publicar.md` |
| `/ajuda`, "como usa?", "o que dá pra fazer?", "tô perdido" | `comandos/boas-vindas.md` (pedido de ajuda) |
| "o que você aprendeu?", "o que você sabe de mim?" | `comandos/boas-vindas.md` (o que a IA aprendeu) |
| "postei", "teve 2 mil views", "o pessoal comentou..." | `comandos/publicar.md` (depois de postar) |
| "tá instalado?", "confere", "falta alguma coisa?" | `comandos/boas-vindas.md` (relatório completo) |
| "o que mudou?", "o que tem de novo?", "qual a minha versão?" | `NOVIDADES.md` (conte a versão de cima em 3 frases simples; a versão desta pasta está no `package.json`) |
| "trocar a voz", "acabaram os créditos", "a voz não funciona", "chave da ElevenLabs", "a janela da chave não salvou" | `comandos/instalar.md` (passo 3: a voz do canal) |
| "deu erro", "não instala", "o Chromium falhou", "travou na instalação" | `npm run instalar` e a seção "Se travar" de `comandos/instalar.md` |
| "VoiceStudio", "voz grátis", "voz no computador", "o VoiceStudio não funciona", "criar a voz" | `comandos/voicestudio.md` (passo a passo, conferido com `npm run voicestudio`) |
| "abre o painel", "cadê o meu vídeo?", "quero ver os meus vídeos", "logo", "banner" | `npm run painel` ("O painel", acima) |
| "mandei", "mandei a opinião", "dei a opinião no painel" | `npm run painel -- <tema> --opiniao` e o passo 3 de `comandos/novo-video.md` |
| "escreve as descrições do canal", "bio do TikTok", "descrição do canal no YouTube" | `comandos/instalar.md` (passo 4: o perfil nas redes) |
| Um texto colado que começa com "CONFIGURAR MEU CANAL" (o modelo respondido), "preenchi o modelo do canal" | `npm run canal` (no Windows, se o npm der erro: `npm.cmd run canal`). Ele acha as respostas sozinho (na área de transferência ou no arquivo) e salva tudo. Se ele pedir, salve o texto que a pessoa colou, inteiro e sem mudar nada, em `canal/respostas.txt` e rode de novo. Mande pra pessoa a mensagem do fim dele. Nunca passe as respostas pros arquivos à mão |
| "atualizei a Máquina", "tenho a versão antiga", "traz o meu canal da pasta antiga", "importar", "baixei a versão nova" | `npm run importar` (acha a pasta antiga sozinho e mostra o que vem, sem mudar nada). Mostre pra pessoa e, com o sim dela, rode o comando que ele indicar (`--confirmar`). **Nunca copie nem mescle os arquivos à mão**: o comando faz isso sem estragar nada, e a pasta antiga não muda |
| "quanto gastou?", "quantos tokens?", "quantos créditos foram?" | `npm run custos -- <tema>` (tokens da IA e créditos da ElevenLabs do vídeo; também no painel, no vídeo) |
| "comprei os 30 roteiros", "baixei o canal gringo", "comprei o checklist", "comprei um extra", "baixei um arquivo da área de membros" | `comandos/extras.md` (o `npm run extras` acha o arquivo e traz pra cá; no painel, Potencializar a máquina) |
| "faz o vídeo de videos/02-descarga", "faz o roteiro 2", "faz um dos 30 roteiros", "renderiza o roteiro pronto" | `comandos/extras-30-roteiros.md` (passo 2; caprichado, passo 3) |
| "quero o canal em inglês", "canal em espanhol", "esta é a cópia em inglês" | `comandos/extras-canal-gringo.md` |
| "confere o vídeo com o checklist", "plano de 30 dias", "em que dia eu estou?" | `comandos/extras-checklist.md` |
| "saiu versão nova", "baixei a versão nova", "como atualizo?" | `comandos/extras-atualizacoes.md` |
| "baixei o pacote de modelos 3D", "vincular os modelos", "instala o pacote de cenários" | `npm run painel -- --pacote <o .zip ou a pasta>` (pergunte onde ela salvou; quase sempre em Downloads) ou o quadro "Subir modelos 3D" do painel (em Comece aqui e em Modelos 3D) |

Quem não tem uma IA que trabalha na pasta usa o jeito por chat: `comandos/modo-chat.md`.

## Como conversar

Quem usa esta pasta provavelmente nunca mexeu com IA nem com terminal. A IA conduz; a pessoa decide.
- Fala simples e curta, como numa conversa de WhatsApp. Sem termo técnico sem explicar e sem despejar log. Explique
  como pra alguém que nunca mexeu num computador: "o arquivo que você baixou", "fazer o vídeo", "a janela preta"
- **Resposta pronta:** toda vez que precisar de uma resposta da pessoa, dê 1 a 3 respostas prontas pra ela copiar
  (`Pode responder: "Sim, pode fazer" ou "Me ajuda a fazer isso"`)
- **Ensine a pedir ajuda pra você:** quando a pessoa travar, ajude e mostre a frase pra próxima vez ("Quando travar, me
  mande: Me ajuda a fazer isso"). O painel tem o menu Ajuda, com as perguntas comuns e o pedido pronto de cada uma
- **Toda etapa termina pedindo a opinião**: mostrar o que fez (roteiro, prévias, vídeo pronto, texto de postar) e
  fazer de 1 a 3 perguntas, cada uma com opções ou um exemplo. Sempre aceitar "escolhe você"
- Sugerir, não só perguntar: dar a sua opinião e o porquê ("eu iria no começo B: tem um número que assusta")
- Antes de algo demorado (instalar, render), dizer em uma frase o que vai acontecer e mais ou menos quanto leva
- Pediu pra seguir direto ("faz tudo", "não precisa me perguntar"): perguntar só no fim, e anotar isso (abaixo)
- **Puxar contexto:** de vez em quando (na instalação, no primeiro vídeo e quando a pessoa parecer em dúvida), lembrar
  em uma frase que quanto mais ela conta, melhor fica: pra quem é o canal, um vídeo de outro canal que ela admira e por
  quê, o que ela não quer de jeito nenhum, como foram os vídeos postados. E que dá pra pedir mudança a qualquer hora
- **Imagem e vídeo de referência:** a pessoa pode mandar print de um vídeo que admira, foto ou desenho. Salvar em
  `canal/referencias/` com um nome que diga o que é (`cidade-de-noite.png`), anotar no histórico o que ela gosta ali e
  olhar antes de montar a cena. Vídeo: quase nenhuma IA assiste vídeo, então rodar `npm run quadros -- <arquivo do
  vídeo>`, que tira 12 quadros e faz uma folha em `canal/referencias/`, e olhar a folha (ou pedir 3 ou 4 prints)

## Aprender com o usuário (a IA melhora a cada vídeo)

Tudo o que a pessoa pede, opina, corrige ou aprova fica nos arquivos de `canal/`, não só na memória da IA: assim vale
pra qualquer IA e não se perde quando a conversa acaba.

- **Anotar na hora**, sem esperar o fim da conversa: uma linha em `canal/historico.md` (formato no topo do arquivo).
  Vale pedido de vídeo, mudança, opinião, nota, elogio, reclamação, aprovação de primeira e o resultado nas redes
- **Virar regra em `canal/aprendizados.md`**, na seção certa, quando: a pessoa diz "sempre", "nunca", "prefiro", "de
  agora em diante"; o mesmo tipo de pedido aparece em 2 vídeos diferentes; ou os resultados mostram um padrão. Avisar
  em uma frase: "Anotei: daqui pra frente, ...". Configuração do canal (nome, cores, personagem, lugar, hora, voz,
  cor do canal, hashtags) vai direto em `canal/canal.md` ou `canal/identidade.md`
- Pedido que só vale pro vídeo atual ("deixa a panela vermelha") fica só no histórico
- **Usar:** ler `canal/aprendizados.md` antes de todo roteiro, cena e texto de postar. Ao mostrar o roteiro, dizer em
  uma linha o que aplicou do que aprendeu
- **Cena que funcionou:** a pessoa elogiou uma cena (ou deu nota 4 ou 5 ao vídeo) → uma linha em "Cenas que
  funcionaram" de `canal/aprendizados.md`, com o vídeo e o nome do plano, pra reaproveitar o jeito nos próximos. Cena
  que ela não gostou → "Visual"
- **Lição técnica:** erro do `cena.js` ou do motor que deu trabalho → uma linha em "Lições técnicas" de
  `canal/aprendizados.md` (o que deu errado e como resolver), pra não repetir no próximo vídeo
- **Revisão a cada 5 vídeos prontos** (ou quando `canal/aprendizados.md` passar de ~80 linhas): ler o histórico desde a
  última revisão, juntar o que se repete, apagar o que ficou velho ou foi contrariado (vale o mais recente), atualizar
  a linha "Última revisão" e contar pra pessoa, em 3 ou 4 linhas, o que aprendeu
- O gosto da pessoa vale mais que o padrão do método (ex: "sempre vídeo de 90 s"), mas nunca mais que as Regras
  abaixo. Se o pedido piora o vídeo, explicar o porquê uma vez e fazer como ela quiser
- Nunca anotar chave, senha nem dado pessoal (telefone, endereço, documento, e-mail)

### Melhorar a Máquina (com cuidado)

A pasta também melhora com o uso. Quando um vídeo pedir algo que o motor não tem e que vai servir pra outros (um objeto
que se repete no canal, um efeito que faltou, uma reação nova do personagem, um personagem próprio), faça uma **peça
própria do canal em `canal/pecas/<nome>.js`** (o formato está em `canal/pecas/LEIA-ME.md`; o render carrega sozinho):
- **Nunca mexa em nada de `motor/`:** a versão nova da Máquina troca a pasta `motor/` inteira, e o que estivesse lá
  dentro se perderia. O `canal/` a versão nova não apaga
- **Só acrescentar, nunca mudar o que já existe:** os vídeos já feitos e o exemplo dependem de tudo como está
- Antes e depois da mudança, rodar `node motor/render.js videos/exemplo --voz-teste --revisar` e uma prévia do vídeo
  atual: tem que continuar funcionando igual
- Comentar em uma linha o que a função nova faz (o `referencias/kit-indice.md` lista o kit pelos comentários) e
  anotar em "Lições técnicas" de `canal/aprendizados.md`
- Na dúvida, não fazer peça: fazer no `cena.js` do vídeo

## Fluxo de um vídeo

Novo vídeo (numa conversa nova: regra número 3) → roteiro (`roteiro.md`, com a ficha de cena) → opinião e ok do
usuário → `roteiro.json` + `cena.js` → revisão (`--revisar`) até APROVADO → as cenas no painel
(`npm run painel -- <tema>`), com a opinião de cada cena → arrumar o que ela marcou pra mudar → vídeo → entrega completa
(`capa.png`, texto de postar, pauta marcada e o gasto anotado com `npm run custos -- <tema>`, sem esperar pedido, e o
painel no vídeo) → opinião do vídeo pronto (nota e
cenas) → resultado nas redes. Cada opinião vai pro histórico na hora.

- Cada vídeo fica em `videos/<tema-em-minusculas-com-hifen>/`, com tudo o que é dele (ver "Onde fica cada coisa")
- **Todo vídeo tem um `cena.js` próprio**, escrito pela IA: o método passo a passo, as regras e o checklist estão em
  `referencias/COMO-FAZER-O-VIDEO.md`. A base é um modelo pronto (copiar e trocar o que está marcado com `TROQUE`):
  `referencias/modelo-construcao/` ou `referencias/modelo-natureza/`, que já usam um cenário pronto, ou o guarda-chuva de
  `referencias/modelo-de-cena/`; as ideias de cada frase estão em `referencias/cardapio-de-cenas.md`; o exemplo
  caprichado é `videos/exemplo/` (lanterna); tudo o que o motor faz está em `referencias/kit-indice.md`. A cena-modelo
  `montagem` (sem código) fica só pra rascunho rápido
- **O lugar do vídeo é um cenário pronto** (`K.cenario('construcao')`): 17 lugares inteiros, com céu, luz e o que se
  mexe, escolhidos pelo tema (`referencias/cenarios.md`; fotos em `referencias/cenarios/`). Nunca montar o lugar peça
  por peça com `K.mundo` e caixas: o cenário pronto já vem no tamanho certo e a câmera não atravessa as paredes dele.
  Bichos (gato, cachorro, camaleão...) e personagens (doutor, operário) prontos também estão lá
- **Cada frase é uma cena diferente**, com os 4 ingredientes: câmera mexendo (diferente da frase anterior), personagem
  atuando, algo acontecendo (peça, falha, efeito) e texto ou som. A mesma animação em várias frases é o erro que mais
  estraga o vídeo
- **A ficha de cena é detalhada, frase por frase, antes de qualquer código** (passo 1 de
  `referencias/COMO-FAZER-O-VIDEO.md`, no formato de `referencias/modelo-construcao/roteiro.md`): a tabela com todos os
  objetos do vídeo, o teste dos substantivos (toda coisa que a narração cita aparece na tela) e um bloco por frase com o
  que está na tela, o que se mexe e em que palavra, as duas ações do personagem e a câmera (alvo, movimento, plano, lado
  e altura). Os erros que ela evita: o objeto principal esquecido, a câmera no lugar errado e o personagem parado que
  nem espantalho. Cada bloco vira um plano do `cena.js` (as linhas viram comentário, com o código embaixo) e a linha
  MOSTRA vira o `"mostra"` da frase no `roteiro.json`, que a revisão confere
- **A revisão é obrigatória:** `node motor/render.js videos/<tema> --voz-teste --revisar` até `RESULTADO: APROVADO`, e
  abrir a folha (`testes/folha.jpg`, uma imagem por frase) antes do render completo. O render completo confere de novo
  e para se tiver algo pra corrigir
- Render: `node motor/render.js videos/<tema>`. Prévias rápidas: `--voz-teste --previa 2,8.5,15`. Só a capa: `--capa`
- Sempre conferir prévias (abrir as imagens) antes do render completo
- **Voz:** sempre a que a pessoa escolheu na instalação (o `"voz"` do bloco "No roteiro.json" de `canal/identidade.md`):
  ElevenLabs, VoiceStudio (grátis) ou a do computador. Nunca trocar sem perguntar. A chave da ElevenLabs fica no arquivo
  `.env`, com esse nome exato, na raiz (nunca `.env.local` nem `.env.txt`); `npm run chave` abre a janelinha que salva
  do jeito certo
- Roteiro: seguir `metodo/formula-roteiro.md`. Ciência conferida: simplificar pode, inventar não
- Visual: seguir `canal/identidade.md` (personagem, cores, lugar) e `metodo/ritmo-e-visual.md`

## Onde fica cada coisa (toda mídia tem lugar certo)

A pessoa tem que achar qualquer arquivo pelo nome do vídeo. O motor já grava assim; a IA segue o mesmo pro que fizer
por conta própria.

| O quê | Onde |
|---|---|
| A entrega: `video.mp4`, `capa.png`, `publicacao.md` | `videos/<tema>/` |
| O roteiro e a cena: `roteiro.md`, `roteiro.json`, `cena.js` | `videos/<tema>/` |
| Todo teste do vídeo: prévias, trechos, vídeo com voz de teste | `videos/<tema>/testes/` (o motor grava lá sozinho) |
| A narração de cada frase, guardada pra não gastar crédito de novo | `videos/<tema>/narracao/` (o motor cuida) |
| Versão anterior de um vídeo já entregue | `videos/<tema>/versoes/` |
| A revisão das cenas: a folha (uma imagem por frase) e o relatório | `videos/<tema>/testes/folha.jpg` e `revisao.txt` |
| Cada cena solta, que o painel mostra pra pessoa opinar | `videos/<tema>/testes/cenas/` e `testes/cenas.json` (o `--revisar` grava) |
| A opinião que a pessoa deu no painel (cena por cena e o vídeo pronto) | `videos/<tema>/opiniao.json` (o painel grava; `npm run painel -- <tema> --opiniao` mostra) |
| Amostras de voz pra escolher a do canal | `canal/testes-de-voz/` (`npm run testar-voz -- <id>`) |
| A chave da voz (ElevenLabs) | `.env` na raiz da pasta, linha `ELEVENLABS_API_KEY=` (`npm run chave` abre a janelinha) |
| Logo do canal | `canal/logo.png` |
| Banner do YouTube e as descrições do canal em cada rede | `canal/banner.jpg` e `canal/perfil.md` (o painel salva os dois) |
| Pacote extra de modelos 3D e cenários (baixado à parte) | `motor/modelos/` e `referencias/cenarios/` (`npm run painel -- --pacote <zip>` ou o painel põem lá; o registro fica em `motor/modelos/pacotes.json`) |
| Imagens e vídeos de referência que a pessoa mandou | `canal/referencias/` (`npm run quadros -- <vídeo>` faz a folha de um vídeo) |
| Teste da instalação | `videos/exemplo/testes/` (apagar depois do teste) |

- Nunca gravar mídia solta na raiz da pasta, na Área de Trabalho, em Downloads ou numa pasta temporária
- Mídia que a IA cria por conta própria (um quadro tirado do vídeo pra conferir, uma capa alternativa, uma comparação)
  vai em `videos/<tema>/testes/`, com um nome que diga o que é: `capa-opcao-b.png`, `quadro-12s.jpg`
- Refazer um vídeo já entregue: antes do render, mover o `video.mp4` e a `capa.png` antigos pra
  `videos/<tema>/versoes/` com a data (`video-28-10-2026.mp4`, `capa-28-10-2026.png`), pra dar pra voltar atrás
- Ao mostrar uma mídia pra pessoa, mandar o link do arquivo (pra abrir com um clique) e dizer em que pasta ela fica

## Regras

- Nunca copiar roteiro, frase ou visual de outro canal. A fórmula é livre; o texto e a identidade são do usuário
- Nunca mostrar nem enviar o conteúdo do `.env`
- O motor (`motor/`) é da Máquina e é trocado inteiro a cada versão nova: nunca mexa nele. O que é só do canal fica em
  `canal/` (as peças próprias em `canal/pecas/`, ver "Melhorar a Máquina")
- **Canal em outro idioma (Canal Gringo):** se o `canal/canal.md` tem a linha `**Idioma dos vídeos:**`, tudo o que vai
  pro vídeo e pra postar sai nesse idioma (roteiro, legenda, capa, rótulos, título, descrição, hashtags e comentário
  fixado), e a conversa com a pessoa continua em português (`comandos/extras-canal-gringo.md`)
- **Ajudar antes do suporte:** erro ou dúvida, quem resolve é você: leia a mensagem, procure no guia do comando, tente
  de novo e explique pra pessoa em palavras simples. O suporte (desconstruindouniverso@gmail.com, com o print do erro,
  o sistema do computador e o que a pessoa estava fazendo) é só pra compra, reembolso e acesso à área de membros, ou
  depois de você tentar de verdade, mais de uma vez, sem resolver
