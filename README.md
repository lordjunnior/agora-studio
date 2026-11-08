# ÁGORA

**Da ideia ao vídeo.**

ÁGORA é uma plataforma inteligente de criação audiovisual. Este repositório reúne a base funcional da Máquina Preguiça 3D e o motor de composição do Kit Animação 3D, sob uma arquitetura e identidade inteiramente novas.

> O produto está em fase de integração. Nem todos os módulos listados nos projetos de origem estão conectados à experiência unificada ainda.

## Princípios

- Preservar recursos existentes que forem validados.
- Usar Remotion como orquestrador temporal de composições, timeline e renderização.
- Usar Three.js e React Three Fiber para cenas e elementos 3D.
- Manter FFmpeg para processamento final de áudio e vídeo quando necessário.
- Unificar projetos, cenas, mídia, áudio, versões e exportações em um modelo de dados comum.
- Reconstruir a interface e a identidade visual do zero. Não reutilizar mascote, paleta ou interface antiga.
- Não remover motores legados antes de validar a substituição por testes de ponta a ponta.

## Estrutura atual

- `motor/`: motor procedural e ferramentas herdadas da Máquina Preguiça 3D.
- `projeto/`: projeto Remotion + React + Three.js + React Three Fiber herdado do Kit Animação 3D.
- `docs/`: arquitetura, contratos e plano de integração.
- `packages/project-schema/`: contrato inicial do projeto audiovisual unificado.

## Requisitos

- Node.js 20 ou superior.
- Dependências do motor legado instaladas conforme os scripts existentes.
- Dependências Remotion instaladas separadamente em `projeto/`.

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

Para instalar as dependências do Remotion:

```bash
cd projeto
npm install
```

## Direção arquitetural

Remotion é o orquestrador de tempo e composição. O adaptador 3D usa Three.js / React Three Fiber. O motor legado permanece isolado até que suas capacidades sejam migradas e verificadas. Consulte [a arquitetura](docs/architecture/overview.md) e [o plano de migração](docs/migration/plan.md).

## Estado

Esta branch estabelece a primeira etapa de integração: comandos de acesso ao Remotion, documentação arquitetural e contrato inicial de projeto. A interface unificada e o fluxo completo de produção serão implementados em etapas verificáveis.
