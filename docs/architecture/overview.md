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
