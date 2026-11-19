# Visitor persistence implementation

## Implemented
- Followed `MyHome_Architecture_Blueprint_Final.docx`: Prisma + PostgreSQL, not TypeORM.
- Added `prisma/schema.prisma` with the shared `Visit` entity and visitor status/source enums.
- Added PostgreSQL migration creating `visit` and `outbox_event`, indexes, and tenant row-level security policies.
- Visitor creation and its `VISITOR_CREATED` outbox event are persisted atomically in one transaction.
- Added NestJS `PrismaService` / `PrismaModule`.
- Kept `VisitorsService` in `ResidentModule` as the only visitor persistence owner.
- Kept guard routes in `SecurityController`; walk-in, expected/inside, verify, check-in and check-out call `VisitorsService`.
- Resident pre-approval, listing and decisions call the same `VisitorsService`.
- Made visitor status transitions conditional database updates to prevent duplicate/concurrent transitions.
- Updated admin visitor reporting to await database-backed visitor reads.
- Documented environment setup and migration commands in README.

## Important remaining integration work
- `demo-tenant` is a temporary tenant scope because this starter repository still uses in-memory demo residents and header-based demo auth. Replace with the verified user's active society membership before multi-society use.
- Use a dedicated non-superuser PostgreSQL application role in production so RLS is enforced; superusers bypass RLS.
- Resident/guard identity records and gate logs remain in-memory; this change persists visitor records only.
- Dependencies and Prisma Client need installation/generation in the developer environment (`npm install`, `npx prisma generate`).
