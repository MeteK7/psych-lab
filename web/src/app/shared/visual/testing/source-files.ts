/**
 * Reads project files in unit tests: the contrast checks parse tokens.css, and the dependency-rule
 * spec reads imports. Vitest runs in Node; the module name is built at run time so the app's
 * TypeScript setup needs no Node types. Never imported by the app.
 */
interface NodeFs {
  readFileSync(path: string, encoding: 'utf8'): string;
  readdirSync(path: string, options: { recursive: true }): string[];
}

const nodeFs = (): Promise<NodeFs> => import(/* @vite-ignore */ ['node', 'fs'].join(':'));
const cwd = () => (globalThis as unknown as { process: { cwd(): string } }).process.cwd().replace(/\\/g, '/');

/** A file's text, from a path relative to the web project. */
export async function readSource(path: string): Promise<string> {
  return (await nodeFs()).readFileSync(`${cwd()}/${path}`, 'utf8');
}

/** Every file under a folder, as paths relative to the web project with forward slashes. */
export async function listSources(folder: string): Promise<string[]> {
  const fs = await nodeFs();
  return fs.readdirSync(`${cwd()}/${folder}`, { recursive: true }).map((p) => `${folder}/${p.replace(/\\/g, '/')}`);
}
