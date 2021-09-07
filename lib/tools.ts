#!/usr/bin/env node

import umi from "./umi";
import {Command} from 'commander';

const program = new Command();

program.version(require('../package.json').version);

program
.option('--umi <name>', '创建以umi为脚手架的基本配置')

program.parse(process.argv);

//解析后的选项
const options = program.opts();

umi(options);
 