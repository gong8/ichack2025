// pages/api/scrapeReviews.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import * as cheerio from 'cheerio';

// template: 
// http://localhost:3000/api/scrapeReviews?url=
// format - http://localhost:3000/api/scrapeReviews?url=https://www.amazon.com/product-reviews/PRODUCT_ID
// http://localhost:3000/api/scrapeReviews?url=https://www.amazon.co.uk/SEASEVEN-Motivational-Waterbottle-Leak-Proof-Free，Bpa-Free/dp/B0CBFZF8TD/ref=sr_1_5?crid=2K5ZALCHT0E64&dib=eyJ2IjoiMSJ9.NrVMDOOGKm6tT-I7q9lbSVofipBVAspOYNCx_WTPXE1hzBCJ37ugbIUIQvjyXxje2QdUr3NFOMTkIF0LnGRQzdJQjBOH1dUAfG8byV946JWtiDG3SpIM2jR2Xk_bN9r-CaKwueypCBpvdtbx6CZRZnBWuP9H_z7JFh-VGgvCErr47ApfAxk2hSSGiOruvdydpjaLoQ88I6Na33EOvq78rPWdo0vpVcZho0fZE7HWZ1DrzXoRPn-DBF1txbOTtFRDQ9xbOeiR1GXkgtqreWVPFWk3ueWS41ERHf_ap3qv5ydS7U3qBWb9xrTx8ohHWf1eN6PRxFOak_a0uBd6X4VDCk6_qX_OEUy-mSb_XYOCt9_xld5FL2GXAkfVUYi4No3IW5x2sr1U5vhe_wiZrkmHUUWDVVo9Lu37z0X52m0SdBwN9sxtrUIktyHUtZ1S5FCB.EHqB17Ts80SP_BhF59trHVqj3QK1YLfqG9n2Q3_qUIM&dib_tag=se&keywords=water%2Bbottle&qid=1738419796&sprefix=water%2Bbottle%2Caps%2C69&sr=8-5&th=1


// https://www.amazon.co.uk/CORSAIR-Mechanical-Gaming-Keyboard-Palmrest/dp/B0CH8X8FGR/ref=sr_1_19?crid=3TUALFBC9S9CB&dib=eyJ2IjoiMSJ9.J0j5bsyX0obDFJxJrr6Hw2K8jeAndjrZfzQlAauuWctt8LQ-zzc6fpy-YXKOU3x6kbecvibxDjLNGXsRLeBOViYLWo_ImOzw7vpu4lv1dNVLcwIB1W2jP6fLewfR5GxAXMSdpitcwj5fvJ0Ojhzl4Js1qcS0AOKICI5D9YQ_oOqE2stF2_YcLKhrVublsl85iBmtQXoP0ipzSwtp51ti9YyNScZmwaY3g83LLYrO_VY.3Ng3uMUJ25k3O5YmMMrNXejj7eqGMi6SHEm5z4UbJTU&dib_tag=se&keywords=mechanical+keyboard&qid=1738421986&sprefix=m%2Caps%2C834&sr=8-19
// https://www.amazon.co.uk/Percent-Mechanical-Keyboard-Minimalist-Convenient/dp/B09J2DN86T/ref=sr_1_7?crid=3TUALFBC9S9CB&dib=eyJ2IjoiMSJ9.J0j5bsyX0obDFJxJrr6Hw2K8jeAndjrZfzQlAauuWctt8LQ-zzc6fpy-YXKOU3x6kbecvibxDjLNGXsRLeBOViYLWo_ImOzw7vpu4lv1dNVLcwIB1W2jP6fLewfR5GxAXMSdpitcwj5fvJ0Ojhzl4Js1qcS0AOKICI5D9YQ_oOqE2stF2_YcLKhrVublsl85iBmtQXoP0ipzSwtp51ti9YyNScZmwaY3g83LLYrO_VY.3Ng3uMUJ25k3O5YmMMrNXejj7eqGMi6SHEm5z4UbJTU&dib_tag=se&keywords=mechanical%2Bkeyboard&qid=1738421986&sprefix=m%2Caps%2C834&sr=8-7&th=1
// two good examples

interface Review {
  reviewText: string;
  rating: string;
  // Add any other fields you want to extract (e.g., title, author, date)
}

interface Data {
  reviews?: Review[];
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // Expecting a query parameter "url"
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'A valid URL is required as a query parameter.' });
  }

  try {
    // Make the HTTP request. Setting a common User-Agent can sometimes help avoid immediate blocks.
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36'
      }
    });

    // Load the HTML into Cheerio
    const $ = cheerio.load(html);

    // Initialize an array to hold reviews
    const reviews: Review[] = [];

    // **NOTE:** The selectors below are examples.
    // You’ll need to inspect the HTML structure of the specific Amazon review page you want to scrape.
    // For example, Amazon reviews might be contained in elements with classes like ".review" or ".a-section.review".
    $('.review').each((i, element) => {
      // Extract the review text and rating.
      // Adjust the selectors based on the actual structure.
      const reviewText = $(element)
        .find('.review-text-content span')
        .text()
        .trim();
      const rating = $(element)
        .find('.a-icon-alt')
        .text()
        .trim();

      // Only add if there is review text
      if (reviewText) {
        reviews.push({ reviewText, rating });
      }
    });

    return res.status(200).json({ reviews });
  } catch (error: any) {
    console.error('Error scraping reviews:', error.message);
    return res.status(500).json({ error: 'Error fetching reviews. Check the server logs for details.' });
  }
}