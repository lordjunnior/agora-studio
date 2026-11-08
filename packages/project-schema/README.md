# Contrato de projeto ÁGORA

Este diretório contém o contrato independente de renderer para projetos audiovisuais. O documento JSON é a fonte de verdade; Remotion, Three.js e os adaptadores de mídia consomem esse contrato.

A versão inicial está em `project.schema.json`. Mudanças incompatíveis exigem incremento de `schemaVersion` e uma estratégia explícita de migração.

## Estrutura

- `profile`: dimensões e FPS do vídeo.
- `scenes`: sequência ordenada de cenas, cada uma com ID, nome, duração em frames, renderer e metadados.
- `scenes[].metadata.compositionId`: chave que seleciona a implementação visual registrada no renderer.
- `tracks`: trilhas temporais para cenas, voz, música, efeitos, legendas e overlays.
- `tracks[].items[]`: itens temporais com referência a ativo, início e duração em frames e volume opcional.
- `assets`: referências a mídia, modelos, fontes e outros recursos.

## Regras

- IDs estáveis para projeto, cena, trilha e ativo.
- Tempo canônico em frames + FPS.
- Caminhos de mídia relativos ao projeto sempre que possível.
- Renderer é uma preferência/implementação, não o formato do documento.
- Campos desconhecidos devem ser preservados durante importação quando possível.
- A composição não pode alterar o documento original durante a renderização.
- Itens de voz, música e efeitos devem apontar para um ativo existente e permanecer dentro da duração total do projeto.

O adaptador Remotion já lê o perfil, organiza cenas, resolve ativos e posiciona trilhas de áudio na linha do tempo. A integração de legendas, overlays, carregamento geral de mídia e persistência será feita em etapas posteriores, com validação própria.
