import { Provider, inject } from '@angular/core';

import { ASSETS, assetText } from '../assets/catalogue';
import { AssetEntry, assetVisualId } from '../assets/manifest';
import { NO_VISUAL, VISUAL_SOURCE, Visual, VisualRequest, VisualSource } from '../visual';
import { SCENE_SOURCE_OVERRIDE } from './scene-source';

/**
 * S9 Integration: answers an exercise's request with an asset from the manifest (milestone M7),
 * through the image contract the slot already draws (light and dark files, the text alternative,
 * the size). One source serves one asset, for one request name; any other request shows nothing.
 *
 * Only an approved asset is served. A draft, or an id the catalogue doesn't have, shows nothing,
 * which the slot already handles. The id recorded with the session says exactly what was served,
 * `asset:<id>@<version>`; while nothing has been served, it names only the asset.
 */
export class AssetSource implements VisualSource {
  private served: string | null = null;

  constructor(
    private readonly assetId: string,
    private readonly request: string,
    private readonly entries: readonly AssetEntry[] = ASSETS,
    private readonly text: (key: string) => string | undefined = assetText,
  ) {}

  get id(): string {
    return this.served ?? `asset:${this.assetId}`;
  }

  async resolve({ scene }: VisualRequest): Promise<Visual> {
    if (scene !== this.request) return NO_VISUAL;
    const entry = this.entries.find((e) => e.id === this.assetId);
    if (!entry || entry.status !== 'approved') return NO_VISUAL;
    this.served = assetVisualId(entry);
    const { light, dark } = entry.files;
    return {
      kind: 'image',
      src: light.path,
      ...(dark.path !== light.path ? { srcDark: dark.path } : {}),
      alt: this.text(entry.alt) ?? '',
      width: entry.width,
      height: entry.height,
    };
  }
}

/** Binds an exercise's visual source to an asset, in its `providers`: `provideAssetVisuals('mcii.path-still', 'mcii.plan')`. */
export function provideAssetVisuals(assetId: string, request: string): Provider {
  return {
    provide: VISUAL_SOURCE,
    useFactory: () => inject(SCENE_SOURCE_OVERRIDE, { optional: true }) ?? new AssetSource(assetId, request),
  };
}
