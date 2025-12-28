# Web Scraper Project

A concurrent web crawler built with TypeScript, Node.js, and JSDOM that crawls a website, extracts structured page data, and respects concurrency and page limits.

---

## 📂 Project Structure

web-scraper/
│
├── src/
│ ├── crawler.ts # Core crawler logic
│ ├── index.ts # Entry point / CLI handling
│
├── package.json
├── tsconfig.json
└── README.md

---

### 🚀 Getting Started

1️⃣ Install dependencies
pnpm install

2️⃣ Run the crawler
pnpm start <website_url> <maxConcurrency> <maxPages>

Example:
pnpm start https://example.com 10 20

10 → Maximum concurrent requests

20 → Maximum unique pages to crawl

📊 Output

The crawler returns an object like:

{
"example.com/about": {
"url": "https://example.com/about",
"h1": "About Us",
"firstParagraph": "We are a company that...",
"outgoingLinks": [...],
"imageURLs": [...]
}
}

You can easily:

- Save this to JSON

- Convert it to CSV

- Store it in a database

- Use it for SEO analysis, audits, or indexing

---

#### ⚠️ Important Notes

- Only HTML pages are crawled

- External domains are ignored

- Page limits are enforced safely even under concurrency

- This crawler does not currently:

- Respect robots.txt

- Limit crawl depth

---

##### 🧪 Running Tests

pnpm run test
