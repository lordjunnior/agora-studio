# Máquina Preguiça 3D

Vídeos curtos animados em 3D, feitos por IA a partir de um tema: roteiro, animação, narração, legenda, som e capa.
Você escolhe o assunto, a IA faz o resto. Funciona com qualquer IA, até gratuita (com uma IA de código, como o
Claude Code, fica bem melhor).

**Comece por aqui:** [COMECE-AQUI.md](COMECE-AQUI.md)

Comandos que você (ou a IA) roda no terminal, dentro da pasta:

```
npm run instalar                          instala tudo (peças do motor e navegador) e testa com o vídeo de exemplo
npm run conferir                          confere se está tudo instalado e configurado (o canal e a voz)
npm run chave                             abre uma janelinha pra colar a chave da voz da ElevenLabs (salva e testa)
npm run vozes                             lista as vozes que dá pra usar (ElevenLabs e VoiceStudio)
npm run testar-voz -- <id>                faz uma amostra de uma voz (canal/testes-de-voz/)
npm run voicestudio                       confere o VoiceStudio (voz grátis): instalado, aberto, voz salva (-- --abrir abre)
npm run video -- videos/<tema> --voz-teste --revisar    confere as cenas e faz a folha (uma imagem por frase)
npm run video -- videos/<tema>            faz o vídeo
npm run colar -- <tema>                   jeito por chat: faz o vídeo do roteiro copiado da IA
npm run quadros -- <vídeo>                tira 12 quadros de um vídeo de referência pra IA olhar (canal/referencias/)
npm run cenarios                          fotografa os 17 cenários prontos (referencias/cenarios/; -- cidade --hora noite)
npm run modelos                           fotos de tudo que a Máquina desenha, pro painel (referencias/modelos/; --todos refaz)
npm run canal                             salva o CONFIGURAR-MEU-CANAL.txt respondido (lê da área de transferência)
npm run custos -- <tema>                  quanto o vídeo gastou: tokens da IA e créditos da ElevenLabs (custos.json)
npm run importar                          acha a pasta da versão antiga e mostra o que traz (-- --confirmar traz)
npm run painel                            abre o painel no navegador: o canal, os vídeos e os modelos 3D
npm run painel -- --link                  liga o painel sem abrir aba nova e mostra o link (pro fim da resposta da IA)
ABRIR-PAINEL.command / ABRIR-PAINEL.bat   dois cliques abrem o painel, sem IA e sem terminal (Mac / Windows)
npm run painel -- <tema>                  abre o painel nas cenas do vídeo, pra dar a opinião de cada uma
npm run painel -- <tema> --opiniao        mostra a opinião que a pessoa deu no painel
npm run painel -- --pacote <zip>          instala um pacote extra de modelos 3D e cenários
```

No Windows, se o PowerShell disser que "a execução de scripts foi desabilitada", troque `npm` por `npm.cmd`
(`npm.cmd run instalar`).

**Dúvidas:** pergunte pra sua IA ("Me ajuda a fazer isso") ou veja o menu Ajuda do painel. Só se não resolver:
desconstruindouniverso@gmail.com

**Licença:** uso pessoal. Os vídeos que você criar são seus; revender ou redistribuir a Máquina Preguiça 3D é proibido.
Detalhes em [LICENCA.md](LICENCA.md).

```
COMECE-AQUI.md     o passo a passo: instalar e configurar (uma conversa), os vídeos (uma conversa nova pra cada), postar
LICENCA.md         o que você pode e o que não pode fazer com a Máquina Preguiça 3D
NOVIDADES.md       o que mudou em cada versão
AGENTS.md          como a IA trabalha nesta pasta (CLAUDE.md e GEMINI.md apontam pra ele)
comandos/          boas-vindas, instalar, VoiceStudio, novo vídeo, publicar e o jeito por chat (qualquer IA)
canal/             o SEU canal: nome, tema, jeito de falar, personagem, pauta, perfil nas redes e o que a IA aprendeu
metodo/            a fórmula do roteiro e o ritmo dos vídeos
motor/             o motor de animação e o painel (não precisa mexer)
referencias/       o método de cada vídeo (COMO-FAZER-O-VIDEO.md), os 17 cenários prontos com as fotos (cenarios.md e
                   cenarios/), os modelos pra copiar (modelo-construcao/, modelo-natureza/ e modelo-de-cena/), o
                   cardápio de cenas e o índice do que o motor sabe fazer
videos/            uma pasta por vídeo (o vídeo, a capa e o texto de postar; os testes em testes/);
                   videos/exemplo/ é a lanterna, um vídeo pronto
.claude/skills/    os atalhos /instalar, /novo-video, /publicar e /ajuda do Claude Code
```
