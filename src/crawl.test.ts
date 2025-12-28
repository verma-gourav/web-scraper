import { describe, expect, it } from "vitest";
import {
  extractPageData,
  getFirstParagraphFromHTML,
  getH1FromHTML,
  getImagesFromHTML,
  getURLsFromHTML,
  normalizeURL,
} from "./crawl";

// normalize urls
describe("normalizeURL", () => {
  it("removes protocol", () => {
    expect(normalizeURL("https://blog.boot.dev/path")).toBe(
      "blog.boot.dev/path"
    );
    expect(normalizeURL("http://blog.boot.dev/path")).toBe(
      "blog.boot.dev/path"
    );
  });

  it("removes trailing slash", () => {
    expect(normalizeURL("https://blog.boot.dev/path/")).toBe(
      "blog.boot.dev/path"
    );
  });

  it("lowercases the hostname", () => {
    expect(normalizeURL("https://BLOG.BOOT.DEV/PATH")).toBe(
      "blog.boot.dev/path"
    );
  });

  it("handles root path", () => {
    expect(normalizeURL("https://blog.boot.dev")).toBe("blog.boot.dev");
    expect(normalizeURL("https://blog.boot.dev/")).toBe("blog.boot.dev");
  });

  it("handles nested paths", () => {
    expect(normalizeURL("https://blog.boot.dev/a/b/c/")).toBe(
      "blog.boot.dev/a/b/c"
    );
  });

  it("throws on invalid URL", () => {
    expect(() => normalizeURL("not-a-url")).toThrow();
  });
});

// get h1 from html
describe("getH1FromHTML", () => {
  it("returns h1", () => {
    expect(getH1FromHTML(`<html><body><h1>Test Title</h1></body></html>`)).toBe(
      "Test Title"
    );
  });

  it("returns nothing if no h1 is found", () => {
    expect(getH1FromHTML(`<html><body><p>No H1 here</p></body></html>`)).toBe(
      ""
    );
  });
});

// get paragraph from html
describe("getFirstParagraphFromHTML", () => {
  it("returns p present inside main", () => {
    expect(
      getFirstParagraphFromHTML(`<html><body>
      <p>Outside paragraph.</p>
      <main>
        <p>Main paragraph.</p>
      </main>
    </body></html>`)
    ).toBe("Main paragraph.");
  });

  it("returns first p if main not found", () => {
    expect(
      getFirstParagraphFromHTML(`<html><body>
      <p>First outside paragraph.</p>
      <p>Second outside paragraph.</p>
    </body></html>`)
    ).toBe("First outside paragraph.");
  });

  it("returns nothing if p not found", () => {
    expect(
      getFirstParagraphFromHTML(`<html><body><h1>Title</h1></body></html>`)
    ).toBe("");
  });
});

// get urls from html
describe("getURLsFromHTML", () => {
  it("finds all a tags", () => {
    const html = `<html>
        <body>
          <a href="https://example.com/page1">Link 1</a>
          <a href="https://example.com/page2">Link 2</a>
        </body>
      </html>`;

    expect(getURLsFromHTML(html, "https://example.com")).toEqual([
      "https://example.com/page1",
      "https://example.com/page2",
    ]);
  });

  it("converts relative URLs to absolute", () => {
    const html = `
      <html>
        <body>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
        </body>
      </html>
    `;

    expect(getURLsFromHTML(html, "https://example.com")).toEqual([
      "https://example.com/about",
      "https://example.com/contact",
    ]);
  });

  it("handles mix of relative and absolute URLs", () => {
    const html = `<html>
        <body>
          <a href="/about">About</a>
          <a href="https://other.com/page">Other</a>
        </body>
      </html>`;

    expect(getURLsFromHTML(html, "https://example.com")).toEqual([
      "https://example.com/about",
      "https://other.com/page",
    ]);
  });

  it("returns empty array if no links are present", () => {
    const html = `<html><body><p>No links here</p></body></html>`;

    expect(getURLsFromHTML(html, "https://example.com")).toEqual([]);
  });
});

// get images from html
describe("getImagesFromHTML", () => {
  it("finds all img tags", () => {
    const html = `<html>
        <body>
          <img src="https://example.com/img1.png">Link 1</img>
          <img src="https://example.com/img2.jpg">Link 2</img>
        </body>
      </html>`;

    expect(getImagesFromHTML(html, "https://example.com")).toEqual([
      "https://example.com/img1.png",
      "https://example.com/img2.jpg",
    ]);
  });

  it("converts relative image URLs to absolute", () => {
    const html = `
      <html>
        <body>
          <img src="/logo.png">About</img>
          <img src="/banner.jpg">Contact</img>
        </body>
      </html>
    `;

    expect(getImagesFromHTML(html, "https://example.com")).toEqual([
      "https://example.com/logo.png",
      "https://example.com/banner.jpg",
    ]);
  });

  it("handles mix of relative and absolute image URLs", () => {
    const html = `<html>
        <body>
          <img src="/logo.png">About</img>
          <img src="https://other.com/banner.jpg">Other</img>
        </body>
      </html>`;

    expect(getImagesFromHTML(html, "https://example.com")).toEqual([
      "https://example.com/logo.png",
      "https://other.com/banner.jpg",
    ]);
  });

  it("returns empty array if no images are present", () => {
    const html = `<html><body><p>No images here</p></body></html>`;

    expect(getImagesFromHTML(html, "https://example.com")).toEqual([]);
  });
});

// extractPageData
describe("extractPageData", () => {
  it("extracts structured page data", () => {
    const html = `      <html>
        <body>
          <h1>Test Page</h1>
          <p>This is the first paragraph.</p>
          <p>This is the second paragraph.</p>

          <a href="/about">About</a>
          <a href="https://other.com/page">Other</a>

          <img src="/logo.png" />
          <img src="https://cdn.site.com/banner.jpg" />
        </body>
      </html>`;

    expect(extractPageData(html, "https://example.com")).toEqual({
      url: "https://example.com",
      h1: "Test Page",
      firstParagraph: "This is the first paragraph.",
      outgoingLinks: ["https://example.com/about", "https://other.com/page"],
      imageURLs: [
        "https://example.com/logo.png",
        "https://cdn.site.com/banner.jpg",
      ],
    });
  });

  it("prioritizes content inside main over other sections", () => {
    const html = `
    <html>
      <body>
        <p>This paragraph is outside main</p>

        <main>
          <h1>Title</h1>
          <p>This paragraph is inside main</p>
          <a href="/main-link">Main Link</a>
          <img src="/main-image.png" />
        </main>

        <a href="/outside-link">Outside Link</a>
        <img src="/outside-image.png" />
      </body>
    </html>
  `;

    expect(extractPageData(html, "https://example.com")).toEqual({
      url: "https://example.com",
      h1: "Title",
      firstParagraph: "This paragraph is inside main",
      outgoingLinks: [
        "https://example.com/main-link",
        "https://example.com/outside-link",
      ],
      imageURLs: [
        "https://example.com/main-image.png",
        "https://example.com/outside-image.png",
      ],
    });
  });

  it("handles pages with missing elements", () => {
    const html = `
      <html>
        <body>
          <p>Only paragraph</p>
        </body>
      </html>
    `;

    expect(extractPageData(html, "https://example.com")).toEqual({
      url: "https://example.com",
      h1: "",
      firstParagraph: "Only paragraph",
      outgoingLinks: [],
      imageURLs: [],
    });
  });
});
