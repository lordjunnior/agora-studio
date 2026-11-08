# VoiceStudio: a voz grátis no computador, passo a passo

> Quando a pessoa escolhe o VoiceStudio no passo 3 de `comandos/instalar.md`, ou pede "voz grátis", "configurar o
> VoiceStudio", "o VoiceStudio não funciona". Siga na ordem, **um passo por vez**: fale o passo, espere a pessoa dizer
> que fez e confira com `npm run voicestudio`, que olha o computador, o programa e as vozes e termina com a linha
> `PRA IA:` dizendo o próximo passo. Fale simples, como no WhatsApp. O VoiceStudio tem muitas abas e opções: a pessoa
> só precisa de três coisas dele (instalar, criar a voz e deixar aberto). Todo o resto, ela pode ignorar.

## O que é, em uma frase

> "O VoiceStudio é um programa grátis que faz a voz dos vídeos no seu próprio computador, sem limite de uso. Ele
> copia uma voz a partir de um áudio curto (pode ser a sua) e narra qualquer texto com ela."

Comparado com a ElevenLabs (falar isso antes de começar, sem assustar):

| | VoiceStudio | ElevenLabs |
|---|---|---|
| Custa | grátis, sem limite | grátis pra testar; pago pra monetizar (uns 5 a 6 dólares por mês) |
| Instalar | de 20 minutos a 1 hora (baixa uns 10 GB) | 5 minutos (só criar a conta e colar a chave) |
| Computador | precisa ser mais forte (abaixo) | qualquer um |
| Velocidade da voz | mais lenta (em PC sem placa de vídeo, bem mais) | rápida |
| Ganhar dinheiro com o vídeo | a voz padrão **não pode** (veja "Licença") | pode, nos planos pagos |

**Não recomendar o VoiceStudio** (e sugerir a ElevenLabs) quando: Mac com chip Intel (não roda), menos de 10 GB livres,
PC antigo e sem placa de vídeo NVIDIA (roda, mas cada vídeo pode levar mais de uma hora pra narrar) ou quando a pessoa
quer monetizar logo.

## Passo 1. Conferir o computador (a IA faz)

Rodar `npm run voicestudio`. A primeira linha diz se o computador aguenta:
- **Mac:** precisa de chip Apple (M1, M2, M3, M4...) e macOS 13.3 ou mais novo. Mac com chip Intel não faz a voz
- **Windows:** 10 ou 11, de 64 bits. Com placa de vídeo NVIDIA a voz sai rápido; sem ela, funciona, só que bem mais devagar
- **Espaço:** uns 10 GB livres (uns 5 GB num PC sem placa NVIDIA)

Se o computador não aguentar, dizer em uma frase e voltar pro passo 3 de `comandos/instalar.md` (ElevenLabs).

## Passo 2. Baixar e instalar

Dois jeitos. O primeiro é a IA que faz; o segundo, a pessoa, com você guiando.

**A. A IA instala** (pedir licença antes: "Posso instalar o VoiceStudio pra você? Vai aparecer pedido de permissão:
pode aceitar"):
- Mac: `curl -fsSL https://voicestudio.sh/install | sh` (escolhe o arquivo certo, confere e já libera o app no Mac)
- Windows (PowerShell normal, não precisa ser administrador): `irm https://voicestudio.sh/install.ps1 | iex`. Ele baixa
  e abre o instalador: a pessoa clica em **Avançar/Instalar** até o fim
- Se o comando der erro ou a sua ferramenta bloquear, use o jeito B

**B. A pessoa baixa** (dizer assim):
> 1. Entre em **github.com/debpalash/VoiceStudio/releases/latest** (é a página oficial do programa)
> 2. Desça até **Assets** e baixe só o arquivo do seu computador:
>    - **Mac:** o que termina em **mac-arm64.dmg** (nunca o "mac-x64", que é de Mac antigo)
>    - **Windows:** o que termina em **win-x64.exe**
>    - **Linux:** o **.AppImage**
> 3. **Mac:** abra o arquivo baixado e arraste o **VoiceStudio** pra pasta **Aplicativos**.
>    **Windows:** abra o arquivo baixado. Se aparecer a tela azul **"O Windows protegeu o computador"**, clique em
>    **Mais informações** e depois em **Executar assim mesmo** (é normal: o programa é novo e ainda não tem a
>    "assinatura" da Microsoft). Depois, **Avançar** até **Concluir**
> 4. Me diga "instalei"

Conferir: `npm run voicestudio` tem que mostrar `[ok] VoiceStudio instalado`.

## Passo 3. A primeira vez que abre (a parte mais demorada)

Dizer antes: "Agora abre o VoiceStudio. Na primeira vez ele baixa as peças dele, uns vários GB: pode levar de 10 a 40
minutos, dependendo da internet. Deixa o computador ligado e na tomada e me fala o que aparecer na tela."

O que pode aparecer, na ordem, e o que responder:

1. **Mac: "VoiceStudio está danificado e não pode ser aberto"**: não está danificado, é a trava do Mac pra programa
   baixado da internet. Com o ok da pessoa, a IA roda `xattr -dr com.apple.quarantine "/Applications/VoiceStudio.app"`
   e pede pra abrir de novo
2. **Mac: "não é possível verificar o desenvolvedor"**: clicar com o botão direito no VoiceStudio (na pasta
   Aplicativos), escolher **Abrir** e depois **Abrir** de novo. No macOS 15 em diante: tentar abrir uma vez, ir em
   **Ajustes do Sistema > Privacidade e Segurança**, descer e clicar em **Abrir Mesmo Assim**
3. **Pergunta sobre estatísticas anônimas** ("Sim, compartilhar estatísticas anônimas"): tanto faz, é opcional. Pode
   recusar
4. **"Configurar meu estúdio" / "Instalar ambiente local"**: clicar. Ele baixa o Python e as bibliotecas dele (vários
   GB). É só esperar
5. **"Pacotes de modelos"** (ele mostra níveis, quantos GB cada um baixa e "Ajustado para" o seu computador): pra
   Máquina, só importa a **voz**. Escolher o nível recomendado pro computador, ou o mais leve se o espaço estiver curto.
   Os níveis maiores baixam também transcrição e tradução, que a Máquina não usa (no Mac em que testamos, o nível de
   qualidade baixou tudo isso e levou uns 20 minutos)
6. **Windows: falta o "Microsoft Visual C++ 2015-2022 Redistributable (x64)"**: baixar em
   **aka.ms/vs/17/release/vc_redist.x64.exe**, instalar e abrir o VoiceStudio de novo
7. **"Liberte pelo menos X GiB"**: falta espaço. Apagar coisas grandes (vídeos antigos, Downloads) e tentar de novo

Terminou quando aparece a tela principal, com o menu do lado (Clonar, Vozes, Dublagem, Transcrever, Configurações...).
Conferir: `npm run voicestudio` tem que mostrar `[ok] VoiceStudio aberto e respondendo`.

**Do menu, a pessoa só vai usar duas coisas: Clonar (ou a Galeria) e, se precisar, Configurações.** Dublagem,
Transcrever, Ditado, Projetos, Histórias, Audiolivro, Ferramentas, chamadas, MCP e Provedores LLM: ignorar. Se ela
perguntar de alguma dessas, dizer que é de outros usos do programa e que a Máquina não precisa.

## Passo 4. O motor de voz certo

O "motor" é a inteligência que fala. O VoiceStudio tem vários; pra português servem estes:

| Motor | Fala português | Bom pra | Licença (pra monetizar) |
|---|---|---|---|
| **OmniVoice** (o padrão, "VoiceStudio") | sim, mais de 600 idiomas | o melhor de saída: copia a voz e o sotaque do áudio de referência | **não comercial**: não pode monetizar |
| **VoxCPM2** | sim (30 idiomas) | voz de estúdio, também copia e desenha voz; mais pesado | Apache 2.0 (em geral permite; veja "Licença") |
| **MOSS-TTS-Nano** | sim (20 idiomas) | PC sem placa de vídeo: rápido no processador | Apache 2.0 (em geral permite; veja "Licença") |
| KittenTTS | **não** (só inglês) | nada pra nós | não usar |

- Na dúvida, **OmniVoice**. Se o `npm run voicestudio` avisar que ele não está instalado: no VoiceStudio, abrir
  **Modelos** (Catálogo de modelos), achar o **OmniVoice** e clicar em **Instalar**
- Em PC sem placa de vídeo, o VoiceStudio sugere motores leves (KittenTTS, Supertonic, PocketTTS): são feitos pra
  inglês. Pra português, use o OmniVoice (mais lento) ou o MOSS-TTS-Nano
- **O motor escolhido na tela do VoiceStudio tem que ser o mesmo da Máquina.** Se a pessoa trocar o motor no
  programa (o seletor de motor fica no topo; atalho Cmd/Ctrl+E), anotar o mesmo na Máquina: `"modelo": "voxcpm2"` ou
  `"modelo": "moss-tts-nano"` dentro do `"voz"` (passo 6). Sem `"modelo"`, a Máquina usa o OmniVoice

## Passo 5. Criar a voz do canal (o mais importante)

Antes, explicar a regra de ouro: **o sotaque sai igual ao do áudio de referência.** Pra sair brasileiro, a voz tem
que vir de um áudio de alguém falando português do Brasil. A **Demo Voice** que vem no programa fala inglês: com ela,
o vídeo sai com sotaque gringo.

Três jeitos. Recomendar o 1 se a pessoa tem uma voz boa pra gravar; senão, o 2.

**1. Copiar uma voz de um áudio (o melhor).**
> 1. Grave de 10 a 20 segundos de fala, em português, num lugar silencioso (sem música, ventilador ou eco: um quarto
>    com cortina ou dentro do carro parado é ótimo). Pode ser no celular. Fale do jeito que o canal vai falar: se o
>    canal é animado, grave animado. Pode ser a sua voz, ou a de alguém que deixou
> 2. Passe o áudio pro computador (WhatsApp Web, e-mail, cabo)
> 3. No VoiceStudio, abra **Clonar** (Clonagem de voz). Em **Áudio de referência**, carregue o arquivo (ou grave ali
>    mesmo, pelo microfone)
> 4. No campo do texto do áudio, escreva o que você falou na gravação, ou deixe vazio que ele escuta sozinho
> 5. Em **Idioma**, escolha **Português**
> 6. Escreva uma frase de teste (ex.: "Como uma pilha tão pequena acende uma lanterna inteira?") e clique em **Gerar**.
>    A primeira vez demora mais (ele carrega a inteligência na memória); depois fica rápido
> 7. Gostou? Clique em **Salvar como perfil de voz**, em **Nome do perfil** escreva **Narrador** (uma palavra, sem
>    acento) e salve. Aparece "Perfil de voz salvo."
> 8. Me diga "salvei a voz"
- Se o VoiceStudio pedir uma declaração de consentimento (dizendo que a voz é sua ou que você tem permissão), é só
  seguir a tela. **Copiar a voz de outra pessoa só com a permissão dela**, nunca de famoso ou de outro canal
- Ficou com chiado, robótica ou com eco? Quase sempre é o áudio de referência: gravar de novo, mais perto do
  microfone, num lugar mais quieto

**2. Escolher uma voz pronta na Galeria.**
> Abra a **Galeria** ("centenas de vozes prontas"), filtre o idioma **Português**, ouça e adicione às suas vozes a que
> você gostar. Confira se o sotaque é do Brasil (tem voz de Portugal também). Me diga o nome dela
- Se ela não aparecer como voz salva no `npm run voicestudio`, abrir a voz e usar **Salvar como perfil de voz**

**3. Descrever a voz (Design de voz).**
> Em **Design de voz**, descreva a voz ("homem de uns 30 anos, voz animada e clara") e gere. Gostou? **Salvar design
> como perfil**, com o nome **Narrador**
- O sotaque brasileiro aqui é menos garantido: testar sempre (passo 6)

Conferir: `npm run voicestudio` tem que listar a voz em `[ok] Vozes salvas no VoiceStudio`.

## Passo 6. Ligar a voz na Máquina (a IA faz)

1. Fazer a amostra: `npm run testar-voz -- --voicestudio Narrador` (troque `Narrador` pelo nome exato que o
   `npm run voicestudio` mostrou; com outro motor, junte `--modelo voxcpm2`). A amostra fica em
   `canal/testes-de-voz/voicestudio-narrador.wav`: mandar o link pra pessoa ouvir
2. Ela aprovou: anotar no bloco "No roteiro.json" de `canal/identidade.md`:
   `"voz": {"motor": "voicestudio", "id": "Narrador", "idioma": "pt-BR", "acelerar": "auto"},`
   (com outro motor: `"modelo": "voxcpm2"` junto). Anotar também no `canal/historico.md`
3. Rodar `npm run voicestudio` (tem que dar `RESULTADO: PRONTO`) e o `npm run conferir`

## Passo 7. Em todo vídeo

- **O VoiceStudio tem que estar aberto** enquanto o vídeo é feito. A IA pode abrir: `npm run voicestudio -- --abrir`
  (abre e espera ficar pronto). Se não conseguir abrir sozinha, pedir pra pessoa abrir e dizer "abri"
- A primeira frase de cada sessão demora mais (ele carrega a voz na memória); as outras vão mais rápido. Num Mac com
  chip M, testado: o programa ficou pronto em uns 10 segundos e a primeira frase saiu em uns 20
- Cada frase narrada fica guardada na pasta do vídeo: refazer o vídeo não narra tudo de novo
- Computador sem placa de vídeo: avisar que a narração pode levar bastante tempo e que é só deixar rodando

## Licença (ler antes de monetizar)

- A voz padrão, o **OmniVoice**, tem licença **não comercial** (CC-BY-NC): serve pra aprender e testar, **não pra
  vídeo que ganha dinheiro**
- **VoxCPM2** e **MOSS-TTS-Nano** são Apache 2.0, uma licença que em geral permite uso comercial. Mas o próprio
  VoiceStudio avisa que não garante nenhum modelo pra uso comercial: antes de monetizar, abrir o **Catálogo de
  modelos**, ler a nota de licença do modelo e, na dúvida, usar a ElevenLabs paga
- A voz copiada também tem dono: só a da própria pessoa ou de quem deu permissão

Dizer isso em uma frase quando a pessoa escolher o VoiceStudio, e de novo quando ela falar em monetizar.

## Se travar

Primeiro, sempre: `npm run voicestudio`. Ele diz o que está faltando e o próximo passo.

| O que aconteceu | O que fazer |
|---|---|
| "O VoiceStudio não está aberto" | `npm run voicestudio -- --abrir`, ou pedir pra pessoa abrir o programa e esperar a tela principal |
| A IA mandou abrir (com `open` ou pelo .exe) e o VoiceStudio não aparece | IA rodando dentro do VS Code, do Cursor ou de outro app Electron: o programa herda uma variável que faz ele fechar na hora, sem erro. Usar `npm run voicestudio -- --abrir`, que já abre do jeito certo, ou pedir pra pessoa abrir pelo Launchpad ou pelo menu Iniciar |
| "ainda está carregando" | esperar 1 ou 2 minutos (na primeira vez, até 40) e conferir de novo |
| Mac: "danificado" ou "desenvolvedor não verificado" | passo 3, itens 1 e 2 |
| Windows: "O Windows protegeu o computador" | **Mais informações** > **Executar assim mesmo** |
| Windows: falta o Visual C++ | passo 3, item 6 |
| O download parou ou ficou lento | conferir a internet; fechar e abrir o VoiceStudio (ele continua de onde parou) |
| "Este modelo exige acesso no Hugging Face" | só pra modelos especiais: em **Configurações > Credenciais**, **Adicionar token do Hugging Face** (conta grátis em huggingface.co). Pra voz da Máquina, normalmente não precisa |
| "não achei a voz" | o nome anotado não bate: `npm run voicestudio` mostra os nomes exatos |
| "Tem mais de uma voz chamada..." | renomear ou apagar a repetida no VoiceStudio |
| O motor que o roteiro pede não está instalado | passo 4 (instalar o OmniVoice em **Modelos**) |
| Sotaque de Portugal ou gringo | o áudio de referência não é brasileiro: passo 5, gravar ou escolher outra voz |
| Voz com chiado, robótica ou com eco | gravar a referência de novo, num lugar mais quieto |
| "O computador ficou sem memória" | fechar outros programas e abas; em **Configurações > Desempenho**, escolher um perfil mais leve |
| Muito lento | normal em PC sem placa de vídeo; fechar outros programas, ou usar o MOSS-TTS-Nano (passo 4) |
| Mac com chip Intel | não faz a voz: ElevenLabs |
| O VoiceStudio usa outro endereço (não o padrão) | anotar no arquivo `.env` a linha `VOICESTUDIO_URL=http://127.0.0.1:<porta>` |

Nada resolveu: o VoiceStudio tem uma comunidade no Discord (link no site **voicestudio.sh**) e o suporte da Máquina é
desconstruindouniverso@gmail.com. Enquanto isso, dá pra fazer o vídeo com a voz do computador (passo 3c de
`comandos/instalar.md`) ou com a ElevenLabs.
