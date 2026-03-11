# Immich API

All Immich API calls use the runtime-configurable `immich_url` and `immich_api_key_text` text components (see [Configuration](./configuration#runtime-configuration)).

## Random Image Selection

- **Endpoint:** `POST {immich_url}/api/search/random`
- **Headers:**
  - `Content-Type: application/json`
  - `Accept: application/json`
  - `x-api-key: {immich_api_key_text}`
- **Body:** `{"size":1,"type":"IMAGE","withExif":true,"withPeople":true}`

## Companion Portrait Search

Same-day portrait search for dual display:

- **Endpoint:** `POST {immich_url}/api/search/random`
- **Headers:**
  - `Content-Type: application/json`
  - `Accept: application/json`
  - `x-api-key: {immich_api_key_text}`
- **Body:** `{"size":10,"type":"IMAGE","withExif":true,"takenAfter":"YYYY-MM-DDT00:00:00.000Z","takenBefore":"YYYY-MM-DDT23:59:59.999Z"}`
- Response is filtered client-side: skip the primary asset, check EXIF for portrait orientation, use the first match.

## Rendered Image Bytes

- **Endpoint:** `GET {immich_url}/api/assets/{id}/thumbnail?size=preview`
- **Header:** `x-api-key: {immich_api_key_text}` (configured on the `online_image` component via `request_headers` lambdas)
