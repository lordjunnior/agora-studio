# Kit Animação 3D (grátis), do canal Edu Cria com IA

Pasta pronta para um agente de IA (Claude Code, Gemini CLI…) criar **vídeos animados em cartoon 3D** a partir de 1 prompt.
- Sem IA de vídeo: tudo é código (three.js + Remotion) renderizado no seu PC.
- O que vem pronto: personagens, cenários (cidade, natureza, espaço), câmera, legenda palavra por palavra, sons, molde de miniatura e as regras que o agente segue.

## Precisa ter
- **Node.js 20+:** nodejs.org
- **ffmpeg:** ffmpeg.org (no PATH)
- **Python 3.10+:** python.org (para a voz e as legendas)
- **Um agente de IA** que mexe em arquivos: Claude Code ou Gemini CLI.

## 3 passos
1. Extraia o zip e copie o caminho da pasta `kit-animacao-3d`.
2. Crie uma pasta vazia para os seus vídeos e abra o agente nela.
3. Abra o `PROMPT_MESTRE.md`, preencha o tema e cole o prompt no agente.

Quer ver antes? Dentro de `projeto/` rode `npm install` e depois `npm run exemplo`. Sai um vídeo de 12 s em `projeto/out/exemplo.mp4`.

## O que tem aqui
| Pasta ou arquivo | O que é |
|---|---|
| `PROMPT_MESTRE.md` | o prompt para colar |
| `AGENTE.md` | as regras e a API do kit (o agente lê isso, você não precisa) |
| `projeto/` | projeto Remotion pronto (`src/kit` = peças, `src/exemplo` = vídeo de exemplo) |
| `sons/` | efeitos e trilha sintetizados (sem direitos autorais de terceiros) |
| `scripts/` | voz (ElevenLabs ou grátis local), tempos das palavras, gerador de sons |

## Avisos
- Voz clonada de uma pessoa real? Marque "conteúdo alterado ou sintético" ao publicar no YouTube.
- Modele formatos, não copie vídeos de ninguém.
- Não há promessa de views nem de dinheiro: o resultado depende do seu tema e da sua constância.
