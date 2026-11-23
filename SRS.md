# Software Requirements Specification (SRS)

**BUBLIKI — Cinema Web Application**

**Project authors:** Daniil Janot, Richard Džikia, Mihhail Burov and Valeria Motorenko

**Version:** 1.0 · 23 November 2026

## 1. Introduction

### 1.1 Purpose

This specification defines what the BUBLIKI student cinema application must do and how the team will verify it before the demo release.

### 1.2 Scope

BUBLIKI lets visitors find films, browse upcoming screenings, choose seats and ticket categories, complete a simulated purchase, and print their tickets. Account holders can sign in and manage profile data through the account API. Project maintainers manage the demo schedule with repository scripts and SQL. Real payments, shared seat inventory, cross-device ticket history, and a cinema staff web dashboard are outside the demo scope. Your demo ticket starts with a seat choice :)

## 2. General Description

### 2.1 Product Perspective

The Vue 3 and TypeScript client reads the catalogue and schedule from the NestJS API. MariaDB stores movies, halls, sessions and user accounts. Browser local storage holds the checkout draft and completed demo orders.

### 2.2 Product Features

- Movie catalogue with search, genre filters and upcoming screenings.
- Showtimes by date and hall, with language, subtitles and screening format.
- Seat selection, per-seat ticket categories, a timed checkout and printable tickets.
- Account registration, sign-in, profile API and sign-out.
- Demo schedule generation and database maintenance.

### 2.3 User Classes and Characteristics

- **Visitor** browses the catalogue and completes demo checkout in a supported browser.
- **Account holder** signs in and reads or updates their profile.
- **Project maintainer** prepares demo data, refreshes the schedule and checks deployment.

### 2.4 Operating Environment

Local development requires Node.js 24.12 or later, Git, and Docker with Compose. The documented defaults use frontend port 5173, API port 3000 and MariaDB host port 3308. Release acceptance covers desktop Chrome and Firefox plus mobile Safari. Record the tested browser versions with the results.

### 2.5 Design and Implementation Constraints

The release uses the relational schema in `database/` and the setup commands in the [README](README.md). Redis is supplied by the local Compose configuration. Current catalogue and session queries read MariaDB directly. Checkout runs in the same browser and origin that created the draft. Targets in §4 are release acceptance criteria and require verification.

## 3. Functional Requirements

| ID | Area | Requirement |
| --- | --- | --- |
| FR-01 | Movie listings | On catalogue load, display each returned movie with its title, description, genre, duration in minutes, age rating and poster when supplied. A search for part of a title or genre shall match irrespective of letter case. The catalogue shall offer genre filters and an upcoming-screenings view. |
| FR-02 | Showtimes | For the selected film, list only sessions with a start time later than the database clock, in ascending start order. Each entry shall show date, time, hall, spoken language, available subtitles and format. Selecting a date shall show sessions for that date only. A session lookup shall return HTTP 404 when the session has started, does not exist or belongs to another film. |
| FR-03 | Seat selection | For a valid session, show the seat layout and allow the visitor to select and deselect available seats. Disable seats already purchased for that session in the current browser and require at least one seat to continue. |
| FR-04 | Checkout and pricing | Start a 10-minute deadline when the checkout draft is created. Preserve the deadline when the page reloads or the visitor edits seats for the same active session. For every selected seat, allow Adult, Child, Student or Senior and display the sum in EUR. Relative to the seat's Adult price, Child and Senior reduce it by €2 and Student by €1. |
| FR-05 | Demo purchase | Before confirming, verify the session again through the API. With a valid draft, an available session and eligible seats, save one order and clear the draft. If the deadline has elapsed, verification fails or a selected seat has already been purchased in this browser, show an error and save zero orders. |
| FR-06 | Tickets | After confirmation, show the order and one ticket per purchased seat with the film, session date and time, hall, seat and category. Provide a print action. My Tickets shall list the order after reload in the same browser and origin. |
| FR-07 | Accounts | Allow registration using a valid email and a password at least eight characters long and at most 72 UTF-8 bytes, reject a duplicate email and allow sign-in with valid credentials. An authenticated user shall be able to read their own profile and update name, date of birth and language through the API. Signed-out requests to read or update the profile shall return HTTP 401. Signing out shall clear the browser's authentication cookie. |
| FR-08 | Schedule maintenance | The schedule refresh command shall generate demo screenings for the 30 days beginning tomorrow, preserve existing sessions and avoid duplicate or overlapping screenings in the same hall. Running it again on the same day with unchanged inputs shall add zero duplicate screenings. |

## 4. Non-Functional Requirements

| ID | Area | Release acceptance criterion |
| --- | --- | --- |
| NFR-01 | Performance | On the documented local stack with seeded data, at least 95% of 50 sequential requests to each of the catalogue and session-list endpoints shall complete in 500 ms or less after five warm-up requests per endpoint. |
| NFR-02 | Security | Account passwords shall be stored as bcrypt hashes and omitted from API responses. The authentication cookie shall have the HttpOnly attribute and, on a shared HTTPS deployment, the Secure attribute. A validly formatted sign-in request with an unknown email or incorrect password shall return HTTP 401 without issuing a cookie. |
| NFR-03 | Usability | At viewport widths of 390 and 1280 CSS pixels, the catalogue-to-ticket flow shall be operable without horizontal scrolling of the page. A keyboard-only user shall be able to select a session and seat, choose a category and confirm a demo order with visible focus throughout. |
| NFR-04 | Reliability | A saved order shall remain visible after refreshing and after closing and reopening the same browser with site storage intact. During an API failure at confirmation, the UI shall show a recoverable error and the order count shall stay unchanged. |
| NFR-05 | Scalability | With 10 parallel clients each requesting the seeded catalogue and one film's session list five times, all 100 responses shall succeed and at least 95% shall complete within 1 second on the documented local stack. |
| NFR-06 | Privacy and compliance | Use synthetic account information for classroom acceptance. Before collecting real user data, publish a privacy notice describing purposes, legal bases, retention and a contact point. Before release with real data, demonstrate that a test user can request access, correction and erasure, record the outcome within one month and document any applicable exception. See [GDPR Articles 12–17](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng). |
| NFR-07 | Payment safety | Every checkout shall display a demo notice before confirmation. Checkout shall have zero payment-card fields, contact zero payment providers and charge zero money. |

## 5. System Models

### 5.1 Use Case Diagram

~~~mermaid
flowchart LR
    visitor[Visitor]
    account[Account holder]
    maintainer[Project maintainer]
    subgraph BUBLIKI
        browse([Browse films and showtimes])
        seats([Choose seats and categories])
        buy([Confirm demo purchase])
        tickets([View and print tickets])
        profile([Sign in and manage profile])
        schedule([Refresh demo schedule])
    end
    visitor --> browse & seats & buy & tickets
    account --> profile
    maintainer --> schedule
~~~

### 5.2 Sequence Diagrams

**Demo purchase**

~~~mermaid
sequenceDiagram
    actor V as Visitor
    participant UI as Vue client
    participant API as NestJS API
    participant DB as MariaDB
    participant LS as Browser storage
    V->>UI: Select session and seats
    UI->>LS: Save draft and deadline
    V->>UI: Confirm demo purchase
    UI->>API: Verify selected session
    API->>DB: Look up future session for film
    DB-->>API: Session or no matching row
    API-->>UI: Session or error
    alt Session valid, deadline active and seats available locally
        UI->>LS: Save order and clear draft
        UI-->>V: Show printable tickets
    else Validation fails
        UI-->>V: Show error
    end
~~~

**Schedule maintenance**

~~~mermaid
sequenceDiagram
    actor M as Maintainer
    participant S as Schedule refresh script
    participant DB as MariaDB
    M->>S: Run db:refresh-sessions
    S->>DB: Read movies, halls and existing sessions
    DB-->>S: Current scheduling data
    S->>S: Generate eligible slots for the next 30 demo days
    S->>DB: Insert eligible sessions
    S-->>M: Report refresh result
~~~

### 5.3 Data Flow Diagram

~~~mermaid
flowchart LR
    V[Visitor] -->|Movie, session and seat choices| UI[Vue client]
    UI -->|Catalogue and session requests| API[NestJS API]
    API -->|Catalogue and schedule queries| DB[(MariaDB)]
    DB -->|Movie and session data| API
    API -->|Catalogue and showtime JSON| UI
    UI -->|Draft and orders| LS[(Browser local storage)]
    LS -->|Draft and saved tickets| UI
    UI -->|Showtimes and tickets| V
    M[Maintainer] -->|Run schedule refresh| S[Project script]
    S -->|Schedule updates| DB
~~~

## 6. External Interface Requirements

### 6.1 User Interfaces

Provide catalogue, booking, payment, ticket, ticket history, registration and sign-in screens. The booking screen shall identify the selected hall and session. The payment screen shall show the countdown, categories and total before confirmation. Maintainers use the command line for schedule updates.

### 6.2 Hardware Interfaces

Support standard keyboard, pointer and touch input through the browser. Ticket printing shall use the browser print dialog with an available printer or PDF output.

### 6.3 Software Interfaces

- Movie API uses `GET /api/movies`, `GET /api/movies/:id`, `GET /api/movies/:id/sessions` and `GET /api/movies/:id/sessions/:sessionId`.
- Account API uses `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `PUT /api/auth/profile` and `POST /api/auth/logout`.
- MariaDB provides persistent catalogue, schedule and account data. Browser local storage provides draft and ticket persistence.

### 6.4 Communication Interfaces

Exchange API requests and responses over HTTP with JSON. Local development uses localhost HTTP and the frontend's API proxy. Shared deployments shall serve browser and API traffic over HTTPS.

## 7. Testing and Validation

### 7.1 Test Cases

Use a disposable test database, a clean browser profile, synthetic accounts and future sessions. For deadline tests, control the browser clock or use an expired draft fixture. For load tests, report the host specifications, build and seed size.

| Test | Requirements | Procedure and expected result |
| --- | --- | --- |
| TC-01 | FR-01, FR-02 | Seed two films in different genres plus past and future sessions. Check card fields, mixed-case title and genre search, filter results, date filtering and chronological showtimes. Request past, unknown and wrong-film session IDs and expect 404 for each. |
| TC-02 | FR-03, FR-04 | Select and deselect seats, verify checkout requires a seat, and verify a previously purchased seat is disabled. Cycle all four categories, compare the price and total with FR-04, then edit seats and reload. Verify the original deadline is retained. |
| TC-03 | FR-05, FR-06, NFR-04, NFR-07 | Complete a valid order, inspect the tickets and print preview, and reopen the browser to check My Tickets. Repeat with an expired draft, a started session, a locally purchased seat and an unavailable API. Each failed attempt shall show an error and leave the order count unchanged. Inspect fields and browser network traffic during checkout for payment safety. |
| TC-04 | FR-07, NFR-02 | Register a test account, retry the same email, test invalid and valid passwords, inspect the stored hash and cookie attributes, and update and read back the profile. After logout verify the cookie is cleared and both profile operations return 401. |
| TC-05 | FR-08 | Save the original schedule, run the refresh twice on the same day, and compare the records. Check the new dates, preservation of original rows, and zero duplicate or overlapping hall bookings. |
| TC-06 | NFR-01, NFR-05 | Run the sequential and parallel request workloads in §4. Record latency percentiles and response counts and compare with both thresholds. |
| TC-07 | NFR-03 | Complete a demo order at 390 and 1280 CSS pixels. Check page overflow and repeat with keyboard only. Run browser smoke checks in desktop Chrome and Firefox and mobile Safari. |
| TC-08 | NFR-06 | Confirm classroom testing uses synthetic records. For a deployment with real data, review the published notice and exercise access, correction and erasure on a synthetic account before opening registration. |

### 7.2 Validation Criteria

Before accepting the demo release, run TC-01 through TC-08 for the applicable deployment and record the commit, environment, expected and actual results, and pass/fail status. Mark the real-data checks in TC-08 as not applicable for a synthetic-only demo. Acceptance requires all applicable checks to pass. Retest each failed case after the fix and retain its evidence.

## 8. Maintenance and Support

### 8.1 Maintenance Procedures

Use the [README](README.md) for setup, updates and schema changes. Back up the database before applying schema changes and verify that the backup can be restored. Check the catalogue and a future session after each update. Refresh demo sessions when the schedule needs future dates, then run TC-05 against a disposable database when the refresh logic changes.

### 8.2 Support and Helpdesk

Record defects in [GitHub Issues](https://github.com/klaccdeduska/kino_project/issues) with the affected requirement ID, browser, commit, reproduction steps, and expected and actual behaviour. Keep passwords, cookies and personal data out of public reports.

## 9. Appendices

### 9.1 Glossary

| Term | Meaning |
| --- | --- |
| SRS | Software Requirements Specification |
| GDPR | General Data Protection Regulation |
| Screening / session | A scheduled showing of a film in a specific hall at a specific time. |
| Checkout draft | The selected seats and categories together with their session and expiration time. |
| Demo order | A browser-local ticket record created by a simulated purchase. |
| FR / NFR / TC | Functional requirement, non-functional requirement and test case. |

### 9.2 Revision History

| Version | Date | Changes |
| --- | --- | --- |
| 1.0 | 2026-11-23 | Initial specification for the BUBLIKI demo release. |
