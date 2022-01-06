import {nanoid} from 'nanoid';
import {create} from 'xmlbuilder2';
import {ArrowKeys, arrowTypes, ErdShape} from './erdShape';
import * as fs from 'fs/promises';
import inquirer from 'inquirer';
import * as process from 'process';
import {FuzzyPathQuestionOptions} from 'inquirer-fuzzy-path';
import {Database, Endpoint, RelationalId} from './types/types';
import {buildColumnName, getFieldType} from './helpers';

const {Parser, ModelExporter} = require('@dbml/core');

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

  database.schemas.forEach(schema => {
    const root = create()
      .ele('mxfile', {host: 'app.diagrams.net', etag: nanoid(20), version: '15.5.2', type: 'device'})
      .ele('diagram', {id: nanoid(20), name: 'Page-1'})
      .ele('mxGraphModel',
        {
          dx: '1200',
          dy: '1200',
          grid: '1',
          gridSize: '10',
          guides: '1',
          tooltips: '1',
          connect: '1',
          arrows: '1',
          fold: '1',
          page: '1',
          pageScale: '1',
          pageWidth: '900',
          pageHeight: '1200',
          math: '0',
          shadow: '0',
          extFonts: 'Permanent Marker^https://fonts.googleapis.com/css?family=Permanent+Marker'
        })
      .ele('root')
      .ele('mxCell', {id: '0'}).up()
      .ele('mxCell', {id: '1', parent: '0'}).up();
    const shapes: ErdShape[] = [];

    const x = 120;
    let previousY = 0;
    let previousHeight = 0;

    schema.tables.forEach(table => {
      const tableHeight = (30 * table.fields.length) + 30;
      const y = previousY + previousHeight + 20;

      const erdShape = new ErdShape(table.name, 120, tableHeight, x, y, table.alias ?? '');

      previousHeight = tableHeight;
      previousY = y;

      table.fields.forEach(field => {
        const name = buildColumnName(field);
        const type = getFieldType(field, table.name, schema.refs, table.alias ?? '');

        const requiredWidth = (((name.length * 8) + (13.333333333333332 * 2)) + 50);
        const requiredWidthPt = requiredWidth * 0.75;

        if (requiredWidthPt > erdShape.width) {
          erdShape.width = requiredWidthPt;
        }

        erdShape.addFieldRow(name, type);
      });

      erdShape.build();
      shapes.push(erdShape);
    });

    schema.refs.forEach(ref => {
      const refPairs: { endpoint: Endpoint, shape: ErdShape, targetRelationalId: RelationalId }[] = [];

      ref.endpoints.forEach(endpoint => {
        shapes.forEach(shape => {
          const targetRelationalId = shape.relationalIds.find(id => endpoint.fieldNames.includes(id.name));

          if (targetRelationalId &&
            endpoint.fieldNames.includes(targetRelationalId.name) &&
            (endpoint.tableName === shape.tableTitle || endpoint.tableName === shape.alias)) {
            refPairs.push({endpoint, shape, targetRelationalId});
          }
        });
      });

      if (refPairs.length !== 2) {
        return;
      }

      const source = refPairs[0];
      const foreignKey = refPairs[1];

      source.shape.appendArrow(arrowTypes[source.endpoint.relation as ArrowKeys],
        arrowTypes[foreignKey.endpoint.relation as ArrowKeys],
        source.targetRelationalId.id,
        foreignKey.targetRelationalId.id);
    });

    shapes.forEach(shape => {
      const nodes = shape.xml.toArray(false);
      nodes.forEach(node => {
        root.import(node);
      });
    });

    const schemaXml = root.end({prettyPrint: true});

    const filenameMatches = /\/?(\w+)\..+$/gmi.exec(inputFile);

    if (!filenameMatches) {
      return;
    }

    (async () => {
      await fs.writeFile(`dist/files/${filenameMatches[1]}.xml`, schemaXml);
    })();
  });
}

(async () => {
  await main();
})();
