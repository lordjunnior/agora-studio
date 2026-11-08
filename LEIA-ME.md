# ÁGORA

**Da ideia ao vídeo.**

Plataforma inteligente de criação audiovisual em desenvolvimento.

O ÁGORA reúne ferramentas para planejar, compor e renderizar projetos audiovisuais. A arquitetura utiliza Remotion para composição temporal, Three.js e React Three Fiber para recursos 3D e FFmpeg para operações de mídia quando necessário.

## Requisitos

- Node.js 20 ou superior.
- Dependências de cada pacote instaladas no respectivo diretório.
- Ferramentas externas e credenciais apenas para os recursos que as exigirem.

## Estrutura atual

- `motor/`: serviços e ferramentas audiovisuais existentes em processo de integração.
- `projeto/`: composição e renderização baseadas em Remotion.
- `packages/project-schema/`: contrato inicial de dados do projeto.
- `docs/`: arquitetura e plano de evolução.

A estrutura está em transição. Os diretórios serão reorganizados de forma incremental, após validação dos fluxos e dependências.

## Comandos principais

Na raiz:

```bash
npm run remotion:studio
npm run remotion:render:example
npm run remotion:typecheck
```

Consulte `package.json` para a lista atualizada de scripts. Os comandos acima ainda precisam ser executados no ambiente de desenvolvimento para validação.

## Direção

A experiência final deverá permitir criar um projeto, estruturar roteiro e cenas, combinar recursos 2D e 3D, trabalhar áudio, pré-visualizar e exportar o vídeo. A interface e a identidade visual serão próprias do ÁGORA.

Consulte `AGENTS.md` antes de contribuir.
