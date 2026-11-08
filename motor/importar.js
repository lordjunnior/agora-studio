// Traz o canal e os vídeos de uma pasta antiga da Máquina (de qualquer versão) pra esta. Feito pra IA mais fraca: ela só
// roda o comando, mostra a prévia e, com o sim da pessoa, roda de novo com --confirmar.
//
//   npm run importar                     procura a pasta antiga sozinho e mostra o que vai trazer (não muda nada)
//   npm run importar -- --confirmar      traz da pasta achada (com duas ou mais, pede o número)
//   npm run importar -- 2 --confirmar    traz da 2ª pasta da lista
//   npm run importar -- "<pasta>"        usa essa pasta (com --confirmar, traz)
//   --json                               a resposta em JSON (o painel usa, em "Comece aqui")
//
// O que vem: o canal (os textos e o bloco "No roteiro.json", o logo, a capa, as descrições, o histórico, os aprendizados
// e a pauta), a chave da voz (.env), os vídeos inteiros (com a narração guardada: refazer não gasta crédito de novo), os
// pacotes extras de modelos 3D e os extras do Potencializar (canal/extras/). Segurança:
// - a pasta antiga só é lida, nunca muda. Dá pra rodar de novo quantas vezes precisar
// - nesta pasta nada é apagado: o que ela já tinha fica, e o canal daqui ganha se já estava configurado (o antigo só
//   preenche o que está em branco). O que seria trocado vai antes pra canal/importado-<data>/, junto com o relatório
// - o canal antigo vem inteiro (nada do que a pessoa ou a IA escreveu se perde): só entram as seções novas e o texto de
//   instrução que mudou de versão, quando ele está igualzinho ao do modelo antigo
// - o motor antigo não vem (esta pasta tem o novo). Se a IA tinha escrito peças próprias dentro dele, o comando avisa e
//   guarda uma cópia em canal/importado-<data>/motor-antigo/, pra trazer pra canal/pecas/ com cuidado
// - os vídeos só vêm se couberem no disco; sem espaço, vêm sem os .mp4 (que ficam na pasta antiga)
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const C = require('./canal-arquivos');

const RAIZ = path.resolve(__dirname, '..');
const ARQUIVOS_DO_CANAL = ['canal.md', 'identidade.md', 'perfil.md', 'aprendizados.md', 'historico.md', 'pauta.md'];

const ler = (f) => { try { return fs.readFileSync(f, 'utf8').replace(/^﻿/, '').replace(/\r/g, ''); } catch { return null; } };
const lerJson = (f) => { try { return JSON.parse(ler(f)); } catch { return null; } };
const existe = (f) => { try { fs.statSync(f); return true; } catch { return false; } };
const ehPasta = (f) => { try { return fs.statSync(f).isDirectory(); } catch { return false; } };
const listar = (d) => { try { return fs.readdirSync(d, { withFileTypes: true }); } catch { return []; } };
const mb = (n) => (n >= 1e9 ? `${(n / 1e9).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} GB` : `${Math.max(1, Math.round(n / 1e6))} MB`);
const dataBr = (ms) => new Date(ms).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const mesmoTexto = (a, b) => a != null && b != null && a.replace(/\s+$/g, '') === b.replace(/\s+$/g, '');

// Todos os arquivos de uma pasta (caminho relativo), com o tamanho
function arquivosDe(base, rel = '', r = []) {
  for (const d of listar(path.join(base, rel))) {
    if (d.name === '.DS_Store') continue;
    const f = rel ? `${rel}/${d.name}` : d.name;
    if (d.isDirectory()) arquivosDe(base, f, r);
    else if (d.isFile()) r.push({ rel: f, bytes: fs.statSync(path.join(base, f)).size });
  }
  return r;
}
function copiar(de, para) {
  fs.mkdirSync(path.dirname(para), { recursive: true });
  fs.copyFileSync(de, para, fs.constants.COPYFILE_EXCL);
}

// ---------- Achar a pasta antiga ----------

// Uma pasta é da Máquina se tem o motor, o canal e o package.json dela
const ehMaquina = (d) => existe(path.join(d, 'motor', 'kit.js')) && ehPasta(path.join(d, 'canal')) && /"name"\s*:\s*"preguica3d"/.test(ler(path.join(d, 'package.json')) || '');
const PULAR = /^(node_modules|Library|AppData|Applications|Application Data|Music|Movies|Pictures|Videos|Imagens|Músicas|\$Recycle\.Bin|Windows|Program Files.*|ProgramData|snap|go|venv|\.\w.*)$/i;
// Procura a partir da pasta da pessoa, até 4 níveis (Mesa, Documentos, Downloads, OneDrive...), por no máximo uns
// segundos. Fica de fora esta pasta e o que estiver dentro dela
function procurar() {
  const achadas = [], fim = Date.now() + 8000;
  const fila = [{ d: os.homedir(), n: 0 }];
  let vistas = 0;
  while (fila.length && Date.now() < fim && vistas < 40000) {
    const { d, n } = fila.shift();
    vistas++;
    if (path.resolve(d) === RAIZ || path.resolve(d).startsWith(RAIZ + path.sep)) continue;
    if (ehMaquina(d)) { achadas.push(path.resolve(d)); continue; }
    if (n >= 4) continue;
    for (const x of listar(d)) if (x.isDirectory() && !PULAR.test(x.name)) fila.push({ d: path.join(d, x.name), n: n + 1 });
  }
  return achadas;
}

// ---------- O que a pasta antiga tem ----------

const versaoDe = (d) => (lerJson(path.join(d, 'package.json')) || {}).version || '?';
function videosDe(d) {
  return listar(path.join(d, 'videos')).filter((x) => x.isDirectory() && !/^[._]/.test(x.name) && x.name !== 'exemplo').map((x) => {
    const arqs = arquivosDe(path.join(d, 'videos', x.name));
    return { nome: x.name, arquivos: arqs, bytes: arqs.reduce((s, a) => s + a.bytes, 0), mp4: arqs.filter((a) => /\.mp4$/i.test(a.rel)).reduce((s, a) => s + a.bytes, 0) };
  });
}
// O motor antigo, arquivo por arquivo, contra as versões oficiais da Máquina (motor/versoes-oficiais.json, que vem no
// zip): o que não bate com nenhuma versão oficial foi escrito ou mudado pela IA da pessoa
const hashDe = (f) => {
  const b = fs.readFileSync(f);
  const t = /\.(js|json|md|html|txt|css)$/i.test(f) ? Buffer.from(b.toString('utf8').replace(/\r/g, '')) : b;
  return crypto.createHash('sha1').update(t).digest('hex').slice(0, 16);
};
function motorMexido(d) {
  const oficiais = lerJson(path.join(__dirname, 'versoes-oficiais.json'));
  if (!oficiais) return null;
  const doPacote = new Set(((lerJson(path.join(d, 'motor', 'modelos', 'pacotes.json')) || []).flatMap((p) => p.arquivos || [])));
  return arquivosDe(path.join(d, 'motor')).map((a) => `motor/${a.rel}`)
    .filter((rel) => /\.(js|json|html)$/i.test(rel) && !doPacote.has(rel) && rel !== 'motor/modelos/pacotes.json')
    .filter((rel) => !(oficiais[rel] || []).includes(hashDe(path.join(d, rel))));
}
// As peças que o canal manda usar (K.algo() e que esta pasta não tem (nem no motor novo, nem em canal/pecas/)
function pecasQueFaltam(textoDoCanal, pecasAntigas = []) {
  const definidas = new Set();
  const js = [...['kit.js', 'bichos.js', 'cenarios.js'].map((f) => path.join(RAIZ, 'motor', f)),
    ...listar(path.join(RAIZ, 'motor', 'modelos')).filter((x) => x.name.endsWith('.js')).map((x) => path.join(RAIZ, 'motor', 'modelos', x.name)),
    ...listar(path.join(RAIZ, 'canal', 'pecas')).filter((x) => x.name.endsWith('.js')).map((x) => path.join(RAIZ, 'canal', 'pecas', x.name)), ...pecasAntigas];
  for (const f of js) for (const m of (ler(f) || '').matchAll(/\bK\.([A-Za-z_]\w*)\s*=/g)) definidas.add(m[1]);
  return [...new Set([...textoDoCanal.matchAll(/\bK\.([A-Za-z_]\w*)\s*\(/g)].map((m) => m[1]))].filter((n) => !definidas.has(n));
}

// Os dois já configurados, com nomes diferentes: são dois canais, e trazer misturaria um no outro
const semAcento = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');
function outroCanal(nomeAntigo) {
  const daqui = C.campo(ler(path.join(RAIZ, 'canal', 'canal.md')) || '', 'Nome do canal') || '';
  return daqui && nomeAntigo && semAcento(daqui) !== semAcento(nomeAntigo) ? daqui : null;
}

function resumo(d) {
  const canal = ler(path.join(d, 'canal', 'canal.md')) || '';
  const nome = C.campo(canal, 'Nome do canal') || '';
  const videos = videosDe(d);
  const env = ler(path.join(d, '.env')) || '';
  const pacotes = lerJson(path.join(d, 'motor', 'modelos', 'pacotes.json')) || [];
  const quando = Math.max(0, ...[...ARQUIVOS_DO_CANAL.map((f) => path.join(d, 'canal', f)), ...videos.map((v) => path.join(d, 'videos', v.nome))]
    .map((f) => { try { return fs.statSync(f).mtimeMs; } catch { return 0; } }));
  const textoDoCanal = ['canal.md', 'identidade.md', 'aprendizados.md'].map((f) => ler(path.join(d, 'canal', f)) || '').join('\n');
  const pecasAntigas = listar(path.join(d, 'canal', 'pecas')).filter((x) => x.name.endsWith('.js')).map((x) => path.join(d, 'canal', 'pecas', x.name));
  return {
    pasta: d, versao: versaoDe(d), nome, configurado: !!nome, quando, outroCanal: outroCanal(nome),
    videos: videos.map((v) => ({ nome: v.nome, bytes: v.bytes, mp4: v.mp4 })), bytes: videos.reduce((s, v) => s + v.bytes, 0),
    logo: ['logo.png', 'logo.jpg'].some((f) => existe(path.join(d, 'canal', f))), capa: ['banner.jpg', 'banner.png'].some((f) => existe(path.join(d, 'canal', f))),
    chave: /^\s*ELEVENLABS_API_KEY\s*=\s*\S+/m.test(env), pacotes: pacotes.map((p) => p.nome),
    motorMexido: motorMexido(d), pecasQueFaltam: pecasQueFaltam(textoDoCanal, pecasAntigas)
  };
}

// ---------- Mesclar o canal ----------

// Os títulos que mudaram de nome e o texto de instrução que mudou entre as versões: só troca o que está igualzinho ao
// modelo antigo (o que a pessoa ou a IA escreveu fica como está)
const LUGARES_V2 = 'Lugares: `quintal`, `praia`, `cozinha`, `espaco`, `lua`, `escuro` (mundo de dentro: átomos, células). Horas: `dia`, `tarde`, `noite`.';
const LOGO_V1 = 'Coloque o logo do canal em `canal/logo.png` (quadrado). Ele aparece no fim de todo vídeo. Sem logo, o fim sai só com a plaquinha.';
const SINONIMOS = { 'Lugar e hora padrão': 'Cenário e hora padrão' };
function paragrafoDoModelo(modelo, comeco) {
  const p = modelo.split(/\n\s*\n/).find((x) => x.startsWith(comeco));
  return p ? p.trim() : null;
}
const titulos = (t) => [...t.matchAll(/^##\s+(.+?)\s*$/gm)].map((m) => m[1]);
// O arquivo antigo inteiro, com as seções do modelo novo que faltam (cada uma no lugar dela) e o texto de instrução novo
function mesclar(velho, modelo) {
  let txt = velho;
  const cenarios = paragrafoDoModelo(modelo, 'Cenários prontos'), logo = paragrafoDoModelo(modelo, 'Coloque o logo');
  if (cenarios && txt.includes(LUGARES_V2)) txt = txt.replace(LUGARES_V2, cenarios).replace(/^## Lugar e hora padrão\s*$/m, '## Cenário e hora padrão');
  if (logo && txt.includes(LOGO_V1)) txt = txt.replace(LOGO_V1, logo);
  const L = modelo.split('\n'), novos = titulos(modelo);
  novos.forEach((t, i) => {
    const tem = titulos(txt).some((x) => x === t || SINONIMOS[x] === t);
    if (tem) return;
    const s = C.acharSecao(L, [t]);
    const bloco = L.slice(s.i, s.fim).join('\n').replace(/\s+$/, '');
    // Depois da seção que vem antes dela no modelo; sem nenhuma, antes do bloco "No roteiro.json" (ou no fim)
    const antes = novos.slice(0, i).reverse().find((x) => titulos(txt).some((y) => y === x || SINONIMOS[y] === x));
    const T = txt.split('\n');
    let k;
    if (antes) {
      const a = C.acharSecao(T, [antes, ...Object.keys(SINONIMOS).filter((y) => SINONIMOS[y] === antes)]);
      k = a.fim;
    } else {
      k = T.findIndex((l) => /^##\s+No roteiro\.json/.test(l));
      if (k < 0) k = T.length;
    }
    while (k > 0 && !T[k - 1].trim()) k--;
    T.splice(k, 0, '', bloco);
    txt = T.join('\n').replace(/\n{3,}/g, '\n\n');
  });
  return txt.endsWith('\n') ? txt : txt + '\n';
}
// O canal daqui já configurado: o antigo só preenche o que está em branco (campo por campo e no bloco, o que ainda é o
// valor do modelo em branco)
function preencherBrancos(f, novo, velho) {
  let txt = novo;
  if (f === 'canal.md') {
    for (const r of ['Nome do canal', '@ nas redes', 'Assinatura do fim do vídeo']) {
      if (!C.campo(txt, r) && C.campo(velho, r)) txt = C.trocarCampo(txt, r, C.campo(velho, r));
    }
  }
  for (const c of Object.values(C.CAMPOS)) {
    if (c.arq !== f) continue;
    const v = C.lerCampo(velho, c).valor;
    if (v && !C.lerCampo(txt, c).valor) txt = C.trocarCampoLongo(txt, c, v);
  }
  for (const l of Object.values(C.LINHAS)) {
    if (l.secao.arq === f && !C.campo(txt, l.rotulo) && C.campo(velho, l.rotulo)) txt = C.trocarCampo(txt, l.rotulo, C.campo(velho, l.rotulo));
  }
  if (f === 'identidade.md') {
    const bloco = (t) => { const m = t.match(C.RE_BLOCO); try { return m ? JSON.parse(`{${m[2].trim().replace(/,\s*$/, '')}}`) : null; } catch { return null; } };
    const bv = bloco(velho), bn = bloco(txt), bb = bloco(C.emBranco('identidade.md') || '') || {};
    if (bv && bn) {
      const m = {};
      for (const [k, v] of Object.entries(bv)) if (!(k in bn) || JSON.stringify(bn[k]) === JSON.stringify(bb[k])) m[k] = v;
      if (Object.keys(m).length) txt = C.trocarNoBloco(txt, m) || txt;
    }
  }
  return txt;
}

// ---------- Trazer ----------

function trazer(antiga) {
  C.garantirCanal();
  const outro = outroCanal(C.campo(ler(path.join(antiga, 'canal', 'canal.md')) || '', 'Nome do canal'));
  if (outro) {
    return { ok: false, mensagem: `Essa pasta antiga é de outro canal, e esta já é do canal "${outro}": pra não misturar os dois, não trouxe nada. Cada canal fica numa pasta da Máquina: pra atualizar o outro, extraia a versão nova em mais uma pasta e traga pra lá.` };
  }
  const d = new Date(), z = (n) => String(n).padStart(2, '0');
  const carimbo = `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}-${z(d.getHours())}h${z(d.getMinutes())}`;
  const guarda = path.join(RAIZ, 'canal', `importado-${carimbo}`);
  const r = { ok: true, pasta: antiga, guarda: path.relative(RAIZ, guarda).split(path.sep).join('/'), feitos: [], ficou: [], avisos: [] };
  const feito = (t) => r.feitos.push(t), ficou = (t) => r.ficou.push(t);
  const guardar = (rel, de) => { const p = path.join(guarda, rel); if (!existe(p)) copiar(de, p); };
  const daqui = (...p) => path.join(RAIZ, ...p), dela = (...p) => path.join(antiga, ...p);

  // O canal: os arquivos de texto
  for (const f of ARQUIVOS_DO_CANAL) {
    const velho = ler(dela('canal', f));
    if (velho == null) continue;
    const novo = ler(daqui('canal', f)), branco = C.emBranco(f);
    if (mesmoTexto(novo, velho)) continue;
    if (novo == null || mesmoTexto(novo, branco)) {
      // Esta pasta ainda está em branco: vem o antigo inteiro (com as seções novas, nos que têm modelo com seções)
      const txt = ['canal.md', 'identidade.md'].includes(f) && branco ? mesclar(velho, branco) : velho;
      fs.writeFileSync(daqui('canal', f), txt);
      feito(`canal/${f}`);
    } else if (['canal.md', 'identidade.md'].includes(f)) {
      guardar(`canal-antigo/${f}`, dela('canal', f));
      const txt = preencherBrancos(f, novo, velho);
      if (txt !== novo) { fs.writeFileSync(daqui('canal', f), txt); feito(`canal/${f} (só o que estava em branco aqui)`); }
      ficou(`canal/${f}: o daqui já estava configurado e ficou (o antigo está em ${r.guarda}/canal-antigo/)`);
    } else if (f === 'perfil.md') {
      const sv = C.secoes(velho), sn = C.secoes(novo), d = {};
      for (const [k, rede] of Object.entries(C.REDES)) if (sv[rede.titulo] && !sn[rede.titulo]) d[k] = sv[rede.titulo];
      if (Object.keys(d).length) { C.salvarDescricoes(d); feito('canal/perfil.md (as descrições que faltavam)'); }
    } else {
      // Histórico, aprendizados e pauta: o antigo entra no fim, sem tirar nada do daqui
      const corpo = velho.replace(/^#\s.*\n/, '').trim();
      if (corpo && !novo.includes(corpo)) {
        fs.writeFileSync(daqui('canal', f), `${novo.replace(/\s+$/, '')}\n\n## Da versão antiga (trazido em ${dataBr(Date.now())})\n\n${corpo}\n`);
        feito(`canal/${f} (o da versão antiga entrou no fim)`);
      }
    }
  }
  // As versões antigas não tinham o @ no bloco "No roteiro.json" (o cartão de seguir do fim usa): vem do canal.md
  const id = ler(daqui('canal', 'identidade.md')), arroba = C.campo(ler(daqui('canal', 'canal.md')) || '', '@ nas redes');
  const bloco = id && id.match(C.RE_BLOCO);
  if (bloco && arroba && !/"arroba"\s*:/.test(bloco[2])) { const t = C.trocarNoBloco(id, { arroba }); if (t) fs.writeFileSync(daqui('canal', 'identidade.md'), t); }
  // O logo e a capa: vêm se aqui não tem; se tem, fica o daqui e o antigo é guardado
  for (const nomes of [['logo.png', 'logo.jpg'], ['banner.jpg', 'banner.png']]) {
    const v = nomes.find((n) => existe(dela('canal', n)));
    if (!v) continue;
    const n = nomes.find((x) => existe(daqui('canal', x)));
    if (!n) { copiar(dela('canal', v), daqui('canal', v)); feito(`canal/${v}`); } else if (hashDe(dela('canal', v)) !== hashDe(daqui('canal', n))) {
      guardar(`canal-antigo/${v}`, dela('canal', v));
      ficou(`canal/${n}: ficou o daqui (o antigo está em ${r.guarda}/canal-antigo/)`);
    }
  }
  // As pastas do canal (testes de voz, referências, peças próprias, os extras do Potencializar): o que falta aqui
  for (const sub of ['testes-de-voz', 'referencias', 'pecas', 'extras']) {
    let n = 0;
    for (const a of arquivosDe(dela('canal', sub))) if (!existe(daqui('canal', sub, a.rel))) { copiar(dela('canal', sub, a.rel), daqui('canal', sub, a.rel)); n++; }
    if (n) feito(`canal/${sub}/ (${n} ${n === 1 ? 'arquivo' : 'arquivos'})`);
  }

  // A chave da voz e o resto do .env: só as linhas que faltam aqui (a chave nunca aparece)
  const envV = ler(dela('.env'));
  if (envV) {
    const envN = ler(daqui('.env')) || '';
    const tem = new Set([...envN.matchAll(/^\s*([A-Z0-9_]+)\s*=\s*\S/gm)].map((m) => m[1]));
    const novas = envV.split('\n').filter((l) => { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*\S/); return m && !tem.has(m[1]); });
    if (novas.length) {
      fs.writeFileSync(daqui('.env'), `${envN.replace(/\s*$/, '')}${envN.trim() ? '\n' : ''}${novas.join('\n')}\n`);
      feito(novas.some((l) => /^\s*ELEVENLABS_API_KEY/.test(l)) ? 'a chave da ElevenLabs (.env)' : '.env');
    }
  }

  // Os vídeos: inteiros, se couberem no disco (com folga de 1 GB); sem espaço, sem os .mp4
  const videos = videosDe(antiga);
  let livre = Infinity;
  try { const s = fs.statfsSync(RAIZ); livre = s.bavail * s.bsize; } catch { /* sem como saber: tenta inteiro */ }
  const total = videos.reduce((s, v) => s + v.bytes, 0), semMp4 = total + 1e9 > livre;
  if (semMp4 && videos.length) r.avisos.push(`Não cabia tudo no disco (os vídeos têm ${mb(total)}): vieram sem os .mp4, que ficaram na pasta antiga.`);
  for (const v of videos) {
    let destino = v.nome;
    if (existe(daqui('videos', destino))) {
      const iguais = v.arquivos.every((a) => existe(daqui('videos', destino, a.rel)) && fs.statSync(daqui('videos', destino, a.rel)).size === a.bytes);
      if (iguais) continue;
      for (let i = 1; existe(daqui('videos', destino)); i++) destino = `${v.nome}-antigo${i > 1 ? `-${i}` : ''}`;
    }
    for (const a of v.arquivos) if (!(semMp4 && /\.mp4$/i.test(a.rel))) copiar(dela('videos', v.nome, a.rel), daqui('videos', destino, a.rel));
    feito(`videos/${destino}${destino !== v.nome ? ` (já tinha um "${v.nome}" aqui)` : ''}`);
  }

  // Os pacotes extras de modelos 3D: os que faltam aqui (sem trocar arquivo que esta versão já tem)
  const REG = ['motor', 'modelos', 'pacotes.json'];
  const regV = lerJson(dela(...REG)) || [], regN = lerJson(daqui(...REG)) || [];
  const trazidos = [];
  for (const p of regV) {
    if (regN.some((x) => x.nome === p.nome)) continue;
    const arqs = (p.arquivos || []).filter((rel) => existe(dela(...rel.split('/'))));
    for (const rel of arqs) if (!existe(daqui(...rel.split('/')))) copiar(dela(...rel.split('/')), daqui(...rel.split('/')));
    regN.push({ ...p, arquivos: arqs });
    trazidos.push(p.nome);
  }
  if (trazidos.length) {
    fs.writeFileSync(daqui(...REG), JSON.stringify(regN, null, 2) + '\n');
    feito(`pacotes de modelos 3D: ${trazidos.join(', ')}`);
    try { require('child_process').spawn(process.execPath, [path.join(__dirname, 'ver-modelos.js')], { cwd: RAIZ, detached: true, stdio: 'ignore', windowsHide: true }).unref(); } catch { /* as fotos saem depois */ }
  }

  // O motor antigo com peça própria: não vem (pode quebrar o novo), mas fica guardado
  const mexido = motorMexido(antiga) || [];
  for (const rel of mexido) guardar(`motor-antigo/${rel.replace(/^motor\//, '')}`, dela(...rel.split('/')));
  const textoDoCanal = ['canal.md', 'identidade.md', 'aprendizados.md'].map((f) => ler(daqui('canal', f)) || '').join('\n');
  const faltam = pecasQueFaltam(textoDoCanal);
  if (mexido.length || faltam.length) {
    r.avisos.push(`${faltam.length ? `O canal usa peças que a IA tinha escrito dentro do motor antigo (${faltam.map((n) => `K.${n}`).join(', ')}), e elas não vieram: o motor novo é outro. ` : 'A IA tinha mexido no motor antigo. '}` +
      `Guardei o motor antigo em ${r.guarda}/motor-antigo/. Pra usar de novo, peça pra IA: "traz as peças próprias do motor antigo pra canal/pecas/" (com uma IA boa), ou troque pra um personagem pronto no painel, em Meu canal.`);
    r.pecas = faltam;
  }

  // O relatório, junto com o que foi guardado
  if (r.feitos.length || r.ficou.length || r.avisos.length) {
    fs.mkdirSync(guarda, { recursive: true });
    fs.writeFileSync(path.join(guarda, 'RELATORIO.txt'), [`Trazido de ${antiga} (versão ${versaoDe(antiga)}) em ${dataBr(Date.now())}. A pasta antiga não mudou.`, '',
      'Veio:', ...r.feitos.map((x) => `- ${x}`), '', 'Ficou como estava aqui:', ...(r.ficou.length ? r.ficou.map((x) => `- ${x}`) : ['- nada']), '',
      ...(r.avisos.length ? ['Atenção:', ...r.avisos.map((x) => `- ${x}`), ''] : [])].join('\n'));
  }
  return r;
}

// ---------- O comando ----------

function escolher(args) {
  const alvo = args.find((a) => !a.startsWith('--') && !/^\d+$/.test(a));
  if (alvo) {
    const p = path.resolve(alvo.replace(/^~(?=$|[\\/])/, os.homedir()));
    return { lista: [p], escolhida: ehMaquina(p) && p !== RAIZ ? p : null, erro: ehMaquina(p) ? (p === RAIZ ? 'essa é a própria pasta nova' : null) : 'não é uma pasta da Máquina (falta o motor ou o canal)' };
  }
  const lista = procurar().map(resumo).sort((a, b) => b.configurado - a.configurado || b.quando - a.quando).map((x) => x.pasta);
  const n = Number(args.find((a) => /^\d+$/.test(a)));
  return { lista, escolhida: n ? lista[n - 1] || null : lista.length === 1 ? lista[0] : null };
}

function principal() {
  const args = process.argv.slice(2), json = args.includes('--json'), confirmar = args.includes('--confirmar');
  const { lista, escolhida, erro } = escolher(args);
  const resumos = lista.filter(ehMaquina).map(resumo);
  if (json && !confirmar) { console.log(JSON.stringify({ pastas: resumos, livre: (() => { try { const s = fs.statfsSync(RAIZ); return s.bavail * s.bsize; } catch { return null; } })() })); return; }
  if (json && confirmar) {
    if (!escolhida) { console.log(JSON.stringify({ ok: false, mensagem: erro || 'Escolha a pasta antiga.' })); return; }
    console.log(JSON.stringify(trazer(escolhida)));
    return;
  }
  if (erro) { console.log(`IMPORTAR: "${lista[0]}" ${erro}.\nPRA IA: pergunte pra pessoa onde está a pasta antiga da Máquina e rode npm run importar -- "<a pasta>".`); process.exit(1); }
  if (!resumos.length) {
    console.log('IMPORTAR: não achei nenhuma pasta antiga da Máquina neste computador (procurei na pasta da pessoa: Mesa, Documentos, Downloads, OneDrive).');
    console.log('PRA IA: pergunte pra pessoa onde está a pasta antiga (ela pode arrastar a pasta pra conversa) e rode npm run importar -- "<a pasta>".');
    process.exit(1);
  }
  if (!confirmar || !escolhida) {
    console.log(`IMPORTAR: achei ${resumos.length === 1 ? '1 pasta antiga' : `${resumos.length} pastas`} da Máquina. Nada foi mudado ainda.\n`);
    resumos.forEach((x, i) => {
      console.log(`${i + 1}. ${x.pasta}`);
      console.log(`   versão ${x.versao}, mexida em ${x.quando ? dataBr(x.quando) : '?'}`);
      console.log(`   canal: ${x.nome ? `"${x.nome}"` : 'ainda não configurado'}${x.logo ? ', com logo' : ''}${x.capa ? ', com capa' : ''}${x.chave ? ', com a chave da ElevenLabs' : ''}`);
      console.log(`   vídeos: ${x.videos.length ? `${x.videos.length} (${x.videos.map((v) => v.nome).join(', ')}), ${mb(x.bytes)}` : 'nenhum'}${x.pacotes.length ? `\n   pacotes de modelos 3D: ${x.pacotes.join(', ')}` : ''}`);
      if (x.outroCanal) console.log(`   atenção: é de outro canal (esta pasta já é do "${x.outroCanal}"): não dá pra trazer pra cá, pra não misturar os dois`);
      if (x.pecasQueFaltam.length || (x.motorMexido && x.motorMexido.length)) console.log(`   atenção: a IA tinha escrito peças próprias dentro do motor${x.pecasQueFaltam.length ? ` (${x.pecasQueFaltam.map((n) => `K.${n}`).join(', ')})` : ''}: elas não vêm sozinhas; o motor antigo fica guardado`);
    });
    console.log('\nO que acontece ao trazer: a pasta antiga não muda (só é lida); aqui nada é apagado; se esta pasta já tiver o canal');
    console.log('configurado, ele fica, e o antigo só preenche o que está em branco; o que seria trocado é guardado antes.');
    if (resumos.length > 1 && confirmar) console.log('\nTem mais de uma pasta: diga qual pelo número.');
    const alvo = args.find((a) => !a.startsWith('--') && !/^\d+$/.test(a));
    console.log(resumos.length === 1
      ? `\nPRA IA: mostre isto pra pessoa, com as suas palavras, e pergunte se pode trazer. Se ela disser sim, rode: npm run importar -- ${alvo ? `"${resumos[0].pasta}" ` : ''}--confirmar`
      : '\nPRA IA: mostre a lista pra pessoa e pergunte de qual pasta trazer (normalmente a do canal dela, a mexida por último). Depois rode: npm run importar -- <o número> --confirmar');
    return;
  }
  const r = trazer(escolhida);
  if (!r.ok) { console.log(`IMPORTAR: NADA TRAZIDO. ${r.mensagem}\nPRA IA: explique isso pra pessoa com as suas palavras.`); process.exit(1); }
  console.log(`IMPORTAR: PRONTO. Trouxe de ${escolhida} (a pasta antiga não mudou).`);
  if (r.feitos.length) { console.log('\nVeio:'); r.feitos.forEach((x) => console.log(`- ${x}`)); } else console.log('\nNada novo pra trazer: esta pasta já tinha tudo.');
  if (r.ficou.length) { console.log('\nFicou como estava aqui:'); r.ficou.forEach((x) => console.log(`- ${x}`)); }
  if (r.avisos.length) { console.log('\nAtenção:'); r.avisos.forEach((x) => console.log(`- ${x}`)); }
  if (existe(path.join(RAIZ, r.guarda))) console.log(`\nO relatório e o que foi guardado: ${r.guarda}/`);
  const P = require('./abrir-painel');
  const url = P.abrir();
  console.log(`\n${P.avisar(url, 'o canal e os vídeos que vieram da versão antiga').join('\n')}`);
  console.log('PRA IA: conte pra pessoa em 2 ou 3 linhas o que veio e o que ficou de fora (as linhas "Atenção", se tiver), e rode npm run conferir pra ver se falta alguma coisa (as seções novas do canal ela completa no painel, em Meu canal). Diga que ela pode guardar a pasta antiga até conferir tudo.');
}

module.exports = { procurar, resumo, trazer };
if (require.main === module) principal();
