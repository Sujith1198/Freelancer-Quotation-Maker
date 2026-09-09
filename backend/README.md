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
`007_create_accounts.sql` in numeric order.

V5 also adds `GET/POST /quotations` and `GET/PUT/DELETE /quotations/{id}`.
Quotation headers and line items are written in one transaction. Import
`003_create_quotations.sql` after the first two migrations.

V6 supports `PATCH /quotations/{id}` with a `status` body for workflow updates.

V12 adds `/auth/register`, `/auth/login`, `/auth/me`, and `/auth/logout`.
Registration and login return an expiring token; send it as
`Authorization: Bearer TOKEN`.
