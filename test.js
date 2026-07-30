const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
    protocolTimeout: 120000,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu"
    ]
  });

  console.log("Browser started");

  const page = await browser.newPage();

  console.log("Page created");

  await page.setContent("<h1>Hello RMS</h1>");

  console.log("Content loaded");

  await page.pdf({
    path: "test.pdf",
    format: "A4",
    printBackground: true,
  });

  console.log("PDF created");

  await browser.close();

  console.log("Done");
})();