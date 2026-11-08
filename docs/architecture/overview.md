# Arquitetura do ÁGORA

## Objetivo

Oferecer um único ambiente de produção audiovisual. A arquitetura é organizada por capacidades, com contratos claros entre projeto, mídia, áudio, interface e renderização.

## Responsabilidades

### Remotion

Responsável pelo relógio global da composição, sequência de cenas, duração em frames, sincronização temporal e renderização determinística. O projeto de composição declara Remotion 4.0.540.

O adaptador consome o perfil de saída, a sequência ordenada de cenas e as trilhas temporais do projeto. Cada cena declara `metadata.compositionId`, resolvido por um registro explícito de composições disponíveis.

### Three.js e React Three Fiber

Responsáveis pela construção e apresentação dos mundos 3D, personagens, objetos, câmeras, materiais e animações. As cenas React/Three são compostas pelo Remotion.

A implementação 3D existente deve ser validada antes de qualquer reescrita.

### Serviços de produção

Os módulos de geração procedural, revisão, narração, custos, importação e processamento permanecem organizados como serviços do ÁGORA. Eles devem ser encapsulados por contratos estáveis e conectados progressivamente ao fluxo principal.

Não manter renderizadores independentes concorrendo pela composição final do mesmo projeto.

### FFmpeg

Disponível para muxing, normalização, mixagem e operações de pós-processamento que não sejam melhor resolvidas pela composição Remotion.

## Fluxo de produção

1. O usuário cria ou abre um projeto ÁGORA.
2. O projeto guarda roteiro, perfil de saída, cenas, ativos e trilhas.
3. O roteiro é dividido em cenas com duração e conteúdo definidos.
4. Cada cena referencia sua implementação visual por `metadata.compositionId`.
5. As trilhas de áudio referenciam ativos por ID e definem posição, duração e volume.
6. As trilhas de legenda e overlay definem texto, temporização por frames e estilo.
7. O adaptador valida o documento e resolve cada cena pelo registro de composições.
8. Remotion organiza cenas, áudio, legendas e overlays na linha temporal e renderiza os frames.
9. O pipeline finaliza e valida o arquivo de saída.
10. O projeto, versões e artefatos ficam disponíveis para reabertura.

## Contrato e estado da integração

- O formato de projeto é independente do motor de renderização.
- A duração canônica é expressa em frames e FPS; segundos podem ser derivados.
- Cada ativo tem identificador estável, tipo, origem e metadados.
- Cada cena tem identificador, nome, duração, renderer e metadados de composição.
- Adaptadores não devem alterar o documento original do projeto durante o render.
- Toda operação de render deve ser reproduzível a partir de uma versão salva do projeto.

**Implementado e validado:** leitura do projeto JSON, validação estrutural, cálculo da duração total, seleção de cenas registradas, composição vertical, trilhas de música e efeitos, legendas com temporização de palavras, overlays textuais e renderização MP4.

**Ainda não integrado ao adaptador:** sincronização de narração com transcrição real, importação geral de mídia pelo manifesto, edição visual da linha do tempo, persistência e reabertura pela interface.

## Compatibilidade

O projeto de composição declara React 18.3.1, Remotion 4.0.540, Three.js 0.171.0 e React Three Fiber 8.18.0. Os serviços 3D existentes também utilizam Three.js 0.160.0. Essas versões não devem ser forçadas para uma única instalação sem testes: manter isolamento de dependências até validar a compatibilidade.

## Não objetivos desta etapa

- Apagar módulos funcionais antes de validar sua substituição.
- Recriar imediatamente todos os personagens e ambientes.
- Substituir a biblioteca 3D antes de inventariar e testar seus recursos.
- Declarar integração completa antes de conectar mídia, persistência e interface.

## Ponte de narração sincronizada

`projeto/src/project/narrationAdapter.ts` contém `buildNarrationTracks()`, um adaptador tipado para converter a timeline legada de frases e palavras (tempos absolutos em segundos) em trilhas `voice` e `caption` do contrato ÁGORA. A conversão usa o FPS do projeto, transforma os tempos em frames relativos à frase e valida limites, durações e caminhos de áudio. Os segmentos de áudio são fornecidos explicitamente como manifesto (`assetId`, `src`, início e duração); o adaptador não inventa arquivos, não sintetiza voz e não presume onde os áudios estão armazenados.

Estado: adaptador implementado e verificado pelo TypeScript. A ligação automática entre a geração de narração, os arquivos em cache e o carregamento de projetos ainda não está concluída. O motor atual da ElevenLabs já salva alinhamento por caractere e deriva tempos por palavra; a próxima integração deve expor esses resultados e os arquivos de áudio por frase num manifesto real antes de montar e renderizar o projeto.

### Exportação do manifesto de narração

O render agora preserva cada segmento WAV gerado em `agora-import/assets/` e escreve `agora-import/narration-manifest.json`. O manifesto contém FPS, duração, frases, alinhamento por palavra em segundos absolutos e referências aos segmentos de áudio. Isso transforma a saída efêmera do render em um pacote transferível para a pipeline do ÁGORA. A importação desse manifesto para dentro do projeto e a cópia dos ativos para a área pública do Remotion ainda são etapas separadas.

`buildNarrationTracksFromManifest()` também aceita diretamente o formato `narration-manifest.json` (versão 1), calcula a duração em frames e devolve os ativos e as trilhas prontos para serem incorporados ao documento do projeto. Os caminhos `assets/...` permanecem relativos ao pacote exportado e precisam ser copiados para a pasta pública do renderizador antes da renderização Remotion.

### Importacao operacional da narracao

O comando `npm --prefix projeto run narration:import -- <manifest.json> <projeto.agora.json> [saida.agora.json]` importa um manifesto v1, copia os arquivos de audio para `projeto/public/agora-assets/` e grava um documento de projeto com trilhas de voz e legendas sincronizadas. O importador valida a versao, FPS, duracao, caminhos, IDs e intervalos. Por seguranca, interrompe a importacao se a narracao exceder a duracao atual das cenas; nao altera cenas automaticamente.

Teste de integracao executado com um WAV real de exemplo: importacao de ativo, item de voz, frase e tres palavras temporizadas confirmada. TypeScript aprovado. O teste temporario foi removido depois da verificacao. Ainda falta registrar dinamicamente o projeto importado como composicao renderizavel e executar o render final com a narracao importada.

### Render do projeto importado

A composição Remotion `ProjetoExemplo` agora lê `projeto-ativo.agora.json`, que é o destino padrão do importador. Assim, o fluxo passa a ser: gerar narração e manifesto, importar manifesto para o projeto ativo e renderizar a composição sem editar manualmente o código ou o JSON. O projeto de demonstração original permanece separado como modelo de entrada.

Teste ponta a ponta realizado: manifesto com um segmento WAV e quatro palavras temporizadas foi importado para o projeto ativo e renderizado pelo Remotion. O MP4 foi concluído e verificado com FFprobe: H.264, 1080x1920, AAC 48 kHz estéreo, duração 12,011 s. O arquivo de projeto ativo e o áudio de teste foram restaurados/removidos após a validação; o MP4 de teste permanece em `projeto/out/` (ignorado pelo Git).

### Trilhas visuais de mídia

O contrato de projeto agora aceita trilhas `image` e `video`. O importador `npm --prefix projeto run media:import -- <media-manifest.json>` copia os arquivos para `projeto/public/agora-assets/`, registra os ativos e cria itens posicionados por segundos convertidos em frames. Imagens usam `Img`; vídeos usam `Video` do Remotion. Os itens aceitam `fit` (`cover`, `contain`, `fill`), `position`, `opacity` e `scale`; vídeos também aceitam `volume`.

Teste executado com uma imagem real da biblioteca de exemplo: manifesto importado, ativo copiado, trilha de 360 frames validada e MP4 renderizado com sucesso. O projeto ativo foi restaurado e o arquivo de teste removido. O suporte de vídeo foi implementado no renderer, mas ainda precisa de um teste ponta a ponta com um arquivo de vídeo real. Modelos 3D externos ainda não são importados como ativos de timeline; permanecem dependentes de cenas/composições 3D registradas.

### Modelos 3D externos (GLB)

O importador de mídia também aceita `type: "model"` para arquivos `.glb` autocontidos. Cada item entra em uma trilha própria de modelos 3D e é renderizado com Three.js/GLTFLoader dentro do Remotion, com transparência para compor sobre as cenas. O manifesto pode fornecer `model.position`, `model.rotation` (radianos), `model.scale`, `model.spinPerSecond`, `model.cameraPosition`, `model.cameraFov` e `model.ambientIntensity`.

A importação foi validada com um GLB mínimo gerado localmente e a renderização completa de 360 frames terminou com sucesso. A saída foi validada como MP4 H.264, 1080×1920, com áudio AAC. Nesta etapa, o importador limita modelos a GLB autocontido; arquivos `.gltf` com texturas/arquivos externos e animações esqueléticas ainda não estão cobertos pelo fluxo de importação/testes.
