// Preguiça 3D: kit visual dos vídeos (mundo low-poly, personagem, rótulos, legenda, efeitos e som).
// Roda dentro da página do render (THREE global). Cada vídeo usa uma cena-modelo (motor/cenas-modelo/) ou um cena.js próprio.
//
// v2: linguagem de videogame (falha em P&B, ⏪ ⏸ ▶ ⏩), etiquetas com ponto colorido, destaque
// amarelo, termo-chave na legenda, indicadores, efeitos de cena, boneco que anda/corre/pula,
// céu com hora do dia e clima, tela dividida, sons por evento, CTA e cartão final.
//
// v7: estilo redondo (roteiro.estilo = 'redondo', padrão dos vídeos novos): sombreamento liso, mais faces,
// quinas arredondadas, mundo vivo (K.vivo), sombra macia e de contato, vinheta, câmera que respira e
// mascote com olho de verdade. Sem o campo, tudo sai como antes (os vídeos antigos não mudam).
//
// v1.1 da Máquina: capa com a pergunta numa caixa branca e a palavra na cor do canal (roteiro.cor), e o fim com o
// cartão de seguir (K.cartaoSeguir), no lugar da plaquinha de madeira, do logo dourado e do círculo vermelho.
//
// v1.2 da Máquina: direção de cada frase sem coordenada na mão (K.filmar, K.enquadrar, K.entraNo, K.entrar, K.falhar,
// K.brilhar, K.pecas, menino.colocar / irPara / reagir) e a revisão das cenas (K.medir, render --revisar).
//
// v2.2 da Máquina: cenários prontos (K.cenario, em motor/cenarios.js), bichos prontos (motor/bichos.js), modelos 3D
// prontos (K.modelo, em motor/modelos/), o doutor e o operário (K.boneco tipo), céu 'azul', chão com grão de grama
// (K.texGrao), caixa de sombra maior (K.caixaSombra) e a câmera que não atravessa o cenário (K.obstaculos).
//
// v2.3 da Máquina: nome nas peças (K.nomear), pro "mostra" de cada frase que a revisão confere, o personagem que se
// mexe segurando a pose e o cartão de seguir no idioma do canal (roteiro.idioma: 'en' ou 'es').
//
// Cena v2 (cena.js): window.CENA = { montar(tl), cena(tc, t) }. O kit chama cena() a cada quadro
// com o tempo da cena (tc, que congela e rebobina) e o tempo real (t, da narração).
// Componentes do kit (rótulo, etiqueta, seta, poeira...) somem sozinhos a cada quadro:
// a cena só chama em() dos que estão ativos naquele instante.
(function () {
  const K = {};
  const W = 1080, H = 1920;
  K.W = W; K.H = H;

  K.cores = {
    ceu: 0x9ccff4, grama: 0x8cc85c, morro: 0x86c158, morroLonge: 0x9fcf72,
    tronco: 0x7a4a2a, folhas: [0x4f9a3a, 0x6cb548, 0x5aa83f, 0x3f8a35],
    pele: 0xe6b48a, cabelo: 0x3a2418, camiseta: 0xf2c94c, bermuda: 0x2a4a92, tenis: 0x3a7be0,
    vestido: 0xd8343a, cabeloMenina: 0x4a2616,
    moletom: 0xf5c518, punho: 0xd9a514, calca: 0x1e2b4f, tenisBranco: 0xf4f1ea, sola: 0xf7941d, mochila: 0x3a3f4a,
    parede: 0xeab8bd, telhado: 0xc8442f, detalhe: 0x7a2a22, vidro: 0xa9d4f0,
    concreto: 0xc9c4bb, cano: 0x9aa0a6, agua: 0x4aa3e8, aguaClara: 0x6bb8f0, nuvem: 0xffffff,
    amarelo: 0xf5c518, vermelho: 0xe8352b, verde: 0x2fb54a
  };
  const CSS_COR = { vermelho: '#e8352b', verde: '#2fb54a', azul: '#2f7fe0', laranja: '#f39a1e', amarelo: '#f5c518', roxo: '#8a4fd8', cinza: '#8a9099' };

  // Aleatório com semente: o vídeo sai igual toda vez que renderiza
  K.rand = function (seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // Estilo redondo (roteiro.estilo = 'redondo', ligado em K.preparar): sombreamento liso no lugar do facetado
  K.mat = (color, opts = {}) =>
    new THREE.MeshStandardMaterial(Object.assign({ color, flatShading: !K.redondo, roughness: K.redondo ? 0.75 : 0.9, metalness: 0 }, opts));

  K.malha = function (geo, mat, sombra = true) {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = sombra; m.receiveShadow = true;
    return m;
  };

  // Estilo redondo: troca as geometrias do THREE por versões com mais faces e caixas de quina arredondada.
  // Vale pro kit e pro cena.js. Fica facetado de propósito: cone de 3 ou 4 lados (barbatana, dente, grama),
  // cilindro de 3 ou 4 lados (fio), icosaedro de detalhe 0 (pedra) e caixa com segmentos (grade de propósito).
  function arredondar() {
    const T = THREE;
    const { SphereGeometry, CylinderGeometry, ConeGeometry, TorusGeometry, CircleGeometry, IcosahedronGeometry, BoxGeometry } = T;
    T.SphereGeometry = class extends SphereGeometry {
      constructor(r = 1, w = 32, h = 16, ...resto) { super(r, Math.max(w, 32), Math.max(h, 20), ...resto); }
    };
    T.CylinderGeometry = class extends CylinderGeometry {
      constructor(rt = 1, rb = 1, alt = 1, lados = 32, ...resto) { super(rt, rb, alt, lados >= 5 ? Math.max(lados, 28) : lados, ...resto); }
    };
    T.ConeGeometry = class extends ConeGeometry {
      constructor(r = 1, alt = 1, lados = 32, ...resto) { super(r, alt, lados >= 5 ? Math.max(lados, 28) : lados, ...resto); }
    };
    T.TorusGeometry = class extends TorusGeometry {
      constructor(r = 1, tubo = 0.4, lados = 12, volta = 48, ...resto) { super(r, tubo, Math.max(lados, 14), Math.max(volta, 40), ...resto); }
    };
    T.CircleGeometry = class extends CircleGeometry {
      constructor(r = 1, lados = 32, ...resto) { super(r, lados >= 7 ? Math.max(lados, 40) : lados, ...resto); }
    };
    T.IcosahedronGeometry = class extends IcosahedronGeometry {
      constructor(r = 1, detalhe = 0) { super(r, detalhe >= 1 ? Math.max(detalhe, 5) : 0); }
    };
    // Caixa de quina arredondada: grade 7x7 por face em que as 3 fatias de cada ponta cobrem só a faixa da quina,
    // e cada vértice é empurrado pra superfície arredondada (raio de até 6 cm, nunca mais que 20% do lado menor)
    T.BoxGeometry = class extends BoxGeometry {
      constructor(w = 1, h = 1, d = 1, ...segs) {
        const r = Math.min(0.06, 0.2 * Math.min(w, h, d));
        if (segs.length || !(r > 1e-4)) { super(w, h, d, ...segs); return; }
        const k = 3, n = 2 * k + 1, lado = [w, h, d], meio = lado.map((l) => l / 2 - r);
        super(w, h, d, n, n, n);
        const pos = this.attributes.position, nor = this.attributes.normal, uv = this.attributes.uv;
        const passoEm = (p, e) => (p <= k ? -meio[e] - r * (1 - p / k) : meio[e] + r * ((p - k - 1) / k));
        const uvEm = (p, e) => (p <= k ? (r * p) / (k * lado[e]) : 1 - (r * (n - p)) / (k * lado[e]));
        const eixosUv = [[2, 1], [2, 1], [0, 2], [0, 2], [0, 1], [0, 1]]; // ordem das faces do BoxGeometry: +x -x +y -y +z -z
        const v = new T.Vector3(), q = new T.Vector3();
        for (let i = 0; i < pos.count; i++) {
          v.fromBufferAttribute(pos, i);
          for (let e = 0; e < 3; e++) v.setComponent(e, passoEm(Math.round((v.getComponent(e) / lado[e] + 0.5) * n), e));
          q.set(K.clamp(v.x, -meio[0], meio[0]), K.clamp(v.y, -meio[1], meio[1]), K.clamp(v.z, -meio[2], meio[2]));
          v.sub(q).normalize();
          nor.setXYZ(i, v.x, v.y, v.z);
          v.multiplyScalar(r).add(q);
          pos.setXYZ(i, v.x, v.y, v.z);
          const [eu, ev] = eixosUv[Math.floor(i / ((n + 1) * (n + 1)))];
          uv.setXY(i, uvEm(Math.round(uv.getX(i) * n), eu), uvEm(Math.round(uv.getY(i) * n), ev));
        }
      }
    };
  }

  // Curvas de tempo
  K.clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  K.lerp = (a, b, x) => a + (b - a) * x;
  K.faixa = (p, a, b) => K.clamp((p - a) / (b - a));
  K.suave = (x) => x * x * (3 - 2 * x);
  K.suavissimo = (x) => x * x * x * (x * (6 * x - 15) + 10);
  K.saiVolta = (x) => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  K.quica = (x) => {
    const n = 7.5625, d = 2.75;
    if (x < 1 / d) return n * x * x;
    if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75;
    if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375;
    return n * (x -= 2.625 / d) * x + 0.984375;
  };
  K.QUICA_IMPACTO = 1 / 2.75; // fração do quique em que a peça toca o chão pela 1ª vez
  K.pulso = (x) => Math.sin(Math.PI * K.clamp(x));
  K.lerp3 = (a, b, x) => a.map((v, i) => K.lerp(v, b[i], x));

  // Peça caindo do céu e quicando: deslocamento em y (altura → 0)
  K.queda = (tempo, altura = 8, dur = 0.7) => altura * (1 - K.quica(K.clamp(tempo / dur)));

  // Componentes que somem sozinhos a cada quadro
  const comps = [];
  K.componente = (c) => { comps.push(c); return c; };

  // Coisas vivas do cenário (árvore no vento, pássaro, borboleta, pólen): rodam a cada quadro com o tempo
  // da cena (congela no ⏸ e volta no ⏪), antes do cena.js, que pode sobrescrever
  const vivos = [];
  K.vivo = (fn) => { vivos.push(fn); return fn; };

  // Mancha redonda em degradê (sombra de contato, pólen): paradas = [[0, 'rgba(...)'], [1, 'rgba(...)']]
  function texDegrade(paradas) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    const c2 = cv.getContext('2d');
    const gr = c2.createRadialGradient(64, 64, 0, 64, 64, 64);
    paradas.forEach(([x, cor]) => gr.addColorStop(x, cor));
    c2.fillStyle = gr;
    c2.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(cv);
  }
  // Mancha redonda em degradê, pros cenários prontos (brilho de luz, raio de sol, bolha)
  K.degrade = texDegrade;

  // Sombra de contato (estilo redondo): mancha escura e macia no chão, embaixo do que encosta nele
  let texMancha = null;
  K.manchaSombra = function (raio = 0.5, forca = 0.45) {
    texMancha = texMancha || texDegrade([[0, 'rgba(0,0,0,1)'], [0.45, 'rgba(0,0,0,0.55)'], [1, 'rgba(0,0,0,0)']]);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(raio * 2, raio * 2).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ map: texMancha, transparent: true, opacity: forca, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    m.position.y = 0.012;
    m.renderOrder = 1;
    m.userData.forca = forca;
    return m;
  };

  function el(cls, pai, html) {
    const d = document.createElement('div');
    d.className = cls;
    if (html) d.innerHTML = html;
    (pai || K.palco).appendChild(d);
    return d;
  }

  const ESTILO = `
#palco canvas{display:block;transform-origin:50% 45%}
.legenda{position:absolute;left:0;right:0;top:1180px;text-align:center;font:800 100px Montserrat,'Arial Black',sans-serif;
  color:#fff;-webkit-text-stroke:16px #111;paint-order:stroke fill;letter-spacing:-1px;z-index:20}
.legenda span{display:inline-block}
.legenda .chave{color:#f5c518}
.rotulo{position:absolute;font:900 84px Montserrat,'Arial Black',sans-serif;color:#f5c518;-webkit-text-stroke:16px #111;
  paint-order:stroke fill;text-transform:uppercase;white-space:nowrap;display:none;z-index:12;text-align:center;line-height:1}
.etiqueta{position:absolute;display:none;align-items:center;gap:14px;padding:12px 26px 12px 18px;background:#fff;border-radius:999px;
  font:800 36px Montserrat,sans-serif;color:#1b1b1b;text-transform:uppercase;white-space:nowrap;box-shadow:0 6px 0 rgba(0,0,0,.25);z-index:11}
.etiqueta i{width:24px;height:24px;border-radius:50%;display:block;flex:none}
.marca{position:absolute;display:none;width:150px;height:150px;border-radius:50%;border:9px solid #111;z-index:12;box-shadow:0 8px 0 rgba(0,0,0,.25)}
.marca svg{width:100%;height:100%}
.marca.certo{background:#2fb54a}.marca.errado{background:#e8352b}
.contador{position:absolute;display:none;background:#fff;border-radius:22px;padding:16px 34px;font:900 64px Montserrat,sans-serif;color:#1b1b1b;
  white-space:nowrap;box-shadow:0 8px 0 rgba(0,0,0,.25);z-index:11;text-align:center;line-height:1.05}
.contador small{display:block;font:800 28px Montserrat,sans-serif;color:#666;letter-spacing:1px}
.medida{position:absolute;display:none;height:8px;background:#fff;border:3px solid #111;border-radius:4px;transform-origin:0 50%;z-index:10}
.medida:before,.medida:after{content:'';position:absolute;top:-22px;width:8px;height:44px;background:#fff;border:3px solid #111;border-radius:3px}
.medida:before{left:-6px}.medida:after{right:-6px}
.medida-txt{position:absolute;display:none;font:900 54px Montserrat,sans-serif;color:#fff;-webkit-text-stroke:12px #111;paint-order:stroke fill;white-space:nowrap;z-index:11}
.termometro{position:absolute;display:none;width:70px;height:300px;z-index:11}
.termometro .tubo{position:absolute;left:17px;top:0;width:36px;height:250px;background:#fff;border:6px solid #111;border-radius:20px;overflow:hidden}
.termometro .nivel{position:absolute;left:0;right:0;bottom:0;background:#e8352b}
.termometro .bulbo{position:absolute;left:0;bottom:0;width:70px;height:70px;border-radius:50%;background:#e8352b;border:6px solid #111;box-sizing:border-box}
.termometro b{position:absolute;left:84px;top:90px;font:900 56px Montserrat,sans-serif;color:#fff;-webkit-text-stroke:12px #111;paint-order:stroke fill}
.jogo-icone{position:absolute;left:64px;top:210px;width:150px;height:150px;display:none;z-index:15;filter:drop-shadow(0 6px 0 rgba(0,0,0,.35))}
.jogo-icone svg{width:100%;height:100%}
.vhs{position:absolute;inset:0;display:none;z-index:14;pointer-events:none;
  background:repeating-linear-gradient(0deg,rgba(0,0,0,.22) 0 3px,rgba(255,255,255,.04) 3px 7px)}
.vhs .faixa{position:absolute;left:0;right:0;height:70px;background:linear-gradient(transparent,rgba(255,255,255,.45),rgba(255,255,255,.1),transparent)}
.flash{position:absolute;inset:0;background:#fff;opacity:0;z-index:16;pointer-events:none}
.vinheta{position:absolute;inset:0;pointer-events:none;z-index:8;background:radial-gradient(ellipse 75% 60% at 50% 46%,transparent 55%,rgba(8,16,40,.34) 100%)}
.redondo canvas{filter:saturate(1.1) contrast(1.06) brightness(1.02)}
.divisor{position:absolute;left:0;right:0;top:954px;height:12px;background:#fff;border-top:3px solid #111;border-bottom:3px solid #111;display:none;z-index:9}
.cta{position:absolute;left:40px;right:40px;top:230px;text-align:center;display:none;font:900 66px Montserrat,sans-serif;color:#fff;
  -webkit-text-stroke:14px #111;paint-order:stroke fill;line-height:1.15;z-index:13}
.cta em{font-style:normal;color:#f5c518}
#palco{--cor:#2f80ed;--cor-texto:#fff}
.capa-titulo{position:absolute;left:56px;right:56px;top:270px;text-align:center;font:800 88px/1.36 Montserrat,sans-serif;color:#161616;
  letter-spacing:-1px;z-index:13}
.capa-titulo span{background:#fff;padding:6px 30px;border-radius:28px;-webkit-box-decoration-break:clone;box-decoration-break:clone;
  box-shadow:0 10px 0 rgba(0,0,0,.22)}
.capa-titulo em{font-style:normal;color:var(--cor-texto);background:var(--cor);border-radius:16px;padding:0 12px}
.seguir{position:absolute;left:50%;top:250px;width:600px;margin-left:-300px;padding:40px 30px 44px;box-sizing:border-box;display:none;
  z-index:18;background:#fff;border-radius:48px;box-shadow:0 14px 0 rgba(0,0,0,.25);text-align:center;font-family:Montserrat,sans-serif}
.seguir .avatar{width:170px;height:170px;margin:0 auto;border-radius:50%;background:var(--cor) center/cover;color:var(--cor-texto);
  font:900 92px/170px Montserrat,sans-serif;box-shadow:0 0 0 8px #fff,0 0 0 12px rgba(0,0,0,.12)}
.seguir .nome{margin:24px 0 28px;font-weight:800;color:#161616;white-space:nowrap}
.seguir .botao{display:inline-block;min-width:330px;padding:0 40px;height:100px;line-height:100px;box-sizing:border-box;border-radius:50px;
  background:var(--cor);color:var(--cor-texto);font-weight:900;font-size:50px}
.seguir .botao.feito{background:#e9e9ec;color:#555}
.seguir .botao svg{width:40px;height:40px;margin-left:10px;vertical-align:-4px}
.circulo{position:absolute;display:none;border-radius:50%;border:16px solid #e8352b;box-shadow:0 0 0 6px #111,inset 0 0 0 6px #111,0 10px 0 6px rgba(0,0,0,.3);z-index:12}
.cartao{position:absolute;inset:0;display:none;z-index:18;background:radial-gradient(circle at 50% 38%,rgba(40,30,90,.0) 0,rgba(10,8,30,.55) 70%)}
.cartao img{position:absolute;left:50%;top:330px;width:720px;transform:translateX(-50%);border-radius:60px;border:10px solid #111;box-shadow:0 14px 0 rgba(0,0,0,.35)}
.cartao p{position:absolute;left:0;right:0;top:1130px;margin:0;text-align:center;font:900 60px Montserrat,sans-serif;color:#fff;
  -webkit-text-stroke:12px #111;paint-order:stroke fill;letter-spacing:2px}
`;

  const ICONES = {
    pausa: '<svg viewBox="0 0 100 100"><rect x="18" y="12" width="24" height="76" rx="6" fill="#fff" stroke="#111" stroke-width="7"/><rect x="58" y="12" width="24" height="76" rx="6" fill="#fff" stroke="#111" stroke-width="7"/></svg>',
    play: '<svg viewBox="0 0 100 100"><path d="M24 10 L88 50 L24 90 Z" fill="#fff" stroke="#111" stroke-width="7" stroke-linejoin="round"/></svg>',
    rebobina: '<svg viewBox="0 0 100 100"><path d="M50 18 L6 50 L50 82 Z M94 18 L50 50 L94 82 Z" fill="#fff" stroke="#111" stroke-width="7" stroke-linejoin="round"/></svg>',
    avanca: '<svg viewBox="0 0 100 100"><path d="M6 18 L50 50 L6 82 Z M50 18 L94 50 L50 82 Z" fill="#fff" stroke="#111" stroke-width="7" stroke-linejoin="round"/></svg>'
  };
  const MARCAS = {
    certo: '<svg viewBox="0 0 100 100"><path d="M24 52 L43 70 L77 32" fill="none" stroke="#fff" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    errado: '<svg viewBox="0 0 100 100"><path d="M30 30 L70 70 M70 30 L30 70" fill="none" stroke="#fff" stroke-width="13" stroke-linecap="round"/></svg>'
  };

  // ---------- Céu, hora do dia e luz ----------

  K.ceus = {
    dia: { topo: 0x4f9fe8, horiz: 0xc9e8fb, hemiCeu: 0xe4f2ff, hemiChao: 0x6f9450, hemi: 1.6, sol: 0xfff1d6, solI: 2.6, solPos: [14, 22, 12], estrelas: 0, disco: 0.25 },
    tarde: { topo: 0x4a3f93, horiz: 0xff9f62, hemiCeu: 0xffcfa8, hemiChao: 0x6d5a62, hemi: 1.35, sol: 0xffa86a, solI: 2.3, solPos: [-22, 7, -8], estrelas: 0.15, disco: 1 },
    noite: { topo: 0x0b1d40, horiz: 0x2c5285, hemiCeu: 0x93b0e8, hemiChao: 0x2a3c52, hemi: 1.25, sol: 0xb4caff, solI: 1.4, solPos: [-10, 20, 10], estrelas: 1, disco: 0 },
    mar: { topo: 0x0d4a80, horiz: 0x1f78b8, hemiCeu: 0xa8dcff, hemiChao: 0x1b4f7a, hemi: 1.7, sol: 0xd6f0ff, solI: 1.7, solPos: [6, 22, 8], estrelas: 0, disco: 0 },
    chuva: { topo: 0x7a8794, horiz: 0xb6bfc7, hemiCeu: 0xc8d0d8, hemiChao: 0x55604a, hemi: 1.3, sol: 0xdde4ea, solI: 1.0, solPos: [8, 22, 10], estrelas: 0, disco: 0 },
    // Mundo de dentro (átomos, células): fundo azul-escuro, luz clara de estúdio
    escuro: { topo: 0x070b22, horiz: 0x18225a, hemiCeu: 0xd6e0ff, hemiChao: 0x2a3360, hemi: 1.8, sol: 0xeef2ff, solI: 1.8, solPos: [6, 22, 12], estrelas: 0.5, disco: 0 },
    // Pra capa: mar fundo e escuro, e sala na penumbra (o que brilha salta na tela)
    abismo: { topo: 0x020b20, horiz: 0x0b3d75, hemiCeu: 0x7fc0ff, hemiChao: 0x0a2240, hemi: 1.15, sol: 0xcfeaff, solI: 1.3, solPos: [6, 22, 8], estrelas: 0, disco: 0 },
    penumbra: { topo: 0x0b1020, horiz: 0x1e3a6e, hemiCeu: 0x9fb8e0, hemiChao: 0x1a2030, hemi: 0.75, sol: 0xdfe8ff, solI: 0.7, solPos: [6, 22, 12], estrelas: 0, disco: 0 },
    // Espaço (preto com estrelas, luz de estúdio pra ver as naves) e chão da Lua (sol forte, sombra dura)
    espaco: { topo: 0x000003, horiz: 0x070c22, hemiCeu: 0xdfe8ff, hemiChao: 0x2a3048, hemi: 1.7, sol: 0xffffff, solI: 2.4, solPos: [14, 22, 12], estrelas: 1, disco: 0 },
    lua: { topo: 0x000000, horiz: 0x06070d, hemiCeu: 0xc8d0e0, hemiChao: 0x55565c, hemi: 1.15, sol: 0xffffff, solI: 3.0, solPos: [16, 14, 10], estrelas: 1, disco: 0 },
    // Céu azul limpo de dia bonito (o da natureza): azul mais forte em cima, sol claro
    azul: { topo: 0x1f6fd6, horiz: 0xb4dcf7, hemiCeu: 0xe6f3ff, hemiChao: 0x6f9450, hemi: 1.55, sol: 0xfff3dc, solI: 2.7, solPos: [16, 24, 10], estrelas: 0, disco: 0.3 },
    // Dentro de casa (cozinha, sala, consultório): luz clara e macia, sol entrando de lado
    interior: { topo: 0xd9e7f2, horiz: 0xf3efe6, hemiCeu: 0xfff8ee, hemiChao: 0x9a8c7a, hemi: 1.75, sol: 0xfff0dc, solI: 1.9, solPos: [4, 22, 16], estrelas: 0, disco: 0 }
  };

  function montarCeu() {
    const uniforms = {
      topo: { value: new THREE.Color() }, horiz: { value: new THREE.Color() },
      solDir: { value: new THREE.Vector3(0, 1, 0) }, solCor: { value: new THREE.Color() }, disco: { value: 0 }
    };
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, uniforms,
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform vec3 topo; uniform vec3 horiz; uniform vec3 solDir; uniform vec3 solCor; uniform float disco; varying vec3 vDir;
        void main(){
          vec3 d = normalize(vDir);
          float h = clamp(d.y, 0.0, 1.0);
          vec3 c = mix(horiz, topo, pow(h, 0.55));
          float s = max(dot(d, normalize(solDir)), 0.0);
          c += solCor * (smoothstep(0.9985, 0.9992, s) * 1.4 + pow(s, 14.0) * 0.45) * disco;
          gl_FragColor = vec4(c, 1.0);
          #include <colorspace_fragment>
        }`
    });
    const domo = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), mat);
    domo.renderOrder = -10;
    const r = K.rand(99), pos = [];
    for (let i = 0; i < 500; i++) {
      const th = r() * Math.PI * 2, y = 0.12 + r() * 0.88, rr = Math.sqrt(1 - y * y);
      pos.push(Math.cos(th) * rr * 290, y * 290, Math.sin(th) * rr * 290);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const estrelas = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 3, sizeAttenuation: false, transparent: true, fog: false, depthWrite: false }));
    domo.add(estrelas);
    K.scene.add(domo);
    K.domo = domo; K.ceuU = uniforms; K.estrelas = estrelas;
  }

  const cTmp = new THREE.Color();
  // Mistura duas predefinições de céu: K.ceu('dia', 'tarde', 0.5)
  K.ceu = function (a, b, x = 0) {
    const A = K.ceus[a], B = K.ceus[b || a];
    const cor = (k, alvo) => alvo.setHex(A[k]).lerp(cTmp.setHex(B[k]), x);
    cor('topo', K.ceuU.topo.value);
    cor('horiz', K.ceuU.horiz.value);
    K.scene.fog.color.copy(K.ceuU.horiz.value);
    cor('hemiCeu', K.hemi.color);
    cor('hemiChao', K.hemi.groundColor);
    K.hemi.intensity = K.lerp(A.hemi, B.hemi, x);
    cor('sol', K.sol.color);
    cor('sol', K.ceuU.solCor.value);
    K.sol.intensity = K.lerp(A.solI, B.solI, x);
    K.solPos = K.lerp3(A.solPos, B.solPos, x);
    K.ceuU.solDir.value.set(...K.solPos).normalize();
    K.ceuU.disco.value = K.lerp(A.disco, B.disco, x);
    K.estrelas.material.opacity = K.lerp(A.estrelas, B.estrelas, x);
    K.estrelas.visible = K.estrelas.material.opacity > 0.01;
    K.focoSombra(K.sombraEm[0], K.sombraEm[1]);
  };

  // Centro da área com sombra (a caixa de sombra do sol tem 32 x 32)
  K.sombraEm = [0, 0];
  K.focoSombra = function (x, z) {
    K.sombraEm = [x, z];
    K.sol.target.position.set(x, 0, z);
    K.sol.position.set(x + K.solPos[0], K.solPos[1], z + K.solPos[2]);
    K.sol.target.updateMatrixWorld();
  };
  // Tamanho da caixa de sombra (meia largura; o quadro volta aos 16 sozinho). Palco grande visto do alto pede mais
  K.caixaSombra = function (meia = 16) {
    const c = K.sol.shadow.camera;
    if (c.right === meia) return;
    Object.assign(c, { left: -meia, right: meia, top: meia, bottom: -meia });
    c.updateProjectionMatrix();
  };

  K.init = function () {
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    K.palco = document.getElementById('palco');
    K.palco.prepend(renderer.domElement);
    K.canvas = renderer.domElement;

    const st = document.createElement('style');
    st.textContent = ESTILO;
    document.head.appendChild(st);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(K.cores.ceu);
    scene.fog = new THREE.Fog(K.cores.ceu, 45, 140);

    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 400);
    K.hemi = new THREE.HemisphereLight(0xe4f2ff, 0x6f9450, 1.6);
    scene.add(K.hemi);
    const sol = new THREE.DirectionalLight(0xfff1d6, 2.6);
    sol.position.set(14, 22, 12);
    sol.castShadow = true;
    sol.shadow.mapSize.set(4096, 4096);
    Object.assign(sol.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 90 });
    sol.shadow.bias = -0.0004;
    sol.shadow.normalBias = 0.02;
    scene.add(sol, sol.target);

    K.renderer = renderer; K.scene = scene; K.camera = camera; K.sol = sol;
    K.camCima = new THREE.PerspectiveCamera(42, W / (H / 2), 0.1, 400);
    K.camBaixo = new THREE.PerspectiveCamera(42, W / (H / 2), 0.1, 400);
    K.solPos = [14, 22, 12];
    montarCeu();
    K.ceu('dia');

    K.legenda = document.getElementById('legenda');
    K.ui = {
      icone: el('jogo-icone'), vhs: el('vhs', null, '<div class="faixa"></div><div class="faixa"></div>'),
      flash: el('flash'), divisor: el('divisor')
    };
  };

  K.mirar = function (pos, alvo, cam = K.camera) {
    cam.position.set(pos[0], pos[1], pos[2]);
    cam.lookAt(alvo[0], alvo[1], alvo[2]);
    cam.updateMatrixWorld();
  };

  // Plano de câmera com movimento leve do começo ao fim do trecho. de/ate: { pos, alvo, fov? }
  K.plano = function (de, ate, p, cam = K.camera) {
    const x = (K.redondo ? K.suavissimo : K.suave)(K.clamp(p));
    if (de.fov || ate.fov) {
      cam.fov = K.lerp(de.fov || K.FOV, ate.fov || K.FOV, x);
      cam.updateProjectionMatrix();
    }
    K.mirar(K.lerp3(de.pos, ate.pos, x), K.lerp3(de.alvo, ate.alvo, x), cam);
  };

  // Tremida de impacto: dt = tempo desde o impacto
  K.tremer = function (dt, forca = 1, cam = K.camera) {
    if (dt < 0 || dt > 0.5) return;
    const a = forca * 0.12 * Math.pow(1 - dt / 0.5, 2);
    cam.position.x += Math.sin(dt * 90) * a;
    cam.position.y += Math.cos(dt * 77) * a;
    cam.updateMatrixWorld();
  };

  // Neblina e alcance da câmera (o quadro volta ao padrão sozinho). Palcos grandes vistos do alto pedem mais
  K.neblina = function (perto = 45, longe = 140, alcance = 400) {
    K.scene.fog.near = perto;
    K.scene.fog.far = longe;
    [K.camera, K.camCima, K.camBaixo].forEach((c) => { if (c.far !== alcance) { c.far = alcance; c.updateProjectionMatrix(); } });
  };

  // Tela dividida: posicionar K.camCima e K.camBaixo e chamar K.dividir() no quadro
  K.dividir = function () { K.dividida = true; };

  // Ponto 3D → pixel na tela. op: { cam, metade: 'cima' | 'baixo' }
  const vTela = new THREE.Vector3();
  K.tela = function (ponto, op = {}) {
    const cam = op.cam || (op.metade === 'cima' ? K.camCima : op.metade === 'baixo' ? K.camBaixo : K.camera);
    vTela.set(ponto[0], ponto[1], ponto[2]).project(cam);
    let x = ((vTela.x + 1) / 2) * W, y = ((1 - vTela.y) / 2) * H;
    if (op.metade) y = y / 2 + (op.metade === 'baixo' ? H / 2 : 0);
    return [x, y];
  };
  const posTela = (ponto, op) => (ponto.tela ? ponto.tela : K.tela(ponto, op));
  // Posiciona um texto centrado no ponto, sem deixar sair pelas laterais da tela
  function colocar(d, x, y, escala, extra = '') {
    const meia = (d.offsetWidth * Math.max(1, escala)) / 2 + 24;
    const cx = Math.min(W - meia, Math.max(meia, x));
    d.style.left = cx + 'px';
    d.style.top = y + 'px';
    d.style.transform = `translate(-50%,-50%) scale(${escala})${extra}`;
  }

  // ---------- Mundo ----------

  // ---------- Mundo enfeitado (estilo redondo) ----------

  // Chão com manchas de verde mais claro e mais escuro (cores por vértice)
  function chaoManchado() {
    const geo = new THREE.PlaneGeometry(400, 400, 200, 200);
    const pos = geo.attributes.position, cores = [];
    const escuro = new THREE.Color(0x76b44c), claro = new THREE.Color(0xa3d66c), seco = new THREE.Color(0xb5cf6a), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = -pos.getY(i);
      const mancha = 0.5 + 0.25 * Math.sin(x * 0.19 + Math.sin(z * 0.13) * 2) + 0.25 * Math.sin(z * 0.23 + Math.cos(x * 0.11) * 2);
      const palha = K.clamp((Math.sin(x * 0.07 + 1) * Math.sin(z * 0.09 + 2) - 0.55) * 3);
      c.copy(escuro).lerp(claro, K.clamp(mancha)).lerp(seco, palha * 0.5);
      cores.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cores, 3));
    return geo;
  }

  // Lugar livre pros enfeites: longe do centro, onde as cenas montam as coisas
  function lugarLivre(r, xMax, z0, z1) {
    for (;;) {
      const x = (r() - 0.5) * 2 * xMax, z = z0 + r() * (z1 - z0);
      if (Math.abs(x) > 4.5 || z < -4 || z > 4) return [x, z];
    }
  }

  // op (dos cenários prontos; sem ele, o mundo de sempre): flores, arbustos, pedras, borboletas, passaros (quantos de
  // cada) e polen (false tira)
  function enfeitarMundo(g, r, op = {}) {
    // Flores em canteiros (instanciadas: 3 malhas pra todas)
    const nFlor = op.flores ?? 150, coresFlor = [0xff6b8a, 0xffffff, 0xb57cff, 0xffa53a, 0x6fb7ff, 0xff4d4d].map((h) => new THREE.Color(h));
    const caules = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.008, 0.011, 0.24, 5).translate(0, 0.12, 0), K.mat(0x3f8a35), nFlor);
    const petalas = new THREE.InstancedMesh(new THREE.SphereGeometry(0.036).scale(1, 0.3, 0.62).translate(0.042, 0, 0), K.mat(0xffffff, { roughness: 0.6 }), nFlor * 5);
    const miolos = new THREE.InstancedMesh(new THREE.SphereGeometry(0.026).scale(1, 0.6, 1), K.mat(0xf5c518), nFlor);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), um = new THREE.Vector3(1, 1, 1);
    const flores = [];
    let f = 0;
    while (f < nFlor) {
      const [cx, cz] = lugarLivre(r, 14, -7, 12);
      const cor = coresFlor[Math.floor(r() * coresFlor.length)];
      for (let k = 0, qtd = 5 + Math.floor(r() * 7); k < qtd && f < nFlor; k++, f++) {
        const x = cx + (r() - 0.5) * 1.2, z = cz + (r() - 0.5) * 1.2, alt = 0.75 + r() * 0.5, giro = r() * 6;
        m4.compose(v.set(x, 0, z), q.identity(), v.clone().set(1, alt, 1));
        caules.setMatrixAt(f, m4);
        m4.compose(v.set(x, 0.24 * alt, z), q.identity(), um);
        miolos.setMatrixAt(f, m4);
        for (let p = 0; p < 5; p++) {
          e.set(0, giro + (p / 5) * Math.PI * 2, 0.25);
          m4.compose(v.set(x, 0.24 * alt, z), q.setFromEuler(e), um);
          petalas.setMatrixAt(f * 5 + p, m4);
          petalas.setColorAt(f * 5 + p, cor);
        }
        flores.push([x, 0.24 * alt + 0.05, z]);
      }
    }
    [caules, petalas, miolos].forEach((m) => { m.castShadow = true; m.receiveShadow = true; g.add(m); });

    // Arbustos: bolas verdes juntas, no fundo e nas laterais
    for (let i = 0, nArb = op.arbustos ?? 34; i < nArb; i++) {
      const [x, z] = lugarLivre(r, 34, -38, 6);
      if (z > -6 && Math.abs(x) < 9) continue;
      const b = new THREE.Group(), cor = new THREE.Color(K.cores.folhas[i % 4]), s = 0.45 + r() * 0.55;
      [[0, 0.42, 0, 0.5], [0.42, 0.3, 0.1, 0.36], [-0.4, 0.28, -0.05, 0.38]].forEach(([bx, by, bz, raio]) => {
        const bola = K.malha(new THREE.SphereGeometry(raio), K.mat(cor.clone().offsetHSL(0, 0, (r() - 0.5) * 0.06)));
        bola.position.set(bx, by, bz);
        b.add(bola);
      });
      b.add(K.manchaSombra(0.95, 0.35));
      b.position.set(x, 0, z);
      b.scale.setScalar(s);
      b.rotation.y = r() * 6;
      g.add(b);
    }

    // Pedrinhas (facetadas de propósito)
    for (let i = 0, nPedra = op.pedras ?? 22; i < nPedra; i++) {
      const [x, z] = lugarLivre(r, 16, -10, 12), s = 0.06 + r() * 0.14;
      const pedra = K.malha(new THREE.IcosahedronGeometry(s, 0), K.mat(r() < 0.5 ? 0x9a958c : 0xb3ada2));
      pedra.position.set(x, s * 0.35, z);
      pedra.rotation.set(r() * 3, r() * 3, 0);
      g.add(pedra);
    }

    // Borboletas voando em volta dos canteiros
    const coresAsa = [0xf7941d, 0x3a7be0, 0xf5c518, 0xffffff];
    for (let i = 0, nBorb = flores.length ? op.borboletas ?? 6 : 0; i < nBorb; i++) {
      const bf = new THREE.Group(), mat = K.mat(coresAsa[i % 4], { side: THREE.DoubleSide, roughness: 0.6 });
      const asas = [-1, 1].map((lado) => {
        const piv = new THREE.Group();
        const asa = new THREE.Mesh(new THREE.CircleGeometry(0.07, 16).scale(1, 0.8, 1).translate(lado * 0.07, 0.02, 0).rotateX(-Math.PI / 2), mat);
        piv.add(asa);
        bf.add(piv);
        return piv;
      });
      bf.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.07, 4, 8).rotateX(Math.PI / 2), K.mat(0x2a2018)));
      g.add(bf);
      const casa = flores[Math.floor(r() * flores.length)], fase = r() * 10, raio = 0.5 + r() * 0.5;
      const ponto = (t) => [casa[0] + Math.sin(t * 0.9 + fase) * raio, casa[1] + 0.35 + Math.sin(t * 2.1 + fase) * 0.18, casa[2] + Math.sin(t * 0.63 + fase * 2) * raio];
      K.vivo((t) => {
        const a = ponto(t), b = ponto(t + 0.05);
        bf.position.set(...a);
        bf.rotation.y = Math.atan2(b[0] - a[0], b[2] - a[2]);
        const bate = Math.sin(t * 34 + fase) * 0.9;
        asas[0].rotation.z = bate; asas[1].rotation.z = -bate;
      });
    }

    // Bando de pássaros cruzando o céu
    const matPassaro = K.mat(0x2a2f3a);
    for (let i = 0, nPass = Math.min(5, op.passaros ?? 5); i < nPass; i++) {
      const p = new THREE.Group();
      p.add(new THREE.Mesh(new THREE.SphereGeometry(0.2).scale(0.8, 0.8, 1.7), matPassaro));
      const asas = [-1, 1].map((lado) => {
        const piv = new THREE.Group();
        piv.add(new THREE.Mesh(new THREE.SphereGeometry(0.34).scale(1, 0.08, 0.45).translate(lado * 0.32, 0, 0), matPassaro));
        p.add(piv);
        return piv;
      });
      g.add(p);
      const lugar = [[0, 0], [-1.4, -1.2], [1.4, -1.2], [-2.8, -2.4], [2.8, -2.4]][i];
      K.vivo((t) => {
        const ida = ((t * 2.4 + 20) % 110) - 55;
        p.position.set(ida + lugar[1], 15 + lugar[0] * 0.3 + Math.sin(t * 0.8 + i) * 0.4, -38 + lugar[0]);
        p.rotation.y = Math.PI / 2;
        const bate = Math.sin(t * 9 + i * 0.7) * 0.6;
        asas[0].rotation.z = bate; asas[1].rotation.z = -bate;
      });
    }

    // Pólen brilhando no ar, subindo devagar
    if (op.polen === false) return;
    const nPolen = 260, base = [], pos = new Float32Array(nPolen * 3);
    for (let i = 0; i < nPolen; i++) base.push([(r() - 0.5) * 22, r(), -10 + r() * 20, r() * 6]);
    const geoPolen = new THREE.BufferGeometry();
    geoPolen.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const polen = new THREE.Points(geoPolen, new THREE.PointsMaterial({
      size: 0.05, map: texDegrade([[0, 'rgba(255,255,255,1)'], [0.3, 'rgba(255,255,255,0.7)'], [1, 'rgba(255,255,255,0)']]),
      color: 0xfff3c4, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    g.add(polen);
    K.vivo((t) => {
      base.forEach(([x, y, z, ph], i) => {
        pos[i * 3] = x + Math.sin(t * 0.4 + ph) * 0.35;
        pos[i * 3 + 1] = 0.2 + ((y + t * 0.035) % 1) * 4.5;
        pos[i * 3 + 2] = z + Math.cos(t * 0.33 + ph * 1.3) * 0.35;
      });
      geoPolen.attributes.position.needsUpdate = true;
    });
  }

  // Enfeites do mundo vivo (flores, arbustos, pedrinhas, borboletas, pássaros, pólen) dentro do grupo g, longe do
  // centro. Pros cenários prontos: op como no enfeitarMundo (quantos de cada)
  K.enfeitar = (g, seed = 7, op = {}) => enfeitarMundo(g, K.rand(seed), op);

  // Grão de grama (pontinhos e folhinhas claras e escuras) que multiplica a cor do chão: K.mat(cor, { map: K.texGrao() }).
  // repete: vezes no chão todo
  let canvasGrao = null;
  K.texGrao = function (repete = 100) {
    if (!canvasGrao) {
      canvasGrao = document.createElement('canvas');
      canvasGrao.width = canvasGrao.height = 512;
      const c = canvasGrao.getContext('2d'), r = K.rand(77);
      c.fillStyle = 'rgb(236,236,236)';
      c.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 9000; i++) {
        const v = Math.round(190 + r() * 65);
        c.fillStyle = `rgb(${v},${v},${v})`;
        c.fillRect(r() * 512, r() * 512, 1 + r() * 2, 1 + r() * 2);
      }
      for (let i = 0; i < 2600; i++) {
        const x = r() * 512, y = r() * 512, v = Math.round(r() < 0.5 ? 175 + r() * 30 : 245 + r() * 10);
        c.strokeStyle = `rgb(${v},${v},${v})`;
        c.lineWidth = 1 + r();
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + (r() - 0.5) * 4, y - 3 - r() * 6); c.stroke();
      }
    }
    const t = new THREE.CanvasTexture(canvasGrao);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repete, repete);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  };

  K.mundo = function (seed = 7) {
    const r = K.rand(seed);
    const g = new THREE.Group();

    const chao = K.redondo
      ? K.malha(chaoManchado(), K.mat(0xffffff, { vertexColors: true }), false)
      : K.malha(new THREE.PlaneGeometry(400, 400), K.mat(K.cores.grama), false);
    chao.rotation.x = -Math.PI / 2;
    g.add(chao);

    const morros = [[-30, -55, 30, 9], [20, -60, 36, 11], [55, -45, 26, 8], [-60, -40, 28, 7], [0, -85, 50, 14]];
    morros.forEach(([x, z, raio, alt], i) => {
      const m = K.malha(new THREE.IcosahedronGeometry(1, 2), K.mat(i % 2 ? K.cores.morro : K.cores.morroLonge), false);
      m.scale.set(raio, alt, raio * 0.7);
      m.position.set(x, -alt * 0.35, z);
      g.add(m);
    });

    for (let i = 0; i < 70; i++) {
      const lado = r() < 0.5 ? -1 : 1;
      const x = r() < 0.6 ? lado * (9 + r() * 40) : (r() - 0.5) * 70;
      const z = -8 - r() * 45;
      g.add(K.arvore(x, z, 0.8 + r() * 0.9, r() < 0.35, r));
    }

    // Grama em tufos (instanciada pra ficar leve)
    const tufo = new THREE.ConeGeometry(0.035, 0.32, 3);
    tufo.translate(0, 0.16, 0);
    const nTufos = K.redondo ? 2600 : 1400;
    const tufos = new THREE.InstancedMesh(tufo, K.mat(K.redondo ? 0xffffff : 0x4f9a3a), nTufos);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    const tomGrama = [0x4f9a3a, 0x5aa83f, 0x3f8a35, 0x6cb548, 0x7cc04f].map((h) => new THREE.Color(h));
    let n = 0;
    while (n < nTufos) {
      const x = (r() - 0.5) * 26, z = -4 + r() * 18;
      if (Math.abs(x) < 3.6 && z > -2.8 && z < 2.8) continue; // não nasce dentro da casa
      e.set((r() - 0.5) * 0.5, r() * 6, (r() - 0.5) * 0.5);
      q.setFromEuler(e);
      const s = 0.6 + r() * 0.9;
      m4.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(s, s, s));
      if (K.redondo) tufos.setColorAt(n, tomGrama[Math.floor(r() * tomGrama.length)]);
      tufos.setMatrixAt(n++, m4);
    }
    tufos.receiveShadow = true;
    g.add(tufos);
    if (K.redondo) enfeitarMundo(g, r);

    [[-14, 22, -40], [10, 26, -50], [26, 20, -35], [-30, 24, -60]].forEach(([x, y, z], i) => g.add(K.nuvem(x, y, z, 2 + (i % 2), r)));
    K.scene.add(g);
    return g;
  };

  K.arvore = function (x, z, s, pinheiro, r) {
    const g = new THREE.Group();
    const tronco = K.malha(new THREE.CylinderGeometry(0.12, 0.18, 1.2, 6), K.mat(K.cores.tronco));
    tronco.position.y = 0.6;
    g.add(tronco);
    const cor = K.cores.folhas[Math.floor(r() * K.cores.folhas.length)];
    if (pinheiro && K.redondo) {
      // Três andares de cone, cada um mais estreito
      [[0.85, 1.4, 1.5], [0.66, 1.2, 2.25], [0.44, 1.0, 2.95]].forEach(([raio, alt, y]) => {
        const andar = K.malha(new THREE.ConeGeometry(raio, alt), K.mat(0x2f6f35));
        andar.position.y = y;
        g.add(andar);
      });
    } else if (pinheiro) {
      const copa = K.malha(new THREE.ConeGeometry(0.8, 2.4, 6), K.mat(0x2f6f35));
      copa.position.y = 2.2;
      g.add(copa);
    } else if (K.redondo) {
      // Copa fofa: uma bola grande e duas menores, em tons vizinhos
      const tom = new THREE.Color(cor);
      [[0, 1.95, 0, 0.82], [-0.5, 1.6, 0.18, 0.55], [0.48, 1.68, -0.12, 0.6]].forEach(([bx, by, bz, raio], i) => {
        const bola = K.malha(new THREE.SphereGeometry(raio), K.mat(tom.clone().offsetHSL(0, 0, (i - 1) * 0.03 + (r() - 0.5) * 0.04)));
        bola.position.set(bx, by, bz);
        g.add(bola);
      });
      g.rotation.y = r() * 6;
    } else {
      const copa = K.malha(new THREE.IcosahedronGeometry(0.95, 0), K.mat(cor));
      copa.position.y = 1.9;
      copa.rotation.set(r() * 3, r() * 3, 0);
      g.add(copa);
    }
    if (K.redondo) {
      g.add(K.manchaSombra(pinheiro ? 1.0 : 1.3, 0.35));
      const fase = r() * 6;
      K.vivo((t) => { g.rotation.z = Math.sin(t * 1.1 + fase) * 0.022; g.rotation.x = Math.sin(t * 0.8 + fase * 1.7) * 0.012; });
    }
    g.position.set(x, 0, z);
    g.scale.setScalar(s);
    return g;
  };

  K.nuvem = function (x, y, z, s, r) {
    const g = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const b = K.malha(new THREE.IcosahedronGeometry(1, 1), K.mat(K.cores.nuvem, { roughness: 1, emissive: K.redondo ? 0x5a6470 : 0x000000 }), false);
      b.position.set((i - 2) * 1.1, (r() - 0.3) * 0.6, (r() - 0.5) * 0.8);
      b.scale.setScalar(0.9 + r() * 0.7);
      g.add(b);
    }
    g.position.set(x, y, z);
    g.scale.setScalar(s);
    if (K.redondo) K.vivo((t) => { g.position.x = x + t * 0.25; });
    return g;
  };

  // Casa padrão: 6 x 3 x 5, frente virada pra +z, cumeeira no eixo x (topo ~ y 4.8).
  // g.userData: { paredes, placas: [frente, fundo], matParede }
  K.casa = function () {
    const g = new THREE.Group();
    const matParede = K.mat(K.cores.parede);
    const paredes = K.malha(new THREE.BoxGeometry(6, 3, 5, 1, 1, 1), matParede); // quina reta: o oitão encosta no topo
    paredes.position.y = 1.5;
    g.add(paredes);

    const ang = Math.atan(1.8 / 3);
    const placas = [1, -1].map((lado) => {
      const placa = K.malha(new THREE.BoxGeometry(6.8, 0.22, 3.6), K.mat(K.cores.telhado));
      placa.position.set(0, 3.82, lado * 1.5);
      placa.rotation.x = lado * ang;
      g.add(placa);
      return placa;
    });
    const tri = new THREE.Shape();
    tri.moveTo(-2.5, 0); tri.lineTo(2.5, 0); tri.lineTo(0, 1.6); tri.lineTo(-2.5, 0);
    [3, -3].forEach((x) => {
      const oit = K.malha(new THREE.ShapeGeometry(tri), K.mat(K.cores.parede, { side: THREE.DoubleSide }));
      oit.rotation.y = Math.PI / 2;
      oit.position.set(x, 3, 0);
      g.add(oit);
    });

    const porta = K.malha(new THREE.BoxGeometry(0.95, 1.8, 0.1), K.mat(K.cores.detalhe));
    porta.position.set(0.6, 0.9, 2.52);
    g.add(porta);
    [-1.6, 2.1].forEach((x) => {
      const moldura = K.malha(new THREE.BoxGeometry(1.0, 0.9, 0.08), K.mat(K.cores.detalhe));
      moldura.position.set(x, 1.75, 2.52);
      const vidro = K.malha(new THREE.BoxGeometry(0.8, 0.7, 0.1), K.mat(K.cores.vidro, { roughness: 0.3 }));
      vidro.position.set(x, 1.75, 2.53);
      g.add(moldura, vidro);
    });
    g.userData = { paredes, placas, matParede, ang };
    K.scene.add(g);
    return g;
  };

  // ---------- Objetos do dia a dia ----------

  // Cano por uma lista de pontos, com cotovelos. c.em(x) faz o cano crescer de 0 a 1 ao longo do caminho.
  K.cano = function (pontos, raio = 0.06, cor = K.cores.cano) {
    const g = new THREE.Group();
    const mat = K.mat(cor, { roughness: 0.5, transparent: true, opacity: 1 });
    const up = new THREE.Vector3(0, 1, 0);
    const segs = [];
    const geo = new THREE.CylinderGeometry(raio, raio, 1, 10);
    geo.translate(0, 0.5, 0);
    const geoJunta = new THREE.SphereGeometry(raio * 1.35, 10, 8);
    for (let i = 0; i + 1 < pontos.length; i++) {
      const m = K.malha(geo, mat), junta = K.malha(geoJunta, mat);
      g.add(m, junta);
      segs.push({ m, junta, L: 0, ini: 0 });
    }
    const a = new THREE.Vector3(), b = new THREE.Vector3();
    K.scene.add(g);
    let xAtual = 1;
    const c = {
      g, mat, total: 0, pontos,
      // Move os pontos (mesma quantidade) sem recriar o cano
      atualizar(novos) {
        c.pontos = pontos = novos;
        c.total = 0;
        segs.forEach((s, i) => {
          a.set(...pontos[i]); b.set(...pontos[i + 1]);
          s.L = b.distanceTo(a);
          s.ini = c.total;
          c.total += s.L;
          s.m.position.copy(a);
          s.m.quaternion.setFromUnitVectors(up, b.sub(a).normalize());
          s.junta.position.set(...pontos[i + 1]);
        });
        c.em(xAtual);
      },
      em(x = 1) {
        xAtual = x;
        const total = c.total;
        const dist = K.clamp(x) * total;
        g.visible = x > 0;
        segs.forEach((s, i) => {
          const f = K.clamp((dist - s.ini) / s.L);
          s.m.visible = f > 0;
          s.m.scale.y = Math.max(0.001, f * s.L);
          s.junta.visible = f >= 1 && i < segs.length - 1;
        });
      },
      // Ponto a uma fração do caminho (0 a 1)
      ponto(x) {
        const dist = K.clamp(x) * c.total;
        for (const s of segs) {
          if (dist <= s.ini + s.L + 1e-6) {
            const i = segs.indexOf(s), f = (dist - s.ini) / s.L;
            return K.lerp3(pontos[i], pontos[i + 1], f);
          }
        }
        return pontos[pontos.length - 1].slice();
      }
    };
    c.atualizar(pontos);
    return c;
  };

  // Placa ou bilhete com texto (textura desenhada em canvas). Plano virado pra +z.
  K.placa = function (texto, op = {}) {
    const { larg = 1, alt = 0.6, fundo = '#fffdf2', cor = '#1b1b1b', borda = '#111', fonte = 900 } = op;
    const cv = document.createElement('canvas');
    cv.width = 512; cv.height = Math.round(512 * alt / larg);
    const c2 = cv.getContext('2d');
    c2.fillStyle = fundo; c2.fillRect(0, 0, cv.width, cv.height);
    c2.strokeStyle = borda; c2.lineWidth = 14; c2.strokeRect(7, 7, cv.width - 14, cv.height - 14);
    c2.fillStyle = cor; c2.textAlign = 'center'; c2.textBaseline = 'middle';
    const linhas = texto.split('\n');
    const tam = Math.min(96, (cv.height * 0.75) / linhas.length);
    c2.font = `${fonte} ${tam}px Montserrat, sans-serif`;
    linhas.forEach((l, i) => c2.fillText(l, cv.width / 2, cv.height / 2 + (i - (linhas.length - 1) / 2) * tam * 1.1, cv.width - 40));
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const m = K.malha(new THREE.PlaneGeometry(larg, alt), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }), false);
    K.scene.add(m);
    return m;
  };

  // Água correndo dentro de um cano (pontinhos claros seguindo o caminho). Deixar o cano translúcido.
  K.fluxo = function (cano, n = 40, cor = K.cores.aguaClara, tam = 1) {
    const geo = new THREE.SphereGeometry(0.045 * tam, 6, 5);
    geo.scale(1, 1.8, 1);
    const mat = new THREE.MeshBasicMaterial({ color: cor });
    const gotas = [];
    const g = new THREE.Group();
    for (let i = 0; i < n; i++) { const m = new THREE.Mesh(geo, mat); g.add(m); gotas.push(m); }
    g.visible = false;
    K.scene.add(g);
    return K.componente({
      esconder() { g.visible = false; },
      // t: tempo; vel: caminhos por segundo; ate: até onde a água já chegou (0 a 1); sentido -1 = de trás pra frente
      em(t, vel = 0.5, ate = 1, sentido = 1) {
        g.visible = true;
        gotas.forEach((m, i) => {
          let f = ((i / n) + t * vel) % 1;
          if (sentido < 0) f = 1 - f;
          m.visible = f <= ate;
          m.position.set(...cano.ponto(f));
        });
      }
    });
  };

  // Jato caindo de um ponto (fio de água). em(origem, comprimento, t, grossura)
  K.jato = function (raio = 0.045, cor = K.cores.aguaClara) {
    const geo = new THREE.CylinderGeometry(raio, raio * 1.15, 1, 10, 4);
    geo.translate(0, -0.5, 0);
    const m = K.malha(geo, K.mat(cor, { transparent: true, opacity: 0.88, roughness: 0.15 }), false);
    m.visible = false;
    K.scene.add(m);
    return K.componente({
      m,
      esconder() { m.visible = false; },
      em(origem, comp, t = 0, grossura = 1) {
        m.visible = comp > 0.01 && grossura > 0.01;
        m.position.set(...origem);
        const w = grossura * (1 + Math.sin(t * 40) * 0.06);
        m.scale.set(w, Math.max(0.01, comp), w);
      }
    });
  };

  // Gotas pingando de um ponto até o chão. em(origem, t, ritmo (gotas/s), queda (m))
  K.pingos = function (seed = 2, n = 6, cor = K.cores.aguaClara) {
    const r = K.rand(seed);
    const geo = new THREE.SphereGeometry(0.035, 8, 6);
    geo.scale(1, 1.5, 1);
    const mat = K.mat(cor, { roughness: 0.2 });
    const g = new THREE.Group();
    const gs = [];
    for (let i = 0; i < n; i++) { const m = K.malha(geo, mat, false); g.add(m); gs.push({ m, dx: (r() - 0.5) * 0.04 }); }
    g.visible = false;
    K.scene.add(g);
    return K.componente({
      esconder() { g.visible = false; },
      em(origem, t, ritmo = 2, queda = 2) {
        g.visible = true;
        const tq = Math.sqrt((2 * queda) / 9.8);
        gs.forEach((p, i) => {
          const tau = ((t * ritmo + i) % n) / ritmo; // cada gota sai 1/ritmo depois da anterior
          const y = 4.9 * tau * tau;
          p.m.visible = tau < tq;
          p.m.position.set(origem[0] + p.dx, origem[1] - Math.min(y, queda), origem[2]);
        });
      }
    });
  };

  // Torneira de parede ou poste. t.bico = ponto de saída da água (coordenadas locais + posição)
  K.torneira = function (pos, comPoste = true) {
    const g = new THREE.Group();
    const metal = K.mat(0xb8bec4, { roughness: 0.3, metalness: 0.4 });
    if (comPoste) {
      const poste = K.malha(new THREE.BoxGeometry(0.12, 0.85, 0.12), K.mat(K.cores.concreto));
      poste.position.y = 0.425;
      g.add(poste);
    }
    const bico = K.malha(new THREE.CylinderGeometry(0.035, 0.035, 0.2, 8).rotateZ(Math.PI / 2), metal);
    bico.position.set(0.12, 0.78, 0);
    const cotov = K.malha(new THREE.CylinderGeometry(0.035, 0.035, 0.08, 8), metal);
    cotov.position.set(0.21, 0.74, 0);
    const alavanca = new THREE.Group();
    alavanca.add(K.malha(new THREE.BoxGeometry(0.16, 0.035, 0.035), K.mat(0xd0342c)), K.malha(new THREE.BoxGeometry(0.035, 0.035, 0.16), K.mat(0xd0342c)));
    alavanca.position.set(0.1, 0.86, 0);
    g.add(bico, cotov, alavanca);
    g.position.set(...pos);
    K.scene.add(g);
    return { g, alavanca, bico: [pos[0] + 0.21, pos[1] + 0.7, pos[2]] };
  };

  // Registro (válvula com alavanca vermelha) pra pôr num cano vertical
  K.registro = function () {
    const g = new THREE.Group();
    const corpo = K.malha(new THREE.CylinderGeometry(0.1, 0.1, 0.22, 10), K.mat(0xc9a227, { roughness: 0.4, metalness: 0.5 }));
    const eixo = K.malha(new THREE.CylinderGeometry(0.025, 0.025, 0.14, 6).rotateX(Math.PI / 2), K.mat(0x666666));
    eixo.position.z = 0.12;
    const alavanca = new THREE.Group();
    const cabo = K.malha(new THREE.BoxGeometry(0.42, 0.07, 0.05), K.mat(0xd0342c));
    cabo.position.x = 0.17;
    alavanca.add(cabo);
    alavanca.position.z = 0.2;
    g.add(corpo, eixo, alavanca);
    K.scene.add(g);
    return { g, alavanca };
  };

  K.balde = function (cor = 0x3a8fe0) {
    const g = new THREE.Group();
    const mat = K.mat(cor, { side: THREE.DoubleSide });
    const corpo = K.malha(new THREE.CylinderGeometry(0.2, 0.15, 0.32, 14, 1, true), mat);
    corpo.position.y = 0.16;
    const fundo = K.malha(new THREE.CircleGeometry(0.15, 14).rotateX(-Math.PI / 2), mat);
    fundo.position.y = 0.005;
    const alca = K.malha(new THREE.TorusGeometry(0.2, 0.012, 5, 16, Math.PI), K.mat(0x888888));
    alca.position.y = 0.32;
    const agua = K.malha(new THREE.CircleGeometry(0.19, 14).rotateX(-Math.PI / 2), K.mat(K.cores.agua, { roughness: 0.2 }), false);
    agua.position.y = 0.26;
    g.add(corpo, fundo, alca, agua);
    K.scene.add(g);
    return { g, agua, alca };
  };

  K.regador = function (cor = 0x3fae5a) {
    const g = new THREE.Group();
    const mat = K.mat(cor);
    const corpo = K.malha(new THREE.CylinderGeometry(0.15, 0.17, 0.3, 12), mat);
    corpo.position.y = 0.15;
    const bico = K.malha(new THREE.CylinderGeometry(0.02, 0.035, 0.4, 8), mat);
    bico.position.set(0.25, 0.25, 0);
    bico.rotation.z = -0.95;
    const crivo = K.malha(new THREE.CylinderGeometry(0.06, 0.03, 0.05, 10), mat);
    crivo.position.set(0.42, 0.37, 0);
    crivo.rotation.z = -0.95;
    const alca = K.malha(new THREE.TorusGeometry(0.11, 0.02, 5, 12, Math.PI), mat);
    alca.position.set(-0.04, 0.3, 0);
    g.add(corpo, bico, crivo, alca);
    K.scene.add(g);
    return { g, bicoLocal: [0.45, 0.39, 0] };
  };

  // Flor no vaso. f.em(vida): 0 = murcha, 1 = viva
  K.flor = function (cor = 0xff5a8a) {
    const g = new THREE.Group();
    const vaso = K.malha(new THREE.CylinderGeometry(0.2, 0.14, 0.3, 10), K.mat(0xc0643a));
    vaso.position.y = 0.15;
    const terra = K.malha(new THREE.CircleGeometry(0.18, 10).rotateX(-Math.PI / 2), K.mat(0x5a3a22));
    terra.position.y = 0.29;
    const haste = new THREE.Group();
    haste.position.y = 0.29;
    const caule = K.malha(new THREE.CylinderGeometry(0.018, 0.02, 0.45, 6).translate(0, 0.225, 0), K.mat(0x3f8a35));
    const folha = K.malha(new THREE.SphereGeometry(0.07, 6, 4).scale(1.6, 0.3, 0.8), K.mat(0x4f9a3a));
    folha.position.set(0.07, 0.17, 0);
    folha.rotation.z = 0.5;
    const cabeca = new THREE.Group();
    cabeca.position.y = 0.45;
    const miolo = K.malha(new THREE.SphereGeometry(0.06, 8, 6), K.mat(0xf5c518));
    const matPetala = K.mat(cor);
    const petalas = [];
    for (let i = 0; i < 6; i++) {
      const p = K.malha(new THREE.SphereGeometry(0.07, 7, 5).scale(1, 0.35, 0.6), matPetala);
      const a = (i / 6) * Math.PI * 2;
      p.position.set(Math.cos(a) * 0.09, 0, Math.sin(a) * 0.09);
      p.rotation.y = -a;
      cabeca.add(p);
      petalas.push(p);
    }
    cabeca.add(miolo);
    cabeca.rotation.x = Math.PI / 2 - 0.25; // flor virada pra frente
    haste.add(caule, folha, cabeca);
    g.add(vaso, terra, haste);
    K.scene.add(g);
    const viva = new THREE.Color(cor), murcha = new THREE.Color(0x9a7a5a);
    return {
      g,
      em(vida) {
        const v = K.clamp(vida);
        haste.rotation.z = (1 - v) * 1.1;
        cabeca.rotation.z = (1 - v) * 0.8;
        petalas.forEach((p, i) => { p.rotation.z = (1 - v) * 0.9; p.scale.setScalar(0.75 + 0.25 * v + Math.sin(i) * 0.02); });
        matPetala.color.copy(murcha).lerp(viva, v);
      }
    };
  };

  // Tambor (bombona azul)
  K.tambor = function (cor = 0x2a6fd6) {
    const g = new THREE.Group();
    const corpo = K.malha(new THREE.CylinderGeometry(0.42, 0.42, 1.1, 18), K.mat(cor));
    corpo.position.y = 0.55;
    g.add(corpo);
    [0.3, 0.8].forEach((y) => {
      const aro = K.malha(new THREE.TorusGeometry(0.43, 0.03, 5, 22).rotateX(Math.PI / 2), K.mat(0x1d4f9e));
      aro.position.y = y;
      g.add(aro);
    });
    const tampa = K.malha(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 10), K.mat(0x1d4f9e));
    tampa.position.set(0.18, 1.12, 0);
    g.add(tampa);
    K.scene.add(g);
    return g;
  };

  // Carro low-poly (frente pra +x)
  K.carro = function (cor = 0xe8352b) {
    const g = new THREE.Group();
    const lata = K.mat(cor, { roughness: 0.5 });
    const base = K.malha(new THREE.BoxGeometry(2.0, 0.5, 1.0), lata);
    base.position.y = 0.45;
    const cabine = K.malha(new THREE.BoxGeometry(1.05, 0.45, 0.9), lata);
    cabine.position.set(-0.1, 0.92, 0);
    const vidroMat = K.mat(0x2a3a55, { roughness: 0.2 });
    const vf = K.malha(new THREE.BoxGeometry(0.06, 0.34, 0.8), vidroMat);
    vf.position.set(0.44, 0.92, 0);
    const vt = vf.clone(); vt.position.x = -0.64;
    const vl = K.malha(new THREE.BoxGeometry(0.9, 0.3, 0.92), vidroMat);
    vl.position.set(-0.1, 0.94, 0);
    g.add(base, cabine, vf, vt, vl);
    [[0.65, 0.5], [0.65, -0.5], [-0.65, 0.5], [-0.65, -0.5]].forEach(([x, z]) => {
      const roda = K.malha(new THREE.CylinderGeometry(0.22, 0.22, 0.16, 12).rotateX(Math.PI / 2), K.mat(0x222222));
      roda.position.set(x, 0.22, z);
      g.add(roda);
    });
    [0.25, -0.25].forEach((z) => {
      const farol = K.malha(new THREE.BoxGeometry(0.04, 0.1, 0.18), K.mat(0xfff2a0, { emissive: 0xfff2a0, emissiveIntensity: 0.4 }));
      farol.position.set(1.01, 0.52, z);
      g.add(farol);
    });
    K.scene.add(g);
    return g;
  };

  // Prédio com janelas. p.altura = andares * pe; frente pra +z
  K.predio = function (andares = 20, larg = 4, prof = 4, cor = 0xd9d2c5, pe = 0.9) {
    const g = new THREE.Group();
    const alt = andares * pe;
    const corpo = K.malha(new THREE.BoxGeometry(larg, alt, prof), K.mat(cor));
    corpo.position.y = alt / 2;
    const topo = K.malha(new THREE.BoxGeometry(larg + 0.2, 0.2, prof + 0.2), K.mat(0xa8a196));
    topo.position.y = alt + 0.1;
    g.add(corpo, topo);
    const jan = new THREE.BoxGeometry(0.5, 0.45, 0.06);
    const porFace = Math.floor(larg / 0.9);
    const inst = new THREE.InstancedMesh(jan, K.mat(0x5d86b0, { roughness: 0.3 }), andares * porFace * 2);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), qLado = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
    let n = 0;
    for (let a = 1; a < andares; a++) {
      for (let j = 0; j < porFace; j++) {
        const x = (j - (porFace - 1) / 2) * 0.9;
        m4.compose(new THREE.Vector3(x, a * pe + 0.45, prof / 2 + 0.02), q, new THREE.Vector3(1, 1, 1));
        inst.setMatrixAt(n++, m4);
        m4.compose(new THREE.Vector3(larg / 2 + 0.02, a * pe + 0.45, x), qLado, new THREE.Vector3(1, 1, 1));
        inst.setMatrixAt(n++, m4);
      }
    }
    inst.count = n;
    g.add(inst);
    const porta = K.malha(new THREE.BoxGeometry(1.2, 0.8, 0.06), K.mat(0x3a4a5a));
    porta.position.set(0, 0.4, prof / 2 + 0.03);
    g.add(porta);
    K.scene.add(g);
    return { g, altura: alt, corpo };
  };

  K.mosquito = function () {
    const g = new THREE.Group();
    const preto = K.mat(0x1a1a1a);
    const corpo = K.malha(new THREE.SphereGeometry(0.05, 6, 5).scale(1, 0.8, 2.2), preto, false);
    const cabeca = K.malha(new THREE.SphereGeometry(0.035, 6, 5), preto, false);
    cabeca.position.z = 0.12;
    const matAsa = new THREE.MeshBasicMaterial({ color: 0xdfefff, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
    const asas = [-1, 1].map((lado) => {
      const a = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.06).translate(lado * 0.08, 0, 0), matAsa);
      a.rotation.x = -Math.PI / 2;
      a.position.y = 0.04;
      g.add(a);
      return a;
    });
    [-1, 1].forEach((lado) => [-0.04, 0.02, 0.07].forEach((z) => {
      const p = K.malha(new THREE.CylinderGeometry(0.006, 0.006, 0.14, 3), preto, false);
      p.position.set(lado * 0.05, -0.05, z);
      p.rotation.z = lado * 0.5;
      g.add(p);
    }));
    g.add(corpo, cabeca);
    g.visible = false;
    K.scene.add(g);
    return K.componente({
      g,
      esconder() { g.visible = false; },
      em(pos, t, rumo = 0, escala = 1) {
        g.visible = true;
        g.position.set(...pos);
        g.rotation.y = rumo;
        g.scale.setScalar(escala);
        const bate = Math.sin(t * 90) * 0.6;
        asas[0].rotation.y = bate; asas[1].rotation.y = -bate;
      }
    });
  };

  K.folha = function (cor = 0x6cb548) {
    const forma = new THREE.Shape();
    forma.moveTo(0, -0.12);
    forma.quadraticCurveTo(0.09, 0, 0, 0.12);
    forma.quadraticCurveTo(-0.09, 0, 0, -0.12);
    const m = K.malha(new THREE.ShapeGeometry(forma), K.mat(cor, { side: THREE.DoubleSide }), false);
    m.visible = false;
    K.scene.add(m);
    return K.componente({ m, esconder() { m.visible = false; }, em(pos, rot) { m.visible = true; m.position.set(...pos); m.rotation.set(...rot); } });
  };

  // ---------- Tecnologia, mar e céu ----------

  // Ponto local de um objeto → coordenadas do mundo
  const vMundo = new THREE.Vector3();
  K.noMundo = function (obj, local) {
    obj.updateMatrixWorld(true);
    vMundo.set(local[0], local[1], local[2]);
    obj.localToWorld(vMundo);
    return [vMundo.x, vMundo.y, vMundo.z];
  };

  // Caminho por pontos, sem malha (pra coisas que andam sobre fios e trilhas). c.ponto(f), c.total
  K.caminho = function (pontos) {
    const segs = [];
    let total = 0;
    for (let i = 0; i + 1 < pontos.length; i++) {
      const a = pontos[i], b = pontos[i + 1];
      const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      segs.push({ a, b, L, ini: total });
      total += L;
    }
    return {
      pontos, total,
      ponto(f) {
        const d = K.clamp(f) * total;
        for (const s of segs) if (d <= s.ini + s.L + 1e-6) return K.lerp3(s.a, s.b, s.L ? (d - s.ini) / s.L : 0);
        return pontos[pontos.length - 1].slice();
      },
      // Fração do caminho em que fica a distância d
      fracao(d) { return total ? K.clamp(d / total) : 0; }
    };
  };

  // Brilho em volta de um ponto (sprite aditivo): luz, LED, sinal
  let texHalo = null;
  K.halo = function (cor = 0xfff2a0, tam = 1) {
    if (!texHalo) {
      const cv = document.createElement('canvas');
      cv.width = cv.height = 128;
      const c2 = cv.getContext('2d');
      const gr = c2.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, 'rgba(255,255,255,1)');
      gr.addColorStop(0.22, 'rgba(255,255,255,0.6)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      c2.fillStyle = gr;
      c2.fillRect(0, 0, 128, 128);
      texHalo = new THREE.CanvasTexture(cv);
    }
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texHalo, color: cor, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    s.scale.setScalar(tam);
    K.scene.add(s);
    return s;
  };

  // Tela desenhada em canvas (monitor, celular). t.desenhar((c2, w, h) => ..., chave): só redesenha quando a chave muda
  function telaCanvas(larg, alt, px = 256) {
    const cv = document.createElement('canvas');
    cv.width = px;
    cv.height = Math.round((px * alt) / larg);
    const c2 = cv.getContext('2d');
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(larg, alt), new THREE.MeshBasicMaterial({ map: tex }));
    let ultima = null;
    return {
      m, cv, c2, tex, larg, alt,
      desenhar(fn, chave) {
        if (chave != null && chave === ultima) return;
        ultima = chave;
        fn(c2, cv.width, cv.height);
        tex.needsUpdate = true;
      }
    };
  }
  K.telaCanvas = telaCanvas;

  // Computador (com mesa, se op.mesa !== false). Tela virada pra +z. c.tela.desenhar(...), c.cabo = ponto local de onde sai o fio
  K.computador = function (op = {}) {
    const g = new THREE.Group();
    const comMesa = op.mesa !== false;
    const y0 = comMesa ? 0.76 : 0;
    if (comMesa) {
      const madeira = K.mat(op.corMesa || 0xb07a48);
      const tampo = K.malha(new THREE.BoxGeometry(1.15, 0.06, 0.62), madeira);
      tampo.position.y = 0.73;
      g.add(tampo);
      [[-0.5, -0.24], [0.5, -0.24], [-0.5, 0.24], [0.5, 0.24]].forEach(([x, z]) => {
        const p = K.malha(new THREE.BoxGeometry(0.06, 0.7, 0.06), madeira);
        p.position.set(x, 0.35, z);
        g.add(p);
      });
    }
    const plast = K.mat(op.cor || 0x2b2f36, { roughness: 0.6 });
    const pe = K.malha(new THREE.BoxGeometry(0.24, 0.02, 0.16), plast);
    pe.position.set(0, y0 + 0.01, -0.14);
    const haste = K.malha(new THREE.BoxGeometry(0.05, 0.18, 0.04), plast);
    haste.position.set(0, y0 + 0.1, -0.16);
    const monitor = K.malha(new THREE.BoxGeometry(0.74, 0.5, 0.05), plast);
    monitor.position.set(0, y0 + 0.42, -0.15);
    const t = telaCanvas(0.68, 0.44, 320);
    t.m.position.set(0, y0 + 0.425, -0.122);
    const teclado = K.malha(new THREE.BoxGeometry(0.5, 0.025, 0.15), K.mat(0xe6e6e6));
    teclado.position.set(-0.04, y0 + 0.013, 0.12);
    const mouse = K.malha(new THREE.BoxGeometry(0.06, 0.03, 0.09), K.mat(0xe6e6e6));
    mouse.position.set(0.32, y0 + 0.015, 0.12);
    g.add(pe, haste, monitor, t.m, teclado, mouse);
    K.scene.add(g);
    return { g, tela: t, monitor, y0, cabo: [0, y0 + 0.25, -0.2], centro: [0, y0 + 0.425, -0.12] };
  };

  // Celular (tela pra +z)
  K.celular = function () {
    const g = new THREE.Group();
    const corpo = K.malha(new THREE.BoxGeometry(0.17, 0.32, 0.02), K.mat(0x1d1f24, { roughness: 0.4 }), false);
    const t = telaCanvas(0.152, 0.29, 160);
    t.m.position.z = 0.011;
    g.add(corpo, t.m);
    K.scene.add(g);
    return { g, tela: t };
  };

  // Navio (proa pra +x, linha d'água em y = 0). op: { cor, corCasco, comp, larg, bobina }
  K.navio = function (op = {}) {
    const { cor = 0xf2f2f2, corCasco = 0xc8322a, comp = 6, larg = 1.7, bobina = false } = op;
    const g = new THREE.Group();
    const L = comp / 2, W = larg / 2;
    const forma = new THREE.Shape();
    forma.moveTo(-L, -W); forma.lineTo(L * 0.6, -W);
    forma.quadraticCurveTo(L * 0.95, -W * 0.6, L, 0);
    forma.quadraticCurveTo(L * 0.95, W * 0.6, L * 0.6, W);
    forma.lineTo(-L, W); forma.lineTo(-L, -W);
    const casco = (alt, c, y) => {
      const geo = new THREE.ExtrudeGeometry(forma, { depth: alt, bevelEnabled: false });
      geo.rotateX(-Math.PI / 2);
      const m = K.malha(geo, K.mat(c));
      m.position.y = y;
      g.add(m);
      return m;
    };
    casco(0.6, corCasco, -0.55);
    casco(0.55, 0x1f3550, 0.05);
    const conves = K.malha(new THREE.BoxGeometry(comp * 0.98, 0.04, larg * 0.9), K.mat(0x8a6a4a));
    conves.position.set(-0.05, 0.62, 0);
    g.add(conves);
    const cabine = K.malha(new THREE.BoxGeometry(comp * 0.22, 0.9, larg * 0.8), K.mat(cor));
    cabine.position.set(-L * 0.62, 1.08, 0);
    const ponte = K.malha(new THREE.BoxGeometry(comp * 0.18, 0.45, larg * 0.7), K.mat(cor));
    ponte.position.set(-L * 0.62, 1.75, 0);
    const janelas = K.malha(new THREE.BoxGeometry(comp * 0.185, 0.14, larg * 0.72), K.mat(0x2a3a55, { roughness: 0.2 }));
    janelas.position.set(-L * 0.62, 1.8, 0);
    const chamine = K.malha(new THREE.CylinderGeometry(0.16, 0.2, 0.7, 10), K.mat(0xf5c518));
    chamine.position.set(-L * 0.82, 1.8, 0);
    const faixa = K.malha(new THREE.CylinderGeometry(0.165, 0.165, 0.14, 10), K.mat(0x1b1b1b));
    faixa.position.set(-L * 0.82, 2.05, 0);
    g.add(cabine, ponte, janelas, chamine, faixa);
    let rolo = null;
    if (bobina) {
      rolo = new THREE.Group();
      const tambor = K.malha(new THREE.CylinderGeometry(0.55, 0.55, larg * 0.6, 18).rotateX(Math.PI / 2), K.mat(0x1b1b1b));
      [-1, 1].forEach((s) => {
        const aba = K.malha(new THREE.CylinderGeometry(0.75, 0.75, 0.06, 18).rotateX(Math.PI / 2), K.mat(0xf39a1e));
        aba.position.z = s * larg * 0.31;
        rolo.add(aba);
      });
      rolo.add(tambor);
      rolo.position.set(L * 0.2, 1.4, 0);
      g.add(rolo);
      // Pórtico na popa, de onde o cabo desce
      [-1, 1].forEach((s) => {
        const perna = K.malha(new THREE.BoxGeometry(0.12, 1.3, 0.12), K.mat(0xf39a1e));
        perna.position.set(-L + 0.15, 1.25, s * W * 0.7);
        g.add(perna);
      });
      const trave = K.malha(new THREE.BoxGeometry(0.14, 0.14, larg * 0.75), K.mat(0xf39a1e));
      trave.position.set(-L + 0.15, 1.9, 0);
      g.add(trave);
    }
    K.scene.add(g);
    return { g, rolo, popa: [-L + 0.1, 1.85, 0], proa: [L, 0.6, 0] };
  };

  // Peixe (frente pra +x). em(pos, t, rumo)
  K.peixe = function (cor = 0xf7941d, tam = 1) {
    const g = new THREE.Group();
    const mat = K.mat(cor);
    const corpo = K.malha(new THREE.IcosahedronGeometry(0.22, 1), mat, false);
    corpo.scale.set(1.5, 0.85, 0.5);
    const rabo = new THREE.Group();
    rabo.position.x = -0.3;
    const nad = K.malha(new THREE.ConeGeometry(0.16, 0.26, 4), mat, false);
    nad.rotation.z = -Math.PI / 2;
    nad.scale.z = 0.3;
    nad.position.x = -0.08;
    rabo.add(nad);
    const dorsal = K.malha(new THREE.ConeGeometry(0.07, 0.16, 3), mat, false);
    dorsal.scale.z = 0.3;
    dorsal.position.set(-0.02, 0.2, 0);
    dorsal.rotation.z = 0.4;
    g.add(corpo, rabo, dorsal);
    [-1, 1].forEach((s) => {
      const olho = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({ color: 0x111111 }));
      olho.position.set(0.2, 0.05, s * 0.09);
      g.add(olho);
    });
    g.scale.setScalar(tam);
    g.visible = false;
    K.scene.add(g);
    return K.componente({
      g,
      esconder() { g.visible = false; },
      em(pos, t, rumo = 0) {
        g.visible = true;
        g.position.set(...pos);
        g.rotation.set(0, rumo, Math.sin(t * 3) * 0.05);
        rabo.rotation.y = Math.sin(t * 12) * 0.5;
      }
    });
  };

  // Tubarão (frente pra +x). em(pos, t, rumo, boca 0..1)
  K.tubarao = function () {
    const g = new THREE.Group();
    const cinza = K.mat(0x6f8291), branco = K.mat(0xe8ecef);
    const corpo = K.malha(new THREE.IcosahedronGeometry(0.5, 1), cinza, false);
    corpo.scale.set(2.3, 0.62, 0.62);
    const barriga = K.malha(new THREE.IcosahedronGeometry(0.5, 1), branco, false);
    barriga.scale.set(2.0, 0.42, 0.55);
    barriga.position.set(0.1, -0.12, 0);
    const dorsal = K.malha(new THREE.ConeGeometry(0.3, 0.7, 4), cinza, false);
    dorsal.scale.z = 0.22;
    dorsal.position.set(-0.15, 0.5, 0);
    dorsal.rotation.z = 0.45;
    const rabo = new THREE.Group();
    rabo.position.x = -1.05;
    const r1 = K.malha(new THREE.ConeGeometry(0.2, 0.9, 4), cinza, false);
    r1.scale.z = 0.2; r1.position.set(-0.2, 0.32, 0); r1.rotation.z = 0.75;
    const r2 = K.malha(new THREE.ConeGeometry(0.16, 0.55, 4), cinza, false);
    r2.scale.z = 0.2; r2.position.set(-0.12, -0.2, 0); r2.rotation.z = Math.PI - 0.8;
    rabo.add(r1, r2);
    g.add(corpo, barriga, dorsal, rabo);
    [-1, 1].forEach((s) => {
      const pei = K.malha(new THREE.ConeGeometry(0.16, 0.6, 4), cinza, false);
      pei.scale.z = 0.25;
      pei.position.set(0.25, -0.22, s * 0.3);
      pei.rotation.set(s * 1.2, 0, Math.PI - 0.9);
      const olho = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: 0x111111 }));
      olho.position.set(0.78, 0.1, s * 0.2);
      const brilho = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      brilho.position.set(0.82, 0.13, s * 0.24);
      g.add(pei, olho, brilho);
    });
    // Boca: maxilar de baixo abre pra baixo, com dentes
    const dente = new THREE.ConeGeometry(0.03, 0.08, 4);
    const matDente = K.mat(0xffffff);
    const goela = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshBasicMaterial({ color: 0x5a1a20 }));
    goela.scale.set(1, 0.5, 1.1);
    goela.position.set(0.85, -0.16, 0);
    g.add(goela);
    for (let i = 0; i < 6; i++) {
      const d = new THREE.Mesh(dente, matDente);
      const a = (i / 5 - 0.5) * 2.2;
      d.position.set(0.98 + Math.cos(a) * 0.04 - Math.abs(a) * 0.08, -0.12, Math.sin(a) * 0.17);
      d.rotation.x = Math.PI;
      g.add(d);
    }
    const maxilar = new THREE.Group();
    maxilar.position.set(0.55, -0.2, 0);
    const queixo = K.malha(new THREE.IcosahedronGeometry(0.3, 1), branco, false);
    queixo.scale.set(1.5, 0.35, 0.8);
    queixo.position.set(0.3, -0.03, 0);
    maxilar.add(queixo);
    for (let i = 0; i < 6; i++) {
      const d = new THREE.Mesh(dente, matDente);
      const a = (i / 5 - 0.5) * 2.2;
      d.position.set(0.4 + Math.cos(a) * 0.04 - Math.abs(a) * 0.08, 0.06, Math.sin(a) * 0.16);
      maxilar.add(d);
    }
    g.add(maxilar);
    g.visible = false;
    K.scene.add(g);
    return K.componente({
      g,
      esconder() { g.visible = false; },
      em(pos, t, rumo = 0, boca = 0) {
        g.visible = true;
        g.position.set(...pos);
        g.rotation.set(0, rumo, Math.sin(t * 2) * 0.04);
        rabo.rotation.y = Math.sin(t * 7) * 0.45;
        maxilar.rotation.z = -0.7 * K.clamp(boca);
      }
    });
  };

  // Coqueiro inclinado. Base em pos
  K.coqueiro = function (pos, s = 1, seed = 5) {
    const r = K.rand(seed);
    const g = new THREE.Group();
    const tronco = K.mat(0x9a6a3a);
    let x = 0, y = 0;
    const incl = 0.25 + r() * 0.2;
    for (let i = 0; i < 7; i++) {
      const seg = K.malha(new THREE.CylinderGeometry(0.11 - i * 0.006, 0.13 - i * 0.006, 0.5, 7), tronco);
      const a = incl * (i / 6);
      seg.position.set(x + Math.sin(a) * 0.25, y + Math.cos(a) * 0.25, 0);
      seg.rotation.z = -a;
      x += Math.sin(a) * 0.5; y += Math.cos(a) * 0.5;
      g.add(seg);
    }
    const copa = new THREE.Group();
    copa.position.set(x, y, 0);
    for (let i = 0; i < 8; i++) {
      const folha = K.malha(new THREE.ConeGeometry(0.16, 1.5, 4).translate(0, 0.75, 0), K.mat(i % 2 ? 0x3f8a35 : 0x5aa83f));
      folha.scale.z = 0.25;
      const pai = new THREE.Group();
      pai.rotation.y = (i / 8) * Math.PI * 2;
      folha.rotation.set(0, 0, -(1.2 + r() * 0.4));
      pai.add(folha);
      copa.add(pai);
    }
    [0, 1, 2].forEach((i) => {
      const coco = K.malha(new THREE.IcosahedronGeometry(0.09, 0), K.mat(0x6b4a24));
      coco.position.set(Math.cos(i * 2.1) * 0.12, -0.1, Math.sin(i * 2.1) * 0.12);
      copa.add(coco);
    });
    g.add(copa);
    g.position.set(...pos);
    g.scale.setScalar(s);
    g.rotation.y = r() * Math.PI * 2;
    K.scene.add(g);
    return g;
  };

  // Satélite com painéis solares
  K.satelite = function () {
    const g = new THREE.Group();
    const corpo = K.malha(new THREE.BoxGeometry(0.8, 0.8, 0.8), K.mat(0xd9a520, { metalness: 0.5, roughness: 0.35 }), false);
    g.add(corpo);
    [-1, 1].forEach((s) => {
      const braco = K.malha(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6).rotateZ(Math.PI / 2), K.mat(0xaaaaaa), false);
      braco.position.x = s * 0.65;
      const painel = K.malha(new THREE.BoxGeometry(1.8, 0.04, 0.75), K.mat(0x2a4fa8, { roughness: 0.3, metalness: 0.3 }), false);
      painel.position.x = s * 1.8;
      g.add(braco, painel);
    });
    const antena = K.malha(new THREE.ConeGeometry(0.35, 0.3, 14, 1, true), K.mat(0xeeeeee, { side: THREE.DoubleSide }), false);
    antena.position.y = -0.55;
    g.add(antena);
    K.scene.add(g);
    return g;
  };

  // Bandeira no mastro, desenhada em canvas: desenhar(c2, w, h). b.em(t) faz ela tremular
  K.bandeira = function (desenhar, op = {}) {
    const { alt = 3, larg = 1.2, altura = 0.8 } = op;
    const g = new THREE.Group();
    const mastro = K.malha(new THREE.CylinderGeometry(0.04, 0.05, alt, 8), K.mat(0xdddddd, { metalness: 0.4 }));
    mastro.position.y = alt / 2;
    g.add(mastro);
    const cv = document.createElement('canvas');
    cv.width = 240; cv.height = Math.round(240 * altura / larg);
    desenhar(cv.getContext('2d'), cv.width, cv.height);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const geo = new THREE.PlaneGeometry(larg, altura, 12, 1);
    geo.translate(larg / 2, 0, 0);
    const pano = K.malha(geo, new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.9 }), false);
    pano.position.set(0.04, alt - altura / 2 - 0.05, 0);
    g.add(pano);
    const base = geo.attributes.position.array.slice();
    K.scene.add(g);
    return {
      g,
      em(t) {
        const p = geo.attributes.position;
        for (let i = 0; i < p.count; i++) {
          const x = base[i * 3];
          p.setZ(i, Math.sin(x * 4 - t * 6) * 0.08 * (x / larg));
        }
        p.needsUpdate = true;
      }
    };
  };

  // Ondas saindo de um ponto (grito, Wi-Fi, sinal), viradas pra +x do grupo. em(origem, rumo, t, alcance, ritmo)
  K.ondas = function (cor = 0xffffff, n = 4, abertura = 0.6) {
    const g = new THREE.Group();
    const arcos = [];
    for (let i = 0; i < n; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide });
      const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.035, 5, 24, Math.PI * abertura), mat);
      m.rotation.z = -Math.PI * abertura / 2;
      const piv = new THREE.Group();
      piv.rotation.y = Math.PI / 2; // arco de frente pra +x
      piv.add(m);
      g.add(piv);
      arcos.push({ m, mat, piv });
    }
    g.visible = false;
    K.scene.add(g);
    return K.componente({
      g,
      esconder() { g.visible = false; },
      em(origem, rumo, t, alcance = 3, ritmo = 1.4) {
        g.visible = true;
        g.position.set(...origem);
        g.rotation.y = rumo;
        arcos.forEach((a, i) => {
          const k = (t * ritmo + i / n) % 1;
          const r = 0.15 + k * alcance;
          a.piv.position.x = r * 0.3;
          a.m.scale.setScalar(r);
          a.mat.opacity = 0.9 * (1 - k) * K.clamp(k * 6);
        });
      }
    });
  };

  // Bits correndo num caminho: bolinhas acesas (1) e apagadas (0), ou só luz (op.soLuz).
  // em(t, vel, ate, desde, forca): forca(f) de 0 a 1 encolhe e apaga cada bit pela posição (sinal enfraquecendo)
  K.bits = function (caminho, n = 30, seed = 21, op = {}) {
    const r = K.rand(seed);
    const tam = op.tam || 1, cor = op.cor || 0xffd60a;
    const geo = new THREE.SphereGeometry(0.06 * tam, 8, 6);
    const matUm = new THREE.MeshBasicMaterial({ color: cor }), matZero = new THREE.MeshBasicMaterial({ color: 0x3a3f48 });
    const g = new THREE.Group();
    const bs = [];
    for (let i = 0; i < n; i++) {
      const um = op.soLuz || r() < 0.55;
      const m = new THREE.Mesh(geo, um ? matUm : matZero);
      g.add(m);
      let h = null;
      if (um) { h = K.halo(cor, 0.42 * tam); g.add(h); }
      bs.push({ m, h, um });
    }
    g.visible = false;
    K.scene.add(g);
    const c = K.componente({
      g, caminho,
      esconder() { g.visible = false; },
      em(t, vel = 0.5, ate = 1, desde = 0, forca = null) {
        g.visible = true;
        bs.forEach((b, i) => {
          const f = ((i / n) + t * vel) % 1;
          const k = forca ? K.clamp(forca(f)) : 1;
          const vis = f <= ate && f >= desde && k > 0.02;
          b.m.visible = vis;
          const p = c.caminho.ponto(f);
          b.m.position.set(...p);
          b.m.scale.setScalar(0.4 + 0.6 * k);
          if (b.h) {
            b.h.visible = vis;
            b.h.position.set(...p);
            b.h.material.opacity = k;
            b.h.scale.setScalar(0.42 * tam * (0.3 + 0.7 * k));
          }
        });
      }
    });
    return c;
  };

  // ---------- Energia, fogo e fumaça ----------

  // Bicicleta (frente pra +z). b.selim = onde o quadril do boneco senta; b.em(t, vel) gira rodas e pedais
  K.bicicleta = function (cor = 0x2f7fe0) {
    const g = new THREE.Group();
    const quadro = K.mat(cor, { roughness: 0.5 });
    const preto = K.mat(0x1b1b1b), metal = K.mat(0xb8bec4, { roughness: 0.3, metalness: 0.5 });
    const R = 0.32;
    const tubo = (a, b, raio = 0.028, mat = quadro) => {
      const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
      const m = K.malha(new THREE.CylinderGeometry(raio, raio, va.distanceTo(vb), 7), mat);
      m.position.copy(va).add(vb).multiplyScalar(0.5);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.sub(va).normalize());
      g.add(m);
      return m;
    };
    const roda = (z) => {
      const r = new THREE.Group();
      r.add(K.malha(new THREE.TorusGeometry(R, 0.035, 6, 24).rotateY(Math.PI / 2), preto));
      for (let i = 0; i < 6; i++) {
        const raio = K.malha(new THREE.BoxGeometry(0.008, R * 2, 0.008), metal, false);
        raio.rotation.x = (i / 6) * Math.PI;
        r.add(raio);
      }
      r.position.set(0, R, z);
      g.add(r);
      return r;
    };
    const tras = roda(-0.52), frente = roda(0.52);
    const mov = [0, 0.36, 0], selim = [0, 0.84, -0.14], cabeca = [0, 0.86, 0.4];
    tubo(mov, selim); tubo(selim, cabeca); tubo(mov, cabeca);
    tubo(mov, [0, R, -0.52], 0.022); tubo(selim, [0, R, -0.52], 0.022);
    tubo(cabeca, [0, R, 0.52], 0.026);
    tubo(cabeca, [0, 1.0, 0.36], 0.024, metal);
    const guidao = K.malha(new THREE.CylinderGeometry(0.02, 0.02, 0.52, 7).rotateZ(Math.PI / 2), metal);
    guidao.position.set(0, 1.0, 0.36);
    const banco = K.malha(new THREE.BoxGeometry(0.13, 0.05, 0.24), preto);
    banco.position.set(0, 0.87, -0.15);
    g.add(guidao, banco);
    const pedal = new THREE.Group();
    pedal.position.set(...mov);
    [-1, 1].forEach((s) => {
      const biela = K.malha(new THREE.BoxGeometry(0.02, 0.17, 0.03).translate(0, s * 0.085, 0), metal);
      biela.position.x = s * 0.07;
      const pe = K.malha(new THREE.BoxGeometry(0.1, 0.025, 0.06), preto);
      pe.position.set(s * 0.11, s * 0.17, 0);
      pedal.add(biela, pe);
    });
    g.add(pedal);
    K.scene.add(g);
    return {
      g, tras, frente, pedal, selim: [0, 0.89, -0.15], guidao: [0, 1.0, 0.36],
      em(t, vel = 1) {
        tras.rotation.x = frente.rotation.x = t * vel * 9;
        pedal.rotation.x = t * vel * 6;
      }
    };
  };

  // Fogo: chamas em cone que tremem. em(pos, t, escala, força 0 a 1)
  K.fogo = function (seed = 14, n = 9) {
    const r = K.rand(seed);
    const g = new THREE.Group();
    const cores = [0xff5a1f, 0xff8a1f, 0xffc21f, 0xffe066];
    const chamas = [];
    for (let i = 0; i < n; i++) {
      const camada = i % 3;
      const m = new THREE.Mesh(new THREE.ConeGeometry(0.22 - camada * 0.05, 1, 6).translate(0, 0.5, 0),
        new THREE.MeshBasicMaterial({ color: cores[Math.min(3, camada + (i % 2))] }));
      const a = r() * Math.PI * 2, d = camada === 2 ? 0.05 : 0.15 + r() * 0.25;
      chamas.push({ m, x: Math.cos(a) * d, z: Math.sin(a) * d, alt: 0.55 + (2 - camada) * 0.25 + r() * 0.3, f: 6 + r() * 7, fase: r() * 6 });
      g.add(m);
    }
    const halo = K.halo(0xff9a3a, 2.6);
    halo.position.y = 0.45;
    g.add(halo);
    g.visible = false;
    K.scene.add(g);
    return K.componente({
      g,
      esconder() { g.visible = false; },
      em(pos, t, escala = 1, forca = 1) {
        if (forca <= 0.01) return;
        g.visible = true;
        g.position.set(...pos);
        g.scale.setScalar(escala);
        chamas.forEach((c) => {
          const s = forca * (0.75 + 0.25 * Math.sin(t * c.f + c.fase) + 0.1 * Math.sin(t * c.f * 2.3));
          c.m.scale.set(0.8 + 0.2 * forca, c.alt * s, 0.8 + 0.2 * forca);
          c.m.position.set(c.x, 0, c.z);
          c.m.rotation.set(Math.sin(t * 5 + c.fase) * 0.12, 0, Math.cos(t * 4 + c.fase) * 0.12);
        });
        halo.material.opacity = 0.7 * forca * (0.85 + 0.15 * Math.sin(t * 17));
      }
    });
  };

  // Fumaça ou vapor subindo de um ponto. em(origem, t, op): op = { altura, escala, vento: [x, z], ritmo, forca }
  K.fumaca = function (seed = 15, cor = 0x2a2a2a, n = 18) {
    const r = K.rand(seed);
    const geo = new THREE.IcosahedronGeometry(1, 1);
    const g = new THREE.Group();
    const ps = [];
    for (let i = 0; i < n; i++) {
      const mat = K.mat(cor, { transparent: true, opacity: 0.9, depthWrite: false, roughness: 1 });
      const m = K.malha(geo, mat, false);
      g.add(m);
      ps.push({ m, mat, fase: i / n, dx: (r() - 0.5), dz: (r() - 0.5), s: 0.7 + r() * 0.6, giro: r() * 3 });
    }
    g.visible = false;
    K.scene.add(g);
    return K.componente({
      g,
      esconder() { g.visible = false; },
      em(origem, t, op = {}) {
        const { altura = 4, escala = 1, vento = [0.6, 0], ritmo = 0.35, forca = 1 } = op;
        if (forca <= 0.01) return;
        g.visible = true;
        ps.forEach((p) => {
          const k = (t * ritmo + p.fase) % 1;
          const sobe = k * altura;
          p.m.position.set(origem[0] + p.dx * 0.4 * escala + vento[0] * sobe, origem[1] + sobe, origem[2] + p.dz * 0.4 * escala + vento[1] * sobe);
          p.m.scale.setScalar(escala * p.s * (0.35 + k * 1.3) * forca);
          p.m.rotation.set(p.giro + t * 0.3, p.giro, 0);
          p.mat.opacity = 0.9 * K.clamp(k * 8) * Math.pow(1 - k, 1.2) * forca;
        });
      }
    });
  };

  // ---------- Espaço ----------

  // Cilindro de raio 1 e altura 1 (base em y = 0) esticado entre dois pontos. Pra hastes, cabos e pernas que mudam
  const vA = new THREE.Vector3(), vB = new THREE.Vector3(), CIMA = new THREE.Vector3(0, 1, 0);
  K.ligarPontos = function (m, a, b, raio) {
    vA.set(...a); vB.set(...b);
    m.position.copy(vA);
    const L = vA.distanceTo(vB);
    m.quaternion.setFromUnitVectors(CIMA, vB.sub(vA).normalize());
    m.scale.set(raio, Math.max(0.001, L), raio);
  };
  const geoHaste = new THREE.CylinderGeometry(1, 1, 1, 6).translate(0, 0.5, 0);

  // Foguete de 3 estágios (estilo Saturno V), base em y = 0 e ~14,4 de altura. Cada peça é um grupo em f.partes
  // (e1, e2, e3, sla, sm, cm, torre), posto na altura f.base[nome]; a cena move ou solta as peças e chama f.reset()
  // pra empilhar de novo. f.corte(true) tira a metade da frente do casco e mostra os tanques (laranja = combustível,
  // azul = oxigênio líquido) e o módulo lunar guardado no sla. f.nivel(nome, k): líquido dos tanques (1 = cheio).
  // f.bocal[nome]: saída do jato, no espaço da peça
  K.foguete = function () {
    const g = new THREE.Group();
    const lados = { side: THREE.DoubleSide };
    const branco = K.mat(0xf4f3ee, { roughness: 0.6, ...lados }), preto = K.mat(0x1d1f24, lados);
    const prata = K.mat(0xc9ced6, { metalness: 0.45, roughness: 0.35, ...lados }), escuro = K.mat(0x3a3f48, { metalness: 0.3, roughness: 0.5, ...lados });
    const matComb = K.mat(0xf39a1e, { roughness: 0.4 }), matOx = K.mat(0x8fd4ff, { roughness: 0.25, emissive: 0x2a7fd0, emissiveIntensity: 0.3 });
    const frentes = [], tanques = {};
    const parte = (nome, base) => { const p = new THREE.Group(); p.position.y = base; g.add(p); tanques[nome] = []; return p; };
    // Casco em duas metades (frente e trás), pra abrir em corte
    const casco = (pai, rBaixo, rCima, y0, y1, mat) => {
      [[-Math.PI / 2, true], [Math.PI / 2, false]].forEach(([th, frente]) => {
        const m = K.malha(new THREE.CylinderGeometry(rCima, rBaixo, y1 - y0, 26, 1, true, th, Math.PI), mat);
        m.position.y = (y0 + y1) / 2;
        pai.add(m);
        if (frente) frentes.push(m);
      });
    };
    const tampa = (pai, r, y, mat = escuro) => {
      const m = K.malha(new THREE.CircleGeometry(r, 24).rotateX(-Math.PI / 2), mat);
      m.position.y = y;
      pai.add(m);
    };
    const tanque = (nome, pai, r, y0, y1, mat) => {
      const m = K.malha(new THREE.CylinderGeometry(r, r, 1, 20).translate(0, 0.5, 0), mat, false);
      m.position.y = y0;
      m.scale.y = y1 - y0;
      m.userData.h = y1 - y0;
      pai.add(m);
      tanques[nome].push(m);
    };
    const bocais = (pai, n, rT, rB, h, y, d) => {
      for (let i = 0; i < n; i++) {
        const a = (i / Math.max(1, n - 1)) * Math.PI * 2;
        const b = K.malha(new THREE.CylinderGeometry(rT, rB, h, 12, 1, true), escuro);
        b.position.set(i === n - 1 && n > 1 ? 0 : Math.cos(a) * d, y - h / 2, i === n - 1 && n > 1 ? 0 : Math.sin(a) * d);
        pai.add(b);
      }
    };

    // 1º estágio: 5 motores, aletas e o xadrez preto e branco
    const e1 = parte('e1', 0);
    casco(e1, 0.9, 0.9, 0, 5.0, branco);
    [0, 1, 2, 3].forEach((i) => {
      const th = i * Math.PI / 2 + Math.PI / 8;
      const faixa = K.malha(new THREE.CylinderGeometry(0.905, 0.905, 1.3, 8, 1, true, th, Math.PI / 4), preto);
      faixa.position.y = 1.05;
      const topo = K.malha(new THREE.CylinderGeometry(0.905, 0.905, 0.5, 8, 1, true, th + Math.PI / 4, Math.PI / 4), preto);
      topo.position.y = 4.55;
      e1.add(faixa, topo);
      [th + Math.PI / 8, th + Math.PI / 2 - Math.PI / 8].forEach((c, k) => { if (Math.cos(c) > 0) frentes.push(k ? topo : faixa); });
      const a = i * Math.PI / 2 + Math.PI / 4;
      const aleta = K.malha(new THREE.BoxGeometry(0.06, 1.2, 0.6), escuro);
      aleta.position.set(Math.cos(a) * 1.15, 0.45, Math.sin(a) * 1.15);
      aleta.rotation.y = -a + Math.PI / 2;
      e1.add(aleta);
    });
    tampa(e1, 0.9, 0.02);
    tampa(e1, 0.9, 5.0);
    tanque('e1', e1, 0.78, 0.3, 2.3, matComb);
    tanque('e1', e1, 0.78, 2.5, 4.4, matOx);
    bocais(e1, 5, 0.13, 0.3, 0.7, 0, 0.48);

    // 2º estágio: anel preto embaixo
    const e2 = parte('e2', 5.0);
    casco(e2, 0.905, 0.905, 0, 0.35, preto);
    casco(e2, 0.9, 0.9, 0.35, 3.4, branco);
    tampa(e2, 0.9, 0.01);
    tampa(e2, 0.9, 3.4);
    tanque('e2', e2, 0.78, 0.5, 1.6, matOx);
    tanque('e2', e2, 0.78, 1.75, 3.2, matComb);
    bocais(e2, 5, 0.09, 0.2, 0.42, 0, 0.36);

    // 3º estágio: afina, um motor só
    const e3 = parte('e3', 8.4);
    casco(e3, 0.9, 0.62, 0, 0.6, branco);
    casco(e3, 0.625, 0.625, 0.6, 0.9, preto);
    casco(e3, 0.62, 0.62, 0.9, 2.2, branco);
    tampa(e3, 0.9, 0.01);
    tampa(e3, 0.62, 2.2);
    tanque('e3', e3, 0.54, 0.95, 1.45, matOx);
    tanque('e3', e3, 0.54, 1.55, 2.1, matComb);
    bocais(e3, 1, 0.09, 0.22, 0.4, 0, 0);

    // Adaptador com o módulo lunar guardado dentro
    const sla = parte('sla', 10.6);
    casco(sla, 0.62, 0.5, 0, 1.0, prata);
    const lm = new THREE.Group();
    const ouro = K.mat(0xd9a520, { metalness: 0.6, roughness: 0.35 });
    const lmCorpo = K.malha(new THREE.CylinderGeometry(0.32, 0.32, 0.3, 8), ouro);
    lmCorpo.position.y = 0.3;
    const lmCab = K.malha(new THREE.BoxGeometry(0.4, 0.28, 0.34), prata);
    lmCab.position.y = 0.6;
    lm.add(lmCorpo, lmCab);
    sla.add(lm);

    // Módulo de serviço, cápsula e torre de escape
    const sm = parte('sm', 11.6);
    casco(sm, 0.5, 0.5, 0, 0.8, prata);
    tampa(sm, 0.5, 0.01);
    tampa(sm, 0.5, 0.8);
    bocais(sm, 1, 0.08, 0.2, 0.4, 0, 0);
    [0, 1, 2, 3].forEach((i) => {
      const rcs = K.malha(new THREE.BoxGeometry(0.1, 0.16, 0.1), escuro);
      const a = i * Math.PI / 2;
      rcs.position.set(Math.cos(a) * 0.52, 0.55, Math.sin(a) * 0.52);
      sm.add(rcs);
    });
    const cm = parte('cm', 12.4);
    casco(cm, 0.5, 0.1, 0, 0.75, K.mat(0xe9ebee, { metalness: 0.3, roughness: 0.4, ...lados }));
    tampa(cm, 0.1, 0.75, prata);
    const janela = K.malha(new THREE.BoxGeometry(0.12, 0.1, 0.02), K.mat(0x1b2433, { roughness: 0.2 }));
    janela.position.set(0, 0.4, 0.32);
    janela.rotation.x = -0.5;
    cm.add(janela);
    const torre = parte('torre', 13.15);
    [0, 1, 2, 3].forEach((i) => {
      const a = i * Math.PI / 2 + Math.PI / 4;
      const h = K.malha(geoHaste, K.mat(0xd0342c));
      K.ligarPontos(h, [Math.cos(a) * 0.22, -0.4, Math.sin(a) * 0.22], [0, 0.45, 0], 0.018);
      torre.add(h);
    });
    const motor = K.malha(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 10), K.mat(0xe9ebee));
    motor.position.y = 0.72;
    const bico = K.malha(new THREE.ConeGeometry(0.08, 0.22, 10), K.mat(0xd0342c));
    bico.position.y = 1.13;
    torre.add(motor, bico);

    K.scene.add(g);
    const partes = { e1, e2, e3, sla, sm, cm, torre };
    const base = { e1: 0, e2: 5.0, e3: 8.4, sla: 10.6, sm: 11.6, cm: 12.4, torre: 13.15 };
    const f = {
      g, partes, base, lm, altura: 14.4, raio: 0.9,
      bocal: { e1: [0, -0.75, 0], e2: [0, -0.45, 0], e3: [0, -0.42, 0], sm: [0, -0.42, 0] },
      corte(on) { frentes.forEach((m) => { m.visible = !on; }); lm.visible = !!on; },
      nivel(nome, k) { tanques[nome].forEach((m) => { m.scale.y = Math.max(0.001, m.userData.h * K.clamp(k)); m.visible = k > 0.005; }); },
      reset() {
        Object.keys(partes).forEach((n) => {
          partes[n].position.set(0, base[n], 0);
          partes[n].rotation.set(0, 0, 0);
          partes[n].visible = true;
          f.nivel(n, 1);
        });
        f.corte(false);
      }
    };
    f.reset();
    return f;
  };

  // Jato de foguete: chama em cone apontando pra −y do grupo, tremendo. em(pos, t, op): op = { comp, larg, forca, quat }
  K.jatoFoguete = function (seed = 31) {
    const r = K.rand(seed);
    const g = new THREE.Group();
    const camadas = [[0xff6a1a, 0.42, 1.0, 0.8], [0xffc21f, 0.3, 0.74, 0.9], [0xfff6d6, 0.17, 0.45, 1]].map(([cor, raio, alt, op]) => {
      const m = new THREE.Mesh(new THREE.ConeGeometry(raio, 1, 14, 1, true).rotateX(Math.PI).translate(0, -0.5, 0),
        new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide }));
      g.add(m);
      return { m, alt, fase: r() * 6 };
    });
    const halo = K.halo(0xffa040, 3);
    g.add(halo);
    g.visible = false;
    K.scene.add(g);
    return K.componente({
      g,
      esconder() { g.visible = false; },
      em(pos, t, op = {}) {
        const { comp = 3, larg = 1, forca = 1, quat = null } = op;
        if (forca <= 0.01) return;
        g.visible = true;
        g.position.set(...pos);
        if (quat) g.quaternion.copy(quat); else g.quaternion.identity();
        camadas.forEach((c, i) => {
          const f = forca * (0.86 + 0.14 * Math.sin(t * (41 + i * 13) + c.fase) * Math.sin(t * 17 + i));
          const w = larg * (0.6 + 0.4 * forca);
          c.m.scale.set(w, Math.max(0.01, comp * c.alt * f), w);
        });
        halo.position.y = -0.25 * comp * forca;
        halo.scale.setScalar((1.6 + 1.2 * larg) * forca);
        halo.material.opacity = 0.85 * forca;
      }
    });
  };

  // Terra ou Lua low-poly, com cor por face (sem neblina: dá pra pôr bem longe, no céu). tipo: 'terra' | 'lua'
  K.planeta = function (tipo = 'terra', raio = 1, seed = 3) {
    const r = K.rand(seed);
    const geo = new THREE.IcosahedronGeometry(1, tipo === 'terra' ? 4 : 3);
    const pos = geo.attributes.position, cores = [];
    const fs = [r() * 6, r() * 6, r() * 6, r() * 6];
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i += 3) {
      let x = 0, y = 0, z = 0;
      for (let k = 0; k < 3; k++) { x += pos.getX(i + k) / 3; y += pos.getY(i + k) / 3; z += pos.getZ(i + k) / 3; }
      const n = Math.sin(x * 3.1 + fs[0]) * Math.cos(y * 2.7 + fs[1]) + 0.6 * Math.sin(z * 4.3 + fs[2] + x * 2) + 0.35 * Math.sin((x + y + z) * 7 + fs[3]);
      if (tipo === 'terra') {
        if (Math.abs(y) > 0.88) c.setHex(0xf2f6fa);
        else if (n > 0.3) c.setHex(n > 1.05 ? 0xc9a46a : n > 0.65 ? 0x5aa83f : 0x3f8a35);
        else c.setHex(n < -0.7 ? 0x1f63b8 : 0x2f7fd8);
      } else c.setHex(n > 0.8 ? 0x6c6c72 : n > 0.45 ? 0x87878d : n < -1 ? 0xcfcfd3 : 0xacacb1);
      for (let k = 0; k < 3; k++) cores.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cores, 3));
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.9, fog: false }));
    m.scale.setScalar(raio);
    m.receiveShadow = true;
    const g = new THREE.Group();
    g.add(m);
    if (tipo === 'terra') {
      const ar = K.halo(0x6fb8ff, raio * 2.7);
      ar.material.opacity = 0.6;
      ar.material.fog = false;
      g.add(ar);
    }
    K.scene.add(g);
    return { g, malha: m, raio };
  };

  // Módulo lunar: descida dourada com 4 pernas e subida prateada (a cabine) em cima. Pé das pernas em y = 0.
  // m.amortecer(k): as pernas encolhem no pouso (0 a 1). m.bocalDescida e m.bocalSubida: saída dos jatos (local de m.g / m.subida)
  K.moduloLunar = function () {
    const g = new THREE.Group();
    const ouro = K.mat(0xd9a520, { metalness: 0.6, roughness: 0.35 }), prata = K.mat(0xc9ced6, { metalness: 0.4, roughness: 0.4 });
    const escuro = K.mat(0x2b2f36, { side: THREE.DoubleSide });
    const descida = new THREE.Group(), corpo = new THREE.Group();
    g.add(descida);
    descida.add(corpo);
    const caixa = K.malha(new THREE.CylinderGeometry(0.8, 0.8, 0.72, 8), ouro);
    caixa.position.y = 1.25;
    caixa.rotation.y = Math.PI / 8;
    const bocal = K.malha(new THREE.CylinderGeometry(0.14, 0.32, 0.42, 12, 1, true), escuro);
    bocal.position.y = 0.7;
    corpo.add(caixa, bocal);
    const pernas = [0, 1, 2, 3].map((i) => {
      const a = i * Math.PI / 2 + Math.PI / 4, dx = Math.cos(a), dz = Math.sin(a);
      const pata = K.malha(new THREE.CylinderGeometry(0.2, 0.23, 0.05, 10), prata);
      pata.position.set(dx * 1.38, 0.025, dz * 1.38);
      const perna = K.malha(geoHaste, prata), escora = K.malha(geoHaste, prata);
      descida.add(pata, perna, escora);
      return { dx, dz, perna, escora };
    });
    const subida = new THREE.Group();
    subida.position.y = 1.61;
    corpo.add(subida);
    const cab = K.malha(new THREE.BoxGeometry(1.0, 0.72, 0.9), prata);
    cab.position.y = 0.4;
    const nariz = K.malha(new THREE.CylinderGeometry(0.42, 0.46, 0.5, 6).rotateX(Math.PI / 2), prata);
    nariz.position.set(0, 0.42, 0.45);
    const tanqueL = K.malha(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 10).rotateZ(Math.PI / 2), ouro);
    tanqueL.position.set(0.62, 0.3, 0);
    const vidro = K.mat(0x1b2433, { roughness: 0.15 });
    [-1, 1].forEach((s) => {
      const j = K.malha(new THREE.BoxGeometry(0.2, 0.18, 0.04), vidro);
      j.position.set(s * 0.17, 0.55, 0.69);
      j.rotation.z = s * 0.35;
      subida.add(j);
    });
    const porta = K.malha(new THREE.BoxGeometry(0.3, 0.3, 0.04), K.mat(0x8a9099));
    porta.position.set(0, 0.17, 0.7);
    const haste = K.malha(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 5), prata);
    haste.position.set(-0.35, 0.95, -0.2);
    const prato = K.malha(new THREE.ConeGeometry(0.2, 0.12, 12, 1, true).rotateX(Math.PI), K.mat(0xeeeeee, { side: THREE.DoubleSide }));
    prato.position.set(-0.35, 1.18, -0.2);
    prato.rotation.z = 0.6;
    subida.add(cab, nariz, tanqueL, porta, haste, prato);
    [[0.52, 0.45], [-0.52, 0.45], [0.52, -0.45], [-0.52, -0.45]].forEach(([x, z]) => {
      const rcs = K.malha(new THREE.BoxGeometry(0.1, 0.1, 0.1), escuro);
      rcs.position.set(x, 0.72, z);
      subida.add(rcs);
    });
    const m = {
      g, descida, subida, corpo, bocalDescida: [0, 0.48, 0], bocalSubida: [0, -0.02, 0],
      amortecer(k) {
        const dy = -0.18 * K.clamp(k);
        corpo.position.y = dy;
        pernas.forEach((p) => {
          K.ligarPontos(p.perna, [p.dx * 1.38, 0.05, p.dz * 1.38], [p.dx * 0.74, 1.42 + dy, p.dz * 0.74], 0.035);
          K.ligarPontos(p.escora, [p.dx * 1.12, 0.5, p.dz * 1.12], [p.dx * 0.62, 0.95 + dy, p.dz * 0.62], 0.025);
        });
      }
    };
    m.amortecer(0);
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    K.scene.add(g);
    return m;
  };

  // Cápsula de volta (cone), base em y = 0. c.escudo: a camada marrom embaixo (escudo térmico), c.matCorpo pra esquentar
  K.capsula = function () {
    const g = new THREE.Group();
    const matCorpo = K.mat(0xd3d7dd, { metalness: 0.5, roughness: 0.35 });
    const corpo = K.malha(new THREE.CylinderGeometry(0.16, 0.9, 1.1, 22), matCorpo);
    corpo.position.y = 0.55;
    const ponta = K.malha(new THREE.CylinderGeometry(0.1, 0.16, 0.18, 12), K.mat(0x9aa0a8));
    ponta.position.y = 1.19;
    const janela = K.malha(new THREE.BoxGeometry(0.2, 0.16, 0.04), K.mat(0x1b2433, { roughness: 0.15 }));
    janela.position.set(0, 0.62, 0.5);
    janela.rotation.x = -0.62;
    const fundo = K.malha(new THREE.CircleGeometry(0.9, 22).rotateX(Math.PI / 2), K.mat(0xaab0b8));
    const R = 0.92 / Math.sin(0.64);
    const escudo = K.malha(new THREE.SphereGeometry(R, 24, 5, 0, Math.PI * 2, Math.PI - 0.64, 0.64), K.mat(0x7a4a2a, { roughness: 0.95 }));
    escudo.position.y = -0.3 + R;
    g.add(corpo, ponta, janela, fundo, escudo);
    K.scene.add(g);
    return { g, escudo, matCorpo, janela };
  };

  // Paraquedas: cúpula em faixas e cordas até o ponto de baixo (y = 0 do grupo). p.abrir(k, t, murcho)
  K.paraquedas = function (cor = 0xf39a1e, cor2 = 0xffffff, alt = 2.6, raio = 1.5) {
    const g = new THREE.Group();
    const geo = new THREE.SphereGeometry(1, 16, 6, 0, Math.PI * 2, 0, Math.PI * 0.42).toNonIndexed();
    const pos = geo.attributes.position, cores = [];
    const ca = new THREE.Color(cor), cb = new THREE.Color(cor2);
    for (let i = 0; i < pos.count; i += 3) {
      const y = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3;
      const faixa = Math.floor(Math.acos(K.clamp(y, -1, 1)) / (Math.PI * 0.07)) % 2;
      const c = faixa ? ca : cb;
      for (let k = 0; k < 3; k++) cores.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cores, 3));
    const cupula = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide, roughness: 0.8 }));
    cupula.castShadow = true;
    const borda = Math.cos(Math.PI * 0.42);
    g.add(cupula);
    const matCorda = K.mat(0xeeeeee);
    const cordas = [];
    for (let i = 0; i < 8; i++) { const c = K.malha(geoHaste, matCorda, false); g.add(c); cordas.push((i / 8) * Math.PI * 2); }
    K.scene.add(g);
    return {
      g,
      abrir(k, t = 0, murcho = false) {
        const s = (0.12 + 0.88 * K.clamp(k)) * raio;
        const sy = raio * (murcho ? 0.35 + 0.12 * Math.sin(t * 9) : 0.55 + 0.45 * K.clamp(k));
        const larg = murcho ? s * (0.45 + 0.1 * Math.sin(t * 7)) : s;
        cupula.scale.set(larg, sy, larg);
        cupula.position.y = alt - borda * sy;
        cupula.rotation.z = murcho ? 0.25 * Math.sin(t * 5) : 0;
        g.children.slice(1).forEach((c, i) => {
          const a = cordas[i], rb = Math.sin(Math.PI * 0.42) * larg;
          K.ligarPontos(c, [0, 0, 0], [Math.cos(a) * rb, alt, Math.sin(a) * rb], 0.012);
        });
      }
    };
  };

  // Balão de aniversário com cordinha (bico pra baixo). Origem no nó
  K.balao = function (cor = 0xe8352b) {
    const g = new THREE.Group();
    const mat = K.mat(cor, { roughness: 0.3 });
    const bola = K.malha(new THREE.SphereGeometry(0.22, 14, 10), mat);
    bola.scale.set(1, 1.2, 1);
    bola.position.y = 0.28;
    const no = K.malha(new THREE.ConeGeometry(0.04, 0.07, 8), mat);
    no.position.y = 0.02;
    const fio = K.malha(new THREE.CylinderGeometry(0.004, 0.004, 0.5, 4), K.mat(0xffffff), false);
    fio.position.y = -0.25;
    g.add(bola, no, fio);
    K.scene.add(g);
    return g;
  };

  // ---------- Boneco ----------

  // Todos os personagens da cena: o kit volta cada um ao neutro no começo do quadro (b.reset) e a revisão confere
  K.bonecos = [];

  // As cores do doutor e do operário (op.cores troca qualquer uma)
  const CORES_DOUTOR = { jaleco: 0xf4f7f6, camisa: 0x12355b, gravata: 0x2ec4b6, calca: 0x6b7280, sapato: 0x6b3f22, cabelo: 0xececec };
  const CORES_OPERARIO = { camiseta: 0xf27c22, calca: 0x31577e, bota: 0x2a221c, colete: 0xf5d20a, faixa: 0xdfe6e8, capacete: 0xf5c518, pele: 0xc98f62, cabelo: 0x2b1b16, barba: 0x2b1b16 };
  // op.tipo: 'menino' (padrão, mascote) | 'menina' (vestido vermelho) | 'doutor' (médico velhinho: jaleco, óculos, bigode
  // branco e estetoscópio) | 'operario' (adulto de obra: camiseta laranja, colete refletivo, calça jeans, bota, barba e o
  // capacete sempre na cabeça; op.barba: false tira a barba). Cores próprias em op.cores, como nos outros
  // op.roupa: 'moletom' = roupa do logo (moletom amarelo com capuz, mochila, calça azul-noite, tênis branco)
  K.boneco = function (op = {}) {
    const menina = op.tipo === 'menina';
    const doutor = op.tipo === 'doutor', operario = op.tipo === 'operario';
    const moletom = !menina && !doutor && !operario && op.roupa === 'moletom';
    const c = Object.assign({}, K.cores, doutor ? CORES_DOUTOR : operario ? CORES_OPERARIO : {}, op.cores || {});
    const corRoupa = menina ? c.vestido : moletom ? c.moletom : doutor ? c.camisa : c.camiseta;
    const matRoupa = K.mat(corRoupa);
    const matJaleco = doutor ? K.mat(c.jaleco, { side: THREE.DoubleSide }) : null;
    const corCabelo = menina ? c.cabeloMenina : c.cabelo;
    const g = new THREE.Group();
    const corpo = new THREE.Group();
    g.add(corpo);
    const pele = K.mat(c.pele);

    const pernas = [-1, 1].map((lado) => {
      const quadril = new THREE.Group();
      quadril.position.set(lado * 0.09, 0.62, 0);
      const comp = menina ? 0.5 : 0.34;
      const calca = moletom || doutor || operario;
      const perna = calca
        ? K.malha(new THREE.CylinderGeometry(0.1, 0.085, 0.6, 8), K.mat(c.calca))
        : K.malha(K.redondo ? new THREE.CapsuleGeometry(0.062, comp - 0.06, 6, 20) : new THREE.CylinderGeometry(0.065, 0.06, comp, 7), pele);
      perna.position.y = calca ? -0.26 : -0.54 + comp / 2;
      // Redondo: tênis de bico redondo (cápsula deitada e achatada) no lugar da caixa
      const geoTenis = K.redondo ? new THREE.CapsuleGeometry(0.075, 0.1, 8, 20).rotateX(Math.PI / 2).scale(1, 0.55, 1) : new THREE.BoxGeometry(0.15, 0.08, 0.24);
      const tenis = K.malha(geoTenis, K.mat(doutor ? c.sapato : operario ? c.bota : menina || moletom ? c.tenisBranco : c.tenis));
      tenis.position.set(0, K.redondo ? -0.565 : -0.58, 0.03);
      quadril.add(perna, tenis);
      if (moletom) {
        const sola = K.malha(K.redondo ? new THREE.CapsuleGeometry(0.08, 0.1, 6, 20).rotateX(Math.PI / 2).scale(1, 0.2, 1) : new THREE.BoxGeometry(0.16, 0.03, 0.25), K.mat(c.sola));
        sola.position.set(0, K.redondo ? -0.6 : -0.615, 0.03);
        quadril.add(sola);
      } else if (!menina && !doutor && !operario) {
        const bermuda = K.malha(new THREE.CylinderGeometry(0.11, 0.1, 0.24, 8), K.mat(c.bermuda));
        bermuda.position.set(lado * 0.005, -0.12, 0);
        quadril.add(bermuda);
      }
      if (operario) {
        // Cano da bota por cima da calça
        const cano = K.malha(new THREE.CylinderGeometry(0.097, 0.1, 0.18, 10), K.mat(c.bota));
        cano.position.set(0, -0.48, 0.005);
        quadril.add(cano);
      }
      corpo.add(quadril);
      return { quadril, lado };
    });
    if (menina) {
      const saia = K.malha(new THREE.CylinderGeometry(0.2, 0.36, 0.44, 12), K.mat(corRoupa));
      saia.position.y = 0.56;
      corpo.add(saia);
    }

    const tronco = K.malha(new THREE.SphereGeometry(0.26, 10, 8), matRoupa);
    tronco.scale.set(menina ? 0.9 : 1, 1.25, 0.85);
    tronco.position.y = 0.8;
    corpo.add(tronco);
    let mochila = null;
    if (moletom) {
      // Capuz caído nas costas, cordinhas, bolso canguru e mochila com alças
      const capuz = K.malha(new THREE.TorusGeometry(0.15, 0.075, 6, 14), matRoupa);
      capuz.rotation.x = Math.PI / 2 - 0.5;
      capuz.position.set(0, 1.07, -0.07);
      const bolso = K.malha(new THREE.BoxGeometry(0.3, 0.13, 0.06), K.mat(c.punho));
      bolso.position.set(0, 0.64, 0.2);
      bolso.rotation.x = -0.25;
      corpo.add(capuz, bolso);
      [-1, 1].forEach((lado) => {
        const cordao = K.malha(new THREE.CylinderGeometry(0.01, 0.01, 0.16, 4), K.mat(0xffffff), false);
        cordao.position.set(lado * 0.05, 0.95, 0.205);
        cordao.rotation.x = -0.35;
        const alca = K.malha(new THREE.BoxGeometry(0.06, 0.4, 0.03), K.mat(c.mochila));
        alca.position.set(lado * 0.15, 0.86, 0.17);
        alca.rotation.set(-0.35, 0, lado * 0.08);
        corpo.add(cordao, alca);
      });
      mochila = new THREE.Group();
      const saco = K.malha(new THREE.BoxGeometry(0.36, 0.42, 0.18), K.mat(c.mochila));
      const tampaMochila = K.malha(new THREE.BoxGeometry(0.37, 0.12, 0.2), K.mat(0x2b2f38));
      tampaMochila.position.y = 0.17;
      const bolsoMochila = K.malha(new THREE.BoxGeometry(0.26, 0.14, 0.05), K.mat(0x2b2f38));
      bolsoMochila.position.set(0, -0.08, -0.1);
      mochila.add(saco, tampaMochila, bolsoMochila);
      mochila.position.set(0, 0.84, -0.25);
      mochila.scale.setScalar(0.85);
      corpo.add(mochila);
    }
    if (doutor) {
      // Jaleco aberto na frente: o vão mostra a camisa e a gravata-borboleta
      const perfil = [[0.33, 0.3], [0.31, 0.42], [0.29, 0.6], [0.29, 0.82], [0.27, 1.0], [0.2, 1.1], [0.12, 1.13]];
      const vao = 0.62;
      const jaleco = K.malha(new THREE.LatheGeometry(perfil.map(([r, y]) => new THREE.Vector2(r, y)), 32, vao / 2, Math.PI * 2 - vao), matJaleco);
      jaleco.scale.z = 0.88;
      corpo.add(jaleco);
      const matDobra = K.mat(0xdde3e2);
      [-1, 1].forEach((lado) => {
        const lapela = K.malha(new THREE.BoxGeometry(0.075, 0.2, 0.012), matDobra);
        lapela.position.set(lado * 0.1, 0.97, 0.233);
        lapela.rotation.set(-0.15, lado * 0.3, -lado * 0.35);
        const bolso = K.malha(new THREE.BoxGeometry(0.12, 0.1, 0.02), matDobra);
        bolso.position.set(lado * 0.17, 0.45, 0.232);
        bolso.rotation.y = lado * 0.55;
        corpo.add(lapela, bolso);
      });
      const bolsinho = K.malha(new THREE.BoxGeometry(0.1, 0.07, 0.02), matDobra);
      bolsinho.position.set(0.15, 0.84, 0.228);
      bolsinho.rotation.y = 0.5;
      const caneta = K.malha(new THREE.CylinderGeometry(0.009, 0.009, 0.09, 8), K.mat(0x2f7fe0));
      caneta.position.set(0.135, 0.885, 0.235);
      corpo.add(bolsinho, caneta);
      const gravata = new THREE.Group();
      const matGravata = K.mat(c.gravata);
      [-1, 1].forEach((lado) => {
        const asa = K.malha(new THREE.ConeGeometry(0.035, 0.065, 12).rotateZ(-lado * Math.PI / 2), matGravata);
        asa.position.x = lado * 0.034;
        gravata.add(asa);
      });
      gravata.add(K.malha(new THREE.SphereGeometry(0.019, 10, 8), matGravata));
      gravata.position.set(0, 1.04, 0.165);
      corpo.add(gravata);
      // Estetoscópio: o tubo passa por trás do pescoço e desce pelas lapelas; o disco de metal fica na ponta da esquerda
      const tubo = new THREE.CatmullRomCurve3([[-0.1, 0.8, 0.255], [-0.12, 0.95, 0.24], [-0.2, 1.07, 0.11], [-0.17, 1.08, -0.14],
        [0, 1.09, -0.2], [0.17, 1.08, -0.14], [0.2, 1.07, 0.11], [0.12, 0.95, 0.24], [0.1, 0.84, 0.255]].map((p) => new THREE.Vector3(...p)));
      const matMetal = K.mat(0xc9ccd1, { metalness: 0.6, roughness: 0.3 });
      const disco = K.malha(new THREE.CylinderGeometry(0.035, 0.035, 0.016, 20).rotateX(Math.PI / 2), matMetal);
      disco.position.set(-0.1, 0.775, 0.262);
      const ponta = K.malha(new THREE.SphereGeometry(0.017, 10, 8), matMetal);
      ponta.position.set(0.1, 0.835, 0.256);
      corpo.add(K.malha(new THREE.TubeGeometry(tubo, 48, 0.012, 8), K.mat(0x3a3f4a)), disco, ponta);
    }
    if (operario) {
      // Colete refletivo aberto na frente, com duas faixas prateadas em volta
      const vao = 0.5, aberto = (perfil, mat) => {
        const m = K.malha(new THREE.LatheGeometry(perfil.map(([r, y]) => new THREE.Vector2(r, y)), 32, vao / 2, Math.PI * 2 - vao), mat);
        m.scale.z = 0.88;
        corpo.add(m);
        return m;
      };
      aberto([[0.282, 0.56], [0.288, 0.7], [0.288, 0.86], [0.272, 0.98], [0.215, 1.07], [0.14, 1.1]], K.mat(c.colete, { side: THREE.DoubleSide, roughness: 0.65 }));
      const matFaixa = K.mat(c.faixa, { roughness: 0.35, emissive: 0x555555, emissiveIntensity: 0.4 });
      [0.68, 0.84].forEach((y) => aberto([[0.296, y - 0.028], [0.298, y + 0.028]], matFaixa));
    }

    const maos = [];
    const bracos = [-1, 1].map((lado) => {
      const ombro = new THREE.Group();
      ombro.position.set(lado * (menina ? 0.24 : 0.27), 1.0, 0);
      const manga = K.malha(new THREE.SphereGeometry(doutor ? 0.1 : K.redondo ? 0.082 : 0.1, 8, 6), doutor ? matJaleco : matRoupa);
      const matBraco = doutor ? matJaleco : moletom ? matRoupa : pele, gr = doutor ? 1.4 : moletom ? 1.45 : 1;
      // Redondo: braço e antebraço em cápsula (o cotovelo dobra sem emenda) e mão de luva com polegar
      const sup = K.malha(K.redondo ? new THREE.CapsuleGeometry(0.044 * gr, 0.3 - 0.088 * gr, 6, 20) : new THREE.CylinderGeometry(0.045 * gr, 0.042 * gr, 0.26, 6), matBraco);
      sup.position.y = -0.15;
      const cotovelo = new THREE.Group();
      cotovelo.position.y = -0.28;
      const ant = K.malha(K.redondo ? new THREE.CapsuleGeometry(0.041 * gr, 0.27 - 0.082 * gr, 6, 20) : new THREE.CylinderGeometry(0.042 * gr, 0.04 * gr, 0.22, 6), matBraco);
      ant.position.y = -0.11;
      const mao = K.malha(K.redondo ? new THREE.SphereGeometry(0.062).scale(0.8, 1.05, 0.95) : new THREE.IcosahedronGeometry(0.06, 0), pele);
      mao.position.y = -0.25;
      if (K.redondo) {
        const polegar = K.malha(new THREE.CapsuleGeometry(0.02, 0.035, 4, 12), pele);
        polegar.position.set(-lado * 0.012, 0.012, 0.05);
        polegar.rotation.x = 0.7;
        mao.add(polegar);
      }
      cotovelo.add(ant, mao);
      if (moletom) {
        const punho = K.malha(new THREE.CylinderGeometry(0.066, 0.066, 0.05, 7), K.mat(c.punho));
        punho.position.y = -0.2;
        cotovelo.add(punho);
      }
      ombro.add(manga, sup, cotovelo);
      corpo.add(ombro);
      maos.push(mao);
      return { ombro, cotovelo, lado };
    });

    const cabeca = new THREE.Group();
    cabeca.position.y = 1.24;
    const rosto = K.malha(new THREE.IcosahedronGeometry(0.21, 1), pele);
    rosto.scale.set(1, 1.02, 0.95);
    const matCabelo = K.mat(corCabelo, doutor ? { side: THREE.DoubleSide } : {});
    if (doutor) {
      // Careca em cima: cabelo branco só em volta, de orelha a orelha por trás, com tufos fofos em cima das orelhas
      cabeca.add(rosto);
      const coroa = K.malha(new THREE.SphereGeometry(0.224, 28, 8, Math.PI / 2 + 0.95, Math.PI * 2 - 1.9, Math.PI * 0.3, Math.PI * 0.27), matCabelo);
      coroa.scale.set(1.05, 1, 1.05);
      const nuca = K.malha(new THREE.IcosahedronGeometry(0.08, 1), matCabelo);
      nuca.position.set(0, 0.03, -0.2);
      nuca.scale.set(1.2, 0.9, 0.8);
      cabeca.add(coroa, nuca);
      [-1, 1].forEach((lado) => {
        [[0.205, 0.08, -0.02, 0.07], [0.19, 0.02, -0.09, 0.065], [0.15, 0.03, -0.14, 0.072]].forEach(([x, y, z, r]) => {
          const tufo = K.malha(new THREE.IcosahedronGeometry(r, 1), matCabelo);
          tufo.position.set(lado * x, y, z);
          tufo.scale.set(0.8, 1, 1.1);
          cabeca.add(tufo);
        });
        const bigode = K.malha(new THREE.CapsuleGeometry(0.03, 0.06, 6, 14).rotateZ(Math.PI / 2), matCabelo);
        bigode.position.set(lado * 0.045, -0.048, 0.198);
        bigode.rotation.set(0, lado * 0.35, -lado * 0.3);
        cabeca.add(bigode);
      });
      // Óculos redondos: aros, ponte e hastes até a orelha
      const matOculos = K.mat(0x3b2a1f, { roughness: 0.4 });
      [-1, 1].forEach((lado) => {
        const aro = K.malha(new THREE.TorusGeometry(0.056, 0.009, 8, 28), matOculos, false);
        aro.position.set(lado * 0.077, 0.03, 0.215);
        aro.rotation.y = lado * 0.2;
        const haste = K.malha(new THREE.BoxGeometry(0.012, 0.012, 0.225), matOculos, false);
        haste.position.set(lado * 0.182, 0.035, 0.093);
        haste.rotation.y = -lado * 0.43;
        cabeca.add(aro, haste);
      });
      const ponte = K.malha(new THREE.CylinderGeometry(0.006, 0.006, 0.042, 6).rotateZ(Math.PI / 2), matOculos, false);
      ponte.position.set(0, 0.04, 0.218);
      cabeca.add(ponte);
    } else {
      const cabelo = K.malha(new THREE.SphereGeometry(0.225, 9, 6, 0, Math.PI * 2, 0, Math.PI * 0.5), matCabelo);
      cabelo.position.set(0, 0.04, -0.02);
      cabelo.scale.set(1.02, 0.85, 1.05);
      const franja = K.malha(K.redondo ? new THREE.CapsuleGeometry(0.05, 0.25, 6, 16).rotateZ(Math.PI / 2).scale(1, 0.8, 1.1) : new THREE.BoxGeometry(0.34, 0.07, 0.12), matCabelo);
      franja.position.set(0.02, 0.14, 0.14);
      franja.rotation.set(-0.3, 0, -0.08);
      cabeca.add(rosto, cabelo, franja);
    }
    if (operario && op.barba !== false) {
      // Barba cheia, bigode e costeletas, presos na cabeça
      const corBarba = K.mat(c.barba, { roughness: 0.95 });
      const queixo = K.malha(new THREE.SphereGeometry(0.14, 10, 8), corBarba);
      queixo.scale.set(1, 0.72, 0.62);
      queixo.position.set(0, -0.16, 0.15);
      cabeca.add(queixo);
      [-1, 1].forEach((lado) => {
        const costeleta = K.malha(new THREE.SphereGeometry(0.075, 9, 7), corBarba);
        costeleta.scale.set(0.72, 1.35, 0.58);
        costeleta.position.set(lado * 0.135, -0.075, 0.13);
        const bigode = K.malha(new THREE.SphereGeometry(0.055, 8, 6), corBarba);
        bigode.scale.set(1.05, 0.48, 0.5);
        bigode.position.set(lado * 0.04, -0.075, 0.205);
        cabeca.add(costeleta, bigode);
      });
    }
    if (menina) {
      const nuca = K.malha(new THREE.SphereGeometry(0.21, 9, 7), matCabelo);
      nuca.scale.set(1.08, 1.25, 0.75);
      nuca.position.set(0, -0.06, -0.1);
      cabeca.add(nuca);
      [-1, 1].forEach((lado) => {
        const chuquinha = K.malha(new THREE.IcosahedronGeometry(0.1, 1), matCabelo);
        chuquinha.position.set(lado * 0.24, 0.02, -0.06);
        const laco = K.malha(new THREE.BoxGeometry(0.1, 0.06, 0.06), K.mat(0xffd23f));
        laco.position.set(lado * 0.2, 0.08, -0.02);
        cabeca.add(chuquinha, laco);
      });
    }
    const olhos = new THREE.Group();
    olhos.position.y = 0.03;
    const sobr = [];
    [-1, 1].forEach((lado) => {
      const orelha = K.malha(K.redondo ? new THREE.SphereGeometry(0.045).scale(0.55, 1, 0.8) : new THREE.IcosahedronGeometry(0.045, 0), pele);
      orelha.position.set(lado * 0.205, 0, 0);
      if (K.redondo) {
        // Olho de verdade: branco, íris castanha com pupila e brilho
        const branco = new THREE.Mesh(new THREE.SphereGeometry(0.047).scale(0.85, 1.05, 0.5), new THREE.MeshStandardMaterial({ color: 0xfbfbf8, roughness: 0.3 }));
        branco.position.set(lado * 0.075, 0, 0.172);
        const iris = new THREE.Mesh(new THREE.SphereGeometry(0.028).scale(1, 1, 0.4), new THREE.MeshBasicMaterial({ color: 0x4a2a14 }));
        iris.position.set(lado * 0.072, -0.004, 0.19);
        const pupila = new THREE.Mesh(new THREE.SphereGeometry(0.015).scale(1, 1, 0.4), new THREE.MeshBasicMaterial({ color: 0x0b0806 }));
        pupila.position.set(lado * 0.072, -0.004, 0.198);
        const brilho = new THREE.Mesh(new THREE.SphereGeometry(0.008), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        brilho.position.set(lado * 0.072 + 0.01, 0.009, 0.203);
        olhos.add(branco, iris, pupila, brilho);
      } else {
        const olho = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), new THREE.MeshBasicMaterial({ color: 0x111111 }));
        olho.position.set(lado * 0.075, 0, 0.185);
        const brilho = new THREE.Mesh(new THREE.SphereGeometry(0.009, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        brilho.position.set(lado * 0.075 + 0.01, 0.015, 0.21);
        olhos.add(olho, brilho);
      }
      const geoSobr = K.redondo ? new THREE.CapsuleGeometry(0.011, 0.06, 4, 10).rotateZ(Math.PI / 2) : new THREE.BoxGeometry(0.08, 0.02, 0.02);
      const s = new THREE.Mesh(geoSobr, new THREE.MeshBasicMaterial({ color: doutor ? 0xd6d9dc : 0x2a1a10 }));
      if (doutor) s.scale.set(1.3, 1.6, 1);   // sobrancelha branca e cheia
      s.position.set(lado * 0.078, 0.1, 0.19);
      s.userData.lado = lado;
      sobr.push(s);
      cabeca.add(orelha, s);
      if (menina) {
        const cilio = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.008, 0.01), new THREE.MeshBasicMaterial({ color: 0x111111 }));
        cilio.position.set(lado * 0.1, 0.02, 0.19);
        cilio.rotation.z = lado * 0.5;
        olhos.add(cilio);
      }
    });
    cabeca.add(olhos);
    const nariz = K.malha(K.redondo ? new THREE.SphereGeometry(0.028).scale(1, 0.85, 0.9) : new THREE.IcosahedronGeometry(0.03, 0), pele);
    nariz.position.set(0, -0.01, 0.205);
    if (doutor) nariz.scale.setScalar(1.35);
    // O doutor fala por baixo do bigode: a boca desce um pouco
    const bocaY = doutor ? -0.015 : 0;
    const boca = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.013, 5, 12, Math.PI), new THREE.MeshBasicMaterial({ color: 0x5a1a14 }));
    boca.position.set(0, -0.09, 0.17);
    const bocaAberta = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), new THREE.MeshBasicMaterial({ color: 0x5a1a14 }));
    bocaAberta.scale.set(1, 1.2, 0.4);
    bocaAberta.position.set(0, -0.09 + bocaY, 0.185);
    if (menina || K.redondo) [-1, 1].forEach((lado) => {
      const bochecha = new THREE.Mesh(new THREE.CircleGeometry(0.03, 10), new THREE.MeshBasicMaterial({ color: 0xf28a8a, transparent: true, opacity: menina ? 0.7 : 0.35 }));
      bochecha.position.set(lado * 0.12, -0.05, 0.18);
      bochecha.rotation.y = lado * 0.5;
      cabeca.add(bochecha);
    });
    cabeca.add(nariz, boca, bocaAberta);
    // Gotas de suor
    const suor = [0, 1, 2].map((i) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6).scale(1, 1.5, 1), new THREE.MeshStandardMaterial({ color: 0x8fd0ff, roughness: 0.1 }));
      m.userData.base = [[-0.2, 0.12, 0.08], [0.21, 0.1, 0.07], [0.17, 0.16, 0.1]][i];
      cabeca.add(m);
      return m;
    });
    corpo.add(cabeca);

    const b = { g, corpo, cabeca, bracos, pernas, maos, boca, bocaAberta, menina, doutor, operario, mochila, fasePisca: op.fasePisca || (menina ? 1.3 : 0) };

    // humor: 'feliz' | 'triste' | 'surpreso' | 'bravo' | 'nojo' | 'assustado'
    b.humor = function (h) {
      const aberta = h === 'surpreso' || h === 'assustado';
      boca.visible = !aberta;
      bocaAberta.visible = aberta;
      bocaAberta.scale.set(h === 'assustado' ? 1.3 : 1, h === 'assustado' ? 1.5 : 1.2, 0.4);
      boca.rotation.z = h === 'feliz' ? Math.PI : 0;
      boca.position.y = (h === 'feliz' ? -0.07 : -0.11) + bocaY;
      boca.scale.set(1, h === 'bravo' || h === 'nojo' ? 0.4 : 1, 1);
      const [ang, y] = { feliz: [0.1, 0.105], triste: [0.4, 0.1], surpreso: [0.05, 0.14], bravo: [-0.45, 0.09], nojo: [-0.3, 0.095], assustado: [0.35, 0.145] }[h] || [0, 0.1];
      sobr.forEach((s) => { s.rotation.z = -s.userData.lado * ang; s.position.y = y; });
      olhos.scale.y = h === 'nojo' ? 0.55 : 1;
      b.humorAtual = h;
    };
    // pose: braços como { x, z, c } por lado (-1 = esquerda da tela quando de frente, 1 = direita)
    b.pose = function (esq, dir) {
      [[bracos[0], esq], [bracos[1], dir]].forEach(([br, p]) => {
        br.ombro.rotation.set(p.x || 0, 0, br.lado * (p.z != null ? p.z : 0.12));
        br.cotovelo.rotation.x = p.c || 0;
      });
    };
    b.pernasEm = function (e, d) { pernas[0].quadril.rotation.x = e; pernas[1].quadril.rotation.x = d; };
    b.parado = () => { b.pose({}, {}); b.pernasEm(0, 0); };

    // Volta tudo ao neutro e pisca de vez em quando. Chamar no começo de cada quadro.
    b.reset = function (t = 0) {
      g.rotation.set(0, g.rotation.y, 0);
      corpo.position.set(0, 0, 0);
      corpo.rotation.set(0, 0, 0);
      cabeca.rotation.set(0, 0, 0);
      b.parado();
      b.humor('feliz');
      suor.forEach((m) => { m.visible = false; });
      b.suando = false;
      if (capacete) capacete.visible = !!operario; // o operário nunca tira o capacete
      if (capEsp) capEsp.visible = false;
      const f = (t + b.fasePisca) % 3.4;
      olhos.scale.y = f < 0.13 ? 0.12 : 1;
      if (K.redondo) {
        // Parado também é vivo: respira, balança os braços de leve e mexe a cabeça devagar
        corpo.scale.set(1, 1, 1);
        const resp = Math.sin((t + b.fasePisca) * 2.3);
        tronco.scale.set((menina ? 0.9 : 1) * (1 + resp * 0.012), 1.25 * (1 + resp * 0.018), 0.85 * (1 + resp * 0.012));
        cabeca.position.y = 1.24 + resp * 0.006;
        cabeca.rotation.set(Math.sin(t * 0.9 + 1) * 0.025, Math.sin(t * 0.6) * 0.05, 0);
        b.pose({ z: 0.12 + resp * 0.02 }, { z: 0.12 + resp * 0.02 });
        if (mochila) mochila.rotation.x = 0;
        b.manchaEm(0);
      }
    };
    // Capacete de obra (o reset tira; chamar a cada quadro em que ele usa)
    let capacete = null;
    b.capacete = function (cor = 0xf5c518) {
      if (!capacete) {
        capacete = new THREE.Group();
        const mat = K.mat(cor, { roughness: 0.45 });
        const casco = K.malha(new THREE.SphereGeometry(0.235, 12, 7, 0, Math.PI * 2, 0, Math.PI * 0.5), mat);
        casco.scale.set(1, 0.9, 1.05);
        const aba = K.malha(new THREE.CylinderGeometry(0.29, 0.29, 0.025, 14), mat);
        aba.scale.z = 1.12;
        aba.position.set(0, 0.0, 0.03);
        const crista = K.malha(new THREE.BoxGeometry(0.05, 0.05, 0.42), mat);
        crista.position.y = 0.2;
        capacete.add(casco, aba, crista);
        capacete.position.y = 0.09;
        cabeca.add(capacete);
      }
      capacete.visible = true;
    };
    // Capacete de astronauta: bolha de vidro com viseira dourada levantada e anel no pescoço (o reset tira)
    let capEsp = null;
    b.capaceteEspacial = function () {
      if (!capEsp) {
        capEsp = new THREE.Group();
        const bolha = new THREE.Mesh(new THREE.SphereGeometry(0.34, 22, 16),
          new THREE.MeshStandardMaterial({ color: 0xd8ecff, transparent: true, opacity: 0.25, roughness: 0.05, metalness: 0.3, depthWrite: false }));
        const viseira = new THREE.Mesh(new THREE.SphereGeometry(0.345, 22, 8, Math.PI / 2 - 1.15, 2.3, 0.18, 0.62),
          new THREE.MeshStandardMaterial({ color: 0xe0a82e, metalness: 0.75, roughness: 0.2, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
        const gola = K.malha(new THREE.TorusGeometry(0.22, 0.055, 6, 18).rotateX(Math.PI / 2), K.mat(0xe9ebee));
        gola.position.y = -0.24;
        bolha.renderOrder = 8;
        capEsp.add(bolha, viseira, gola);
        cabeca.add(capEsp);
      }
      capEsp.visible = true;
    };
    b.suar = function (t) {
      b.suando = true;
      suor.forEach((m, i) => {
        const k = (t * 1.3 + i / 3) % 1;
        const [x, y, z] = m.userData.base;
        m.visible = true;
        m.position.set(x, y - k * 0.22, z);
        m.scale.setScalar(k < 0.85 ? 1 : (1 - k) / 0.15);
      });
    };
    // Redondo: o passo sobe e desce sem tranco (cos² no lugar de |cos|), o quadril gira com a perna,
    // os ombros vão ao contrário, a cabeça compensa e o cotovelo dobra mais no braço que vai pra frente
    const passada = function (f, perna, braco, cot, sobe, gira) {
      const s = Math.sin(f), cv = Math.cos(f);
      b.pernasEm(s * perna, -s * perna);
      b.pose({ x: -s * braco, c: cot - Math.max(0, s) * 0.35 }, { x: s * braco, c: cot - Math.max(0, -s) * 0.35 });
      corpo.position.y = cv * cv * sobe;
      corpo.rotation.y = -s * gira;
      corpo.rotation.z = Math.sin(f + 0.4) * gira * 0.35;
      cabeca.rotation.y = s * gira * 0.8;
      cabeca.rotation.x = Math.cos(2 * f + 0.8) * 0.03;
      // A mochila chega atrasada no balanço do passo
      if (mochila) mochila.rotation.x = Math.sin(2 * f - 0.9) * sobe * 1.6;
    };
    b.andar = function (t, vel = 1) {
      const f = t * 9 * vel;
      if (K.redondo) return passada(f, 0.55, 0.42, -0.25, 0.045, 0.09);
      b.pernasEm(Math.sin(f) * 0.55, -Math.sin(f) * 0.55);
      b.pose({ x: -Math.sin(f) * 0.45 }, { x: Math.sin(f) * 0.45 });
      corpo.position.y = Math.abs(Math.cos(f)) * 0.04;
    };
    b.correr = function (t, vel = 1) {
      const f = t * 15 * vel;
      if (K.redondo) {
        passada(f, 0.95, 0.85, -1.25, 0.09, 0.14);
        corpo.rotation.x = 0.22;
        return;
      }
      b.pernasEm(Math.sin(f) * 0.95, -Math.sin(f) * 0.95);
      b.pose({ x: -Math.sin(f) * 0.9, c: -1.3 }, { x: Math.sin(f) * 0.9, c: -1.3 });
      corpo.rotation.x = 0.22;
      corpo.position.y = Math.abs(Math.cos(f)) * 0.09;
    };
    // x de 0 a 1 ao longo do pulo; devolve a altura
    b.pular = function (x, altura = 0.6) {
      const y = 4 * x * (1 - x) * altura;
      corpo.position.y = y;
      const enc = K.pulso(x);
      b.pernasEm(-0.6 * enc, -0.4 * enc);
      b.pose({ z: 0.4 + 2.2 * enc }, { z: 0.4 + 2.2 * enc });
      if (K.redondo) {
        // Estica na subida e na descida (quanto mais rápido, mais estica) e fica normal no alto
        const estica = 1 + 0.09 * Math.abs(1 - 2 * x) * enc * 2;
        corpo.scale.set(1 / Math.sqrt(estica), estica, 1 / Math.sqrt(estica));
        b.manchaEm(y);
      }
      return y;
    };
    // Cai de costas: x de 0 a 1
    b.cair = function (x) {
      const k = K.quica(K.clamp(x));
      corpo.rotation.x = -1.45 * k;
      corpo.position.z = -0.25 * k;
      b.pose({ z: 1.2 + Math.sin(x * 20) * 0.3 }, { z: 1.2 - Math.sin(x * 20) * 0.3 });
      b.pernasEm(-0.5 * k, -0.2 * k);
      b.humor('assustado');
    };
    b.acenar = function (t, lado = 1) {
      const onda = Math.sin(t * 11) * 0.3;
      const p = { z: 2.55 + onda, c: -0.3 };
      if (lado > 0) b.pose({}, p); else b.pose(p, {});
    };
    b.comemorar = function (t) {
      const balanco = Math.sin(t * 14) * 0.15;
      b.pose({ z: 2.6 + balanco, c: -0.2 }, { z: 2.6 - balanco, c: -0.2 });
      corpo.position.y = Math.abs(Math.sin(t * 7)) * 0.12;
    };
    // Segurando algo com as duas mãos na frente do corpo
    b.segurar = function () { b.pose({ x: -1.05, z: -0.15, c: -0.5 }, { x: -1.05, z: -0.15, c: -0.5 }); };
    // Apontando com a mão direita (pra cima: alto = 1)
    // (o braço sobe e desce de leve, como quem aponta de verdade, pra não ficar duro)
    b.apontar = function (alto = 0.5) { const v = Math.sin((K.tc || 0) * 2.6) * 0.06; b.pose({}, { x: -1.4 - alto * 0.9 + v, z: 0.15, c: v }); };
    // Mão no queixo, pensando
    b.pensar = function () { b.pose({ x: -0.3, z: 0.3, c: -0.6 }, { x: -1.15, z: -0.35, c: -2.2 }); cabeca.rotation.z = 0.12; };
    // Posição da mão no mundo (0 = esquerda, 1 = direita)
    const vMao = new THREE.Vector3();
    b.mao = function (i = 1) { g.updateMatrixWorld(true); maos[i].getWorldPosition(vMao); return [vMao.x, vMao.y, vMao.z]; };

    b.humor('feliz');
    b.parado();
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    const mancha = K.redondo ? K.manchaSombra(0.42, 0.5) : null;
    if (mancha) g.add(mancha);
    // Sombra de contato encolhe e clareia quando ele sai do chão
    const manchaEm = (alt) => {
      if (!mancha) return;
      mancha.scale.setScalar(1 - Math.min(0.5, alt * 0.6));
      mancha.material.opacity = mancha.userData.forca * (1 - Math.min(0.75, alt * 1.1));
    };
    b.manchaEm = manchaEm;

    // Põe o personagem num lugar, de frente pra um ponto [x, y, z] (ou num ângulo em radianos). Sem olhar: de frente
    // pro +z, o lado de onde a câmera 'frente' olha
    b.colocar = function (pos, olhar) {
      g.visible = true;
      g.position.set(pos[0], pos[1] || 0, pos[2]);
      if (Array.isArray(olhar) || (olhar && olhar.isVector3)) b.olharPara(olhar);
      else g.rotation.y = typeof olhar === 'number' ? olhar : 0;
    };
    b.olharPara = function (ponto) {
      const p = ponto.isVector3 ? ponto.toArray() : ponto;
      g.rotation.y = Math.atan2(p[0] - g.position.x, p[2] - g.position.z);
    };
    // Anda (ou corre, op.correr) de um lugar até outro: x de 0 a 1 no caminho. Vira pro lado que anda e, chegando,
    // olha pra op.olhar. Devolve onde ele está
    b.irPara = function (de, ate, x, t, op = {}) {
      const k = K.clamp(x);
      const pos = K.lerp3([de[0], de[1] || 0, de[2]], [ate[0], ate[1] || 0, ate[2]], op.reto ? k : K.suave(k));
      g.visible = true;
      g.position.set(pos[0], pos[1], pos[2]);
      if (k < 1) {
        g.rotation.y = Math.atan2(ate[0] - de[0], ate[2] - de[2]);
        if (k > 0) { if (op.correr) b.correr(t, op.vel || 1); else b.andar(t, op.vel || 1); }
      } else if (op.olhar) b.olharPara(op.olhar);
      return pos;
    };
    // Reações prontas (corpo + cara), pra cada frase ter uma atuação: t = segundos desde que a reação começou.
    // 'susto' 'surpreso' 'ideia' 'vitoria' 'cansado' 'duvida' 'bravo' 'triste' 'mostrando' 'chamando' 'empurrando'
    // 'segurando' 'erguendo' 'pensando'; outro nome vira só a cara (b.humor)
    b.reagir = function (tipo, t = 0) {
      const ent = K.saiVolta(K.clamp(t / 0.35));
      switch (tipo) {
        case 'susto':
          b.humor('assustado');
          corpo.position.z = -0.22 * K.clamp(t / 0.25);
          corpo.position.y = 0.14 * K.pulso(K.clamp(t / 0.35));
          corpo.rotation.x = -0.16 * ent;
          b.pose({ x: -0.5, z: 0.4 + 1.6 * ent, c: -1.0 }, { x: -0.5, z: 0.4 + 1.6 * ent, c: -1.0 });
          break;
        case 'surpreso':
          b.humor('surpreso');
          corpo.position.z = -0.08 * K.clamp(t / 0.2);
          b.pose({ x: -1.0 * ent, z: 0.35, c: -1.7 * ent }, { x: -1.0 * ent, z: 0.35, c: -1.7 * ent });
          break;
        case 'ideia':
          b.humor('feliz');
          b.apontar(1);
          corpo.position.y = 0.1 * K.pulso(K.clamp(t / 0.4));
          cabeca.rotation.x = -0.18;
          break;
        case 'vitoria': b.humor('feliz'); b.comemorar(t); break;
        case 'cansado':
          b.humor('triste');
          b.suar(t);
          corpo.rotation.x = 0.2;
          cabeca.rotation.x = 0.22;
          b.pose({ x: 0.15, z: 0.04 }, { x: 0.15, z: 0.04 });
          break;
        case 'duvida': case 'pensando': b.humor(tipo === 'duvida' ? 'surpreso' : 'feliz'); b.pensar(); break;
        case 'bravo':
          b.humor('bravo');
          b.pose({ x: 0.15, z: 0.8, c: -1.55 }, { x: 0.15, z: 0.8, c: -1.55 }); // mãos na cintura
          corpo.position.y = 0.025 * Math.abs(Math.sin(t * 9));
          break;
        case 'triste':
          b.humor('triste');
          cabeca.rotation.x = 0.35;
          b.pose({ z: 0.03 }, { z: 0.03 });
          break;
        case 'mostrando': b.humor('feliz'); b.pose({ z: 0.12 }, { x: -0.55, z: 0.95 * ent, c: -0.15 }); break; // braço aberto, apresentando
        case 'chamando': b.humor('feliz'); b.acenar(t); break;
        case 'empurrando':
          b.humor('bravo');
          corpo.rotation.x = 0.25;
          b.pose({ x: -1.45, z: 0.1, c: -0.2 }, { x: -1.45, z: 0.1, c: -0.2 });
          b.pernasEm(0.35, -0.45);
          break;
        case 'segurando': b.humor('feliz'); b.segurar(); break;
        case 'erguendo': b.humor('feliz'); b.pose({ x: -0.2, z: 2.75 * ent, c: -0.3 }, { x: -0.2, z: 2.75 * ent, c: -0.3 }); break; // segurando algo acima da cabeça
        default: b.humor(tipo);
      }
      // Pose segurada também se mexe: passada a entrada, o corpo balança, a cabeça acompanha e as mãos gesticulam de
      // leve, pra ele não ficar duro que nem espantalho a frase inteira (a ação que muda vem do plano, na palavra certa)
      const vida = K.clamp((t - 0.35) / 0.4);
      if (vida > 0 && VIVAS.has(tipo)) {
        const s = (f, fase = 0) => Math.sin(t * f + fase) * vida;
        const dir = bracos[1];
        corpo.rotation.z += s(1.7) * 0.035;
        cabeca.rotation.y += s(0.95, 1) * 0.14;
        if (tipo === 'mostrando') { dir.ombro.rotation.z += dir.lado * s(2.3) * 0.16; dir.cotovelo.rotation.x += s(2.3, 1.2) * 0.22; }
        else if (tipo === 'surpreso') { cabeca.rotation.z += s(2.6) * 0.06; corpo.position.z += s(1.3) * 0.02; }
        else if (tipo === 'triste') { cabeca.rotation.y += s(1.9) * 0.12; corpo.position.y -= (1 + s(1.1)) * 0.012; }
        else if (tipo === 'pensando' || tipo === 'duvida') { cabeca.rotation.z += s(1.2) * 0.09; dir.cotovelo.rotation.x += s(6.5) * 0.1; }
        else if (tipo === 'segurando' || tipo === 'erguendo') { bracos.forEach((br) => { br.ombro.rotation.x += s(2.4) * 0.07; }); corpo.position.y += (1 + s(4.8)) * 0.01; }
        else if (tipo === 'empurrando') { corpo.rotation.z += s(9) * 0.025; bracos.forEach((br) => { br.ombro.rotation.x += s(9, 1) * 0.04; }); }
        else if (tipo === 'ideia') dir.cotovelo.rotation.x += s(5) * 0.14;
        else if (tipo === 'susto') corpo.position.x += Math.sin(t * 31) * 0.006 * vida;
        else if (tipo === 'bravo') cabeca.rotation.y += s(4) * 0.08;
        else if (tipo === 'cansado') corpo.rotation.x += s(3.2) * 0.05;
      }
    };
    // As reações que seguram uma pose (a vitória e o chamando já se mexem sozinhos)
    const VIVAS = new Set(['susto', 'surpreso', 'ideia', 'cansado', 'duvida', 'bravo', 'triste', 'mostrando', 'empurrando', 'segurando', 'erguendo', 'pensando']);
    // Falando com a câmera: a boca abre e fecha no ritmo de sílaba e a cabeça acompanha (chamar depois do humor)
    b.falar = function (t) {
      const k = Math.abs(Math.sin(t * 11)) * (0.65 + 0.35 * Math.sin(t * 3.7));
      boca.visible = k < 0.2;
      bocaAberta.visible = !boca.visible;
      bocaAberta.scale.set(0.85, 0.45 + 0.85 * k, 0.4);
      cabeca.rotation.x += Math.sin(t * 5.3) * 0.03;
    };

    if (operario) {
      // Adulto: mais alto que o menino (~1,8), cabeça proporcional, capacete sempre na cabeça
      g.scale.set(1.04, 1.2, 1.04);
      cabeca.scale.setScalar(0.9);
      b.capacete(c.capacete);
    }
    K.bonecos.push(b);
    K.scene.add(g);
    // Nome pro "mostra" do roteiro.json: "personagem" (ou "menino") e o tipo ("doutor", "operario", "menina")
    ['personagem', menina || doutor || operario ? null : 'menino', op.tipo].forEach((n) => { if (n) K.nomear(n, g); });
    return b;
  };

  // ---------- Efeitos de cena ----------

  // Confete e corações que caem a partir de t0 em volta de um ponto
  K.festa = function (centro, seed = 3) {
    const r = K.rand(seed);
    const g = new THREE.Group();
    const cores = [0xf5c518, 0xff5a7a, 0x3a7be0, 0x4fc98a, 0xffffff, 0xf7941d];
    const pecas = [];
    for (let i = 0; i < 220; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.09), new THREE.MeshBasicMaterial({ color: cores[i % cores.length], side: THREE.DoubleSide }));
      pecas.push({ m, x: (r() - 0.5) * 3.2, z: (r() - 0.5) * 1.6, y: 2.2 + r() * 1.6, vy: 0.2 + r() * 0.5, giro: 3 + r() * 6, fase: r() * 6 });
      g.add(m);
    }
    const coracao = new THREE.Shape();
    coracao.moveTo(0, 0.25);
    coracao.bezierCurveTo(0, 0.3, -0.05, 0.4, -0.2, 0.4);
    coracao.bezierCurveTo(-0.45, 0.4, -0.45, 0.1, -0.45, 0.1);
    coracao.bezierCurveTo(-0.45, -0.05, -0.3, -0.2, 0, -0.4);
    coracao.bezierCurveTo(0.3, -0.2, 0.45, -0.05, 0.45, 0.1);
    coracao.bezierCurveTo(0.45, 0.1, 0.45, 0.4, 0.2, 0.4);
    coracao.bezierCurveTo(0.05, 0.4, 0, 0.3, 0, 0.25);
    const coracoes = [];
    for (let i = 0; i < 7; i++) {
      const m = new THREE.Mesh(new THREE.ExtrudeGeometry(coracao, { depth: 0.08, bevelEnabled: false }), new THREE.MeshBasicMaterial({ color: 0xff4d6d }));
      coracoes.push({ m, x: (r() - 0.5) * 2.2, y: 0.9 + r() * 0.8, s: 0.18 + r() * 0.14, atraso: r() * 0.8, fase: r() * 6 });
      g.add(m);
    }
    g.position.set(centro[0], centro[1], centro[2]);
    g.visible = false;
    K.scene.add(g);
    return K.componente({
      g,
      esconder() { g.visible = false; },
      em(tempo) {
        g.visible = tempo >= 0;
        if (tempo < 0) return;
        K.som('festa', K.tc - tempo, 0.8);
        pecas.forEach((p) => {
          p.m.position.set(p.x + Math.sin(tempo * 2 + p.fase) * 0.15, p.y - tempo * (0.9 + p.vy), p.z);
          p.m.rotation.set(tempo * p.giro, tempo * p.giro * 0.7, p.fase);
          p.m.visible = p.m.position.y > -0.2;
        });
        coracoes.forEach((c) => {
          const tt = Math.max(0, tempo - c.atraso);
          const s = c.s * K.saiVolta(K.clamp(tt / 0.4));
          c.m.scale.set(s, s, s);
          c.m.position.set(c.x + Math.sin(tt * 3 + c.fase) * 0.08, c.y + tt * 0.35, 0);
        });
      }
    });
  };

  // Nuvem de poeira quando algo pesado cai. em(centro, tempo desde o impacto, escala)
  let texFumaca = null;
  K.poeira = function (seed = 1, cor = 0xd8ccb4, n = 26) {
    const r = K.rand(seed);
    const geo = new THREE.IcosahedronGeometry(1, 1);
    const g = new THREE.Group();
    const puffs = [];
    // Redondo: cada sopro é uma nuvenzinha de borda macia (sprite) no lugar da bola
    if (K.redondo) texFumaca = texFumaca || texDegrade([[0, 'rgba(255,255,255,0.95)'], [0.4, 'rgba(255,255,255,0.6)'], [1, 'rgba(255,255,255,0)']]);
    for (let i = 0; i < n; i++) {
      const mat = K.redondo
        ? new THREE.SpriteMaterial({ map: texFumaca, color: cor, transparent: true, opacity: 0.85, depthWrite: false })
        : K.mat(cor, { transparent: true, opacity: 0.85, depthWrite: false });
      const m = K.redondo ? new THREE.Sprite(mat) : K.malha(geo, mat, false);
      g.add(m);
      puffs.push({ m, mat, ang: (i / n) * Math.PI * 2 + r() * 0.4, v: 0.6 + r() * 1.1, sobe: 0.1 + r() * 0.6, s: 0.12 + r() * 0.2 });
    }
    g.visible = false;
    K.scene.add(g);
    return K.componente({
      esconder() { g.visible = false; },
      em(centro, tempo, escala = 1, dur = 1.5) {
        const x = tempo / dur;
        if (x < 0 || x >= 1) return;
        g.visible = true;
        const sai = 1 - Math.pow(1 - x, 3);
        puffs.forEach((p) => {
          const raio = sai * p.v * escala;
          p.m.position.set(centro[0] + Math.cos(p.ang) * raio, centro[1] + p.s * escala + x * p.sobe * escala, centro[2] + Math.sin(p.ang) * raio);
          p.m.scale.setScalar(p.s * escala * (0.7 + x * 1.5) * (K.redondo ? 2.6 : 1));
          p.mat.opacity = 0.85 * Math.pow(1 - x, 1.4);
        });
      }
    });
  };

  // Lascas voando (madeira, telha, concreto). em(centro, tempo, chão)
  K.lascas = function (seed = 4, cor = 0xc8442f, n = 16) {
    const r = K.rand(seed);
    const g = new THREE.Group();
    const ps = [];
    for (let i = 0; i < n; i++) {
      const m = K.malha(new THREE.BoxGeometry(0.06 + r() * 0.08, 0.03, 0.08 + r() * 0.1), K.mat(cor), false);
      const a = r() * Math.PI * 2;
      ps.push({ m, vx: Math.cos(a) * (0.8 + r() * 1.6), vz: Math.sin(a) * (0.8 + r() * 1.6), vy: 1.5 + r() * 2.5, giro: [r() * 12, r() * 12, r() * 12] });
      g.add(m);
    }
    g.visible = false;
    K.scene.add(g);
    return K.componente({
      esconder() { g.visible = false; },
      em(centro, tempo, chao = 0) {
        if (tempo < 0 || tempo > 2.5) return;
        g.visible = true;
        ps.forEach((p) => {
          const tq = (p.vy + Math.sqrt(p.vy * p.vy + 19.6 * Math.max(0, centro[1] - chao))) / 9.8;
          const tt = Math.min(tempo, tq);
          p.m.position.set(centro[0] + p.vx * tt, Math.max(chao, centro[1] + p.vy * tt - 4.9 * tt * tt), centro[2] + p.vz * tt);
          p.m.rotation.set(p.giro[0] * tt, p.giro[1] * tt, p.giro[2] * tt);
        });
      }
    });
  };

  // Respingo: gotas pra cima + anel na superfície. em(centro, tempo, força)
  K.respingo = function (seed = 6, cor = K.cores.aguaClara, n = 22) {
    const r = K.rand(seed);
    const g = new THREE.Group();
    const mat = K.mat(cor, { roughness: 0.2 });
    const geo = new THREE.SphereGeometry(0.035, 6, 5);
    const ps = [];
    for (let i = 0; i < n; i++) {
      const m = K.malha(geo, mat, false);
      const a = r() * Math.PI * 2, v = 0.4 + r() * 0.9;
      ps.push({ m, vx: Math.cos(a) * v, vz: Math.sin(a) * v, vy: 1.6 + r() * 1.8 });
      g.add(m);
    }
    const matAnel = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false });
    const anel = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 24).rotateX(-Math.PI / 2), matAnel);
    g.add(anel);
    g.visible = false;
    K.scene.add(g);
    return K.componente({
      esconder() { g.visible = false; },
      em(centro, tempo, forca = 1) {
        if (tempo < 0 || tempo > 1.2) return;
        g.visible = true;
        ps.forEach((p) => {
          const y = centro[1] + (p.vy * tempo - 4.9 * tempo * tempo) * forca;
          p.m.visible = y >= centro[1] - 0.05;
          p.m.position.set(centro[0] + p.vx * tempo * forca, y, centro[2] + p.vz * tempo * forca);
        });
        anel.position.set(centro[0], centro[1] + 0.01, centro[2]);
        anel.scale.setScalar(0.1 + tempo * 0.9 * forca);
        matAnel.opacity = 0.8 * (1 - tempo / 1.2);
      }
    });
  };

  // Esguicho contínuo (cano furado, mangueira). em(origem, direção, velocidade, t, chão)
  K.esguicho = function (seed = 8, n = 90, cor = K.cores.aguaClara) {
    const r = K.rand(seed);
    const g = new THREE.Group();
    const mat = K.mat(cor, { roughness: 0.2, transparent: true, opacity: 0.9 });
    const geo = new THREE.SphereGeometry(0.04, 6, 5);
    const ps = [];
    for (let i = 0; i < n; i++) {
      const m = K.malha(geo, mat, false);
      ps.push({ m, fase: r(), jx: (r() - 0.5), jy: (r() - 0.5), jz: (r() - 0.5), s: 0.6 + r() * 0.9 });
      g.add(m);
    }
    g.visible = false;
    K.scene.add(g);
    return K.componente({
      esconder() { g.visible = false; },
      em(origem, dir, vel, t, chao = 0, abertura = 0.18) {
        g.visible = true;
        ps.forEach((p) => {
          const tau = ((t * 1.3 + p.fase) % 1) * 0.9;
          const vx = (dir[0] + p.jx * abertura) * vel, vy = (dir[1] + p.jy * abertura) * vel, vz = (dir[2] + p.jz * abertura) * vel;
          const y = origem[1] + vy * tau - 4.9 * tau * tau;
          p.m.visible = y > chao;
          p.m.position.set(origem[0] + vx * tau, y, origem[2] + vz * tau);
          p.m.scale.setScalar(p.s);
        });
      }
    });
  };

  // Chuva em volta de um ponto. em(centro, t, intensidade 0 a 1, abrigo). abrigo: { pos: [x, y, z], raio } (o
  // guarda-chuva, o telhado): embaixo dele não chove
  K.chuva = function (seed = 12, n = 700) {
    const r = K.rand(seed);
    const geo = new THREE.BoxGeometry(0.012, 0.35, 0.012);
    const inst = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: 0xcfe2f2, transparent: true, opacity: 0.6 }), n);
    const ps = [];
    for (let i = 0; i < n; i++) ps.push({ x: (r() - 0.5) * 24, z: (r() - 0.5) * 18, fase: r(), v: 0.9 + r() * 0.4 });
    inst.visible = false;
    K.scene.add(inst);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.12)), s = new THREE.Vector3(1, 1, 1), v = new THREE.Vector3();
    const zero = new THREE.Vector3(0, 0, 0);
    return K.componente({
      esconder() { inst.visible = false; },
      em(centro, t, intensidade = 1, abrigo = null) {
        inst.visible = true;
        inst.count = Math.floor(n * K.clamp(intensidade));
        for (let i = 0; i < inst.count; i++) {
          const p = ps[i];
          const y = 14 - ((t * p.v * 1.1 + p.fase) % 1) * 14;
          v.set(centro[0] + p.x - y * 0.12, y, centro[2] + p.z);
          const seco = abrigo && v.y < abrigo.pos[1] && Math.hypot(v.x - abrigo.pos[0], v.z - abrigo.pos[2]) < abrigo.raio;
          m4.compose(v, q, seco ? zero : s);
          inst.setMatrixAt(i, m4);
        }
        inst.instanceMatrix.needsUpdate = true;
      }
    });
  };

  // Vento: traços brancos passando. em(centro, t, intensidade, direção x)
  K.vento = function (seed = 13, n = 26) {
    const r = K.rand(seed);
    const g = new THREE.Group();
    const ps = [];
    for (let i = 0; i < n; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, depthWrite: false });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6 + r() * 1.4, 0.035), mat);
      ps.push({ m, mat, y: 0.5 + r() * 6, z: (r() - 0.5) * 10, fase: r(), v: 0.35 + r() * 0.3 });
      g.add(m);
    }
    g.visible = false;
    K.scene.add(g);
    return K.componente({
      esconder() { g.visible = false; },
      em(centro, t, intensidade = 1, dir = 1) {
        g.visible = true;
        ps.forEach((p, i) => {
          const k = (t * p.v + p.fase) % 1;
          p.m.visible = i < n * intensidade;
          p.m.position.set(centro[0] + dir * (k - 0.5) * 22, centro[1] + p.y + Math.sin(k * 8 + i) * 0.15, centro[2] + p.z);
          p.mat.opacity = 0.7 * K.pulso(k);
          p.m.lookAt(K.camera.position.x, p.m.position.y, K.camera.position.z);
        });
      }
    });
  };

  // Peça nova em amarelo translúcido, como fantasma brilhando. em(tempo desde a apresentação, duração)
  K.destaque = function (obj) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xffd60a, transparent: true, opacity: 0, depthWrite: false });
    const capas = [];
    obj.traverse((o) => { if (o.isMesh && !o.userData.capa) capas.push(o); });
    const ms = capas.map((o) => {
      const c = new THREE.Mesh(o.geometry, mat);
      c.userData.capa = true;
      c.scale.setScalar(1.05);
      c.renderOrder = 20;
      o.add(c);
      return c;
    });
    const esconder = () => ms.forEach((c) => { c.visible = false; });
    esconder();
    return K.componente({
      esconder,
      em(tempo, dur = 1.6) {
        if (tempo < 0 || tempo > dur) return;
        const a = K.faixa(tempo, 0, 0.15) * (1 - K.faixa(tempo, dur - 0.5, dur));
        mat.opacity = 0.62 * a * (0.85 + 0.15 * Math.sin(tempo * 14));
        ms.forEach((c) => { c.visible = true; });
      }
    });
  };

  // Seta de força 3D. em(origem, direção, comprimento, tempo desde que apareceu)
  K.seta = function (cor = K.cores.vermelho, esp = 1) {
    const g = new THREE.Group();
    const mat = K.mat(cor, { emissive: cor, emissiveIntensity: 0.3, roughness: 0.6 });
    const haste = K.malha(new THREE.CylinderGeometry(0.1 * esp, 0.1 * esp, 1, 12).translate(0, 0.5, 0), mat, false);
    const ponta = K.malha(new THREE.ConeGeometry(0.26 * esp, 0.5 * esp, 14).translate(0, 0.25 * esp, 0), mat, false);
    g.add(haste, ponta);
    g.visible = false;
    K.scene.add(g);
    const up = new THREE.Vector3(0, 1, 0), d = new THREE.Vector3();
    return K.componente({
      esconder() { g.visible = false; },
      em(origem, dir, comp, tempo) {
        if (tempo < 0) return;
        g.visible = true;
        d.set(dir[0], dir[1], dir[2]).normalize();
        g.quaternion.setFromUnitVectors(up, d);
        const s = K.saiVolta(K.clamp(tempo / 0.35));
        const L = Math.max(0.01, (comp - 0.5 * esp) * s);
        haste.scale.y = L;
        ponta.position.y = L;
        ponta.scale.setScalar(Math.max(0.01, s));
        const bob = Math.sin(tempo * 6) * 0.06;
        g.position.set(origem[0] + d.x * bob, origem[1] + d.y * bob, origem[2] + d.z * bob);
      }
    });
  };

  // ---------- Texto e indicadores na tela ----------

  // Textos na tela são posicionados no fim do quadro, depois que a cena pôs a câmera
  let adiados = null;
  const depois = (fn) => (adiados ? adiados.push(fn) : fn());
  function comAdiados(fn) {
    adiados = [];
    fn();
    const lista = adiados;
    adiados = null;
    lista.forEach((f) => f());
  }

  // Pop de entrada: escala com passada
  const pop = (tempo, dur = 0.3) => K.saiVolta(K.clamp(tempo / dur));

  // Nome da peça: amarelo, grande, caixa alta. em(ponto 3D | {tela:[x,y]}, tempo, op)
  K.rotulo = function (texto) {
    const d = el('rotulo');
    d.innerHTML = texto;
    return K.componente({
      esconder() { d.style.display = 'none'; },
      em(ponto, tempo, op = {}) {
        if (tempo < 0) { d.style.display = 'none'; return; }
        K.som('rotulo', K.tc - tempo);
        depois(() => {
          const [x, y] = posTela(ponto, op);
          d.style.display = 'block';
          colocar(d, x, y, pop(tempo, 0.35));
        });
      }
    });
  };

  // Etiqueta de explicação: pílula branca com ponto colorido (vermelho = problema, verde = funciona)
  K.etiqueta = function (texto, cor = 'azul') {
    const d = el('etiqueta', null, `<i style="background:${CSS_COR[cor] || cor}"></i><span>${texto}</span>`);
    return K.componente({
      esconder() { d.style.display = 'none'; },
      em(ponto, tempo, op = {}) {
        if (tempo < 0) return;
        K.som('etiqueta', K.tc - tempo, 0.7);
        depois(() => {
          const [x, y] = posTela(ponto, op);
          d.style.display = 'flex';
          colocar(d, x, y, pop(tempo, 0.28));
        });
      }
    });
  };

  // ✓ verde ou ✗ vermelho. tipo: 'certo' | 'errado'
  K.marca = function (tipo = 'certo') {
    const d = el('marca ' + tipo, null, MARCAS[tipo]);
    return K.componente({
      esconder() { d.style.display = 'none'; },
      em(ponto, tempo, op = {}) {
        if (tempo < 0) return;
        K.som(tipo, K.tc - tempo, 0.8);
        depois(() => {
          const [x, y] = posTela(ponto, op);
          d.style.display = 'block';
          colocar(d, x, y, pop(tempo, 0.3), ` rotate(${(1 - K.clamp(tempo / 0.3)) * -25}deg)`);
        });
      }
    });
  };

  // Cartão branco com número (contador). em(texto, ponto, tempo, legenda pequena)
  K.contador = function () {
    const d = el('contador');
    return K.componente({
      esconder() { d.style.display = 'none'; },
      em(texto, ponto, tempo, sub = '', op = {}) {
        if (tempo < 0) return;
        depois(() => {
          const [x, y] = posTela(ponto, op);
          d.innerHTML = texto + (sub ? `<small>${sub}</small>` : '');
          d.style.display = 'block';
          colocar(d, x, y, pop(tempo, 0.3));
        });
      }
    });
  };
  K.numero = (n) => Math.round(n).toLocaleString('pt-BR');

  // Círculo vermelho em volta de um ponto 3D (fora do padrão: a capa padrão não usa). em(ponto, diâmetro em px, tempo)
  K.circulo = function () {
    const d = el('circulo');
    return K.componente({
      esconder() { d.style.display = 'none'; },
      em(ponto, diam, tempo, op = {}) {
        if (tempo < 0) return;
        depois(() => {
          const [x, y] = posTela(ponto, op);
          Object.assign(d.style, { display: 'block', width: diam + 'px', height: diam + 'px', left: x + 'px', top: y + 'px' });
          d.style.transform = `translate(-50%,-50%) scale(${pop(tempo, 0.3)}) rotate(-8deg)`;
        });
      }
    });
  };

  // Linha de medida entre dois pontos 3D, com texto ao lado. em(a, b, texto, tempo)
  K.medida = function () {
    const linha = el('medida'), txt = el('medida-txt');
    return K.componente({
      esconder() { linha.style.display = 'none'; txt.style.display = 'none'; },
      em(a, b, texto, tempo, op = {}) {
        if (tempo < 0) return;
        depois(() => {
        const [x1, y1] = posTela(a, op), [x2, y2] = posTela(b, op);
        const L = Math.hypot(x2 - x1, y2 - y1) * K.clamp(tempo / 0.4);
        const ang = Math.atan2(y2 - y1, x2 - x1);
        Object.assign(linha.style, { display: 'block', left: x1 + 'px', top: y1 - 4 + 'px', width: L + 'px', transform: `rotate(${ang}rad)` });
        txt.textContent = texto;
        Object.assign(txt.style, { display: 'block', left: (x1 + x2) / 2 + 40 + 'px', top: (y1 + y2) / 2 + 'px', transform: `translate(0,-50%) scale(${pop(tempo - 0.2, 0.3)})` });
        });
      }
    });
  };

  // Termômetro com a temperatura. em(graus, ponto, tempo)
  K.termometro = function (min = 0, max = 45) {
    const d = el('termometro', null, '<div class="tubo"><div class="nivel"></div></div><div class="bulbo"></div><b></b>');
    const nivel = d.querySelector('.nivel'), txt = d.querySelector('b');
    return K.componente({
      esconder() { d.style.display = 'none'; },
      em(graus, ponto, tempo, op = {}) {
        if (tempo < 0) return;
        depois(() => {
        const [x, y] = posTela(ponto, op);
        nivel.style.height = K.clamp((graus - min) / (max - min)) * 100 + '%';
        txt.textContent = Math.round(graus) + '°';
        Object.assign(d.style, { display: 'block', left: x + 'px', top: y + 'px', transform: `translate(-50%,-50%) scale(${pop(tempo)})` });
        });
      }
    });
  };

  // CTA fixo no topo da tela no fim do vídeo (aceita <em> pra destacar em amarelo)
  K.cta = function (html) {
    const d = el('cta', null, html);
    return K.componente({
      esconder() { d.style.display = 'none'; },
      em(tempo) {
        if (tempo < 0) return;
        d.style.display = 'block';
        d.style.transform = `scale(${pop(tempo, 0.35)})`;
      }
    });
  };

  // Cartão final antigo: logo grande por cima da cena (fora do padrão: o fim padrão é o K.cartaoSeguir)
  K.cartaoFinal = function (texto = 'SEGUE PRA MAIS') {
    const d = el('cartao', null, `<img src="${window.LOGO || ''}"><p>${texto}</p>`);
    const img = d.querySelector('img');
    return K.componente({
      esconder() { d.style.display = 'none'; },
      em(tempo) {
        if (tempo < 0) return;
        d.style.display = 'block';
        d.style.opacity = K.clamp(tempo / 0.35);
        img.style.transform = `translateX(-50%) scale(${pop(tempo, 0.5)})`;
      }
    });
  };

  // Cartão de seguir, o fim padrão: cartão branco no topo com o logo (canal/logo.png; sem logo, a inicial na cor do
  // canal), o @ (roteiro.arroba) e o botão "+ Seguir", que é apertado em K.SEGUIR_CLIQUE segundos e vira "Seguindo".
  // em(tempo desde que entrou). A cena põe o som do aperto: K.som('clique', t0 + K.SEGUIR_CLIQUE)
  K.SEGUIR_CLIQUE = 0.95;
  // Os textos do cartão no idioma do vídeo (roteiro.idioma: 'en' ou 'es', do Canal Gringo; sem o campo, português)
  const SEGUIR_TEXTOS = { pt: ['+ Seguir', 'Seguindo', 'Segue o canal'], en: ['+ Follow', 'Following', 'Follow the channel'], es: ['+ Seguir', 'Siguiendo', 'Sigue el canal'] };
  K.cartaoSeguir = function (texto) {
    const rot = K.tl && K.tl.roteiro, [seguir, seguindo, padrao] = SEGUIR_TEXTOS[(rot && rot.idioma) || 'pt'] || SEGUIR_TEXTOS.pt;
    texto = texto || (rot && rot.arroba) || padrao;
    const inicial = (texto.replace(/[^\p{L}\p{N}]/gu, '')[0] || '').toUpperCase();
    const d = el('seguir', null, `<div class="avatar"></div><div class="nome"></div><div class="botao"></div>`);
    const avatar = d.querySelector('.avatar'), nome = d.querySelector('.nome'), botao = d.querySelector('.botao');
    if (window.LOGO) avatar.style.backgroundImage = `url(${window.LOGO})`;
    else avatar.textContent = inicial;
    nome.textContent = texto;
    nome.style.fontSize = Math.min(56, Math.floor(860 / Math.max(1, texto.length))) + 'px';
    const check = '<svg viewBox="0 0 100 100"><path d="M18 54 L40 74 L82 28" fill="none" stroke="currentColor" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    return K.componente({
      esconder() { d.style.display = 'none'; },
      em(tempo) {
        if (tempo < 0) return;
        d.style.display = 'block';
        d.style.opacity = K.clamp(tempo / 0.2);
        d.style.transform = `scale(${(0.6 + 0.4 * pop(tempo, 0.45)).toFixed(3)})`;
        const feito = tempo >= K.SEGUIR_CLIQUE;
        botao.classList.toggle('feito', feito);
        botao.innerHTML = feito ? `${seguindo}${check}` : seguir;
        const aperto = K.faixa(tempo, K.SEGUIR_CLIQUE - 0.08, K.SEGUIR_CLIQUE) * (1 - K.faixa(tempo, K.SEGUIR_CLIQUE, K.SEGUIR_CLIQUE + 0.16));
        const pulso = feito ? 0 : 0.04 * Math.sin(tempo * 9) * K.faixa(tempo, 0.4, 0.5);
        botao.style.transform = `scale(${(1 + pulso - 0.12 * aperto).toFixed(3)})`;
      }
    });
  };

  // ---------- Fora do padrão: sonda, desconstrução, plaquinha e logo de borda dourada ----------
  // O vídeo novo não usa: o fim padrão é o K.cartaoSeguir. Ficam aqui pros vídeos que já chamam essas peças

  // Sonda: robozinho azul-marinho com lente amarela e o anel dourado do logo. Mora na mochila e dispara o feixe que
  // "abre" os objetos. em(pos, t, alvo, feixe): alvo = ponto pra onde a lente olha; feixe = largura do feixe (0 = sem)
  K.sonda = function () {
    const g = new THREE.Group();
    const corpo = K.malha(new THREE.IcosahedronGeometry(0.17, K.redondo ? 1 : 0), K.mat(0x1e3a6e, { roughness: 0.45, metalness: 0.3 }));
    const lente = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffe27a }));
    lente.position.z = 0.14;
    const aro = K.malha(new THREE.TorusGeometry(0.085, 0.018, 6, 16), K.mat(0x0b1020));
    aro.position.z = 0.145;
    const anel = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.016, 6, 40), new THREE.MeshBasicMaterial({ color: 0xf5c518 }));
    const piv = new THREE.Group();
    piv.rotation.set(Math.PI / 2 - 0.45, 0, 0.3);
    piv.add(anel);
    const antena = K.malha(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 4), K.mat(0xaaaaaa));
    antena.position.y = 0.22;
    const ponta = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ color: 0xf7941d }));
    ponta.position.y = 0.31;
    [-1, 1].forEach((s) => {
      const asa = K.malha(new THREE.BoxGeometry(0.16, 0.02, 0.1), K.mat(0x2a5ca8, { metalness: 0.3, roughness: 0.3 }));
      asa.position.x = s * 0.24;
      g.add(asa);
    });
    g.add(corpo, lente, aro, piv, antena, ponta);
    const matFeixe = new THREE.MeshBasicMaterial({ color: 0xffe27a, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const feixe = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 24, 1, true).translate(0, -0.5, 0), matFeixe);
    g.visible = feixe.visible = false;
    K.scene.add(g, feixe);
    const de = new THREE.Vector3(), dir = new THREE.Vector3(), baixo = new THREE.Vector3(0, -1, 0);
    return K.componente({
      g,
      esconder() { g.visible = feixe.visible = false; },
      em(pos, t, alvo = null, largura = 0, escala = 1) {
        g.visible = true;
        g.position.set(pos[0], pos[1] + Math.sin(t * 2.2) * 0.05 * escala, pos[2]);
        g.scale.setScalar(escala);
        if (alvo) g.lookAt(...alvo); else g.rotation.set(0, 0.2, 0);
        anel.rotation.z = t * 2;
        if (!(alvo && largura > 0)) return;
        de.copy(g.position);
        dir.set(...alvo).sub(de);
        const L = dir.length();
        feixe.visible = true;
        feixe.position.copy(de);
        feixe.quaternion.setFromUnitVectors(baixo, dir.normalize());
        feixe.scale.set(largura, L, largura);
        matFeixe.opacity = 0.16 + 0.06 * Math.sin(t * 9);
      }
    });
  };

  // Desconstrução (assinatura do canal): as peças saem do lugar e flutuam dentro de dois anéis de órbita dourados,
  // com bolinhas correndo neles e brilhos. d.peca(obj, desloca, giro): desloca é no espaço do pai do obj.
  // d.em(e, t, op): e = 0 montado, 1 aberto; op = { centro, escala, pecas: [e de cada peça] }.
  // A cada quadro guarda a posição que a cena deu à peça e devolve no esconder(), então não acumula deslocamento
  K.desconstrucao = function (seed = 9) {
    const pecas = [], aneis = [], contas = [], brilhos = [];
    const g = new THREE.Group();
    [[2.7, -0.38, 0.28], [3.1, 0.3, -0.22]].forEach(([r, rx, rz], i) => {
      const a = new THREE.Mesh(new THREE.TorusGeometry(r, 0.03, 6, 90), new THREE.MeshBasicMaterial({ color: 0xf5c518, transparent: true }));
      a.rotation.set(Math.PI / 2 + rx, 0, rz);
      g.add(a);
      aneis.push(a);
      for (let k = 0; k < 2; k++) {
        const c = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), new THREE.MeshBasicMaterial({ color: k ? 0xf7941d : 0xfff2a0 }));
        c.userData = { anel: a, r, fase: k * Math.PI + i };
        g.add(c);
        contas.push(c);
      }
    });
    const r = K.rand(seed);
    for (let i = 0; i < 36; i++) {
      const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), new THREE.MeshBasicMaterial({ color: 0xfff2a0 }));
      s.userData = { p: [(r() - 0.5) * 6, (r() - 0.5) * 5, (r() - 0.5) * 3], fase: r() * 6 };
      g.add(s);
      brilhos.push(s);
    }
    const halo = K.halo(0xfff2a0, 5);
    g.add(halo);
    g.visible = false;
    K.scene.add(g);
    let movidas = [];
    const v = new THREE.Vector3();
    return K.componente({
      g,
      peca(obj, desloca, giro = [0, 0, 0]) { pecas.push({ obj, desloca, giro }); return pecas.length - 1; },
      esconder() {
        g.visible = false;
        movidas.forEach(({ obj, pos, rot }) => { obj.position.copy(pos); obj.rotation.copy(rot); });
        movidas = [];
      },
      em(e, t, op = {}) {
        const { centro = [0, 0, 0], escala = 1, sx = 1, sy = 1 } = op;
        movidas = pecas.map((p) => ({ obj: p.obj, pos: p.obj.position.clone(), rot: p.obj.rotation.clone() }));
        pecas.forEach((p, i) => {
          const k = op.pecas && op.pecas[i] != null ? op.pecas[i] : e;
          const bob = Math.sin(t * 1.6 + i) * 0.08 * k * escala;
          const { pos, rot } = movidas[i];
          p.obj.position.set(pos.x + p.desloca[0] * k * sx, pos.y + p.desloca[1] * k * sy + bob, pos.z + p.desloca[2] * k);
          p.obj.rotation.set(rot.x + p.giro[0] * k * Math.sin(t * 0.5 + i), rot.y + p.giro[1] * k * t * 0.4, rot.z + p.giro[2] * k);
        });
        const a = K.suave(K.clamp(e));
        if (a <= 0.02) return;
        g.visible = true;
        g.position.set(...centro);
        g.scale.setScalar(escala);
        aneis.forEach((an) => { an.scale.setScalar(0.4 + 0.6 * a); an.material.opacity = a; });
        contas.forEach((c) => {
          const { anel, r: raio, fase } = c.userData;
          const ang = fase + t * 0.9;
          v.set(Math.cos(ang) * raio * (0.4 + 0.6 * a), Math.sin(ang) * raio * (0.4 + 0.6 * a), 0).applyEuler(anel.rotation);
          c.position.copy(v);
        });
        brilhos.forEach((s) => {
          const { p, fase } = s.userData;
          s.position.set(p[0], p[1] + Math.sin(t + fase) * 0.15, p[2]);
          s.scale.setScalar(a * (0.6 + 0.6 * Math.abs(Math.sin(t * 3 + fase))));
          s.rotation.y = t * 2 + fase;
        });
        halo.material.opacity = a * 0.45;
      }
    });
  };

  // Plaquinha de madeira fincada no chão (frente pra +z). A cena posiciona e liga/desliga
  K.plaquinha = function (texto = 'SEGUE A\nPÁGINA!') {
    const g = new THREE.Group();
    const madeira = K.mat(0x8a5a32);
    [-0.55, 0.55].forEach((x) => {
      const pe = K.malha(new THREE.BoxGeometry(0.09, 1.3, 0.09), madeira);
      pe.position.set(x, 0.65, -0.03);
      g.add(pe);
    });
    const tabua = K.malha(new THREE.BoxGeometry(1.5, 0.82, 0.06), madeira);
    tabua.position.y = 1.15;
    const frente = K.placa(texto, { larg: 1.36, alt: 0.7, fundo: '#e9c48f', cor: '#3a2212', borda: '#6b4423' });
    K.scene.remove(frente);
    frente.position.set(0, 1.15, 0.035);
    g.add(tabua, frente);
    K.scene.add(g);
    return g;
  };

  // Logo do canal no topo (quadrado com borda dourada brilhando), pro final fixo
  K.logoFinal = function () {
    const d = document.createElement('div');
    d.style.cssText = 'position:absolute;left:50%;top:250px;width:340px;height:340px;margin-left:-170px;display:none;z-index:18;' +
      'border-radius:56px;border:10px solid #f5c518;box-shadow:0 0 60px rgba(245,197,24,.55),0 14px 0 rgba(0,0,0,.35);overflow:hidden;' +
      `background:#000 url(${window.LOGO || ''}) center/cover`;
    K.palco.appendChild(d);
    return K.componente({
      esconder() { d.style.display = 'none'; },
      em(tempo) {
        if (tempo < 0) return;
        d.style.display = 'block';
        d.style.transform = `scale(${pop(tempo, 0.45).toFixed(3)})`;
      }
    });
  };

  // Legenda palavra por palavra; palavra-chave (marcada com *asteriscos* no roteiro) em amarelo
  K.mostrarLegenda = function (tl, t) {
    let atual = null;
    for (const f of tl.frases) {
      if (t < f.inicio || t > f.fim + 0.12) continue;
      for (const w of f.palavras) if (t >= w.inicio) atual = w;
    }
    if (!atual) { K.legenda.innerHTML = ''; return; }
    const s = 0.86 + 0.14 * K.saiVolta(K.clamp((t - atual.inicio) / 0.09));
    const txt = atual.texto.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    K.legenda.innerHTML = `<span class="${atual.chave ? 'chave' : ''}" style="transform:scale(${s.toFixed(3)})">${txt}</span>`;
  };

  // Gancho: nas frases com gancho: true, a pergunta da capa fica no topo (continua a thumbnail dos 3 primeiros quadros)
  let elGancho = null;
  const htmlTitulo = (titulo) => '<span>' + titulo.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/\n/g, '<br>') + '</span>';
  // A pergunta numa caixa branca; a letra diminui até a linha mais larga caber (cada linha do \n fica inteira)
  function tituloCapa(titulo) {
    const d = el('capa-titulo', null, htmlTitulo(titulo));
    d.style.whiteSpace = 'nowrap';
    for (let px = 88; px > 48; px -= 4) {
      d.style.fontSize = px + 'px';
      if (d.firstChild.getBoundingClientRect().width <= 1080 - 2 * 56) break;
    }
    return d;
  }
  function mostrarGancho(tl, t) {
    const f = tl.capa && tl.frases.find((f) => f.gancho && t >= f.inicio - 0.2 && t < f.fim + 0.25);
    if (!f) { if (elGancho) elGancho.style.display = 'none'; return; }
    if (!elGancho) elGancho = tituloCapa(tl.capa);
    elGancho.style.display = 'block';
    elGancho.style.opacity = (1 - K.faixa(t, f.fim, f.fim + 0.25)).toFixed(3);
    elGancho.style.transform = `scale(${(1 + 0.025 * Math.sin(t * 9)).toFixed(4)})`;
  }

  // ---------- Sons ----------

  // A cena registra cada efeito sonoro no instante em que acontece (tempo da cena).
  // Repetir a chamada a cada quadro não duplica. O render junta tudo em K.sons e mixa no ffmpeg.
  // dur: corta o som nesse tamanho (pra loops como água correndo)
  K.sons = [];
  const sonsVistos = new Set();
  K.som = function (nome, em, ganho = 1, dur) {
    if (em == null || !(em >= 0)) return;
    const k = nome + '@' + em.toFixed(2);
    if (sonsVistos.has(k)) return;
    sonsVistos.add(k);
    K.sons.push({ nome, em: +em.toFixed(3), ganho, dur });
  };

  // ---------- Videogame: falha, rebobina, pausa, play, avança ----------

  // Eventos por frase no roteiro (campo "jogo"):
  //   falha     congela em preto e branco no fim da frase (congela: fração da frase, padrão 0.85)
  //   conserta  ⏪ rebobina até antes da falha (volta: quantas frases antes) e fica em ⏸ enquanto monta
  //             (rebobina: duração do ⏪ em segundos, padrão K.REBOBINA). Use pouco: 1 ou 2 por vídeo
  //   corrige   conserto sem voltar no tempo: a falha some e a cena corta direto pra montagem (mais fluido)
  //   pausa     só ⏸      play  ▶ no começo da frase      avanca  ⏩ o tempo passando
  K.REBOBINA = 0.8;
  K.FOV = 50; // abertura vertical padrão da câmera nas cenas v2 (em 9:16 a horizontal fica em ~29°)
  K.prepararJogo = function (tl) {
    const ev = [];
    let falha = null;
    tl.frases.forEach((f, i) => {
      const prox = tl.frases[i + 1];
      const fim = prox ? prox.inicio : tl.total;
      if (f.jogo === 'falha') {
        const ini = f.inicio + (f.congela != null ? f.congela : 0.85) * (f.fim - f.inicio);
        falha = { tipo: 'falha', ini, fim, volta: tl.frases[Math.max(0, i - (f.volta || 0))].inicio };
        ev.push(falha);
        K.som('congela', ini);
      } else if (f.jogo === 'conserta') {
        const volta = f.volta != null ? tl.frases[Math.max(0, i - f.volta)].inicio : falha ? falha.volta : f.inicio;
        const R = f.rebobina || K.REBOBINA;
        ev.push({ tipo: 'rebobina', ini: f.inicio, fim: f.inicio + R, de: falha ? falha.ini : f.inicio - 0.01, ate: volta + 0.05 });
        ev.push({ tipo: 'pausa', ini: f.inicio + R, fim });
        f.reb = R;
        K.som('rebobina', f.inicio);
        K.som('clique', f.inicio + R, 0.8);
      } else if (f.jogo === 'corrige') {
        K.som('whoosh', f.inicio, 0.35);
      } else if (f.jogo === 'pausa') {
        ev.push({ tipo: 'pausa', ini: f.inicio, fim });
        K.som('clique', f.inicio, 0.8);
      } else if (f.jogo === 'play') {
        ev.push({ tipo: 'play', ini: f.inicio, fim: Math.min(fim, f.inicio + 1.1) });
        K.som('clique', f.inicio, 0.8);
      } else if (f.jogo === 'avanca') {
        ev.push({ tipo: 'avanca', ini: f.inicio, fim });
        K.som('avanca', f.inicio, 0.7);
      }
    });
    K.eventosJogo = ev;
  };

  K.estadoJogo = function (t) {
    const j = { tc: t, cinza: 0, icone: null, desde: 0, vhs: 0, flash: 0, zoom: 0 };
    for (const e of K.eventosJogo || []) {
      if (t < e.ini || t >= e.fim) continue;
      const dt = t - e.ini;
      if (e.tipo === 'falha') {
        j.tc = e.ini;
        j.cinza = K.clamp(dt / 0.1);
        j.flash = 1 - K.clamp(dt / 0.22);
        j.zoom = K.suave(K.clamp(dt / 0.6));
      } else if (e.tipo === 'rebobina') {
        const x = dt / (e.fim - e.ini);
        j.tc = K.lerp(e.de, e.ate, K.suave(x));
        j.cinza = 1 - K.faixa(x, 0.65, 1);
        j.vhs = 1;
        j.zoom = 1 - K.suave(x);
        j.icone = 'rebobina'; j.desde = dt;
      } else {
        j.icone = e.tipo; j.desde = dt;
        if (e.tipo === 'play') j.fimIcone = e.fim - t;
      }
    }
    return j;
  };

  let iconeAtual = null;
  function aplicarJogo(j, t) {
    const filtro = j.cinza > 0 ? `grayscale(${j.cinza.toFixed(3)}) contrast(${(1 + 0.18 * j.cinza).toFixed(3)})` : 'none';
    K.canvas.style.filter = filtro;
    const jit = j.vhs ? Math.sin(t * 97) * 7 : 0;
    K.canvas.style.transform = `translateX(${jit.toFixed(1)}px) scale(${(1 + 0.04 * j.zoom).toFixed(4)})`;
    K.ui.flash.style.opacity = (j.flash * 0.7).toFixed(3);
    K.ui.vhs.style.display = j.vhs ? 'block' : 'none';
    if (j.vhs) K.ui.vhs.querySelectorAll('.faixa').forEach((f, i) => { f.style.top = (((t * (1.7 + i * 0.9) + i * 0.4) % 1) * (H + 140) - 70) + 'px'; });
    const ic = K.ui.icone;
    if (!j.icone) { ic.style.display = 'none'; iconeAtual = null; return; }
    if (iconeAtual !== j.icone) { ic.innerHTML = ICONES[j.icone]; iconeAtual = j.icone; }
    let s = pop(j.desde, 0.25), op = 1;
    if (j.icone === 'pausa') op = 0.75 + 0.25 * Math.cos(j.desde * 5);
    if (j.icone === 'play' && j.fimIcone != null) op = K.clamp(j.fimIcone / 0.3);
    ic.style.display = 'block';
    ic.style.opacity = op.toFixed(3);
    ic.style.transform = `scale(${s.toFixed(3)})`;
  }

  // ---------- Direção: câmera, ator e peças (cada frase com a sua cena) ----------
  // Ajudantes pra escrever o plano de cada frase em poucas linhas, sem calcular coordenada de câmera na mão:
  //   câmera   K.filmar(alvo, 'chegando', B.p, { plano: 'perto', lado: 'direita', altura: 'baixo' })
  //   ator     menino.colocar(pos, olhar) · menino.irPara(de, ate, x, t) · menino.reagir('susto', t)
  //   peças    K.peca({...}) · K.entraNo('pilha', pilha, 'desliza') · K.entrar(peca, 'cai', t) · K.falhar(peca, 'treme', t)
  // O guia: referencias/COMO-FAZER-O-VIDEO.md e referencias/cardapio-de-cenas.md

  // Erro de quem escreve a cena (nome que não existe): aparece uma vez no terminal do render, como "página: ..."
  const avisados = new Set();
  const avisar = (msg) => { if (!avisados.has(msg)) { avisados.add(msg); console.error(msg); } };

  // Lugar de cada peça que os ajudantes mexem. No começo de todo quadro a peça volta pra casa (nada guarda estado de
  // um quadro pro outro: o ⏪, as prévias e o --trecho pulam pra qualquer instante)
  const casas = new Map();
  function casaDe(obj) {
    let c = casas.get(obj);
    if (!c) {
      c = { pos: obj.position.clone(), rot: obj.rotation.clone(), esc: obj.scale.clone(), vis: obj.visible };
      casas.set(obj, c);
      obj.userData.casa = c;
    }
    return c;
  }
  // Guarda o lugar da peça agora (as feitas com K.peca já guardam). Chamar no montar, com a peça já no lugar
  K.lugar = (obj) => { casaDe(obj); return obj; };
  // Dá nome a uma peça, pro "mostra" de cada frase no roteiro.json: a revisão (--revisar) confere se o que a frase
  // mostra aparece na tela, no quadro e num tamanho que dá pra ver. O K.pecas, o K.boneco ("personagem") e os cenários
  // prontos (os C.objetos) já dão nome; o resto, no montar: K.nomear('lanterna', lanterna). Acento, maiúscula e espaço
  // não contam ("Lâmpada" acha "lampada")
  const NOMES = new Map();
  const chaveNome = (n) => String(n).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/[\s-]+/g, '_');
  K.nomear = function (nome, obj) {
    const o = obj && (obj.isObject3D ? obj : obj.g && obj.g.isObject3D ? obj.g : null);
    if (!o) { avisar(`K.nomear: "${nome}" não é uma peça (passe o objeto, o grupo ou o que o kit devolveu)`); return obj; }
    const k = chaveNome(nome);
    if (!NOMES.has(k)) NOMES.set(k, { nome: String(nome), objs: [] });
    if (!NOMES.get(k).objs.includes(o)) NOMES.get(k).objs.push(o);
    return obj;
  };
  // Tira os nomes de uma peça (os figurantes dos cenários não contam como "personagem")
  K.semNome = (obj) => NOMES.forEach((n) => { n.objs = n.objs.filter((o) => o !== obj); });
  // Os nomes que existem na cena (a revisão mostra quando o "mostra" pede um nome que não existe)
  K.nomesDasPecas = () => [...NOMES.values()].filter((n) => n.objs.length).map((n) => n.nome);
  const tingidos = new Map();
  function tingir(obj, fn) {
    obj.traverse((o) => {
      if (!o.isMesh || o.userData.capa) return;
      (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
        if (!m || !m.color) return;
        if (!tingidos.has(m)) tingidos.set(m, { cor: m.color.clone(), em: m.emissive ? m.emissive.clone() : null, emI: m.emissiveIntensity });
        fn(m, tingidos.get(m));
      });
    });
  }
  function restaurar() {
    casas.forEach((c, obj) => { obj.position.copy(c.pos); obj.rotation.copy(c.rot); obj.scale.copy(c.esc); obj.visible = c.vis; });
    tingidos.forEach((o, m) => { m.color.copy(o.cor); if (o.em) m.emissive.copy(o.em); m.emissiveIntensity = o.emI; });
  }

  // Caixa (no mundo) do que a câmera enquadra: ponto [x, y, z] (caixa de lado tam em volta), objeto do THREE, Box3,
  // personagem ou uma lista disso tudo. Peça dos ajudantes conta no lugar dela, mesmo no meio de uma entrada
  function caixaEmCasa(obj) {
    const c = casas.get(obj);
    const salvo = c && { pos: obj.position.clone(), rot: obj.rotation.clone(), esc: obj.scale.clone() };
    if (c) { obj.position.copy(c.pos); obj.rotation.copy(c.rot); obj.scale.copy(c.esc); }
    obj.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(obj);
    if (c) { obj.position.copy(salvo.pos); obj.rotation.copy(salvo.rot); obj.scale.copy(salvo.esc); obj.updateMatrixWorld(true); }
    if (b.isEmpty()) b.setFromCenterAndSize(obj.getWorldPosition(new THREE.Vector3()), new THREE.Vector3(0.5, 0.5, 0.5));
    return b;
  }
  function caixaDe(alvo, tam = 1) {
    const b = new THREE.Box3();
    const somar = (a) => {
      if (a == null) return;
      if (Array.isArray(a) && typeof a[0] === 'number') {
        const h = tam / 2;
        b.union(new THREE.Box3(new THREE.Vector3(a[0] - h, a[1] - h, a[2] - h), new THREE.Vector3(a[0] + h, a[1] + h, a[2] + h)));
      } else if (Array.isArray(a)) a.forEach(somar);
      else if (a.isBox3) b.union(a);
      else if (a.g && a.cabeca) {
        // Personagem: a caixa dele em pé (a pose não mexe no enquadramento)
        const p = a.g.position, s = a.g.scale.y || 1;
        b.union(new THREE.Box3(new THREE.Vector3(p.x - 0.4 * s, p.y, p.z - 0.3 * s), new THREE.Vector3(p.x + 0.4 * s, p.y + 1.6 * s, p.z + 0.3 * s)));
      } else if (a.isObject3D) b.union(caixaEmCasa(a));
      else if (a.g && a.g.isObject3D) b.union(caixaEmCasa(a.g)); // componentes do kit que têm .g (carro, balde...)
    };
    somar(alvo);
    if (b.isEmpty()) b.setFromCenterAndSize(new THREE.Vector3(0, 1, 0), new THREE.Vector3(2, 2, 2));
    return b;
  }

  // Caixas (THREE.Box3) que a câmera dos ajudantes não atravessa: os cenários prontos põem aqui os prédios, as paredes e
  // as máquinas. Vazio nos vídeos sem cenário pronto
  K.obstaculos = [];

  // Tipos de plano (o quanto o assunto ocupa a tela), lados e alturas da câmera
  const PLANOS = { aberto: 1.7, medio: 1.25, perto: 0.9, detalhe: 0.62 };
  const LADOS = { frente: 0, direita: 35, esquerda: -35, tras: 180, perfil_direita: 80, perfil_esquerda: -80 };
  const ALTURAS = { cima: 72, alto: 32, olho: 10, baixo: -6 };
  const valorDe = (v, tabela, padrao, campo) => {
    if (typeof v === 'number') return v;
    if (v == null) return padrao;
    if (v in tabela) return tabela[v];
    avisar(`câmera: ${campo} "${v}" não existe (use ${Object.keys(tabela).join(', ')} ou um número)`);
    return padrao;
  };

  // Câmera que enquadra o alvo no 9:16 (mira e posição). op: plano ('aberto' 'medio' 'perto' 'detalhe' ou número),
  // lado ('frente' 'direita' 'esquerda' 'tras' 'perfil_direita' 'perfil_esquerda' ou graus; frente = olhando do +z),
  // altura ('cima' 'alto' 'olho' 'baixo' ou graus), espacoCima / espacoBaixo (0 a 1: o assunto desce ou sobe na tela e
  // sobra espaço pro texto), desliza (o assunto vai pro lado: -1 a 1), tam (lado da caixa quando o alvo é um ponto),
  // fora (a câmera fica fora desse objeto, com folga de op.folga = 0,5: passe o objeto inteiro quando filmar de perto
  // uma peça que fica dentro dele)
  K.enquadrar = function (alvo, op = {}) {
    const b = caixaDe(alvo, op.tam || 1);
    const c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3());
    const az = THREE.MathUtils.degToRad(valorDe(op.lado, LADOS, 0, 'lado'));
    const el = THREE.MathUtils.degToRad(valorDe(op.altura, ALTURAS, 10, 'altura'));
    const zoom = valorDe(op.plano, PLANOS, 1.25, 'plano');
    const tv = Math.tan(THREE.MathUtils.degToRad((op.fov || K.FOV) / 2)), th = tv * (W / H);
    // Em 9:16 a câmera enxerga pouco de lado: a largura costuma mandar na distância
    const larg = Math.abs(Math.cos(az)) * s.x + Math.abs(Math.sin(az)) * s.z;
    const prof = Math.abs(Math.sin(az)) * s.x + Math.abs(Math.cos(az)) * s.z;
    const alt = s.y * Math.cos(el) + prof * Math.abs(Math.sin(el));
    const d = Math.max(alt / 2 / tv, larg / 2 / th, 0.6) * zoom + prof / 2;
    const pos = new THREE.Vector3(c.x + Math.sin(az) * Math.cos(el) * d, c.y + Math.sin(el) * d, c.z + Math.cos(az) * Math.cos(el) * d);
    const mira = c.clone();
    if (op.espacoCima) mira.y += op.espacoCima * d * tv;
    if (op.espacoBaixo) mira.y -= op.espacoBaixo * d * tv;
    if (op.desliza) {
      const lado = new THREE.Vector3(Math.cos(az), 0, -Math.sin(az)).multiplyScalar(-op.desliza * d * th);
      pos.add(lado);
      mira.add(lado);
    }
    // A câmera não entra no objeto (op.fora: o objeto inteiro, a casa): recua na mesma direção até sair da caixa dele.
    // Sem isso, o close de uma peça que fica dentro de outra (a trava embaixo do guarda-chuva) põe a lente lá dentro
    if (op.fora) {
      const cx = caixaDe(op.fora).expandByScalar(op.folga ?? 0.5), dir = pos.clone().sub(mira).normalize();
      for (let k = 0; k < 120 && cx.containsPoint(pos); k++) pos.addScaledVector(dir, 0.1);
    }
    // Cenário pronto: a câmera não fica dentro nem atrás de um prédio, parede ou máquina do cenário (K.obstaculos). Vem da
    // mira até a posição e para antes da primeira caixa no caminho, como a câmera de videogame. op.obstaculos: false tira
    if (K.obstaculos.length && op.obstaculos !== false) {
      const dir = pos.clone().sub(mira), dist = dir.length();
      dir.normalize();
      const raio = new THREE.Ray(mira, dir), bate = new THREE.Vector3();
      let livre = dist;
      K.obstaculos.forEach((cx) => {
        if (cx.containsPoint(mira)) return; // filmando a própria peça do cenário
        if (raio.intersectBox(cx, bate)) livre = Math.min(livre, bate.distanceTo(mira));
      });
      if (livre < dist) pos.copy(mira).addScaledVector(dir, Math.max(0.9, livre - 0.4));
    }
    // Câmera no chão fica no meio do capim (tufos de até ~0,5): no mínimo 0,75 de altura
    if (op.chao !== false) pos.y = Math.max(op.minimo ?? 0.75, pos.y);
    const r = { pos: pos.toArray(), alvo: mira.toArray() };
    if (op.fov) r.fov = op.fov;
    return r;
  };

  const MOVIMENTOS = ['chegando', 'afastando', 'girando', 'subindo', 'descendo', 'passando', 'parado', 'mergulho', 'revelando'];
  K.MOVIMENTOS = MOVIMENTOS;
  // Câmera viva numa frase: um movimento com nome, do começo ao fim do plano (p de 0 a 1, normalmente B.p).
  // 'chegando' (aproxima) 'afastando' 'girando' (em volta; op.sentido -1 gira pro outro lado, op.angulo em graus)
  // 'subindo' 'descendo' 'passando' (de lado) 'parado' (quase parado, respirando) 'mergulho' (do alto até o plano)
  // 'revelando' (do detalhe até o plano aberto). Aceita as mesmas opções do K.enquadrar. Devolve { de, ate }
  K.filmar = function (alvo, mov = 'chegando', p = 0, op = {}) {
    if (!MOVIMENTOS.includes(mov)) { avisar(`K.filmar: movimento "${mov}" não existe (use ${MOVIMENTOS.join(', ')})`); mov = 'chegando'; }
    const zoom = valorDe(op.plano, PLANOS, 1.25, 'plano'), az = valorDe(op.lado, LADOS, 0, 'lado'), el = valorDe(op.altura, ALTURAS, 10, 'altura');
    const v = (m = {}) => K.enquadrar(alvo, Object.assign({}, op, { plano: zoom, lado: az, altura: el }, m));
    const giro = ((op.sentido || 1) * (op.angulo || 36)) / 2;
    const [de, ate] = {
      chegando: () => [v({ plano: zoom * 1.25 }), v({ plano: zoom * 0.92 })],
      afastando: () => [v({ plano: zoom * 0.8 }), v({ plano: zoom * 1.15 })],
      girando: () => [v({ lado: az - giro }), v({ lado: az + giro })],
      subindo: () => [v({ altura: el - 8 }), v({ altura: el + 16 })],
      descendo: () => [v({ altura: el + 18 }), v({ altura: el - 4 })],
      passando: () => [v({ desliza: -0.3 }), v({ desliza: 0.3 })],
      parado: () => [v(), v({ plano: zoom * 0.96 })],
      mergulho: () => [v({ altura: Math.max(el, 10) + 40, plano: zoom * 1.6 }), v()],
      revelando: () => [v({ plano: zoom * 0.45 }), v({ plano: zoom * 1.12 })]
    }[mov]();
    K.plano(de, ate, p);
    return { de, ate };
  };

  const ENTRADAS = { cai: 0.7, desliza: 0.55, encaixa: 0.4, cresce: 0.45, gira: 0.85, sobe: 0.6, surge: 0.3 };
  const SOM_ENTRADA = { cai: 'baque', desliza: 'whoosh', encaixa: 'trava', cresce: 'brilho', gira: 'whoosh', sobe: 'whoosh', surge: 'brilho' };
  K.ENTRADAS = Object.keys(ENTRADAS);
  let poeiraKit = null;
  // Peça nova entrando com movimento, som e o brilho amarelo (K.destaque). tempo: segundos desde que ela começou a
  // entrar (negativo = ainda não apareceu). tipo: 'cai' (do céu, quicando) 'desliza' (de op.de = [x, y, z] relativo,
  // padrão vindo da esquerda) 'encaixa' (de cima, curto, com clique) 'cresce' 'gira' 'sobe' (brota do chão) 'surge'.
  // op: dur, altura, de, som (nome ou false), ganho, destaque (false tira o brilho). Devolve o quanto já entrou (0 a 1)
  K.entrar = function (obj, tipo = 'cai', tempo = 0, op = {}) {
    if (!ENTRADAS[tipo]) { avisar(`K.entrar: entrada "${tipo}" não existe (use ${K.ENTRADAS.join(', ')})`); tipo = 'cai'; }
    const c = casaDe(obj);
    if (tempo < 0) { obj.visible = false; return 0; }
    obj.visible = true;
    const dur = op.dur || ENTRADAS[tipo], x = K.clamp(tempo / dur), e = K.saiVolta(x), t0 = K.tc - tempo;
    if (tipo === 'cai') obj.position.y = c.pos.y + K.queda(tempo, op.altura ?? 4, dur);
    else if (tipo === 'desliza' || tipo === 'encaixa') {
      const d = op.de || (tipo === 'encaixa' ? [0, 0.7, 0] : [-2.5, 0, 0]);
      const k = tipo === 'encaixa' ? 1 - K.suave(x) : 1 - e;
      obj.position.set(c.pos.x + d[0] * k, c.pos.y + d[1] * k, c.pos.z + d[2] * k);
      const dt = tempo - dur;
      if (tipo === 'encaixa' && dt >= 0 && dt < 0.18) obj.position.y -= 0.025 * Math.sin(dt * 60) * (1 - dt / 0.18);
    } else if (tipo === 'cresce' || tipo === 'surge') obj.scale.copy(c.esc).multiplyScalar(Math.max(0.001, tipo === 'surge' ? 0.6 + 0.4 * e : e));
    else if (tipo === 'gira') {
      obj.scale.copy(c.esc).multiplyScalar(Math.max(0.001, K.suave(K.clamp(x * 1.6))));
      obj.rotation.y = c.rot.y + (1 - K.suave(x)) * Math.PI * 3;
    } else if (tipo === 'sobe') obj.position.y = c.pos.y - (op.altura ?? 1.5) * (1 - e);
    if (op.som !== false) {
      const imp = tipo === 'cai' ? t0 + dur * K.QUICA_IMPACTO : tipo === 'encaixa' ? t0 + dur : t0;
      if (tipo === 'cai') K.som('whoosh', Math.max(0, t0 - 0.02), 0.45);
      K.som(op.som || SOM_ENTRADA[tipo], imp, op.ganho ?? 0.8);
    }
    // Caiu no chão: poeira
    if (tipo === 'cai' && op.poeira !== false) {
      const cx = caixaEmCasa(obj);
      if (cx.min.y < 0.3) {
        poeiraKit = poeiraKit || K.poeira(31);
        poeiraKit.em([(cx.min.x + cx.max.x) / 2, 0, (cx.min.z + cx.max.z) / 2], tempo - dur * K.QUICA_IMPACTO, Math.max(0.6, (cx.max.x - cx.min.x) * 1.2));
      }
    }
    if (op.destaque !== false) {
      if (!obj.userData.dq) obj.userData.dq = K.destaque(obj);
      obj.userData.dq.em(tempo - dur * 0.8, 1.4);
    }
    return x;
  };

  // A peça brilha em amarelo (o destaque do "Esse é o X"): tempo desde que começou, dur em segundos
  K.brilhar = function (obj, tempo = 0, dur = 1.6) {
    if (!obj.userData.dq) obj.userData.dq = K.destaque(obj);
    obj.userData.dq.em(tempo, dur);
  };

  const FALHAS = ['treme', 'tomba', 'murcha', 'apaga', 'esquenta', 'congela', 'pisca', 'quebra'];
  const SOM_FALHA = { treme: 'range', tomba: 'baque', murcha: 'desliga', apaga: 'desliga', esquenta: 'fogo', congela: 'estalo', pisca: 'zap', quebra: 'racha' };
  K.FALHAS = FALHAS;
  const cQuente = new THREE.Color(0xff3b1f), cGelo = new THREE.Color(0xbfe6ff);
  let lascasKit = null;
  // O problema na tela: a peça falhando. tempo: segundos desde que a falha começou. tipo: 'treme' 'tomba' (cai de lado;
  // op.lado -1 pro outro) 'murcha' 'apaga' 'esquenta' (fica vermelha e brilha) 'congela' (fica azul) 'pisca' (falhando)
  // 'quebra' (treme e solta lascas). op: dur, forca (0 a 1), som (nome ou false), ganho
  K.falhar = function (obj, tipo = 'treme', tempo = 0, op = {}) {
    if (!FALHAS.includes(tipo)) { avisar(`K.falhar: falha "${tipo}" não existe (use ${FALHAS.join(', ')})`); tipo = 'treme'; }
    const c = casaDe(obj);
    if (tempo < 0) return;
    const dur = op.dur || 0.5, k = K.clamp(tempo / dur), f = op.forca ?? 1, t0 = K.tc - tempo;
    if (tipo === 'treme' || tipo === 'quebra') {
      const a = (tipo === 'quebra' ? 0.035 * (1 - K.faixa(tempo, 0.3, 0.6)) : 0.05) * f;
      obj.position.x = c.pos.x + Math.sin(tempo * 70) * a;
      obj.position.z = c.pos.z + Math.cos(tempo * 53) * a * 0.6;
      obj.rotation.z = c.rot.z + Math.sin(tempo * 47) * a;
      if (tipo === 'quebra') {
        const cx = caixaEmCasa(obj);
        lascasKit = lascasKit || K.lascas(33, 0x8a8f96);
        lascasKit.em(cx.getCenter(new THREE.Vector3()).toArray(), tempo - 0.25, 0);
      }
    } else if (tipo === 'tomba') {
      // Gira em volta da quina de baixo (o lado pra onde ela cai)
      const cx = caixaEmCasa(obj), lado = op.lado || 1, ang = -lado * 1.35 * K.quica(k) * f;
      const piv = new THREE.Vector3(lado > 0 ? cx.max.x : cx.min.x, cx.min.y, (cx.min.z + cx.max.z) / 2);
      const pai = obj.parent;
      if (pai) { pai.updateMatrixWorld(true); pai.worldToLocal(piv); }
      const rel = c.pos.clone().sub(piv), cs = Math.cos(ang), sn = Math.sin(ang);
      obj.position.set(piv.x + rel.x * cs - rel.y * sn, piv.y + rel.x * sn + rel.y * cs, c.pos.z);
      obj.rotation.z = c.rot.z + ang;
    } else if (tipo === 'murcha') {
      obj.scale.set(c.esc.x * (1 + 0.25 * k * f), c.esc.y * (1 - 0.5 * k * f), c.esc.z * (1 + 0.25 * k * f));
    } else if (tipo === 'apaga') {
      tingir(obj, (m, o) => { m.color.copy(o.cor).multiplyScalar(1 - 0.55 * k * f); if (o.em) m.emissiveIntensity = (o.emI || 0) * (1 - k); });
    } else if (tipo === 'esquenta') {
      tingir(obj, (m, o) => {
        m.color.copy(o.cor).lerp(cQuente, 0.65 * k * f);
        if (o.em) { m.emissive.copy(cQuente); m.emissiveIntensity = (0.3 + 0.2 * Math.sin(tempo * 8)) * k * f; }
      });
    } else if (tipo === 'congela') tingir(obj, (m, o) => { m.color.copy(o.cor).lerp(cGelo, 0.7 * k * f); });
    else if (tipo === 'pisca') obj.visible = c.vis && Math.sin(tempo * 38) + Math.sin(tempo * 23) > -0.6;
    if (op.som !== false) K.som(op.som || SOM_FALHA[tipo], t0 + (tipo === 'tomba' ? dur * K.QUICA_IMPACTO : 0), op.ganho ?? 0.7, tipo === 'esquenta' ? 1.2 : undefined);
  };

  const agenda = [];
  let blocosAgenda = null;
  // Agenda das peças: K.entraNo('pilha', pilha, 'desliza', op) diz em que plano do roteiro.json a peça entra (chamar
  // no montar). Antes desse plano ela não aparece (só no gancho e na capa, que mostram o objeto pronto; op.noGancho:
  // false tira); no plano, entra com o movimento (logo no começo, depois do ⏪, ou na palavra op.palavra); depois,
  // fica no lugar. Aceita as opções do K.entrar e op.atraso (segundos depois do começo do plano)
  K.entraNo = function (plano, obj, tipo = 'cai', op = {}) {
    casaDe(obj);
    agenda.push({ plano, obj, tipo, op });
    return obj;
  };
  function aplicarAgenda(tc, capa) {
    if (!agenda.length || !K.tl) return;
    if (!blocosAgenda) {
      blocosAgenda = K.blocos(K.tl);
      agenda.forEach((a) => {
        a.i = blocosAgenda.findIndex((b) => b.plano === a.plano);
        if (a.i < 0) avisar(`K.entraNo: o plano "${a.plano}" não existe no roteiro.json (planos: ${[...new Set(blocosAgenda.map((b) => b.plano))].join(', ')})`);
      });
    }
    const B = capa ? null : K.blocoEm(blocosAgenda, tc);
    const bi = capa ? Infinity : blocosAgenda.indexOf(B.bloco);
    const pronto = capa || B.plano === 'gancho';
    agenda.forEach((a) => {
      if (a.i < 0) return;
      if (pronto && a.op.noGancho !== false) { a.obj.visible = true; return; }
      if (bi !== a.i) { a.obj.visible = bi > a.i; return; }
      const tp = a.op.palavra ? K.quando(a.op.palavra, B.inicio) : null;
      const ini = tp != null && tp < B.ate ? tp - (a.op.antes ?? 0.3) : B.inicio + B.bloco.reb + (a.op.atraso || 0);
      K.entrar(a.obj, a.tipo, tc - ini, a.op);
    });
  }

  const corDe = (c, padrao) => (c == null ? padrao : typeof c === 'number' ? c : parseInt(String(c).replace('#', ''), 16));
  function kitDe(p, cor, t) {
    const k = {
      casa: () => K.casa(), arvore: () => K.arvore(0, 0, 1, false, K.rand(3)), pinheiro: () => K.arvore(0, 0, 1, true, K.rand(3)),
      carro: () => K.carro(cor), tambor: () => K.tambor(cor), balde: () => K.balde(cor).g, regador: () => K.regador(cor).g,
      flor: () => K.flor(cor).g, computador: () => K.computador().g, celular: () => K.celular().g, bicicleta: () => K.bicicleta(cor).g,
      satelite: () => K.satelite(), navio: () => K.navio().g, foguete: () => K.foguete().g, moduloLunar: () => K.moduloLunar().g,
      capsula: () => K.capsula().g, terra: () => K.planeta('terra', t[0] || 1).g, lua: () => K.planeta('lua', t[0] || 1).g,
      balao: () => K.balao(cor), torneira: () => K.torneira([0, 0, 0]).g, registro: () => K.registro().g,
      predio: () => K.predio(t[0] || 10, t[1] || 4, t[2] || 4).g, peixe: () => { const x = K.peixe(cor); x.em([0, 0, 0], 0); return x.g; }
    }[p.kit];
    if (!k) throw new Error(`Peça de kit desconhecida: "${p.kit}"`);
    return k();
  }
  // Peça a partir de uma descrição (o mesmo formato das peças da cena-modelo montagem e do jeito por chat):
  // { forma, tam, cor, pos, giro (graus), metal, brilho, transparente (0 a 1), pontos (cano), texto (placa), kit }
  //   caixa [larg, alt, prof] · cilindro [raio, alt] ou [raioCima, raioBaixo, alt] · tubo [raio, alt] (oco)
  //   funil [raioCima, raioBaixo, alt] (oco) · esfera [raio] · cone [raio, alt] · anel [raio, grossura] (deitado)
  //   cano (pontos: [[x,y,z],...], tam: [raio]) · placa (texto, tam: [larg, alt]) · kit (kit: 'carro', 'balde'...)
  // Devolve um grupo já no lugar, dentro de pai (padrão: a cena), com o lugar guardado pros ajudantes
  K.peca = function (p, pai = K.scene) {
    const cor = corDe(p.cor, 0xcfd3d8);
    // Metal sem reflexo de ambiente sai escuro: metalness baixo e superfície lisa já dão cara de metal
    const op = { roughness: p.metal ? 0.32 : 0.7, metalness: p.metal ? 0.25 : 0 };
    if (p.transparente) Object.assign(op, { transparent: true, opacity: 1 - p.transparente, depthWrite: false });
    if (p.brilho) Object.assign(op, { emissive: cor, emissiveIntensity: typeof p.brilho === 'number' ? p.brilho : 0.8 });
    if (['tubo', 'funil'].includes(p.forma)) op.side = THREE.DoubleSide;
    const mat = K.mat(cor, op);
    const t = p.tam || [];
    let obj;
    switch (p.forma) {
      case 'caixa': obj = K.malha(new THREE.BoxGeometry(t[0] || 1, t[1] || t[0] || 1, t[2] || t[0] || 1), mat); break;
      case 'cilindro': obj = K.malha(t.length >= 3 ? new THREE.CylinderGeometry(t[0], t[1], t[2], 24) : new THREE.CylinderGeometry(t[0] || 0.5, t[0] || 0.5, t[1] || 1, 24), mat); break;
      case 'tubo': obj = K.malha(new THREE.CylinderGeometry(t[0] || 0.5, t[0] || 0.5, t[1] || 1, 24, 1, true), mat); break;
      case 'funil': obj = K.malha(new THREE.CylinderGeometry(t[0] || 0.6, t[1] || 0.2, t[2] || 0.5, 24, 1, true), mat); break;
      case 'esfera': obj = K.malha(new THREE.SphereGeometry(t[0] || 0.5, 22, 16), mat); break;
      case 'cone': obj = K.malha(new THREE.ConeGeometry(t[0] || 0.5, t[1] || 1, 22), mat); break;
      case 'anel': obj = K.malha(new THREE.TorusGeometry(t[0] || 0.5, t[1] || 0.08, 10, 36).rotateX(Math.PI / 2), mat); break;
      case 'cano': obj = K.cano(p.pontos || [[0, 0, 0], [0, 1, 0]], t[0] || 0.06, cor).g; break;
      case 'placa': obj = K.placa(p.texto || p.nome || '', { larg: t[0] || 1, alt: t[1] || 0.5 }); break;
      case 'kit': obj = kitDe(p, cor, t); break;
      default: throw new Error(`Forma desconhecida na peça "${p.nome}": ${p.forma}`);
    }
    const g = new THREE.Group();
    g.add(obj);
    g.position.set(...(p.pos || [0, 0, 0]));
    g.rotation.set(...(p.giro || [0, 0, 0]).map((x) => (x * Math.PI) / 180));
    g.userData.peca = p;
    pai.add(g);
    casaDe(g);
    if (p.nome) K.nomear(p.nome, g);
    return g;
  };
  // Várias peças de uma vez: K.pecas({ tecido: {...}, haste: {...} }, pai) → { tecido: grupo, haste: grupo }
  K.pecas = function (lista, pai = K.scene) {
    const r = {};
    Object.entries(lista).forEach(([nome, p]) => { r[nome] = K.peca(Object.assign({ nome }, p), pai); });
    return r;
  };

  // Antes da cena, em todo quadro: as peças dos ajudantes voltam pra casa, a agenda põe cada uma no plano dela e os
  // personagens voltam ao neutro (a cena só diz o que muda naquela frase)
  function antesDaCena(tc, capa) {
    restaurar();
    aplicarAgenda(tc, capa);
    K.bonecos.forEach((b) => b.reset(tc));
  }

  // ---------- Revisão (render --revisar) ----------

  const NAO_E_TEXTO = /\b(legenda|vinheta|flash|vhs|jogo-icone|divisor)\b/;
  const naTela = (d) => { const s = getComputedStyle(d); return s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0.05; };
  // Onde uma peça está na tela: escondida, atrás da câmera, quanto dela cabe no quadro (dentro), quanto do quadro ela
  // ocupa e o tamanho (o lado maior, de 0 a 1)
  const vCanto = new THREE.Vector3(), cxPeca = new THREE.Box3();
  function pecaNaTela(o, cam) {
    for (let p = o; p; p = p.parent) if (!p.visible) return { visivel: false };
    o.updateMatrixWorld(true);
    cxPeca.setFromObject(o);
    if (cxPeca.isEmpty()) return { visivel: false };
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, frente = 0;
    for (let i = 0; i < 8; i++) {
      vCanto.set(i & 1 ? cxPeca.max.x : cxPeca.min.x, i & 2 ? cxPeca.max.y : cxPeca.min.y, i & 4 ? cxPeca.max.z : cxPeca.min.z);
      if (-vCanto.clone().applyMatrix4(cam.matrixWorldInverse).z < 0.05) continue;
      frente++;
      vCanto.project(cam);
      const x = ((vCanto.x + 1) / 2) * W, y = ((1 - vCanto.y) / 2) * H;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
    if (!frente) return { visivel: true, atras: true };
    const vx = Math.max(0, Math.min(W, x1) - Math.max(0, x0)), vy = Math.max(0, Math.min(H, y1) - Math.max(0, y0));
    return { visivel: true, atras: false, dentro: (vx * vy) / Math.max(1, (x1 - x0) * (y1 - y0)), ocupa: (vx * vy) / (W * H), tam: Math.max(vx / W, vy / H) };
  }
  const notaNaTela = (p) => (!p.visivel ? 0 : p.atras ? 1 : 2 + p.dentro + p.ocupa);
  // O que está na tela neste quadro: câmera, cada personagem (caixa na tela e pose) e os textos. nomes: as peças do
  // "mostra" da frase (com mais de uma peça com o mesmo nome, como os carros, vale a que aparece melhor)
  K.medir = function (nomes) {
    const cam = K.camera;
    cam.updateMatrixWorld();
    const bonecos = K.bonecos.map((b) => {
      for (let o = b.g; o; o = o.parent) if (!o.visible) return { visivel: false };
      // Na tela: o tamanho dele pela distância até o peito (a caixa da pose incha quando ele está perto e de lado)
      b.g.updateMatrixWorld(true);
      const s = b.g.scale.y || 1, pes = b.g.position.clone(), topo = pes.clone().setY(pes.y + 1.55 * s);
      const peito = pes.clone().setY(pes.y + 0.9 * s);
      const prof = -peito.clone().applyMatrix4(cam.matrixWorldInverse).z;
      const atras = prof < 0.4;
      const px = (v) => { const q = v.clone().project(cam); return [((q.x + 1) / 2) * W, ((1 - q.y) / 2) * H]; };
      const [cxT] = px(peito), [, y0] = px(topo), [, y1] = px(pes), meia = (0.3 * s * H) / (2 * Math.max(0.05, prof) * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)));
      const x0 = cxT - meia, x1 = cxT + meia;
      const pose = [];
      b.bracos.forEach((br) => pose.push(br.ombro.rotation.x, br.ombro.rotation.z - br.lado * 0.12, br.cotovelo.rotation.x));
      b.pernas.forEach((pe) => pose.push(pe.quadril.rotation.x));
      pose.push(b.corpo.rotation.x, b.corpo.rotation.z, b.corpo.position.y * 4, b.corpo.position.z * 4, b.cabeca.rotation.x * 1.5, b.cabeca.rotation.z * 1.5);
      return { visivel: true, atras, tela: [x0, y0, x1, y1], pos: b.g.position.toArray(), pose, suando: !!b.suando, humor: b.humorAtual };
    });
    const textos = [...K.palco.querySelectorAll(':scope > div')]
      .filter((d) => !NAO_E_TEXTO.test(d.className) && naTela(d) && (d.textContent.trim() || /\bmarca\b/.test(d.className)))
      .map((d) => { const r = d.getBoundingClientRect(); return { tipo: d.className.split(' ')[0], texto: d.textContent.trim().slice(0, 28), caixa: [r.left, r.top, r.right, r.bottom] }; });
    const pecas = (nomes || []).map((n) => {
      const os = (NOMES.get(chaveNome(n)) || {}).objs;
      if (!os || !os.length) return { achou: false };
      return Object.assign({ achou: true }, os.map((o) => pecaNaTela(o, cam)).reduce((m, p) => (notaNaTela(p) > notaNaTela(m) ? p : m), { visivel: false }));
    });
    return { cam: { pos: cam.position.toArray(), dir: cam.getWorldDirection(new THREE.Vector3()).toArray() }, bonecos, textos, pecas };
  };
  // Miniatura em tons de cinza do quadro (pra comparar se duas cenas estão parecidas demais)
  K.miniatura = function (w = 27, h = 48) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    x.drawImage(K.canvas, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h).data, g = [];
    for (let i = 0; i < d.length; i += 4) g.push(Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]));
    return g;
  };

  // ---------- Quadro ----------

  const vFrente = new THREE.Vector3(), qCam = new THREE.Quaternion();
  K.render = function () {
    const r = K.renderer;
    if (K.contra) {
      // Vem de trás do que a câmera olha, um pouco do alto, com a cor do céu
      const cam = K.dividida ? K.camCima : K.camera;
      cam.getWorldDirection(vFrente);
      K.contra.position.copy(cam.position).addScaledVector(vFrente, 40);
      K.contra.position.y += 6;
      K.contra.target.position.copy(cam.position);
      K.contra.target.updateMatrixWorld();
      K.contra.color.copy(K.hemi.color);
      K.contra.intensity = K.hemi.intensity * 0.3;
    }
    if (K.dividida) {
      r.setScissorTest(true);
      [[K.camCima, H / 2], [K.camBaixo, 0]].forEach(([cam, y]) => {
        r.setViewport(0, y, W, H / 2);
        r.setScissor(0, y, W, H / 2);
        K.domo.position.copy(cam.position);
        r.render(K.scene, cam);
      });
      r.setScissorTest(false);
      r.setViewport(0, 0, W, H);
    } else if (K.redondo) {
      const cam = K.camera, t = K.t || 0;
      qCam.copy(cam.quaternion);
      cam.rotateX(Math.sin(t * 0.9) * 0.0022 + Math.sin(t * 2.3 + 1) * 0.0008);
      cam.rotateY(Math.sin(t * 0.7 + 2) * 0.0026 + Math.sin(t * 1.7) * 0.0007);
      cam.updateMatrixWorld();
      K.domo.position.copy(cam.position);
      r.render(K.scene, cam);
      cam.quaternion.copy(qCam);
      cam.updateMatrixWorld();
    } else {
      K.domo.position.copy(K.camera.position);
      r.render(K.scene, K.camera);
    }
    K.ui.divisor.style.display = K.dividida ? 'block' : 'none';
  };

  K.preparar = function (tl) {
    K.tl = tl;
    K.prepararJogo(tl);
    // Cor do canal (roteiro.cor, "#rrggbb"): a palavra da capa e o botão de seguir. O texto em cima dela sai preto
    // ou branco, o que ler melhor
    const cor = (tl.roteiro && tl.roteiro.cor) || '';
    if (/^#[0-9a-f]{6}$/i.test(cor)) {
      const n = parseInt(cor.slice(1), 16), luz = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
      K.palco.style.setProperty('--cor', cor);
      K.palco.style.setProperty('--cor-texto', luz > 0.62 ? '#161616' : '#fff');
    }
    if (tl.estilo === 'redondo' && !K.redondo) {
      K.redondo = true;
      arredondar();
      // Contraluz: recorta a silhueta dos objetos contra o fundo (segue a câmera em K.render)
      K.contra = new THREE.DirectionalLight(0xffffff, 0);
      K.scene.add(K.contra, K.contra.target);
      // Sombra de borda macia (penumbra), vinheta e cor um pouco mais viva
      K.renderer.shadowMap.type = THREE.VSMShadowMap;
      K.sol.shadow.radius = 5;
      K.sol.shadow.blurSamples = 16;
      K.sol.shadow.bias = -0.0006;
      K.palco.classList.add('redondo');
      el('vinheta');
    }
  };

  // Instante em que a narração fala uma palavra (a primeira depois de `desde`). Ex: K.quando('fechou')
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9']/g, '');
  K.quando = function (palavra, desde = 0) {
    const alvo = norm(palavra);
    for (const f of K.tl.frases) for (const w of f.palavras) if (w.inicio >= desde && norm(w.texto) === alvo) return w.inicio;
    return null;
  };

  // Um quadro completo no tempo real t
  K.quadro = function (t) {
    const j = K.estadoJogo(t);
    K.t = t; K.tc = j.tc;
    comps.forEach((c) => c.esconder());
    K.dividida = false;
    if (K.camera.fov !== K.FOV) { K.camera.fov = K.FOV; K.camera.updateProjectionMatrix(); }
    K.neblina();
    K.focoSombra(0, 0);
    K.caixaSombra();
    K.ceu('dia');
    vivos.forEach((f) => f(j.tc));
    antesDaCena(j.tc, false);
    comAdiados(() => window.CENA.cena(j.tc, t));
    aplicarJogo(j, t);
    K.mostrarLegenda(K.tl, t);
    mostrarGancho(K.tl, t);
    K.render();
  };

  // Capa / thumbnail: a cena monta a composição em CENA.capa() e o kit põe a pergunta no topo, numa caixa branca.
  // Área segura: o TikTok corta a capa em 3:4 pelo centro, então tudo que importa fica entre y 240 e 1680.
  // (*palavra* ganha a cor do canal, \n quebra a linha)
  K.capa = function (titulo) {
    K.t = K.tc = 0;
    comps.forEach((c) => c.esconder());
    K.dividida = false;
    if (K.camera.fov !== K.FOV) { K.camera.fov = K.FOV; K.camera.updateProjectionMatrix(); }
    K.neblina();
    K.focoSombra(0, 0);
    K.caixaSombra();
    K.ceu('dia');
    vivos.forEach((f) => f(0));
    antesDaCena(0, true);
    comAdiados(() => window.CENA.capa());
    aplicarJogo({ tc: 0, cinza: 0, icone: null, desde: 0, vhs: 0, flash: 0, zoom: 0 }, 0);
    K.legenda.innerHTML = '';
    if (elGancho) elGancho.style.display = 'none';
    tituloCapa(titulo);
    K.render();
  };

  // Junta frases seguidas com o mesmo plano em blocos com início e fim
  K.blocos = function (tl) {
    const bl = [];
    tl.frases.forEach((f, i) => {
      const ult = bl[bl.length - 1];
      if (ult && ult.plano === f.plano) ult.fim = f.fim;
      else bl.push({ plano: f.plano, inicio: f.inicio, fim: f.fim, reb: f.reb || 0, frase: i });
    });
    bl.forEach((b, i) => { b.ate = i + 1 < bl.length ? bl[i + 1].inicio : tl.total; });
    return bl;
  };
  // p: progresso no bloco (0 a 1). q e tq: progresso e tempo depois do ⏪ (o que a cena usa pra montar a peça)
  K.blocoEm = function (bl, t) {
    let atual = bl[0];
    for (const b of bl) if (t >= b.inicio) atual = b;
    const dur = atual.ate - atual.inicio, tb = t - atual.inicio;
    return {
      plano: atual.plano, p: K.clamp(tb / dur), t: tb, dur, inicio: atual.inicio, ate: atual.ate,
      q: K.clamp((tb - atual.reb) / (dur - atual.reb)), tq: tb - atual.reb, bloco: atual
    };
  };

  window.K = K;
})();
