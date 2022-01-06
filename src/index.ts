import { nanoid } from 'nanoid';
import { ArrowKeys, arrowTypes, ErdShape } from './erdShape';
import * as fs from 'fs/promises';
import inquirer from 'inquirer';
import * as process from 'process';
import { FuzzyPathQuestionOptions } from 'inquirer-fuzzy-path';
import { Database, Endpoint, RelationalId } from './types/types';
import { buildColumnName, getFieldType } from './helpers';

const { Parser, ModelExporter } = require('@dbml/core');

function titleCase(aString: string): string {
  let str = aString.toLowerCase().split(' ');
  for (var i = 0; i < str.length; i++) {
    str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
  }
  return str.join(' ');
}

function GetTableName(aTableName: string): string {
  // TODO if there are spaces in the 
  aTableName = aTableName;
  const searchRegExp = /\s/g;
  return aTableName.replace(searchRegExp, '');
}

async function main() {
  inquirer.registerPrompt('fuzzypath', require('inquirer-fuzzy-path'));

  try {
    await fs.access('dist/files');
  } catch (e) {
    await inquirer.prompt([
      {
        type: 'input',
        message: 'Files folder not found, create a folder named "files" in the app directory and put your .dbml files there (Press enter to exit)',
        name: 'error'
      }
    ]);
    process.exit(1);
  }

  const inputFileResponse = await inquirer.prompt<{ path: string }>([
    {
      type: 'fuzzypath',
      name: 'path',
      itemType: 'file',
      rootPath: 'dist/files',
      message: 'Select the dbml file to load',
    } as FuzzyPathQuestionOptions
  ]);

  const inputFile = inputFileResponse.path;

  const dmbl = await fs.readFile(inputFile, 'utf-8');

  const parsedDbml = Parser.parse(dmbl, 'dbml');
  const dmblJson = ModelExporter.export(parsedDbml, 'json', false);
  const database = JSON.parse(dmblJson) as Database;
  let schemaPUML = [] as string[];
  schemaPUML.push("@startuml")
  schemaPUML.push("")
  schemaPUML.push("!theme plain")
  schemaPUML.push("hide circle")
  schemaPUML.push("skinparam linetype ortho")
  schemaPUML.push("")

  database.schemas.forEach(schema => {

    schema.tables.forEach(table => {
      schemaPUML.push("entity " + GetTableName(table.name) + " {")

      table.fields.forEach(field => {
        let tempFieldname = " " + field.name
        if (field.pk) {
          tempFieldname = " *" + tempFieldname
        }
        if (field.increment) {
          tempFieldname = tempFieldname + " <<autoinc>> "
        }
        schemaPUML.push(tempFieldname);
      });

      schemaPUML.push("}")
      schemaPUML.push("")


    });

    schema.refs.forEach(ref => {

      let StartPoint = "";
      if (ref.endpoints[1].relation == "*") {
        StartPoint = GetTableName(ref.endpoints[1].tableName) + " }o";
      }
      let EndPoint = "|| " + GetTableName(ref.endpoints[0].tableName);

      schemaPUML.push(StartPoint + "--" + EndPoint)

    });
    
  });
  schemaPUML.push("")

  schemaPUML.push("@enduml")
  const filenameMatches = /\/?(\w+)\..+$/gmi.exec(inputFile);

  if (!filenameMatches) {
    return;
  }
  (async () => {
  await fs.writeFile(`dist/files/${filenameMatches[1]}.puml`, schemaPUML.join("\n"));
  })();

}

(async () => {
  await main();
})();
