import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CsCard } from '../../../content';
import { CardPick } from './card-pick';

const CARDS: CsCard[] = [
  { id: 'a', text: 'Card A' },
  { id: 'b', text: 'Card B' },
];

async function render(cards: CsCard[] = CARDS): Promise<ComponentFixture<CardPick>> {
  TestBed.configureTestingModule({ imports: [CardPick] });
  const fixture = TestBed.createComponent(CardPick);
  fixture.componentRef.setInput('legend', 'Pick one, or write your own:');
  fixture.componentRef.setInput('cards', cards);
  fixture.componentRef.setInput('ownChoice', 'My own');
  fixture.componentRef.setInput('ownLabel', 'Write it');
  await fixture.whenStable();
  return fixture;
}

const el = (f: ComponentFixture<CardPick>) => f.nativeElement as HTMLElement;
const field = (f: ComponentFixture<CardPick>) => el(f).querySelector<HTMLInputElement>('.own input');

async function choose(f: ComponentFixture<CardPick>, value: string): Promise<void> {
  el(f).querySelector<HTMLInputElement>(`input[type="radio"][value="${value}"]`)!.click();
  await f.whenStable();
}

async function write(f: ComponentFixture<CardPick>, text: string): Promise<void> {
  field(f)!.value = text;
  field(f)!.dispatchEvent(new Event('input'));
  await f.whenStable();
}

describe('CardPick', () => {
  it('offers "my own" as the last option, and opens the field only when it is chosen', async () => {
    const f = await render();
    const radios = Array.from(el(f).querySelectorAll<HTMLInputElement>('input[type="radio"]'));
    expect(radios.map((r) => r.value)).toEqual(['a', 'b', 'own']);
    expect(new Set(radios.map((r) => r.name)).size).toBe(1); // one group
    expect(field(f)).toBeNull();

    await choose(f, 'own');
    expect(el(f).querySelector('.own span')?.textContent).toBe('Write it');
    expect(f.componentInstance.value()).toBeNull(); // nothing written yet
    await write(f, 'Mine');
    expect(f.componentInstance.value()).toEqual({ id: 'own', text: 'Mine' });
  });

  it('keeps the written text when switching to a card and back', async () => {
    const f = await render();
    await choose(f, 'own');
    await write(f, 'Mine');
    await choose(f, 'b');
    expect(f.componentInstance.value()).toEqual({ id: 'b', text: 'Card B' });
    expect(field(f)).toBeNull();

    await choose(f, 'own');
    expect(field(f)!.value).toBe('Mine');
    expect(f.componentInstance.value()).toEqual({ id: 'own', text: 'Mine' });
  });

  it('starts afresh when the parent clears the choice or the cards change', async () => {
    const f = await render();
    await choose(f, 'own');
    await write(f, 'Mine');
    f.componentRef.setInput('value', null);
    await f.whenStable();
    expect(field(f)).toBeNull();
    await choose(f, 'own');
    expect(field(f)!.value).toBe('');

    f.componentRef.setInput('cards', [{ id: 'c', text: 'Card C' }]);
    await f.whenStable();
    expect(field(f)).toBeNull();
    expect(el(f).querySelector<HTMLInputElement>('input[value="own"]')!.checked).toBe(false);
  });

  it('shows just the field when there are no cards to pick from', async () => {
    const f = await render([]);
    expect(el(f).querySelectorAll('input[type="radio"]')).toHaveLength(0);
    await write(f, 'Mine');
    expect(f.componentInstance.value()).toEqual({ id: 'own', text: 'Mine' });
  });
});
