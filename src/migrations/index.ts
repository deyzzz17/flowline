import * as migration_20260319_110814 from './20260319_110814';
import * as migration_20260324_184033 from './20260324_184033';
import * as migration_20260324_185931 from './20260324_185931';
import * as migration_20260324_193906 from './20260324_193906';
import * as migration_20260324_201147 from './20260324_201147';
import * as migration_20260324_211515 from './20260324_211515';
import * as migration_20260324_222852 from './20260324_222852';
import * as migration_20260327_121631 from './20260327_121631';
import * as migration_20260401_091654 from './20260401_091654';
import * as migration_20260412_201629 from './20260412_201629';
import * as migration_20260414_171817 from './20260414_171817';

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
    name: '20260324_201147',
  },
  {
    up: migration_20260324_211515.up,
    down: migration_20260324_211515.down,
    name: '20260324_211515',
  },
  {
    up: migration_20260324_222852.up,
    down: migration_20260324_222852.down,
    name: '20260324_222852',
  },
  {
    up: migration_20260327_121631.up,
    down: migration_20260327_121631.down,
    name: '20260327_121631',
  },
  {
    up: migration_20260401_091654.up,
    down: migration_20260401_091654.down,
    name: '20260401_091654',
  },
  {
    up: migration_20260412_201629.up,
    down: migration_20260412_201629.down,
    name: '20260412_201629',
  },
  {
    up: migration_20260414_171817.up,
    down: migration_20260414_171817.down,
    name: '20260414_171817'
  },
];
