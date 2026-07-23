export interface BossDef {
  id: string;
  name: string;
  title: string;
  hp: number;
  radius: number; // raio de colisão/corpo
  contactRadius: number; // alcance do corpo que empurra o jogador
  speed: number; // velocidade de reposicionamento
  bloodMult: number; // multiplicador de sangue da arena
  scale: number; // escala visual do sprite
}

/** Arena 1 — Capitão Drakmar, deus dos mares acorrentado ao convés fantasma. */
export const CAPITAO_DRAKMAR: BossDef = {
  id: 'capitao_drakmar',
  name: 'CAPITÃO DRAKMAR',
  title: 'Deus dos Mares Acorrentado',
  hp: 1500,
  radius: 20,
  contactRadius: 22,
  speed: 42,
  bloodMult: 1.0,
  scale: 3,
};
