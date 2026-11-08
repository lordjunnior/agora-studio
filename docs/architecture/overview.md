# Arquitetura do ÁGORA

## Objetivo

Unificar a produção audiovisual da Máquina Preguiça 3D e do Kit Animação 3D sem manter duas plataformas concorrentes. A integração é por capacidades, não por cópia de interfaces.

## Responsabilidades dos motores

### Remotion

Responsável pelo relógio global da composição, sequência de cenas, duração em frames, sincronização temporal de elementos, composição final e renderização determinística.

O projeto existente em `projeto/` é a primeira implementação do adaptador Remotion. A versão atual identificada no manifesto é Remotion 4.0.540.

### Three.js e React Three Fiber

Responsáveis pela construção e apresentação dos mundos 3D, personagens, objetos, câmeras, materiais e animações. As cenas React/Three são compostas pelo Remotion.

O Kit já contém uma implementação de tela 3D em `projeto/src/kit/Cena3D.tsx`; ela deve ser tratada como implementação existente a validar, não reescrita sem necessidade.

### Motor procedural legado

O código de `motor/` contém geração procedural de cenários e personagens, ferramentas de revisão, narração, custos, importação e processamento. Ele permanece como fonte de capacidades e ativos durante a migração.

Não executar os dois motores como renderizadores independentes do mesmo projeto final. O legado deverá ser encapsulado por adaptadores ou convertido em ativos/dados consumidos pelo fluxo Remotion.

### FFmpeg

Continua disponível para muxing, normalização, mixagem e operações de pós-processamento que não sejam melhor resolvidas pela composição Remotion.

## Fluxo de produção pretendido

1. O usuário cria ou abre um projeto ÁGORA.
2. O projeto guarda roteiro, perfil de saída, cenas, ativos e trilhas.
3. O roteiro é dividido em cenas com duração e conteúdo definidos.
4. Cada cena referencia ambiente, personagens, objetos, câmera, animações e áudio.
5. O adaptador seleciona a implementação visual compatível.
6. Remotion organiza as cenas na linha temporal e renderiza os frames.
7. Áudio, legendas e efeitos são sincronizados.
8. O pipeline finaliza e valida o arquivo de saída.
9. O projeto, versões e artefatos ficam disponíveis para reabertura.

## Contratos

- O formato de projeto é independente do motor de renderização.
- A duração canônica é expressa em frames e FPS; segundos podem ser derivados.
- Cada ativo tem identificador estável, tipo, origem e metadados.
- Cada cena tem identificador, duração, referências de ativos, câmera, áudio e configuração visual.
- Adaptadores não devem alterar o documento original do projeto durante o render.
- Toda operação de render deve ser reproduzível a partir de uma versão salva do projeto.

## Decisões de compatibilidade

O projeto Remotion declara React 18.3.1, Remotion 4.0.540, Three.js 0.171.0 e React Three Fiber 8.18.0. O motor legado declara Three.js 0.160.0. Essas versões não devem ser forçadas para uma única instalação sem testes: manter isolamento de dependências até validar a compatibilidade.

## Não objetivos desta etapa

- Apagar o motor legado.
- Recriar imediatamente todos os personagens e ambientes.
- Substituir a biblioteca 3D antes de inventariar e testar seus recursos.
- Declarar integração completa antes de renderizar um projeto real de ponta a ponta.
