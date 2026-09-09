# QuoteSwift PHP API

Hostinger-compatible PHP 8.1+ PDO API. Never place database credentials in the
mobile app or commit a real `.env` file. Configure environment variables in the
hosting panel, rotate any password that has been shared, and import
`database/001_create_customers.sql` through phpMyAdmin.

Endpoints: `GET/POST /customers`, `PUT/DELETE /customers/{id}`, `GET/POST
/catalog`, and `PUT/DELETE /catalog/{id}`. Import both SQL files in numeric
order. Every request
must send the server-side `X-API-Key`. Replace this temporary V3 API-key layer
with account authentication for new integrations. Import SQL files through
`009_create_subscriptions.sql` in numeric order.

V5 also adds `GET/POST /quotations` and `GET/PUT/DELETE /quotations/{id}`.
Quotation headers and line items are written in one transaction. Import
`003_create_quotations.sql` after the first two migrations.

V6 supports `PATCH /quotations/{id}` with a `status` body for workflow updates.

V12 adds `/auth/register`, `/auth/login`, `/auth/me`, and `/auth/logout`.
Registration and login return an expiring token; send it as
`Authorization: Bearer TOKEN`.

V13 adds authenticated `GET /sync` and `PUT /sync` endpoints for account-scoped
business snapshots. Only the documented QuoteSwift storage keys are accepted,
and each snapshot is limited to 5 MB.

V14 adds authenticated `GET /billing` subscription status and the subscription
schema required for a future verified Google Play webhook. Client requests
cannot directly grant themselves Pro access.

V15 adds authenticated `DELETE /auth/account`. It removes the account and
cascades its sessions, cloud snapshot and subscription data.

V16 adds `/admin/overview`, `/admin/users`, `/admin/users/{id}` and
`/admin/pricing`. Run migration `010`, then promote only the verified owner
account to the `admin` role as shown in that migration. Every admin API checks
the Bearer account role server-side.
