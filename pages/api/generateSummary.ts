import { NextApiRequest, NextApiResponse } from 'next';

if (!process.env.CLAUDE_API_KEY) {
  throw new Error('CLAUDE_API_KEY environment variable is not set');
}

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    console.error('Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { reviews } = req.body;

    if (!Array.isArray(reviews)) {
      console.error('Invalid reviews format:', typeof reviews);
      return res.status(400).json({ error: 'Reviews must be an array' });
    }

    const reviewsText = reviews.map(review => 
      `Rating: ${review.rating}\nReview: ${review.reviewText}`
    ).join('\n\n');

    const prompt = `Please analyze these Amazon product reviews and provide:
1. A concise summary of the overall sentiment
2. Key positive points mentioned
3. Any significant issues or complaints (if any)
4. An overall assessment of the product based on these reviews

Here are the reviews:

${reviewsText}`;

    console.log('Sending request to Claude API with prompt:', prompt);

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Claude API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`Failed to generate summary: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Claude API Response:', JSON.stringify(data, null, 2));

    if (!data.content || !Array.isArray(data.content)) {
      console.error('Unexpected API response format - no content array:', data);
      throw new Error('Invalid response format from Claude API');
    }

    const content = data.content[0];
    if (!content || typeof content.text !== 'string') {
      console.error('Unexpected API response format - invalid content:', content);
      throw new Error('Invalid content format from Claude API');
    }

    console.log('Successfully extracted summary:', content.text);
    return res.status(200).json({ summary: content.text });
  } catch (error: any) {
    console.error('Error generating summary:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    return res.status(500).json({ 
      error: error.message || 'Failed to generate summary',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 