# My Community API (NestJS modular monolith)

Backend for the **MyHome** gated-community platform, structured to match the target architecture
(NestJS modular monolith on Google Cloud Run). Four modules, each split by feature:

```
src/
├── common/              role enum, RolesGuard (demo auth), permissions matrix
├── resident/            RESIDENT role
│   ├── resident.controller.ts      Profiles, visitor pre-approval/decisions, complaints, notices
│   ├── amenities/                  Amenity catalogue + slot booking (capacity-aware)
│   ├── payments/                   Invoices, pay, receipts, due-date reminders (Cloud Tasks)
│   └── services/ dto/              residents, visitors, complaints, notices
├── security/            SECURITY role
│   ├── security.controller.ts      Visitor management + gate check-in/out
│   ├── gates/                      Gate operations (gate registry, open/closed, entry/exit rules)
│   ├── incidents/                  Incident tracking (type, severity, status, notes)
│   └── gate-log.service.ts         Entry/exit audit log
├── admin/               ADMIN role
│   ├── admin.controller.ts         Residents, notices, complaints, invoices, amenity catalogue
│   ├── users/                      User & role management (staff accounts, role matrix)
│   ├── config/                     App configuration + feature flags (+ public GET /config)
│   └── reports/                    Reports & analytics (dashboard, visitors, payments, ...)
└── integration/         shared platform services
    ├── fcm/                        Firebase Cloud Messaging (device tokens, topics, push)
    ├── pubsub/                     Event bus (Cloud Pub/Sub stand-in) + subscribers
    ├── tasks/                      Delayed jobs with retries (Cloud Tasks stand-in)
    ├── external/                   Payment gateway client (Razorpay/PayU stub)
    ├── telemetry/                  Request logging interceptor, metrics, audit trail
    └── notification.service.ts, webhook.service.ts, integration.controller.ts
```

Module wiring: `Resident → Integration`, `Security → Resident + Integration`,
`Admin → Resident + Security + Integration` (no circular imports).

## Run

```bash
npm install
cp .env.example .env
npm run start:dev
```

Swagger UI: http://localhost:3000/docs

## Demo auth

Send headers `x-role` (`RESIDENT` | `SECURITY` | `ADMIN`) and `x-user-id`.
Seeded ids: resident `res-1` (flat A-101), admin `admin-1`, guard `guard-1`.
In Swagger use **Authorize**, and change the role when you switch between module endpoints.

## Endpoints

### Resident (`x-role: RESIDENT`)
| Method | Path | Purpose |
|---|---|---|
| GET / PATCH | `/resident/me` | View / update profile |
| POST / GET | `/resident/visitors` | Pre-approve a guest (gets a pass code) / list |
| PATCH | `/resident/visitors/:id/decision` | Approve or reject a walk-in |
| POST / GET | `/resident/complaints` | Raise / list complaints |
| GET | `/resident/notices` | Community notices |
| GET | `/resident/amenities` | Active amenities |
| POST / GET | `/resident/amenities/bookings` | Book a slot / my bookings |
| DELETE | `/resident/amenities/bookings/:id` | Cancel booking |
| GET | `/resident/payments/invoices` | My dues (with `overdue` flag) |
| POST | `/resident/payments/invoices/:id/pay` | Pay (`UPI` / `CARD` / `NETBANKING`) |
| GET | `/resident/payments/receipts` | Paid invoices |

### Security (`x-role: SECURITY`; incidents and gates also allow ADMIN)
| Method | Path | Purpose |
|---|---|---|
| POST | `/security/visitors/walk-in` | Log an unannounced visitor (resident is notified) |
| POST | `/security/visitors/verify` | Validate a 6-digit pass code |
| GET | `/security/visitors/expected` · `/inside` | Approved / currently inside |
| POST | `/security/visitors/:id/check-in` · `/check-out` | Gate entry / exit (`gateId`, `vehicleNumber` optional) |
| GET | `/security/gate-log` | Entry/exit log |
| GET / PATCH | `/security/gates` · `/security/gates/:id/status` | Gate registry, open/close |
| POST / GET | `/security/incidents` | Report / list (`?status=`) |
| PATCH | `/security/incidents/:id/status` | Update status with a note |

### Admin (`x-role: ADMIN`)
| Method | Path | Purpose |
|---|---|---|
| POST / GET / DELETE | `/admin/residents` | Manage residents |
| POST / GET | `/admin/notices` | Publish notices (pushed to all residents) |
| GET / PATCH | `/admin/complaints` · `/:id/status` | Complaint workflow |
| POST / GET | `/admin/invoices` | Create maintenance dues / list |
| POST / GET / PATCH | `/admin/amenities` · `/:id/status` | Amenity catalogue |
| GET / POST | `/admin/users` | Staff accounts |
| PATCH | `/admin/users/:id/role` · `/status` | Change role / deactivate |
| GET | `/admin/roles` | Role → permission matrix |
| GET / PATCH | `/admin/config` | App settings and feature flags |
| GET | `/admin/dashboard`, `/admin/reports/{visitors,payments,complaints,incidents,amenities}` | Analytics |

### Integration
| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/integration/health` | public | Health check (Cloud Run) |
| GET | `/config` | public | App bootstrap config (society name, feature flags) |
| POST | `/integration/fcm/tokens` | any role | Register device token (auto-subscribes to the role topic) |
| GET | `/integration/fcm/history` | ADMIN | Push history |
| POST / GET | `/integration/notifications/test` · `/outbox` | ADMIN | Notification test / outbox |
| GET | `/integration/pubsub/messages` · `/integration/tasks` | ADMIN | Inspect events / scheduled tasks |
| POST | `/integration/webhooks/payment` | `x-webhook-secret` | Inbound payment webhook |
| GET | `/integration/telemetry/metrics` · `/integration/audit-logs` | ADMIN | Metrics and audit trail |

## Event flow (Pub/Sub)

Controllers publish domain events; `EventHandlersService` turns them into FCM pushes:

| Event | Published by | Push to |
|---|---|---|
| `visitor.checked_in` | Security check-in | the resident |
| `payment.completed` | Resident payment | the resident |
| `incident.reported` | Incident report | `admins` topic (+ `residents` if CRITICAL) |
| `notice.published` | Admin notice | `residents` topic |
| `complaint.updated` | Admin complaint update | the resident |

## Try it

```bash
# Admin creates a dues invoice for the demo resident
curl -X POST localhost:3000/admin/invoices -H 'x-role: ADMIN' -H 'x-user-id: admin-1' \
  -H 'Content-Type: application/json' \
  -d '{"residentId":"res-1","title":"Maintenance - Dec 2026","amount":2500,"dueDate":"2026-12-05"}'

# Resident pays it
curl -X POST localhost:3000/resident/payments/invoices/<invoiceId>/pay \
  -H 'x-role: RESIDENT' -H 'x-user-id: res-1' -H 'Content-Type: application/json' -d '{"method":"UPI"}'

# Admin checks collection
curl localhost:3000/admin/reports/payments -H 'x-role: ADMIN' -H 'x-user-id: admin-1'
```

## Deploy to Cloud Run

```bash
gcloud run deploy my-community-api --source . --region asia-south1 --allow-unauthenticated
```
`asia-south1` (Mumbai) keeps data in India. The Dockerfile listens on `$PORT` (8080).

## Stubs to replace before production

| Area | Now | Production (per architecture) |
|---|---|---|
| Storage | in-memory `Map`s | Cloud SQL (PostgreSQL) via TypeORM/Prisma |
| Auth | `x-role` / `x-user-id` headers | Firebase Auth (email / phone OTP / SSO) + JWT |
| Push | `FcmService` logs | `firebase-admin` `messaging()` |
| Events | in-process `PubSubService` | Cloud Pub/Sub topics + subscriptions |
| Jobs | in-process `TasksService` | Cloud Tasks queues -> HTTP handlers |
| Payments | `PaymentGatewayService` always succeeds | Razorpay / PayU SDK + webhook verification |
| Files | not implemented | Cloud Storage (documents, images, receipts) |
| Logs / metrics | JSON logs + in-memory counters | Cloud Logging / Monitoring / Trace |
