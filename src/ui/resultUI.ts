function el<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

export interface ResultStats {
  blood: number;
  perfectDodges: number;
  parries: number;
}

/** Tela de vitória / derrota com estatísticas da luta. */
export class ResultUI {
  private screen = el('result-screen');
  private title = el('result-title');
  private sub = el('result-sub');
  private stats = el('result-stats');
  private retry = el<HTMLButtonElement>('btn-retry');

  bind(onRetry: () => void): void {
    this.retry.addEventListener('click', onRetry);
  }

  show(victory: boolean, name: string, bossName: string, stats: ResultStats): void {
    this.title.textContent = victory ? 'VITÓRIA' : 'VOCÊ CAIU';
    this.title.classList.toggle('victory', victory);
    this.title.classList.toggle('defeat', !victory);
    this.sub.textContent = victory
      ? `${name} extraiu o Sangue Primordial de ${bossName}.`
      : `${bossName} reivindicou mais um caçador.`;
    this.stats.innerHTML = `
      <div class="result-stat"><span>Sangue</span><strong>${stats.blood.toLocaleString('pt-BR')}</strong></div>
      <div class="result-stat"><span>Esquivas perfeitas</span><strong>${stats.perfectDodges}</strong></div>
      <div class="result-stat"><span>Parries</span><strong>${stats.parries}</strong></div>
    `;
    this.screen.classList.remove('hidden');
  }

  hide(): void {
    this.screen.classList.add('hidden');
  }
}
