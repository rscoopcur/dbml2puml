import {Field, Ref} from 'types/types';
import {KeyTypes} from './erdShape';

export function buildColumnName(field: Field) {
  let name = `${field.name} ${field.type.type_name.toUpperCase()}`;

  const args: string[] = [];

  if (field.pk) {
    args.push('PRIMARY KEY');
  }

  if (field.increment) {
    args.push('AUTO INCREMENT');
  }

  if (field.unique) {
    args.push('UNIQUE');
  }

  if (field.not_null) {
    args.push('NOT NULL');
  }

  if (field.dbdefault) {
    args.push(`DEFAULT = ${field.dbdefault.value}`);
  }

  if (args.length > 0) {
    name += ' [' + args.join(', ') + ']';
  }

  return name;
}

export function getFieldType(field: Field, tableName: string, refs: Ref[], alias: string = '') {
  if (field.pk) {
    return KeyTypes.pk;
  }

  const fieldEndpoint = refs
    .flatMap(ref => ref.endpoints)
    .find(endpoint => endpoint.fieldNames.includes(field.name) && (endpoint.tableName === tableName || endpoint.tableName === alias));

  if (fieldEndpoint && fieldEndpoint.relation === '*') {
    return KeyTypes.fk;
  }

  return KeyTypes.none;
}
