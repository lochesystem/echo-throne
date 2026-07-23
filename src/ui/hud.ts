import { calcBossHpBarFills } from '../systems/bossPhase.ts';

function el<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

/** Controla o HUD em DOM (vitais, boss, sangue, corrupção, arena). */
export class Hud {
  private root = el('hud');
  private hpFill = el('hud-hp-fill');
  private hpText = el('hud-hp');
  private energyFill = el('hud-energy-fill');
  private energyText = el('hud-energy');
  private nameLabel = el('hud-name');
  private initial = el('hud-initial');
  private potionCount = el('hud-potion-count');
  private blood = el('hud-blood');
  private bossHud = el('boss-hud');
  private bossName = el('boss-name');
  private bossPhase1 = el('boss-phase1');
  private bossPhase2 = el('boss-phase2');
  private bossHpText = el('boss-hp-text');
  private corruptionFill = el('hud-corruption-fill');
  private arenaValue = el('hud-arena-value');
  private hint = el('hud-hint');
  private abilityIcon = el('hud-ability-icon');

  show(): void {
    this.root.classList.remove('hidden');
    this.root.setAttribute('aria-hidden', 'false');
  }

  hide(): void {
    this.root.classList.add('hidden');
    this.root.setAttribute('aria-hidden', 'true');
    this.bossHud.classList.add('hidden');
  }

  setName(name: string): void {
    this.nameLabel.textContent = name;
    this.initial.textContent = (name[0] ?? '?').toUpperCase();
  }

  setBoss(name: string): void {
    this.bossName.textContent = name;
    this.bossHud.classList.remove('hidden');
  }

  setArena(current: number, total: number): void {
    this.arenaValue.textContent = `${current}/${total}`;
  }

  setCorruption(pct: number): void {
    this.corruptionFill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
  }

  setAbilityReady(ready: boolean): void {
    this.abilityIcon.classList.toggle('cooldown', !ready);
  }

  showHint(text: string): void {
    this.hint.textContent = text;
    this.hint.classList.toggle('visible', text.length > 0);
  }

  update(state: {
    hp: number;
    maxHp: number;
    energy: number;
    maxEnergy: number;
    potions: number;
    blood: number;
    bossHp: number;
    bossMaxHp: number;
  }): void {
    this.hpFill.style.width = `${(state.hp / state.maxHp) * 100}%`;
    this.hpText.textContent = `${Math.ceil(state.hp)}/${state.maxHp}`;
    this.energyFill.style.width = `${(state.energy / state.maxEnergy) * 100}%`;
    this.energyText.textContent = `${Math.floor(state.energy)}/${state.maxEnergy}`;
    this.potionCount.textContent = String(state.potions);
    this.blood.textContent = state.blood.toLocaleString('pt-BR');

    const fills = calcBossHpBarFills(state.bossHp, state.bossMaxHp);
    this.bossPhase1.style.width = `${fills.phase1 * 100}%`;
    this.bossPhase2.style.width = `${fills.phase2 * 100}%`;
    this.bossHpText.textContent = `${Math.ceil(state.bossHp)} / ${state.bossMaxHp}`;
  }
}
