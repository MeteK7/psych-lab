# Product model: three usage models, released one at a time

> **Status:** decisions made 2026-11-01 (plan revision 6.0). This file replaces `usage-models-assessment.md`. The analysis behind it is in that file's git history.
>
> Not legal advice: legal and regulatory points are questions for a qualified adviser in the relevant jurisdiction.

## 1. Product concept
**An adaptive psychological experience platform:** a browser-based platform of purposeful, interactive experiences informed by psychology, cognitive science and behavioural science.
- **Not a therapy service.** It makes no clinical claims, and its claims stay proportional to the evidence (plan §11).
- **Web only.** A booth is a place where the same web app runs, not a separate product.

**Central principle:** a person can have a complete, meaningful experience without committing to return. People who want continuity can build it. People in a professionally managed setting take part under explicit consent and permissions.

**Three usage models** share one experience library and one experience runtime. They differ only in identity, storage, permissions and personalisation:

| | Try it (independent) | Personal | Organisational |
|---|---|---|---|
| Identity | None | Optional account | Account plus organisation membership and roles |
| Continuity | One visit | Across visits | Across visits; professionals see what was granted |
| Stored | Nothing identifiable by default; optional anonymous counts | What the user chooses to keep ("My history") | The same, plus grants and an access log |
| Personalisation | Within the visit only | Rule-based, from history and feedback | Professional configuration of existing experiences |
| Professional involvement | None | None | Only through a grant from the user |

**Rules for all three:**
- No model is a degraded version of another.
- Try it offers, in full, every experience rated safe for unsupervised use.
- Try it is never locked, including during an experiment (§4).
- An account is offered at most once, at the end of a visit, and is never required.
- "Therapy memory" is called **My history**. It is a personal history the user controls, not a clinical record.

**Research participation** (the n-of-1 now, consented studies later) is governed by its protocol, not by a usage model, and never changes what Try it offers.

## 2. Staged go-live
- **Each model is built, integrated and tested on its own.** It goes live once its acceptance criteria and isolation tests pass.
- **Go-live** means merged to `main` and running in local production on this computer (runbook, "Environments").
- **Public hosting is an extra gate for each model,** once a server and domain exist: hosting, TLS, production authentication, a privacy notice, and a data-protection review of the hosted version.
- **Each model starts with its own implementation plan** for approval. Nothing in M1–M3 is built before that.

| Phase | Covers | Depends on | Goes live when |
|---|---|---|---|
| **E: Environments** | Development/production split and guards; production serves the built web app; release procedure; `try` mode; exposure rule (protocol §7) | — | **Done** (revision 6.0); needed before phase-1 day 1 |
| **M1: Try it** | The boundary that decides where a finished result goes (discard, anonymous counts, My history, research record); end-of-visit choices (Done / Take it with you); a storage sentence on each screen; a "safe unsupervised" flag per experience; the booth profile (idle reset, cleanup) | E | §3, M1 criteria pass |
| **M2: Personal** | Optional accounts (sign-in method decided in the M2 plan); owned records; My history (view, export, delete); saving a finished guest visit to an account; rule-based suggestions; the operator's n-of-1 data assigned to an owner | M1 live | §3, M2 criteria pass |
| **M3: Organisational** | Organisations and roles; grants (scope, purpose, expiry, revocation); an append-only access log; professional configuration of existing experiences within declared ranges | M2 live | §3, M3 criteria pass, **and** the expert-testing stage and release gate (§5) are complete |
| **H: Public hosting** (per model) | Server, domain, TLS, production authentication, privacy notice, data-protection review | That model is live locally | Its own gate, decided when hosting exists |

**Research track:** Stages 1–5 and the n-of-1 are unchanged (plan §9).

## 3. Acceptance criteria and isolation tests

**Every model:**
- `scripts/check.ps1` is green on `test-n552vx`.
- Its isolation tests pass.
- It's merged to `main` and passes the production smoke check (runbook).
- It leaves Try it unchanged.

### M1: Try it
- **No account needed:** every experience can be completed with no account and no history. There is no sign-up prompt during a visit.
- **Nothing kept by default:**
  - With the "nothing saved" profile, the database holds no free text from a visit. A test inspects the database to check this.
  - Typed text never leaves the browser unless the user chooses to save it.
- **Visitor leakage test:** after "I'm done" or the idle reset, nothing from visitor 1 remains in the page, browser storage, history or back navigation.
- **Storage sentence:** the sentence on each screen matches what the app actually stores. A test checks this.
- **Accessibility:** a keyboard path for every interaction; an axe scan with no serious violations; reduced motion respected.
- **Safety:** experiences without the "safe unsupervised" flag are not offered in the booth profile. State Reset is excluded until usability shows it is tolerable.
- **Experiment:** in production, Try it runs are stored as `try` and appear in the n-of-1 exposure export.

### M2: Personal
- **Cross-account isolation:**
  - For every read, update and delete route, account B gets **404** (not 403, which would reveal the record exists) for account A's ids.
  - List routes return only the caller's rows.
  - A guest gets 401 on every owned route.
- **Route coverage:** a test lists every API route and fails if a route has no isolation classification (public, guest, owned, organisation).
- **Deletion and export:**
  - Deleting an account removes the user's rows in every table, counted per table.
  - The export contains all of the user's data, and nothing from anyone else.
- **Sign-in security:**
  - session cookies are HttpOnly and SameSite, with CSRF protection on writes
  - sign-in attempts are rate-limited
  - no secrets appear in logs
- **Guest to account:** a finished guest visit saved to an account arrives complete. Nothing is stored before the user chooses to save.
- **n-of-1 data:** assigning the operator's records to an owner leaves the phase export byte-identical (SHA-256 compared before and after).

### M3: Organisational
- **Cross-organisation isolation:**
  - Staff of organisation X can't read organisation Y's users, even with a grant made to someone in X for a different user.
  - An organisation admin can't read client data without a grant.
  - Grant scope is enforced field by field. Free text is excluded unless the scope names it.
  - A revoked or expired grant gives 404 at once.
- **Access log:**
  - Every professional read writes an entry the user can see.
  - The log is append-only: no update or delete route, enforced by database permissions.
- **Configuration:**
  - Parameter changes outside an experience's declared ranges are rejected.
  - Results record the configuration used.
  - Configurations never copy or fork content.
- **Consent:**
  - Grants are created by the user, not the organisation.
  - Revocation is always available to the user.

## 4. Try it and the experiment
Try it stays unrestricted. Three things are kept apart:

| | Governs | Rule |
|---|---|---|
| Product access | Everyone | Try it is always available, including during an experiment |
| Assigned sessions | The experiment slot | The condition is locked to the reveal; analysed as assigned from the reveal (protocol §5–7) |
| Interpretation | The analysis | Try it runs in a session day's exposure window are recorded, classified (clean / extra exposure / contaminated) and handled by two prespecified sensitivity analyses. The primary analysis is unchanged (protocol §7) |

There is no participant instruction and no software restriction. The resulting limitation is stated in protocol §12.

## 5. Organisational model: expert testing and release gate
The organisational model is offered to no real client or patient before both of these are complete.

**Supervised expert-testing stage** (in person until hosting exists):
- Clinics and qualified professionals (e.g. psychologists) test it under supervision: **≥ 3 organisations and ≥ 5 professionals**.
- Only synthetic or consenting test accounts. **No real clients and no clinical data.**
- Written test procedure and findings. Every critical finding is resolved, and the fix is re-tested.

**Release gate:**
- **Legal and regulatory review of the intended use, for each organisation type** (clinics vs coaches, schools or companies):
  - **the medical-device question:** whether professional configuration for clients makes the software a medical device, e.g. under the EU MDR (Rule 11), the US FDA software-as-a-medical-device framework, or the Turkish equivalent
  - health-data law: the GDPR (Art. 9) and KVKK (Law 6698)
  - professional confidentiality
  - controller and processor roles, and data-processing agreements
- **Security review:** a threat model and an independent penetration test.
- **Data-protection review:** a data-protection impact assessment, with retention rules and a lawful basis for each data tier.
- **Go-live covers only the organisation types the review cleared,** with the intended use written down.

## 6. Architecture boundaries
- **One modular monolith** (FastAPI + Angular + PostgreSQL). No microservices.
- **The experience runtime never reads identity.** It emits a finished result, and a sink chosen outside it decides where the result goes.
- **Data tiers** are kept in separate stores, and data never moves from a lower-consent tier to a higher one:
  - **ephemeral:** in the browser only
  - **anonymous counts:** no free text, no persistent device id, coarse time, published only above a minimum count
  - **personal history:** owned by the user
  - **organisational record:** shared through a grant
  - **research record:** under a protocol
- **Ownership:** every owned row will carry `owner_account_id` (added in M2). Every read is filtered by owner in one query layer, which tests check.
- **Configuration:** an experience declares which parameters can change and their allowed ranges. A flow is an ordered list of (experience, content version, overrides).
- **Booth:** a deployment profile of Try it with:
  - anonymous counts only
  - idle reset
  - kiosk browser with a fresh profile per visit
  - only experiences rated safe for unsupervised use
  - a local support line on the start and stop screens

  It is tested first as a staffed pop-up, before any hardware.

## 7. Open decisions
Decided later, in the plan for the relevant phase:
- sign-in method
- hosting provider and region
- consent mode for anonymous counts
- a policy for minors in public places
- booth economics
- AI companion and recommendation algorithms (still deferred, plan §11)
- everything in M3 beyond the gate above
