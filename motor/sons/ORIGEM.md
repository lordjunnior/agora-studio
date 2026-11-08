# Origem dos sons

Biblioteca local de efeitos. O render procura `sons/<nome>.(wav|ogg)` e sorteia entre as
variações `<nome>-1`, `<nome>-2`... (sempre a mesma pro mesmo instante).

## Kenney (CC0, domínio público, sem atribuição obrigatória)

Baixados de kenney.nl em 2026-10-25. Licença: Creative Commons Zero (CC0).

| Arquivo | Pacote | Original |
|---|---|---|
| clique-1, clique-2 | UI Audio | click3, click1 |
| rotulo | Music Jingles (Pizzicato) | jingles_PIZZI04 |
| final | Music Jingles (Pizzicato) | jingles_PIZZI03 |
| festa | Music Jingles (Steel) | jingles_STEEL01 |
| etiqueta | Interface Sounds | drop_002 |
| certo | Interface Sounds | confirmation_001 |
| errado | Interface Sounds | error_006 |
| baque-1..3 | Impact Sounds | impactSoft_heavy_000..002 |
| pedra-1..3 | Impact Sounds | impactMining_000..002 |
| metal-1..3 | Impact Sounds | impactMetal_heavy_000..002 |
| racha-1..3 | Impact Sounds | impactPlank_medium_000..002 |
| tampa-1..3 | Impact Sounds | impactPlate_medium_000..002 |
| madeira-1..3 | Impact Sounds | impactWood_medium_000..002 |
| passo-1..5 | Impact Sounds | footstep_grass_000..004 |
| range-1, range-2 | RPG Audio | creak1, creak3 |
| trava | RPG Audio | metalLatch |
| torneira | RPG Audio | metalClick |

## Sintetizados (gerados aqui, sem licença de terceiros)

Gerados por `node motor/sintetizar-sons.js` (Web Audio no Chromium), sem nada externo:
rebobina, avanca, congela, agua, pingo, respingo, esguicho, mosquito, whoosh, bomba, estalo, trilha,
bip, ding, ondas, bolhas, buzina, zumbido, zap, desliga, liga, brilho, fogo, vapor, turbina, fissao, estrondo, apito,
foguete, paraquedas, desconstrucao.

A trilha é simples (120 bpm, Dó–Lá menor–Fá–Sol, 32 s em loop). Dá pra trocar por uma música sua: coloque o arquivo
em `motor/sons/` e mude `trilha.arquivo` no roteiro.json.
