# Quartz D1 Comments

A self-hosted comment component for [Quartz 5](https://quartz.jzhao.xyz), backed by a same-origin API and protected by Cloudflare Turnstile.

This repository contains the **Quartz UI component only**. It does not provision or implement the API, Cloudflare Worker, D1 database, or Turnstile server-side verification. You must provide a compatible comments API.

## Features

- Anonymous comment submission; no visitor account required
- Nickname, required email, optional website, and comment body
- Chronological comment display with 30 comments per page
- Cloudflare Turnstile challenge before submission
- Email is submitted to the API but is not expected in public API responses
- Comment content is rendered as text, not HTML
- Per-page opt-out with frontmatter

## Requirements

- Quartz 5
- A same-origin comments API implementing the contract below
- A Cloudflare Turnstile widget and its public Site Key

## Installation

From your Quartz project root:

```bash
npx quartz plugin add github:ym-0x309/quartz-d1-comments
```

Enable and configure the plugin in `quartz.config.yaml`:

```yaml
- source: github:ym-0x309/quartz-d1-comments
  enabled: true
  options:
    apiPath: /api/comments
    turnstileSiteKey: "YOUR_TURNSTILE_SITE_KEY"
    locale: ko-KR
  layout:
    position: afterBody
    priority: 10
```

Use the public Turnstile **Site Key** here. Never put the Turnstile Secret Key in Quartz configuration or client-side code.

A page can disable comments with this frontmatter:

```yaml
comments: false
```

The component is intended for content pages. Exclude its `blog-comments` layout component from non-content page types where appropriate in your Quartz layout configuration.

## API contract

The default API path is `/api/comments`. It must resolve to the same origin as the Quartz site. Set `apiPath` to another same-origin path if needed.

### List comments

`GET /api/comments?page=<encoded-page-path>&limit=30&offset=0`

Expected JSON response:

```json
{
  "comments": [
    {
      "nickname": "Example",
      "website": "https://example.com",
      "body": "A comment",
      "createdAt": 1790000000
    }
  ],
  "hasMore": false,
  "nextOffset": null
}
```

The public response must not include email addresses or other private fields. `createdAt` is a Unix timestamp in seconds. The component requests 30 records at a time and expects the API to return them in chronological order.

### Submit a comment

`POST /api/comments` with a JSON body:

```json
{
  "pagePath": "/notes/example/",
  "nickname": "Example",
  "email": "example@example.com",
  "website": "https://example.com",
  "body": "A comment",
  "turnstileToken": "TURNSTILE_RESPONSE_TOKEN"
}
```

The API should validate all input, verify the Turnstile token **server-side** using the Secret Key, and store the email privately. A successful response should use a 2xx status. The component displays API-provided `error` text for most unsuccessful responses; it gives specific guidance for HTTP 403 and 503.

## Security and privacy

- Turnstile verification must happen on the server. A client-side challenge alone is not spam protection.
- Keep the Turnstile Secret Key in a server-side secret store.
- The component requires a same-origin API endpoint to avoid sending comment data to an arbitrary origin.
- The component does not expose email in the comment list UI. The API must also omit email from public responses.
- Publish a privacy notice explaining why email is collected, its retention period, and how visitors can request deletion.
- This component does not provide visitor-side comment editing or deletion.

## Development

The component is implemented in `components/index.js` and exported from `index.js`. It uses Quartz's Preact runtime and declares `preact` as a peer dependency.

For local end-to-end testing, configure your API and use Cloudflare's documented Turnstile test keys in a non-production environment. Do not use test keys in production.

## License

MIT. See [LICENSE](./LICENSE).
