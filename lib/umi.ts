import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs-extra';
import chalk from 'chalk';

const toArray = (arg: string | string[]) => (Array.isArray(arg) ? arg : [arg]);

const run = (command: string, params: string | string[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    params = toArray(params);
    const child = spawn(command, params, { stdio: 'inherit' });
    child.on('close', (code) => {
      if (code !== 0) {
        reject({ command: `${command} ${toArray(params).join(' ')}` });
      }
      resolve();
    });
  });
};

const writeFileSync = (filename: string, data: string) => fs.writeFileSync(filename, data);

const installAndCreateCommitlintConfig = async (command: string): Promise<void> => {
  await run(command, ['add', '@commitlint/cli', '@commitlint/config-conventional', '--dev']);
  const data = "module.exports = {extends: ['@commitlint/config-conventional']}";
  writeFileSync('commitlint.config.js', data);
};

const installAndCreateEslintConfig = async (command: string): Promise<void> => {
  /**
   * 查看eslint配置的更多说明
   * https://www.sitepoint.com/react-with-typescript-best-practices/
   */
  const data = `module.exports =  {
    parser:  '@typescript-eslint/parser',  // Specifies the ESLint parser
    extends:  [
      'plugin:react/recommended',  // Uses the recommended rules from @eslint-plugin-react
      'plugin:@typescript-eslint/recommended',  // Uses the recommended rules from @typescript-eslint/eslint-plugin
      'plugin:prettier/recommended',
    ],
    parserOptions:  {
      ecmaVersion:  2020,  // Allows for the parsing of modern ECMAScript features
      sourceType:  'module',  // Allows for the use of imports
      ecmaFeatures:  {
        jsx:  true,  // Allows for the parsing of JSX
      },
    },
    rules:  {
      // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
      // e.g. "@typescript-eslint/explicit-function-return-type": "off",
      'camelcase': ['error'],  // 强制使用骆驼拼写法命名约定
      'consistent-return': ['error'], // 要求 return 语句要么总是指定返回的值，要么不指定
      'eqeqeq': [1], // 要求使用 === 和 !==
      'no-empty-function': ['error'], // 禁止出现空函数
      'no-nested-ternary': ['error'], // 禁用嵌套的三元表达式
      'no-bitwise': ['error'], // 禁用按位运算符
      'react/react-in-jsx-scope': [0],
      'prettier/prettier': ['error'],
    },
    settings:  {
      react:  {
        version:  'detect',  // 告诉 eslint-plugin-react 自动检测React要使用的版本
      },
    },
  };
  `;
  await run(command, [
    'add',
    'eslint',
    '@typescript-eslint/parser',
    'eslint-plugin-react',
    '@typescript-eslint/eslint-plugin',
    'eslint-plugin-react-hooks',
    'eslint-config-prettier',
    'eslint-plugin-prettier',
    '--dev',
  ]);
  writeFileSync('.eslintrc.js', data);
};

const installAndCreateHuskyConfig = async (command: string) => {
  await run(command, ['add', 'husky', '--dev']);
  //husky 需要针对.git文件
  await run('git', 'init');
  await run(command, ['husky', 'install']);
  await run(command, ['husky', 'add', '.husky/commit-msg', 'yarn commitlint --edit $1']);
};

const umi = async (option: Record<string, unknown>): Promise<void> => {
  if (!option.umi) return;
  const umi = option.umi as string;
  const command = 'yarn';
  const root = path.resolve(umi);
  //如果不存在创建项目文件夹
  fs.ensureDirSync(umi);
  // const originDir = process.cwd();
  //移动命令执行环境到项目文件夹
  process.chdir(root);
  try {
    //创建umi模板
    await run(command, ['create', '@umijs/umi-app']);
    //安装相关依赖项
    await run(command, 'install');
    //commit 信息检查配置
    await installAndCreateCommitlintConfig(command);
    //eslint 配置
    await installAndCreateEslintConfig(command);
    //husky 配置
    await installAndCreateHuskyConfig(command);
  } catch (err) {
    console.error('Run command ');
    console.log(chalk.cyan(JSON.stringify(err)));
    console.log();
  }
};

export default umi;
