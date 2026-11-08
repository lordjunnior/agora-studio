# Peças próprias do canal

Aqui fica o que a IA fez só pro seu canal: um personagem próprio, um cenário, um objeto que se repete nos vídeos. O
render carrega todo arquivo `.js` desta pasta depois do motor, e a versão nova da Máquina não apaga esta pasta.

**Pra IA:** peça própria vai aqui, nunca dentro de `motor/` (o `motor/` é trocado inteiro a cada versão nova). Um arquivo
por peça, com o nome dela (`canal/pecas/jorjao.js`), neste formato:

```js
// Jorjão: o pedreiro do canal (barba, colete, capacete). Uso: const j = K.jorjao({ escalaOlhos: 1.3 })
(function () {
  const K = window.K;
  K.jorjao = function (op = {}) {
    // ... monte com THREE e com o que o K já tem (K.mat, K.malha, K.boneco...)
  };
})();
```

Use só o que o `K` oferece (está em `referencias/kit-indice.md`) e o `THREE`: as funções internas do `motor/kit.js` não
existem aqui. Antes de usar a peça num vídeo, confira com `node motor/render.js videos/<tema> --voz-teste --previa 3`.
