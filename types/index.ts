export interface Review {
    title: string;
    rating: number;
    date: string;
    text: string;
    helpful: string;
}

export interface ScrapeRequest {
    url: string;
}

export interface ScrapeResponse {
    reviews: Review[];
}

export interface ErrorResponse {
    message: string;
    error?: string;
}