import { Application, Assets } from 'pixi.js';
import { GAME_HEIGHT, GAME_WIDTH } from './engine/constants.ts';
import { InputManager } from './engine/input.ts';
import { ArenaScene } from './scenes/arenaScene.ts';
import { prepareActorAnimations } from './world/actorAnimAssets.ts';
import { Hud } from './ui/hud.ts';
import { NameEntryUI } from './ui/nameEntryUI.ts';
import { ResultUI } from './ui/resultUI.ts';
import type { Screen } from './types.ts';

export class Game {
  private app!: Application;
  private input!: InputManager;
  private scene!: ArenaScene;
  private hud!: Hud;
  private nameUI = new NameEntryUI();
  private resultUI = new ResultUI();
  private screen: Screen = 'name';
  private playerName = 'Caçador';

  async init(): Promise<void> {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.app = new Application();
    await this.app.init({
      canvas,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: 0x06080d,
      antialias: false,
      resolution: 1,
      roundPixels: true,
      autoStart: false,
    });

    this.fitCanvas();
    window.addEventListener('resize', () => this.fitCanvas());

    this.input = new InputManager(canvas);
    this.hud = new Hud();
    await Promise.all([
      prepareActorAnimations(this.app.renderer),
      Assets.load(`${import.meta.env.BASE_URL}assets/arena/deck-tiles-v1.png`),
    ]);
    this.scene = new ArenaScene(this.input, this.hud);
    this.app.stage.addChild(this.scene.container);
    this.scene.container.visible = false;

    this.scene.onVictory = () => this.endMatch(true);
    this.scene.onDefeat = () => this.endMatch(false);

    this.nameUI.bind((name) => this.startMatch(name));
    this.resultUI.bind(() => this.startMatch(this.playerName));

    this.app.ticker.add((ticker) => {
      if (this.screen !== 'arena') return;
      const dt = Math.min(0.05, ticker.deltaMS / 1000);
      this.scene.update(dt);
    });
    this.app.start();

    this.nameUI.show();
  }

  private startMatch(name: string): void {
    this.playerName = name;
    this.nameUI.hide();
    this.resultUI.hide();
    this.scene.container.visible = true;
    this.scene.start(name);
    this.screen = 'arena';
  }

  private endMatch(victory: boolean): void {
    this.screen = 'result';
    this.scene.stop();
    this.scene.container.visible = false;
    const names = this.scene.getNames();
    this.resultUI.show(victory, names.player, names.boss, this.scene.getStats());
  }

  private fitCanvas(): void {
    const wrapper = document.getElementById('game-wrapper');
    if (!wrapper) return;
    const canvas = this.app.canvas;
    const scale = Math.max(
      1,
      Math.floor(Math.min(wrapper.clientWidth / GAME_WIDTH, wrapper.clientHeight / GAME_HEIGHT)),
    );
    if (this.app.renderer.resolution !== scale) {
      this.app.renderer.resolution = scale;
    }
    this.app.renderer.resize(GAME_WIDTH, GAME_HEIGHT);
    canvas.style.width = `${GAME_WIDTH * scale}px`;
    canvas.style.height = `${GAME_HEIGHT * scale}px`;
  }
}
