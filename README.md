# Quartz D1 Comments

A self-hosted comment component for [Quartz 5](https://quartz.jzhao.xyz), backed by a same-origin API and protected by Cloudflare Turnstile.

This repository contains the **Quartz UI component only**. It does not provision or implement the API, Cloudflare Worker, D1 database, or Turnstile server-side verification. You must provide a compatible comments API.

## Features

- Anonymous comment submission; no visitor account required
- Nickname, required email, optional website, and comment body
- Chronological top-level comments with 30 threads per page
- One level of replies under each top-level comment
- Cloudflare Turnstile challenge before submission
- Email is submitted to the API but is never included in public API responses
- Comment content is rendered as text, not HTML
- English interface; `locale` controls date and time formatting only
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

The interface labels and messages are always English. The `locale` option is used only by the browser's date/time formatter (for example, `ko-KR` or `en-US`).

Use the public Turnstile **Site Key** here. Never put the Turnstile Secret Key in Quartz configuration or client-side code.

A page can disable comments with this frontmatter:

```yaml
comments: false
```

The component is intended for content pages. Exclude its `blog-comments` layout component from non-content page types where appropriate in your Quartz layout configuration.

## API contract

The default API path is `/api/comments`. It must resolve to the same origin as the Quartz site. Set `apiPath` to another same-origin path if needed.

### List comment threads

`GET /api/comments?page=<encoded-page-path>&limit=30&offset=0`

Pagination applies to top-level comments. Replies to each returned top-level comment are included with that comment, so a thread is never split across pages.

Expected JSON response:

```json
{
  "comments": [
    {
      "id": "comment-id",
      "parentId": null,
      "nickname": "Example",
      "website": "https://example.com",
      "body": "A comment",
      "createdAt": 1790000000,
      "replies": [
        {
          "id": "reply-id",
          "parentId": "comment-id",
          "nickname": "Another reader",
          "website": null,
          "body": "A reply",
          "createdAt": 1790000100
        }
      ]
    }
  ],
  "hasMore": false,
  "nextOffset": null
}
```

The public response must not include email addresses or other private fields. `createdAt` is a Unix timestamp in seconds. The component requests 30 top-level comments at a time and expects both comments and replies in chronological order.

### Submit a comment or reply

`POST /api/comments` with a JSON body. Omit `parentId` or set it to `null` for a top-level comment. Set `parentId` to a top-level comment ID to create a reply:

```json
{
  "pagePath": "/notes/example/",
  "parentId": "comment-id",
  "nickname": "Example",
  "email": "example@example.com",
  "website": "https://example.com",
  "body": "A reply",
  "turnstileToken": "TURNSTILE_RESPONSE_TOKEN"
}
```

The API must reject a parent ID that does not belong to the requested page or that is itself a reply. This implementation supports one reply level, not nested replies to replies.

The API should validate all input, verify the Turnstile token **server-side** using the Secret Key, and store the email privately. A successful response should use a 2xx status. The component displays API-provided `error` text for most unsuccessful responses; it gives specific guidance for HTTP 403 and 503.

## Database migration

For an existing D1 comments table, apply the additive migration that adds the nullable `parent_id` column and its index before deploying the updated Worker:

```bash
npx wrangler d1 migrations apply blog-comments --remote
```

Existing rows keep `parent_id = NULL` and remain top-level comments.

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
