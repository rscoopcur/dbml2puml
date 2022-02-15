import * as fs from 'fs/promises';
import inquirer from 'inquirer';
import * as process from 'process';
import { FuzzyPathQuestionOptions } from 'inquirer-fuzzy-path';
import { Database } from './types/types';

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
  // TODO fix the function Currently it changes UserTypes to Usertypes 
  if (aTableName.indexOf(' ') >= 0) {
    aTableName = titleCase(aTableName);
  }
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
  const dbml = await fs.readFile(inputFile, 'utf-8');
  const parsedDbml = Parser.parse(dbml, 'dbml');
  const dbmlJson = ModelExporter.export(parsedDbml, 'json', false);
  const schemas = JSON.parse(dbmlJson);
  //console.log(schemas.schemas[0].enums[0].values[0]);
  const database = schemas as Database;
  let schemaPUML = [] as string[];
  schemaPUML.push("@startuml")
  schemaPUML.push("")
  schemaPUML.push("!theme plain")
  schemaPUML.push("hide circle")
  schemaPUML.push("skinparam linetype ortho")
  schemaPUML.push("title Add Title Here")
  schemaPUML.push("")

  schemas.schemas.forEach((schema:any) => {
    schema.enums.forEach((anEnum:any) => {
      schemaPUML.push("enum " + anEnum.name + " {");
      anEnum.values.forEach((aValue:any)=>{
          schemaPUML.push("  " + aValue.name );
      })
      schemaPUML.push("}")
      schemaPUML.push("")
    });
  });
  let schemaIndex = -1;
  database.schemas.forEach(schema => {

    schemaIndex++;

    schema.tables.forEach(table => {

      let enums = [] as string[];

      schemaPUML.push("entity " + GetTableName(table.name) + " {")
      let hasPK = false;
      table.fields.forEach(field => {
        let tempFieldname = " " + field.name + " : " + field.type.type_name
        if (field.pk) {
          hasPK = true
          tempFieldname = " *" + tempFieldname
          if (field.increment) {
            tempFieldname = tempFieldname + " <<autoinc>> "
          }
          schemaPUML.push(tempFieldname);
        }
      });
      if (hasPK) {
        schemaPUML.push(" --")
      }
      table.fields.forEach(field => {
        let tempFieldname = " " + field.name + " : " + field.type.type_name
        if (!field.pk) {
          if (field.increment) {
            tempFieldname = tempFieldname + " <<autoinc>> "
          }
          let anIndex = schemas.schemas[schemaIndex].enums.findIndex((x:any)=>{return x.name == field.type.type_name});
          if (anIndex > -1) {
            enums.push(GetTableName(table.name) +  " -- " + field.type.type_name)
          }
          schemaPUML.push(tempFieldname);
        }
      });

      schemaPUML.push("}")
      schemaPUML.push("")
      if (enums.length > 0) {

        enums.forEach((anEnum:any)=>{
          schemaPUML.push(anEnum)
        })
        schemaPUML.push("")
      }

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
  
    //await fs.writeFile(`dist/files/${filenameMatches[1]}.json`, dmblJson);
    await fs.writeFile(`dist/files/${filenameMatches[1]}.puml`, schemaPUML.join("\n"));
  })();

}

(async () => {
  await main();
})();
