/**
 * Prueba de integración en navegador (Playwright) del demo.
 * Requiere el servidor de desarrollo:  npm run dev   (modo DEV expone window.__tizon)
 * Uso:  NODE_PATH=$(npm root -g) node scripts/e2e-smoke.cjs [url]
 * El juego se simula llamando a update() en bucle, por lo que no depende de los FPS del renderer.
 */
const { chromium } = require('playwright');

const BASE = process.argv[2] || 'http://127.0.0.1:5173/TizonRojo/';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`); if (!cond) failures++; };

async function boot(browser, query, vp = { width: 430, height: 860 }) {
  const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
  await page.goto(BASE + query);
  await page.waitForTimeout(1500);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__tizon, null, { timeout: 20000 });
  return { page, errors };
}

// avanza la simulación `secs` segundos (bucle de update)
const stepFn = `(secs) => { const g = window.__tizon; for (let i = 0; i < secs * 60; i++) g.update(i * 16.67, 16.67); }`;

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

  // ───────── 1. inicio, cuenta regresiva y arranque ─────────
  {
    const { page, errors } = await boot(browser, '?god=1');
    let s = await page.evaluate(() => window.__tizon.state);
    ok(s === 'ready', 'La partida inicia en cuenta regresiva');
    await page.evaluate(`(${stepFn})(3.5)`);
    s = await page.evaluate(() => window.__tizon.state);
    ok(s === 'playing', 'Tras la cuenta regresiva pasa a jugar');

    // ───────── 2. teclado ─────────
    await page.keyboard.press('ArrowRight');
    await page.evaluate(`(${stepFn})(0.3)`);
    let d = await page.evaluate(() => window.__tizon.player.dir);
    ok(d.x === 1, 'Flecha derecha mueve a la derecha');
    await page.keyboard.press('a');
    await page.evaluate(`(${stepFn})(0.05)`);
    d = await page.evaluate(() => window.__tizon.player.dir);
    ok(d.x === -1, 'Tecla A gira 180° al instante');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('s');
    const w = await page.evaluate(() => window.__tizon.player.wanted);
    ok(w.y === 1, 'Tecla S registra dirección abajo');

    // ───────── 3. mouse/táctil: joystick ─────────
    const box = await page.evaluate(() => { const r = document.querySelector('canvas').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
    const gx = (lx) => box.x + (lx / 720) * box.w;
    const gy = (ly) => box.y + (ly / 1280) * box.h;
    await page.mouse.move(gx(360), gy(1130));
    await page.mouse.down();
    await page.mouse.move(gx(360), gy(1130 - 60), { steps: 4 });
    let wanted = await page.evaluate(() => window.__tizon.player.wanted);
    ok(wanted.y === -1, 'Deslizar hacia arriba pide dirección arriba');
    await page.mouse.move(gx(360 + 90), gy(1130 - 60), { steps: 4 });
    wanted = await page.evaluate(() => window.__tizon.player.wanted);
    ok(wanted.x === 1, 'Deslizar hacia la derecha cambia la dirección sin soltar');
    await page.mouse.up();

    // ───────── 4. galletas, protección y neutralización ─────────
    const r = await page.evaluate(() => {
      const g = window.__tizon;
      const out = { cookiesStart: g.collectibles.cookiesLeft, enemiesScared: 0, prot: 0 };
      const c = g.maze.cookies[0];
      g.player.place(c);
      g.update(0, 16.67);
      out.cookiesAfter1 = g.collectibles.cookiesLeft;
      out.prot = g.player.protection;
      out.enemiesScared = g.enemies.filter((e) => e.scared).length;
      out.scoreAfterCookie = g.score;
      // neutralizar: colocar un enemigo activo sobre el jugador
      const e = g.enemies.find((x) => x.state === 'active');
      const sc0 = g.score;
      e.place(g.player.tile); e.access = 'outside'; e.state = 'active'; e.scared = true;
      g.update(0, 16.67);
      out.neutralizedState = e.state;
      out.neutralizeScore = g.score - sc0;
      return out;
    });
    ok(r.cookiesStart === 4, 'Hay 4 galletas especiales al inicio');
    ok(r.cookiesAfter1 === 3, 'Recoger una galleta deja 3');
    ok(r.prot > 5, `La galleta otorga protección (${r.prot.toFixed(1)} s)`);
    ok(r.enemiesScared >= 1, 'Los enemigos activos pasan a estado asustado');
    ok(r.neutralizedState === 'eyes' && r.neutralizeScore >= 200, 'Un enemigo tocado con protección es neutralizado (+puntos)');
    // reaparición
    await page.evaluate(`(${stepFn})(14)`);
    const respawned = await page.evaluate(() => window.__tizon.enemies.every((e) => e.state === 'active' || e.state === 'leaving' || e.state === 'waiting'));
    ok(respawned, 'Los enemigos neutralizados reaparecen tras el intervalo definido');

    // ───────── 5. regeneración de brasas ─────────
    const g5 = await page.evaluate(() => {
      const g = window.__tizon;
      const t0 = g.difficulty.elapsed;
      const cookiesBefore = g.collectibles.cookiesLeft;
      for (const t of g.maze.pellets) g.collectibles.takePellet(t);
      const emptied = g.collectibles.pelletsLeft;
      g.regenTimer = 0.1;
      for (let i = 0; i < 60; i++) g.update(i * 16.67, 16.67);
      return { emptied, after: g.collectibles.pelletsLeft, total: g.maze.pellets.length, cookiesBefore, cookiesAfter: g.collectibles.cookiesLeft, dt: g.difficulty.elapsed - t0, state: g.state };
    });
    ok(g5.emptied === 0 && g5.after >= g5.total - 1, `Las brasas se regeneran (${g5.after}/${g5.total})`);
    ok(g5.cookiesAfter === g5.cookiesBefore, 'Las galletas especiales NO se regeneran');
    ok(g5.dt > 0.9 && g5.dt < 1.2 && g5.state === 'playing', 'El cronómetro y la partida continúan tras regenerar');
    ok(errors.length === 0, 'Sin errores de consola en la partida base' + (errors.length ? ': ' + errors.join(' | ') : ''));
    await page.close();
  }

  // ───────── 6. derrota ─────────
  {
    const { page } = await boot(browser, '');
    await page.evaluate(`(${stepFn})(3.5)`);
    await page.evaluate(() => {
      const g = window.__tizon;
      const e = g.enemies[0];
      e.place(g.player.tile); e.state = 'active'; e.access = 'outside'; e.scared = false; e.grace = 0;
      g.update(0, 16.67);
    });
    const st = await page.evaluate(() => window.__tizon.state);
    ok(st === 'dying', 'Un enemigo sin protección mata inmediatamente (una sola vida)');
    await page.waitForFunction(() => window.__tizon.scene.isActive('Defeat'), null, { timeout: 15000 }).catch(() => {});
    const defeat = await page.evaluate(() => window.__tizon.scene.isActive('Defeat'));
    ok(defeat, 'Se muestra la pantalla de derrota');
    await page.close();
  }

  // ───────── 7. enemigo cercano persigue / no daña con gracia ─────────
  {
    const { page } = await boot(browser, '');
    await page.evaluate(`(${stepFn})(3.5)`);
    const caught = await page.evaluate(() => {
      const g = window.__tizon;
      g.player.wanted = { x: 0, y: 0 }; // jugador quieto
      let t = 0;
      while (g.state === 'playing' && t < 60) { g.update(t * 1000, 16.67); t += 1 / 60; }
      return { state: g.state, t };
    });
    ok(caught.state === 'dying', `Los enemigos persiguen y alcanzan a un jugador quieto (${caught.t.toFixed(1)} s)`);
    await page.close();
  }

  // ───────── 8. fases y victoria a los 180 s ─────────
  {
    const { page, errors } = await boot(browser, '?god=1&speed=60');
    const log = await page.evaluate(() => {
      const g = window.__tizon;
      const seen = [];
      const dirs = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];
      let i = 0; let lastPhase = 0;
      while (g.state !== 'won' && i < 60 * 600) {
        if (i % 40 === 0) g.player.setWanted(dirs[Math.floor(Math.random() * 4)]);
        g.update(i * 16.67, 16.67);
        const ph = g.difficulty.phase.id;
        if (g.state === 'playing' && ph !== lastPhase) { seen.push({ ph, at: +g.difficulty.elapsed.toFixed(1), speed: g.enemies[0].speed }); lastPhase = ph; }
        i++;
      }
      return { seen, state: g.state, elapsed: g.difficulty.elapsed, hell: g.hellMaze.alpha };
    });
    ok(JSON.stringify(log.seen.map((s) => s.ph)) === '[1,2,3,4]', 'Se recorren las 4 fases en orden: ' + JSON.stringify(log.seen));
    ok(log.seen[1].at >= 60 && log.seen[1].at < 62 && log.seen[2].at >= 120 && log.seen[2].at < 122 && log.seen[3].at >= 150 && log.seen[3].at < 152, 'Las fases cambian en 60 / 120 / 150 s');
    ok(log.state === 'won' && log.elapsed === 180, 'Llegar vivo a 180 s produce la victoria');
    await page.waitForFunction(() => window.__tizon.scene.isActive('Victory'), null, { timeout: 15000 }).catch(() => {});
    ok(await page.evaluate(() => window.__tizon.scene.isActive('Victory')), 'Se muestra la pantalla de victoria');
    ok(errors.length === 0, 'Sin errores de consola en el recorrido completo' + (errors.length ? ': ' + errors.join(' | ') : ''));
    await page.close();
  }

  await browser.close();
  console.log(failures === 0 ? '\nTODO OK' : `\n${failures} comprobaciones fallaron`);
  process.exit(failures === 0 ? 0 : 1);
})();
