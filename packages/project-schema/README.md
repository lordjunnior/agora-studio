# Contrato de projeto ÁGORA

Este diretório contém o contrato independente de renderer para projetos audiovisuais. O documento JSON é a fonte de verdade; Remotion, Three.js e os adaptadores legados consomem esse contrato.

A versão inicial está em `project.schema.json`. Mudanças incompatíveis exigem incremento de `schemaVersion` e uma estratégia explícita de migração.

Princípios:
- IDs estáveis para projeto, cena, trilha e ativo.
- Tempo canônico em frames + FPS.
- Caminhos de mídia relativos ao projeto sempre que possível.
- Renderer é uma preferência/implementação, não o formato do documento.
- Campos desconhecidos devem ser preservados durante importação quando possível.
