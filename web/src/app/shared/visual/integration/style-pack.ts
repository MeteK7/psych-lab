import { StylePack, registerStylePack, stylePackCss } from '../styling/pack';

/**
 * S9 Integration (Stage 3, M0): makes an application's style pack the one figures use, and puts its
 * ramps on the page as one stylesheet. Every figure surface carries `data-vis-theme`, so its ramp
 * reaches the role mapping in `tokens.css` by the cascade. Called once at start-up (and in test
 * setup); calling it again replaces the pack and its stylesheet.
 */
export function applyStylePack(pack: StylePack, doc: Document | null = typeof document === 'undefined' ? null : document): void {
  registerStylePack(pack);
  if (!doc) return;
  const id = 'vis-style-pack';
  let sheet = doc.getElementById(id) as HTMLStyleElement | null;
  if (!sheet) {
    sheet = doc.createElement('style');
    sheet.id = id;
    doc.head.appendChild(sheet);
  }
  sheet.setAttribute('data-pack', pack.id);
  sheet.textContent = stylePackCss(pack);
}
