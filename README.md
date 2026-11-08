# ÁGORA

**Da ideia ao vídeo.**

ÁGORA é uma plataforma inteligente de criação audiovisual. Seu ambiente reúne criação de projetos, roteiro, cenas 2D e 3D, personagens, cenários, câmera, áudio, legendas, revisão e renderização em um fluxo único.

> A plataforma está em integração progressiva. Cada recurso será considerado disponível somente depois de validado.

## Princípios

- Uma identidade, uma experiência e uma arquitetura: ÁGORA.
- Preservar capacidades funcionais e validá-las antes de qualquer substituição.
- Usar Remotion como orquestrador temporal de composições, timeline e renderização.
- Usar Three.js e React Three Fiber para cenas e elementos 3D.
- Manter FFmpeg para processamento final de áudio e vídeo quando necessário.
- Unificar projetos, cenas, mídia, áudio, versões e exportações em um modelo de dados comum.
- Não expor nomes, marcas ou identidades de ferramentas anteriores na interface, documentação ou experiência do produto.
- Não remover módulos antes de validar a substituição por testes de ponta a ponta.

## Estrutura

- `motor/`: serviços de produção, geração procedural, áudio, revisão e processamento.
- `projeto/`: composição, timeline e renderização com Remotion.
- `docs/`: arquitetura, contratos e plano de evolução.
- `packages/project-schema/`: contrato inicial do projeto audiovisual.

## Requisitos

- Node.js 20 ou superior.
- Dependências dos módulos instaladas conforme os comandos disponíveis.
- Dependências Remotion instaladas em `projeto/`.

## Comandos

Na raiz:

```bash
npm run instalar
npm run conferir
npm run video -- videos/<tema>
npm run painel
npm run remotion:studio
npm run remotion:render:example
npm run remotion:typecheck
```

Para instalar as dependências de composição:

```bash
cd projeto
npm install
```

## Arquitetura

Remotion é o orquestrador de tempo e composição. O adaptador 3D usa Three.js / React Three Fiber. Os serviços de produção permanecem organizados em módulos até que suas capacidades sejam integradas e verificadas. Consulte [a arquitetura](docs/architecture/overview.md) e [o plano de evolução](docs/migration/plan.md).

## Estado

A base atual inclui composição Remotion, trilhas de áudio e mídia visual, importação e renderização de modelos GLB, validação de MP4 e a primeira versão do editor visual. O editor já permite pré-visualizar, selecionar e reposicionar clipes, editar propriedades e importar/exportar documentos de projeto. Persistência automática, upload de mídia pela interface, undo/redo, trim por alças, keyframes, waveform e fila de renderização integrada continuam em desenvolvimento.
