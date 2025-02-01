// pages/index.tsx
import { useState, FormEvent } from 'react';

interface Review {
  reviewText: string;
  rating: string;
  // Add other properties if needed
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!url) return;
    
    setLoading(true);
    setError(null);
    setReviews(null);

    try {
      // Call the API route. Make sure the URL parameter matches the one your API expects.
      const response = await fetch(`/api/scrapeReviews?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch reviews.');
      }
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setReviews(data.reviews);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>Amazon Reviews Scraper</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
        <label htmlFor="urlInput" style={{ marginRight: '0.5rem' }}>
          Enter Amazon Review URL:
        </label>
        <input
          type="text"
          id="urlInput"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.amazon.com/product-reviews/PRODUCT_ID"
          style={{ width: '400px', padding: '0.5rem' }}
        />
        <button type="submit" style={{ marginLeft: '0.5rem', padding: '0.5rem 1rem' }} disabled={loading}>
          {loading ? 'Scraping...' : 'Scrape Reviews'}
        </button>
      </form>
      
      {error && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {reviews && (
        <div>
          <h2>Scraped Reviews:</h2>
          {reviews.length > 0 ? (
            <ul>
              {reviews.map((review, index) => (
                <li key={index} style={{ marginBottom: '1rem', borderBottom: '1px solid #ccc', paddingBottom: '1rem' }}>
                  <p>
                    <strong>Rating:</strong> {review.rating}
                  </p>
                  <p>
                    <strong>Review:</strong> {review.reviewText}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No reviews found.</p>
          )}
        </div>
      )}
    </div>
  );
}