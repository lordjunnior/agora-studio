// Salva a chave da ElevenLabs no arquivo .env do jeito certo, sem a pessoa abrir arquivo escondido nem terminal: abre uma
// janelinha no navegador com uma caixa pra colar a chave e o botão Salvar. A janela salva, testa com a ElevenLabs e
// diz se funcionou. A chave fica só no computador da pessoa: nunca passa pela conversa com a IA.
// Uso (quem roda é a IA):
//   npm run chave                abre a janelinha e volta na hora. Ela fica esperando a chave por até 30 minutos
//   npm run chave -- --esperar   o mesmo, mas o comando só volta quando a pessoa salvar (até 15 minutos). Pra quando o
//                                programa da IA fecha tudo o que o comando abriu assim que ele termina
//   npm run chave -- --terminal  pede a chave aqui mesmo, no terminal (pra quem está num terminal de verdade)
//   npm run chave -- sk_...      salva a chave que a pessoa colou na conversa (não repetir a chave na resposta)
// A chave nunca é mostrada: nem aqui, nem no conferir, nem no render.
const fs = require('fs');
const path = require('path');
const http = require('http');
const net = require('net');
const crypto = require('crypto');
const readline = require('readline');
const { spawn } = require('child_process');
const V = require('./voz');

const RAIZ = V.RAIZ;
const ENV = path.join(RAIZ, '.env');
const PORTA = 47391; // a mesma sempre: rodar de novo reaproveita a janela que já estiver aberta
const ESPERA_JANELA = 30 * 60 * 1000;
const ESPERA_COMANDO = 15 * 60 * 1000;
const PAGINA_CHAVES = 'https://elevenlabs.io/app/developers/api-keys';

// Tira aspas, <>, espaços e o "ELEVENLABS_API_KEY=" que às vezes vem junto na cópia
const limpar = (c) => String(c || '').trim().replace(/^["'<\s]+|["'>\s]+$/g, '').replace(/^ELEVENLABS_API_KEY\s*=\s*/i, '').replace(/\s+/g, '');

// Troca (ou põe) a linha ELEVENLABS_API_KEY= no .env, sem mexer nas outras linhas
function salvar(chave) {
  let linhas = [];
  try { linhas = fs.readFileSync(ENV, 'utf8').replace(/^﻿/, '').split(/\r?\n/); } catch { /* .env novo */ }
  if (!linhas.length || !linhas.some((l) => l.trim())) linhas = ['# A chave da voz da ElevenLabs. Não mande este arquivo pra ninguém: a chave é como uma senha.'];
  const nova = `ELEVENLABS_API_KEY=${chave}`;
  const i = linhas.findIndex((l) => /^\s*(export\s+)?ELEVEN.*KEY\s*[=:]/i.test(l) || V.JEITO_DE_CHAVE.test(l.trim()));
  if (i >= 0) linhas[i] = nova; else linhas.push(nova);
  fs.writeFileSync(ENV, linhas.join('\n').replace(/\n*$/, '\n'));
}

// A chave consegue listar as vozes? (o npm run vozes precisa). true, false ou null (não deu pra saber)
async function veAsVozes(chave) {
  try {
    const res = await fetch('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': chave }, signal: AbortSignal.timeout(10000) });
    if (res.ok) return true;
    return V.erroElevenlabs(res.status, await res.text()).tipo === 'permissao' ? false : null;
  } catch { return null; }
}

// Testa com a ElevenLabs e salva (chave recusada não é salva). { ok, salvou, linha (pro terminal), mensagem (pra janela) }
async function salvarETestar(bruta) {
  const chave = limpar(bruta);
  if (!chave) return { ok: false, salvou: false, linha: 'CHAVE: VAZIA', mensagem: 'A caixa está vazia. Cole a chave (o código que começa com sk_) e clique em Salvar.' };
  const c = await V.contaElevenlabs(chave, 15000);
  if (!c.ok && c.erro === 'chave') {
    return {
      ok: false, salvou: false, linha: 'CHAVE: RECUSADA pela ElevenLabs (não foi salva)',
      mensagem: 'A ElevenLabs não aceitou essa chave, então ela não foi salva. Quase sempre é a chave copiada pela metade. ' +
        'Volte na página das chaves, crie uma nova, clique no botão de copiar do lado dela e cole aqui de novo.' +
        (V.JEITO_DE_CHAVE.test(chave) ? '' : ' Repare: a chave começa com sk_.')
    };
  }
  salvar(chave);
  const voltar = 'Pode fechar esta janela e voltar pra conversa com a IA. Diga: <b>salvei</b>.';
  const vozes = c.ok || c.erro === 'permissao' ? await veAsVozes(chave) : null;
  const semVozes = vozes === false
    ? ' Só um detalhe: essa chave não tem permissão pra ver as vozes. Se a IA não conseguir listar as vozes, crie outra chave liberando "Voices" e cole aqui de novo.'
    : '';
  if (c.ok) {
    const minutos = Math.floor(c.restante / V.CARACTERES_POR_MINUTO);
    const sobra = `Sobram ${V.mil(c.restante)} caracteres no seu plano (uns ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'} de narração)` +
      (c.renova ? ` e ele renova em ${V.dataBr(c.renova)}` : '');
    return { ok: true, salvou: true, linha: `CHAVE: SALVA e funcionando. ${sobra}.${semVozes}`, mensagem: `Funcionou! A chave ficou salva. ${sobra}.${semVozes} ${voltar}` };
  }
  if (c.erro === 'permissao') {
    return { ok: true, salvou: true, linha: `CHAVE: SALVA e aceita (ela não deixa ver os créditos).${semVozes}`, mensagem: `Funcionou! A chave ficou salva (ela só não deixa ver quanto sobra do plano).${semVozes} ${voltar}` };
  }
  if (c.erro === 'bloqueio') {
    return {
      ok: true, salvou: true, linha: 'CHAVE: SALVA, mas a ElevenLabs bloqueou o plano grátis desta conta (VPN, conta nova ou várias contas)',
      mensagem: 'A chave está certa e ficou salva, mas a ElevenLabs bloqueou o plano grátis desta conta (acontece com VPN, conta ' +
        'nova ou várias contas no mesmo computador). Volte pra conversa e conte isso pra IA: ela te mostra as saídas.'
    };
  }
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const motivo = c.erro === 'rede' ? 'não consegui falar com a ElevenLabs agora pra conferir (a internet caiu?)' : `a ElevenLabs respondeu com um erro (${esc(c.msg || c.erro)})`;
  return { ok: true, salvou: true, linha: `CHAVE: SALVA, mas não testada: ${motivo}`, mensagem: `A chave ficou salva, mas ${motivo}. Volte pra conversa e diga: <b>salvei</b>. A IA confere de novo.` };
}

// ---------- A janelinha ----------

const PAGINA = (token, jaTem) => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Chave da voz · Máquina Preguiça 3D</title>
<style>
:root{--fundo:#f4f1ea;--cartao:#fff;--texto:#1d1f24;--suave:#5b6170;--borda:#e3ded3;--destaque:#f5c518;--ok:#1f8a4c;--okf:#e7f6ed;--erro:#c62828;--errof:#fdecea;--esperaf:#fff8db}
*{box-sizing:border-box}body{margin:0;background:var(--fundo);color:var(--texto);font:17px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
main{max-width:620px;margin:32px auto;padding:0 16px}
.cartao{background:var(--cartao);border:1px solid var(--borda);border-radius:18px;padding:28px 26px;box-shadow:0 6px 24px rgba(0,0,0,.06)}
h1{font-size:27px;line-height:1.2;margin:0 0 8px}p{margin:0 0 12px}.sub{color:var(--suave)}
ol{list-style:none;padding:0;margin:22px 0 0}li{display:flex;gap:14px;margin:0 0 22px}
.n{flex:none;width:34px;height:34px;border-radius:50%;background:var(--destaque);font-weight:800;display:grid;place-items:center}
li h2{font-size:19px;margin:3px 0 4px}li p{color:var(--suave);margin:0 0 10px}li div{flex:1;min-width:0}
a.botao,button{display:inline-block;border:0;border-radius:12px;padding:11px 18px;font:inherit;font-weight:700;cursor:pointer;text-decoration:none}
a.botao{background:#1d1f24;color:#fff}button.principal{background:var(--destaque);color:#1d1f24;width:100%;font-size:19px;padding:15px}
button.leve{background:#ece7dc;color:#1d1f24;padding:11px 14px}button:disabled{opacity:.6;cursor:wait}
.campo{display:flex;gap:8px;margin:4px 0 10px}input{flex:1;min-width:0;font:inherit;font-size:18px;padding:12px 14px;border:2px solid var(--borda);border-radius:12px}
input:focus{outline:none;border-color:var(--destaque)}label.ver{color:var(--suave);font-size:15px;display:block;margin:0 0 14px}
#aviso{display:none;border-radius:12px;padding:14px 16px;margin-top:16px}#aviso.ok,#aviso.erro,#aviso.espera{display:block}
#aviso.ok{background:var(--okf);color:var(--ok);font-weight:600}#aviso.erro{background:var(--errof);color:var(--erro)}#aviso.espera{background:var(--esperaf)}
.ja{background:var(--esperaf);border-radius:12px;padding:10px 14px;margin:14px 0 0}.pe{color:var(--suave);font-size:14px;margin-top:18px}
code{background:#f1ede4;border-radius:6px;padding:1px 6px}
</style></head><body><main><div class="cartao">
<h1>🔑 Chave da voz</h1>
<p class="sub">Pra narrar os seus vídeos com a voz da ElevenLabs, a Máquina precisa da "chave" da sua conta. Ela é como uma
senha: fica guardada só aqui no seu computador e não passa pela conversa com a IA.</p>
${jaTem ? '<p class="ja">Já tem uma chave salva aqui. Se você colar outra, ela troca a antiga.</p>' : ''}
<ol>
<li><span class="n">1</span><div><h2>Entre na ElevenLabs</h2>
<p>Crie a conta (pode ser com o Google) ou entre na sua. As perguntas do começo, pode pular.</p>
<a class="botao" href="https://elevenlabs.io/app/sign-up" target="_blank" rel="noopener">Abrir a ElevenLabs</a></div></li>
<li><span class="n">2</span><div><h2>Crie a chave</h2>
<p>Na página das chaves (no menu da esquerda: <b>Developers</b> e depois <b>API Keys</b>), clique em <b>Create API Key</b> e
dê o nome <b>Preguiça 3D</b>. Se aparecer a lista do que a chave pode fazer, libere tudo (ou pelo menos <b>Text to
Speech</b>, <b>Voices</b> e <b>User</b>). Confirme e copie o código que aparece: ele começa com <code>sk_</code> e só
aparece uma vez.</p>
<a class="botao" href="${PAGINA_CHAVES}" target="_blank" rel="noopener">Abrir a página das chaves</a></div></li>
<li><span class="n">3</span><div><h2>Cole aqui e salve</h2>
<form id="form" autocomplete="off"><div class="campo"><input id="chave" type="password" placeholder="sk_..." spellcheck="false" aria-label="Chave da ElevenLabs">
<button type="button" class="leve" id="colar">Colar</button></div>
<label class="ver"><input type="checkbox" id="ver"> mostrar a chave</label>
<button class="principal" id="salvar" type="submit">Salvar a chave</button></form>
<div id="aviso" role="status"></div></div></li>
</ol>
<p class="pe">Máquina Preguiça 3D · esta janela funciona só no seu computador. Travou? Pergunte pra sua IA: "Me ajuda a pôr a chave da voz".</p>
</div></main>
<script>
const T = ${JSON.stringify(token)};
const $ = (id) => document.getElementById(id);
const aviso = (html, tipo) => { $('aviso').innerHTML = html; $('aviso').className = tipo; };
$('ver').onchange = () => { $('chave').type = $('ver').checked ? 'text' : 'password'; };
$('colar').onclick = async () => {
  try { $('chave').value = (await navigator.clipboard.readText()).trim(); $('chave').focus(); }
  catch { $('chave').focus(); aviso('Clique na caixa e aperte <b>Ctrl+V</b> (no Mac, <b>Cmd+V</b>) pra colar.', 'espera'); }
};
$('form').onsubmit = async (e) => {
  e.preventDefault();
  $('salvar').disabled = true;
  aviso('Conferindo com a ElevenLabs...', 'espera');
  try {
    const r = await fetch('/salvar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ t: T, chave: $('chave').value }) });
    const j = await r.json();
    aviso(j.mensagem, j.ok ? 'ok' : 'erro');
    if (j.ok) { $('form').style.display = 'none'; }
  } catch {
    aviso('A janela perdeu a ligação com a Máquina e a chave não foi salva. Volte pra conversa e diga pra IA: <b>a janela da chave não salvou</b>.', 'erro');
  }
  $('salvar').disabled = false;
};
</script></body></html>`;

// O servidor da janelinha: só responde pro próprio computador (127.0.0.1) e pra quem tem o código da página
function servir(porta, token, aoSalvar) {
  let visto = false;
  const srv = http.createServer((req, res) => {
    const host = String(req.headers.host || '').replace(/:\d+$/, '');
    if (!['127.0.0.1', 'localhost'].includes(host)) { res.writeHead(403); return res.end(); }
    const url = new URL(req.url, `http://127.0.0.1:${porta}`);
    const responder = (status, tipo, corpo) => { res.writeHead(status, { 'Content-Type': tipo, 'Cache-Control': 'no-store' }); res.end(corpo); };
    if (req.method === 'GET' && url.pathname === '/ping') return responder(200, 'application/json', JSON.stringify({ app: 'preguica3d-chave', pasta: RAIZ, token, visto }));
    if (req.method === 'GET' && url.pathname === '/') {
      if (url.searchParams.get('t') !== token) return responder(403, 'text/html; charset=utf-8', '<p>Abra a janela pelo endereço que a IA mostrou.</p>');
      visto = true;
      return responder(200, 'text/html; charset=utf-8', PAGINA(token, !!V.chaveElevenlabs(RAIZ).chave));
    }
    if (req.method === 'POST' && url.pathname === '/salvar') {
      let corpo = '';
      req.on('data', (d) => { corpo += d; if (corpo.length > 10000) req.destroy(); });
      req.on('end', async () => {
        let dados = {};
        try { dados = JSON.parse(corpo); } catch { /* corpo estranho */ }
        if (dados.t !== token) return responder(403, 'application/json', JSON.stringify({ ok: false, mensagem: 'Abra a janela de novo pelo endereço que a IA mostrou.' }));
        const r = await salvarETestar(dados.chave);
        responder(200, 'application/json', JSON.stringify({ ok: r.ok, mensagem: r.mensagem }));
        if (r.salvou) aoSalvar(r);
      });
      return;
    }
    responder(404, 'text/plain; charset=utf-8', 'não achei');
  });
  srv.listen(porta, '127.0.0.1');
  return srv;
}

// Abre o endereço no navegador padrão da pessoa
function abrirNoNavegador(url) {
  const op = { detached: true, stdio: 'ignore', windowsHide: true };
  try {
    const p = process.platform === 'win32' ? spawn('rundll32', ['url.dll,FileProtocolHandler', url], op)
      : spawn(process.platform === 'darwin' ? 'open' : 'xdg-open', [url], op);
    p.on('error', () => {}); // sem navegador: a IA passa o endereço pra pessoa
    p.unref();
  } catch { /* idem */ }
}

const ping = (porta) => new Promise((ok) => {
  const req = http.get({ host: '127.0.0.1', port: porta, path: '/ping', timeout: 1500 }, (res) => {
    let d = '';
    res.on('data', (x) => { d += x; });
    res.on('end', () => { try { const j = JSON.parse(d); ok(j.app === 'preguica3d-chave' ? j : null); } catch { ok(null); } });
  });
  req.on('error', () => ok(null));
  req.on('timeout', () => { req.destroy(); ok(null); });
});
const livre = (porta) => new Promise((ok) => {
  const s = net.createServer();
  s.once('error', () => ok(null));
  s.listen(porta, '127.0.0.1', () => { const p = s.address().port; s.close(() => ok(p)); });
});
const dormir = (ms) => new Promise((ok) => setTimeout(ok, ms));

function instrucoes(url, esperando) {
  console.log('\nAbri uma janelinha no navegador com uma caixa pra colar a chave da ElevenLabs.');
  console.log(`Se ela não apareceu, o endereço é: ${url}`);
  console.log('\nPRA IA: diga pra pessoa, com as suas palavras: "Abri uma janelinha no seu navegador. Ela mostra onde pegar a');
  console.log('chave na ElevenLabs: é só colar lá e clicar em Salvar, e a própria janela diz se funcionou. Depois me diga \'salvei\'."');
  console.log('Se a janela não abriu, mande o endereço acima pra pessoa clicar. Nunca peça pra ela abrir o .env, o terminal ou o PowerShell.');
  if (!esperando) {
    console.log('Quando ela disser que salvou, rode npm run vozes (testa a chave e lista as vozes). A janela espera por até 30 minutos.');
    console.log('Se a janela mostrar erro ou disser que não salvou: rode npm run chave -- --esperar, com tempo limite de 15 minutos no comando.');
  }
}

// A janela num processo à parte, que continua de pé depois que este comando termina
async function janela() {
  // Janela desta mesma pasta já aberta (de um npm run chave anterior): só mostra de novo
  const ja = await ping(PORTA);
  if (ja && ja.pasta === RAIZ) {
    const url = `http://127.0.0.1:${PORTA}/?t=${ja.token}`;
    abrirNoNavegador(url);
    return instrucoes(url, false);
  }
  const porta = (await livre(PORTA)) || (await livre(0));
  const token = crypto.randomBytes(9).toString('hex');
  spawn(process.execPath, [__filename, '--servidor', String(porta), token], { cwd: RAIZ, detached: true, stdio: 'ignore', windowsHide: true }).unref();
  for (let i = 0; i < 40 && !(await ping(porta)); i++) await dormir(150);
  if (!(await ping(porta))) return esperar(); // o processo à parte não subiu: a janela fica com este comando
  const url = `http://127.0.0.1:${porta}/?t=${token}`;
  abrirNoNavegador(url);
  instrucoes(url, false);
  // Espera a página carregar (até 15 s): se o programa da IA fechar o que o comando abriu, a pessoa ao menos vê o aviso da janela
  for (let i = 0; i < 30; i++) { const p = await ping(porta); if (!p || p.visto) break; await dormir(500); }
}

// O processo à parte: serve a janela até salvar ou passar meia hora
function servidor(porta, token) {
  const srv = servir(porta, token, () => setTimeout(() => { srv.close(); process.exit(0); }, 2000));
  setTimeout(() => process.exit(0), ESPERA_JANELA).unref();
}

// A janela presa a este comando: ele só termina quando a pessoa salvar (ou em 15 minutos)
async function esperar() {
  const porta = (await livre(PORTA)) || (await livre(0));
  const token = crypto.randomBytes(9).toString('hex');
  const url = `http://127.0.0.1:${porta}/?t=${token}`;
  const limite = setTimeout(() => {
    console.log('\nPassaram 15 minutos e a chave não foi salva. Quando a pessoa estiver pronta, rode npm run chave de novo.');
    process.exit(1);
  }, ESPERA_COMANDO);
  const srv = servir(porta, token, (r) => {
    console.log(`\n${r.linha}`);
    if (r.ok) console.log('Próximo passo: escolher a voz (npm run vozes lista as vozes da conta).');
    clearTimeout(limite);
    setTimeout(() => { srv.close(); process.exit(0); }, 1500);
  });
  abrirNoNavegador(url);
  instrucoes(url, true);
  console.log('\nEsperando a pessoa salvar a chave (até 15 minutos)...');
}

function perguntarEscondido(pergunta) {
  return new Promise((ok) => {
    process.stdout.write(pergunta);
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    // Mostra * no lugar de cada letra colada
    rl._writeToOutput = (s) => { if (/[\r\n]/.test(s)) process.stdout.write('\n'); else if (s) process.stdout.write('*'.repeat(s.length)); };
    rl.question('', (r) => { rl.close(); ok(r); });
  });
}

// A chave veio direto (colada na conversa) ou pelo terminal
async function direto(chave) {
  const r = await salvarETestar(chave);
  console.log(`\n${r.linha}`);
  const errados = V.ARQUIVOS.filter((n) => n !== '.env' && n !== '.env.exemplo' && fs.existsSync(path.join(RAIZ, n)));
  if (r.salvou && errados.length) console.log(`Tem também ${errados.join(', ')} na pasta: pode apagar, o certo é só o .env.`);
  if (!r.ok) process.exit(1);
  console.log('Próximo passo: escolher a voz (npm run vozes lista as vozes da conta).\n');
}

(async () => {
  const args = process.argv.slice(2);
  if (args[0] === '--servidor') return servidor(Number(args[1]), args[2]);
  if (args.includes('--esperar')) return esperar();
  if (args.includes('--terminal')) {
    console.log('\nCole aqui a sua chave da ElevenLabs (no site: Developers > API Keys; começa com sk_) e aperte Enter.');
    console.log('Ela não aparece na tela: no lugar de cada letra sai um *.\n');
    return direto(await perguntarEscondido('Chave: '));
  }
  const chave = args.find((a) => !a.startsWith('--'));
  if (chave) return direto(chave);
  return janela();
})();
