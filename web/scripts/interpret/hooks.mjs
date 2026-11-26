// STUDY CODE, Track A (TRACK-A: AI-generated, development only, not validated). Lets Node run the
// Lab's TypeScript modules as they are: the app imports without file extensions, so a relative import
// that doesn't resolve is tried again with `.ts`. Node strips the types itself; nothing is compiled.
export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (error) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      for (const ext of ['.ts', '/index.ts']) {
        try {
          return await next(specifier + ext, context);
        } catch {
          // try the next form
        }
      }
    }
    throw error;
  }
}
