import { Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VISUAL_SOURCE, Visual, VisualRequest, VisualSource, resolveWithin } from './visual';
import { VisualSlot } from './visual-slot';

@Component({ selector: 'app-test-picture', template: `<p class="picture">{{ word() }}</p>` })
class TestPicture {
  readonly word = input('');
}

const REQUEST: VisualRequest = { scene: 'test.scene' };

function sourceOf(resolve: VisualSource['resolve']): VisualSource {
  return { id: 'test.v1', resolve };
}

async function render(source: VisualSource | null): Promise<ComponentFixture<VisualSlot>> {
  TestBed.configureTestingModule({
    imports: [VisualSlot],
    providers: source ? [{ provide: VISUAL_SOURCE, useValue: source }] : [],
  });
  const fixture = TestBed.createComponent(VisualSlot);
  fixture.componentRef.setInput('request', REQUEST);
  await fixture.whenStable();
  await new Promise((resolve) => setTimeout(resolve));
  await fixture.whenStable();
  return fixture;
}

const root = (fixture: ComponentFixture<VisualSlot>) => fixture.nativeElement as HTMLElement;

describe('resolveWithin', () => {
  it('gives the source its result', async () => {
    const visual: Visual = { kind: 'image', src: 'a.png', alt: 'A', width: 1, height: 1 };
    await expect(resolveWithin(sourceOf(async () => visual), REQUEST, 50)).resolves.toBe(visual);
  });

  it('shows nothing with no source', async () => {
    await expect(resolveWithin(null, REQUEST, 50)).resolves.toEqual({ kind: 'none' });
  });

  it('shows nothing when the source fails, however it fails', async () => {
    const rejecting = sourceOf(() => Promise.reject(new Error('down')));
    const throwing = sourceOf(() => {
      throw new Error('down');
    });
    await expect(resolveWithin(rejecting, REQUEST, 50)).resolves.toEqual({ kind: 'none' });
    await expect(resolveWithin(throwing, REQUEST, 50)).resolves.toEqual({ kind: 'none' });
  });

  it('shows nothing when the source is too slow', async () => {
    const never = sourceOf(() => new Promise(() => undefined));
    await expect(resolveWithin(never, REQUEST, 5)).resolves.toEqual({ kind: 'none' });
  });
});

describe('VisualSlot', () => {
  it('renders a component with its text alternative', async () => {
    const fixture = await render(
      sourceOf(async () => ({ kind: 'component', component: TestPicture, inputs: { word: 'path' }, alt: 'A path.' })),
    );
    expect(root(fixture).querySelector('.picture')?.textContent).toBe('path');
    expect(root(fixture).querySelector('figure')?.getAttribute('aria-label')).toBe('A path.');
  });

  it('renders an image, with a dark version when there is one', async () => {
    const fixture = await render(
      sourceOf(async () => ({ kind: 'image', src: 'a.png', srcDark: 'b.png', alt: 'A path.', width: 480, height: 170 })),
    );
    const img = root(fixture).querySelector('img');
    expect(img?.getAttribute('src')).toBe('a.png');
    expect(img?.getAttribute('alt')).toBe('A path.');
    expect(root(fixture).querySelector('source')?.getAttribute('srcset')).toBe('b.png');
  });

  it('renders nothing and keeps no space for "none"', async () => {
    const fixture = await render(sourceOf(async () => ({ kind: 'none' })));
    expect(root(fixture).querySelector('figure')).toBeNull();
    expect(root(fixture).querySelector('.waiting')).toBeNull();
  });

  it('renders nothing with no source bound', async () => {
    const fixture = await render(null);
    expect(root(fixture).querySelector('figure')).toBeNull();
  });

  it('holds its space while waiting', async () => {
    const fixture = await render(sourceOf(() => new Promise(() => undefined)));
    expect(root(fixture).querySelector('.waiting')).not.toBeNull();
    expect(root(fixture).querySelector('figure')).toBeNull();
  });
});
