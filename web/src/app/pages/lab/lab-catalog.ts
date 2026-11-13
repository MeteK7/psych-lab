import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CATALOG, SECTIONS, Where } from './lab-catalog-data';

/** Goes to a section of the Lab page and puts focus on its heading, so keyboard and screen-reader users land there too. */
function goTo(event: Event, anchor: string): void {
  const heading = document.getElementById(anchor);
  if (!heading) return;
  event.preventDefault();
  heading.tabIndex = -1;
  heading.scrollIntoView({ block: 'start' });
  heading.focus({ preventScroll: true });
}

/** The Lab's contents (milestone M8): every section of the page, and its other page. */
@Component({
  selector: 'app-lab-contents',
  imports: [RouterLink],
  styleUrls: ['./lab.css'],
  styles: `
    nav ul { list-style: none; padding: 0; margin: 0.5rem 0 1rem; display: flex; flex-wrap: wrap; gap: 0.4rem 1.25rem; font-size: 0.95rem; }
    nav a { display: inline-block; padding: 0.2rem 0; }
  `,
  template: `
    <nav aria-label="Lab contents">
      <ul>
        @for (s of sections; track s.label) {
          <li>
            @if (anchorOf(s); as anchor) {
              <a [href]="'lab#' + anchor" (click)="go($event, anchor)">{{ s.label }}</a>
            } @else {
              <a [routerLink]="routeOf(s)">{{ s.label }}</a>
            }
          </li>
        }
      </ul>
    </nav>
  `,
})
export class LabContents {
  protected readonly sections = SECTIONS;
  protected readonly go = goTo;
  protected anchorOf(where: Where): string | null {
    return 'anchor' in where ? where.anchor : null;
  }
  protected routeOf(where: Where): string {
    return 'route' in where ? where.route : '/lab';
  }
}

/**
 * The Lab's catalog (milestone M8, S10): every capability of the Visual System by subsystem, what
 * it is, what it covers by name, the milestone that built it, where the Lab shows it and the tests
 * that cover it. A spec keeps it complete (lab-catalog.spec.ts).
 */
@Component({
  selector: 'app-lab-catalog',
  imports: [RouterLink],
  styleUrls: ['./lab.css'],
  styles: `
    td, th { padding: 0.35rem 0.75rem 0.35rem 0; text-align: left; }
    td.what { min-width: 18rem; }
    .covers { display: block; font-size: 0.85rem; }
    ul.tests { list-style: none; padding: 0; margin: 0; font-size: 0.85rem; }
  `,
  template: `
    <section class="scene" aria-labelledby="lab-catalog">
      <h2 id="lab-catalog">Catalog of capabilities<span class="meta"> · S10 · M8</span></h2>
      <p class="note muted">
        Everything the Visual System can do, by subsystem: where this Lab shows it, and the tests that cover it. A test keeps this
        list complete: a generator, material, effect, frame, theme, scene or instrument that isn't here fails the build's tests.
      </p>
      @for (s of catalog; track s.id) {
        <h3 [id]="'lab-catalog-' + s.id">{{ s.id }} · {{ s.name }}</h3>
        <table [attr.aria-label]="'Capabilities: ' + s.name" [attr.data-catalog]="s.id">
          <thead>
            <tr><th scope="col">Capability</th><th scope="col">What it is</th><th scope="col">Since</th><th scope="col">In the Lab</th><th scope="col">Tests</th></tr>
          </thead>
          <tbody>
            @for (c of s.capabilities; track c.name) {
              <tr>
                <th scope="row">{{ c.name }}</th>
                <td class="what">
                  {{ c.what }}
                  @if (c.covers?.length) { <span class="covers muted">Covers: {{ names(c.covers!) }}</span> }
                </td>
                <td>{{ c.since }}</td>
                <td>
                  @if (anchorOf(c.where); as anchor) {
                    <a [href]="'lab#' + anchor" (click)="go($event, anchor)">{{ c.where.label }}</a>
                  } @else {
                    <a [routerLink]="routeOf(c.where)">{{ c.where.label }}</a>
                  }
                </td>
                <td><ul class="tests">@for (t of c.tests; track t) { <li><code>{{ file(t) }}</code></li> }</ul></td>
              </tr>
            }
          </tbody>
        </table>
      }
    </section>
  `,
})
export class LabCatalog {
  protected readonly catalog = CATALOG;
  protected readonly go = goTo;
  protected anchorOf(where: Where): string | null {
    return 'anchor' in where ? where.anchor : null;
  }
  protected routeOf(where: Where): string {
    return 'route' in where ? where.route : '/lab';
  }
  /** The names a capability covers, without their kind. */
  protected names(covers: readonly string[]): string {
    return covers.map((c) => c.slice(c.indexOf(':') + 1)).join(', ');
  }
  /** A test file's name, without its folders. */
  protected file(path: string): string {
    return path.slice(path.lastIndexOf('/') + 1);
  }
}
