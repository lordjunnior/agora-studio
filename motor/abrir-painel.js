// O painel aberto de dentro de outro comando: o render (nas cenas e no vídeo pronto), o instalar e o canal abrem o
// painel sozinhos no fim, sem depender da IA lembrar. Nunca atrapalha quem chamou: se não der pra abrir, só não abre.
//   abrir(['<tema>'])         abre no navegador da pessoa e devolve o endereço (null se não deu)
//   ligado()                  { url } se o painel desta pasta já está aberto, senão null (sem abrir nada)
//   avisar(url, 'o que tem')  as linhas PAINEL e PRA IA que o comando mostra no fim
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const PORTA = 47392; // a do painel (motor/painel.js); com duas Máquinas no computador, a outra fica na porta guardada
const PORTA_SALVA = path.join(os.tmpdir(), `preguica3d-painel-${crypto.createHash('sha1').update(RAIZ).digest('hex').slice(0, 10)}.porta`);

function abrir(args = []) {
  try {
    const r = spawnSync(process.execPath, [path.join(__dirname, 'painel.js'), ...args], { cwd: RAIZ, encoding: 'utf8', timeout: 20000, windowsHide: true });
    return (String(r.stdout || '').match(/o endereço é: (\S+)/) || [])[1] || null;
  } catch {
    return null;
  }
}

const ping = (porta) => new Promise((ok) => {
  const req = http.get({ host: '127.0.0.1', port: porta, path: '/ping', timeout: 1500 }, (res) => {
    let d = '';
    res.on('data', (x) => { d += x; });
    res.on('end', () => {
      try { const j = JSON.parse(d); ok(j.app === 'preguica3d-painel' && j.pasta === RAIZ ? { url: `http://127.0.0.1:${porta}/?t=${j.token}` } : null); } catch { ok(null); }
    });
  });
  req.on('error', () => ok(null));
  req.on('timeout', () => { req.destroy(); ok(null); });
});
async function ligado() {
  const salva = (() => { try { return Number(fs.readFileSync(PORTA_SALVA, 'utf8')); } catch { return 0; } })();
  return (await ping(PORTA)) || (salva && salva !== PORTA ? await ping(salva) : null);
}

const ATALHO = 'dois cliques no arquivo ABRIR-PAINEL, na pasta da Máquina (no Mac é o ABRIR-PAINEL.command; no Windows, o ABRIR-PAINEL.bat)';
function avisar(url, oQue) {
  if (!url) {
    return ['PAINEL: não consegui abrir agora.',
      `PRA IA: rode npm run painel e mande pra pessoa o link que ele mostrar, clicável (${oQue}). Se ainda assim não abrir, diga que dá pra abrir com ${ATALHO}.`];
  }
  return [`PAINEL: abri no navegador da pessoa (se o painel já estava na tela, ele só trocou de tela, sem aba nova): ${url}`,
    `PRA IA: termine a sua resposta com este link, clicável, e uma frase do que ela vê lá (${oQue}). Se ela disser que não abriu, mande o link de novo e diga que também dá pra abrir com ${ATALHO}.`];
}

module.exports = { abrir, ligado, avisar, ATALHO };
