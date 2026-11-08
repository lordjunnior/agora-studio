# AGENTE.md: regras para o agente de IA (Claude Code, Gemini CLI ou outro)

Você vai criar **um vídeo animado em estilo cartoon 3D**:
- personagens 2D com contorno de tinta dentro de um mundo 3D colorido;
- legenda palavra por palavra;
- narração;
- trilha e efeitos.

Ferramentas: **three.js** dentro do **Remotion**, renderizado no computador do usuário. Não use IA de geração de vídeo nem de imagem.

**Para economizar limite:**
- Leia SÓ este arquivo e o `projeto/src/exemplo/Exemplo.tsx`.
- NÃO abra `toon.ts`, `ink.ts`, `paint.ts`, `cenarios.ts` nem `personagens.ts` inteiros: a API está resumida abaixo.
- Só abra um trecho deles se der erro.

## 0. Preparar (só na 1ª vez)
1. Confira estes programas:
   - `node -v` (precisa 20 ou mais);
   - `ffmpeg -version`;
   - `python --version` (3.10 ou mais).
2. Se faltar algum, diga ao usuário o comando oficial de instalação. Não instale nada escondido.
3. Rode `npm install` dentro de `projeto/`.
4. O projeto do usuário fica numa pasta dele, com uma cópia de `projeto/` (ou trabalhe direto no `projeto/` do pack se ele pedir).

## 1. Roteiro
Escreva `roteiro.txt` no idioma pedido, no ritmo de cerca de 2,7 palavras por segundo. Exemplo: 60 s dá cerca de 160 palavras.

Fórmula:
1. **Gancho (até 2 s):** o fato absurdo ou a pergunta, numa frase só. Ex.: "Se a Lua sumisse hoje, a primeira coisa que você ia notar é… o mar."
2. **Cenário:** onde e quando, em uma frase.
3. **Escalada:** 3 ou 4 batidas, cada uma maior que a anterior.
4. **Virada:** o momento mais surpreendente.
5. **Explicação:** uma ideia científica só, com uma analogia do dia a dia.
6. **Fecho:** volta ao gancho e termina com uma pergunta para o comentário ("Você ia notar primeiro o mar ou a noite? Comenta.").

Regras:
- Todo fato tem que ser verdadeiro. Liste as fontes no fim do `roteiro.txt`, depois de uma linha `---`.
- Na dúvida, diga "cientistas estimam".
- Nunca descreva o que a imagem já mostra.
- Nada de copiar roteiro, personagem ou cena de vídeo de outra pessoa. Modelar o formato pode; copiar, não.

**Modo "perguntar":** pare aqui, mostre o roteiro e espere o OK. **Modo "automático":** siga direto.

## 2. Voz
A escolha está no campo VOZ do prompt.

**ElevenLabs:**
```
python scripts/voz_elevenlabs.py roteiro.txt projeto/public/<nome>/voz.mp3 <voice_id>
```
- A chave fica na variável de ambiente `ELEVENLABS_API_KEY`. **Nunca** escreva a chave em arquivo, código ou log.
- Gere cada texto uma vez só, porque cada geração gasta crédito.

**Local e grátis:**
```
python scripts/voz_local.py roteiro.txt projeto/public/<nome>/voz.wav
```
- Na 1ª vez, instale o Piper: `python -m pip install piper-tts`. A voz padrão é pt-BR.

**Depois da voz, gere os tempos das palavras:**
```
python scripts/palavras.py <voz> roteiro.txt projeto/src/<nome>/words.json pt
```
- Na 1ª vez: `python -m pip install faster-whisper numpy`.
- Confira as palavras impressas e corrija na mão o que vier errado.

## 3. Cenas
1. Copie `projeto/src/exemplo/` para `projeto/src/<nome>/`.
2. Registre a composição em `projeto/src/Root.tsx`:
   - vertical: 1080x1920;
   - horizontal: 1920x1080;
   - `durationInFrames = quadros(words)`.
3. **Plano de cenas:** cada frase do roteiro vira 1 cena (ou mais), marcada pela palavra em que começa: `const T = cue(/^palavra/, depoisDe, reserva)`.
4. Regras de cena:
   - Um corte a cada 2 a 4 s.
   - Toda reação visual cai na palavra (o `cue` já adianta 2 quadros).
   - Câmera: aproximação lenta dentro do plano. Mudança grande é CORTE, com uma `<Sequence>` nova.
   - Impacto: `kick(T, t)` no tremido da câmera + o som `impacto`.
   - Personagens têm expressão que muda com a fala. Ninguém fica parado com cara neutra.
   - Pelo menos 1 elemento novo por vídeo: um medidor na tela, um objeto que cresce, um mapa. É isso que deixa o vídeo autoral.

### API do kit (`projeto/src/kit/`)

**Montagem básica** (veja o Exemplo):
```tsx
<Cena3D montar={(scene) => ({ root, estado })} quadro={(estado, t, cam, scene) => { ... }} tinta={true | {widthNear, widthFar}} />
```

**cenarios.ts**
| Função | Uso |
|---|---|
| `criarMundo(luz, solDir?)` | Cria o mundo. `luz`: "dia", "por", "noite" ou "espaco". Devolve `{ root, sol }`. |
| `aplicarNevoa(scene, mundo, perto, longe)` | Névoa de distância. |
| `chao(root, { tam, tipo, cor })` | Chão. `tipo`: "grama", "pedra", "areia" ou "lisa". |
| `mar(root, tam, y)` | Água. |
| `casa(root, x, z, { w, d, h, yaw, parede, telhado, seed })` | Casa de 2 águas com fachada pintada. |
| `arvore(root, x, z, h, cor, seed)` | Árvore. |
| `cidade(root, { raio, livre, seed })` | Cidadezinha em grade, com um centro livre para a ação. |
| `nuvem(root, x, y, z, largura, seed, luz)` | Nuvem. |
| `estrelas(root, n)` | Céu estrelado. |
| `planeta(root, tipo, raio, [x, y, z], seed)` | Planeta pintado. `tipo`: "terra", "lua", "marte", "gasoso" ou "sol". |
| `toon(cor, textura?)` | Material de 2 tons para qualquer `THREE.Mesh` que você criar: caixa, cilindro, esfera, ExtrudeGeometry… |

**personagens.ts**
- `new Personagem(root, ELENCO.x, { altura, seed })`. Elenco disponível: crianca, mae, pai, cientista, vovo, astronauta, chef, turista. Para variar: `{ ...ELENCO.pai, jacket: "#cor" }`.
- A cada quadro chame `p.pose({ x, y, z, expr, modo, fase, lado, espelho, olhar, aceno, inclina, t }, cam, visivel)`:
  - `expr`: neutral, stern, grin, laugh, whistle, nervous, shock, relief, relief_open, dazed, pained, smile, smile_closed, lick;
  - `modo`: "stand", "stroll", "march", "sit" ou "fall";
  - para andar: `modo: "stroll"`, `fase: t`, e mova o x/z no tempo;
  - `lado: true` mostra o perfil; `espelho: true` vira para a esquerda;
  - passe sempre `t`: é ele que faz a piscada automática.

**camera.ts**
- `camNoTempo([{ t, c: { pos, look, fov }, corte? }], t)`
- `orbita(alvo, graus, raio, altura, fov)`
- `pushIn(c, t0, t1, t, quanto)`
- `aplicarCam(cam, c, tremido)`

**tempo.ts**
- `criarCue(words)` devolve `cue(regex, depoisDe, reserva)`.
- Curvas: `ss`, `sss`, `pop`, `kick`, `lerp`, `clamp`.
- `quadros(words)` dá a duração em quadros.

**Outros**
- `Legenda`: `<Legenda palavras={W} max={3} base={28} />`. Fica FORA das `<Sequence>`. No horizontal use `base={12}` e `tamanho={64}`.
- `Miniatura`: `<Still>` com `imagem`, `texto[]` e `selo`.

**Objetos novos** (foguete, onda, prédio…):
- Monte com geometria simples do three.js e `toon(cor)`.
- O contorno de tinta sai automático.
- Coisas que NÃO devem ter contorno (brilho, partícula, céu) vão para a camada NOINK: `obj.layers.set(NOINK)`, importando de `kit/ink`.

## 4. Som
1. Copie de `sons/` para `projeto/public/<nome>/` os arquivos que for usar.
2. No componente:
```tsx
import { Audio, Sequence, staticFile, interpolate } from "remotion";
<Audio src={staticFile("<nome>/voz.mp3")} />
<Audio src={staticFile("<nome>/trilha_curiosa.wav")} volume={0.16} loop />
<Sequence from={Math.round(T_IMPACTO * 30)}><Audio src={staticFile("<nome>/impacto.wav")} volume={0.5} /></Sequence>
```
3. Efeitos disponíveis: whoosh (corte), pop (algo aparece), ding (fato), impacto, clique, subida (antes da virada), surpresa.
4. A trilha fica bem abaixo da voz.

## 5. Conferir antes de renderizar (barato)
1. Renderize de 4 a 6 quadros soltos em baixa resolução e OLHE cada um:
```
npx remotion still src/index.ts <Composicao> out/teste_<quadro>.png --frame=<quadro> --scale=0.4
```
2. Confira:
   - personagem visível e no tamanho certo;
   - câmera sem atravessar parede;
   - legenda sem cobrir rosto;
   - cena batendo com a fala.
3. Corrija e repita só os quadros que mudaram. **Nunca** renderize o vídeo inteiro só para testar.

## 6. Render final
```
npx remotion render src/index.ts <Composicao> out/<nome>.mp4 --concurrency=2
```
- PC fraco: use `--concurrency=1`.
- 2K vertical: `--scale=1.3333333333333333`.

## 7. Miniatura
1. Salve o quadro mais forte: `npx remotion still ... --frame=<n> public/<nome>/quadro.jpg --image-format=jpeg`.
2. Renderize a `Miniatura` com `--props='{"imagem":"<nome>/quadro.jpg","texto":["E SE A LUA","SUMISSE?"],"selo":"E SE?"}'`.

## 8. Entregar
Diga ao usuário:
- o caminho do mp4 e da miniatura;
- a sugestão de título, descrição e 3 hashtags;
- o lembrete: **voz clonada de pessoa real exige marcar "conteúdo alterado ou sintético" no YouTube**;
- quanto tempo levou.

Não publique nada: quem posta é o usuário.
