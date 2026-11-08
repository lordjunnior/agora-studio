# Adaptador Remotion do ÁGORA

Este diretório preserva o projeto Remotion original do Kit Animação 3D como ponto de partida do motor temporal e de composição do ÁGORA.

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

## Regras de integração

- As composições devem evoluir para consumir o contrato em `../packages/project-schema/project.schema.json`.
- Componentes 3D existentes devem ser avaliados antes de reescrita.
- A duração e o tempo da cena devem vir do projeto, não de constantes duplicadas.
- Renderizações precisam ser determinísticas e não podem depender de estado mutável compartilhado entre renders.
- Não importar diretamente dependências internas do motor legado. Criar adaptadores com contratos explícitos.
