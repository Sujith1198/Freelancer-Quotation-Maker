# QuoteSwift PHP API

Hostinger-compatible PHP 8.1+ PDO API. Never place database credentials in the
mobile app or commit a real `.env` file. Configure environment variables in the
hosting panel, rotate any password that has been shared, and import
`database/001_create_customers.sql` through phpMyAdmin.

Endpoints: `GET/POST /customers`, `PUT/DELETE /customers/{id}`, `GET/POST
/catalog`, and `PUT/DELETE /catalog/{id}`. Import both SQL files in numeric
order. Every request
must send the server-side `X-API-Key`. Replace this temporary V3 API-key layer
with user authentication before public multi-user launch.
