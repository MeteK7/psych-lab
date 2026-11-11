import { Injectable } from '@angular/core';

/**
 * Leaves the page with a full load, so nothing from the visit stays in memory (M1, "Done"). It
 * replaces the visit in the tab's history, so Back can't return to it (needed in the booth, and
 * harmless elsewhere: the exercise would start afresh anyway).
 * A service, so tests can see where it would go without leaving the test page.
 */
@Injectable({ providedIn: 'root' })
export class PageExit {
  home(): void {
    location.replace('/');
  }

  /** Saves text as a file, built in the browser; nothing is sent anywhere. */
  download(fileName: string, text: string): void {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }
}
