// pages/index.tsx
import { useState, FormEvent } from 'react';
import {
  Box,
  Container,
  Heading,
  Input,
  Button,
  FormControl,
  VStack,
  Alert,
  AlertIcon,
  List,
  ListItem,
  Text,
  Divider,
  useColorModeValue,
  HStack,
  IconButton,
  Card,
  CardBody,
} from '@chakra-ui/react';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';

interface Review {
  reviewText: string;
  rating: string;
}

export default function Home() {
  // Separate states for different types of data
  const [urls, setUrls] = useState<string[]>(['']);
  const [reviews, setReviews] = useState<(Review[] | null)[]>([null]);
  const [loadingStates, setLoadingStates] = useState<boolean[]>([false]);
  const [errors, setErrors] = useState<(string | null)[]>([null]);
  const [summaries, setSummaries] = useState<(string | null)[]>([null]);

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const addUrlField = () => {
    setUrls(prevUrls => [...prevUrls, '']);
    setReviews(prevReviews => [...prevReviews, null]);
    setLoadingStates(prevLoadingStates => [...prevLoadingStates, false]);
    setErrors(prevErrors => [...prevErrors, null]);
    setSummaries(prevSummaries => [...prevSummaries, null]);
  };

  const removeUrlField = (index: number) => {
    if (urls.length > 1) {
      setUrls(prevUrls => {
        const newUrls = [...prevUrls];
        newUrls.splice(index, 1);
        return newUrls;
      });
      setReviews(prevReviews => {
        const newReviews = [...prevReviews];
        newReviews.splice(index, 1);
        return newReviews;
      });
      setLoadingStates(prevLoadingStates => {
        const newLoadingStates = [...prevLoadingStates];
        newLoadingStates.splice(index, 1);
        return newLoadingStates;
      });
      setErrors(prevErrors => {
        const newErrors = [...prevErrors];
        newErrors.splice(index, 1);
        return newErrors;
      });
      setSummaries(prevSummaries => {
        const newSummaries = [...prevSummaries];
        newSummaries.splice(index, 1);
        return newSummaries;
      });
    }
  };

  const updateUrl = (index: number, newUrl: string) => {
    setUrls(prevUrls => {
      const newUrls = [...prevUrls];
      newUrls[index] = newUrl;
      return newUrls;
    });
  };

  const generateSummary = async (reviewsData: Review[], index: number) => {
    try {
      console.log('Generating summary for reviews:', {
        reviewCount: reviewsData.length,
        index,
        firstReview: reviewsData[0]
      });

      const response = await fetch('/api/generateSummary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reviews: reviewsData }),
      });

      const responseText = await response.text();
      console.log('Raw response from summary API:', responseText);

      if (!response.ok) {
        console.error('Summary generation failed:', {
          status: response.status,
          statusText: response.statusText,
          response: responseText
        });
        throw new Error('Failed to generate summary');
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse summary response:', e);
        throw new Error('Invalid JSON response from summary API');
      }

      console.log('Parsed summary response:', data);

      if (!data.summary) {
        console.error('Invalid summary response - no summary field:', data);
        throw new Error('Invalid summary response format');
      }

      console.log('Setting summary for index:', index, 'Summary:', data.summary);
      setSummaries(prevSummaries => {
        const newSummaries = [...prevSummaries];
        newSummaries[index] = data.summary;
        return newSummaries;
      });
    } catch (error: any) {
      console.error('Error in generateSummary:', {
        message: error.message,
        stack: error.stack,
        reviews: reviewsData.length,
        index
      });
      setErrors(prevErrors => {
        const newErrors = [...prevErrors];
        newErrors[index] = `Failed to generate summary: ${error.message}`;
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      if (!url) {
        console.log('Skipping empty URL at index:', i);
        continue;
      }

      console.log('Processing URL:', url);
      
      // Reset states for this index
      setLoadingStates(prevLoadingStates => {
        const newLoadingStates = [...prevLoadingStates];
        newLoadingStates[i] = true;
        return newLoadingStates;
      });
      setErrors(prevErrors => {
        const newErrors = [...prevErrors];
        newErrors[i] = null;
        return newErrors;
      });
      setReviews(prevReviews => {
        const newReviews = [...prevReviews];
        newReviews[i] = null;
        return newReviews;
      });
      setSummaries(prevSummaries => {
        const newSummaries = [...prevSummaries];
        newSummaries[i] = null;
        return newSummaries;
      });

      try {
        const response = await fetch(`/api/scrapeReviews?url=${encodeURIComponent(url)}`);
        if (!response.ok) {
          const errorData = await response.text();
          console.error('Review scraping failed:', {
            status: response.status,
            statusText: response.statusText,
            url: url,
            error: errorData
          });
          throw new Error('Failed to fetch reviews.');
        }
        const data = await response.json();
        
        if (data.error) {
          console.error('Scraping error for URL:', {
            url: url,
            error: data.error
          });
          setLoadingStates(prevLoadingStates => {
            const newLoadingStates = [...prevLoadingStates];
            newLoadingStates[i] = false;
            return newLoadingStates;
          });
          setErrors(prevErrors => {
            const newErrors = [...prevErrors];
            newErrors[i] = data.error;
            return newErrors;
          });
        } else {
          console.log('Successfully fetched reviews:', {
            url: url,
            reviewCount: data.reviews?.length || 0
          });
          setLoadingStates(prevLoadingStates => {
            const newLoadingStates = [...prevLoadingStates];
            newLoadingStates[i] = false;
            return newLoadingStates;
          });
          setReviews(prevReviews => {
            const newReviews = [...prevReviews];
            newReviews[i] = data.reviews;
            return newReviews;
          });
          
          // Generate summary after getting reviews
          if (data.reviews && data.reviews.length > 0) {
            await generateSummary(data.reviews, i);
          } else {
            console.log('No reviews to summarize for URL:', url);
          }
        }
      } catch (err: any) {
        console.error('Error processing URL:', {
          url: url,
          message: err.message,
          stack: err.stack
        });
        setLoadingStates(prevLoadingStates => {
          const newLoadingStates = [...prevLoadingStates];
          newLoadingStates[i] = false;
          return newLoadingStates;
        });
        setErrors(prevErrors => {
          const newErrors = [...prevErrors];
          newErrors[i] = err.message || 'An unexpected error occurred.';
          return newErrors;
        });
      }
    }
  };

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading as="h1" size="xl" textAlign="center">
          Amazon Reviews Scraper
        </Heading>

        <Box as="form" onSubmit={handleSubmit}>
          <VStack spacing={4}>
            {urls.map((url, index) => (
              <FormControl key={index}>
                <HStack spacing={2}>
                  <Input
                    value={url}
                    onChange={(e) => updateUrl(index, e.target.value)}
                    placeholder="https://www.amazon.com/product-reviews/PRODUCT_ID"
                    size="lg"
                  />
                  {index === urls.length - 1 && (
                    <IconButton
                      icon={<AddIcon />}
                      aria-label="Add URL"
                      onClick={addUrlField}
                      colorScheme="green"
                    />
                  )}
                  {urls.length > 1 && (
                    <IconButton
                      icon={<MinusIcon />}
                      aria-label="Remove URL"
                      onClick={() => removeUrlField(index)}
                      colorScheme="red"
                    />
                  )}
                </HStack>
              </FormControl>
            ))}
            <Button
              type="submit"
              colorScheme="blue"
              isLoading={loadingStates.some(loading => loading)}
              loadingText="Scraping..."
              width="full"
            >
              Scrape All Reviews
            </Button>
          </VStack>
        </Box>

        {urls.map((url, index) => (
          <Box key={index}>
            {url && (
              <>
                <Heading as="h2" size="md" mb={4}>
                  Reviews for URL {index + 1}:
                </Heading>

                {errors[index] && (
                  <Alert status="error" mb={4}>
                    <AlertIcon />
                    {errors[index]}
                  </Alert>
                )}

                {summaries[index] && (
                  <Card mb={4} variant="outline">
                    <CardBody>
                      <Heading size="sm" mb={2}>AI-Generated Summary:</Heading>
                      <Text whiteSpace="pre-wrap">{summaries[index]}</Text>
                    </CardBody>
                  </Card>
                )}

                {reviews[index] && (
                  <Box mb={8}>
                    {reviews[index]!.length > 0 ? (
                      <List spacing={4}>
                        {reviews[index]!.map((review, reviewIndex) => (
                          <ListItem
                            key={reviewIndex}
                            p={4}
                            bg={bgColor}
                            borderRadius="md"
                            borderWidth="1px"
                            borderColor={borderColor}
                          >
                            <Text fontWeight="bold" mb={2}>
                              Rating: {review.rating}
                            </Text>
                            <Divider my={2} />
                            <Text>
                              Review: {review.reviewText}
                            </Text>
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Alert status="info">
                        <AlertIcon />
                        No reviews found.
                      </Alert>
                    )}
                  </Box>
                )}
              </>
            )}
          </Box>
        ))}
      </VStack>
    </Container>
  );
}