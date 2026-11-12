/**
 * S8 Assets: the manifest (milestone M7, docs/visual-system.md §9). A picture that is a file, not
 * drawn live, has one entry here saying exactly what it is: its files (light and dark) with their
 * size and SHA-256 checksum, its text alternative, where it came from, its licence, and whether
 * it has been reviewed. Only approved assets reach a person (integration/asset-source.ts); drafts
 * show in the Visual Lab alone. Pure data and checks: no Angular, no DOM, no file access (whoever
 * runs the checks reads the files and passes in what it found).
 */

export interface AssetFile {
  /** Under the web project's public folder, served at the same path, e.g. 'visuals/reference/mark-light.svg'. */
  path: string;
  /** The file's size in bytes and its SHA-256 checksum (hex): a changed file is a new version. */
  bytes: number;
  sha256: string;
}

/** Where an asset came from. */
export type AssetOrigin =
  /** Exported from a composition (stage B): exactly which one, so it can be made again. */
  | { kind: 'exported'; composition: string; version: number; theme: string; themeVersion: number; seed?: string }
  /** Made by hand. */
  | { kind: 'authored'; author: string }
  /**
   * Made by a generator outside the app (stage C). The brief is closed vocabulary only: no typed
   * text ever enters one. A generated asset is a draft until a person has reviewed it.
   */
  | { kind: 'generated'; provider: string; brief: Readonly<Record<string, string>>; seed?: string };

export interface AssetEntry {
  id: string;
  /** Bumped on any change to a file; recorded with a shown visual as `asset:<id>@<version>`. */
  version: number;
  /** Both schemes; the same file twice says it reads on both grounds. */
  files: { light: AssetFile; dark: AssetFile };
  /** The size it is shown at, in CSS px. */
  width: number;
  height: number;
  /** The content key of its text alternative. */
  alt: string;
  origin: AssetOrigin;
  licence: string;
  status: 'draft' | 'approved';
  /** Who approved it and when (ISO date); required once approved. */
  review?: { by: string; on: string };
}

/** What was found on disk (or fetched) for a file; null when it isn't there. */
export interface FileFacts {
  bytes: number;
  sha256: string;
}

const ID = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
const WORD = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PATH = /^visuals\/[a-z0-9/._-]+\.(svg|png)$/;

/** The id recorded with a shown visual. */
export function assetVisualId(entry: AssetEntry): string {
  return `asset:${entry.id}@${entry.version}`;
}

/** Every problem with one entry; empty when it's valid. `facts` gives what was found for each file path. */
export function assetProblems(entry: AssetEntry, facts: (path: string) => FileFacts | null, text: (key: string) => string | undefined): string[] {
  const where = `asset '${entry.id}'`;
  const problems: string[] = [];
  if (!ID.test(entry.id)) problems.push(`${where}: an id is lower-case words joined by dots or hyphens`);
  if (!Number.isInteger(entry.version) || entry.version < 1) problems.push(`${where}: a version is a whole number from 1`);
  if (!(entry.width > 0) || !(entry.height > 0)) problems.push(`${where}: it has a size`);
  if (!text(entry.alt)?.trim()) problems.push(`${where}: no content for its text alternative '${entry.alt}'`);
  if (!entry.licence?.trim()) problems.push(`${where}: no licence`);
  for (const [scheme, file] of Object.entries(entry.files)) {
    const at = `${where}, ${scheme} file`;
    if (!PATH.test(file.path)) {
      problems.push(`${at}: a path is under 'visuals/', lower case, ending .svg or .png`);
      continue;
    }
    const found = facts(file.path);
    if (!found) problems.push(`${at}: '${file.path}' isn't there`);
    else {
      if (found.bytes !== file.bytes) problems.push(`${at}: ${found.bytes} bytes, the manifest says ${file.bytes}`);
      if (found.sha256 !== file.sha256) problems.push(`${at}: its checksum isn't the manifest's; a changed file is a new version`);
    }
  }
  const { origin } = entry;
  if (origin.kind === 'exported') {
    if (!origin.composition?.trim() || !(origin.version >= 1) || !origin.theme?.trim() || !(origin.themeVersion >= 1))
      problems.push(`${where}: an exported asset names its composition, theme and their versions`);
  } else if (origin.kind === 'authored') {
    if (!origin.author?.trim()) problems.push(`${where}: an authored asset names its author`);
  } else {
    if (!origin.provider?.trim()) problems.push(`${where}: a generated asset names its provider`);
    const brief = Object.entries(origin.brief ?? {});
    if (!brief.length) problems.push(`${where}: a generated asset keeps its brief`);
    if (brief.some(([k, v]) => !WORD.test(k) || !WORD.test(v))) problems.push(`${where}: a brief holds closed-vocabulary words only, never typed text`);
  }
  if (entry.status === 'approved') {
    if (!entry.review?.by?.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(entry.review?.on ?? '')) problems.push(`${where}: an approved asset says who reviewed it and when`);
  } else if (entry.status !== 'draft') problems.push(`${where}: a status is 'draft' or 'approved'`);
  return problems;
}

/** Every problem with a whole catalogue: each entry's, and ids or files used twice. */
export function catalogueProblems(entries: readonly AssetEntry[], facts: (path: string) => FileFacts | null, text: (key: string) => string | undefined): string[] {
  const problems = entries.flatMap((e) => assetProblems(e, facts, text));
  const ids = new Map<string, number>();
  for (const e of entries) ids.set(e.id, (ids.get(e.id) ?? 0) + 1);
  for (const [id, n] of ids) if (n > 1) problems.push(`asset '${id}': its id is used ${n} times`);
  const owners = new Map<string, string>();
  for (const e of entries)
    for (const path of new Set([e.files.light.path, e.files.dark.path])) {
      const other = owners.get(path);
      if (other && other !== e.id) problems.push(`asset '${e.id}': '${path}' already belongs to '${other}'`);
      owners.set(path, e.id);
    }
  return problems;
}
