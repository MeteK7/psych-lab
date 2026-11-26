import type { JsonSchema } from './provider';

/**
 * STUDY CODE, Track A (TRACK-A: AI-generated, development only, not validated). Checks a reply
 * against the schema locally, whatever the service enforced: a service may support only part of
 * JSON Schema. Covers the keywords Track A's schemas use: type, properties, required,
 * additionalProperties (false), enum and items.
 */
export function schemaProblems(value: unknown, schema: JsonSchema, at = '$'): string[] {
  const out: string[] = [];
  const type = schema['type'];
  const is = {
    object: typeof value === 'object' && value !== null && !Array.isArray(value),
    array: Array.isArray(value),
    string: typeof value === 'string',
    boolean: typeof value === 'boolean',
    number: typeof value === 'number',
    integer: Number.isInteger(value),
  } as Record<string, boolean>;
  if (typeof type === 'string' && !is[type]) return [`${at}: expected ${type}`];
  const en = schema['enum'];
  if (Array.isArray(en) && !en.includes(value)) out.push(`${at}: '${String(value)}' isn't one of ${en.join(', ')}`);
  if (type === 'object') {
    const obj = value as Record<string, unknown>;
    const props = (schema['properties'] ?? {}) as Record<string, JsonSchema>;
    for (const r of (schema['required'] ?? []) as string[]) if (!(r in obj)) out.push(`${at}: missing '${r}'`);
    for (const [k, v] of Object.entries(obj)) {
      if (props[k]) out.push(...schemaProblems(v, props[k], `${at}.${k}`));
      else if (schema['additionalProperties'] === false) out.push(`${at}: unexpected '${k}'`);
    }
  }
  if (type === 'array' && schema['items']) (value as unknown[]).forEach((v, k) => out.push(...schemaProblems(v, schema['items'] as JsonSchema, `${at}[${k}]`)));
  return out;
}
