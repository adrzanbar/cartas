import * as migration_20260312_233336 from './20260312_233336';
import * as migration_20260409_000253 from './20260409_000253';

export const migrations = [
  {
    up: migration_20260312_233336.up,
    down: migration_20260312_233336.down,
    name: '20260312_233336',
  },
  {
    up: migration_20260409_000253.up,
    down: migration_20260409_000253.down,
    name: '20260409_000253'
  },
];
