import {create} from 'xmlbuilder2';
import {XMLBuilder} from 'xmlbuilder2/lib/interfaces';
import {customAlphabet} from 'nanoid';
import {
  buildArrowStyle,
  buildFontStyle,
  ErdPkRowContainer,
  ErdRowContainer,
  ErdShapeRoot,
  ErdShapeTable
} from './styles';
import {RelationalId} from 'types/types';

export enum KeyTypes {
  pk   = 'PK',
  fk   = 'FK',
  none = ''
}

export type ArrowKeys = '1' | '*';

export const arrowTypes: Record<ArrowKeys, string> = {
  '1': 'ERmandOne',
  '*': 'ERoneToMany'
};

export class ErdShape {
  xml: XMLBuilder;
  tableTitle: string;
  alias: string;
  id: string;
  index = 0;
  fields: { value: string, type: KeyTypes }[] = [];
  width: number;
  height: number;
  x: number;
  y: number;
  relationalIds: RelationalId[] = [];

  constructor(tableTitle: string,
    width  = 120,
    height = 60,
    x      = 120,
    y      = 120,
    alias  = '') {
    this.tableTitle = tableTitle;
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.id = customAlphabet('abcdefghijklmnopqrstuvwxy0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 20)();
    this.alias = alias;
    this.xml = create()
      .ele('root');
  }

  addFieldRow(value: string, type = KeyTypes.none) {
    this.fields.push({value, type});
  }

  build() {
    const {mxCell: root} = this._addMxCell('', ErdShapeRoot, '1', {edge: '1'});
    root.ele('mxGeometry', {relative: '1', as: 'geometry'});

    const {id: tableId, mxCell: tableMxCell} = this._addMxCell(this.tableTitle, ErdShapeTable, '1', {vertex: 1});
    tableMxCell.ele('mxGeometry', {x: this.x, y: this.y, width: this.width, height: this.height, as: 'geometry'});

    this.fields.forEach(field => {
      this._buildErdRow(field.type, field.value, tableId, field.type);
    });
  }

  appendArrow(startArrow: string, endArrow: string, sourceId: string, targetId: string) {
    const {mxCell: arrowMxCell} = this._addMxCell('',
      buildArrowStyle(startArrow, endArrow),
      '1',
      {edge: 1, source: sourceId, target: targetId});
    arrowMxCell.ele('mxGeometry', {relative: 1, as: 'geometry'});
  }

  private _rootNode() {
    return this.xml;
  }

  private _addMxCell(value: string,
    style: string,
    parent: string,
    attributes?: Record<string, unknown>) {
    const id = `${this.id}-${this.index}`;
    const mxCell = this._rootNode().ele('mxCell', {...{id, value, style, parent}, ...attributes});
    this.index++;

    return {id, mxCell};
  }

  private _buildErdRow(key: string, value: string, parent: string, fieldType: KeyTypes) {
    const rowHeight = 30;

    const keyWidth = 30;
    const fieldWidth = this.width - keyWidth;
    const isPk = fieldType === KeyTypes.pk;

    const {id: containerId, mxCell: containerMxCell} = this._addMxCell('',
      isPk ? ErdPkRowContainer : ErdRowContainer,
      parent,
      {vertex: '1'});

    containerMxCell.ele('mxGeometry', {y: '30', width: this.width, height: rowHeight, as: 'geometry'});

    if (fieldType !== KeyTypes.none) {
      const nameMatches = /^(.+?)\s/gmi.exec(value);

      if (nameMatches) {
        this.relationalIds.push({name: nameMatches[1], id: containerId});
      }
    }

    const {mxCell: keyMxCell} = this._addMxCell(key, buildFontStyle(true), containerId, {vertex: '1'});
    keyMxCell
      .ele('mxGeometry', {width: keyWidth, height: rowHeight, as: 'geometry'})
      .ele('mxRectangle', {width: keyWidth, height: rowHeight, as: 'alternateBounds'});

    const {mxCell: valueMxCell} = this._addMxCell(value, buildFontStyle(isPk, isPk), containerId, {vertex: '1'});
    valueMxCell
      .ele('mxGeometry', {width: fieldWidth, height: rowHeight, as: 'geometry'})
      .ele('mxRectangle', {width: fieldWidth, height: rowHeight, as: 'alternateBounds'});
  }
}
