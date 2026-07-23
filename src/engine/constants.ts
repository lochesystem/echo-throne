// Resolução interna (upscale inteiro no fitCanvas)
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 270;

// Arena jogável (convés) — centralizada no mundo
export const ARENA_WIDTH = 360;
export const ARENA_HEIGHT = 280;
export const ARENA_WALL = 14; // faixa de borda não caminhável

// Jogador
export const PLAYER_SPEED = 120;
export const PLAYER_MAX_HP = 180;
export const PLAYER_MAX_ENERGY = 60;
export const PLAYER_MAX_STAMINA = 100;
export const PLAYER_RADIUS = 6;

// Regeneração
export const ENERGY_REGEN = 3; // por segundo
export const ENERGY_PER_MELEE_HIT = 5;
export const STAMINA_REGEN = 25; // por segundo
export const STAMINA_REGEN_DELAY = 0.4; // atraso após esquivar

// Esquiva
export const DODGE_STAMINA_COST = 25;
export const DODGE_DURATION = 0.25; // i-frames
export const DODGE_DISTANCE = 48;
export const PERFECT_DODGE_WINDOW = 0.12; // janela antes do impacto
export const PERFECT_DODGE_ENERGY = 15;
export const PERFECT_DODGE_SLOW = 0.5; // duração do slow no boss
export const PERFECT_DODGE_SLOW_MULT = 0.4;

// Parry
export const PARRY_WINDOW = 0.18;
export const PARRY_COOLDOWN = 0.6;
export const PARRY_STAGGER = 1.2;
export const RIPOSTE_DAMAGE = 40;

// Combo melee (3 hits)
export const COMBO_DAMAGE = [12, 14, 20] as const;
export const COMBO_WINDUP = [0.15, 0.12, 0.2] as const;
export const COMBO_RANGE = 34;
export const COMBO_ARC = Math.PI * 0.6; // meio-arco total do golpe
export const COMBO_LINK_WINDOW = 0.45; // tempo para encadear o próximo hit
export const COMBO_RESET = 0.7;

// Habilidade — Investida
export const INVESTIDA_COST = 15;
export const INVESTIDA_COOLDOWN = 4;
export const INVESTIDA_DISTANCE = 64;
export const INVESTIDA_DAMAGE = 25;
export const INVESTIDA_DURATION = 0.15; // i-frames

// Poção
export const POTION_CHARGES = 3;
export const POTION_HEAL = 40;

// Weak point (após stagger por combo cheio)
export const WEAKPOINT_STAGGER = 2.0;
export const WEAKPOINT_DAMAGE_MULT = 1.6;

export const SAVE_KEY = 'echo-throne-save';
