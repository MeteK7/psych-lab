import type { ImageProvider } from '../../src/app/shared/visual/assets/generate';

// The local test provider (Visual System M7 stage C): not an AI, and nothing on a network. It gives
// back one fixed, hand-written picture whatever the brief, so the generation path can be run and
// tested end to end without choosing a real provider. Its drafts say so in their record.

const picture = (line: string, mark: string, fill: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 120" width="480" height="120" fill="none" stroke-linecap="round">
  <path d="M40 84 H440" stroke="${line}" stroke-width="2" vector-effect="non-scaling-stroke"/>
  <circle cx="320" cy="50" r="18" fill="${fill}" stroke="${mark}" stroke-width="2.5" vector-effect="non-scaling-stroke"/>
  <path d="M40 84 C160 84 220 50 302 50" stroke="${mark}" stroke-width="2.5" stroke-dasharray="7 7" vector-effect="non-scaling-stroke"/>
</svg>
`;

export const LOCAL_TEST_PROVIDER: ImageProvider = {
  id: 'local-test',
  licence: 'Project-owned',
  async generate() {
    const bytes = (text: string) => new TextEncoder().encode(text);
    return [{ format: 'svg', width: 480, height: 120, light: bytes(picture('#82868e', '#3766c7', '#e4edff')), dark: bytes(picture('#a1a5ab', '#a0c1ff', '#1d3c7c')) }];
  },
};
