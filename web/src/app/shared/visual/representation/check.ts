import { ASKS, COMMITMENTS, INFERRED_ONLY, PREDICATES, Representation } from './contract';

/**
 * S12 Representation: is a representation well formed (Stage 3, M1)? Every problem, in words; an
 * empty list means the engine may take it. This checks form only: what a representation means is the
 * application's mapping, reviewed by its domain experts.
 */
export function representationProblems(rep: Representation): string[] {
  const out: string[] = [];
  const at = (where: string) => `${rep.id} ${where}`;
  if (rep.v !== 1) out.push(at(`has contract version ${String(rep.v)}; this engine reads 1`));

  const elementIds = rep.elements.map((e) => e.id);
  const statementIds = rep.statements.map((s) => s.id);
  for (const id of new Set(elementIds)) if (elementIds.filter((x) => x === id).length > 1) out.push(at(`element '${id}' is declared more than once`));
  for (const id of new Set(statementIds)) if (statementIds.filter((x) => x === id).length > 1) out.push(at(`statement '${id}' is declared more than once`));
  for (const id of elementIds) if (statementIds.includes(id)) out.push(at(`'${id}' is both an element and a statement`));
  if (rep.elements.filter((e) => e.own).length > 1) out.push(at('has more than one own presence'));

  const isElement = (id: unknown) => typeof id === 'string' && elementIds.includes(id);
  const isStatement = (id: unknown) => typeof id === 'string' && statementIds.includes(id);
  const phases = rep.time.phases;

  for (const s of rep.statements) {
    const where = `statement '${s.id}'`;
    if (!COMMITMENTS.includes(s.commitment)) out.push(at(`${where} has an unknown commitment '${String(s.commitment)}'`));
    const shape = PREDICATES[s.say.p];
    if (!shape) {
      out.push(at(`${where} has an unknown predicate '${String(s.say.p)}'`));
      continue;
    }
    if (INFERRED_ONLY.includes(s.say.p) && s.commitment !== 'inferred') out.push(at(`${where}: '${s.say.p}' may only be inferred`));
    const args = s.say as unknown as Record<string, unknown>;
    for (const name of Object.keys(args)) if (name !== 'p' && !(name in shape)) out.push(at(`${where}: '${s.say.p}' has no argument '${name}'`));
    for (const [name, kind] of Object.entries(shape)) {
      const v = args[name];
      const bad = (what: string) => out.push(at(`${where}: ${s.say.p}.${name} ${what}`));
      switch (kind) {
        case 'element':
          if (!isElement(v)) bad(`must name an element (has '${String(v)}')`);
          break;
        case 'element?':
          if (v !== undefined && !isElement(v)) bad(`must name an element when given (has '${String(v)}')`);
          break;
        case 'ref':
          if (!isElement(v) && !isStatement(v)) bad(`must name an element or a statement (has '${String(v)}')`);
          break;
        case 'statement':
          if (!isStatement(v)) bad(`must name a statement (has '${String(v)}')`);
          break;
        case 'place':
        case 'word':
          if (typeof v !== 'string' || !v.trim()) bad('must be a word');
          break;
        case 'elements':
          if (!Array.isArray(v) || !v.length || !v.every(isElement)) bad('must list elements');
          break;
        case 'options':
          if (!Array.isArray(v) || v.length < 2 || !v.every((o) => typeof o === 'string' && o)) bad('must list two or more option keys');
          break;
        case 'number':
          if (typeof v !== 'number' || !Number.isFinite(v)) bad('must be a number');
          break;
        case 'boolean':
          if (typeof v !== 'boolean') bad('must be true or false');
          break;
        case 'boolean?':
          if (v !== undefined && typeof v !== 'boolean') bad('must be true or false when given');
          break;
        case 'asks':
          if (!ASKS.includes(v as never)) bad(`must be one of ${ASKS.join(', ')}`);
          break;
        case 'origin':
          if (!['person', 'content', 'source'].includes(v as string)) bad('must be person, content or source');
          break;
        case 'reaction':
          if (!['laughter', 'none'].includes(v as string)) bad('must be laughter or none');
          break;
      }
    }
    if (s.say.p === 'feels' && (s.say.charge < 0 || s.say.charge > 1)) out.push(at(`${where}: feels.charge must be between 0 and 1`));
    if (s.say.p === 'alternatives') {
      const q = rep.statements.find((x) => x.id === (s.say as { question: string }).question);
      if (q && q.say.p !== 'question') out.push(at(`${where}: alternatives.question must name a question`));
      if (s.commitment !== 'possible') out.push(at(`${where}: a set of possibilities is held as possible`));
    }
    if (s.say.p === 'question' && s.commitment !== 'unknown') out.push(at(`${where}: a question is held as unknown`));
    for (const ph of s.phases ?? []) if (!phases.includes(ph)) out.push(at(`${where}: phase '${ph}' isn't among the time phases`));
  }

  const f = rep.facets;
  if (f.field && !isElement(f.field.source) && !isStatement(f.field.source)) out.push(at(`facets.field.source must name an element or a statement (has '${f.field.source}')`));
  if (f.space && !f.space.viewpoints.length) out.push(at('facets.space needs at least one viewpoint'));
  if (f.metaphor) {
    for (const st of f.metaphor.stations) if (!isElement(st)) out.push(at(`facets.metaphor.stations: '${st}' isn't an element`));
    if (f.metaphor.gate !== undefined && !isElement(f.metaphor.gate)) out.push(at(`facets.metaphor.gate: '${f.metaphor.gate}' isn't an element`));
  }
  return out;
}
