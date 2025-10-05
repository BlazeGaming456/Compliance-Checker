import puppeteer from "puppeteer";
import Tesseract from "tesseract.js";
import fetch from "node-fetch";
import sharp from "sharp";
import * as cheerio from "cheerio";
import fs from "fs";

async function getData() {
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
      "https://www.amazon.in/Oreo-Cadbury-Family-Biscuit-Vanilla/dp/B09ZV4W4DF/ref=sr_1_5?crid=19SKCDCA87H23&dib=eyJ2IjoiMSJ9.UEZaFcOQ-net8SDvKusyzqBUCs-MMDCIADg-C7xoRiQELFZQE5OYlI1vUuNz_muHjXL2gbq3F0ksRKGTrHwaoL5bYoMLanCTNnI8LrOX3y3ZN91oginn8dkXSIwT2BEqPVdC4s7VXJynKlV6zXXMhwLjIjW2c88fpn5Ma0pyaaNrXos-fzcQRDiEjFYxbRgKoU_dt7I9jMKdjTW7YcXpML3K0kGfZBYEKtl4NZQ1YVo6LpnmQKTVTVEaFV8zH38-Y9wRVe58DnYdityPJ4rYS5xkCX-BYNK_0HdKUxuLS-Y.e3MEZNile4PRyy493ZE9rjgTAzzN4SpsmtoZjMaMg60&dib_tag=se&keywords=oreo+biscuit&qid=1759663302&sprefix=oreo+biscuit%2Caps%2C712&sr=8-5",
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

    // // 4. Product Images
    // const images = [];
    // $("#altImages img").each((i, el) => {
    //   const img = $(el).attr("src");
    //   if (img) images.push(img);
    // });

    // // 5. Main image
    // const mainImage = $("#imgTagWrapperId img").attr("src");

    const highResImages = [];

    // Loop through all thumbnails
    $("#altImages img").each((i, el) => {
      let imgUrl = $(el).attr("data-old-hires") || $(el).attr("src");

      // If src has low-res suffix, replace with _SL1500_ for high-res
      if (imgUrl) {
        imgUrl = imgUrl.replace(/_.*?\./, "_SL1500.");
        highResImages.push(imgUrl);
      }
    });

    // Also include the main product image
    const mainImg =
      $("#landingImage").attr("data-old-hires") ||
      $("#landingImage").attr("src");
    if (mainImg) {
      const highResMain = mainImg.replace(/_.*?\./, "_SL1500.");
      highResImages.unshift(highResMain); // Put main image first
    }

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
      highResImages
    });

    fs.writeFileSync("output.html", html);

    await browser?.close();
  } catch (err) {
    console.log(err);

    await browser?.close();
  }
}

async function getDataFromImage() {
  const imageUrl = "";
  const response = await fetch(
    "https://i.sstatic.net/IvV2y.png"
  );
  const buffer = await response.arrayBuffer();
  fs.writeFileSync("temp_original.png", Buffer.from(buffer));

  const processedBuffer = await sharp(Buffer.from(buffer)).resize({height:300}).grayscale().modulate({brightness:1.2}).toBuffer();

    fs.writeFileSync("temp_processed.png", processedBuffer);

  Tesseract.recognize("temp_processed.png", "eng").then(({ data: text }) => {
    console.log("Extracted Text: ", text.text);
  }).catch((err) => console.error("OCR Error: ", err));
}

//getData();
getDataFromImage();