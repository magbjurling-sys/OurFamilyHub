/* OurFamilyHub — How-to video library scenes.
   Mounts as window.HowToPlayer. Reads the animation engine globals from
   animations.jsx (loaded first via the x-import `from` list). */

const { Stage, Sprite, useTime, useSprite, Easing, interpolate, animate, clamp } = window;

/* ── palette / type ─────────────────────────────────────────── */
const BG   = '#0B0A1F';
const INK  = '#F1ECFF';
const SUB  = '#B6AED4';
const MUT  = '#8E86AE';
const GOLD = '#FFC861';
const PINK = '#FF8FB1';
const GREEN= '#34D399';
const BLUE = '#7FB0FF';
const PURPLE='#C79BFF';
const HEAD = "'Fredoka','Plus Jakarta Sans',sans-serif";
const BODY = "'Plus Jakarta Sans',system-ui,sans-serif";
const CARD = 'rgba(255,255,255,0.055)';
const BORD = '1px solid rgba(255,255,255,0.12)';

const eoc = Easing.easeOutCubic;
const eob = Easing.easeOutBack;
const eic = Easing.easeInCubic;
const eioc= Easing.easeInOutCubic;

const pick = (lang, en, no) => (lang === 'no' ? no : en);

/* in/out envelope for a beat given local time + beat duration */
function io(lt, dur, o) {
  o = o || {};
  const inDur = o.inDur == null ? 0.5 : o.inDur;
  const outDur = o.outDur == null ? 0.4 : o.outDur;
  const dist = o.dist == null ? 24 : o.dist;
  const i = eoc(clamp(lt / inDur, 0, 1));
  const ot = eic(clamp((lt - (dur - outDur)) / outDur, 0, 1));
  return { opacity: i * (1 - ot), ty: (1 - i) * dist };
}
/* pop-in helper -> {o, s} */
function pop(lt, delay, dur) {
  delay = delay || 0; dur = dur || 0.5;
  const t = clamp((lt - delay) / dur, 0, 1);
  return { o: clamp(t * 1.5, 0, 1), s: 0.6 + 0.4 * eob(t) };
}
/* fade-up appearing element -> style props */
function fu(lt, delay, dur, dist) {
  delay = delay || 0; dur = dur || 0.5; dist = dist == null ? 18 : dist;
  const t = eoc(clamp((lt - delay) / dur, 0, 1));
  return { opacity: t, transform: `translateY(${(1 - t) * dist}px)` };
}

/* ── shared chrome ──────────────────────────────────────────── */
function Bg() {
  const t = useTime();
  const stars = ['⭐','✨','🌟','💫','⭐','✨','🌙','⭐'];
  return (
    React.createElement('div', { style: { position:'absolute', inset:0, overflow:'hidden',
      background:
        'radial-gradient(1100px 720px at 12% -12%, rgba(168,85,247,.20), transparent 60%),'+
        'radial-gradient(1000px 640px at 104% 4%, rgba(255,197,61,.10), transparent 55%),'+
        'radial-gradient(1000px 820px at 50% 122%, rgba(236,72,153,.16), transparent 60%),'+
        BG } },
      stars.map((g, i) => {
        const bx = (i * 137) % 1240 + 20;
        const by = (i * 83) % 640 + 30;
        const drift = Math.sin(t * 0.5 + i) * 14;
        return React.createElement('span', { key:i, style:{ position:'absolute',
          left:bx, top:by + drift, fontSize: 16 + (i % 3) * 8, opacity:.14 } }, g);
      })
    )
  );
}

function Hud({ kicker, title }) {
  return React.createElement('div', { style:{ position:'absolute', top:0, left:0, right:0,
      height:64, display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'0 34px', zIndex:5 } },
    React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:11 } },
      React.createElement('div', { style:{ width:30, height:30, borderRadius:9,
        background:'linear-gradient(135deg,#A855F7,#FF7EA5)', display:'grid', placeItems:'center',
        fontSize:16, boxShadow:'0 6px 16px rgba(168,85,247,.5)' } }, '⭐'),
      React.createElement('div', { style:{ fontFamily:HEAD, fontWeight:600, fontSize:16, color:INK } }, 'OurFamilyHub'),
      React.createElement('div', { style:{ fontSize:12, fontWeight:700, letterSpacing:'.14em',
        textTransform:'uppercase', color:MUT } }, kicker)
    ),
    React.createElement('div', { style:{ fontFamily:HEAD, fontWeight:600, fontSize:15, color:SUB } }, title)
  );
}

/* bottom caption band */
function Caption({ idx, total, title, sub, color }) {
  color = color || GOLD;
  const { localTime, duration } = useSprite();
  const e = io(localTime, duration, { dist: 26 });
  return React.createElement('div', { style:{ position:'absolute', left:'50%', bottom:54,
      transform:`translate(-50%, ${e.ty}px)`, opacity:e.opacity, width:960, maxWidth:'92%',
      textAlign:'center' } },
    idx ? React.createElement('div', { style:{ display:'inline-flex', alignItems:'center', gap:8,
        fontSize:12.5, fontWeight:800, letterSpacing:'.12em', textTransform:'uppercase',
        color, background:'rgba(255,255,255,.06)', border:BORD, padding:'6px 14px',
        borderRadius:999, marginBottom:14 } },
        React.createElement('span', null, pick(gLang,'STEP','STEG') + ' ' + idx + ' / ' + total)) : null,
    React.createElement('div', { style:{ fontFamily:HEAD, fontWeight:600, fontSize:38,
      color:INK, lineHeight:1.1, letterSpacing:'-.01em' } }, title),
    sub ? React.createElement('div', { style:{ fontFamily:BODY, fontSize:19, color:SUB, marginTop:10 } }, sub) : null
  );
}

let gLang = 'no'; // set by player before render; used only for the STEP/STEG label

/* device frames */
function Phone({ x, y, w, children, glow }) {
  w = w || 260; const h = w * 2.02;
  return React.createElement('div', { style:{ position:'absolute', left:x, top:y, width:w, height:h,
      borderRadius:w*0.15, background:'#14122b', border:'2px solid rgba(255,255,255,.16)',
      boxShadow: glow ? '0 30px 70px rgba(0,0,0,.55), 0 0 60px rgba(168,85,247,.25)' : '0 26px 60px rgba(0,0,0,.5)',
      padding:10, boxSizing:'border-box' } },
    React.createElement('div', { style:{ position:'absolute', top:14, left:'50%', transform:'translateX(-50%)',
      width:w*0.34, height:6, borderRadius:3, background:'rgba(255,255,255,.18)' } }),
    React.createElement('div', { style:{ width:'100%', height:'100%', borderRadius:w*0.12,
      background:'linear-gradient(180deg,#171533,#0f0e22)', overflow:'hidden', position:'relative' } }, children)
  );
}
function Pad({ x, y, w, children }) {
  w = w || 460; const h = w * 0.74;
  return React.createElement('div', { style:{ position:'absolute', left:x, top:y, width:w, height:h,
      borderRadius:26, background:'#14122b', border:'2px solid rgba(255,255,255,.16)',
      boxShadow:'0 30px 70px rgba(0,0,0,.55)', padding:12, boxSizing:'border-box' } },
    React.createElement('div', { style:{ width:'100%', height:'100%', borderRadius:16,
      background:'linear-gradient(180deg,#171533,#0f0e22)', overflow:'hidden', position:'relative' } }, children)
  );
}

/* reusable bits */
function Chip({ children, color, bg, style }) {
  return React.createElement('div', { style: Object.assign({ display:'inline-flex', alignItems:'center',
    gap:7, fontSize:14, fontWeight:700, color: color || INK, background: bg || 'rgba(255,255,255,.07)',
    border:BORD, borderRadius:999, padding:'7px 14px' }, style||{}) }, children);
}
function Tap({ x, y, at, lt }) {
  const p = clamp((lt - at) / 0.6, 0, 1);
  if (p <= 0 || p >= 1) return null;
  const r = 8 + p * 46;
  return React.createElement('div', { style:{ position:'absolute', left:x, top:y,
    width:r*2, height:r*2, marginLeft:-r, marginTop:-r, borderRadius:'50%',
    border:'3px solid rgba(255,197,61,.9)', opacity:1-p } });
}
/* star meter dots grouped by 5 */
function Meter({ x, y, total, filled, size }) {
  size = size || 20;
  const dots = [];
  for (let i = 0; i < total; i++) {
    const on = i < filled;
    dots.push(React.createElement('div', { key:i, style:{ width:size, height:size, borderRadius:'50%',
      display:'grid', placeItems:'center', fontSize:size*0.72,
      background: on ? 'radial-gradient(circle,#FFE08A,#F2A93B)' : 'rgba(255,255,255,.08)',
      border: on ? 'none' : '1px solid rgba(255,255,255,.14)',
      marginRight: (i % 5 === 4) ? 14 : 5, transform: on ? 'scale(1)' : 'scale(.9)',
      transition:'all .2s' } }, on ? '⭐' : ''));
  }
  return React.createElement('div', { style:{ position:'absolute', left:x, top:y, display:'flex', flexWrap:'wrap',
    width: (size+5)*5 + 14, gap:'6px 0' } }, dots);
}

/* ═══════════ TOPIC 1 — Getting started / Kom i gang ═══════════ */
function T1({ lang }) {
  const kids = [
    { n:'Nora', a:'🌸', g:'🎯 15 ⭐', r: pick(lang,'Ice cream 🍦','Is 🍦') },
    { n:'Emma', a:'👧', g:'🎯 20 ⭐', r: pick(lang,'Movie night 🎬','Filmkveld 🎬') },
  ];
  return React.createElement(React.Fragment, null,
    React.createElement(Bg),
    React.createElement(Hud, { kicker: pick(lang,'PART 1 · IPHONE','DEL 1 · IPHONE'), title: pick(lang,'Getting started','Kom i gang') }),

    /* Title */
    React.createElement(Sprite, { start:0, end:3.2 }, ({ localTime }) => {
      const e = fu(localTime, 0.1, 0.6, 24);
      return React.createElement('div', { style:{ position:'absolute', inset:0, display:'grid', placeItems:'center' } },
        React.createElement('div', { style:{ textAlign:'center', ...e } },
          React.createElement('div', { style:{ fontSize:64, marginBottom:14 } }, '📲'),
          React.createElement('div', { style:{ fontFamily:HEAD, fontWeight:700, fontSize:58, color:INK } },
            pick(lang,'Getting started','Kom i gang')),
          React.createElement('div', { style:{ fontSize:20, color:SUB, marginTop:10 } },
            pick(lang,'Set up your family in under 10 minutes','Sett opp familien på under 10 minutter'))));
    }),

    /* 1 Sign in with Apple */
    React.createElement(Sprite, { start:3.2, end:8.4 }, ({ localTime }) => {
      const done = localTime > 2.6;
      return React.createElement(React.Fragment, null,
        React.createElement(Phone, { x:510, y:96, w:260, glow:true },
          React.createElement('div', { style:{ padding:'34px 22px', textAlign:'center' } },
            React.createElement('div', { style:{ width:66, height:66, borderRadius:18, margin:'6px auto 18px',
              background:'linear-gradient(135deg,#A855F7,#FF7EA5)', display:'grid', placeItems:'center', fontSize:34 } }, '⭐'),
            React.createElement('div', { style:{ fontFamily:HEAD, fontWeight:600, fontSize:19, color:INK, marginBottom:26 } }, 'OurFamilyHub'),
            React.createElement('div', { style:{ background:'#000', color:'#fff', borderRadius:12, padding:'13px 0',
              fontSize:15, fontWeight:600, display:'flex', gap:8, justifyContent:'center', alignItems:'center' } },
              '🍎 ', pick(lang,'Sign in with Apple','Logg inn med Apple')),
            done ? React.createElement('div', { style:{ marginTop:22, fontSize:38 } }, '✅') : null)),
        React.createElement(Tap, { x:640, y:400, at:1.4, lt:localTime }),
        React.createElement(Caption, { idx:1, total:5, color:PURPLE,
          title: pick(lang,'Sign in with Apple','Logg inn med Apple'),
          sub: pick(lang,'No passwords, and never any accounts for kids','Ingen passord — og aldri kontoer for barn') }));
    }),

    /* 2 Name family */
    React.createElement(Sprite, { start:8.4, end:13.6 }, ({ localTime }) => {
      const full = pick(lang,'The Berg Family','Familien Berg');
      const chars = Math.floor(clamp((localTime - 0.7) / 1.8, 0, 1) * full.length);
      const caret = Math.floor(localTime * 2) % 2 === 0;
      return React.createElement(React.Fragment, null,
        React.createElement(Phone, { x:510, y:96, w:260, glow:true },
          React.createElement('div', { style:{ padding:'46px 22px' } },
            React.createElement('div', { style:{ fontSize:34, marginBottom:16 } }, '🏡'),
            React.createElement('div', { style:{ fontSize:12, fontWeight:700, letterSpacing:'.1em', color:MUT,
              textTransform:'uppercase', marginBottom:10 } }, pick(lang,'Family name','Familienavn')),
            React.createElement('div', { style:{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(127,176,255,.5)',
              borderRadius:12, padding:'14px 14px', minHeight:20, fontSize:16, color:INK, fontWeight:600 } },
              full.slice(0, chars), React.createElement('span', { style:{ opacity: caret ? 1 : 0, color:BLUE } }, '|')))),
        React.createElement(Caption, { idx:2, total:5, color:BLUE,
          title: pick(lang,'Name your family','Navngi familien'),
          sub: pick(lang,'It shows at the top of the dashboard','Vises øverst på familietavla') }));
    }),

    /* 3 Add kids */
    React.createElement(Sprite, { start:13.6, end:19.6 }, ({ localTime }) =>
      React.createElement(React.Fragment, null,
        React.createElement('div', { style:{ position:'absolute', left:0, right:0, top:150, display:'flex',
          justifyContent:'center', gap:26 } },
          kids.map((k, i) => {
            const e = pop(localTime, 0.4 + i * 0.5, 0.6);
            return React.createElement('div', { key:i, style:{ width:250, background:CARD, border:BORD,
              borderRadius:22, padding:'22px 20px', textAlign:'center', opacity:e.o,
              transform:`scale(${e.s})`, boxShadow:'0 20px 50px rgba(0,0,0,.4)' } },
              React.createElement('div', { style:{ width:64, height:64, borderRadius:'50%', margin:'0 auto 12px',
                display:'grid', placeItems:'center', fontSize:32,
                background:'radial-gradient(circle,#FFD66B,#F2A93B)' } }, k.a),
              React.createElement('div', { style:{ fontFamily:HEAD, fontWeight:600, fontSize:22, color:INK } }, k.n),
              React.createElement('div', { style:{ marginTop:10, display:'flex', flexDirection:'column', gap:7, alignItems:'center' } },
                React.createElement(Chip, { color:GOLD }, k.g),
                React.createElement(Chip, { color:PINK }, '🎁 ', k.r)));
          })),
        React.createElement(Caption, { idx:3, total:5, color:GOLD,
          title: pick(lang,'Add your kids','Legg til barna'),
          sub: pick(lang,'Give each a goal and a reward in your own words','Gi hvert barn et mål og en belønning du velger') }))),

    /* 4 Parent PIN */
    React.createElement(Sprite, { start:19.6, end:25.0 }, ({ localTime }) => {
      const n = clamp(Math.floor((localTime - 0.6) / 0.5), 0, 4);
      const face = localTime > 3.0;
      return React.createElement(React.Fragment, null,
        React.createElement(Phone, { x:510, y:96, w:260, glow:true },
          React.createElement('div', { style:{ padding:'52px 22px', textAlign:'center' } },
            React.createElement('div', { style:{ fontSize:34, marginBottom:18 } }, '🔒'),
            React.createElement('div', { style:{ fontSize:15, color:SUB, marginBottom:22 } }, pick(lang,'Set a parent PIN','Sett forelder-PIN')),
            React.createElement('div', { style:{ display:'flex', gap:14, justifyContent:'center', marginBottom:26 } },
              [0,1,2,3].map(i => React.createElement('div', { key:i, style:{ width:18, height:18, borderRadius:'50%',
                background: i < n ? GOLD : 'transparent', border:'2px solid '+(i<n?GOLD:'rgba(255,255,255,.35)'),
                transform: i < n ? 'scale(1.1)' : 'scale(1)', transition:'all .2s' } }))),
            face ? React.createElement('div', { style:{ ...fu(localTime,3.0,0.5,10), color:GREEN, fontSize:15, fontWeight:700 } },
              '😃 ', pick(lang,'Face ID enabled','Face ID aktivert')) : null)),
        React.createElement(Caption, { idx:4, total:5, color:GREEN,
          title: pick(lang,'Set a parent PIN','Sett en forelder-PIN'),
          sub: pick(lang,'Locks parent mode — Face ID unlocks it faster','Låser foreldremodus — Face ID låser opp raskere') }));
    }),

    /* 5 Connect iPad */
    React.createElement(Sprite, { start:25.0, end:31.5 }, ({ localTime }) => {
      const travel = clamp((localTime - 0.8) / 1.6, 0, 1);
      const appear = localTime > 2.6;
      return React.createElement(React.Fragment, null,
        React.createElement(Phone, { x:250, y:150, w:170 },
          React.createElement('div', { style:{ padding:'22px 12px', textAlign:'center' } },
            React.createElement('div', { style:{ fontSize:24, marginTop:16 } }, '📱'),
            React.createElement('div', { style:{ fontSize:11, color:SUB, marginTop:10 } }, 'iPhone'))),
        /* link dots */
        React.createElement('div', { style:{ position:'absolute', left:430, top:300, width:210, height:4 } },
          [0,1,2,3,4,5].map(i => React.createElement('div', { key:i, style:{ position:'absolute', left:i*38, top:0,
            width:12, height:12, borderRadius:'50%', background: (i/6 <= travel) ? GOLD : 'rgba(255,255,255,.18)',
            transform:'translateY(-4px)' } }))),
        React.createElement(Pad, { x:660, y:170, w:390 },
          React.createElement('div', { style:{ padding:'20px 22px' } },
            React.createElement('div', { style:{ fontFamily:HEAD, fontWeight:600, fontSize:16, color:INK, marginBottom:16 } },
              pick(lang,'The Berg Family','Familien Berg')),
            React.createElement('div', { style:{ display:'flex', gap:16 } },
              [['Nora','🌸'],['Emma','👧']].map((k,i) => {
                const e = pop(appear ? localTime : 0, 2.6 + i*0.3, 0.5);
                return React.createElement('div', { key:i, style:{ textAlign:'center', opacity:e.o, transform:`scale(${e.s})` } },
                  React.createElement('div', { style:{ width:52, height:52, borderRadius:'50%', margin:'0 auto',
                    display:'grid', placeItems:'center', fontSize:26, background:'radial-gradient(circle,#FFD66B,#F2A93B)' } }, k[1]),
                  React.createElement('div', { style:{ fontSize:13, color:INK, marginTop:6, fontWeight:600 } }, k[0]));
              })))),
        React.createElement(Caption, { idx:5, total:5, color:BLUE,
          title: pick(lang,'Connect the iPad','Koble til iPaden'),
          sub: pick(lang,'Same Apple ID — the kids appear automatically','Samme Apple-ID — barna dukker opp av seg selv') }));
    }),

    /* Outro */
    React.createElement(Sprite, { start:31.5, end:34 }, ({ localTime }) => {
      const e = pop(localTime, 0.1, 0.6);
      return React.createElement('div', { style:{ position:'absolute', inset:0, display:'grid', placeItems:'center' } },
        React.createElement('div', { style:{ textAlign:'center', opacity:e.o, transform:`scale(${e.s})` } },
          React.createElement('div', { style:{ fontSize:64 } }, '🎉'),
          React.createElement('div', { style:{ fontFamily:HEAD, fontWeight:700, fontSize:46, color:INK, marginTop:10 } },
            pick(lang,'Ready in under 10 minutes','Klart på under 10 minutter'))));
    })
  );
}

/* ═══════════ TOPIC 2 — Core loop / Kjernesløyfa ═══════════ */
function T2({ lang }) {
  return React.createElement(React.Fragment, null,
    React.createElement(Bg),
    React.createElement(Hud, { kicker: pick(lang,'HOW IT WORKS','SLIK FUNGERER DET'), title: pick(lang,'The core loop','Kjernesløyfa') }),

    React.createElement(Sprite, { start:0, end:3 }, ({ localTime }) => {
      const e = fu(localTime, 0.1, 0.6, 22);
      return React.createElement('div', { style:{ position:'absolute', inset:0, display:'grid', placeItems:'center' } },
        React.createElement('div', { style:{ textAlign:'center', ...e } },
          React.createElement('div', { style:{ fontSize:60 } }, '⭐'),
          React.createElement('div', { style:{ fontFamily:HEAD, fontWeight:700, fontSize:54, color:INK, marginTop:6 } },
            pick(lang,'The core loop','Kjernesløyfa')),
          React.createElement('div', { style:{ fontSize:20, color:SUB, marginTop:8 } },
            pick(lang,'Tap → Approve → Star → Trophy','Trykk → Godkjenn → Stjerne → Trofé'))));
    }),

    /* 1 kid taps on iPad */
    React.createElement(Sprite, { start:3, end:8 }, ({ localTime }) => {
      const done = localTime > 2.4;
      return React.createElement(React.Fragment, null,
        React.createElement(Pad, { x:410, y:120, w:460 },
          React.createElement('div', { style:{ padding:'22px 26px' } },
            React.createElement('div', { style:{ fontSize:13, color:MUT, marginBottom:14, fontWeight:700, letterSpacing:'.08em' } },
              pick(lang,'NORA · STARTAP','NORA · STARTAP')),
            [['🪥', pick(lang,'Brush teeth','Pusse tenner'), true],
             ['🛏️', pick(lang,'Make the bed','Re opp sengen'), false]].map((r,i) => {
              const checked = r[2] && done;
              return React.createElement('div', { key:i, style:{ display:'flex', alignItems:'center', gap:14,
                background:'rgba(255,255,255,.05)', border:BORD, borderRadius:14, padding:'14px 16px', marginBottom:12 } },
                React.createElement('span', { style:{ fontSize:24 } }, r[0]),
                React.createElement('span', { style:{ flex:1, fontSize:17, color:INK, fontWeight:600 } }, r[1]),
                React.createElement('span', { style:{ width:28, height:28, borderRadius:8, display:'grid', placeItems:'center',
                  fontSize:16, background: checked ? GREEN : 'rgba(255,255,255,.08)', color:'#08210f',
                  border: checked ? 'none' : '1px solid rgba(255,255,255,.2)' } }, checked ? '✓' : ''));
            }))),
        React.createElement(Tap, { x:600, y:236, at:1.2, lt:localTime }),
        React.createElement(Caption, { idx:1, total:4, color:GOLD,
          title: pick(lang,'Kids tap what they finish','Barna trykker på det de er ferdige med'),
          sub: pick(lang,'On the iPad, in StarTap — no login','På iPaden, i StarTap — uten innlogging') }));
    }),

    /* 2 parent approves */
    React.createElement(Sprite, { start:8, end:13 }, ({ localTime }) => {
      const approved = localTime > 2.4;
      return React.createElement(React.Fragment, null,
        React.createElement(Phone, { x:510, y:92, w:260, glow:true },
          React.createElement('div', { style:{ padding:'26px 18px' } },
            React.createElement('div', { style:{ fontSize:13, color:MUT, fontWeight:700, letterSpacing:'.08em', marginBottom:16 } },
              pick(lang,'PENDING','VENTER')),
            React.createElement('div', { style:{ background:'rgba(255,255,255,.05)', border:BORD, borderRadius:14, padding:'14px' } },
              React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:10, marginBottom:14 } },
                React.createElement('span', { style:{ fontSize:22 } }, '🪥'),
                React.createElement('span', { style:{ flex:1, fontSize:14, color:INK, fontWeight:600 } }, pick(lang,'Nora · Brush teeth','Nora · Pusse tenner'))),
              approved
                ? React.createElement('div', { style:{ textAlign:'center', color:GREEN, fontWeight:700, fontSize:15, ...fu(localTime,2.4,0.4,6) } }, '✓ ', pick(lang,'Approved','Godkjent'))
                : React.createElement('div', { style:{ display:'flex', gap:8 } },
                    React.createElement('div', { style:{ flex:1, textAlign:'center', background:'rgba(255,255,255,.06)', borderRadius:10, padding:'9px 0', fontSize:13, color:SUB, fontWeight:700 } }, '✕'),
                    React.createElement('div', { style:{ flex:2, textAlign:'center', background:'linear-gradient(120deg,#34D399,#7FB0FF)', color:'#06231a', borderRadius:10, padding:'9px 0', fontSize:13, fontWeight:800 } }, pick(lang,'Approve','Godkjenn')))))),
        !approved ? React.createElement(Tap, { x:690, y:300, at:1.2, lt:localTime }) : null,
        React.createElement(Caption, { idx:2, total:4, color:GREEN,
          title: pick(lang,'You approve with one tap','Du godkjenner med ett trykk'),
          sub: pick(lang,'On your iPhone — or reject with a friendly "try again"','På din iPhone — eller avvis med et vennlig «prøv igjen»') }));
    }),

    /* 3 star fills meter */
    React.createElement(Sprite, { start:13, end:18.5 }, ({ localTime }) => {
      const filled = clamp(Math.floor((localTime - 0.5) / 0.45) + 6, 0, 15);
      return React.createElement(React.Fragment, null,
        React.createElement('div', { style:{ position:'absolute', left:'50%', top:190, transform:'translateX(-50%)', textAlign:'center' } },
          React.createElement('div', { style:{ fontFamily:HEAD, fontWeight:600, fontSize:20, color:INK, marginBottom:20 } },
            pick(lang,'Nora · saving toward the goal','Nora · sparer mot målet')),
          React.createElement('div', { style:{ position:'relative', display:'inline-block', width:209, height:114 } },
            React.createElement(Meter, { x:0, y:0, total:15, filled:filled, size:34 })),
          React.createElement('div', { style:{ marginTop:18, fontFamily:HEAD, fontWeight:700, fontSize:30, color:GOLD } },
            filled + ' / 15 ⭐')),
        React.createElement(Caption, { idx:3, total:4, color:GOLD,
          title: pick(lang,'Approved stars fill the board','Godkjente stjerner fyller brettet'),
          sub: pick(lang,'Grouped in fives, toward the goal you set','Gruppert i femmere, mot målet du satte') }));
    }),

    /* 4 trophy */
    React.createElement(Sprite, { start:18.5, end:24 }, ({ localTime }) => {
      const e = pop(localTime, 0.3, 0.7);
      const shake = Math.sin(localTime * 14) * (localTime > 1 && localTime < 2 ? 6 : 0);
      return React.createElement(React.Fragment, null,
        React.createElement('div', { style:{ position:'absolute', inset:0, display:'grid', placeItems:'center', paddingBottom:120 } },
          React.createElement('div', { style:{ textAlign:'center', opacity:e.o, transform:`scale(${e.s}) rotate(${shake}deg)` } },
            React.createElement('div', { style:{ fontSize:110, filter:'drop-shadow(0 12px 30px rgba(255,197,61,.5))' } }, '🏆'),
            React.createElement('div', { style:{ fontFamily:HEAD, fontWeight:700, fontSize:34, color:INK, marginTop:6 } },
              pick(lang,'Goal reached!','Målet nådd!')),
            React.createElement(Chip, { color:PINK, style:{ marginTop:14, fontSize:17 } }, '🎁 ', pick(lang,'Movie night unlocked','Filmkveld låst opp')))),
        React.createElement(Caption, { idx:4, total:4, color:GOLD,
          title: pick(lang,'Reach the goal → a trophy','Nå målet → et trofé'),
          sub: pick(lang,'Plus the real reward you chose, then it starts over','Pluss den ekte belønningen du valgte — så starter det på nytt') }));
    })
  );
}

/* ═══════════ TOPIC 3 — Routines vs Tasks vs Cycles ═══════════ */
function T3({ lang }) {
  const cols = [
    { ic:'📋', color:PURPLE, h: pick(lang,'Routine','Rutine'),
      who: pick(lang,'Ordered steps → 1 star','Steg i rekkefølge → 1 stjerne'),
      items:[ pick(lang,'Several small steps in order','Flere små steg i rekkefølge'),
              pick(lang,'All steps together = one star','Alle steg samlet = én stjerne'),
              pick(lang,'You approve it','Du godkjenner') ],
      chip: pick(lang,'Approval required','Krever godkjenning'), chipC:GOLD },
    { ic:'✅', color:GREEN, h: pick(lang,'Task','Oppgave'),
      who: pick(lang,'A single action','En enkelthandling'),
      items:[ pick(lang,'The child taps it themselves','Barnet trykker selv'),
              pick(lang,'Daily or one-time','Daglig eller engangs'),
              pick(lang,'You approve it','Du godkjenner') ],
      chip: pick(lang,'Approval required','Krever godkjenning'), chipC:GOLD },
    { ic:'🔄', color:BLUE, h: pick(lang,'Cycle','Syklus'),
      who: pick(lang,'The family, together','Familien, sammen'),
      items:[ pick(lang,'Everyone checks in','Alle sjekker inn'),
              pick(lang,'Credited instantly','Godskrives umiddelbart'),
              pick(lang,'Ends with a shared reward','Ender med en delt belønning') ],
      chip: pick(lang,'Instant check-in','Umiddelbar innsjekk'), chipC:GREEN },
  ];
  return React.createElement(React.Fragment, null,
    React.createElement(Bg),
    React.createElement(Hud, { kicker: pick(lang,'BUILDING BLOCKS','BYGGEKLOSSER'), title: pick(lang,'Routines · Tasks · Cycles','Rutiner · Oppgaver · Sykluser') }),

    React.createElement(Sprite, { start:0, end:3 }, ({ localTime }) => {
      const e = fu(localTime, 0.1, 0.6, 22);
      return React.createElement('div', { style:{ position:'absolute', inset:0, display:'grid', placeItems:'center' } },
        React.createElement('div', { style:{ textAlign:'center', ...e } },
          React.createElement('div', { style:{ fontSize:56 } }, '🧩'),
          React.createElement('div', { style:{ fontFamily:HEAD, fontWeight:700, fontSize:48, color:INK, marginTop:8 } },
            pick(lang,'Three building blocks','Tre byggeklosser')),
          React.createElement('div', { style:{ fontSize:20, color:SUB, marginTop:8 } },
            pick(lang,'They look alike — but work differently','De ligner — men fungerer ulikt'))));
    }),

    React.createElement(Sprite, { start:3, end:20 }, ({ localTime }) =>
      React.createElement(React.Fragment, null,
        React.createElement('div', { style:{ position:'absolute', left:0, right:0, top:120, display:'flex',
          justifyContent:'center', gap:22, padding:'0 40px' } },
          cols.map((c, i) => {
            const e = pop(localTime, 0.3 + i * 0.6, 0.6);
            return React.createElement('div', { key:i, style:{ width:340, background:CARD, border:'1px solid '+c.color+'55',
              borderRadius:22, padding:'24px 22px', opacity:e.o, transform:`translateY(${(1-e.o)*20}px) scale(${e.s})`,
              boxShadow:'0 20px 50px rgba(0,0,0,.4)' } },
              React.createElement('div', { style:{ width:60, height:60, borderRadius:16, display:'grid', placeItems:'center',
                fontSize:30, background:c.color+'22', border:'1px solid '+c.color+'55', marginBottom:14 } }, c.ic),
              React.createElement('div', { style:{ fontFamily:HEAD, fontWeight:600, fontSize:26, color:INK } }, c.h),
              React.createElement('div', { style:{ fontSize:13, fontWeight:700, color:c.color, marginTop:4, marginBottom:16,
                textTransform:'uppercase', letterSpacing:'.05em' } }, c.who),
              c.items.map((it, j) => {
                const iv = fu(localTime, 1.2 + i*0.6 + j*0.35, 0.5, 10);
                return React.createElement('div', { key:j, style:{ display:'flex', gap:10, alignItems:'flex-start',
                  padding:'7px 0', fontSize:15.5, color:SUB, ...iv } },
                  React.createElement('span', { style:{ color:c.color } }, '★'), React.createElement('span', null, it));
              }),
              React.createElement('div', { style:{ marginTop:14 } },
                React.createElement(Chip, { color:c.chipC, bg:c.chipC+'1f', style:{ fontSize:13 } }, c.chip)));
          })),
        React.createElement(Caption, { idx:null, total:null,
          title: pick(lang,'Ordered steps · single action · family together','Steg i rekkefølge · enkelthandling · familien sammen'),
          sub: pick(lang,'That is the whole difference','Det er hele forskjellen') }))),

    React.createElement(Sprite, { start:20, end:24 }, ({ localTime }) => {
      const e = pop(localTime, 0.1, 0.6);
      return React.createElement('div', { style:{ position:'absolute', inset:0, display:'grid', placeItems:'center', padding:'0 120px' } },
        React.createElement('div', { style:{ textAlign:'center', opacity:e.o, transform:`scale(${e.s})` } },
          React.createElement('div', { style:{ fontSize:48 } }, '🧭'),
          React.createElement('div', { style:{ fontFamily:HEAD, fontWeight:600, fontSize:34, color:INK, marginTop:10, lineHeight:1.25 } },
            pick(lang,'Start from the defaults, then adjust','Start fra standardoppsettet, juster etterpå')),
          React.createElement('div', { style:{ fontSize:19, color:SUB, marginTop:12 } },
            pick(lang,'You only need a few of each','Du trenger bare noen få av hver'))));
    })
  );
}

/* ═══════════ TOPIC 4 — Reward ladder / Premie-stige ═══════════ */
function T4({ lang }) {
  const rungs = [
    ['🍦', pick(lang,'Ice cream','Is'), '10'],
    ['🎮', pick(lang,'30 min screen time','30 min skjermtid'), '15'],
    ['🍝', pick(lang,'Pick dinner','Velge middag'), '25'],
    ['🎬', pick(lang,'Cinema','Kino'), '50'],
    ['🎁', pick(lang,'Big surprise','Stor overraskelse'), '100'],
  ];
  return React.createElement(React.Fragment, null,
    React.createElement(Bg),
    React.createElement(Hud, { kicker: pick(lang,'REWARDS','BELØNNINGER'), title: pick(lang,'Reward ladder','Premie-stige') }),

    React.createElement(Sprite, { start:0, end:3 }, ({ localTime }) => {
      const e = fu(localTime, 0.1, 0.6, 22);
      return React.createElement('div', { style:{ position:'absolute', inset:0, display:'grid', placeItems:'center' } },
        React.createElement('div', { style:{ textAlign:'center', ...e } },
          React.createElement('div', { style:{ fontSize:58 } }, '🎁'),
          React.createElement('div', { style:{ fontFamily:HEAD, fontWeight:700, fontSize:50, color:INK, marginTop:6 } },
            pick(lang,'Reward ladder','Premie-stige')),
          React.createElement('div', { style:{ fontSize:20, color:SUB, marginTop:8 } },
            pick(lang,'Rewards kids save toward — you decide them','Belønninger barna sparer mot — du bestemmer'))));
    }),

    React.createElement(Sprite, { start:3, end:12 }, ({ localTime }) =>
      React.createElement(React.Fragment, null,
        React.createElement('div', { style:{ position:'absolute', left:'50%', top:110, transform:'translateX(-50%)', width:560 } },
          rungs.map((r, i) => {
            const e = fu(localTime, 0.3 + i * 0.45, 0.5, 24);
            const idx = rungs.length - 1 - i;
            return React.createElement('div', { key:i, style:{ display:'flex', alignItems:'center', gap:16,
              background:CARD, border:BORD, borderRadius:16, padding:'13px 20px', marginBottom:11,
              marginLeft: idx * 22, ...e } },
              React.createElement('span', { style:{ fontSize:26 } }, r[0]),
              React.createElement('span', { style:{ flex:1, fontSize:18, color:INK, fontWeight:600 } }, r[1]),
              React.createElement(Chip, { color:GOLD, style:{ fontSize:15 } }, r[2] + ' ⭐'));
          })),
        React.createElement(Caption, { idx:null, total:null,
          title: pick(lang,'A ladder of named rewards','En stige av navngitte premier'),
          sub: pick(lang,'From an ice cream to a big surprise','Fra en is til en stor overraskelse') }))),

    React.createElement(Sprite, { start:12, end:18.5 }, ({ localTime }) => {
      const prog = clamp((localTime - 0.6) / 2.2, 0, 1) * 0.66;
      return React.createElement(React.Fragment, null,
        React.createElement('div', { style:{ position:'absolute', left:'50%', top:230, transform:'translateX(-50%)', width:520, textAlign:'center' } },
          React.createElement('div', { style:{ fontSize:15, color:MUT, fontWeight:700, letterSpacing:'.06em', marginBottom:12, textTransform:'uppercase' } },
            pick(lang,'Saving toward next reward','Spar mot neste premie')),
          React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:12, marginBottom:14 } },
            React.createElement('span', { style:{ fontSize:26 } }, '🍦'),
            React.createElement('div', { style:{ flex:1, height:16, borderRadius:99, background:'rgba(255,255,255,.08)', overflow:'hidden' } },
              React.createElement('div', { style:{ width:(prog*100)+'%', height:'100%', background:'linear-gradient(90deg,#FF7EA5,#FFC861)', transition:'none' } })),
            React.createElement('span', { style:{ fontSize:26 } }, '🎮')),
          React.createElement('div', { style:{ fontFamily:HEAD, fontWeight:700, fontSize:24, color:GOLD } },
            Math.round(10 + prog*7.5) + ' / 15 ⭐')),
        React.createElement(Caption, { idx:null, total:null, color:PINK,
          title: pick(lang,'Kids always see their next reward','Barna ser alltid neste premie'),
          sub: pick(lang,'With a progress bar — at their own pace','Med framdriftslinje — i sitt eget tempo') }));
    }),

    React.createElement(Sprite, { start:18.5, end:23.5 }, ({ localTime }) => {
      const e = pop(localTime, 0.2, 0.6);
      return React.createElement('div', { style:{ position:'absolute', inset:0, display:'grid', placeItems:'center', paddingBottom:110 } },
        React.createElement('div', { style:{ textAlign:'center', opacity:e.o, transform:`scale(${e.s})` } },
          React.createElement('div', { style:{ fontSize:80 } }, '🎉'),
          React.createElement('div', { style:{ fontFamily:HEAD, fontWeight:700, fontSize:36, color:INK, marginTop:8 } },
            pick(lang,'Unlocked!','Låst opp!')),
          React.createElement(Chip, { color:GREEN, bg:GREEN+'22', style:{ marginTop:14, fontSize:17 } },
            '🍦 ', pick(lang,'Ice cream · claimed','Is · innløst')),
          React.createElement('div', { style:{ marginTop:18, fontSize:17, color:SUB } },
            pick(lang,'Build it in seconds from suggestions','Bygg den på sekunder med forslag'))));
    })
  );
}

/* ═══════════ TOPIC 5 — Cash out ═══════════ */
function T5({ lang }) {
  return React.createElement(React.Fragment, null,
    React.createElement(Bg),
    React.createElement(Hud, { kicker: pick(lang,'REAL MONEY','EKTE PENGER'), title: 'Cash out' }),

    React.createElement(Sprite, { start:0, end:3.2 }, ({ localTime }) => {
      const e = fu(localTime, 0.1, 0.6, 22);
      return React.createElement('div', { style:{ position:'absolute', inset:0, display:'grid', placeItems:'center' } },
        React.createElement('div', { style:{ textAlign:'center', ...e } },
          React.createElement('div', { style:{ fontSize:58 } }, '💸'),
          React.createElement('div', { style:{ fontFamily:HEAD, fontWeight:700, fontSize:52, color:INK, marginTop:6 } }, 'Cash out'),
          React.createElement('div', { style:{ fontSize:20, color:SUB, marginTop:8 } },
            pick(lang,'From saved stars to real pocket money','Fra sparte stjerner til ekte lommepenger'))));
    }),

    /* 1 kid requests */
    React.createElement(Sprite, { start:3.2, end:8.5 }, ({ localTime }) =>
      React.createElement(React.Fragment, null,
        React.createElement(Pad, { x:410, y:118, w:460 },
          React.createElement('div', { style:{ padding:'26px 28px', textAlign:'center' } },
            React.createElement('div', { style:{ fontSize:14, color:MUT, fontWeight:700, marginBottom:8 } }, pick(lang,'NORA · BALANCE','NORA · SALDO')),
            React.createElement('div', { style:{ fontFamily:HEAD, fontWeight:700, fontSize:52, color:GREEN } }, pick(lang,'$12','120 kr')),
            React.createElement('div', { style:{ fontSize:14, color:SUB, margin:'6px 0 22px' } }, '12 ⭐ ', pick(lang,'saved','spart')),
            React.createElement('div', { style:{ display:'inline-block', background:'linear-gradient(120deg,#34D399,#7FB0FF)',
              color:'#06231a', fontWeight:800, fontSize:16, borderRadius:12, padding:'13px 26px' } },
              pick(lang,'Request cash out','Be om innveksling')))),
        React.createElement(Tap, { x:640, y:330, at:1.4, lt:localTime }),
        React.createElement(Caption, { idx:1, total:4, color:GREEN,
          title: pick(lang,'The child requests a cash-out','Barnet ber om innveksling'),
          sub: pick(lang,'Right from their board','Rett fra tavla si') }))),

    /* 2 parent notified, opens payment app */
    React.createElement(Sprite, { start:8.5, end:14.5 }, ({ localTime }) => {
      const apps = [['Vipps','#FF5B24'],['Venmo','#008CFF'],['PayPal','#003087']];
      return React.createElement(React.Fragment, null,
        React.createElement(Phone, { x:300, y:112, w:220, glow:true },
          React.createElement('div', { style:{ padding:'18px 14px' } },
            React.createElement('div', { style:{ ...fu(localTime,0.3,0.5,-12), background:'rgba(255,255,255,.1)', border:BORD,
              borderRadius:14, padding:'12px', marginBottom:14 } },
              React.createElement('div', { style:{ fontSize:11, color:MUT, fontWeight:700 } }, '🔔 OurFamilyHub'),
              React.createElement('div', { style:{ fontSize:13, color:INK, marginTop:4 } },
                pick(lang,'Nora wants to cash out $12','Nora vil veksle inn 120 kr'))),
            React.createElement('div', { style:{ fontSize:12, color:MUT, textAlign:'center', margin:'6px 0 10px' } },
              pick(lang,'Pay with your own app','Betal med din egen app')),
            apps.map((a, i) => {
              const e = fu(localTime, 1.2 + i*0.3, 0.4, 12);
              return React.createElement('div', { key:i, style:{ ...e, display:'flex', alignItems:'center', gap:10,
                background:'#fff', borderRadius:10, padding:'10px 12px', marginBottom:8 } },
                React.createElement('span', { style:{ width:22, height:22, borderRadius:6, background:a[1] } }),
                React.createElement('span', { style:{ fontSize:14, fontWeight:800, color:'#111' } }, a[0]));
            }))),
        React.createElement('div', { style:{ position:'absolute', left:600, top:250, width:470 } },
          [pick(lang,'You get a notification','Du får et varsel'),
           pick(lang,'Open YOUR own payment app','Åpne DIN egen betalingsapp'),
           pick(lang,'Complete the payment yourself','Fullfør betalingen selv')].map((s, i) => {
            const e = fu(localTime, 0.6 + i*0.6, 0.5, 16);
            return React.createElement('div', { key:i, style:{ ...e, display:'flex', gap:14, alignItems:'center', marginBottom:16 } },
              React.createElement('span', { style:{ width:34, height:34, borderRadius:'50%', flex:'none', display:'grid', placeItems:'center',
                fontWeight:800, color:'#21122e', background:'linear-gradient(135deg,#FF7EA5,#FFC861)' } }, i+1),
              React.createElement('span', { style:{ fontSize:19, color:INK, fontWeight:600 } }, s));
          })),
        React.createElement(Caption, { idx:2, total:4, color:BLUE,
          title: pick(lang,'You pay from your own app','Du betaler fra din egen app'),
          sub: 'Vipps · Venmo · PayPal' }));
    }),

    /* 3 confirm sent -> stars deducted */
    React.createElement(Sprite, { start:14.5, end:19.5 }, ({ localTime }) => {
      const sent = localTime > 2.2;
      return React.createElement(React.Fragment, null,
        React.createElement(Phone, { x:510, y:100, w:250, glow:true },
          React.createElement('div', { style:{ padding:'34px 20px', textAlign:'center' } },
            React.createElement('div', { style:{ fontSize:15, color:SUB, marginBottom:20 } }, pick(lang,'Cash out · $12','Innveksling · 120 kr')),
            !sent
              ? React.createElement('div', { style:{ background:'linear-gradient(120deg,#34D399,#7FB0FF)', color:'#06231a',
                  fontWeight:800, fontSize:16, borderRadius:12, padding:'14px 0' } }, pick(lang,'Mark as sent','Marker som sendt'))
              : React.createElement('div', { style:{ ...fu(localTime,2.2,0.5) } },
                  React.createElement('div', { style:{ fontSize:54 } }, '✅'),
                  React.createElement('div', { style:{ color:GREEN, fontWeight:700, fontSize:18, marginTop:8 } }, pick(lang,'Sent','Sendt')),
                  React.createElement('div', { style:{ fontSize:14, color:SUB, marginTop:10 } }, pick(lang,'12 ⭐ deducted','12 ⭐ trukket'))))),
        !sent ? React.createElement(Tap, { x:635, y:300, at:1.2, lt:localTime }) : null,
        React.createElement(Caption, { idx:3, total:4, color:GREEN,
          title: pick(lang,'Confirm "sent" — stars are deducted','Bekreft «sendt» — stjernene trekkes'),
          sub: pick(lang,'Only after you confirm','Først når du bekrefter') }));
    }),

    /* 4 safety */
    React.createElement(Sprite, { start:19.5, end:25 }, ({ localTime }) => {
      const e = pop(localTime, 0.2, 0.6);
      return React.createElement('div', { style:{ position:'absolute', inset:0, display:'grid', placeItems:'center', padding:'0 140px', paddingBottom:100 } },
        React.createElement('div', { style:{ textAlign:'center', opacity:e.o, transform:`scale(${e.s})` } },
          React.createElement('div', { style:{ fontSize:64 } }, '🔒'),
          React.createElement('div', { style:{ fontFamily:HEAD, fontWeight:700, fontSize:34, color:INK, marginTop:10, lineHeight:1.25 } },
            pick(lang,'The app never moves money itself','Appen flytter aldri penger selv')),
          React.createElement('div', { style:{ fontSize:19, color:SUB, marginTop:12 } },
            pick(lang,'No card details, no payment license, full parental control','Ingen kortdata, ingen betalingslisens, full foreldrekontroll'))));
    })
  );
}

/* ═══════════ TOPIC 6 — Weekly allowance / Ukelønn ═══════════ */
function T6({ lang }) {
  return React.createElement(React.Fragment, null,
    React.createElement(Bg),
    React.createElement(Hud, { kicker: pick(lang,'OPTIONAL','VALGFRITT'), title: pick(lang,'Weekly allowance','Ukelønn') }),

    React.createElement(Sprite, { start:0, end:3 }, ({ localTime }) => {
      const e = fu(localTime, 0.1, 0.6, 22);
      return React.createElement('div', { style:{ position:'absolute', inset:0, display:'grid', placeItems:'center' } },
        React.createElement('div', { style:{ textAlign:'center', ...e } },
          React.createElement('div', { style:{ fontSize:58 } }, '💰'),
          React.createElement('div', { style:{ fontFamily:HEAD, fontWeight:700, fontSize:50, color:INK, marginTop:6 } },
            pick(lang,'Weekly allowance','Ukelønn')),
          React.createElement('div', { style:{ fontSize:20, color:SUB, marginTop:8 } },
            pick(lang,'Give stars a real cash value','Gi stjerner en ekte kroneverdi'))));
    }),

    /* 1 set star value */
    React.createElement(Sprite, { start:3, end:9 }, ({ localTime }) => {
      const e = pop(localTime, 0.3, 0.6);
      return React.createElement(React.Fragment, null,
        React.createElement('div', { style:{ position:'absolute', left:'50%', top:210, transform:'translateX(-50%)',
          display:'flex', gap:18, alignItems:'center', opacity:e.o, transform:`translateX(-50%) scale(${e.s})` } },
          React.createElement('div', { style:{ width:130, height:130, borderRadius:'50%', display:'grid', placeItems:'center',
            fontSize:60, background:'radial-gradient(circle,#FFE08A,#F2A93B)' } }, '⭐'),
          React.createElement('div', { style:{ fontFamily:HEAD, fontWeight:700, fontSize:56, color:INK } }, '='),
          React.createElement('div', { style:{ width:150, height:130, borderRadius:24, display:'grid', placeItems:'center',
            fontFamily:HEAD, fontWeight:700, fontSize:40, color:GREEN, background:GREEN+'1f', border:'1px solid '+GREEN+'55' } },
            pick(lang,'$1','10 kr'))),
        React.createElement(Caption, { idx:1, total:3, color:GREEN,
          title: pick(lang,'You set what a star is worth','Du bestemmer hva en stjerne er verdt'),
          sub: pick(lang,'Every earned star adds to a balance','Hver opptjent stjerne øker saldoen') }));
    }),

    /* 2 balance grows */
    React.createElement(Sprite, { start:9, end:15 }, ({ localTime }) => {
      const stars = clamp(Math.floor((localTime - 0.4) / 0.35), 0, 12);
      const val = pick(lang, '$' + stars, (stars*10) + ' kr');
      return React.createElement(React.Fragment, null,
        React.createElement('div', { style:{ position:'absolute', left:'50%', top:180, transform:'translateX(-50%)', textAlign:'center', width:560 } },
          React.createElement(Meter, { x:170, y:0, total:12, filled:stars, size:26 }),
          React.createElement('div', { style:{ marginTop:96, fontSize:15, color:MUT, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase' } },
            pick(lang,'Saved balance','Spart saldo')),
          React.createElement('div', { style:{ fontFamily:HEAD, fontWeight:700, fontSize:60, color:GREEN, marginTop:4 } }, val)),
        React.createElement(Caption, { idx:2, total:3, color:GREEN,
          title: pick(lang,'The balance grows as stars add up','Saldoen vokser når stjernene samler seg'),
          sub: pick(lang,'Kids learn to save; you keep full oversight','Barna lærer å spare; du har full oversikt') }));
    }),

    /* 3 link to cash out */
    React.createElement(Sprite, { start:15, end:20.5 }, ({ localTime }) => {
      const e = pop(localTime, 0.2, 0.6);
      return React.createElement('div', { style:{ position:'absolute', inset:0, display:'grid', placeItems:'center', paddingBottom:100 } },
        React.createElement('div', { style:{ textAlign:'center', opacity:e.o, transform:`scale(${e.s})` } },
          React.createElement('div', { style:{ display:'flex', gap:16, justifyContent:'center', alignItems:'center', marginBottom:16 } },
            React.createElement(Chip, { color:MUT, style:{ fontSize:16 } }, '⏻ ', pick(lang,'Off by default','Av som standard')),
            React.createElement('span', { style:{ fontSize:24, color:MUT } }, '→'),
            React.createElement(Chip, { color:GREEN, bg:GREEN+'22', style:{ fontSize:16 } }, '💸 ', pick(lang,'Cash out when ready','Cash out når klar'))),
          React.createElement('div', { style:{ fontFamily:HEAD, fontWeight:600, fontSize:30, color:INK, marginTop:8 } },
            pick(lang,'Switch it on when the family is ready','Skru den på når familien er klar')),
          React.createElement('div', { style:{ fontSize:18, color:SUB, marginTop:10 } },
            pick(lang,'The balance can be cashed out via Vipps, Venmo or PayPal','Saldoen kan veksles inn via Vipps, Venmo eller PayPal'))));
    })
  );
}

/* ═══════════ TOPIC 7 — Morning Round / Morgenrunden ═══════════ */
function T7({ lang }) {
  const kids = [['🌸','Nora'],['👧','Emma'],['🦊','Victor']];
  return React.createElement(React.Fragment, null,
    React.createElement(Bg),
    React.createElement(Hud, { kicker: pick(lang,'TOGETHER','SAMMEN'), title: pick(lang,'Morning Round','Morgenrunden') }),

    React.createElement(Sprite, { start:0, end:3 }, ({ localTime }) => {
      const e = fu(localTime, 0.1, 0.6, 22);
      return React.createElement('div', { style:{ position:'absolute', inset:0, display:'grid', placeItems:'center' } },
        React.createElement('div', { style:{ textAlign:'center', ...e } },
          React.createElement('div', { style:{ fontSize:58 } }, '🌅'),
          React.createElement('div', { style:{ fontFamily:HEAD, fontWeight:700, fontSize:50, color:INK, marginTop:6 } },
            pick(lang,'Morning Round','Morgenrunden')),
          React.createElement('div', { style:{ fontSize:20, color:SUB, marginTop:8 } },
            pick(lang,'A shared check-in the whole family does','Et felles innsjekk hele familien gjør'))));
    }),

    /* kids check in one by one */
    React.createElement(Sprite, { start:3, end:11 }, ({ localTime }) => {
      const inCount = clamp(Math.floor((localTime - 0.6) / 1.6) + 1, 0, 3);
      return React.createElement(React.Fragment, null,
        React.createElement('div', { style:{ position:'absolute', left:0, right:0, top:180, display:'flex', justifyContent:'center', gap:40 } },
          kids.map((k, i) => {
            const on = i < inCount;
            const e = pop(on ? localTime : 0, 0.6 + i*1.6, 0.5);
            return React.createElement('div', { key:i, style:{ textAlign:'center' } },
              React.createElement('div', { style:{ width:120, height:120, borderRadius:'50%', display:'grid', placeItems:'center',
                fontSize:56, background: on ? 'radial-gradient(circle,#FFD66B,#F2A93B)' : 'rgba(255,255,255,.06)',
                border: on ? 'none' : '2px dashed rgba(255,255,255,.2)', opacity: on ? 1 : .4,
                transform:`scale(${on ? e.s : 0.9})`, transition:'opacity .3s' } }, k[0]),
              React.createElement('div', { style:{ fontSize:18, color:INK, fontWeight:700, marginTop:10 } }, k[1]),
              on ? React.createElement('div', { style:{ ...fu(localTime,0.6+i*1.6+0.2,0.4), color:GREEN, fontSize:14, fontWeight:700, marginTop:2 } },
                '✓ ', pick(lang,'Checked in','Sjekket inn')) : React.createElement('div', { style:{ color:MUT, fontSize:14, marginTop:2 } }, pick(lang,'Waiting…','Venter…')));
          })),
        React.createElement(Caption, { idx:1, total:2, color:GOLD,
          title: pick(lang,'Everyone checks in, one by one','Alle sjekker inn, én etter én'),
          sub: pick(lang,'With their profile photos — credited instantly','Med profilbildene sine — godskrives umiddelbart') }));
    }),

    /* slot machine reward */
    React.createElement(Sprite, { start:11, end:17.5 }, ({ localTime }) => {
      const rolling = localTime < 2.2;
      const faces = ['🍿','🎬','🍦','🎡','🎁'];
      const face = rolling ? faces[Math.floor(localTime * 8) % faces.length] : '🎬';
      const e = pop(localTime, 0.1, 0.5);
      return React.createElement(React.Fragment, null,
        React.createElement('div', { style:{ position:'absolute', inset:0, display:'grid', placeItems:'center', paddingBottom:130 } },
          React.createElement('div', { style:{ textAlign:'center', opacity:e.o, transform:`scale(${e.s})` } },
            React.createElement('div', { style:{ width:180, height:180, borderRadius:28, margin:'0 auto', display:'grid', placeItems:'center',
              fontSize:88, background:'rgba(255,255,255,.06)', border:'2px solid '+GOLD+'66',
              boxShadow: rolling ? 'none' : '0 0 50px rgba(255,197,61,.4)' } }, face),
            React.createElement('div', { style:{ fontFamily:HEAD, fontWeight:700, fontSize:30, color:INK, marginTop:16 } },
              rolling ? pick(lang,'Spinning…','Snurrer…') : pick(lang,'Family movie night! 🎉','Familiefilmkveld! 🎉')),
            !rolling ? React.createElement(Chip, { color:GOLD, bg:GOLD+'22', style:{ marginTop:12, fontSize:16 } },
              '+1 ⭐ ', pick(lang,'bonus for everyone','bonus til alle')) : null)),
        React.createElement(Caption, { idx:2, total:2, color:PINK,
          title: pick(lang,'Ends with a shared reward','Ender med en delt belønning'),
          sub: pick(lang,'A reward slot machine the whole family shares','En premie-spillemaskin hele familien deler') }));
    })
  );
}

/* ═══════════ TOPIC 8 — Widgets & StandBy ═══════════ */
function T8({ lang }) {
  return React.createElement(React.Fragment, null,
    React.createElement(Bg),
    React.createElement(Hud, { kicker: pick(lang,'ANY SCREEN','ENHVER SKJERM'), title: pick(lang,'Widgets & StandBy') }),

    React.createElement(Sprite, { start:0, end:3 }, ({ localTime }) => {
      const e = fu(localTime, 0.1, 0.6, 22);
      return React.createElement('div', { style:{ position:'absolute', inset:0, display:'grid', placeItems:'center' } },
        React.createElement('div', { style:{ textAlign:'center', ...e } },
          React.createElement('div', { style:{ fontSize:56 } }, '🧩'),
          React.createElement('div', { style:{ fontFamily:HEAD, fontWeight:700, fontSize:48, color:INK, marginTop:8 } }, 'Widgets & StandBy'),
          React.createElement('div', { style:{ fontSize:20, color:SUB, marginTop:8 } },
            pick(lang,'The family board on the screens you have','Familietavla på skjermene du har'))));
    }),

    /* widgets */
    React.createElement(Sprite, { start:3, end:9 }, ({ localTime }) => {
      const widgets = [
        ['⭐', pick(lang,'Nora','Nora'), '8 ⭐ · 🔥 4'],
        ['🗓️', pick(lang,'Today','I dag'), pick(lang,'3 things','3 ting')],
        ['🔔', pick(lang,'Pending','Venter'), '2'],
      ];
      return React.createElement(React.Fragment, null,
        React.createElement('div', { style:{ position:'absolute', left:0, right:0, top:190, display:'flex', justifyContent:'center', gap:24 } },
          widgets.map((w, i) => {
            const e = pop(localTime, 0.3 + i*0.4, 0.55);
            return React.createElement('div', { key:i, style:{ width:190, height:170, borderRadius:24, background:CARD, border:BORD,
              padding:'20px', opacity:e.o, transform:`scale(${e.s})`, boxShadow:'0 20px 46px rgba(0,0,0,.4)' } },
              React.createElement('div', { style:{ fontSize:34 } }, w[0]),
              React.createElement('div', { style:{ fontFamily:HEAD, fontWeight:600, fontSize:20, color:INK, marginTop:16 } }, w[1]),
              React.createElement('div', { style:{ fontSize:18, color:GOLD, fontWeight:700, marginTop:6 } }, w[2]));
          })),
        React.createElement(Caption, { idx:1, total:3, color:GOLD,
          title: pick(lang,'Widgets on Home or Lock Screen','Widgets på Hjem- eller Låseskjerm'),
          sub: pick(lang,'Child status, the day plan, pending approvals','Barn-status, dagens plan, ventende godkjenninger') }));
    }),

    /* standby */
    React.createElement(Sprite, { start:9, end:14.5 }, ({ localTime }) => {
      const e = pop(localTime, 0.3, 0.6);
      return React.createElement(React.Fragment, null,
        React.createElement('div', { style:{ position:'absolute', left:'50%', top:170, transform:`translateX(-50%) scale(${e.s})`, opacity:e.o } },
          React.createElement('div', { style:{ width:420, height:236, borderRadius:22, background:'#14122b', border:'2px solid rgba(255,255,255,.16)',
            boxShadow:'0 30px 70px rgba(0,0,0,.55)', padding:10 } },
            React.createElement('div', { style:{ width:'100%', height:'100%', borderRadius:14, background:'linear-gradient(135deg,#1a1738,#0f0e22)',
              display:'flex', alignItems:'center', justifyContent:'space-around', padding:'0 24px' } },
              [['🌸','Nora','8⭐'],['👧','Emma','5⭐']].map((k,i) =>
                React.createElement('div', { key:i, style:{ textAlign:'center' } },
                  React.createElement('div', { style:{ width:64, height:64, borderRadius:'50%', margin:'0 auto', display:'grid', placeItems:'center',
                    fontSize:32, background:'radial-gradient(circle,#FFD66B,#F2A93B)' } }, k[0]),
                  React.createElement('div', { style:{ fontSize:16, color:INK, fontWeight:700, marginTop:8 } }, k[1]),
                  React.createElement('div', { style:{ fontSize:15, color:GOLD, fontWeight:700 } }, k[2]))),
              React.createElement('div', { style:{ fontSize:44 } }, '🌙'))),
          React.createElement('div', { style:{ width:200, height:12, background:'rgba(255,255,255,.1)', borderRadius:'0 0 12px 12px', margin:'0 auto' } })),
        React.createElement(Caption, { idx:2, total:3, color:BLUE,
          title: pick(lang,'StandBy turns a phone into a board','StandBy gjør telefonen til en tavle'),
          sub: pick(lang,'On its charger, landscape — no iPad required','På lader, liggende — uten en iPad') }));
    }),

    /* live activity */
    React.createElement(Sprite, { start:14.5, end:20 }, ({ localTime }) => {
      const prog = clamp((localTime - 0.5) / 3, 0, 1);
      const e = pop(localTime, 0.2, 0.6);
      return React.createElement(React.Fragment, null,
        React.createElement('div', { style:{ position:'absolute', left:'50%', top:210, transform:`translateX(-50%) scale(${e.s})`, opacity:e.o, width:560 } },
          React.createElement('div', { style:{ background:'#000', borderRadius:22, padding:'18px 24px', display:'flex', alignItems:'center', gap:16,
            border:'1px solid rgba(255,255,255,.14)' } },
            React.createElement('div', { style:{ fontSize:34 } }, '🌅'),
            React.createElement('div', { style:{ flex:1 } },
              React.createElement('div', { style:{ fontSize:16, color:INK, fontWeight:700, marginBottom:8 } }, pick(lang,'Morning Round','Morgenrunden')),
              React.createElement('div', { style:{ height:12, borderRadius:99, background:'rgba(255,255,255,.12)', overflow:'hidden' } },
                React.createElement('div', { style:{ width:(prog*100)+'%', height:'100%', background:'linear-gradient(90deg,#FF7EA5,#FFC861)' } }))),
            React.createElement('div', { style:{ fontFamily:HEAD, fontWeight:700, fontSize:20, color:GOLD } }, Math.round(prog*3) + '/3'))),
        React.createElement(Caption, { idx:3, total:3, color:PINK,
          title: pick(lang,'Live Activity while it runs','Live Activity mens det pågår'),
          sub: pick(lang,'On the Lock Screen and in the Dynamic Island','På låseskjermen og i Dynamic Island') }));
    })
  );
}

/* ═══════════ TOPIC 9 — Own phone for bigger kids ═══════════ */
function T9({ lang }) {
  return React.createElement(React.Fragment, null,
    React.createElement(Bg),
    React.createElement(Hud, { kicker: pick(lang,'BIG-KID MODE','STØRRE BARN'), title: pick(lang,'Their own phone','Egen telefon') }),

    React.createElement(Sprite, { start:0, end:3.2 }, ({ localTime }) => {
      const e = fu(localTime, 0.1, 0.6, 22);
      return React.createElement('div', { style:{ position:'absolute', inset:0, display:'grid', placeItems:'center' } },
        React.createElement('div', { style:{ textAlign:'center', ...e } },
          React.createElement('div', { style:{ fontSize:58 } }, '📱'),
          React.createElement('div', { style:{ fontFamily:HEAD, fontWeight:700, fontSize:46, color:INK, marginTop:8 } },
            pick(lang,'A phone of their own','En egen telefon')),
          React.createElement('div', { style:{ fontSize:20, color:SUB, marginTop:8 } },
            pick(lang,'For bigger kids who don\u2019t want to share the iPad','For større barn som ikke vil dele iPaden'))));
    }),

    /* 1 link with code */
    React.createElement(Sprite, { start:3.2, end:9 }, ({ localTime }) => {
      const travel = clamp((localTime - 1.2) / 1.4, 0, 1);
      return React.createElement(React.Fragment, null,
        React.createElement(Phone, { x:270, y:130, w:180 },
          React.createElement('div', { style:{ padding:'24px 12px', textAlign:'center' } },
            React.createElement('div', { style:{ fontSize:11, color:MUT, marginTop:14, fontWeight:700 } }, pick(lang,'PARENT · iPhone','FORELDER · iPhone')),
            React.createElement('div', { style:{ fontFamily:HEAD, fontWeight:700, fontSize:34, color:GOLD, letterSpacing:'.12em', marginTop:22 } }, '4 7 2 9'),
            React.createElement('div', { style:{ fontSize:11, color:SUB, marginTop:10 } }, pick(lang,'Link code','Koblingskode')))),
        React.createElement('div', { style:{ position:'absolute', left:470, top:290, width:190 } },
          React.createElement('div', { style:{ height:3, background:'rgba(255,255,255,.14)', position:'relative' } },
            React.createElement('div', { style:{ position:'absolute', left:(travel*100)+'%', top:-11, fontSize:22, transform:'translateX(-50%)' } }, '🔑'))),
        React.createElement(Phone, { x:700, y:130, w:180 },
          React.createElement('div', { style:{ padding:'24px 12px', textAlign:'center' } },
            React.createElement('div', { style:{ fontSize:11, color:MUT, marginTop:14, fontWeight:700 } }, pick(lang,'CHILD · phone','BARN · telefon')),
            travel > 0.9
              ? React.createElement('div', { style:{ ...fu(localTime,2.6,0.5), marginTop:26 } },
                  React.createElement('div', { style:{ fontSize:40 } }, '✅'),
                  React.createElement('div', { style:{ fontSize:12, color:GREEN, fontWeight:700, marginTop:8 } }, pick(lang,'Linked','Koblet')))
              : React.createElement('div', { style:{ fontSize:34, color:'rgba(255,255,255,.2)', marginTop:36 } }, '• • • •'))),
        React.createElement(Caption, { idx:1, total:3, color:GOLD,
          title: pick(lang,'Linked with a code from you','Koblet med en kode fra deg'),
          sub: pick(lang,'No Apple ID, no child account — just an anonymous token','Ingen Apple-ID, ingen barnekonto — bare en anonym token') }));
    }),

    /* 2 private board + suggest task */
    React.createElement(Sprite, { start:9, end:15 }, ({ localTime }) => {
      const sent = localTime > 2.6;
      return React.createElement(React.Fragment, null,
        React.createElement(Phone, { x:250, y:110, w:230, glow:true },
          React.createElement('div', { style:{ padding:'22px 16px' } },
            React.createElement('div', { style:{ fontSize:12, color:MUT, fontWeight:700, marginBottom:12 } }, pick(lang,'VICTOR · MY BOARD','VICTOR · MIN TAVLE')),
            React.createElement('div', { style:{ position:'relative', width:129, height:66 } },
              React.createElement(Meter, { x:0, y:0, total:10, filled:6, size:18 })),
            React.createElement('div', { style:{ marginTop:8, background:'rgba(255,255,255,.06)', border:BORD, borderRadius:12, padding:'12px', fontSize:13, color:INK } },
              '➕ ', pick(lang,'Suggest a task','Foreslå en oppgave')))),
        React.createElement('div', { style:{ position:'absolute', left:520, top:250, width:250, textAlign:'center' } },
          sent ? React.createElement('div', { style:{ ...fu(localTime,2.6,0.5), fontSize:22, color:GOLD } }, '→ 📨 →') : React.createElement('div', { style:{ fontSize:22, color:MUT } }, '···')),
        React.createElement(Phone, { x:790, y:110, w:230, glow:true },
          React.createElement('div', { style:{ padding:'22px 16px' } },
            React.createElement('div', { style:{ fontSize:12, color:MUT, fontWeight:700, marginBottom:12 } }, pick(lang,'PARENT · APPROVE','FORELDER · GODKJENN')),
            sent
              ? React.createElement('div', { style:{ ...fu(localTime,3.0,0.5), background:'rgba(255,255,255,.06)', border:BORD, borderRadius:12, padding:'14px' } },
                  React.createElement('div', { style:{ fontSize:13, color:INK, marginBottom:12 } }, pick(lang,'Victor: "Wash the car" 🚗','Victor: «Vaske bilen» 🚗')),
                  React.createElement('div', { style:{ background:'linear-gradient(120deg,#34D399,#7FB0FF)', color:'#06231a', textAlign:'center', fontWeight:800, fontSize:13, borderRadius:9, padding:'8px 0' } }, pick(lang,'Approve','Godkjenn')))
              : React.createElement('div', { style:{ color:'rgba(255,255,255,.25)', fontSize:13, marginTop:20, textAlign:'center' } }, pick(lang,'Waiting…','Venter…')))),
        React.createElement(Caption, { idx:2, total:3, color:GREEN,
          title: pick(lang,'A private board — kids can suggest tasks','En privat tavle — barna kan foreslå oppgaver'),
          sub: pick(lang,'Suggestions come to you for approval. You decide.','Forslag kommer til deg for godkjenning. Du bestemmer.') }));
    }),

    /* 3 still your control */
    React.createElement(Sprite, { start:15, end:20 }, ({ localTime }) => {
      const e = pop(localTime, 0.2, 0.6);
      return React.createElement('div', { style:{ position:'absolute', inset:0, display:'grid', placeItems:'center', paddingBottom:100 } },
        React.createElement('div', { style:{ textAlign:'center', opacity:e.o, transform:`scale(${e.s})` } },
          React.createElement('div', { style:{ fontSize:64 } }, '🛡️'),
          React.createElement('div', { style:{ fontFamily:HEAD, fontWeight:700, fontSize:36, color:INK, marginTop:10 } },
            pick(lang,'Still no child account, still your control','Fortsatt ingen barnekonto, fortsatt din kontroll')),
          React.createElement('div', { style:{ fontSize:18, color:SUB, marginTop:12 } },
            pick(lang,'Approve what matters — unlink the device anytime','Godkjenn det som teller — koble fra enheten når du vil'))));
    })
  );
}

/* ── chapter registry ───────────────────────────────────────── */
const CHAPTERS = [
  { id:'setup',    icon:'📲', en:'Getting started',        no:'Kom i gang',              dur:34,   Scene:T1 },
  { id:'loop',     icon:'⭐', en:'The core loop',           no:'Kjernesløyfa',            dur:24,   Scene:T2 },
  { id:'blocks',   icon:'🧩', en:'Routines · Tasks · Cycles', no:'Rutiner · Oppgaver · Sykluser', dur:24, Scene:T3 },
  { id:'ladder',   icon:'🎁', en:'Reward ladder',           no:'Premie-stige',            dur:23.5, Scene:T4 },
  { id:'cashout',  icon:'💸', en:'Cash out',                no:'Cash out',                dur:25,   Scene:T5 },
  { id:'allowance',icon:'💰', en:'Weekly allowance',        no:'Ukelønn',                 dur:20.5, Scene:T6 },
  { id:'morning',  icon:'🌅', en:'Morning Round',           no:'Morgenrunden',            dur:17.5, Scene:T7 },
  { id:'widgets',  icon:'🖥️', en:'Widgets & StandBy',       no:'Widgets & StandBy',       dur:20,   Scene:T8 },
  { id:'ownphone', icon:'📱', en:'Their own phone',         no:'Egen telefon',            dur:20,   Scene:T9 },
];

/* ── deep-link helpers ──────────────────────────────────────── */
function readURL() {
  try {
    const q = new URLSearchParams(location.search);
    const tema = q.get('tema');
    const sprak = q.get('sprak') || q.get('lang');
    const i = CHAPTERS.findIndex(c => c.id === tema);
    return { idx: i >= 0 ? i : null, lang: (sprak === 'no' || sprak === 'en') ? sprak : null };
  } catch (e) { return { idx: null, lang: null }; }
}
function writeURL(id, lang) {
  try {
    const u = new URL(location.href);
    u.searchParams.set('tema', id);
    u.searchParams.set('sprak', lang);
    history.replaceState(null, '', u.toString());
  } catch (e) {}
}

/* ── embeddable single-video (for the Guide page) ───────────── */
function HowToEmbed({ tema, sprak, loop }) {
  const i = CHAPTERS.findIndex(c => c.id === tema);
  const ch = CHAPTERS[i >= 0 ? i : 0];
  const lang = (sprak === 'en') ? 'en' : 'no';
  gLang = lang;
  const Scene = ch.Scene;
  return React.createElement('div', { style:{ position:'relative', width:'100%', height:'100%', background:'#0a0a0a' } },
    React.createElement(Stage, { key: ch.id + '-' + lang, width:1280, height:720, duration: ch.dur,
      background: BG, persistKey: 'ofh-embed-' + ch.id, loop: loop !== 'false', autoplay:true, keyboard:false },
      React.createElement(Scene, { lang: lang })));
}
window.HowToEmbed = HowToEmbed;

/* ── player shell ───────────────────────────────────────────── */
function HowToPlayer() {
  const url = readURL();
  const [lang, setLang] = React.useState(() => { try { return url.lang || localStorage.getItem('ofh-howto-lang') || 'no'; } catch { return url.lang || 'no'; } });
  const [idx, setIdx]  = React.useState(() => { if (url.idx != null) return url.idx; try { return +(localStorage.getItem('ofh-howto-idx')||0)||0; } catch { return 0; } });
  React.useEffect(() => { try { localStorage.setItem('ofh-howto-lang', lang); } catch {} }, [lang]);
  React.useEffect(() => { try { localStorage.setItem('ofh-howto-idx', String(idx)); } catch {} }, [idx]);
  React.useEffect(() => { writeURL(CHAPTERS[idx].id, lang); }, [idx, lang]);
  gLang = lang;

  const ch = CHAPTERS[idx];
  const Scene = ch.Scene;

  const seg = (val, label) => React.createElement('button', { onClick:() => setLang(val),
    style:{ flex:1, padding:'7px 0', fontSize:13, fontWeight:800, letterSpacing:'.04em', cursor:'pointer',
      border:'none', borderRadius:8, color: lang===val ? '#21122e' : SUB,
      background: lang===val ? 'linear-gradient(120deg,#FF7EA5,#FFC861)' : 'transparent' } }, label);

  return React.createElement('div', { style:{ display:'flex', height:'100vh', width:'100%', background:'#0a0a0a',
    color:INK, fontFamily:BODY, overflow:'hidden' } },

    /* sidebar */
    React.createElement('div', { style:{ width:298, flex:'none', height:'100%', overflowY:'auto',
      background:'#0d0c1c', borderRight:'1px solid rgba(255,255,255,.08)', padding:'22px 18px', boxSizing:'border-box' } },
      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:10, marginBottom:6 } },
        React.createElement('div', { style:{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,#A855F7,#FF7EA5)',
          display:'grid', placeItems:'center', fontSize:17, boxShadow:'0 6px 16px rgba(168,85,247,.5)' } }, '⭐'),
        React.createElement('div', { style:{ fontFamily:HEAD, fontWeight:700, fontSize:17 } }, 'OurFamilyHub')),
      React.createElement('div', { style:{ fontSize:13, color:MUT, marginBottom:16, paddingLeft:2 } },
        pick(lang,'How-to videos','How-to-videoer')),

      React.createElement('div', { style:{ display:'flex', gap:4, background:'rgba(255,255,255,.05)', border:BORD,
        borderRadius:10, padding:4, marginBottom:18 } }, seg('no','NORSK'), seg('en','ENGLISH')),

      React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:6 } },
        CHAPTERS.map((c, i) => {
          const active = i === idx;
          return React.createElement('button', { key:c.id, onClick:() => setIdx(i),
            style:{ display:'flex', alignItems:'center', gap:12, textAlign:'left', cursor:'pointer',
              padding:'11px 12px', borderRadius:12, border: active ? '1px solid rgba(255,197,61,.4)' : '1px solid transparent',
              background: active ? 'rgba(255,197,61,.10)' : 'transparent', color: active ? INK : SUB,
              fontFamily:BODY, fontSize:14.5, fontWeight: active ? 700 : 500 } },
            React.createElement('span', { style:{ width:30, height:30, flex:'none', borderRadius:8, display:'grid', placeItems:'center',
              fontSize:16, background: active ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.04)' } }, c.icon),
            React.createElement('span', { style:{ flex:1, lineHeight:1.25 } }, pick(lang, c.en, c.no)),
            React.createElement('span', { style:{ fontSize:11, color:MUT, fontFamily:'ui-monospace,monospace' } }, Math.round(c.dur) + 's'));
        })),

      React.createElement('div', { style:{ marginTop:20, paddingTop:16, borderTop:'1px solid rgba(255,255,255,.08)',
        fontSize:12, color:MUT, lineHeight:1.6 } },
        pick(lang,'Space to play · ← → to seek','Mellomrom = spill · ← → = spol'),
        React.createElement('br'),
        pick(lang,'Use the ⤓ button to export a video','Bruk ⤓-knappen for å eksportere video'))),

    /* stage area */
    React.createElement('div', { style:{ flex:1, minWidth:0, height:'100%', position:'relative' } },
      React.createElement(Stage, { key: ch.id + '-' + lang, width:1280, height:720, duration: ch.dur,
        background: BG, persistKey: 'ofh-howto-' + ch.id, loop:true, autoplay:true },
        React.createElement(Scene, { lang: lang })))
  );
}

window.HowToPlayer = HowToPlayer;
