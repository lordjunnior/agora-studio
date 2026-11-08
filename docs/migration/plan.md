# Plano de evolução do ÁGORA

## Fase 0 — Baseline e preservação

- Manter o estado estável da plataforma preservado.
- Trabalhar em branch de integração.
- Registrar comandos, versões e dependências.
- Executar e documentar testes existentes antes de alterações estruturais.
- Identificar ativos, licenças, segredos e arquivos gerados.

## Fase 1 — Fundação Remotion

- [x] Preservar a implementação atual de composição Remotion.
- [x] Expor comandos Remotion a partir da raiz.
- [x] Definir a arquitetura alvo.
- [ ] Instalar dependências e executar typecheck.
- [ ] Abrir o ambiente de composição e renderizar a composição de exemplo.
- [ ] Registrar resultado, duração e limitações.

## Fase 2 — Contrato unificado

- [x] Criar contrato inicial versionado para projetos e cenas.
- [ ] Implementar validação runtime do contrato.
- [ ] Criar adaptador de leitura dos formatos de projeto já existentes.
- [ ] Mapear personagem, ambiente, câmera, animação, narração e legenda.
- [ ] Validar importação sem perda de dados.

## Fase 3 — Primeiro fluxo vertical

O primeiro teste integrado deverá permitir:

1. Criar um projeto.
2. Carregar uma cena 3D existente.
3. Inserir personagem e ambiente.
4. Definir duração e câmera.
5. Adicionar narração e legenda.
6. Renderizar MP4 pelo Remotion.
7. Finalizar áudio/vídeo quando necessário.
8. Reabrir o projeto sem perda de estado.

## Fase 4 — Interface ÁGORA

- Construir a nova interface sem reaproveitar a UI antiga.
- Criar dashboard, biblioteca e editor de projeto.
- Implementar storyboard e revisão por cena.
- Implementar timeline com trilhas de vídeo, voz, música, efeitos e legendas.
- Conectar controles reais aos serviços, sem botões cenográficos.

## Fase 5 — Migração progressiva dos módulos

- Migrar primeiro os recursos com maior valor e menor risco.
- Manter cada módulo até o substituto passar em teste de equivalência.
- Remover módulos antigos somente após confirmar que nenhum fluxo depende deles.
- Manter histórico de migração e decisões técnicas sem expor nomenclaturas anteriores no produto.

## Critérios de aceite

- Instalação reproduzível em Node 20+.
- Typecheck Remotion sem erros.
- Render de exemplo gerado com sucesso.
- Cena 3D determinística, sem vazamento de recursos entre renders.
- Áudio e legendas sincronizados.
- Exportação MP4 validada por FFprobe.
- Projeto salvo e reaberto sem perda.
- Nenhuma chave ou segredo versionado.
