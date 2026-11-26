// STUDY CODE, Track A (TRACK-A: AI-generated, development only, not validated). Builds the Gemini
// provider for the run script: the only place the SDK is imported. The key is read from
// GEMINI_API_KEY only, here, and is never logged, printed or written; it goes into the client and
// into the list of strings the runner redacts.
import { GoogleGenAI } from '@google/genai';
import type { Provider } from '../../../src/app/pages/lab/interpret/provider';
import { geminiClientOptions, geminiKey, geminiProvider } from '../../../src/app/pages/lab/interpret/providers/gemini';
import type { GeminiClient } from '../../../src/app/pages/lab/interpret/providers/gemini';

export function makeProvider(model: string, env: Readonly<Record<string, string | undefined>>, timeoutMs: number): { provider: Provider; secrets: string[] } {
  const key = geminiKey(env);
  const client = new GoogleGenAI(geminiClientOptions(key, timeoutMs) as never) as unknown as GeminiClient;
  return { provider: geminiProvider(client, model), secrets: [key, env['GOOGLE_API_KEY'] ?? ''].filter(Boolean) };
}
