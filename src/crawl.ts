import { JSDOM } from "jsdom";
import pLimit from "p-limit";

// normalize URL
export const normalizeURL = (url: string): string => {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid URL");
  }

  const hostname = parsed.hostname.toLowerCase();
  let pathname = parsed.pathname.toLowerCase();

  if (pathname.endsWith("/") && pathname !== "/") {
    pathname = pathname.replace(/\/+$/, "");
  }

  if (pathname === "/") {
    pathname = "";
  }

  return `${hostname}${pathname}`;
};

// get h1
export const getH1FromHTML = (html: string): string => {
  try {
    const { document } = new JSDOM(html).window;
    return document.querySelector("h1")?.textContent?.trim() ?? "";
  } catch {
    return "";
  }
};

// get first p
export const getFirstParagraphFromHTML = (html: string): string => {
  try {
    const { document } = new JSDOM(html).window;
    const p =
      document.querySelector("main")?.querySelector("p") ??
      document.querySelector("p");
    return p?.textContent?.trim() ?? "";
  } catch {
    return "";
  }
};

// get urls
export const getURLsFromHTML = (html: string, baseURL: string): string[] => {
  try {
    const { document } = new JSDOM(html).window;
    const anchors = document.querySelectorAll("a");
    const urls: string[] = [];

    for (const anchor of anchors) {
      const href = anchor.getAttribute("href");
      if (!href) continue;

      const url = new URL(href, baseURL).href;
      urls.push(url);
    }

    return urls;
  } catch {
    return [];
  }
};

// get images
export const getImagesFromHTML = (html: string, baseURL: string): string[] => {
  try {
    const { document } = new JSDOM(html).window;
    const images = document.querySelectorAll("img");
    const urls: string[] = [];

    for (const img of images) {
      const src = img.getAttribute("src");
      if (!src) continue;

      const url = new URL(src, baseURL).href;
      urls.push(url);
    }

    return urls;
  } catch {
    return [];
  }
};

// extract page data
export interface ExtractedPageData {
  url: string;
  h1: string;
  firstParagraph: string;
  outgoingLinks: string[];
  imageURLs: string[];
}

export const extractPageData = (
  html: string,
  pageURL: string
): ExtractedPageData => {
  return {
    url: pageURL,
    h1: getH1FromHTML(html),
    firstParagraph: getFirstParagraphFromHTML(html),
    outgoingLinks: getURLsFromHTML(html, pageURL),
    imageURLs: getImagesFromHTML(html, pageURL),
  };
};

export class ConcurrentCrawler {
  private baseURL: string;
  private pages: Record<string, ExtractedPageData>;
  private limit: ReturnType<typeof pLimit>;

  private maxPages: number;
  private shouldStop: boolean;
  private allTasks: Set<Promise<void>>;
  private abortController: AbortController;

  constructor(baseURL: string, maxConcurrency: number = 5, maxPages: number) {
    this.baseURL = baseURL;
    this.pages = {};
    this.limit = pLimit(maxConcurrency);

    this.maxPages = maxPages;
    this.shouldStop = false;
    this.allTasks = new Set();
    this.abortController = new AbortController();
  }

  private addPageVisit(normalizedURL: string): boolean {
    if (this.shouldStop) return false;
    if (this.pages[normalizedURL]) return false;

    if (Object.keys(this.pages).length >= this.maxPages) {
      this.shouldStop = true;
      console.log("Reached max number of pages to crawl.");
      this.abortController.abort();
      return false;
    }

    return true;
  }

  // get HTML with concurrency limit
  private async getHTML(currentURL: string): Promise<string | null> {
    return this.limit(async () => {
      try {
        const response = await fetch(currentURL, {
          headers: {
            "User-Agent": "BootCrawler/1.0",
          },
          signal: this.abortController.signal,
        });

        if (response.status >= 400) return null;

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("text/html")) return null;

        return await response.text();
      } catch {
        return null;
      }
    });
  }

  // recursive crawl
  private async crawlPage(currentURL: string): Promise<void> {
    if (this.shouldStop) return;

    const normalizedURL = normalizeURL(currentURL);
    if (!this.addPageVisit(normalizedURL)) return;

    const currentURLObj = new URL(currentURL);
    const baseURLObj = new URL(this.baseURL);

    if (currentURLObj.hostname !== baseURLObj.hostname) return;

    console.log(`crawling ${currentURL}`);

    const html = await this.getHTML(currentURL);
    if (!html) return;

    // ✅ store extracted page data
    this.pages[normalizedURL] = extractPageData(html, currentURL);

    const urls = getURLsFromHTML(html, this.baseURL);

    for (const url of urls) {
      if (this.shouldStop) break;
      if (Object.keys(this.pages).length >= this.maxPages) {
        this.shouldStop = true;
        break;
      }

      const task = this.crawlPage(url).finally(() =>
        this.allTasks.delete(task)
      );

      this.allTasks.add(task);
    }
  }

  public async crawl(): Promise<Record<string, ExtractedPageData>> {
    await this.crawlPage(this.baseURL);
    await Promise.all(this.allTasks);
    return this.pages;
  }
}

export const crawlSiteAsync = async (
  baseURL: string,
  maxConcurrency: number,
  maxPages: number
): Promise<Record<string, ExtractedPageData>> => {
  const crawler = new ConcurrentCrawler(baseURL, maxConcurrency, maxPages);
  return crawler.crawl();
};
