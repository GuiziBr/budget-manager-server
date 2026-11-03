## GET /balance/envelopes/:year/:month

Retrieves a user's expense totals for a given month, for every **envelope** category. A category is an envelope when its `is_envelope` flag is `true` (set via `POST`/`PATCH /categories`). `month` is 1-indexed (January = `1`).

This route is meant for service-to-service calls. It does **not** use the JWT; it requires the `x-api-key` header to match the server's `SERVICE_API_KEY` environment variable, and the user is given explicitly through the `userId` query parameter.

The expenses counted and the amounts returned are exactly the same as in `GET /balance/breakdown/:year/:month?filterBy=category`, restricted to envelope categories.

### Headers

| Header      | Required | Notes |
|-------------|----------|-------|
| `x-api-key` | yes      | Must equal `SERVICE_API_KEY` |

### Route parameters

| Field   | Type   | Notes |
|---------|--------|-------|
| `year`  | number | Min `1900` |
| `month` | number | `1`–`12` |

### Query parameters

| Field    | Type | Required | Notes |
|----------|------|----------|-------|
| `userId` | uuid | yes      | The user whose expenses are summed |

### Response `200 OK`

A JSON array with one entry per non-deleted envelope category, sorted by `total` descending. Amounts are in cents. Envelope categories with no expenses in the month are returned with `total: 0`. The array is empty when no category is flagged as an envelope.

```json
[
  { "id": "cat-id-1", "description": "Groceries", "total": 42000 },
  { "id": "cat-id-2", "description": "Fun", "total": 0 }
]
```

### Errors

| Status | Condition |
|--------|-----------|
| `400 Bad Request` | Route params or query fail schema validation (e.g. `userId` is not a UUID, `month` outside `1`–`12`) |
| `401 Unauthorized` | Missing or invalid `x-api-key` |
| `404 Not Found` | No user exists with the given `userId` |
| `500 Internal Server Error` | The underlying query fails |