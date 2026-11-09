import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Where a link leads that isn't offered here: a development-only exercise, or a page a booth doesn't show. */
@Component({
  selector: 'app-not-available-page',
  imports: [RouterLink],
  template: `
    <h1>Not available here</h1>
    <p>This page or exercise isn't offered here.</p>
    <p><a routerLink="/">Home</a></p>
  `,
})
export class NotAvailablePage {}
