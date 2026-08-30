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
import * as migration_20260414_191739 from './20260414_191739';
import * as migration_20260421_143519 from './20260421_143519';
import * as migration_20260421_153656 from './20260421_153656';
import * as migration_20260427_110624 from './20260427_110624';
import * as migration_20260427_173729 from './20260427_173729';
import * as migration_20260428_145138 from './20260428_145138';
import * as migration_20260429_124621 from './20260429_124621';
import * as migration_20260429_132404 from './20260429_132404';
import * as migration_20260429_144640 from './20260429_144640';
import * as migration_20260504_134717 from './20260504_134717';
import * as migration_20260504_141600 from './20260504_141600';
import * as migration_20260510_190038 from './20260510_190038';
import * as migration_20260515_143900 from './20260515_143900';
import * as migration_20260521_121338 from './20260521_121338';
import * as migration_20260521_122812 from './20260521_122812';
import * as migration_20260521_124815 from './20260521_124815';
import * as migration_20260521_160747 from './20260521_160747';
import * as migration_20260522_130509 from './20260522_130509';
import * as migration_20260528_113014 from './20260528_113014';
import * as migration_20260528_143130 from './20260528_143130';
import * as migration_20260529_160830 from './20260529_160830';
import * as migration_20260529_170054 from './20260529_170054';
import * as migration_20260529_171612 from './20260529_171612';
import * as migration_20260530_193729 from './20260530_193729';
import * as migration_20260531_211618 from './20260531_211618';
import * as migration_20260604_100632 from './20260604_100632';
import * as migration_20260608_170233 from './20260608_170233';
import * as migration_20260611_085650 from './20260611_085650';
import * as migration_20260619_143703 from './20260619_143703';
import * as migration_20260811_160114 from './20260811_160114';
import * as migration_20260812_094547 from './20260812_094547';
import * as migration_20260812_104649 from './20260812_104649';
import * as migration_20260819_150003_shared_lists from './20260819_150003_shared_lists';
import * as migration_20260820_142630_task_assignment from './20260820_142630_task_assignment';
import * as migration_20260821_143910_task_comments from './20260821_143910_task_comments';
import * as migration_20260828_144648_add_workspaces from './20260828_144648_add_workspaces';
import * as migration_20260828_154737_workspaces_full_scope from './20260828_154737_workspaces_full_scope';
import * as migration_20260830_195000_workspaces_to_organizations from './20260830_195000_workspaces_to_organizations';
import * as migration_20260831_014500_tasks_workspace from './20260831_014500_tasks_workspace';

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
    name: '20260414_171817',
  },
  {
    up: migration_20260414_191739.up,
    down: migration_20260414_191739.down,
    name: '20260414_191739',
  },
  {
    up: migration_20260421_143519.up,
    down: migration_20260421_143519.down,
    name: '20260421_143519',
  },
  {
    up: migration_20260421_153656.up,
    down: migration_20260421_153656.down,
    name: '20260421_153656',
  },
  {
    up: migration_20260427_110624.up,
    down: migration_20260427_110624.down,
    name: '20260427_110624',
  },
  {
    up: migration_20260427_173729.up,
    down: migration_20260427_173729.down,
    name: '20260427_173729',
  },
  {
    up: migration_20260428_145138.up,
    down: migration_20260428_145138.down,
    name: '20260428_145138',
  },
  {
    up: migration_20260429_124621.up,
    down: migration_20260429_124621.down,
    name: '20260429_124621',
  },
  {
    up: migration_20260429_132404.up,
    down: migration_20260429_132404.down,
    name: '20260429_132404',
  },
  {
    up: migration_20260429_144640.up,
    down: migration_20260429_144640.down,
    name: '20260429_144640',
  },
  {
    up: migration_20260504_134717.up,
    down: migration_20260504_134717.down,
    name: '20260504_134717',
  },
  {
    up: migration_20260504_141600.up,
    down: migration_20260504_141600.down,
    name: '20260504_141600',
  },
  {
    up: migration_20260510_190038.up,
    down: migration_20260510_190038.down,
    name: '20260510_190038',
  },
  {
    up: migration_20260515_143900.up,
    down: migration_20260515_143900.down,
    name: '20260515_143900',
  },
  {
    up: migration_20260521_121338.up,
    down: migration_20260521_121338.down,
    name: '20260521_121338',
  },
  {
    up: migration_20260521_122812.up,
    down: migration_20260521_122812.down,
    name: '20260521_122812',
  },
  {
    up: migration_20260521_124815.up,
    down: migration_20260521_124815.down,
    name: '20260521_124815',
  },
  {
    up: migration_20260521_160747.up,
    down: migration_20260521_160747.down,
    name: '20260521_160747',
  },
  {
    up: migration_20260522_130509.up,
    down: migration_20260522_130509.down,
    name: '20260522_130509',
  },
  {
    up: migration_20260528_113014.up,
    down: migration_20260528_113014.down,
    name: '20260528_113014',
  },
  {
    up: migration_20260528_143130.up,
    down: migration_20260528_143130.down,
    name: '20260528_143130',
  },
  {
    up: migration_20260529_160830.up,
    down: migration_20260529_160830.down,
    name: '20260529_160830',
  },
  {
    up: migration_20260529_170054.up,
    down: migration_20260529_170054.down,
    name: '20260529_170054',
  },
  {
    up: migration_20260529_171612.up,
    down: migration_20260529_171612.down,
    name: '20260529_171612',
  },
  {
    up: migration_20260530_193729.up,
    down: migration_20260530_193729.down,
    name: '20260530_193729',
  },
  {
    up: migration_20260531_211618.up,
    down: migration_20260531_211618.down,
    name: '20260531_211618',
  },
  {
    up: migration_20260604_100632.up,
    down: migration_20260604_100632.down,
    name: '20260604_100632',
  },
  {
    up: migration_20260608_170233.up,
    down: migration_20260608_170233.down,
    name: '20260608_170233',
  },
  {
    up: migration_20260611_085650.up,
    down: migration_20260611_085650.down,
    name: '20260611_085650',
  },
  {
    up: migration_20260619_143703.up,
    down: migration_20260619_143703.down,
    name: '20260619_143703',
  },
  {
    up: migration_20260811_160114.up,
    down: migration_20260811_160114.down,
    name: '20260811_160114',
  },
  {
    up: migration_20260812_094547.up,
    down: migration_20260812_094547.down,
    name: '20260812_094547',
  },
  {
    up: migration_20260812_104649.up,
    down: migration_20260812_104649.down,
    name: '20260812_104649',
  },
  {
    up: migration_20260819_150003_shared_lists.up,
    down: migration_20260819_150003_shared_lists.down,
    name: '20260819_150003_shared_lists',
  },
  {
    up: migration_20260820_142630_task_assignment.up,
    down: migration_20260820_142630_task_assignment.down,
    name: '20260820_142630_task_assignment',
  },
  {
    up: migration_20260821_143910_task_comments.up,
    down: migration_20260821_143910_task_comments.down,
    name: '20260821_143910_task_comments',
  },
  {
    up: migration_20260828_144648_add_workspaces.up,
    down: migration_20260828_144648_add_workspaces.down,
    name: '20260828_144648_add_workspaces',
  },
  {
    up: migration_20260828_154737_workspaces_full_scope.up,
    down: migration_20260828_154737_workspaces_full_scope.down,
    name: '20260828_154737_workspaces_full_scope'
  },
  {
    up: migration_20260830_195000_workspaces_to_organizations.up,
    down: migration_20260830_195000_workspaces_to_organizations.down,
    name: '20260830_195000_workspaces_to_organizations'
  },
  {
    up: migration_20260831_014500_tasks_workspace.up,
    down: migration_20260831_014500_tasks_workspace.down,
    name: '20260831_014500_tasks_workspace'
  },
];
