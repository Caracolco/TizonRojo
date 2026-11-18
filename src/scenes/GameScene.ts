import Phaser from 'phaser';
import { PhaseConfig } from '../config/difficulty';
import { DEV } from '../config/dev';
import { ENEMY_DEFS } from '../config/enemies';
import { GAME } from '../config/game';
import { chooseDirection, enemySpeed, tickAi, AiContext } from '../game/ai/behaviors';
import { audio } from '../game/audio/AudioManager';
import { Enemy } from '../game/entities/Enemy';
import { Player } from '../game/entities/Player';
import { EnemyView, PlayerView, toX, toY } from '../game/entities/views';
import { Effects } from '../game/fx/Effects';
import { InputController } from '../game/input/InputController';
import { Dir, Maze } from '../game/maze/Maze';
import { Collectibles } from '../game/systems/Collectibles';
import { DifficultySystem } from '../game/systems/DifficultySystem';
import { Banner } from '../game/ui/Banner';
import { Hud } from '../game/ui/Hud';
import { PauseOverlay } from '../game/ui/PauseOverlay';
import { txt } from '../game/ui/widgets';
import { saveResult } from '../storage/records';

type State = 'ready' | 'playing' | 'paused' | 'dying' | 'won';

export class GameScene extends Phaser.Scene {
  private maze = new Maze();
  private player!: Player;
  private playerView!: PlayerView;
  private enemies: Enemy[] = [];
  private enemyViews: EnemyView[] = [];
  private collectibles!: Collectibles;
  private difficulty = new DifficultySystem();
  private hud!: Hud;
  private fx!: Effects;
  private banner!: Banner;
  private pause!: PauseOverlay;
  private controls!: InputController;
  private joy!: Phaser.GameObjects.Graphics;
  private hint!: Phaser.GameObjects.Text;
  private hellMaze!: Phaser.GameObjects.Image;
  private hellVignette!: Phaser.GameObjects.Image;
  private embers!: Phaser.GameObjects.Particles.ParticleEmitter;

  private state: State = 'ready';
  private score = 0;
  private combo = 0;
  private readyLeft = 0;
  private lastCount = -1;
  private regenTimer = -1;
  private playerDist: Int16Array = new Int16Array(0);
  private playerDistKey = -1;
  private wasProtected = false;
  private warnTick = 0;
  private onVisibility = (): void => { if (document.hidden) this.setPaused(true); };

  constructor() { super('Game'); }

  create(): void {
    this.state = 'ready';
    this.score = 0;
    this.combo = 0;
    this.regenTimer = -1;
    this.enemies = [];
    this.enemyViews = [];
    this.playerDistKey = -1;
    this.wasProtected = false;
    this.cameras.main.fadeIn(250, 0, 0, 0);

    this.add.image(GAME.width / 2, GAME.height / 2, 'bg').setDepth(0);
    this.embers = this.add.particles(0, 0, 'spark', {
      x: { min: 0, max: GAME.width }, y: GAME.height + 10, lifespan: 4200,
      speedY: { min: -140, max: -50 }, speedX: { min: -25, max: 25 },
      scale: { start: 1.4, end: 0 }, alpha: { start: 0.8, end: 0 }, blendMode: 'ADD',
      frequency: 110, tint: [0xff5a1c, 0xffb347, 0xe5231d],
    }).setDepth(1);

    this.add.image(GAME.mazeX, GAME.mazeY, 'maze').setOrigin(0).setDepth(1.5);
    this.hellMaze = this.add.image(GAME.mazeX, GAME.mazeY, 'maze_hell').setOrigin(0).setDepth(1.6).setAlpha(0);

    this.collectibles = new Collectibles(this, this.maze);
    this.player = new Player(this.maze);
    this.playerView = new PlayerView(this);
    for (const def of ENEMY_DEFS) {
      const slot = this.maze.houseCells[def.houseSlot];
      const e = new Enemy(this.maze, def, slot);
      e.resetToHouse(GAME.releaseDelays[def.kind]);
      if (def.kind === 'chaser') {
        // el perseguidor ya está fuera de la casa al empezar (a distancia segura del jugador)
        e.place(this.maze.exit);
        e.access = 'outside';
        e.state = 'active';
      }
      this.enemies.push(e);
      this.enemyViews.push(new EnemyView(this, e));
    }

    this.fx = new Effects(this);
    this.banner = new Banner(this);
    this.hud = new Hud(this, this.collectibles.totalCookies, () => this.setPaused(true));
    this.hud.setCookies(this.collectibles.cookiesLeft);

    this.add.image(GAME.width / 2, GAME.height / 2, 'vignette').setDepth(10);
    this.hellVignette = this.add.image(GAME.width / 2, GAME.height / 2, 'hellvignette').setDepth(11).setAlpha(0);
    this.add.tileSprite(GAME.width / 2, GAME.height / 2, GAME.width, GAME.height, 'scan').setDepth(12);

    this.joy = this.add.graphics().setDepth(15);
    const touch = this.sys.game.device.input.touch;
    this.hint = txt(this, GAME.width / 2, 1010, touch ? 'DESLIZA PARA MOVERTE' : 'FLECHAS / WASD · P = PAUSA', 16, '#ffd9c8', { stroke: '#1a0505', strokeThickness: 5 }).setDepth(15);

    this.controls = new InputController(this, (d) => this.onDirection(d), () => this.setPaused(this.state !== 'paused'));
    this.pause = new PauseOverlay(this, () => this.setPaused(false), () => this.restart(), () => this.toMenu());
    document.addEventListener('visibilitychange', this.onVisibility);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      document.removeEventListener('visibilitychange', this.onVisibility);
      this.controls.destroy();
      this.input.keyboard?.removeAllKeys(true);
      audio.stopMusic();
    });

    this.difficulty.reset(DEV.startAt);
    this.hud.setTime(this.difficulty.elapsed, this.difficulty.phase);
    if (this.difficulty.phase.id === 4) this.enterHell(false);
    audio.setIntensity(this.difficulty.phase.id - 1);

    this.readyLeft = GAME.readySeconds;
    this.lastCount = -1;
    audio.unlock();
    audio.start();

    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>).__tizon = this;
    }
  }

  // ───────────────────────── control ─────────────────────────
  private onDirection(d: Dir): void {
    if (this.state === 'playing' || this.state === 'ready') this.player.setWanted(d);
  }

  private setPaused(v: boolean): void {
    if (v && this.state === 'playing') {
      this.state = 'paused';
      this.pause.show(true);
      audio.suspend();
      this.embers.pause();
    } else if (!v && this.state === 'paused') {
      this.state = 'playing';
      this.pause.show(false);
      audio.resume();
      this.embers.resume();
    }
  }

  private restart(): void { this.scene.restart(); }
  private toMenu(): void {
    audio.resume();
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Menu'));
  }

  // ───────────────────────── bucle ─────────────────────────
  update(time: number, delta: number): void {
    const dt = Math.min(delta / 1000, 1 / 20);

    if (this.state === 'ready') this.updateReady(dt);
    else if (this.state === 'playing') this.step(dt);

    this.playerView.update(this.player, time);
    const powerLeft = this.player.protection;
    this.enemyViews.forEach((v) => v.update(time, powerLeft));
    this.hud.tick();
    this.drawJoystick(time);

    if (this.state === 'playing') {
      this.hellVignette.setAlpha(this.difficulty.phase.id === 4 ? 0.55 + Math.sin(time / 260) * 0.2 : 0);
    }
  }

  private updateReady(dt: number): void {
    this.readyLeft -= dt;
    const n = Math.ceil(this.readyLeft);
    if (n !== this.lastCount) {
      this.lastCount = n;
      if (n > 0) {
        this.banner.show(String(n), { size: 120, hold: 350 });
        audio.countdown(false);
      }
    }
    if (this.readyLeft <= 0) {
      this.state = 'playing';
      this.banner.show('¡YA!', { size: 90, color: '#ffe27a', hold: 450 });
      audio.countdown(true);
      audio.startMusic();
    }
  }

  private buildCtx(): AiContext {
    const t = this.player.tile;
    const key = t.y * this.maze.width + t.x;
    if (key !== this.playerDistKey) {
      this.playerDistKey = key;
      this.playerDist = this.maze.distances(t);
    }
    return {
      maze: this.maze,
      player: { tile: t, facing: this.player.facing, protectedNow: this.player.protectedNow },
      phase: this.difficulty.phase,
      playerDist: this.playerDist,
      chaser: this.enemies.find((e) => e.kind === 'chaser'),
      rng: Math.random,
    };
  }

  private step(dt: number): void {
    // reloj y fases
    const changed = this.difficulty.tick(dt * DEV.timeScale);
    if (changed) this.onPhase(changed);
    this.hud.setTime(this.difficulty.elapsed, this.difficulty.phase);

    // jugador
    this.player.update(dt);
    const prot = this.player.protectedNow;
    if (this.wasProtected && !prot) this.enemies.forEach((e) => { e.scared = false; });
    if (prot && this.player.protection < 2) {
      this.warnTick -= dt;
      if (this.warnTick <= 0) { this.warnTick = 0.25; audio.warning(); }
    }
    this.wasProtected = prot;

    // enemigos
    const ctx = this.buildCtx();
    for (const e of this.enemies) {
      e.grace = Math.max(0, e.grace - dt);
      if (e.state === 'waiting' || e.state === 'respawning') {
        e.timer -= dt;
        if (e.timer <= 0) {
          if (e.state === 'respawning') { audio.enemyBack(); this.fx.burst(toX(e.px), toY(e.py), 0xffffff, 10); }
          e.state = 'leaving';
          e.access = 'house';
          e.scared = prot;
        }
        continue;
      }
      tickAi(e, ctx, dt);
      e.speed = enemySpeed(e, ctx.phase);
      e.advance(dt, (tile, prev) => chooseDirection(e, ctx, tile, prev));
      if (e.scared && !prot) e.scared = false;
    }

    this.collect();
    this.collide();

    if (this.difficulty.finished && this.state === 'playing') this.win();

    if (this.regenTimer >= 0) {
      this.regenTimer -= dt;
      if (this.regenTimer < 0) this.regenerate();
    }
  }

  // ───────────────────────── eventos de juego ─────────────────────────
  private collect(): void {
    const tile = this.player.tile;
    const p = this.collectibles.takePellet(tile);
    if (p) {
      this.addScore(GAME.scores.pellet);
      this.playerView.chomp();
      this.fx.burst(p.x, p.y, 0xffb347, 4);
      audio.collect();
      if (this.collectibles.pelletsLeft === 0 && this.regenTimer < 0) this.regenTimer = 0.35;
    }
    const c = this.collectibles.takeCookie(tile);
    if (c) {
      this.addScore(GAME.scores.cookie);
      this.player.protection = this.difficulty.phase.cookieDuration;
      this.combo = 0;
      this.enemies.forEach((e) => {
        if (e.state === 'active' || e.state === 'leaving') {
          if (!e.scared && e.isMoving) e.reverse();
          e.scared = true;
        }
      });
      this.hud.setCookies(this.collectibles.cookiesLeft);
      this.playerView.chomp();
      this.fx.burst(c.x, c.y, 0xffe27a, 22);
      this.fx.ring(c.x, c.y, 0xffd23a, 220, 650);
      this.fx.flash(255, 190, 60, 120);
      this.fx.floatText(c.x, c.y - 30, '¡PROTEGIDO!', '#ffe27a', 20);
      audio.cookie();
    }
  }

  private collide(): void {
    const px = this.player.px;
    const py = this.player.py;
    for (const e of this.enemies) {
      const d = Math.hypot(e.px - px, e.py - py);
      if (d > GAME.player.hitRadius) continue;
      if (e.vulnerable) {
        this.neutralize(e);
      } else if (e.dangerous && !DEV.god) {
        this.lose();
        return;
      }
    }
  }

  private neutralize(e: Enemy): void {
    this.combo++;
    const pts = GAME.scores.enemyBase * Math.min(2 ** (this.combo - 1), 8);
    this.addScore(pts);
    e.neutralize();
    const x = toX(e.px);
    const y = toY(e.py);
    this.fx.burst(x, y, parseInt(e.def.color.slice(1), 16), 26);
    this.fx.ring(x, y, 0xffffff, 130, 420);
    this.fx.smoke(x, y, 6);
    this.fx.floatText(x, y - 20, `+${pts}`, '#ffffff', 26);
    this.fx.shake(120, 0.006);
    audio.neutralize(this.combo);
  }

  private addScore(n: number): void {
    this.score += n;
    this.hud.setScore(this.score);
  }

  private regenerate(): void {
    this.collectibles.spawnAllPellets(this.player.tile);
    this.regenTimer = -1;
    audio.regen();
    this.fx.floatText(GAME.width / 2, GAME.mazeY + 11 * GAME.tile, '¡MÁS BRASAS!', '#ffd23a', 26);
  }

  private onPhase(p: PhaseConfig): void {
    audio.setIntensity(p.id - 1);
    if (p.id === 4) {
      this.enterHell(true);
    } else {
      audio.phase();
      this.fx.ring(toX(this.player.px), toY(this.player.py), 0xff8a1c, 260, 700);
      this.banner.show(`FASE ${p.id}`, { size: 70, color: '#ffd23a', sub: p.name, hold: 1100 });
    }
  }

  private enterHell(animated: boolean): void {
    this.hud.setHell(true);
    this.embers.setFrequency(35);
    this.tweens.add({ targets: this.hellMaze, alpha: 1, duration: animated ? 700 : 1 });
    if (animated) {
      audio.hell();
      this.fx.flash(255, 90, 0, 350);
      this.fx.shake(600, 0.014);
      this.banner.show('¡MODO INFIERNO!', { size: 44, color: '#ffe27a', stroke: '#b00000', sub: '¡ÚLTIMOS 30 SEGUNDOS!', hold: 1600, shake: true });
    }
  }

  private lose(): void {
    if (this.state !== 'playing') return;
    this.state = 'dying';
    audio.stopMusic();
    audio.lose();
    const t = this.difficulty.elapsed;
    const { newTime, newScore } = saveResult(t, this.score, false);
    this.hud.setLifeLost();
    const s = this.playerView.sprite;
    const x = s.x;
    const y = s.y;
    this.fx.shake(500, 0.02);
    this.fx.flash(255, 30, 20, 250);
    this.fx.burst(x, y, 0xff5a1c, 40);
    this.fx.ring(x, y, 0xff3b2f, 240, 600);
    s.setTexture('brasa_hurt');
    this.playerView.aura.setAlpha(0.2);
    this.tweens.add({ targets: s, scaleX: 0.62, scaleY: 0.42, duration: 120, yoyo: true });
    this.tweens.add({ targets: s, angle: 540, scale: 0.05, alpha: 0, y: y - 50, duration: 1100, delay: 250, ease: 'Cubic.In',
      onUpdate: () => { if (Math.random() < 0.3) this.fx.smoke(s.x, s.y, 1); } });
    this.time.delayedCall(1500, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Defeat', { time: t, score: this.score, newTime, newScore }));
    });
  }

  private win(): void {
    this.state = 'won';
    audio.stopMusic();
    audio.win();
    this.addScore(GAME.scores.winBonus);
    const { newScore } = saveResult(GAME.surviveSeconds, this.score, true);
    this.fx.flash(255, 220, 120, 400);
    this.fx.shake(400, 0.01);
    for (const e of this.enemies) {
      this.fx.burst(toX(e.px), toY(e.py), parseInt(e.def.color.slice(1), 16), 22);
      this.fx.smoke(toX(e.px), toY(e.py), 4);
    }
    this.enemyViews.forEach((v) => v.sprite.setVisible(false));
    this.enemies.forEach((e) => { e.state = 'respawning'; e.timer = 999; });
    const s = this.playerView.sprite;
    this.tweens.add({ targets: s, y: s.y - 50, yoyo: true, repeat: 3, duration: 180, ease: 'Sine.Out' });
    this.time.addEvent({ delay: 160, repeat: 6, callback: () => { s.setTexture(`brasa_win_${Math.floor(Math.random() * 4)}`); } });
    this.time.delayedCall(1500, () => {
      this.cameras.main.fadeOut(300, 255, 255, 255);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Victory', { score: this.score, newScore }));
    });
  }

  private drawJoystick(time: number): void {
    const g = this.joy;
    g.clear();
    const j = this.controls.joystick;
    const cx = GAME.width / 2;
    const cy = 1130;
    const a = j.active ? 0.9 : 0.35;
    g.lineStyle(6, 0xe5231d, a).strokeCircle(cx, cy, 78);
    g.fillStyle(0x1b1113, a * 0.7).fillCircle(cx, cy, 78);
    // flechas guía
    g.fillStyle(0xfff1dc, a * 0.7);
    const tri = (dx: number, dy: number): void => {
      const px = cx + dx * 58;
      const py = cy + dy * 58;
      g.fillTriangle(px + dx * 10, py + dy * 10, px - dy * 9 - dx * 4, py + dx * 9 - dy * 4, px + dy * 9 - dx * 4, py - dx * 9 - dy * 4);
    };
    tri(0, -1); tri(0, 1); tri(-1, 0); tri(1, 0);
    const kx = cx + Phaser.Math.Clamp(j.knobX, -50, 50);
    const ky = cy + Phaser.Math.Clamp(j.knobY, -50, 50);
    g.fillStyle(0xff3b2f, a).fillCircle(kx, ky, 34);
    g.fillStyle(0xffffff, a * 0.35).fillCircle(kx - 9, ky - 10, 11);
    g.lineStyle(4, 0xffd9c8, a).strokeCircle(kx, ky, 34);
    if (this.state === 'playing' && this.difficulty.elapsed > 6 && this.hint.alpha > 0) this.hint.setAlpha(Math.max(0, this.hint.alpha - 0.02));
    void time;
  }
}
