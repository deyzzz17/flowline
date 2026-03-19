import * as migration_20260319_110814 from './20260319_110814';

export const migrations = [
  {
    up: migration_20260319_110814.up,
    down: migration_20260319_110814.down,
    name: '20260319_110814'
  },
];
