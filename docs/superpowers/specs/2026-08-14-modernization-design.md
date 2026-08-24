# Application Modernization Design

## Goal

Replace the legacy AngularJS 1.x + Express + SQL Server stack with a modern architecture built around:

- **Frontend:** Next.js
- **Backend:** Node API
- **Database:** PostgreSQL

The end state should preserve current product behavior while removing the oldest platform constraints and making future feature work safer and faster.

## Current State

The application is a legacy AngularJS 1.x app generated from Angular Full-Stack Generator 3.4.2. It uses:

- AngularJS component/directive patterns with ui-router
- Express 4 backend routes/controllers
- Passport / express-jwt / session auth
- Grunt, Bower, Babel 5, Karma/Jasmine, Protractor
- SQL Server as the hosted data source

This stack is tightly coupled and constrained by outdated tooling and runtime assumptions.

## Recommended Target Architecture

### Frontend

Build a new Next.js application as the user-facing client.

- Use App Router and React components
- Keep server/client boundaries explicit
- Replace ui-router page flows with Next.js routes
- Treat the frontend as a thin product layer that talks to the API only

### Backend

Build a separate Node API service.

- Expose versioned HTTP endpoints
- Keep business logic and data access behind service modules
- Avoid coupling the frontend to legacy server rendering patterns
- Preserve auth/session behavior where needed, but modernize interfaces around it

### Data Layer

Move persistence to PostgreSQL.

- Design a clean schema for current domain objects
- Use migrations from the start
- Separate read/write concerns where it helps the migration path
- Plan for data import from the existing SQL Server source

## Migration Strategy

Use an incremental strangler approach.

1. Stand up the new Next.js app alongside the legacy app.
2. Create the new Node API and PostgreSQL schema.
3. Migrate shared auth/session behavior or replace it with a modern equivalent.
4. Move one feature area at a time from AngularJS to Next.js.
5. Keep legacy and new systems interoperable until the cutover point.
6. Retire the old app only after the migrated surface is complete and stable.

## Key Boundaries

### Frontend/API boundary

The Next.js app must not depend on legacy server internals. All product data should flow through API contracts.

### API/data boundary

Database access stays inside the backend. Frontend code should never know about PostgreSQL directly.

### Legacy/new boundary

During migration, the old and new systems should coexist with explicit handoff points instead of shared hidden state.

## Risks and Mitigations

- **Auth migration risk:** keep the authentication model stable at first, then improve internals later.
- **Data migration risk:** use repeatable imports, validation checks, and staged cutover.
- **Feature drift risk:** migrate in small slices and verify parity per route/feature.
- **Scope creep risk:** avoid redesigning unrelated product areas during the platform rewrite.

## Testing Strategy

- Unit test backend services and data access
- Integration test API routes against PostgreSQL
- End-to-end test critical user flows in Next.js
- Add parity checks for migrated features before decommissioning the legacy path

## Non-Goals

- Rebuilding product behavior that does not affect the migration path
- Changing business rules without explicit product approval
- Introducing extra platform layers unless they solve a concrete migration problem

## Open Decisions

- Auth/session implementation details in the new backend
- Exact ORM/data access approach
- Whether the migration uses a shared API gateway or direct service routing during transition
- Feature-by-feature cutover order

## Success Criteria

- The app runs on Next.js, Node API, and PostgreSQL
- Core user flows are available in the new stack
- Legacy AngularJS usage is removed or reduced to a temporary migration bridge
- The new architecture is easier to maintain and extend than the current one
