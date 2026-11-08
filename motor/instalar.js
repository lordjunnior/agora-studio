// Instala tudo o que a Máquina precisa, num comando só, e testa desenhando o vídeo de exemplo.
// Uso: npm run instalar        (no Windows, se o PowerShell bloquear o npm: npm.cmd run instalar  ou  node motor/instalar.js)
// Pode rodar quantas vezes quiser: o que já está pronto ele só confere, e se parar no meio, continua de onde parou.
// Na primeira vez leva de 2 a 10 minutos (depende da internet). Fala em palavras simples e termina com o
// RESULTADO (INSTALADO ou FALTA) e a linha "PRA IA:", com o próximo passo de quem está conduzindo a instalação.
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const EXEMPLO = path.join(RAIZ, 'videos', 'exemplo');
const log = (s = '') => console.log(s);
const nm = (p) => path.join(RAIZ, 'node_modules', p);
require('./canal-arquivos').garantirCanal();

// Os atalhos de dois cliques que abrem o painel (ABRIR-PAINEL.command no Mac, .bat no Windows), prontos pra rodar: no Mac,
// com permissão de rodar e sem a "quarentena" de arquivo baixado (senão o Mac bloqueia o primeiro clique); no Windows,
// sem a marca de arquivo baixado da internet (senão aparece o aviso de segurança)
function prepararAtalhos() {
  const { execFileSync } = require('child_process');
  try {
    if (process.platform === 'darwin') {
      const f = path.join(RAIZ, 'ABRIR-PAINEL.command');
      fs.chmodSync(f, 0o755);
      execFileSync('xattr', ['-d', 'com.apple.quarantine', f], { stdio: 'ignore' });
    } else if (process.platform === 'win32') {
      execFileSync('powershell', ['-NoProfile', '-Command', `Unblock-File -LiteralPath '${path.join(RAIZ, 'ABRIR-PAINEL.bat').replace(/'/g, "''")}'`], { stdio: 'ignore', timeout: 20000 });
    }
  } catch { /* já estava liberado, ou sem o arquivo: nada a fazer */ }
}

function terminar(ok, praPessoa, praIa) {
  log('');
  log(ok ? 'RESULTADO: INSTALADO' : 'RESULTADO: FALTA');
  if (praPessoa) log(`Pra pessoa: ${praPessoa}`);
  log(`PRA IA: ${praIa}`);
  process.exit(ok ? 0 : 1);
}

// Roda um programa sem despejar o log dele na tela; a cada 30 s avisa que continua trabalhando
function rodar(cmd, args, op = {}) {
  return new Promise((ok) => {
    let saida = '';
    const inicio = Date.now();
    const passou = () => { const s = Math.round((Date.now() - inicio) / 1000); return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min${s % 60 ? ` ${s % 60} s` : ''}`; };
    const relogio = setInterval(() => log(`   ...continua trabalhando (${passou()})`), 30000);
    let p;
    try {
      p = spawn(cmd, args, { cwd: RAIZ, windowsHide: true, ...op });
    } catch (e) {
      clearInterval(relogio);
      return ok({ status: -1, saida: String(e.message) });
    }
    p.stdout && p.stdout.on('data', (d) => { saida += d; });
    p.stderr && p.stderr.on('data', (d) => { saida += d; });
    p.on('error', (e) => { saida += `\n${e.message}`; });
    p.on('close', (status) => { clearInterval(relogio); ok({ status, saida }); });
  });
}

// O npm pelo arquivo dele (npm-cli.js), com o próprio Node: funciona até no PowerShell que bloqueia scripts (npm.ps1)
function npm(args) {
  const dir = path.dirname(process.execPath);
  const cli = [process.env.npm_execpath, path.join(dir, 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    path.join(dir, '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js')]
    .find((c) => c && /npm-cli\.js$/.test(c) && fs.existsSync(c));
  const env = { ...process.env, npm_config_update_notifier: 'false', npm_config_fund: 'false', npm_config_audit: 'false' };
  return cli ? rodar(process.execPath, [cli, ...args], { env })
    : rodar(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, { env, shell: process.platform === 'win32' });
}

// O motivo de um download ou instalação falhar, pelo texto do erro
function porque(saida) {
  if (/ENOSPC|no space left/i.test(saida)) return 'disco';
  if (/ENOTFOUND|EAI_AGAIN|ETIMEDOUT|ECONNRESET|ECONNREFUSED|socket hang up|getaddrinfo|network|proxy|certificate|CERT_|self.signed|Download failed|failed to download/i.test(saida)) return 'internet';
  if (/EPERM|EACCES|EBUSY|operation not permitted|access is denied|acesso negado|resource busy|being used by another process/i.test(saida)) return 'permissao';
  return 'outro';
}
const POR_QUE = {
  internet: 'não consegui baixar: a internet caiu ou está bloqueada. Se o programa da IA pediu permissão pra usar a ' +
    'internet, é só aceitar (no Codex, "Acesso completo" resolve). Confira o Wi-Fi e tente de novo',
  permissao: 'o computador não deixou gravar os arquivos (antivírus, OneDrive ou a pasta num lugar protegido). Feche ' +
    'outros programas e tente de novo; se continuar, mova a pasta da Máquina pra Documentos',
  disco: 'falta espaço no computador: a Máquina precisa de uns 2 GB livres',
  outro: 'deu um erro (as últimas linhas estão logo acima)'
};
const ultimas = (saida, n = 12) => saida.replace(/\x1b\[[0-9;]*m/g, '').split(/\r?\n/).map((l) => l.trimEnd()).filter(Boolean).slice(-n).map((l) => `   | ${l}`).join('\n');

function pecasProntas() {
  try {
    const ff = require(nm('ffmpeg-static'));
    const fp = require(nm('ffprobe-static')).path;
    return fs.existsSync(nm('playwright/package.json')) && fs.existsSync(nm('three/build/three.min.js')) &&
      !!ff && fs.existsSync(ff) && !!fp && fs.existsSync(fp);
  } catch { return false; }
}

(async () => {
  log('Máquina Preguiça 3D: instalação\n');

  // 1. Node.js (o Playwright, que abre o navegador, pede o 20 ou mais novo)
  const [maior] = process.versions.node.split('.').map(Number);
  if (maior < 20) {
    log(`[falta] Programa base (Node.js): a versão ${process.versions.node} é antiga. A Máquina precisa da 20 ou mais nova.`);
    terminar(false, 'falta atualizar o Node.js, o programa base: entre em nodejs.org, baixe a versão LTS, instale e depois feche e abra de novo o programa da IA.',
      'passe pra pessoa o passo a passo "Node.js não instalado" de comandos/boas-vindas.md (é o mesmo pra atualizar). Quando ela disser que instalou, rode npm run instalar de novo.');
  }
  log(`[ok] Programa base (Node.js ${process.versions.node})`);

  // 2. As peças do motor: o motor 3D, o Playwright (abre o navegador) e o ffmpeg (junta o vídeo)
  if (pecasProntas()) log('[ok] Peças do motor');
  else {
    log('... Baixando as peças do motor (de 1 a 5 minutos, depende da internet)');
    let r = await npm(['install', '--no-audit', '--no-fund', '--loglevel=error']);
    // A internet piscou ou o antivírus segurou um arquivo: mais uma tentativa
    if (r.status !== 0 && ['internet', 'permissao'].includes(porque(r.saida))) {
      log('   (não deu de primeira, tentando de novo)');
      await new Promise((ok) => setTimeout(ok, 5000));
      r = await npm(['install', '--no-audit', '--no-fund', '--loglevel=error']);
    }
    // O ffmpeg vem num download à parte: se ele falhou num npm install anterior, baixa de novo
    if (r.status === 0 && !pecasProntas()) r = await npm(['rebuild', 'ffmpeg-static', 'ffprobe-static']);
    if (r.status !== 0 || !pecasProntas()) {
      const p = porque(r.saida);
      log(`[falta] Peças do motor: ${POR_QUE[p]}.`);
      if (r.saida.trim()) log(ultimas(r.saida));
      terminar(false, `não consegui baixar as peças da Máquina: ${POR_QUE[p]}.`,
        p === 'internet' ? 'se a sua ferramenta bloqueia a internet (sandbox), peça a permissão pra usar a internet ou rodar fora dela e rode npm run instalar de novo. Sem bloqueio: peça pra pessoa conferir o Wi-Fi.'
          : p === 'outro' ? 'leia as últimas linhas acima, resolva se souber, e rode npm run instalar de novo. Não resolveu: suporte desconstruindouniverso@gmail.com com o print.'
            : 'explique o motivo pra pessoa com as suas palavras e rode npm run instalar de novo depois que ela resolver.');
    }
    log('[ok] Peças do motor');
  }

  // 3. O navegador que desenha o vídeo. No Windows o Edge já vem instalado: se ele abrir, nem precisa baixar nada.
  // No Mac e no Linux, o Chromium da Máquina (baixado uma vez); o Chrome ou o Edge ficam de reserva
  const N = require('./navegador');
  log('... Procurando um navegador que desenhe o vídeo');
  let nav = { ok: false, erro: '' };
  const tinhaChromium = !!N.caminho('chromium');
  if (tinhaChromium || process.platform === 'win32') nav = await N.testar();
  if (!nav.ok) {
    log('... Baixando o navegador que desenha o vídeo (uns 170 MB, de 2 a 5 minutos)');
    const cli = nm('playwright/cli.js');
    const args = [cli, 'install', 'chromium', '--no-shell', '--no-progress'];
    if (tinhaChromium) args.push('--force'); // estava lá e não abriu: o download veio incompleto ou foi estragado
    const r = await rodar(process.execPath, args);
    if (r.status !== 0) log(`   o download não deu certo: ${POR_QUE[porque(r.saida)]}.`);
    nav = await N.testar();
  }
  if (!nav.ok) {
    log('[falta] Navegador que desenha o vídeo');
    log(nav.erro.split('\n').map((l) => `   ${l}`).join('\n'));
    terminar(false, 'não consegui abrir o navegador que desenha o vídeo (ele trabalha escondido, só tira a "foto" de cada quadro).',
      'explique pra pessoa os passos acima com as suas palavras, sem termo técnico. Se a sua ferramenta pediu permissão ou roda em sandbox, peça pra pessoa aprovar (no Codex: "Acesso completo") e rode npm run instalar de novo.');
  }
  log(`[ok] Navegador que desenha o vídeo: ${nav.nome}${nav.canal === 'msedge' && process.platform === 'win32' ? ' (já vem no Windows)' : ''}`);

  // 4. A voz de teste do computador (a das prévias). No Linux é um programa à parte
  if (process.platform === 'linux') {
    const tem = await rodar('espeak-ng', ['--version']);
    if (tem.status !== 0) {
      log('[falta] Voz de teste do computador (espeak-ng)');
      terminar(false, 'falta a voz de teste do Linux.', 'rode sudo apt install -y espeak-ng (vai pedir a senha do computador: peça pra pessoa digitar no terminal, ou pra rodar ela mesma) e depois npm run instalar de novo.');
    }
  }

  // 5. O teste de verdade: 2 imagens do vídeo de exemplo (a lanterna), com a voz do computador
  log('... Testando: desenhando 2 imagens do vídeo de exemplo (de 30 segundos a 2 minutos)');
  const testes = path.join(EXEMPLO, 'testes');
  fs.rmSync(testes, { recursive: true, force: true });
  const t = await rodar(process.execPath, [path.join(__dirname, 'render.js'), EXEMPLO, '--voz-teste', '--previa', '3,30']);
  const imagens = ['previa-3.0s.jpg', 'previa-30.0s.jpg'].map((n) => path.join(testes, n));
  // Uma imagem de verdade da lanterna passa de 100 KB; quadro preto ou vazio fica bem abaixo
  const desenhou = imagens.every((a) => fs.existsSync(a) && fs.statSync(a).size > 40000);
  if (t.status !== 0 || !desenhou) {
    log('[falta] Teste do vídeo de exemplo');
    log(ultimas(t.saida, 15));
    terminar(false, 'a instalação terminou, mas o teste do vídeo de exemplo deu erro.',
      t.status === 4 ? 'o que falhou foi o navegador (explicação acima): explique pra pessoa e rode npm run instalar de novo.'
        : 'leia o erro acima e resolva (se for a voz de teste, veja "Voz de teste do computador" em comandos/boas-vindas.md); depois rode npm run instalar de novo. Não resolveu: suporte desconstruindouniverso@gmail.com com o print.');
  }
  log('[ok] Teste: o vídeo de exemplo desenhou certinho');

  // O que falta depois da parte técnica (o canal e a voz são com a pessoa), pelo conferir
  const c = await rodar(process.execPath, [path.join(__dirname, 'conferir.js')]);
  const faltas = c.saida.split(/\r?\n/).filter((l) => l.startsWith('[falta]'));
  const imagem = path.relative(RAIZ, imagens[1]).split(path.sep).join('/');
  // O painel aberto em "Comece aqui": a pessoa vê o que já está pronto e o que falta (sem depender da IA lembrar)
  prepararAtalhos();
  const url = require('./abrir-painel').abrir();
  const painel = url ? ` O painel da Máquina abriu no navegador da pessoa: mande o link ${url} (clicável) e diga que lá ela acompanha o que já está pronto e o que falta. Se não abriu, também dá pra abrir com dois cliques no ABRIR-PAINEL, na pasta da Máquina.`
    : ' Depois, rode npm run painel e mande pra pessoa o link que ele mostrar, clicável.';
  const mostrar = `Se quiser, mostre pra pessoa a imagem ${imagem} (é a lanterna do vídeo de exemplo) e depois apague a pasta videos/exemplo/testes/.${painel}`;
  if (!faltas.length) terminar(true, 'tudo instalado e configurado.', `conte pra pessoa, em uma linha, que está tudo pronto. ${mostrar} Depois volte ao que ela tinha pedido.`);
  const falta = faltas.join(' ');
  // Canal em branco e uma Máquina antiga no computador: quem já comprou traz tudo de lá, sem refazer as perguntas
  let antiga = '';
  if (/canal\//.test(falta)) {
    try {
      const r = JSON.parse(String(require('child_process').spawnSync(process.execPath, [path.join(__dirname, 'importar.js'), '--json'], { cwd: RAIZ, encoding: 'utf8', timeout: 30000 }).stdout).trim());
      const ps = (r.pastas || []).filter((x) => !x.outroCanal && x.configurado);
      if (ps.length) antiga = ` ANTES das perguntas do canal: achei ${ps.length === 1 ? 'uma versão antiga' : `${ps.length} versões antigas`} da Máquina neste computador (${ps.map((x) => `canal "${x.nome}", ${x.videos.length} vídeos, em ${x.pasta}`).join('; ')}). Pergunte se ela quer trazer o canal e os vídeos de lá: rode npm run importar (mostra o que vem, sem mudar nada) e, com o sim dela, o comando que ele indicar. Depois, siga o que o npm run conferir ainda marcar.`;
    } catch { /* sem conseguir procurar: segue as perguntas */ }
  }
  terminar(true, 'a parte técnica está pronta.',
    `conte pra pessoa, em uma linha, que a parte técnica ficou pronta. ${mostrar}${antiga} Depois siga ` +
    (/canal\//.test(falta) ? 'pro passo 2 de comandos/instalar.md (as perguntas do canal).'
      : /voz do canal/.test(falta) ? 'pro passo 3 de comandos/instalar.md (a voz do canal).'
        : `o que o npm run conferir ainda marca como falta: ${falta}`));
})();
