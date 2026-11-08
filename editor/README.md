# ÁGORA Visual Editor

Primeira interface visual de edição sobre o contrato de projeto já utilizado pelo renderer Remotion.

## Executar

Requer Node.js 20 ou superior.

```bash
cd editor
npm install
npm run dev
```

Abra http://127.0.0.1:5174.

## Recursos desta primeira entrega

- Abre o projeto de demonstração como ponto de partida.
- Importa e valida documentos `.agora.json`.
- Pré-visualiza a composição pelo Remotion Player.
- Exibe trilhas de áudio, imagem, vídeo, modelos 3D, legendas e overlays.
- Permite selecionar clipes, reposicioná-los por arrastar e editar propriedades no inspetor.
- Permite adicionar trilhas vazias.
- Mantém salvamento automático local do projeto no navegador e recupera o último projeto aberto.
- Oferece desfazer/refazer (até 50 estados) e atalhos Ctrl+Z, Ctrl+Y e Ctrl+S.
- Importa imagens, vídeos e áudios diretamente pela interface.
- Mantém biblioteca persistente no computador em `editor/media-library.json`, com arquivos em `projeto/public/uploads`.
- Registra nome, tipo, MIME, tamanho, data e duração detectada quando disponível.
- Adiciona cada arquivo enviado ao projeto e cria automaticamente o clipe na trilha correspondente da timeline.
- Permite escolher se áudios novos entram em Narração, Música ou Efeitos.
- Envia o projeto atual para uma fila local de renderização do Remotion e gera MP4 com os props reais do projeto.
- Exibe estado, progresso, logs, cancelamento e link para baixar o MP4 concluído.
- Exporta o documento editado em JSON para backup e intercâmbio.

## Biblioteca de mídia local

O `ABRIR-PAINEL.bat` inicia os serviços locais: painel, editor e servidor da biblioteca/fila. A API escuta apenas em `127.0.0.1:5175`; o editor acessa os endpoints por proxy local. O limite atual por arquivo é 2 GB. Formatos aceitos: JPG, PNG, WebP, GIF, MP4, MOV, WebM, MP3, WAV, M4A, AAC, OGG, OPUS e FLAC.

Os arquivos importados ficam no computador e não são enviados a serviços externos. A biblioteca é independente do projeto aberto: os arquivos permanecem disponíveis para reutilização em outros projetos. O projeto aberto mantém sua própria lista de ativos e o salvamento automático do navegador continua local.

## Limites explícitos

Esta ainda não é uma estação de edição completa. Não há sincronização em nuvem, remoção/organização avançada da biblioteca, edição por waveform, alças de trim, keyframes, multi-seleção ou renderização em paralelo. A fila processa um trabalho por vez no computador local; os arquivos finais ficam em `projeto/out` e também podem ser baixados pela interface.

O editor compartilha os tipos e a composição Remotion existentes. O diretório público de mídia aponta para `projeto/public`, para que a prévia e o renderizador resolvam os mesmos ativos.