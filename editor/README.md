# ÁGORA Visual Editor

Primeira interface visual de edição sobre o contrato de projeto já utilizado pelo renderer Remotion.

## Executar

Requer Node.js 20 ou superior.

```bash
cd editor
npm install
npm run dev
```

Abra http://127.0.0.1:5174.

## Recursos desta primeira entrega

- Abre o projeto de demonstração como ponto de partida.
- Importa e valida documentos `.agora.json`.
- Pré-visualiza a composição pelo Remotion Player.
- Exibe trilhas de áudio, imagem, vídeo, modelos 3D, legendas e overlays.
- Permite selecionar clipes, reposicioná-los por arrastar e editar propriedades no inspetor.
- Permite adicionar trilhas vazias.
- Exporta o documento editado em JSON para continuar o fluxo de renderização.

## Limites explícitos

Esta é a primeira camada do editor, não um NLE completo. A edição altera o documento em memória e o salvamento baixa um novo JSON; ainda não há persistência automática no servidor, upload de arquivos de mídia pelo navegador, undo/redo, edição por waveform, alças de trim, keyframes, multi-seleção ou fila de renderização integrada à interface. A importação de mídia continua usando o manifesto CLI existente. Essas capacidades serão adicionadas em etapas verificadas, sem declarar recursos inexistentes como prontos.

O editor compartilha os tipos e a composição Remotion existentes. O diretório público de mídia aponta para `projeto/public`, para que a prévia resolva os mesmos ativos utilizados pelo renderizador.