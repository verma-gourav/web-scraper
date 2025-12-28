import { crawlSiteAsync } from "./crawl";
import { writeCSVReport } from "./report";

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error(
      "Error: Missing base URL argumenUsage: npm start <baseURL> [maxConcurrency] [maxPages]"
    );
    process.exit(1);
  }

  const baseURL = args[0];
  const maxConcurrency = Number(args[1]) || 5;
  const maxPages = Number(args[2]) || 50;

  console.log(`Starting crawler at base URL: ${baseURL}`);
  console.log(`Max concurrency: ${maxConcurrency}`);
  console.log(`Max pages: ${maxPages}`);

  const pageData = await crawlSiteAsync(baseURL, maxConcurrency, maxPages);

  writeCSVReport(pageData);
  console.log("CSV report written to report.csv");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
