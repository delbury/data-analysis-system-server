/**
 * 生成数据库表类型文件
 */

// const fs = require('fs');
// const path = require('path');
import fs from 'fs';
import path from 'path';
import camelcase from 'camelcase';

import { numberReg, jsonReg } from './common';
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
  // 生成的每个 table 的类型文件
  const tsFiles: string[] = [];
  // 每个表名
  const tableNames: string[] = [];

  await Promise.all(files.map(file => {
    const tablePath = path.resolve(tablesDirPath, `./${file}`);
    return import(tablePath).then((modules: Modules) => {
      const module = modules.default;
      // 解析内容
      const content = resolveTableModule(module);
      // 生成文件
      const tsFile = `./${camelcase(module.name, { pascalCase: true })}`;
      saveAsFile(
        path.resolve(outputDirPath, `${tsFile}.d.ts`),
        content,
      );
      tableNames.push(module.name);
      tsFiles.push(tsFile);
    });
  }));

  // 生成 index 文件
  const contents: string[] = [
    ...tsFiles.map(file => `export * from '${file}';`),
    '',
    `export type TableNames = ${tableNames.map(name => `'${name}'`).join(' | ')};`,
    '',
  ];
  saveAsFile(path.resolve(outputDirPath, './index.d.ts'), contents.join('\n'));
}

// 处理导入的table模块
function resolveTableModule(module: DBTable): string {
  const typeName = `${camelcase(module.name, { pascalCase: true })}Table`;
  const imports: string[] = [];
  const contents: string[] = [];
  module.columns.forEach(item => {
    // 处理参数
    const isNumber = numberReg.test(item.type);
    const isJson = jsonReg.test(item.type);
    const isStringList = item.json_type === 'string-array';
    const isObjectList = item.json_type === 'object-array';
    if(item.comment !== void 0) {
      contents.push(`  // ${item.comment}`);
    }
    let valueType = 'string';
    if(isNumber) valueType = 'number';
    else if(isObjectList && isJson) valueType = '{}[]';
    else if(isStringList && isJson) valueType = 'string[]';

    contents.push(`  ${item.key}: ${valueType};`);

    // 是否存在 join
    if(item.join_table) {
      // import 其他表
      const fileName = camelcase(item.join_table.table, { pascalCase: true });
      const tableType = `${fileName}Table`;
      imports.push(`import { ${tableType} } from './${fileName}';`);

      Object.entries(item.join_table.fieldsMap).forEach(([key, val]) => {
        contents.push(`  ${val}: ${tableType}['${key}'];`);
      });
    }
  });

  // 整张表是否存在 join json
  if(module.join_json_array) {
    Object.entries(module.join_json_array).forEach(([key, val]) => {
      const fileName = camelcase(val.targetTableName, { pascalCase: true });
      const tableType = `${fileName}Table`;
      imports.push(`import { ${tableType} } from './${fileName}';`);

      if(val.fieldsMap) {
        // 部分字段
        contents.push(`  ${key}: {`);
        Object.entries(val.fieldsMap).forEach(([k, v]) => {
          contents.push(`    ${v}: ${tableType}['${k}'];`);
        });
        contents.push('  }[];');
      } else {
        contents.push(`  ${key}: ${tableType}[];`);
      }
    });
  }

  const result = (imports.length ? (imports.join('\n') + '\n\n') : '') +
    `export interface ${typeName} {\n` + contents.join('\n') + '\n}\n';
  return result;
}

// 生成文件
async function saveAsFile(file: string, content: string) {
  await fs.promises.writeFile(file, content);
}
