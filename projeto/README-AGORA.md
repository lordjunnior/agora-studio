# Renderização do ÁGORA

Este pacote contém a implementação Remotion usada pelo ÁGORA para composição temporal e renderização audiovisual.

## Comandos

A partir da raiz do repositório:

```bash
npm run remotion:studio
npm run remotion:render:example
npm run remotion:typecheck
```

Ou diretamente neste diretório:

```bash
npm install
npm run studio
npm run exemplo
npm run typecheck
```

## Integração

- As composições devem consumir progressivamente o contrato em `../packages/project-schema/project.schema.json`.
- Componentes 3D devem ser validados antes de qualquer substituição.
- Duração e tempo devem vir dos dados do projeto.
- Renderizações devem ser determinísticas e isoladas entre execuções.
- Serviços externos à composição devem ser acessados por adaptadores com contratos explícitos.
