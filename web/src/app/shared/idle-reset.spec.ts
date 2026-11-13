import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { IDLE_WARNING_SECONDS, IdleReset } from './idle-reset';
import { PageExit } from './page-exit';

@Component({ imports: [IdleReset], template: `<app-idle-reset [seconds]="60" />` })
class Host {}

describe('IdleReset (booth)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  async function setup() {
    TestBed.configureTestingModule({ imports: [Host] });
    const exit = TestBed.inject(PageExit);
    const home = vi.spyOn(exit, 'home').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(0);
    const root = fixture.nativeElement as HTMLElement;
    return { fixture, home, root };
  }

  it('asks after the idle time, then ends the visit', async () => {
    const { fixture, home, root } = await setup();
    await vi.advanceTimersByTimeAsync(59_000);
    fixture.detectChanges();
    expect(root.textContent).not.toContain('Still there?');
    await vi.advanceTimersByTimeAsync(1_000);
    fixture.detectChanges();
    expect(root.textContent).toContain('Still there?');
    expect(root.textContent).toContain(`ends in ${IDLE_WARNING_SECONDS} seconds`);
    await vi.advanceTimersByTimeAsync(IDLE_WARNING_SECONDS * 1000);
    expect(home).toHaveBeenCalledOnce();
  });

  it('starts again on any input, and on "I\'m still here"', async () => {
    const { fixture, home, root } = await setup();
    await vi.advanceTimersByTimeAsync(50_000);
    document.dispatchEvent(new KeyboardEvent('keydown'));
    await vi.advanceTimersByTimeAsync(50_000);
    fixture.detectChanges();
    expect(root.textContent).not.toContain('Still there?');
    await vi.advanceTimersByTimeAsync(10_000);
    fixture.detectChanges();
    root.querySelector('button')!.click();
    fixture.detectChanges();
    expect(root.textContent).not.toContain('Still there?');
    await vi.advanceTimersByTimeAsync(IDLE_WARNING_SECONDS * 1000);
    expect(home).not.toHaveBeenCalled();
  });
});
