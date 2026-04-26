import * as migration_20260312_233336 from './20260312_233336';
import * as migration_20260409_000253 from './20260409_000253';
import * as migration_20260420_204612 from './20260420_204612';
import * as migration_20260421_105645 from './20260421_105645';
import * as migration_20260421_225726 from './20260421_225726';
import * as migration_20260423_114244 from './20260423_114244';
import * as migration_20260423_155301 from './20260423_155301';
import * as migration_20260426_013309 from './20260426_013309';
import * as migration_20260426_033937 from './20260426_033937';

export const migrations = [
  {
    up: migration_20260312_233336.up,
    down: migration_20260312_233336.down,
    name: '20260312_233336',
  },
  {
    up: migration_20260409_000253.up,
    down: migration_20260409_000253.down,
    name: '20260409_000253',
  },
  {
    up: migration_20260420_204612.up,
    down: migration_20260420_204612.down,
    name: '20260420_204612',
  },
  {
    up: migration_20260421_105645.up,
    down: migration_20260421_105645.down,
    name: '20260421_105645',
  },
  {
    up: migration_20260421_225726.up,
    down: migration_20260421_225726.down,
    name: '20260421_225726',
  },
  {
    up: migration_20260423_114244.up,
    down: migration_20260423_114244.down,
    name: '20260423_114244',
  },
  {
    up: migration_20260423_155301.up,
    down: migration_20260423_155301.down,
    name: '20260423_155301',
  },
  {
    up: migration_20260426_013309.up,
    down: migration_20260426_013309.down,
    name: '20260426_013309',
  },
  {
    up: migration_20260426_033937.up,
    down: migration_20260426_033937.down,
    name: '20260426_033937'
  },
];
