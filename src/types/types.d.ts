import {XMLBuilder} from 'xmlbuilder2/lib/interfaces';

export interface Database {
  schemas: Schema[];
}

export interface Schema {
  tables: Table[];
  refs: Ref[];
}

export interface Ref {
  name: string;
  endpoints: Endpoint[];
}

export interface Endpoint {
  tableName: string;
  fieldNames: string[];
  relation: string;
}

export interface Table {
  name: string;
  alias: string;
  fields: Field[];
  indexes: any[];
}

export interface Field {
  name: string;
  type: Type;
  pk?: boolean;
  increment?: boolean;
  unique?: boolean,
  not_null?: boolean,
  dbdefault?: DbDefault
}

export interface Type {
  type_name: string;
  args: any[];
}

export interface DbDefault {
  type: string;
  value: any;
}

export interface RelationalId {
  name: string;
  id: string;
}

export interface ShapeBuild {
  xml: XMLBuilder;
  relationalIds: RelationalId[];
  title: string;
}
