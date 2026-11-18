import { GAME } from '../../config/game';
import { PHASES, PhaseConfig, phaseAt } from '../../config/difficulty';

/** Reloj de partida y fase de dificultad activa. */
export class DifficultySystem {
  elapsed = 0;
  phase: PhaseConfig = PHASES[0];

  reset(startAt = 0): void {
    this.elapsed = startAt;
    this.phase = phaseAt(startAt);
  }

  /** Avanza el reloj; devuelve la nueva fase si cambió. */
  tick(dt: number): PhaseConfig | null {
    this.elapsed = Math.min(this.elapsed + dt, GAME.surviveSeconds);
    const p = phaseAt(this.elapsed);
    if (p.id !== this.phase.id) {
      this.phase = p;
      return p;
    }
    return null;
  }

  get finished(): boolean { return this.elapsed >= GAME.surviveSeconds; }
  get progress(): number { return this.elapsed / GAME.surviveSeconds; }
}
