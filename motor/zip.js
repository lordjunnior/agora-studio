// Ler um .zip (sem biblioteca) ou uma pasta como a mesma lista: [{ caminho, pegar() }]. Usado pelo painel (pacotes de
// modelos e extras) e pelo npm run extras
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Os arquivos de um .zip: [{ caminho, pegar() }] (sem biblioteca: lê o índice do fim do zip e descompacta cada um)
function lerZip(arquivoZip) {
  const b = Buffer.isBuffer(arquivoZip) ? arquivoZip : fs.readFileSync(arquivoZip);
  let fim = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) if (b.readUInt32LE(i) === 0x06054b50) { fim = i; break; }
  if (fim < 0) throw new Error('não é um .zip');
  const r = [];
  for (let k = 0, n = b.readUInt16LE(fim + 10), p = b.readUInt32LE(fim + 16); k < n; k++) {
    if (b.readUInt32LE(p) !== 0x02014b50) throw new Error('zip estragado');
    const utf8 = b.readUInt16LE(p + 8) & 0x800, metodo = b.readUInt16LE(p + 10), tam = b.readUInt32LE(p + 20);
    const nl = b.readUInt16LE(p + 28), local = b.readUInt32LE(p + 42);
    const caminho = b.toString(utf8 ? 'utf8' : 'latin1', p + 46, p + 46 + nl);
    p += 46 + nl + b.readUInt16LE(p + 30) + b.readUInt16LE(p + 32);
    if (caminho.endsWith('/')) continue;
    const ini = local + 30 + b.readUInt16LE(local + 26) + b.readUInt16LE(local + 28);
    r.push({ caminho, pegar: () => (metodo === 8 ? zlib.inflateRawSync(b.subarray(ini, ini + tam)) : b.subarray(ini, ini + tam)) });
  }
  return r;
}
// Os arquivos de uma pasta: [{ caminho, pegar() }]
function lerPasta(pasta, base = pasta, r = []) {
  for (const d of fs.readdirSync(pasta, { withFileTypes: true })) {
    const f = path.join(pasta, d.name);
    if (d.isDirectory()) lerPasta(f, base, r);
    else if (d.isFile()) r.push({ caminho: path.relative(base, f).split(path.sep).join('/'), pegar: () => fs.readFileSync(f) });
  }
  return r;
}

module.exports = { lerZip, lerPasta };
