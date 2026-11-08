// Lista as vozes que dá pra usar no canal, sem mostrar a chave: as da sua conta da ElevenLabs (as de português
// primeiro) e as do VoiceStudio, se ele estiver aberto. Cada linha traz o id que vai no "voz" de canal/identidade.md.
// Uso: npm run vozes
const V = require('./voz');

V.carregarEnv();

const pt = (v) => /portug|brazil|brasil|pt-br|\bpt\b/i.test(JSON.stringify([v.labels, v.verified_languages, v.fine_tuning && v.fine_tuning.language, v.name]));

async function vozesElevenlabs(chave) {
  const cab = { headers: { 'xi-api-key': chave }, signal: AbortSignal.timeout(15000) };
  let res = await fetch('https://api.elevenlabs.io/v2/voices?page_size=100', cab).catch(() => null);
  if (!res || !res.ok) res = await fetch('https://api.elevenlabs.io/v1/voices', { headers: cab.headers, signal: AbortSignal.timeout(15000) }).catch(() => null);
  if (!res) return { erro: 'rede' };
  if (!res.ok) { const e = V.erroElevenlabs(res.status, await res.text()); return { erro: e.tipo, msg: e.msg }; }
  return { vozes: (await res.json()).voices || [] };
}

(async () => {
  const { chave } = V.chaveElevenlabs();
  console.log('\n== ElevenLabs ==');
  if (!chave) console.log('Sem chave no .env (rode npm run chave pra salvar a sua).');
  else {
    const r = await vozesElevenlabs(chave);
    if (r.erro === 'rede') console.log('Não consegui falar com a ElevenLabs agora (sem internet?).');
    else if (r.erro) console.log(V.explicarElevenlabs(r.erro, r.msg));
    else {
      const lista = r.vozes.sort((a, b) => pt(b) - pt(a));
      lista.forEach((v) => {
        const l = v.labels || {};
        const info = [l.gender === 'male' ? 'homem' : l.gender === 'female' ? 'mulher' : l.gender, l.age, l.accent, l.description || l.descriptive, pt(v) ? 'fala português' : '']
          .filter(Boolean).join(', ');
        console.log(`- ${v.name}${info ? ` (${info})` : ''} · id: ${v.voice_id}`);
      });
      if (!lista.some(pt)) {
        console.log('\nNenhuma voz de português na sua conta ainda. Pra ter: no site da ElevenLabs, abra Voices > Voice Library,');
        console.log('filtre o idioma Portuguese, ouça e clique em "Add to my voices" nas que gostar. Depois rode npm run vozes de novo.');
      }
      console.log(`\nPra ouvir: npm run testar-voz -- <id> <id> (cada amostra gasta uns 110 caracteres do plano)`);
    }
  }

  console.log('\n== VoiceStudio (grátis, no computador) ==');
  const vs = await V.voicestudio();
  if (!vs.ok) console.log(`Não está aberto (procurei em ${V.voicestudioUrl()}). Pra usar, abra o programa VoiceStudio e rode de novo.`);
  else {
    console.log('- default (a voz padrão do modelo) · id: default');
    // O VoiceStudio aceita o nome da voz quando ele é único; senão, o id
    vs.vozes.forEach((v) => console.log(`- ${v.nome}${v.idioma ? ` (${v.idioma})` : ''} · id: ${v.porNome ? v.nome : v.id}`));
    if (!vs.vozes.length) console.log('Nenhuma voz criada ainda: no VoiceStudio, crie uma (Clone com a sua voz, ou Design descrevendo a voz) em português do Brasil.');
    console.log('\nPra ouvir: npm run testar-voz -- --voicestudio <nome da voz>');
  }
  console.log('');
})();
