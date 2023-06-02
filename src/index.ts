import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { load } from "cheerio";
import path = require("path");
import { LocalStorage } from "node-localstorage";
import { LocalStorageKeys } from "./types/local-storage-keys";
import { serializeArray } from "./utils/serialize-array";
import { cleanCache } from "./helpers/clean-cache";

(async function () {
  console.log("Cleaning cache...");
  await cleanCache();

  const localStorage = new LocalStorage(path.join(__dirname, "local-storage"));

  puppeteer.use(StealthPlugin());

  puppeteer.launch({ headless: true }).then(async (browser) => {
    console.log("Gathering real estate hrefs...");
    const realEstateHrefsDict: Record<string, string> = {}; // Use object to automatically prevent adding duplicates
    const page = await browser.newPage();

    for (let pageIndex = 1; true; pageIndex++) {
      const pageAnalysisStartTime = Date.now();
      await page.goto(
        `https://www.immoweb.be/fr/recherche/maison/a-vendre?countries=BE&page=${pageIndex}&orderBy=relevance`
      );
      await page.screenshot({
        path: path.join(
          __dirname,
          "screenshots",
          `search-page-${pageIndex}.png`
        ),
        fullPage: true,
      });
      const searchPageRawHTMLString = await page.content();
      const searchPageCheerio = load(searchPageRawHTMLString);
      const realEstateLinks = searchPageCheerio("a.card__title-link").get();
      const hrefs = realEstateLinks.map((anchor) => anchor.attribs.href);
      if ((hrefs?.length ?? 0) === 0) break; // Exit loop if no more hrefs can be found in this page index

      // Add hrefs to array in memory and to file storage in real time
      hrefs.forEach((href) => (realEstateHrefsDict[href] = href));
      localStorage.setItem(
        LocalStorageKeys.RealEstatePagesToScrape,
        serializeArray(Object.keys(realEstateHrefsDict))
      );

      // Log page analysis duration
      const pageAnalysisEndTime = Date.now();
      const pageAnalysisDuration = (
        (pageAnalysisEndTime - pageAnalysisStartTime) /
        1000
      ).toFixed(2);
      console.log(
        `Retrieved ${
          hrefs.length
        } links of search page #${pageIndex} in ${pageAnalysisDuration} seconds; ${
          Object.keys(realEstateHrefsDict).length
        } real estate pages are currently ready to be scraped`
      );
    }

    //   const realEstateHrefs = Object.keys(realEstateHrefsDict);
    //   console.log(realEstateHrefs);
    //   console.log("Scraping first real estate page...");
    //   const realEstateHref = realEstateHrefs[0];
    //   await page.goto(realEstateHref);
    //   await page.screenshot({
    //     path: path.join(__dirname, "screenshots", "real-estate-1.png"),
    //     fullPage: true,
    //   });
    //   const realEstatePageRawHTMLString = await page.content();
    //   console.log(realEstatePageRawHTMLString);

    await browser.close();
  });
})();
