import type { StylePack } from './shared/visual/start';

/**
 * This application's style pack (Stage 3, M0): the platform's five area themes, their versions and
 * colour ramps, and the words its reviewers read for each purpose kind. It belongs to the
 * application, not the engine: another application brings its own pack.
 *
 * The values are exactly those the engine's `tokens.css` held before M0, step for step, so nothing
 * drawn changes. A change to a ramp bumps that theme's version, which is recorded with every
 * shown visual (`theme:<id>@<version>`).
 */
export const PLATFORM_PACK: StylePack = {
  id: 'platform.areas',
  themes: {
    action: {
      version: 1,
      ramp: { '050': '#f3f7ff', '100': '#e4edff', '200': '#c8dbff', '300': '#a0c1ff', '400': '#76a3fa', '600': '#3766c7', '700': '#274fa4', '800': '#1d3c7c', '900': '#152953', '950': '#0f1d39' },
    },
    // Cognitive shifts, version 2 (2026-11-16): a calm, soft blue instead of violet, at about hue 210,
    // lighter and less saturated than Action's blue and bluer than Attention's grey teal.
    cognitive: {
      version: 2,
      ramp: { '050': '#f4f8fc', '100': '#e6eff8', '200': '#cddff0', '300': '#a9c7e4', '400': '#84abd2', '600': '#4a78a8', '700': '#3a6190', '800': '#2d4b6f', '900': '#20354f', '950': '#172638' },
    },
    attention: {
      version: 1,
      ramp: { '050': '#f2f8fb', '100': '#e4eff4', '200': '#cbdee8', '300': '#a9c6d5', '400': '#84abbf', '600': '#457388', '700': '#345b6e', '800': '#264452', '900': '#1b2e37', '950': '#132026' },
    },
    regulation: {
      version: 1,
      ramp: { '050': '#effaf7', '100': '#def2ed', '200': '#c0e4db', '300': '#96cfc1', '400': '#65b6a5', '600': '#007e6c', '700': '#006455', '800': '#004b40', '900': '#05332b', '950': '#07241e' },
    },
    recovery: {
      version: 1,
      ramp: { '050': '#fef5ed', '100': '#f9eadb', '200': '#f1d6ba', '300': '#e1b88d', '400': '#cf985b', '600': '#975d00', '700': '#784900', '800': '#5b3600', '900': '#3f2503', '950': '#2b1a05' },
    },
  },
  purposes: {
    concept: 'Communicates a psychological concept',
    understanding: 'Helps understand information or relationships',
    interaction: 'Supports an interaction',
    feedback: 'Gives feedback about a change of state',
    identity: 'Establishes visual identity without compromising clarity',
  },
};
