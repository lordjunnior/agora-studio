// O canal num prompt só: a pessoa responde as perguntas do CONFIGURAR-MEU-CANAL.txt (num bloco de notas), cola na IA e
// a IA roda um comando. O comando lê as respostas, salva tudo nos arquivos do canal e abre o painel em "Meu canal", que
// mostra o que mudou. Feito pra funcionar com a IA mais fraca: ela só roda o comando e repete a mensagem do fim.
//
//   npm run canal                 lê as respostas e salva. Procura, nesta ordem: canal/respostas.txt (a IA salva lá o
//                                 texto que a pessoa colou), a área de transferência (a pessoa acabou de copiar o texto
//                                 pra colar na IA) e o próprio CONFIGURAR-MEU-CANAL.txt, se ela respondeu nele
//   npm run canal -- <arquivo>    lê as respostas desse arquivo
//   npm run canal -- --modelo     escreve o CONFIGURAR-MEU-CANAL.txt de novo, em branco (depois de mudar as perguntas)
//
// O painel usa o mesmo leitor: em "Meu canal", o quadro "Preencher tudo de uma vez" (pra IA que só conversa)
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync, execFileSync, spawnSync } = require('child_process');
const C = require('./canal-arquivos');

const RAIZ = path.resolve(__dirname, '..');
const ARQUIVO_MODELO = 'CONFIGURAR-MEU-CANAL.txt';
const CABECA = 'CONFIGURAR MEU CANAL';

// ---------- As perguntas ----------

const CENARIOS = [['construcao', 'Canteiro de obras'], ['natureza', 'Natureza (campo e montanhas)'], ['cidade', 'Cidade'], ['casa', 'Casa (frente com quintal)'],
  ['cozinha', 'Cozinha'], ['sala', 'Sala'], ['praia', 'Praia'], ['fundo_do_mar', 'Fundo do mar'], ['espaco', 'Espaço'], ['lua', 'Lua'], ['fazenda', 'Fazenda'],
  ['floresta', 'Floresta'], ['deserto', 'Deserto'], ['consultorio', 'Consultório'], ['oficina', 'Oficina'], ['escritorio', 'Escritório'], ['estudio', 'Estúdio (fundo liso)']];
// Os personagens (as cores padrão de cada um vêm do catálogo do npm run modelos). principal: a peça da "cor da roupa"
const PESSOAS = [
  { id: 'menino', nome: 'Menino de camiseta', tipo: 'menino', roupa: 'camiseta', principal: 'camiseta', peca: 'camiseta' },
  { id: 'menino-moletom', nome: 'Menino de moletom', tipo: 'menino', roupa: 'moletom', principal: 'moletom', peca: 'moletom' },
  { id: 'menina', nome: 'Menina de vestido', tipo: 'menina', principal: 'vestido', peca: 'vestido', cabelo: 'cabeloMenina' },
  { id: 'doutor', nome: 'Doutor (bom pra canal de saúde)', tipo: 'doutor', principal: 'camisa', peca: 'camisa' },
  { id: 'operario', nome: 'Operário (bom pra canal de obra)', tipo: 'operario', principal: 'camiseta', peca: 'camiseta' }
];
const VOZES = [['elevenlabs', 'ElevenLabs (a mais natural; grátis pra testar, paga pra monetizar)'], ['voicestudio', 'VoiceStudio (grátis, roda no seu computador)'],
  ['teste', 'Voz do computador (robótica: só pra testar)']];
const HORAS = [['dia', 'Dia'], ['tarde', 'Fim de tarde'], ['noite', 'Noite']];

// Cada pergunta: id, titulo (o leitor acha a pergunta por ele), dica, exemplo, opcoes (resposta pelo número) e padrao
// (o que vale se a pessoa deixar em branco e o canal ainda estiver no modelo; função quando depende de outra resposta)
const PERGUNTAS = [
  { parte: 'O CANAL' },
  { id: 'nome', titulo: 'NOME DO CANAL', exemplo: 'Motor Curioso' },
  { id: 'arroba', titulo: '@ NAS REDES', dica: 'O mesmo no YouTube, no TikTok e no Instagram.', exemplo: '@motorcurioso',
    padrao: (v) => (v.nome ? sugestaoArroba(v.nome) : null), dicaPadrao: 'o nome do canal, sem espaço' },
  { id: 'tema', titulo: 'DO QUE O CANAL FALA', dica: 'A Máquina brilha com "como funciona" e "como foi feito".', exemplo: 'como funcionam os carros por dentro: motor, freio, pneu, câmbio' },
  { id: 'quemAssiste', titulo: 'QUEM ASSISTE', exemplo: 'gente curiosa que gosta de carro, de 15 a 40 anos' },
  { parte: 'O JEITO DOS VÍDEOS' },
  { id: 'jeito', titulo: 'JEITO DE FALAR', exemplo: 'conversado e engraçado, como quem explica pra um amigo',
    padrao: 'conversado, como quem explica pra um amigo; frases curtas e palavras simples' },
  { id: 'evitar', titulo: 'O QUE EVITAR', exemplo: 'palavrão, jargão técnico sem explicar', padrao: 'palavrão, jargão técnico sem explicar, promessa que o vídeo não cumpre' },
  { id: 'estiloVideo', titulo: 'ESTILO DO VÍDEO', exemplo: 'sério, como um documentário', padrao: 'conversado e rápido, com um pouco de humor' },
  { id: 'mecanismo', titulo: 'MARCA REGISTRADA', dica: 'O que todo vídeo seu tem e o dos outros não.', exemplo: 'todo vídeo começa com o personagem quebrando a peça do tema',
    padrao: 'todo vídeo começa com uma pergunta curiosa e monta a coisa do zero, peça por peça' },
  { id: 'capa', titulo: 'ESTILO DA CAPA', exemplo: 'a pergunta em cima, o personagem com cara de susto e a peça bem grande',
    padrao: 'a pergunta do vídeo em cima, o personagem com cara exagerada e o objeto do tema mostrando o detalhe mais estranho' },
  { id: 'assinatura', titulo: 'ASSINATURA DO FIM', dica: 'A frase que a voz fala no fim de todo vídeo.', exemplo: 'E segue o Motor Curioso.',
    padrao: (v) => (v.nome ? `E segue o ${v.nome}.` : null), dicaPadrao: '"E segue o [nome do canal]."' },
  { id: 'fechamento', titulo: 'FECHAMENTO', dica: 'A frase que fecha a explicação, antes da chamada.', exemplo: 'Por fora, é só um pneu. Por dentro, é borracha, aço e ar.',
    padrao: '"Por fora, é só [o que todo mundo vê]. Por dentro, é [peça], [peça] e [peça]."', dicaPadrao: 'o "Por fora... Por dentro..." da Máquina' },
  { id: 'chamada', titulo: 'CHAMADA DO FIM', dica: 'O pedido curto do fim (comentar, seguir).', exemplo: 'Qual peça a gente desmonta no próximo? Comenta aí.',
    padrao: '"Qual coisa a gente desmonta no próximo? Comenta aí." Curta e rápida, logo depois do fechamento', dicaPadrao: '"Qual coisa a gente desmonta no próximo? Comenta aí."' },
  { id: 'hashtags', titulo: 'HASHTAGS', dica: 'Até 5, as que vão em todo vídeo (a do tema de cada vídeo entra sozinha).', exemplo: '#carros #comofunciona #curiosidades',
    padrao: (v) => `#comofunciona #curiosidades #<tema-do-video>${v.arroba ? ` #${v.arroba.replace(/^@/, '')}` : ''}`, dicaPadrao: '#comofunciona #curiosidades e o @ do canal' },
  { parte: 'O VISUAL' },
  { id: 'visual', titulo: 'VISUAL', opcoes: [['redondo', 'Caprichado e redondo (recomendado)'], ['simples', 'Simples e facetado (o vídeo fica pronto mais rápido)']], padrao: 1 },
  { id: 'pessoa', titulo: 'PERSONAGEM', dica: 'Quem aparece em todo vídeo. As fotos estão no painel, em Modelos 3D.', opcoes: PESSOAS.map((p) => [p.id, p.nome]) },
  { id: 'corRoupa', titulo: 'COR DA ROUPA', dica: 'Um nome de cor (azul, verde escuro, coral...) ou um código como #ff7a59.', exemplo: 'azul' },
  { id: 'corCabelo', titulo: 'COR DO CABELO', dica: 'preto, castanho, castanho claro, loiro, ruivo, grisalho ou branco.' },
  { id: 'corPele', titulo: 'COR DA PELE', dica: 'clara, média, parda, morena ou negra.' },
  { id: 'personagemTexto', titulo: 'COMO É O PERSONAGEM', dica: 'O jeito dele, com as suas palavras.', exemplo: 'curioso e meio atrapalhado; leva susto com tudo',
    dicaPadrao: 'a Máquina descreve pelas escolhas acima' },
  { id: 'cenario', titulo: 'CENÁRIO', dica: 'O lugar de todo vídeo quando o tema não pede outro. As fotos estão no painel, em Modelos 3D.', opcoes: CENARIOS },
  { id: 'hora', titulo: 'HORA', opcoes: HORAS, padrao: 1 },
  { parte: 'A VOZ E A COR' },
  { id: 'vozMotor', titulo: 'DE ONDE VEM A VOZ', opcoes: VOZES },
  { id: 'vozId', titulo: 'NOME OU ID DA VOZ', dica: 'ElevenLabs: o id da voz (não sabe? deixe em branco, a IA acha). VoiceStudio: o nome que você deu pra voz lá. A CHAVE da ElevenLabs não vai aqui.' },
  { id: 'vozTexto', titulo: 'COMO É A VOZ', exemplo: 'narrador homem, animado e claro', padrao: 'voz clara e animada, em português do Brasil' },
  { id: 'cor', titulo: 'COR DO CANAL', dica: 'Vai na palavra em destaque da capa e no botão "Seguir" do fim. Um nome de cor ou um código como #ff7a59.', exemplo: 'laranja' },
  { parte: 'AS REDES (pode deixar em branco: a IA escreve depois)' },
  { id: 'youtube', titulo: 'DESCRIÇÃO NO YOUTUBE', dica: 'Até 1.000 letras.' },
  { id: 'tiktok', titulo: 'BIO NO TIKTOK', dica: 'Até 80 letras.' },
  { id: 'instagram', titulo: 'BIO NO INSTAGRAM', dica: 'Até 150 letras.' }
];
const SO_PERGUNTAS = PERGUNTAS.filter((p) => p.id);
const NOME = Object.fromEntries(SO_PERGUNTAS.map((p) => [p.id, (p.titulo.charAt(0) + p.titulo.slice(1).toLowerCase())
  .replace('youtube', 'YouTube').replace('tiktok', 'TikTok').replace('instagram', 'Instagram').replace('elevenlabs', 'ElevenLabs')]));
const comHex = (resp, hex) => (norm(resp).toLowerCase() === hex.slice(1) || resp.trim().toLowerCase() === hex ? hex : `${resp} (${hex})`);

const sugestaoArroba = (nome) => '@' + nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');

// ---------- O modelo em texto ----------

const LARGURA = 64;
const faixa = (t, c = '=') => { const meio = ` ${t} `, l = Math.max(8, LARGURA - meio.length); return c.repeat(Math.floor(l / 2)) + meio + c.repeat(Math.ceil(l / 2)); };
// Quebra uma frase em linhas de até 64 letras (o bloco de notas não quebra sozinho em todo computador). A continuação
// vem com recuo: o leitor sabe que ela é da dica, e não da resposta
function quebrar(t, recuo = '   ') {
  const linhas = [];
  let l = '';
  for (const p of t.split(' ')) {
    const lim = LARGURA - (linhas.length ? recuo.length : 0);
    if ((l + ' ' + p).trim().length > lim && l) { linhas.push((linhas.length ? recuo : '') + l); l = p; } else l = (l + ' ' + p).trim();
  }
  if (l) linhas.push((linhas.length ? recuo : '') + l);
  return linhas.join('\n');
}
function modelo() {
  const L = [
    '#'.repeat(LARGURA), `  ${CABECA} · Máquina Preguiça 3D`, '#'.repeat(LARGURA), '',
    'PRA IA (faça só isto, nesta ordem):',
    '1. Rode este comando no terminal, dentro da pasta da Máquina:',
    '      npm run canal',
    '   No Windows, se o npm der erro, use: npm.cmd run canal',
    '   Ele lê estas respostas sozinho e salva tudo no canal.',
    '2. Se o comando pedir, crie o arquivo canal/respostas.txt com',
    '   este texto inteiro, sem mudar nada, e rode o comando de novo.',
    '3. Mande pra pessoa a mensagem que o comando mostrar no fim.',
    'Não escreva as respostas nos arquivos você mesmo, não invente',
    'resposta e não mude mais nada.', '',
    'PRA VOCÊ (antes de colar na IA):',
    '- Escreva cada resposta depois de "Resposta:". Pode usar mais',
    '  de uma linha.',
    '- Nas perguntas com números, responda só o número.',
    '- Não sabe? Deixe em branco. Onde tem "Em branco:", vale o',
    '  padrão da Máquina; o resto dá pra completar depois, no painel.',
    '- A CHAVE da ElevenLabs não vai aqui (nunca cole ela na IA).',
    '- Terminou? Salve, selecione tudo (Ctrl+A ou Cmd+A), copie e',
    '  cole na conversa com a IA.',
    '- A sua IA só conversa e não roda comando? Cole no painel, em',
    '  Meu canal, no quadro "Preencher tudo de uma vez".'
  ];
  let n = 0;
  for (const p of PERGUNTAS) {
    if (p.parte) { L.push('', faixa(p.parte)); continue; }
    L.push('', `[${++n}] ${p.titulo}`);
    if (p.dica) L.push(quebrar(p.dica));
    if (p.opcoes) p.opcoes.forEach(([, nome], i) => L.push(`   ${i + 1} = ${nome}`));
    if (p.exemplo) L.push(quebrar(`Exemplo: ${p.exemplo}`));
    const padrao = p.dicaPadrao || (typeof p.padrao === 'number' ? String(p.padrao) : typeof p.padrao === 'string' ? p.padrao : '');
    if (padrao) L.push(quebrar(`Em branco: ${padrao}`));
    L.push('Resposta:');
  }
  L.push('', faixa('FIM', '#'), '');
  return L.join('\n');
}

// ---------- Ler as respostas ----------

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9@#]+/g, ' ').trim();
const TITULOS = SO_PERGUNTAS.map((p) => ({ p, t: norm(p.titulo) })).sort((a, b) => b.t.length - a.t.length);
// A linha é o título de uma pergunta? { p, resto } ou null. Aceita "[3] DO QUE O CANAL FALA" (com ou sem o número e o
// ** em volta), o título em letra minúscula e a resposta na mesma linha ("Nome do canal: Motor Curioso"), que é como a
// IA fraca costuma reescrever o texto
function titulo(linha) {
  const limpa = linha.replace(/^[\s#*_>-]*[[(]?\s*\d{0,2}\s*[\]).:-]?\s*/, '').replace(/[*_]+/g, '').trim();
  const n = norm(limpa), exato = TITULOS.find(({ t }) => n === t);
  if (exato) return { p: exato.p, resto: '' };
  const dois = limpa.match(/^([^:]{2,60}):\s*(.*)$/);
  const antes = dois && TITULOS.find(({ t }) => norm(dois[1]) === t);
  if (antes) return { p: antes.p, resto: dois[2].trim() };
  // O título com um complemento em maiúsculas ("@ NAS REDES (O MESMO EM TODAS)")
  const letras = limpa.replace(/[^A-Za-zÀ-ÿ]/g, '');
  if (!letras || letras.length > 60 || letras.replace(/[^A-ZÀ-Þ]/g, '').length < letras.length * 0.7) return null;
  const achou = TITULOS.find(({ t }) => n.startsWith(t + ' '));
  return achou ? { p: achou.p, resto: '' } : null;
}
const DICA = /^\s*[*_]*\s*(exemplo|ex\s*[:.]|dica|em branco\s*:|\d{1,2}\s*=)|^\s{3,}\S/i;
const RESPOSTA = /^\s*[*_>-]*\s*(resposta|resp|r)\s*[*_]*\s*[:：=]\s*[*_]*\s*(.*)$/i;
const VAZIO = /^(|em branco|nada|nenhum|nenhuma|n a|sei la|nao sei|x)$/; // depois do norm, em minúsculas
// O texto colado → { id: resposta } (só as respondidas) e quantas perguntas achou
function lerRespostas(txt) {
  const linhas = String(txt || '').replace(/\r/g, '').split('\n');
  const blocos = [];
  for (const l of linhas) {
    if (/^\s*[#=~]{3,}/.test(l) || /^\s*[-*_]{6,}\s*$/.test(l)) { blocos.push(null); continue; } // as faixas e o FIM fecham a pergunta de cima
    const t = titulo(l);
    if (t) { blocos.push({ p: t.p, linhas: t.resto ? [`Resposta: ${t.resto}`] : [] }); continue; }
    const atual = blocos[blocos.length - 1];
    if (atual) atual.linhas.push(l);
  }
  const valores = {};
  let achadas = 0;
  for (const b of blocos.filter(Boolean)) {
    achadas++;
    const i = b.linhas.findIndex((l) => RESPOSTA.test(l));
    // Sem o "Resposta:" (a pessoa apagou), vale o que não é dica, exemplo ou opção
    const dica = norm(b.p.dica);
    const corpo = i >= 0 ? [b.linhas[i].match(RESPOSTA)[2], ...b.linhas.slice(i + 1)]
      : b.linhas.filter((l) => !DICA.test(l) && !(norm(l) && dica.includes(norm(l))));
    const v = corpo.join('\n').trim().replace(/^["“]|["”]$/g, '').trim();
    if (!VAZIO.test(norm(v).toLowerCase()) && !(b.p.id in valores)) valores[b.p.id] = v;
  }
  return { valores, achadas };
}
const ehModelo = (txt) => norm(txt).includes(norm(CABECA)) && lerRespostas(txt).achadas >= 3;

// Escolha por número ("2", "2 = Menino de moletom") ou pelo nome ("moletom")
function escolher(resp, opcoes, apelidos = {}) {
  const n = String(resp).match(/^\s*(\d{1,2})\b/);
  if (n && opcoes[Number(n[1]) - 1]) return opcoes[Number(n[1]) - 1][0];
  const r = norm(resp);
  for (const [chave, nomes] of Object.entries(apelidos)) if (nomes.some((x) => new RegExp(`\\b${norm(x)}\\b`).test(r))) return chave;
  const achou = opcoes.find(([chave, nome]) => r === norm(chave) || r === norm(nome) || r.startsWith(norm(nome.split(' (')[0])));
  return achou ? achou[0] : null;
}
const APELIDOS = {
  pessoa: { 'menino-moletom': ['moletom'], menina: ['menina', 'vestido', 'garota'], doutor: ['doutor', 'medico', 'medica'], operario: ['operario', 'pedreiro', 'obra'], menino: ['menino', 'camiseta', 'garoto'] },
  visual: { redondo: ['redondo', 'caprichado', 'realista'], simples: ['simples', 'facetado', 'low poly', 'lowpoly'] },
  hora: { tarde: ['tarde', 'por do sol', 'entardecer'], noite: ['noite'], dia: ['dia', 'manha'] },
  vozMotor: { elevenlabs: ['eleven', 'elevenlabs'], voicestudio: ['voicestudio', 'voice studio'], teste: ['computador', 'teste', 'robotica'] },
  cenario: { construcao: ['obra', 'canteiro', 'construcao'], fundo_do_mar: ['fundo do mar', 'oceano', 'mar'], espaco: ['espaco'], consultorio: ['consultorio', 'hospital', 'clinica'], estudio: ['estudio', 'fundo liso'] }
};

// Nome de cor → #rrggbb (as de cabelo e de pele têm a lista delas, com o que sobrar das gerais)
const CORES = {
  'azul claro': '#5fb4f0', 'azul escuro': '#1e3a7a', 'azul marinho': '#1e2b4f', marinho: '#1e2b4f', 'verde claro': '#7cc152', 'verde escuro': '#1f5e3a',
  'verde limao': '#a8d43a', 'rosa claro': '#f7a8c4', 'vermelho escuro': '#9e1f1f', 'azul bebe': '#9fd0f5', 'azul celeste': '#6fb8f0',
  'azul royal': '#2948c8', 'verde musgo': '#5b6b2e', 'verde oliva': '#6b7a2a', 'verde bandeira': '#1f9a46', 'rosa choque': '#ff2f8e',
  'laranja escuro': '#d9661e', 'amarelo ouro': '#e8b20e', 'amarelo claro': '#ffe27a', 'roxo escuro': '#4b2a7a', 'cor de vinho': '#7a1f2b', amarelo: '#f5c518', laranja: '#f39a1e', coral: '#ff7a59',
  vermelho: '#e0362c', vinho: '#7a1f2b', rosa: '#ff5a8a', pink: '#ff4fa3', roxo: '#8a4fd8', lilas: '#b48ae6', violeta: '#7b3fc4', azul: '#2f6fd6',
  turquesa: '#2fb5a6', 'verde agua': '#4fd1b8', ciano: '#2fc4e0', verde: '#2e9d5b', marrom: '#7a4a22', bege: '#e3cfa8', creme: '#f3e7c8',
  cinza: '#8a9099', 'cinza claro': '#c4c8cc', 'cinza escuro': '#4a4f57', preto: '#221b14', branco: '#f4f1ea', dourado: '#d4a02a', prata: '#c0c4c8', mostarda: '#d9a514'
};
const CABELOS = { preto: '#1e1611', castanho: '#3a2418', 'castanho escuro': '#2b1b12', 'castanho claro': '#7a4a22', loiro: '#e2b862', ruivo: '#b5502a', grisalho: '#b9b9b9', branco: '#ececec' };
const PELES = { clara: '#f3cfae', branca: '#f3cfae', media: '#e6b48a', parda: '#b88058', morena: '#c98f62', negra: '#8a5a3c', preta: '#8a5a3c' };
function cor(resp, tabela = {}) {
  const hex = String(resp).match(/#?\b([0-9a-f]{6})\b/i);
  if (hex) return `#${hex[1].toLowerCase()}`;
  const r = norm(resp).toLowerCase();
  const todas = { ...CORES, ...tabela };
  const nome = Object.keys(todas).sort((a, b) => b.length - a.length).find((k) => new RegExp(`\\b${k}\\b`).test(r));
  return nome ? todas[nome] : null;
}

// ---------- Salvar ----------

function catalogo() { try { return JSON.parse(fs.readFileSync(path.join(RAIZ, 'referencias', 'modelos', 'catalogo.json'), 'utf8')); } catch { return {}; } }

// Salva as respostas nos arquivos do canal. Devolve o relatório: salvos (com o que ficou), padroes (o padrão da
// Máquina, porque a pessoa deixou em branco), branco (ficou como estava) e erros (a resposta que não deu pra entender)
function aplicarRespostas(txt) {
  C.garantirCanal();
  const { valores: v, achadas } = lerRespostas(txt);
  if (achadas < 3) return { ok: false, mensagem: `Não achei as perguntas do modelo nesse texto. Copie o ${ARQUIVO_MODELO} inteiro, do primeiro ao último #.` };
  const rel = { ok: true, salvos: [], padroes: [], branco: [], erros: [] };
  const salvo = (id, valor) => rel.salvos.push({ campo: NOME[id], valor: String(valor).replace(/\s+/g, ' ').slice(0, 90) });
  const erro = (id, msg) => rel.erros.push({ campo: NOME[id], mensagem: msg });
  const canalTxt = C.ler('canal', 'canal.md'), idTxt = C.ler('canal', 'identidade.md');
  if (canalTxt == null || idTxt == null) return { ok: false, mensagem: 'Não achei os arquivos do canal (canal/canal.md e canal/identidade.md). Peça pra IA: "roda o npm run instalar de novo".' };
  const bloco = (() => { try { return JSON.parse(`{${(idTxt.match(C.RE_BLOCO) || [])[2].trim().replace(/,\s*$/, '')}}`); } catch { return null; } })();
  const noModelo = (id) => {
    if (id === 'nome') return !C.campo(canalTxt, 'Nome do canal');
    if (id === 'arroba') return !C.campo(canalTxt, '@ nas redes');
    if (id === 'assinatura') return !C.campo(canalTxt, 'Assinatura do fim do vídeo');
    if (C.LINHAS[id]) return !C.campo(C.LINHAS[id].secao.arq === 'canal.md' ? canalTxt : idTxt, C.LINHAS[id].rotulo);
    const c = C.CAMPOS[id];
    return c ? !C.lerCampo(c.arq === 'canal.md' ? canalTxt : idTxt, c).valor : false;
  };
  // O valor de cada pergunta: a resposta, ou o padrão se ficou em branco e o canal ainda está no modelo
  const vale = {};
  for (const p of SO_PERGUNTAS) {
    if (v[p.id] !== undefined) { vale[p.id] = v[p.id]; continue; }
    const padrao = typeof p.padrao === 'function' ? p.padrao({ ...vale, nome: vale.nome || C.campo(canalTxt, 'Nome do canal') || '' }) : typeof p.padrao === 'string' ? p.padrao : null;
    if (padrao && noModelo(p.id === 'vozTexto' ? 'voz' : p.id)) { vale[p.id] = padrao; rel.padroes.push({ campo: NOME[p.id], valor: padrao.replace(/\s+/g, ' ').slice(0, 90) }); }
  }

  // Nome, @ e assinatura
  const nome = vale.nome || C.campo(canalTxt, 'Nome do canal') || '';
  if (nome && (vale.nome || vale.arroba || vale.assinatura)) {
    const r = C.salvarCanal({ nome, arroba: vale.arroba || C.campo(canalTxt, '@ nas redes') || sugestaoArroba(nome), assinatura: vale.assinatura || C.campo(canalTxt, 'Assinatura do fim do vídeo') || `E segue o ${nome}.` });
    if (r.ok) ['nome', 'arroba', 'assinatura'].forEach((id) => v[id] && salvo(id, v[id]));
    else erro('nome', r.mensagem);
  } else if (!nome) erro('nome', 'falta o nome do canal: sem ele, o @ e a assinatura também não foram salvos');

  // O bloco "No roteiro.json": visual, personagem, cenário e hora, voz e cor
  const d = {};
  if (v.visual) { const e = escolher(v.visual, PERGUNTAS.find((p) => p.id === 'visual').opcoes, APELIDOS.visual); if (e) { d.estilo = e; salvo('visual', e === 'redondo' ? 'caprichado e redondo' : 'simples'); } else erro('visual', `não entendi "${v.visual}": responda 1 ou 2`); }
  const pessoas = (catalogo().itens || []).filter((i) => i.categoria === 'personagens');
  let pessoa = null;
  if (v.pessoa) {
    const e = escolher(v.pessoa, PESSOAS.map((p) => [p.id, p.nome]), APELIDOS.pessoa);
    if (e) pessoa = PESSOAS.find((p) => p.id === e); else erro('pessoa', `não entendi "${v.pessoa}": responda um número de 1 a ${PESSOAS.length}`);
  }
  const atual = bloco && bloco.personagem ? PESSOAS.find((p) => p.tipo === (bloco.personagem.tipo || 'menino') && (p.tipo !== 'menino' || p.roupa === (bloco.personagem.roupa || 'camiseta'))) : PESSOAS[0];
  const corDe = {};
  if (v.corRoupa) { corDe.roupa = cor(v.corRoupa); if (!corDe.roupa) erro('corRoupa', `não entendi a cor "${v.corRoupa}": use um nome como azul, verde escuro ou coral, ou um código como #ff7a59`); }
  if (v.corCabelo) { corDe.cabelo = cor(v.corCabelo, CABELOS); if (!corDe.cabelo) erro('corCabelo', `não entendi a cor "${v.corCabelo}": preto, castanho, loiro, ruivo...`); }
  if (v.corPele) { corDe.pele = cor(v.corPele, PELES); if (!corDe.pele) erro('corPele', `não entendi "${v.corPele}": clara, média, parda, morena ou negra`); }
  const quem = pessoa || (Object.values(corDe).some(Boolean) ? atual : null);
  if (Object.values(corDe).some(Boolean) && !quem) erro('corRoupa', 'o personagem do canal foi feito pela IA só pra ele: pra mudar as cores, peça no chat');
  if (quem) {
    const item = pessoas.find((i) => i.chave === quem.id);
    const mesmo = bloco && bloco.personagem && atual && atual.id === quem.id;
    const cores = { ...((item && item.cores) || {}), ...(mesmo ? bloco.personagem.cores || {} : {}) };
    if (corDe.roupa) cores[quem.principal] = corDe.roupa;
    if (corDe.cabelo) cores[quem.cabelo || 'cabelo'] = corDe.cabelo;
    if (corDe.pele) cores.pele = corDe.pele;
    d.personagem = { tipo: quem.tipo, roupa: quem.roupa, cores };
    if (pessoa) salvo('pessoa', pessoa.nome.split(' (')[0]);
    for (const [k, id] of [['roupa', 'corRoupa'], ['cabelo', 'corCabelo'], ['pele', 'corPele']]) if (corDe[k]) salvo(id, comHex(v[id], corDe[k]));
  }
  if (v.cenario) {
    const e = escolher(v.cenario, CENARIOS, APELIDOS.cenario);
    if (e && C.cenariosDoMotor().includes(e)) { d.cenario = e; salvo('cenario', CENARIOS.find(([k]) => k === e)[1]); } else erro('cenario', `não entendi "${v.cenario}": responda um número de 1 a ${CENARIOS.length}`);
  }
  if (v.hora) { const e = escolher(v.hora, HORAS, APELIDOS.hora); if (e) { d.hora = e; if (v.hora) salvo('hora', HORAS.find(([k]) => k === e)[1]); } else erro('hora', `não entendi "${v.hora}": responda 1, 2 ou 3`); }
  if (v.vozMotor || v.vozId) {
    const motor = v.vozMotor ? escolher(v.vozMotor, VOZES, APELIDOS.vozMotor) : bloco && bloco.voz && bloco.voz.motor;
    if (!motor) erro('vozMotor', v.vozMotor ? `não entendi "${v.vozMotor}": responda 1, 2 ou 3` : 'falta dizer de onde vem a voz (1, 2 ou 3)');
    else {
      d.voz = { motor, id: (v.vozId || (bloco && bloco.voz && bloco.voz.motor === motor ? bloco.voz.id : '') || '').trim() };
      salvo('vozMotor', VOZES.find(([k]) => k === motor)[1].split(' (')[0]);
      if (v.vozId) salvo('vozId', v.vozId);
    }
  }
  if (v.cor) { d.cor = cor(v.cor); if (d.cor) salvo('cor', comHex(v.cor, d.cor)); else { delete d.cor; erro('cor', `não entendi a cor "${v.cor}": use um nome como laranja ou um código como #ff7a59`); } }
  else if (/\[[^\]]*\bEx[:.]/.test((idTxt.split(/^## Cor do canal\s*$/m)[1] || '').split(/^## /m)[0])) { d.cor = (bloco && bloco.cor) || '#ff7a59'; rel.padroes.push({ campo: NOME.cor, valor: d.cor }); }
  if (Object.keys(d).length) {
    const r = C.salvarBloco(d, { vozSemId: true });
    if (!r.ok) rel.erros.push({ campo: 'Visual, personagem, cenário, voz e cor', mensagem: r.mensagem });
  }

  // Os textos (canal.md e o texto de cada seção do identidade.md)
  const campos = {};
  for (const id of ['tema', 'quemAssiste', 'jeito', 'evitar', 'estiloVideo', 'mecanismo', 'capa', 'fechamento', 'chamada', 'hashtags']) {
    if (vale[id]) { campos[id] = vale[id]; if (v[id]) salvo(id, v[id]); }
  }
  if (v.vozTexto || vale.vozTexto) { campos.voz = vale.vozTexto; if (v.vozTexto) salvo('vozTexto', v.vozTexto); }
  // O personagem, o lugar e o visual: o texto da pessoa, ou um feito pelas escolhas (quando ela escolheu de novo, ou o
  // arquivo ainda está no exemplo)
  const nomeCor = (hex, tabela) => (Object.entries({ ...CORES, ...tabela }).find(([, h]) => h === hex) || [hex])[0];
  if (v.personagemTexto) { campos.personagem = v.personagemTexto; salvo('personagemTexto', v.personagemTexto); }
  else if ((pessoa || corDe.roupa || noModelo('personagem')) && d.personagem) {
    const q = quem || atual, c = d.personagem.cores;
    campos.personagem = `${q.nome.split(' (')[0]}${c[q.principal] ? ` (${q.peca} ${nomeCor(c[q.principal], {})} \`${c[q.principal]}\`)` : ''}` +
      `${c[q.cabelo || 'cabelo'] ? `, cabelo ${nomeCor(c[q.cabelo || 'cabelo'], CABELOS)}` : ''}${c.pele ? `, pele ${nomeCor(c.pele, PELES)}` : ''}.`;
  }
  const cen = d.cenario || (bloco && bloco.cenario), hora = d.hora || (bloco && bloco.hora) || 'dia';
  if (cen && (d.cenario || noModelo('lugar'))) {
    campos.lugar = `${(CENARIOS.find(([k]) => k === cen) || [cen, cen])[1].split(' (')[0]} (\`${cen}\`), ${hora === 'noite' ? 'de noite' : hora === 'tarde' ? 'no fim de tarde' : 'de dia'}. Cada vídeo pode ter o seu cenário, o que combinar com o tema; este é o do canal quando o tema não pede outro.`;
  }
  if (d.estilo || noModelo('estilo')) {
    const e = d.estilo || (bloco && bloco.estilo === 'redondo' ? 'redondo' : 'simples');
    campos.estilo = e === 'redondo' ? 'Redondo e caprichado: sombreamento liso, quinas arredondadas e cenário vivo.' : 'Simples e facetado (low-poly): o vídeo fica pronto mais rápido.';
  }
  if (Object.keys(campos).length) {
    const r = C.salvarCampos({ campos });
    if (!r.ok) rel.erros.push({ campo: 'Textos do canal', mensagem: r.mensagem });
  }

  // As redes
  const redes = Object.fromEntries(['youtube', 'tiktok', 'instagram'].filter((k) => v[k]).map((k) => [k, v[k]]));
  if (Object.keys(redes).length) {
    const r = C.salvarDescricoes(redes);
    if (r.ok) Object.keys(redes).forEach((k) => salvo(k, redes[k])); else rel.erros.push({ campo: 'Descrições', mensagem: r.mensagem });
  }

  rel.branco = SO_PERGUNTAS.filter((p) => v[p.id] === undefined && !rel.padroes.some((x) => x.campo === NOME[p.id])).map((p) => NOME[p.id]);
  return rel;
}

// ---------- O comando ----------

// A área de transferência (o mesmo do colar.js)
function areaDeTransferencia() {
  try {
    if (process.platform === 'darwin') return execSync('pbpaste', { encoding: 'utf8' });
    if (process.platform === 'win32') {
      const arq = path.join(os.tmpdir(), `preguica3d-canal-${process.pid}.txt`);
      execFileSync('powershell', ['-NoProfile', '-Command',
        `[IO.File]::WriteAllText('${arq.replace(/'/g, "''")}', (Get-Clipboard -Raw), (New-Object Text.UTF8Encoding $false))`]);
      try { return fs.readFileSync(arq, 'utf8'); } finally { fs.rmSync(arq, { force: true }); }
    }
    try { return execSync('wl-paste', { encoding: 'utf8' }); } catch { return execSync('xclip -o -selection clipboard', { encoding: 'utf8' }); }
  } catch {
    return '';
  }
}
const lerArquivo = (f) => { try { return fs.readFileSync(f, 'utf8').replace(/^﻿/, ''); } catch { return null; } };
const temResposta = (txt) => Object.keys(lerRespostas(txt).valores).length > 0;

function principal() {
  const args = process.argv.slice(2);
  if (args.includes('--modelo')) {
    fs.writeFileSync(path.join(RAIZ, ARQUIVO_MODELO), modelo());
    console.log(`Escrevi o ${ARQUIVO_MODELO} em branco, com ${SO_PERGUNTAS.length} perguntas.`);
    return;
  }
  const RESPOSTAS = path.join(RAIZ, 'canal', 'respostas.txt');
  const alvo = args.find((a) => !a.startsWith('--'));
  let txt = null, de = '';
  if (alvo) {
    txt = lerArquivo(path.resolve(alvo.replace(/^~(?=$|[\\/])/, os.homedir())));
    de = `do arquivo ${alvo}`;
    if (txt == null) { console.log(`Não achei o arquivo "${alvo}".`); process.exit(1); }
  } else if (lerArquivo(RESPOSTAS) != null) { txt = lerArquivo(RESPOSTAS); de = 'do canal/respostas.txt'; }
  else {
    const clip = areaDeTransferencia(), modeloPreenchido = lerArquivo(path.join(RAIZ, ARQUIVO_MODELO));
    if (ehModelo(clip) && temResposta(clip)) { txt = clip; de = 'da área de transferência (o texto que a pessoa copiou)'; }
    else if (modeloPreenchido && temResposta(modeloPreenchido)) { txt = modeloPreenchido; de = `do ${ARQUIVO_MODELO}`; }
    else if (ehModelo(clip)) {
      console.log('CANAL: NADA SALVO. O texto copiado é o modelo, mas sem nenhuma resposta.');
      console.log('PRA IA: crie o arquivo canal/respostas.txt com o texto que a pessoa colou na conversa, inteiro e sem mudar nada, e rode npm run canal de novo.');
      process.exit(1);
    }
  }
  if (txt == null) {
    console.log('CANAL: NADA SALVO. Não achei as respostas.');
    console.log('PRA IA: crie o arquivo canal/respostas.txt com o texto que a pessoa colou na conversa (o que começa com');
    console.log(`"${CABECA}"), inteiro e sem mudar nada, e rode npm run canal de novo. Se ela ainda não preencheu,`);
    console.log(`mande o arquivo ${ARQUIVO_MODELO} (está na pasta da Máquina) pra ela responder.`);
    process.exit(1);
  }
  const r = aplicarRespostas(txt);
  if (!r.ok) { console.log(`CANAL: NADA SALVO. ${r.mensagem}`); process.exit(1); }
  if (de === 'do canal/respostas.txt') fs.renameSync(RESPOSTAS, path.join(RAIZ, 'canal', 'respostas-usadas.txt'));

  console.log(`CANAL: SALVO (as respostas vieram ${de}).`);
  if (r.salvos.length) { console.log(`\nSalvei ${r.salvos.length} respostas:`); r.salvos.forEach((x) => console.log(`- ${x.campo}: ${x.valor}`)); }
  if (r.padroes.length) { console.log('\nFicaram em branco e usei o padrão da Máquina:'); r.padroes.forEach((x) => console.log(`- ${x.campo}: ${x.valor}`)); }
  if (r.erros.length) { console.log('\nNão consegui salvar (o resto foi salvo):'); r.erros.forEach((x) => console.log(`- ${x.campo}: ${x.mensagem}`)); }
  if (r.branco.length) console.log(`\nEm branco (ficou como estava): ${r.branco.join(', ')}.`);

  // O que ainda falta pra fazer vídeo (o npm run conferir) e o painel aberto em "Meu canal"
  const conf = spawnSync(process.execPath, [path.join(__dirname, 'conferir.js')], { cwd: RAIZ, encoding: 'utf8', timeout: 30000 });
  const faltas = String(conf.stdout || '').split('\n').filter((l) => l.startsWith('[falta]')).map((l) => l.replace(/^\[falta\]\s*/, ''));
  const url = require('./abrir-painel').abrir(['--canal']);
  if (faltas.length) { console.log('\nAinda falta pra fazer vídeo:'); faltas.forEach((l) => console.log(`- ${l}`)); }
  if (url) console.log(`\nAbri o painel em Meu canal: ${url}`);

  const resumo = [];
  if (r.erros.length) resumo.push(`Não entendi ${r.erros.length > 1 ? 'algumas respostas' : 'uma resposta'} (${r.erros.map((x) => x.campo.toLowerCase()).join(', ')}): dá pra arrumar no painel, em Meu canal.`);
  const vozFalta = faltas.find((l) => /^voz do canal/.test(l));
  if (vozFalta) resumo.push(/chave/.test(vozFalta) ? 'Falta colar a chave da ElevenLabs: no painel, em Meu canal, na Voz, tem o botão "Colar a chave da ElevenLabs".'
    : /"id"/.test(vozFalta) ? 'Falta o id da voz da ElevenLabs: eu acho pra você.' : 'Falta escolher a voz: dá pra escolher no painel, em Meu canal.');
  if (faltas.some((l) => /^canal\//.test(l))) resumo.push('Algumas perguntas ficaram em branco: dá pra completar no painel, em Meu canal.');
  console.log('\nPRA IA: mande pra pessoa exatamente esta mensagem, sem mudar nada:');
  console.log(`"Pronto! Salvei as respostas do seu canal e abri o painel em Meu canal${url ? `: ${url}` : ' (se não abriu, me peça: abre o painel)'}. Confira lá e mude o que quiser.${resumo.length ? ' ' + resumo.join(' ') : ''} Se o painel não aparecer, dá pra abrir com dois cliques no ABRIR-PAINEL, na pasta da Máquina."`);
  if (vozFalta && /"id"/.test(vozFalta)) console.log('Depois, rode npm run vozes, mostre as vozes pra pessoa escolher e ponha o id dela no painel ou em "voz" no bloco "No roteiro.json" de canal/identidade.md.');
}

module.exports = { modelo, lerRespostas, aplicarRespostas, ehModelo, ARQUIVO_MODELO };
if (require.main === module) principal();
