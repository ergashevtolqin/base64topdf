const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const FormData = require('form-data');
const { PassThrough } = require('stream');
const app = express();

app.use(bodyParser.json({ limit: '50mb' }));

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

app.post('/asoki-pdf', async (req, res) => {
  try {
    const { base64, claimId } = req.body;

    if (!base64) {
      return res.status(400).json({ error: 'No base64 code provided' });
    }

    const decodedHtml = Buffer.from(base64, 'base64').toString('utf-8');

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(decodedHtml, { waitUntil: 'networkidle0' });

    await delay(5000);

    await page.waitForFunction('document.querySelector("#score_arrow").style.transform.includes("rotate")');

    const pdfBuffer = await page.pdf({ format: 'A4' });

    await browser.close();

    const form = new FormData();

    form.append('pdf-file', pdfBuffer, { filename: `${claimId}.pdf` });
    form.append('claimId', claimId);

    res.setHeader('Content-Type', `multipart/form-data; boundary=${form.getBoundary()}`);
    form.pipe(res);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.toString() });
  }
});

app.post('/base64topdf', async (req, res) => {
  try {
    const { base64 } = req.body;

    if (!base64) {
      return res.status(400).json({ error: 'No base64 code provided' });
    }

    const decodedHtml = Buffer.from(base64, 'base64').toString('utf-8');

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(decodedHtml, { waitUntil: 'networkidle0' });

    await delay(5000);

    const pdfBuffer = await page.pdf({ format: 'A4' });

    await browser.close();

    // res.setHeader('Content-Type', 'application/pdf');
    // res.setHeader('Content-Disposition', 'attachment; filename=output.pdf');
    // res.send(pdfBuffer);

    const form = new FormData();

    form.append('pdf-file', pdfBuffer, { filename: 'output.pdf' });

    res.setHeader('Content-Type', `multipart/form-data; boundary=${form.getBoundary()}`);
    form.pipe(res);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.toString() });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
