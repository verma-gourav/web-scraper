# Web Scraper

A concurrent web crawler built with **TypeScript**, **Nodejs**, and **JSDOM**.\
It crawls a website, extracts structured page data, and enforces strict
concurrency and page limits.

---

## Project Structure

```text
web-scraper/
├── src/
│   ├── crawler.ts    # Core crawler logic
│   └── index.ts      # CLI entry point
├── package.json
├── tsconfig.json
└── README.md
```

---

## Getting Started

### Install dependencies

```bash
pnpm install
```

### Run the crawler

```bash
pnpm start <website_url> <maxConcurrency> <maxPages>
```

Example:

```bash
pnpm start https://example.com 10 20
```

- `maxConcurrency` --- maximum concurrent requests\
- `maxPages` --- maximum unique pages to crawl

---

## Output

The crawler returns structured page data:

```json
{
  "example.com/about": {
    "url": "https://example.com/about",
    "h1": "About Us",
    "firstParagraph": "We are a company that...",
    "outgoingLinks": [],
    "imageURLs": []
  }
}
```

This data can be: - Saved as JSON - Converted to CSV - Stored in a
database - Used for SEO analysis or site audits

---

## Important Notes

- Only HTML pages are crawled
- External domains are ignored
- Page limits are enforced safely under concurrency

Not implemented yet: - `robots.txt` support - Crawl depth limits

---

## Running Tests

```bash
pnpm test
```
