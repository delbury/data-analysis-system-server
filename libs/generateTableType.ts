/**
 * 生成数据库表类型文件
 */

// const fs = require('fs');
// const path = require('path');
import fs from 'fs';
import path from 'path';
import camelcase from 'camelcase';

import { DBTable } from '../src/db/interface';

type Modules = { default: DBTable }

// 输入数据库表配置文件夹
const tablesDirPath = path.resolve(__dirname, '../src/db/tables');
// 输出数据库表类型文件夹
const outputDirPath = path.resolve(__dirname, '../types/tables');

main();

// 主函数
async function main() {
  const files = await fs.promises.readdir(tablesDirPath);
  files.forEach(file => {
    const tablePath = path.resolve(tablesDirPath, `./${file}`);
    import(tablePath).then((modules: Modules) => {
      const module = modules.default;
      // 生成ts文件
      const content = resolveTableModule(module);
      saveAsFile(
        path.resolve(outputDirPath, `./${camelcase(module.name, { pascalCase: true })}.d.ts`),
        content,
      );
    });
  });
}

// 处理导入的table模块
const numberReg = /^(DECIMAL|INT|TINYINT)/i;
function resolveTableModule(module: DBTable): string {
  const typeName = `${camelcase(module.name, { pascalCase: true })}Table`;
  const contents: string[] = [];
  module.columns.forEach(item => {
    // 处理参数
    const isNumber = numberReg.test(item.type);
    if(item.comment !== void 0) {
      contents.push(`  // ${item.comment}`);
    }
    contents.push(`  ${item.key}: ${isNumber ? 'number' : 'string'};`);
  });
  const result = `export interface ${typeName} {\n` + contents.join('\n') + '\n}\n';
  return result;
}

// 生成文件
async function saveAsFile(file: string, content: string) {
  await fs.promises.writeFile(file, content);
}
