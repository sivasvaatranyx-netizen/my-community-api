CREATE TYPE "VisitorStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CHECKED_IN', 'CHECKED_OUT');
CREATE TYPE "VisitorSource" AS ENUM ('PRE_APPROVED', 'WALK_IN');

CREATE TABLE "visit" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'demo-tenant',
    "resident_id" TEXT NOT NULL,
    "flat" TEXT NOT NULL,
    "visitor_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "pass_code" TEXT NOT NULL,
    "status" "VisitorStatus" NOT NULL DEFAULT 'PENDING',
    "source" "VisitorSource" NOT NULL,
    "expected_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "visit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "visit_tenant_id_pass_code_key" ON "visit"("tenant_id", "pass_code");
CREATE INDEX "visit_tenant_id_status_created_at_idx" ON "visit"("tenant_id", "status", "created_at");
CREATE INDEX "visit_tenant_id_resident_id_created_at_idx" ON "visit"("tenant_id", "resident_id", "created_at");

-- Tenant isolation policy. The API sets app.tenant_id transaction-locally before visitor queries.
ALTER TABLE "visit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "visit" FORCE ROW LEVEL SECURITY;
CREATE POLICY "visit_tenant_isolation" ON "visit"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));


CREATE TABLE "outbox_event" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMP(3),
    CONSTRAINT "outbox_event_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "outbox_event_published_at_created_at_idx" ON "outbox_event"("published_at", "created_at");

ALTER TABLE "outbox_event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "outbox_event" FORCE ROW LEVEL SECURITY;
CREATE POLICY "outbox_event_tenant_isolation" ON "outbox_event"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));
