// Confere, item por item, se a Máquina está instalada e o canal configurado, antes de qualquer pedido de vídeo.
// A IA roda isto no começo da conversa e conta o resultado pra pessoa em palavras simples (comandos/boas-vindas.md).
// Uso: npm run conferir   (sai com código 0 se não faltar nada, 1 se faltar algo)
// Cada linha: [ok] pronto · [falta] resolver antes do vídeo · [aviso] funciona, com um porém · [opcional] não precisa
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const V = require('./voz');
const N = require('./navegador');

const RAIZ = path.resolve(process.argv[2] || path.join(__dirname, '..'));
if (RAIZ === path.resolve(__dirname, '..')) require('./canal-arquivos').garantirCanal();
const itens = [];
const item = (status, texto) => itens.push({ status, texto });
const roda = (cmd, args) => {
  try { return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 20000 }); } catch { return null; }
};
const modulo = (nome) => { try { return require(path.join(RAIZ, 'node_modules', nome)); } catch { return null; } };

// O Playwright (o que abre o navegador) pede o Node 20 ou mais novo
const [maior] = process.versions.node.split('.').map(Number);
if (maior < 20) item('falta', `Node.js ${process.versions.node} é antigo: instale o Node 20 ou mais novo (versão LTS, em nodejs.org)`);
else item('ok', `Node.js ${process.versions.node}`);

// Motor de animação: as bibliotecas do npm e o ffmpeg/ffprobe que vêm junto (baixados no npm install)
const playwright = modulo('playwright');
const ffmpeg = modulo('ffmpeg-static');
const ffprobe = modulo('ffprobe-static');
const motorOk = playwright && fs.existsSync(path.join(RAIZ, 'node_modules/three')) &&
  ffmpeg && fs.existsSync(ffmpeg) && ffprobe && fs.existsSync(ffprobe.path);
if (motorOk) item('ok', 'motor de animação (bibliotecas e ffmpeg)');
else item('falta', 'motor de animação: rode npm run instalar');

// O Chromium da Máquina, o Edge ou o Chrome (motor/navegador.js): basta um. Quem testa se ele abre é o npm run instalar
const navegador = playwright ? N.qual() : null;
if (navegador) item('ok', `navegador que desenha o vídeo (${navegador.nome})`);
else item('falta', 'navegador que desenha o vídeo: rode npm run instalar');

// Voz de teste: a do próprio computador. É a das prévias e a do vídeo quando não tem a voz profissional
if (process.platform === 'darwin') {
  const vozes = roda('say', ['-v', '?']);
  if (vozes === null) item('aviso', 'voz de teste do computador: não consegui conferir');
  else if (/^Luciana\s/m.test(vozes)) item('ok', 'voz de teste do computador');
  // Sem a Luciana o Mac usa a voz padrão dele: as prévias funcionam, só com outro sotaque
  else item('aviso', 'voz de teste do computador: falta a voz Luciana, então as prévias saem com a voz padrão do Mac (pra ter: Ajustes do Sistema > Acessibilidade > Conteúdo Falado > Voz do Sistema > Gerenciar Vozes > Português (Brasil) > Luciana)');
} else if (process.platform === 'win32') {
  const culturas = roda('powershell', ['-NoProfile', '-Command',
    'Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).GetInstalledVoices() | ForEach-Object { $_.VoiceInfo.Culture.Name }']);
  if (culturas === null) item('aviso', 'voz de teste do computador: não consegui conferir (o PowerShell não respondeu)');
  else if (/^pt/m.test(culturas)) item('ok', 'voz de teste do computador');
  else item('aviso', 'voz de teste do computador: o Windows não tem voz em português, então ela sai com sotaque de outra língua (serve pra testar; a voz profissional resolve)');
} else if (roda('espeak-ng', ['--version']) !== null) {
  item('ok', 'voz de teste do computador');
} else {
  item('falta', 'voz de teste do computador: rode sudo apt install espeak-ng');
}

// Canal: os modelos vêm com campos de exemplo entre colchetes ("[ex: ...]"); preenchidos, eles somem
const MODELO = /\[[^\]]*\b(ex|Ex|ej|Ej|Descreva)[:.][^\]]*\]/;
let canalOk = true;
for (const arq of ['canal/canal.md', 'canal/identidade.md']) {
  let txt = '';
  try { txt = fs.readFileSync(path.join(RAIZ, arq), 'utf8'); } catch { item('falta', `${arq} não existe`); canalOk = false; continue; }
  // nome do campo: o "**Campo:**" da linha ou, num parágrafo de exemplo, o título "## Seção" de cima
  const campos = [];
  let secao = '';
  for (const l of txt.split('\n')) {
    if (l.startsWith('## ')) secao = l.slice(3).trim();
    if (!MODELO.test(l)) continue;
    const rotulo = l.match(/^\*\*([^*:]+):?\*\*/);
    const nome = rotulo ? rotulo[1].trim() : secao;
    if (nome && !campos.includes(nome)) campos.push(nome);
  }
  if (campos.length) {
    item('falta', `${arq} ainda não foi configurado (${campos.slice(0, 4).join(', ')}${campos.length > 4 ? '...' : ''})`);
    canalOk = false;
  }
}
if (canalOk) item('ok', 'canal configurado (canal/canal.md e canal/identidade.md)');

// Peças que o canal manda usar (K.algo( no canal) e que não existem nesta pasta: nas versões antigas, a IA escrevia peça
// própria dentro do motor/kit.js, e o motor da versão nova não tem. Hoje elas ficam em canal/pecas/
const lerTxt = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch { return ''; } };
const jsDe = (d) => { try { return fs.readdirSync(d).filter((f) => f.endsWith('.js')).map((f) => path.join(d, f)); } catch { return []; } };
const definidas = new Set();
for (const f of [...['kit.js', 'bichos.js', 'cenarios.js'].map((f) => path.join(RAIZ, 'motor', f)), ...jsDe(path.join(RAIZ, 'motor', 'modelos')), ...jsDe(path.join(RAIZ, 'canal', 'pecas'))]) {
  for (const m of lerTxt(f).matchAll(/\bK\.([A-Za-z_]\w*)\s*=/g)) definidas.add(m[1]);
}
const pecasQueFaltam = [...new Set(['canal.md', 'identidade.md', 'aprendizados.md'].flatMap((f) => [...lerTxt(path.join(RAIZ, 'canal', f)).matchAll(/\bK\.([A-Za-z_]\w*)\s*\(/g)].map((m) => m[1])))]
  .filter((n) => !definidas.has(n));
if (pecasQueFaltam.length) {
  item('aviso', `peças próprias do canal: o canal usa ${pecasQueFaltam.map((n) => `K.${n}`).join(', ')}, que não existem nesta pasta (numa versão antiga, a IA escreveu essas peças dentro do motor). Traga com npm run importar (da pasta antiga), ou troque pra um personagem pronto no painel`);
}

// Voz do canal: a que a pessoa escolheu na instalação (o "voz" do bloco "No roteiro.json" de canal/identidade.md).
// Nunca mostra a chave: só diz se ela existe, onde está e se a ElevenLabs aceita
async function conferirVoz() {
  const voz = V.vozDoCanal(RAIZ);
  const { chave, arquivo, linha, certo } = V.chaveElevenlabs(RAIZ);
  const onde = arquivo !== '.env' ? `no arquivo "${arquivo}"` : linha ? `no .env, na linha "${linha}="` : 'no .env, sem o nome da linha';
  const lugarErrado = chave && arquivo && !certo
    ? `a chave da ElevenLabs está ${onde}, mas o certo é o arquivo ".env" com a linha ELEVENLABS_API_KEY=... (funciona assim, mas a IA deve corrigir: renomear o arquivo pra .env ou acertar o nome da linha, sem mostrar a chave)`
    : '';
  if (!voz) {
    item('falta', 'voz do canal: ainda não escolhida (ElevenLabs, VoiceStudio grátis ou a voz do computador: comandos/instalar.md, passo 3)');
  } else if (voz.motor === 'elevenlabs') {
    if (!chave) {
      item('falta', `voz do canal (ElevenLabs): falta a chave no arquivo .env (ELEVENLABS_API_KEY=...)${arquivo ? `; o arquivo ${arquivo} tem a linha, mas a chave está vazia` : ''}`);
    } else {
      const c = await V.contaElevenlabs(chave, 5000);
      if (c.ok) {
        const sobra = `sobram ${V.mil(c.restante)} de ${V.mil(c.limite)} caracteres (uns ${Math.floor(c.restante / V.CARACTERES_POR_MINUTO)} min de narração)` +
          (c.renova ? `, o plano renova em ${V.dataBr(c.renova)}` : '');
        if (c.restante < V.CARACTERES_POR_MINUTO && !c.estende) {
          item('aviso', `voz do canal (ElevenLabs): os créditos estão acabando: ${sobra}. Não dá pra um vídeo: até renovar, plano pago, VoiceStudio (grátis) ou a voz do computador`);
        } else item('ok', `voz do canal (ElevenLabs): chave funcionando, ${sobra}`);
      } else if (c.erro === 'chave') item('falta', 'voz do canal (ElevenLabs): a ElevenLabs recusou a chave salva (copie de novo a chave inteira, que começa com sk_)');
      else if (c.erro === 'permissao') item('ok', 'voz do canal (ElevenLabs): chave salva (ela não deixa ver os créditos)');
      else if (c.erro === 'bloqueio') item('aviso', 'voz do canal (ElevenLabs): a ElevenLabs bloqueou o plano grátis desta conta (VPN, conta nova ou várias contas): plano pago ou VoiceStudio');
      else item('aviso', 'voz do canal (ElevenLabs): chave salva, mas não consegui falar com a ElevenLabs agora (sem internet?)');
      if (!voz.id) item('falta', 'voz do canal (ElevenLabs): falta o "id" da voz no bloco "No roteiro.json" de canal/identidade.md (npm run vozes lista as vozes da conta)');
    }
  } else if (voz.motor === 'voicestudio') {
    const vs = await V.voicestudio();
    if (!vs.ok && vs.erro === 'abrindo') item('aviso', 'voz do canal (VoiceStudio, grátis): o programa está abrindo, ainda carregando; esperar 1 ou 2 minutos antes do vídeo');
    else if (!vs.ok) item('aviso', `voz do canal (VoiceStudio, grátis): o programa não está aberto agora (procurei em ${V.voicestudioUrl()}); abrir o VoiceStudio antes de fazer o vídeo (npm run voicestudio -- --abrir abre e espera)`);
    else if (voz.id && voz.id !== 'default' && !vs.vozes.some((v) => V.mesmaVoz(v, voz.id))) {
      item('aviso', `voz do canal (VoiceStudio): aberto, mas não achei a voz "${voz.id}" nele (npm run voicestudio lista as que existem e diz o que fazer)`);
    } else item('ok', `voz do canal (VoiceStudio, grátis): aberto e respondendo${voz.id ? `, voz "${voz.id}"` : ''}`);
  } else if (voz.motor === 'teste') {
    item('aviso', 'voz do canal: a voz do computador (robótica: serve pra testar; pra postar, a ElevenLabs ou o VoiceStudio)');
  } else {
    item('falta', `voz do canal: "${voz.motor}" não existe (o "motor" da voz é elevenlabs, voicestudio ou teste)`);
  }
  if (lugarErrado) item('aviso', `voz do canal: ${lugarErrado}`);
  if (voz && voz.motor !== 'elevenlabs' && chave) item('opcional', 'chave da ElevenLabs salva (a voz do canal é outra; dá pra trocar quando quiser)');
}

(async () => {
  V.carregarEnv(RAIZ);
  await conferirVoz();

  if (['logo.png', 'logo.jpg'].some((n) => fs.existsSync(path.join(RAIZ, 'canal', n)))) item('ok', 'logo do canal');
  else item('opcional', 'logo do canal: sem logo (canal/logo.png); o cartão de seguir do fim mostra a inicial do canal');
  // O resto do perfil nas redes (o painel ajuda: npm run painel, em "Meu canal")
  if (['banner.jpg', 'banner.png'].some((n) => fs.existsSync(path.join(RAIZ, 'canal', n)))) item('ok', 'banner do YouTube');
  else item('opcional', 'banner do YouTube: sem banner (canal/banner.jpg); dá pra pôr no painel (npm run painel)');
  let perfil = '';
  try { perfil = fs.readFileSync(path.join(RAIZ, 'canal/perfil.md'), 'utf8').replace(/<!--[\s\S]*?-->/g, ''); } catch { /* sem o arquivo */ }
  const semDescricao = ['YouTube', 'TikTok', 'Instagram'].filter((r) => !(perfil.split(new RegExp(`^## ${r}\\s*$`, 'm'))[1] || '').split(/^## /m)[0].trim());
  if (!semDescricao.length) item('ok', 'descrições do canal (YouTube, TikTok e Instagram)');
  else item('opcional', `descrições do canal: falta ${semDescricao.join(', ')} (canal/perfil.md; a IA escreve e o painel mostra com botão de copiar)`);

  const falta = itens.some((i) => i.status === 'falta');
  console.log(falta ? 'FALTA CONFIGURAR:' : 'PRONTO: Máquina instalada e canal configurado.');
  itens.forEach((i) => console.log(`[${i.status}] ${i.texto}`));
  // O painel (a parte visual da Máquina): toda resposta da IA termina com o link dele
  const painel = await require('./abrir-painel').ligado();
  if (painel) console.log(`PAINEL: ligado: ${painel.url}\nPRA IA: termine a sua resposta com este link do painel, clicável, e uma frase do que a pessoa vê lá.`);
  else console.log('PAINEL: desligado.\nPRA IA: rode npm run painel (abre o painel no navegador da pessoa) e termine a sua resposta com o link que ele mostrar, clicável.');
  if (falta) {
    console.log('Siga comandos/instalar.md antes de fazer qualquer vídeo.');
    process.exit(1);
  }
})();
