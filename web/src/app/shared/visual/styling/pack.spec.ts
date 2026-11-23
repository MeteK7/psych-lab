import { PLATFORM_PACK } from '../../../visual-pack';
import { composeScene, lookupOf } from '../composition/compose';
import { validateScene } from '../composition/validate';
import { CAUSE_MAP } from '../instruments/cause-map/cause-map';
import { GUIDE_DAYS } from '../instruments/guide-days/guide-days';
import { ROOM } from '../instruments/camera-room/room';
import { ROUNDS } from '../instruments/rounds/rounds';
import { TRACKING } from '../instruments/tracking/tracking';
import { instrumentSourceId } from '../integration/instruments';
import { sceneVisual } from '../integration/scene-visual';
import { applyStylePack } from '../integration/style-pack';
import { SCENES } from '../scenes';
import type { Composed } from '../composition/compose';
import { StylePack, activeStylePack, knownTheme, purposeLabel, stylePackCss, stylePackProblems, themeIds, themeVersion } from './pack';

/** Stage 3, M0: themes, ramps and purpose words come from the application's style pack. */
describe('style pack (Stage 3, M0)', () => {
  afterEach(() => applyStylePack(PLATFORM_PACK));

  it('records exactly the provenance it recorded before M0, for every scene and instrument', () => {
    const scenes = SCENES.map(({ scene }) => sceneVisual(scene.id, '-', { scene: 'none' }).id);
    const instruments = [ROOM, CAUSE_MAP, GUIDE_DAYS, ROUNDS, TRACKING].map((i) => instrumentSourceId({ scene: { id: i.id, version: i.version, theme: i.theme } } as Composed));
    // Captured from the code before M0 (THEMES in styling/vocabulary.ts); they are recorded with sessions.
    expect([...scenes, ...instruments]).toEqual([
      'scene:mcii.path@4;theme:action@1',
      'scene:card.other-readings@1;theme:cognitive@2',
      'scene:card.why-it-happened@1;theme:cognitive@2',
      'scene:card.not-enough@1;theme:cognitive@2',
      'scene:card.camera-angle@1;theme:cognitive@2',
      'scene:card.first-step@1;theme:action@1',
      'scene:card.goal@1;theme:action@1',
      'scene:card.picture-dot@1;theme:action@1',
      'scene:card.dot-plan@1;theme:action@1',
      'scene:card.wish@1;theme:action@1',
      'instrument:camera-angle.room@3;theme:cognitive@2',
      'instrument:cs2.cause-map@1;theme:cognitive@2',
      'instrument:reference.guide.days@1;theme:action@1',
      'instrument:state-reset.rounds@1;theme:action@1',
      'instrument:state-reset.tracking@2;theme:action@1',
    ]);
  });

  it('gives this app’s five themes, at today’s versions, and its purpose words', () => {
    expect(activeStylePack().id).toBe('platform.areas');
    expect(themeIds()).toEqual(['action', 'cognitive', 'attention', 'regulation', 'recovery']);
    expect(themeIds().map(themeVersion)).toEqual([1, 2, 1, 1, 1]);
    expect(purposeLabel('concept')).toBe('Communicates a psychological concept');
    expect(stylePackProblems(PLATFORM_PACK)).toEqual([]);
  });

  it('takes a second application’s pack with no engine change: a new theme draws, validates and gets its ramp', () => {
    const other: StylePack = {
      id: 'another.app',
      themes: {
        tide: { version: 3, ramp: { '050': '#f2f7f9', '100': '#e3eef2', '200': '#c6dde5', '300': '#a1c4d2', '400': '#78a7ba', '600': '#3d6f84', '700': '#2f5868', '800': '#22424e', '900': '#172d35', '950': '#101f25' } },
      },
      purposes: { concept: 'Shows the idea being taught' },
    };
    applyStylePack(other);
    expect(knownTheme('tide')).toBe(true);
    expect(knownTheme('action')).toBe(false);
    expect(themeVersion('tide')).toBe(3);
    expect(purposeLabel('concept')).toBe('Shows the idea being taught');
    // A figure in the new theme passes the validator, which before M0 accepted only the five areas.
    const c = composeScene(
      { id: 'other.figure', version: 1, theme: 'tide', size: { width: 320, height: 200 }, alt: 'A mark.', layers: [{ id: 'l', plane: 'subject', elements: [{ kind: 'shape', id: 'mark', geometry: { type: 'circle', cx: 160, cy: 100, r: 20 }, style: { role: 'subject' }, purpose: { serves: ['concept'], why: 'The idea.' } }] }] },
      {},
    );
    expect(validateScene(c.scene, lookupOf(c))).toEqual([]);
    // Its ramp reaches the page as one rule, on the attribute every figure surface carries.
    expect(stylePackCss(other)).toContain("[data-vis-theme='tide']");
    expect(document.getElementById('vis-style-pack')?.textContent).toContain('--vis-a-600: #3d6f84;');
  });

  it('rejects a malformed pack', () => {
    const bad = { id: 'bad', themes: { 'Not ok': { version: 0, ramp: {} } }, purposes: {} } as unknown as StylePack;
    expect(stylePackProblems(bad).length).toBeGreaterThan(2);
    expect(() => applyStylePack(bad)).toThrow(/Style pack rejected/);
  });
});
