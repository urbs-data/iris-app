import type { ETLProcessor, ETLContext } from './types';
import { WellsETL } from './wells-etl';
import { SubstancesETL } from './substances-etl';
import { SamplesETL } from './samples-etl';

class ETLRegistry {
  private processors: ETLProcessor[] = [];

  register(processor: ETLProcessor): void {
    this.processors.push(processor);
  }

  resolve(ctx: ETLContext): ETLProcessor | null {
    return this.processors.find((p) => p.canProcess(ctx)) ?? null;
  }
}

const registry = new ETLRegistry();

registry.register(new WellsETL());
registry.register(new SubstancesETL());
registry.register(new SamplesETL());

export function resolveETLProcessor(ctx: ETLContext): ETLProcessor | null {
  return registry.resolve(ctx);
}
