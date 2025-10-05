import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import fs from "fs";

async function getDate() {
  let browser;

  try {
    browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setViewport({
      width: 1000,
      height: 700,
    });

    page.setDefaultNavigationTimeout(2 * 60 * 1000);

    // Navigate to the page
    await page.goto(
      "https://www.amazon.in/dp/B0FTMD7RPG/ref=sr_1_3_sspa?dib=eyJ2IjoiMSJ9.UEZaFcOQ-net8SDvKusyzqBUCs-MMDCIADg-C7xoRiRwp0zrfSAW1GS-qGQ9n5N7FXOA1UZh8WYowtqUan0B5F00RoNBAyT0bouTvlWvGla0HIcWDZSBRvOyzQ1FYvMnaeTmwqCMUXlQFYhKL-iz1Jhxn6obqGcwMFMo2IIDVrU2tfAaKbMlxYivoJKV9Rbmz3gz5vKO0ds9gg-N3duZVUSXZPP74zhA3QUfOaziS83kwoGAzZ6KaKydne9ZIeFIJ1sQ9SJ_vr6jfomIdOTG-5xkCX-BYNK_0HdKUxuLS-Y.X8PfF-pcm6tMJftPf4PIUAn-_ov3sYypbGUAFSa8S0s&dib_tag=se&keywords=oreo&qid=1759659441&sr=8-3-spons&sp_csd=d2lkZ2V0TmFtZT1zcF9hdGY&psc=1",
      {
        waitUntil: "networkidle2",
      }
    );
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    const html = await page.content();
    const $ = cheerio.load(html);

    // 1. Product Title
    const title = $("#productTitle").text().trim();
    
    // 2. Product Price
    const price = $(".a-price .a-offscreen").first().text().trim();

    // 3. Brand Name
    let brand = $("#bylineInfo").text().trim();
    if (!brand) {
      brand = $("#productOverview_feature_div tr:first-child td.a-span9 span")
        .text()
        .trim();
    }
    brand = brand.replace(/^Brand:\s*/i, "");

    // 4. Prouct Images
    const images = [];
    $("#altImages img").each((i, el) => {
      const img = $(el).attr("src");
      if (img) images.push(img);
    });

    // 5. Main image
    const mainImage = $("#imgTagWrapperId img").attr("src");

    // 6. Net Weight
    let netWeight = "";
    $("#productOverview_feature_div tr").each((i, el) => {
      const label = $(el).find("td.a-span3 span").text().trim();
      const value = $(el).find("td.a-span9 span").text().trim();
      if (label.toLowerCase().includes("net")) {
        netWeight = value;
      }
    });
    if (!netWeight) {
      $("#detailBullets_feature_div li").each((i, el) => {
        const label = $(el).find("span.a-text-bold").text().trim();
        const value = $(el).find("span").last().text().trim();
        if (label.toLowerCase().includes("net")) {
          netWeight = value;
        }
      });
    }

    console.log({
      title,
      brand,
      price,
      netWeight,
      mainImage,
      images
    });

    fs.writeFileSync("output.html", html);

    await browser?.close();
  } catch (err) {
    console.log(err);

    await browser?.close();
  }
}

getDate();
