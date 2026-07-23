import { Container, Graphics } from 'pixi.js';
import {
  ARENA_HEIGHT,
  ARENA_WIDTH,
  COMBO_ARC,
  COMBO_RANGE,
  COMBO_WINDUP,
  INVESTIDA_DAMAGE,
  PERFECT_DODGE_SLOW,
  PLAYER_RADIUS,
  WEAKPOINT_DAMAGE_MULT,
  WEAKPOINT_STAGGER,
} from '../engine/constants.ts';
import { Camera } from '../engine/camera.ts';
import { FxRunner } from '../engine/fxRunner.ts';
import { YSortLayer } from '../engine/ySortLayer.ts';
import type { InputManager } from '../engine/input.ts';
import { CAPITAO_DRAKMAR } from '../data/bosses.ts';
import { Ability } from '../systems/ability.ts';
import { BloodTracker } from '../systems/bloodEconomy.ts';
import { circlesOverlap, distance, isInAttackArc } from '../systems/combat.ts';
import {
  ADD_DAMAGE,
  Boss,
  CUTLASS_ARC,
  CUTLASS_DAMAGE,
  CUTLASS_RANGE,
  GANCHO_DAMAGE,
  GANCHO_RANGE,
  WAVE_DAMAGE,
  type AttackKind,
  type BossEvent,
} from '../systems/bossMechanics.ts';
import { ParryState, resolveParry } from '../systems/parry.ts';
import { Player } from '../systems/player.ts';
import type { ArenaPhase } from '../types.ts';
import { buildArenaBackground, clampToArena } from '../world/arenaLayout.ts';
import {
  createDrakmarSprite,
  createHunterSprite,
  createSpectralAddSprite,
  type BossSprite,
  type HunterSprite,
  type AddSprite,
} from '../world/actorSprites.ts';
import {
  createWeaponAttackFx,
  tickWeaponAttackFx,
  type AttackFxStyle,
  type WeaponAttackFxState,
} from '../world/weaponAttackFx.ts';
import type { Hud } from '../ui/hud.ts';

interface Wave {
  x: number;
  y: number;
  dx: number;
  dy: number;
  speed: number;
  life: number;
  radius: number;
  didHit: boolean;
}

const CONTACT_DAMAGE = 10;
const CONTACT_COOLDOWN = 0.8;
const WAVE_SPEED = 140;
const WAVE_RADIUS = 13;

export class ArenaScene {
  private readonly input: InputManager;
  private readonly hud: Hud;

  private readonly worldRoot = new Container();
  private readonly waveLayer = new Graphics();
  private readonly telegraphLayer = new Graphics();
  private readonly fxLayer = new Graphics();
  private readonly attackFxLayer = new Container();
  private readonly ySort = new YSortLayer();
  private readonly camera = new Camera();
  private readonly fx = new FxRunner();

  private readonly player = new Player();
  private readonly boss = new Boss(CAPITAO_DRAKMAR);
  private readonly parry = new ParryState();
  private readonly ability = new Ability();
  private readonly blood = new BloodTracker();

  private hunterSprite!: HunterSprite;
  private drakmarSprite!: BossSprite;
  private addSprites: AddSprite[] = [];
  private attackFxs: WeaponAttackFxState[] = [];

  private waves: Wave[] = [];
  private phase: ArenaPhase = 'intro';
  private introTimer = 0;
  private contactCd = 0;
  private shakeTimer = 0;
  private lastMouseAngle = 0;
  private prevBossX = 0;
  private prevBossY = 0;

  onVictory: (() => void) | null = null;
  onDefeat: (() => void) | null = null;

  constructor(input: InputManager, hud: Hud) {
    this.input = input;
    this.hud = hud;
    this.worldRoot.addChild(buildArenaBackground());
    this.worldRoot.addChild(this.waveLayer);
    this.worldRoot.addChild(this.telegraphLayer);
    this.worldRoot.addChild(this.ySort);
    this.worldRoot.addChild(this.attackFxLayer);
    this.worldRoot.addChild(this.fxLayer);
  }

  get container(): Container {
    return this.worldRoot;
  }

  start(name: string): void {
    // Limpa sprites anteriores
    this.ySort.removeChildren();
    this.addSprites = [];
    this.waves = [];
    this.attackFxs = [];
    this.attackFxLayer.removeChildren();
    this.fx.clear();

    this.player.reset(ARENA_WIDTH * 0.5, ARENA_HEIGHT * 0.72, name);
    this.boss.reset(ARENA_WIDTH * 0.5, ARENA_HEIGHT * 0.32);
    this.parry.reset();
    this.ability.reset();
    this.blood.reset();

    this.hunterSprite = createHunterSprite();
    this.drakmarSprite = createDrakmarSprite();
    this.ySort.addChild(this.drakmarSprite);
    this.ySort.addChild(this.hunterSprite);

    this.prevBossX = this.boss.x;
    this.prevBossY = this.boss.y;

    this.phase = 'intro';
    this.introTimer = 2.4;
    this.contactCd = 0;
    this.shakeTimer = 0;

    this.hud.setName(name);
    this.hud.setBoss(this.boss.def.name);
    this.hud.setArena(1, 10);
    this.hud.setCorruption(30);
    this.hud.show();
    this.hud.showHint('Leia os telegraphs. Esquive no último instante para o perfect dodge.');
    this.syncSprites();
  }

  stop(): void {
    this.hud.hide();
  }

  private aimAngle(): number {
    const screen = this.camera.worldToScreen(this.player.x, this.player.y);
    const dx = this.input.mouseX - screen.x;
    const dy = this.input.mouseY - screen.y;
    if (Math.hypot(dx, dy) > 4) {
      this.lastMouseAngle = Math.atan2(dy, dx);
    }
    return this.lastMouseAngle;
  }

  update(dt: number): void {
    if (this.phase === 'intro') {
      this.introTimer -= dt;
      this.camera.follow(this.player.x, this.player.y, ARENA_WIDTH, ARENA_HEIGHT);
      this.camera.update();
      this.syncSprites();
      if (this.introTimer <= 0) {
        this.phase = 'active';
        this.hud.showHint('');
      }
      return;
    }
    if (this.phase !== 'active') return;

    const aim = this.aimAngle();
    const move = this.input.getMovement();

    // Inputs de ação
    if (this.input.consumeKey('shift')) this.doDodge(move.x, move.y);
    if (this.input.consumeLeftClick()) this.player.tryAttack(aim);
    if (this.input.consumeRightClick()) this.parry.tryStart();
    if (this.input.consumeKey('q')) this.castAbility(aim);
    if (this.input.consumeKey('1')) this.player.usePotion();

    // Atualiza sistemas
    this.parry.update(dt);
    this.ability.update(dt);
    const swing = this.player.update(dt, move.x, move.y);
    this.constrainPlayer();

    if (swing) {
      const duration = COMBO_WINDUP[swing.hitIndex] ?? 0.15;
      this.hunterSprite.playAttack(swing.hitIndex, Math.cos(swing.aimAngle), duration);
      const fxStyle: AttackFxStyle = swing.isFinisher ? 'sword_heavy' : 'knife';
      this.playAttackFx(fxStyle, swing.aimAngle, COMBO_RANGE);
      this.resolveSwing(swing.damage, swing.aimAngle, swing.isFinisher);
    }

    // Boss
    const events = this.boss.update(dt, this.player.x, this.player.y);
    this.handleBossEvents(events);
    this.constrainBoss();
    this.updateWaves(dt);
    this.resolveContact(dt);
    this.resolveAdds(dt);

    // FX / câmera
    this.fx.update(dt);
    this.updateAttackFx(dt);
    if (this.shakeTimer > 0) this.shakeTimer = Math.max(0, this.shakeTimer - dt);
    this.camera.follow(this.player.x, this.player.y, ARENA_WIDTH, ARENA_HEIGHT);
    this.camera.update();

    this.drawTelegraphs();
    this.syncSprites();
    this.updateHud();

    // Condições de fim
    if (!this.boss.alive) {
      this.blood.applyVictoryBonus(this.boss.maxHp, this.boss.def.bloodMult);
      this.phase = 'victory';
      this.onVictory?.();
    } else if (!this.player.alive) {
      this.phase = 'defeat';
      this.onDefeat?.();
    }
  }

  getStats(): { blood: number; perfectDodges: number; parries: number } {
    return {
      blood: this.blood.blood,
      perfectDodges: this.blood.perfectDodges,
      parries: this.blood.parries,
    };
  }

  getNames(): { player: string; boss: string } {
    return { player: this.player.name, boss: this.boss.def.name };
  }

  // ---- Ações do jogador ----

  private doDodge(dx: number, dy: number): void {
    if (!this.player.tryDodge(dx, dy)) return;
    this.hunterSprite.playDodge();
    const imminent = this.boss.isAttackImminent() || this.waveImminent();
    if (imminent) {
      const energy = this.blood.registerPerfectDodge();
      this.player.grantEnergy(energy);
      this.boss.applySlow(PERFECT_DODGE_SLOW);
      this.spawnFlash(0xffffff, 0.25);
      this.hud.showHint('PERFECT DODGE!');
      this.fx.spawn(0.6, () => {}, () => this.hud.showHint(''));
    }
  }

  private castAbility(aim: number): void {
    const cast = this.ability.cast(this.player, aim);
    if (!cast) return;
    this.constrainPlayer();
    this.playAttackFx('sword_heavy', aim, COMBO_RANGE + 8, 0xbfe4ff);
    // dano no trajeto vs boss
    if (this.segmentHitsCircle(cast.originX, cast.originY, cast.targetX, cast.targetY, this.boss.x, this.boss.y, this.boss.def.radius + 10)) {
      this.damageBoss(INVESTIDA_DAMAGE);
    }
    for (const add of this.boss.adds) {
      if (this.segmentHitsCircle(cast.originX, cast.originY, cast.targetX, cast.targetY, add.x, add.y, 10)) {
        add.hp -= INVESTIDA_DAMAGE;
      }
    }
  }

  private resolveSwing(damage: number, aim: number, isFinisher: boolean): void {
    const reach = COMBO_RANGE + this.boss.def.radius;
    const hitBoss = isInAttackArc(this.player.x, this.player.y, aim, this.boss.x, this.boss.y, reach, COMBO_ARC / 2);
    if (hitBoss) {
      let dmg = damage;
      if (this.boss.staggerTimer > 0) dmg = Math.round(dmg * WEAKPOINT_DAMAGE_MULT);
      this.damageBoss(dmg);
      if (isFinisher) {
        this.boss.applyStagger(WEAKPOINT_STAGGER);
        this.spawnFlash(0xffd25a, 0.2);
        this.hud.showHint('PONTO FRACO EXPOSTO!');
        this.fx.spawn(0.7, () => {}, () => this.hud.showHint(''));
      }
    }
    // adds
    for (const add of this.boss.adds) {
      if (isInAttackArc(this.player.x, this.player.y, aim, add.x, add.y, COMBO_RANGE + 8, COMBO_ARC / 2)) {
        add.hp -= damage;
      }
    }
  }

  private damageBoss(amount: number): void {
    this.boss.takeDamage(amount);
    this.blood.addDamage(amount, this.boss.def.bloodMult);
  }

  // ---- Eventos do boss ----

  private handleBossEvents(events: BossEvent[]): void {
    for (const ev of events) {
      if (ev.type === 'summon') {
        this.syncAddSprites();
      } else if (ev.type === 'pull') {
        this.applyGancho(ev.angle ?? 0);
      } else if (ev.type === 'attackActivate') {
        this.drakmarSprite.playAttack(ev.kind ?? 'cutlass', 0.4);
        this.resolveBossAttack(ev.kind as AttackKind, ev.angle ?? 0);
      }
    }
  }

  private resolveBossAttack(kind: AttackKind, angle: number): void {
    if (kind === 'cutlass') {
      // Parry tem prioridade
      const parried = resolveParry(this.parry, true);
      const inArc = isInAttackArc(this.boss.x, this.boss.y, angle, this.player.x, this.player.y, CUTLASS_RANGE, CUTLASS_ARC / 2);
      if (parried && inArc) {
        this.blood.registerParry();
        this.boss.applyStagger(parried.staggerDuration);
        this.damageBoss(parried.riposteDamage);
        this.spawnFlash(0xffe08a, 0.22);
        this.triggerShake(0.2);
        this.hud.showHint('PARRY!');
        this.fx.spawn(0.6, () => {}, () => this.hud.showHint(''));
      } else if (inArc) {
        this.hitPlayer(CUTLASS_DAMAGE);
      }
    } else if (kind === 'onda') {
      this.spawnWave(angle);
    } else if (kind === 'cross') {
      for (let i = 0; i < 4; i++) this.spawnWave((Math.PI / 2) * i);
    }
  }

  private applyGancho(angle: number): void {
    const d = distance(this.boss.x, this.boss.y, this.player.x, this.player.y);
    if (d > GANCHO_RANGE) return;
    if (this.player.invincible <= 0) {
      // puxa em direção ao boss
      const pull = 70;
      this.player.x -= Math.cos(angle) * pull;
      this.player.y -= Math.sin(angle) * pull;
      this.constrainPlayer();
      this.hitPlayer(GANCHO_DAMAGE);
    }
  }

  private spawnWave(angle: number): void {
    this.waves.push({
      x: this.boss.x,
      y: this.boss.y,
      dx: Math.cos(angle),
      dy: Math.sin(angle),
      speed: WAVE_SPEED,
      life: 2.2,
      radius: WAVE_RADIUS,
      didHit: false,
    });
  }

  private updateWaves(dt: number): void {
    for (const w of this.waves) {
      w.x += w.dx * w.speed * dt;
      w.y += w.dy * w.speed * dt;
      w.life -= dt;
      if (!w.didHit && this.player.invincible <= 0 &&
        circlesOverlap(w.x, w.y, w.radius, this.player.x, this.player.y, PLAYER_RADIUS)) {
        w.didHit = true;
        this.hitPlayer(WAVE_DAMAGE);
      }
    }
    this.waves = this.waves.filter((w) => w.life > 0 &&
      w.x > -20 && w.x < ARENA_WIDTH + 20 && w.y > -20 && w.y < ARENA_HEIGHT + 20);
  }

  private waveImminent(): boolean {
    for (const w of this.waves) {
      if (w.didHit) continue;
      if (distance(w.x, w.y, this.player.x, this.player.y) < w.radius + PLAYER_RADIUS + 16) return true;
    }
    return false;
  }

  private resolveContact(dt: number): void {
    if (this.contactCd > 0) this.contactCd = Math.max(0, this.contactCd - dt);
    if (this.contactCd > 0) return;
    if (circlesOverlap(this.boss.x, this.boss.y, this.boss.def.contactRadius, this.player.x, this.player.y, PLAYER_RADIUS)) {
      if (this.hitPlayer(CONTACT_DAMAGE) > 0) this.contactCd = CONTACT_COOLDOWN;
    }
  }

  private resolveAdds(dt: number): void {
    for (const add of this.boss.adds) {
      if (add.hitCooldown > 0) continue;
      if (circlesOverlap(add.x, add.y, 8, this.player.x, this.player.y, PLAYER_RADIUS)) {
        if (this.hitPlayer(ADD_DAMAGE) > 0) add.hitCooldown = 1.2;
      }
    }
    void dt;
    this.syncAddSprites();
  }

  private hitPlayer(amount: number): number {
    const dmg = this.player.takeDamage(amount);
    if (dmg > 0) this.triggerShake(0.15);
    return dmg;
  }

  // ---- Colisão com arena ----

  private constrainPlayer(): void {
    const c = clampToArena(this.player.x, this.player.y, PLAYER_RADIUS);
    this.player.x = c.x;
    this.player.y = c.y;
  }

  private constrainBoss(): void {
    const c = clampToArena(this.boss.x, this.boss.y, this.boss.def.radius);
    this.boss.x = c.x;
    this.boss.y = c.y;
  }

  // ---- Geometria auxiliar ----

  private segmentHitsCircle(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, r: number): boolean {
    const abx = bx - ax;
    const aby = by - ay;
    const lenSq = abx * abx + aby * aby || 1;
    let t = ((cx - ax) * abx + (cy - ay) * aby) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const px = ax + abx * t;
    const py = ay + aby * t;
    return distance(px, py, cx, cy) <= r;
  }

  // ---- FX ----

  private spawnFlash(color: number, life: number): void {
    this.fx.spawn(life, (progress) => {
      this.fxLayer.clear();
      this.fxLayer.rect(-40, -40, ARENA_WIDTH + 80, ARENA_HEIGHT + 80);
      this.fxLayer.fill({ color, alpha: 0.35 * (1 - progress) });
    }, () => this.fxLayer.clear());
  }

  private triggerShake(seconds: number): void {
    this.shakeTimer = Math.max(this.shakeTimer, seconds);
  }

  // ---- Telegraphs ----

  private drawTelegraphs(): void {
    const g = this.telegraphLayer;
    g.clear();
    const atk = this.boss.attack;
    if (atk && atk.windup > 0) {
      const t = 1 - atk.windup / atk.windupMax;
      const alpha = 0.25 + t * 0.45;
      if (atk.kind === 'cutlass') {
        g.moveTo(this.boss.x, this.boss.y);
        g.arc(this.boss.x, this.boss.y, CUTLASS_RANGE, atk.angle - CUTLASS_ARC / 2, atk.angle + CUTLASS_ARC / 2);
        g.fill({ color: 0xff4a4a, alpha: alpha * 0.5 });
      } else if (atk.kind === 'onda') {
        this.drawWaveTelegraph(g, atk.angle, alpha);
      } else if (atk.kind === 'cross') {
        for (let i = 0; i < 4; i++) this.drawWaveTelegraph(g, (Math.PI / 2) * i, alpha);
      } else if (atk.kind === 'gancho') {
        g.moveTo(this.boss.x, this.boss.y);
        g.lineTo(this.player.x, this.player.y);
        g.stroke({ color: 0xd0d4dc, width: 2, alpha });
      }
    }
    // ondas ativas
    this.waveLayer.clear();
    for (const w of this.waves) {
      this.waveLayer.circle(w.x, w.y, w.radius);
      this.waveLayer.fill({ color: 0x4aa6e8, alpha: 0.5 });
      this.waveLayer.circle(w.x, w.y, w.radius);
      this.waveLayer.stroke({ color: 0xbfe4ff, width: 1.5, alpha: 0.8 });
    }
  }

  private drawWaveTelegraph(g: Graphics, angle: number, alpha: number): void {
    const len = 120;
    const ex = this.boss.x + Math.cos(angle) * len;
    const ey = this.boss.y + Math.sin(angle) * len;
    g.moveTo(this.boss.x, this.boss.y);
    g.lineTo(ex, ey);
    g.stroke({ color: 0x4aa6e8, width: 6, alpha });
  }

  private playAttackFx(
    style: AttackFxStyle,
    angle: number,
    range: number,
    color = 0xd8dce8,
  ): void {
    const fx = createWeaponAttackFx(style, angle, range, color);
    fx.root.x = this.player.x;
    fx.root.y = this.player.y;
    this.attackFxs.push(fx);
    this.attackFxLayer.addChild(fx.root);
  }

  private updateAttackFx(dt: number): void {
    for (let i = this.attackFxs.length - 1; i >= 0; i--) {
      const fx = this.attackFxs[i]!;
      if (!tickWeaponAttackFx(fx, dt, this.player.x, this.player.y)) {
        fx.root.destroy({ children: true });
        this.attackFxs.splice(i, 1);
      }
    }
  }

  // ---- Sincronização de sprites ----

  private syncSprites(): void {
    let ox = -Math.round(this.camera.x);
    let oy = -Math.round(this.camera.y);
    if (this.shakeTimer > 0) {
      ox += Math.round((Math.random() - 0.5) * 6);
      oy += Math.round((Math.random() - 0.5) * 6);
    }
    this.worldRoot.x = ox;
    this.worldRoot.y = oy;

    this.hunterSprite.x = Math.round(this.player.x);
    this.hunterSprite.y = Math.round(this.player.y);

    const playerSpeed = Math.hypot(this.player.vx, this.player.vy);
    const isMoving = playerSpeed > 10 && !this.player.isDodging;
    const faceX = playerSpeed > 10 ? this.player.vx : Math.cos(this.lastMouseAngle);
    this.hunterSprite.setLocomotion(isMoving, faceX);
    this.hunterSprite.setHurtFlash(this.player.invincible > 0);

    this.drakmarSprite.x = Math.round(this.boss.x);
    this.drakmarSprite.y = Math.round(this.boss.y);
    const bossDx = this.boss.x - this.prevBossX;
    const bossDy = this.boss.y - this.prevBossY;
    const bossMoving = Math.hypot(bossDx, bossDy) > 0.5 && this.boss.staggerTimer <= 0 && !this.boss.attack;
    const bossFace = this.player.x - this.boss.x;
    this.drakmarSprite.setLocomotion(bossMoving, bossFace);
    this.drakmarSprite.setStaggered(this.boss.staggerTimer > 0);
    this.prevBossX = this.boss.x;
    this.prevBossY = this.boss.y;

    this.ySort.resort();
  }

  private syncAddSprites(): void {
    // ajusta a quantidade de sprites de add
    while (this.addSprites.length < this.boss.adds.length) {
      const s = createSpectralAddSprite();
      this.addSprites.push(s);
      this.ySort.addChild(s);
    }
    while (this.addSprites.length > this.boss.adds.length) {
      const s = this.addSprites.pop();
      if (s) this.ySort.removeChild(s);
    }
    for (let i = 0; i < this.boss.adds.length; i++) {
      const add = this.boss.adds[i]!;
      const s = this.addSprites[i]!;
      s.x = Math.round(add.x);
      s.y = Math.round(add.y);
    }
  }

  private updateHud(): void {
    this.hud.update({
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      energy: this.player.energy,
      maxEnergy: this.player.maxEnergy,
      potions: this.player.potionCharges,
      blood: this.blood.blood,
      bossHp: this.boss.hp,
      bossMaxHp: this.boss.maxHp,
    });
    this.hud.setAbilityReady(this.ability.ready && this.player.energy >= 15);
  }
}
