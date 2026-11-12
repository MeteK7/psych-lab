import { AssetEntry } from './manifest';

/**
 * S8 Assets: every asset the platform has (milestone M7), with the words of their text
 * alternatives. An asset used by an exercise is added here once it is approved; until then it is a
 * draft, seen in the Visual Lab only. Checked against the files by a spec (assets/manifest.spec.ts)
 * and, live, by the Lab.
 */
export const ASSETS: readonly AssetEntry[] = [
  {
    // The Lab's reference: it exercises the manifest, the checks and the Lab's view. A draft until reviewed.
    id: 'reference.mark',
    version: 1,
    files: {
      light: { path: 'visuals/reference/mark-light.svg', bytes: 446, sha256: '6f5a5a849a7ab7d5227f64e78ab722ada8f6b80bec21fa7a1b6c221b0e48522e' },
      dark: { path: 'visuals/reference/mark-dark.svg', bytes: 446, sha256: '89883e1eab15842d31908729ab8f8e98bef038208ab211711452107f806110f6' },
    },
    width: 480,
    height: 120,
    alt: 'asset.reference.mark',
    origin: { kind: 'authored', author: 'Hand-written for the Visual Lab, in the Action colours of the visual language' },
    licence: 'Project-owned',
    status: 'draft',
  },
];

const TEXT: Readonly<Record<string, string>> = {
  'asset.reference.mark': 'Reference asset: a mark in the middle of a line between two points',
};

/** The words of the assets' text alternatives, by content key. */
export const assetText = (key: string): string | undefined => TEXT[key];
