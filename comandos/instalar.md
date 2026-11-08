# Instalar

> No Claude Code: `/instalar`. Em outra IA que trabalha na pasta: "instalar".

Deixa tudo pronto pro primeiro vídeo. Fala simples: quem compra pode nunca ter usado terminal. **Quem roda os comandos é
a IA**: nunca pedir pra pessoa abrir terminal, PowerShell ou o arquivo `.env`.
**Nenhum vídeo começa antes desta instalação terminar**: sem o canal configurado, o vídeo sai genérico e gasta a
cota da IA à toa. Se a pessoa pedir um vídeo no meio, explicar isso em uma frase, anotar o tema em `canal/pauta.md` e
continuar de onde parou.
**Esta conversa é a etapa 1 (configurar)**: ela termina no passo 6, passando a pessoa pra uma conversa nova, onde o
primeiro vídeo é feito (regra número 3 do `AGENTS.md`). Não fazer vídeo nesta conversa.

## 1. A parte técnica (um comando só)

1. **Avisar** em uma frase, antes: "Agora vou instalar as peças da Máquina. Leva de 2 a 10 minutos, e se aparecer um
   pedido de permissão, pode aceitar: sou eu instalando."
2. **Rodar `npm run instalar`**, com tempo limite longo (15 minutos). No Windows, se o `npm` der erro de "execução de
   scripts", `npm.cmd run instalar`; se nem isso, `node motor/instalar.js`. Ele faz sozinho, na ordem:
   - confere o Node.js (precisa ser o 20 ou mais novo)
   - baixa as peças do motor (o motor 3D e o ffmpeg)
   - acha um navegador que desenhe o vídeo: no Windows, o Edge que já vem instalado (nem baixa nada); no Mac e no
     Linux, baixa o Chromium da Máquina. Se um não abrir, tenta o próximo sozinho (Chromium, Edge ou Chrome)
   - testa desenhando 2 imagens do vídeo de exemplo (a lanterna), em `videos/exemplo/testes/`
3. **Ler o fim:** `RESULTADO: INSTALADO` ou `RESULTADO: FALTA`, e a linha `PRA IA:` com o que fazer em seguida. Seguir
   essa linha. Pra pessoa, só o resultado numa linha (sem despejar log). Se quiser, mostrar a imagem do teste (é a
   lanterna: dá gosto de ver que funcionou) e depois apagar a pasta `videos/exemplo/testes/`
4. **Deu FALTA:** explicar pra pessoa com as suas palavras o que ele disse e resolver (veja "Se travar", no fim desta
   página). Depois, rodar `npm run instalar` de novo: ele continua de onde parou

Sem Node (o `npm` nem existe): o passo a passo de `comandos/boas-vindas.md` ("Node.js não instalado").

## 2. O canal (entrevista)

**Já tinha a Máquina (versão antiga)?** O `npm run instalar` avisa no fim se achou uma pasta antiga no computador. Antes
das perguntas, rode `npm run importar`: ele mostra o que vem de lá (o canal, os vídeos, o logo, a chave da voz), sem
mudar nada. Com o sim da pessoa, rode o comando que ele indicar (`npm run importar -- --confirmar`) e pergunte só o que
o `npm run conferir` ainda marcar. Nunca copie as pastas à mão.

**Atalho, o modelo de prompt:** se a pessoa colar o `CONFIGURAR-MEU-CANAL.txt` respondido (começa com "CONFIGURAR MEU
CANAL"), ou preferir responder tudo de uma vez, rode `npm run canal` (mande o arquivo pra ela responder, se ainda não
respondeu). Ele salva as respostas e diz o que ficou em branco: pergunte só isso, uma coisa por vez, e siga pro passo 3
(a voz). Não refaça a entrevista do que já veio respondido nem passe as respostas pros arquivos à mão.

Perguntar **uma coisa por vez**, com um exemplo em cada, e aceitar "escolhe você" (aí sugerir e confirmar):

1. **Nome do canal e @ nas redes.** O mesmo @ em todas as redes
2. **Nicho: do que o canal fala.** Qualquer nicho serve. A fórmula da Máquina é montar uma coisa peça por peça, então
   ela brilha quando o tema tem "como funciona" ou "como foi feito". Se o nicho for outro (história, esportes, games),
   propor o ângulo que encaixa: em história, "como construíram as pirâmides", "como funcionava uma catapulta"; em
   games, "como o controle vibra", "por que o console esquenta". Não prometer o que o motor não faz (filtro de imagem,
   personagens reais, cenas de multidão)
3. **Estilo do vídeo:** o tom da narração (conversado, sério, engraçado, dramático) e o que evitar
4. **Estilo visual:** o personagem (menino ou menina, camiseta ou moletom, cores da roupa e do cabelo; canal de saúde
   pode usar o doutor e canal de obra, o operário), o cenário padrão do canal (um dos 17 prontos: mostrar a foto
   `referencias/cenarios/todos.jpg` e sugerir o que combina com o nicho, ex.: obra → `construcao`, bichos → `natureza`,
   carros → `oficina` ou `cidade`, saúde → `consultorio`, dinheiro → `escritorio`) e a hora padrão (dia, tarde ou
   noite). Cada vídeo ainda pode ter o seu cenário, pelo tema. **O personagem não
   pode ser igual ao de outro canal conhecido**: sugerir 2 ou 3 combinações de cor diferentes
5. **Voz:** de homem ou de mulher, e o tom (calma, animada, séria). De onde a voz vem (ElevenLabs, VoiceStudio ou a do
   computador) a pessoa escolhe no passo 3, logo depois da entrevista
6. **Mecanismo único:** o que todo vídeo do canal tem e os outros não têm. Ex.: "todo vídeo começa com uma pergunta
   polêmica e termina perguntando a opinião de quem assiste"
7. **Estilo da capa.** Ex.: "sempre a pergunta do vídeo, o personagem com cara exagerada e o objeto do tema na mão"
8. **Cor do canal e assinatura falada.** A cor vai na palavra da capa e no botão "Seguir" do fim: sugerir uma que
   combine com o personagem (ex.: coral `#ff7a59`). Assinatura: "E segue o <canal>."
9. **Tem logo?** Ela coloca no painel, no passo 4 (o painel recorta e salva como `canal/logo.png`). Se mandar a imagem
   aqui na conversa, salvar como `canal/logo.png` (quadrado). Aparece redondo no cartão de seguir do fim
10. **Como prefere que eu trabalhe?** (a) te mostrar cada etapa e pedir a sua opinião (recomendado nos primeiros
    vídeos) ou (b) fazer direto e te mostrar só o vídeo pronto

Preencher `canal/canal.md` (nome, @, assinatura, nicho, quem assiste, estilo do vídeo, mecanismo único, estilo da capa,
fechamento e chamada, hashtags) e `canal/identidade.md` (personagem, cenário e hora, voz, cor do canal, e o bloco
"No roteiro.json" com as cores em `#rrggbb`, a `cor` do canal e o `arroba`). Trocar **todos** os campos de exemplo entre
colchetes. A resposta 10 vai em "Jeito de trabalhar" de `canal/aprendizados.md`. Mostrar o resumo e perguntar se está
certo.

**Dica pra pessoa, no fim da entrevista** (uma vez, com as suas palavras): quanto mais ela contar do canal (pra quem
é, um vídeo de outro canal que ela admira e por quê, o que ela não quer de jeito nenhum), melhor sai o primeiro vídeo.
E dá pra contar mais a qualquer hora: tudo vai pra `canal/`.

## 3. A voz do canal (sempre perguntar)

O vídeo precisa de uma voz, e é a pessoa que escolhe de onde ela vem. **Nunca pular este passo**, nem escolher sozinho,
nem deixar pra depois sem perguntar: o `npm run conferir` só dá PRONTO com a voz escolhida. Explicar as 3 opções em
palavras simples, com a sua sugestão (adaptar ao que a pessoa já contou):

> Agora a voz que vai narrar os seus vídeos. Tem 3 jeitos:
> 1. **ElevenLabs (a melhor, eu recomendo):** voz de gente de verdade, em português. Tem plano grátis pra testar (uns
>    10 minutos de narração por mês, mas sem poder ganhar dinheiro com os vídeos); pra monetizar, o plano pago mais
>    barato (uns 5 a 6 dólares por mês). Você cria uma conta no site e eu abro uma janelinha com o passo a passo e uma
>    caixa pra colar a "chave" da conta (é como uma senha). Uns 5 minutos
> 2. **VoiceStudio (grátis, no seu computador):** um programa gratuito que faz a voz no seu próprio computador, sem
>    limite. Precisa de um computador mais forte (Mac com chip M1 ou mais novo, ou Windows com placa de vídeo boa; sem
>    isso funciona, só demora mais) e uns 20 a 40 minutos pra instalar e baixar a voz. A voz padrão dele não pode ser
>    usada em vídeo que ganha dinheiro (licença não comercial)
> 3. **Voz do computador (só pra testar):** já funciona, mas é robótica. Não serve pra postar
>
> Eu iria na 1: dá pra começar no grátis e, quando o canal for monetizar, subir pro pago. Qual você prefere?

A escolha vai no bloco "No roteiro.json" de `canal/identidade.md`, na linha `"voz"` (os 3 formatos estão lá), e no
`canal/historico.md`. Dá pra trocar quando quiser: é só a pessoa pedir.

### 3a. ElevenLabs

1. **Abrir a janelinha da chave:** rodar `npm run chave`. Abre uma janela no navegador da pessoa com tudo: o botão pra
   entrar na ElevenLabs, o botão pra página das chaves, o passo a passo e uma caixa pra colar a chave com o botão
   **Salvar**. A janela salva no arquivo certo (`.env`), testa com a ElevenLabs e mostra se funcionou e quanto sobra do
   plano. O comando volta na hora e a janela espera até 30 minutos
2. **Dizer pra pessoa**, com as suas palavras: "Abri uma janelinha no seu navegador. Ela mostra onde pegar a chave na
   ElevenLabs: é só criar a conta, criar a chave, colar lá e clicar em Salvar. A própria janela diz se funcionou. Depois
   me diga 'salvei'." Se ela não sabe o que é a chave: "é uma senha da sua conta na ElevenLabs, que deixa a Máquina usar
   a voz de lá; ela fica só no seu computador"
   - **A janela não abriu:** mandar pra pessoa o endereço que o comando mostrou (`http://127.0.0.1:...`), pra ela clicar
   - **A janela mostrou erro ou disse que não salvou** (alguns programas de IA fecham a janela quando o comando
     termina): rodar `npm run chave -- --esperar`, com tempo limite de 15 minutos. Esse jeito só termina quando a pessoa
     salvar, e mostra o resultado no fim
   - **A pessoa colou a chave na conversa:** rodar `npm run chave -- <a chave>` (salva e testa), sem repetir a chave na
     resposta, e avisar que já guardou
   - **Nunca** pedir pra pessoa abrir o `.env`, o terminal ou o PowerShell, nem criar `.env.local`, `.env.txt` ou outro
     nome. Nunca mostrar o conteúdo do `.env`
3. **Conferir:** quando ela disser "salvei", seguir pro passo 4. A janela já testou; se a ElevenLabs tiver recusado, ela
   mesma pediu pra copiar de novo e não salvou
4. **Testar e escolher a voz:** rodar `npm run vozes`. Ele testa a chave (se a ElevenLabs recusar, a chave foi copiada
   pela metade: `npm run chave` de novo) e lista as vozes da conta, as de português primeiro, cada uma com o id. Sugerir 3 que
   combinem com a resposta 5 e fazer as amostras: `npm run testar-voz -- <id1> <id2> <id3>` (cada amostra gasta uns 110
   caracteres do plano e fica em `canal/testes-de-voz/<nome-da-voz>.mp3`). Passar os links pra pessoa ouvir e escolher
   - Sem voz de português na conta: "No site, abra **Voices** > **Voice Library**, filtre o idioma **Portuguese**, ouça
     e clique em **Add to my voices** nas que gostar. Depois me avise." E rodar o `npm run vozes` de novo
5. **Anotar** no bloco "No roteiro.json" de `canal/identidade.md`:
   `"voz": {"motor": "elevenlabs", "id": "<id>", "velocidade": 1.1, "acelerar": "auto"}`
6. **Contar os créditos:** 1 minuto de vídeo gasta uns 1.000 caracteres (o `npm run conferir` mostra quanto sobra e
   quando renova). Frase já narrada fica guardada: refazer o vídeo não gasta de novo. Antes de monetizar, o plano tem
   que permitir uso comercial (o grátis não permite)

### 3b. VoiceStudio (grátis, no computador)

**O passo a passo completo, com o que dizer em cada tela do programa, está em `comandos/voicestudio.md`: seguir ele,
um passo por vez.** E conferir cada passo com `npm run voicestudio`, que olha o computador, o programa e as vozes e diz
o próximo passo. O resumo:
1. **O computador aguenta?** Mac com chip Apple (M1 ou mais novo) e macOS 13.3 ou mais novo, ou Windows 10/11 de 64
   bits, com uns 10 GB livres. Mac com chip Intel não faz a voz: recomendar a ElevenLabs
2. **Instalar e abrir a primeira vez:** a IA instala (Mac: `curl -fsSL https://voicestudio.sh/install | sh`; Windows:
   `irm https://voicestudio.sh/install.ps1 | iex`) ou a pessoa baixa no site. Na primeira vez que abre, ele baixa vários
   GB (de 10 a 40 minutos)
3. **Criar a voz do canal** no VoiceStudio, a partir de um áudio de alguém falando português do Brasil (o sotaque sai
   igual ao do áudio; a Demo Voice que vem nele fala inglês), e salvar como perfil de voz com o nome **Narrador**
4. **Amostra:** `npm run testar-voz -- --voicestudio Narrador`. Aprovada, anotar no bloco "No roteiro.json" de
   `canal/identidade.md`: `"voz": {"motor": "voicestudio", "id": "Narrador", "idioma": "pt-BR", "acelerar": "auto"}`
5. **Avisar:** o VoiceStudio fica aberto enquanto o vídeo é feito (`npm run voicestudio -- --abrir` abre e espera), e a
   voz padrão dele (OmniVoice) é **não comercial**: pra monetizar, ElevenLabs paga ou outro motor com licença comercial
   (seção "Licença" do guia)

### 3c. Voz do computador (só pra testar)

Anotar `"voz": {"motor": "teste"}` e avisar que é robótica: pra postar, trocar depois pela ElevenLabs ou pelo
VoiceStudio (é só pedir "quero trocar a voz").

## 4. O perfil nas redes e o painel

O que vai na página do canal em cada rede. É opcional (o conferir não trava sem isso), mas leva 2 minutos:
1. **Escrever as descrições** em `canal/perfil.md`, no jeito de falar do canal, cada uma na sua seção (troque o
   comentário `<!-- ... -->` pelo texto):
   - **YouTube** (até 1.000 caracteres): do que o canal fala, pra quem, o mecanismo único em palavras simples e um
     convite pra se inscrever. As palavras que alguém digitaria na busca entram no começo
   - **TikTok** (até 80): uma frase curta que diz o que a pessoa ganha seguindo
   - **Instagram** (até 150): uma ou duas frases, com o mesmo convite
   - Sem promessa que o canal não cumpre, sem copiar bio de outro canal, no máximo 1 ou 2 emojis
2. **Abrir o painel:** `npm run painel`. Dizer pra pessoa, com as suas palavras: "Abri o painel da Máquina no seu
   navegador. Em Comece aqui você vê o que já está pronto; em Meu canal você confere o nome do canal, coloca o logo e a
   capa do YouTube e vê as descrições que eu escrevi, com botão de copiar. Pode mudar o que quiser lá mesmo. Quando
   acabar, me diga 'pronto'."
   O logo e o banner ela escolhe no próprio painel (ele recorta e salva no lugar certo). Não tem logo nem banner? Tudo
   bem: o fim do vídeo mostra a inicial do canal
   - O painel não abriu ou fechou sozinho: mandar pra pessoa o endereço que o comando mostrou; se fechar quando o
     comando termina, `npm run painel -- --esperar` (tempo limite de 15 minutos)
3. Quando ela disser "pronto", ler o `canal/canal.md` e o `canal/perfil.md` de novo (ela pode ter mudado o nome ou as
   descrições no painel) e anotar no histórico

## 5. Conferir e pronto

Rodar `npm run conferir`. Só quando ele responder **PRONTO**:
1. Anotar a primeira linha em `canal/historico.md` ("canal" · canal configurado: nome, nicho e jeito de trabalhar)
2. Mostrar o relatório de novo, agora com tudo ✅ (e os opcionais que ficaram pra depois), e dizer que o personagem
   novo aparece no primeiro vídeo
3. Passar as **Dicas** de `comandos/boas-vindas.md` e contar que, daqui pra frente, tudo o que a pessoa pedir ou
   opinar fica anotado em `canal/historico.md`, e o que a IA aprender, em `canal/aprendizados.md` (ela pode abrir e
   editar quando quiser)
4. Seguir pro passo 6. **Não começar o vídeo nesta conversa**

Se ele listar algo faltando, resolver antes.

## 6. A passagem pra conversa nova (o fim desta conversa)

O primeiro vídeo é feito numa conversa nova (regra número 3 do `AGENTS.md`): esta conversa já gastou boa parte da
memória da IA com a instalação e a entrevista.
1. **Escolher 3 temas** pro primeiro vídeo (da `canal/pauta.md`, o que a pessoa pediu durante a instalação ou que
   combinem com o nicho) e **anotar na `canal/pauta.md`**, com a pergunta do gancho de cada um: a conversa nova não vê
   esta, só os arquivos
2. Anotar no `canal/historico.md`: "canal · configuração pronta → próximo: o primeiro vídeo, numa conversa nova
   (sugeri <tema A>, <tema B> e <tema C>)"
3. Mandar a mensagem de passagem, adaptada (o jeito de abrir a conversa nova é o do programa que a pessoa usa: tabela
   na regra número 3 do `AGENTS.md`):

> Pronto: a Máquina está instalada e o seu canal configurado! 🎉
>
> Agora vem a parte boa: os vídeos. **Cada vídeo é feito numa conversa nova comigo.** A instalação ocupou boa parte
> da minha memória nesta conversa; numa conversa nova eu leio tudo do seu canal do zero e o vídeo sai bem melhor.
> Nada se perde: está tudo guardado na pasta.
>
> 1. Abra uma conversa nova: <como, no programa dela>
> 2. Escreva lá: **faz um vídeo sobre <tema A>** (no Claude Code: `/novo-video <tema A>`)
>
> Outras ideias pro primeiro: <tema B> e <tema C>. Eu iria no <tema A>, porque <motivo curto>.
> O painel continua aberto no navegador: o vídeo novo aparece em **Vídeos** assim que eu começar.

Se a pessoa insistir em fazer o vídeo nesta mesma conversa, fazer (`comandos/novo-video.md`), avisando uma vez que numa
conversa nova sai melhor.

## Se travar

Primeiro, sempre: rodar `npm run instalar` de novo. Ele confere tudo, conserta o que dá e diz o que falta. Os casos
mais comuns, com o que fazer:

| O que apareceu | O que fazer |
|---|---|
| "npm não é reconhecido", "node não é reconhecido", "command not found" | Falta o Node.js: o passo a passo de `comandos/boas-vindas.md` ("Node.js não instalado") |
| "a execução de scripts foi desabilitada neste sistema", "npm.ps1 não pode ser carregado" (Windows) | Usar `npm.cmd` no lugar de `npm` (`npm.cmd run instalar`) ou `node motor/instalar.js`. Não mexer na política do Windows |
| O seu programa pede permissão pra rodar um comando, usar a internet ou abrir um programa | Dizer pra pessoa que é a Máquina instalando ou desenhando o vídeo e que pode aceitar. No Codex, se travar sempre, ela pode escolher "Acesso completo" |
| Sem internet: ENOTFOUND, ETIMEDOUT, EAI_AGAIN, "network" | Se a sua ferramenta bloqueia a internet (sandbox), pedir a permissão. Sem bloqueio, pedir pra pessoa conferir o Wi-Fi e rodar de novo |
| "o Chromium falhou ao iniciar", "erro de configuração do Windows", "side-by-side", "spawn EPERM" | Não consertar na mão: `npm run instalar` testa o Edge e o Chrome sozinho e baixa o Chromium de novo se precisar. Se nenhum abrir, ele explica (permissão, antivírus) |
| Antivírus avisou ou apagou um arquivo | Pedir pra pessoa liberar a pasta da Máquina no antivírus (ou mover a pasta pra Documentos) e rodar de novo |
| EPERM, EBUSY, "acesso negado" ao baixar as peças | Algum programa segurando os arquivos (antivírus, OneDrive). Fechar e rodar de novo; se repetir, mover a pasta da Máquina pra Documentos, fora do OneDrive |
| O comando demorou e parou no meio | Rodar de novo com tempo limite maior (15 minutos): ele continua de onde parou |
| A janelinha da chave não abriu ou não salvou | Passo 3a: o endereço pra pessoa clicar, ou `npm run chave -- --esperar` |
| Linux: falta o `espeak-ng` | `sudo apt install -y espeak-ng` (pede a senha do computador: a pessoa digita) |

Nada disso resolveu: suporte em desconstruindouniverso@gmail.com, com o print do erro, o sistema do computador e o que
a pessoa estava fazendo. **Não instalar outra coisa** pra contornar (Remotion, HyperFrames, Python, outro navegador): a
Máquina não usa e só complica.
