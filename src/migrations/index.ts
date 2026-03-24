import * as migration_20260319_110814 from './20260319_110814';
import * as migration_20260324_184033 from './20260324_184033';
import * as migration_20260324_185931 from './20260324_185931';
import * as migration_20260324_193906 from './20260324_193906';
import * as migration_20260324_201147 from './20260324_201147';

export const migrations = [
  {
    up: migration_20260319_110814.up,
    down: migration_20260319_110814.down,
    name: '20260319_110814',
  },
  {
    up: migration_20260324_184033.up,
    down: migration_20260324_184033.down,
    name: '20260324_184033',
  },
  {
    up: migration_20260324_185931.up,
    down: migration_20260324_185931.down,
    name: '20260324_185931',
  },
  {
    up: migration_20260324_193906.up,
    down: migration_20260324_193906.down,
    name: '20260324_193906',
  },
  {
    up: migration_20260324_201147.up,
    down: migration_20260324_201147.down,
    name: '20260324_201147'
  },
];
