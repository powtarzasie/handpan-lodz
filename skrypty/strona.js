/* Handpan Łódź — skrypty strony.
   Wszystko poniżej to progressive enhancement: strona jest w pełni czytelna,
   nawigowalna i indeksowalna również bez JavaScriptu. */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const ruchOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const oszczedzajDane = !!(navigator.connection && navigator.connection.saveData);

  /* ---------- menu mobilne ---------- */
  const przelacznik = $('.przelacznik-menu');
  const nawigacja = $('.nawigacja');
  if (przelacznik && nawigacja) {
    przelacznik.addEventListener('click', () => {
      const otwarte = nawigacja.classList.toggle('otwarta');
      przelacznik.setAttribute('aria-expanded', String(otwarte));
    });
    nawigacja.addEventListener('click', (e) => {
      if (e.target.closest('a')) {
        nawigacja.classList.remove('otwarta');
        przelacznik.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- cień nagłówka po przewinięciu ---------- */
  const naglowek = $('.naglowek');
  if (naglowek) {
    let zaplanowane = false;
    const odswiez = () => { naglowek.classList.toggle('przewinieto', window.scrollY > 8); zaplanowane = false; };
    window.addEventListener('scroll', () => {
      if (!zaplanowane) { zaplanowane = true; requestAnimationFrame(odswiez); }
    }, { passive: true });
    odswiez();
  }

  /* ---------- odsłanianie treści przy scrollu ---------- */
  const odslony = $$('.odslon');
  if ('IntersectionObserver' in window && odslony.length) {
    const io = new IntersectionObserver((wpisy) => {
      for (const w of wpisy) {
        if (w.isIntersecting) { w.target.classList.add('widoczna'); io.unobserve(w.target); }
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    odslony.forEach((el) => io.observe(el));
  } else {
    odslony.forEach((el) => el.classList.add('widoczna'));
  }

  /* ---------- hero: fale na wodzie + letnie drobinki ---------- */
  const hero = $('.hero');
  const plotnoFal = $('.hero__fale');
  const plotnoPylu = $('.hero__pyl');
  const uruchomAmbientHero = () => {
    const ktxF = plotnoFal.getContext('2d');
    const ktxP = plotnoPylu.getContext('2d');
    let szer = 0, wys = 0, dpr = 1;
    let aktywne = true;
    const fale = [];
    const drobinki = [];
    let ostatniScroll = window.scrollY;
    let impuls = 0;
    let ostatniaFalaAuto = 0;
    let ostatniaFalaWsk = 0;

    const wymiaruj = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = hero.getBoundingClientRect();
      szer = r.width; wys = r.height;
      for (const c of [plotnoFal, plotnoPylu]) {
        c.width = Math.round(szer * dpr);
        c.height = Math.round(wys * dpr);
      }
      ktxF.setTransform(dpr, 0, 0, dpr, 0, 0);
      ktxP.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    wymiaruj();
    window.addEventListener('resize', wymiaruj);

    // środek handpanu na obrazie hero (tam rodzą się fale)
    const zrodloFal = () => {
      const img = $('.hero__obraz img');
      if (!img) return { x: szer * 0.72, y: wys * 0.6 };
      const r = img.getBoundingClientRect();
      const h = hero.getBoundingClientRect();
      return { x: r.left - h.left + r.width * 0.62, y: r.top - h.top + r.height * 0.72 };
    };

    const dodajFale = (x, y, sila = 1) => {
      fale.push({ x, y, r: 6, v: 0.55 + Math.random() * 0.25, zycie: 1, sila });
      if (fale.length > 26) fale.shift();
    };

    const iloscDrobinek = szer < 700 ? 16 : 30;
    for (let i = 0; i < iloscDrobinek; i++) {
      drobinki.push({
        x: Math.random() * szer,
        y: Math.random() * wys,
        r: 0.8 + Math.random() * 1.6,
        vx: -0.06 - Math.random() * 0.12,
        vy: -0.04 - Math.random() * 0.1,
        alfa: 0.18 + Math.random() * 0.3,
        faza: Math.random() * Math.PI * 2,
      });
    }

    window.addEventListener('scroll', () => {
      const d = window.scrollY - ostatniScroll;
      ostatniScroll = window.scrollY;
      impuls = Math.max(-2.2, Math.min(2.2, impuls + d * 0.02));
    }, { passive: true });

    hero.addEventListener('pointermove', (e) => {
      const teraz = performance.now();
      if (teraz - ostatniaFalaWsk < 260) return;
      ostatniaFalaWsk = teraz;
      const h = hero.getBoundingClientRect();
      dodajFale(e.clientX - h.left, e.clientY - h.top, 0.45);
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((w) => { aktywne = w[0].isIntersecting; })
        .observe(hero);
    }
    document.addEventListener('visibilitychange', () => { aktywne = !document.hidden; });

    const rysuj = (t) => {
      requestAnimationFrame(rysuj);
      if (!aktywne) return;

      // fale
      if (t - ostatniaFalaAuto > 2600) {
        ostatniaFalaAuto = t;
        const z = zrodloFal();
        dodajFale(z.x, z.y, 1);
      }
      ktxF.clearRect(0, 0, szer, wys);
      for (let i = fale.length - 1; i >= 0; i--) {
        const f = fale[i];
        f.r += f.v;
        f.zycie -= 0.006;
        if (f.zycie <= 0) { fale.splice(i, 1); continue; }
        const a = f.zycie * 0.32 * f.sila;
        ktxF.beginPath();
        ktxF.ellipse(f.x, f.y, f.r, f.r * 0.38, 0, 0, Math.PI * 2);
        ktxF.strokeStyle = `rgba(27,42,71,${a})`;
        ktxF.lineWidth = 1.4;
        ktxF.stroke();
        ktxF.beginPath();
        ktxF.ellipse(f.x, f.y, f.r * 0.82, f.r * 0.82 * 0.38, 0, 0, Math.PI * 2);
        ktxF.strokeStyle = `rgba(222,122,38,${a * 0.7})`;
        ktxF.lineWidth = 1;
        ktxF.stroke();
      }

      // drobinki letniego światła
      ktxP.clearRect(0, 0, szer, wys);
      impuls *= 0.94;
      for (const d of drobinki) {
        d.faza += 0.008;
        d.x += d.vx + Math.sin(d.faza) * 0.08;
        d.y += d.vy - impuls * 0.4;
        if (d.x < -8) d.x = szer + 8;
        if (d.x > szer + 8) d.x = -8;
        if (d.y < -8) d.y = wys + 8;
        if (d.y > wys + 8) d.y = -8;
        const mig = 0.75 + Math.sin(d.faza * 3) * 0.25;
        ktxP.beginPath();
        ktxP.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ktxP.fillStyle = `rgba(201,143,74,${d.alfa * mig})`;
        ktxP.fill();
      }
    };
    requestAnimationFrame(rysuj);
  };
  // ambientowe animacje startują dopiero po pełnym załadowaniu strony (nie konkurują z LCP)
  if (hero && plotnoFal && plotnoPylu && ruchOK && !oszczedzajDane) {
    const startAmbient = () => ('requestIdleCallback' in window
      ? requestIdleCallback(uruchomAmbientHero, { timeout: 2000 })
      : setTimeout(uruchomAmbientHero, 250));
    if (document.readyState === 'complete') startAmbient();
    else window.addEventListener('load', startAmbient, { once: true });
  }

  /* ---------- hero: podmiana akwareli na animację (Kling), gdy strona już wczytana ---------- */
  const obrazHero = $('.hero__obraz');
  if (obrazHero && ruchOK && !oszczedzajDane && window.matchMedia('(min-width: 841px)').matches) {
    window.addEventListener('load', () => {
      const v = document.createElement('video');
      v.muted = true; v.loop = true; v.playsInline = true;
      v.setAttribute('muted', ''); v.setAttribute('aria-hidden', 'true');
      v.src = '/zasoby/hero-fale-animacja.mp4';
      v.addEventListener('canplaythrough', () => {
        obrazHero.appendChild(v);
        v.play().catch(() => v.remove());
      }, { once: true });
      v.addEventListener('error', () => v.remove(), { once: true });
      v.load();
    }, { once: true });
  }

  /* ---------- grywalny handpan D-Kurd (Web Audio) ---------- */
  const instrument = $('#instrument-dkurd');
  if (instrument) {
    let ctx = null;
    let master = null;

    const zapewnijAudio = () => {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.55;
        const kompresor = ctx.createDynamicsCompressor();
        master.connect(kompresor);
        kompresor.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    };

    // Syntetyczny "handpanowy" ton: podstawa + oktawa + kwinta nad oktawą,
    // każdy składnik z własnym, coraz krótszym wybrzmieniem.
    const zagraj = (freq) => {
      if (!zapewnijAudio()) return;
      const t = ctx.currentTime;
      const skladniki = [
        [1.0, 0.5, 3.4],
        [2.0, 0.22, 2.3],
        [3.01, 0.11, 1.6],
        [4.16, 0.035, 0.9],
      ];
      for (const [mnoznik, amp, dlugosc] of skladniki) {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq * mnoznik;
        osc.detune.value = Math.random() * 5 - 2.5;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(amp, t + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dlugosc);
        osc.connect(g); g.connect(master);
        osc.start(t); osc.stop(t + dlugosc + 0.05);
      }
    };

    const warstwaFal = $('#warstwa-fal', instrument);
    const NS = 'http://www.w3.org/2000/svg';
    const falaWizualna = (cx, cy) => {
      if (!warstwaFal || !ruchOK) return;
      const kolo = document.createElementNS(NS, 'circle');
      kolo.setAttribute('cx', cx); kolo.setAttribute('cy', cy);
      kolo.setAttribute('r', '18');
      kolo.setAttribute('class', 'fala-dzwieku');
      warstwaFal.appendChild(kolo);
      const start = performance.now();
      const czas = 900;
      const krok = (teraz) => {
        const p = Math.max(0, Math.min(1, (teraz - start) / czas));
        kolo.setAttribute('r', String(18 + p * 92));
        kolo.setAttribute('opacity', String(0.85 * (1 - p)));
        if (p < 1) requestAnimationFrame(krok); else kolo.remove();
      };
      requestAnimationFrame(krok);
    };

    const uderz = (pole) => {
      const freq = parseFloat(pole.dataset.freq);
      if (!freq) return;
      const membrana = pole.querySelector('.membrana');
      const cx = parseFloat(membrana.getAttribute('cx'));
      const cy = parseFloat(membrana.getAttribute('cy'));
      zagraj(freq);
      falaWizualna(cx, cy);
    };

    $$('.pole', instrument).forEach((pole) => {
      pole.addEventListener('pointerdown', (e) => { e.preventDefault(); uderz(pole); });
      pole.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); uderz(pole); }
      });
    });
  }

  /* ---------- wyróżnienie najbliższego spotkania (auto wg daty) ---------- */
  const bilety = $$('.bilet[data-data]');
  if (bilety.length) {
    const dzis = new Date(); dzis.setHours(0, 0, 0, 0);
    const zData = bilety
      .map((el) => ({ el, d: new Date(el.dataset.data + 'T00:00:00') }))
      .filter((x) => !isNaN(x.d));
    const najblizszy = zData
      .filter((x) => x.d >= dzis)
      .sort((a, b) => a.d - b.d)[0];
    for (const { el, d } of zData) {
      const jest = najblizszy && el === najblizszy.el;
      const minione = d < dzis;
      el.classList.toggle('bilet--najblizsze', jest);
      el.classList.toggle('bilet--minione', minione);
      let odz = el.querySelector('.bilet__odznaka');
      if (!odz) { odz = document.createElement('span'); odz.className = 'bilet__odznaka'; el.prepend(odz); }
      odz.textContent = jest ? '✦ najbliższe spotkanie' : (minione ? 'minione' : 'kolejne spotkanie');
      odz.classList.toggle('bilet__odznaka--kolejne', !jest && !minione);
      odz.classList.toggle('bilet__odznaka--minione', minione);
    }
  }

  /* ---------- lite-embed YouTube (fasada) ---------- */
  $$('.fasada-yt').forEach((fasada) => {
    fasada.addEventListener('click', () => {
      const id = fasada.dataset.yt;
      if (!id) return;
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`;
      iframe.title = 'Spotkanie 7 — jam session Handpan Łódź (YouTube)';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      iframe.width = '1280'; iframe.height = '720';
      fasada.replaceWith(iframe);
    }, { once: true });
  });
})();
