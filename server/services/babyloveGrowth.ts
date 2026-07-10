/**
 * BabyLoveGrowth.ai Integration Service
 * Fetches AI-generated sports betting blog articles and manages content.
 * 
 * API Docs: https://api.babylovegrowth.ai/api/integrations/v1/articles
 * Base URL: https://api.babylovegrowth.ai/api/integrations/v1
 */

import axios from "axios";

const BASE_URL = "https://api.babylovegrowth.ai/api/integrations/v1";
const API_KEY = process.env.BABYLOVEGROWTH_API_KEY;

export interface BabyLoveArticle {
  id: string;
  title: string;
  slug: string;
  content_html: string;
  content_markdown: string;
  meta_description: string;
  hero_image_url: string;
  jsonLd: string;
  created_at?: string;
  updated_at?: string;
}

export interface ArticleListResponse {
  articles: BabyLoveArticle[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Fetch articles from BabyLoveGrowth API
 */
export async function fetchBabyLoveArticles(
  limit: number = 50,
  offset: number = 0,
  topic?: string
): Promise<ArticleListResponse> {
  if (!API_KEY) {
    throw new Error("BABYLOVEGROWTH_API_KEY is not configured");
  }

  try {
    const params: Record<string, any> = {
      limit,
      offset,
    };

    if (topic) {
      params.topic = topic;
    }

    const response = await axios.get(`${BASE_URL}/articles`, {
      headers: {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
      },
      params,
      timeout: 30000,
    });

    return response.data;
  } catch (error: any) {
    console.error("[BabyLoveGrowth] Error fetching articles:", error.message);
    throw new Error(
      `Failed to fetch articles from BabyLoveGrowth: ${error.message}`
    );
  }
}

/**
 * Fetch a single article by ID
 */
export async function fetchBabyLoveArticleById(
  articleId: string
): Promise<BabyLoveArticle> {
  if (!API_KEY) {
    throw new Error("BABYLOVEGROWTH_API_KEY is not configured");
  }

  try {
    const response = await axios.get(`${BASE_URL}/articles/${articleId}`, {
      headers: {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    return response.data;
  } catch (error: any) {
    console.error(
      `[BabyLoveGrowth] Error fetching article ${articleId}:`,
      error.message
    );
    throw new Error(
      `Failed to fetch article from BabyLoveGrowth: ${error.message}`
    );
  }
}

/**
 * Generate articles on a specific topic
 * Returns a list of generated articles ready for publishing
 */
export async function generateBabyLoveArticles(
  topic: string,
  count: number = 5
): Promise<BabyLoveArticle[]> {
  if (!API_KEY) {
    throw new Error("BABYLOVEGROWTH_API_KEY is not configured");
  }

  try {
    const response = await axios.post(
      `${BASE_URL}/articles/generate`,
      {
        topic,
        count,
      },
      {
        headers: {
          "X-API-Key": API_KEY,
          "Content-Type": "application/json",
        },
        timeout: 60000, // Longer timeout for generation
      }
    );

    return response.data.articles || [];
  } catch (error: any) {
    console.error(
      `[BabyLoveGrowth] Error generating articles on "${topic}":`,
      error.message
    );
    throw new Error(
      `Failed to generate articles from BabyLoveGrowth: ${error.message}`
    );
  }
}

/**
 * Transform BabyLoveGrowth article to ChalkPicks blog post format
 */
export function transformToBlogPost(article: BabyLoveArticle) {
  return {
    title: article.title,
    slug: article.slug,
    excerpt: article.meta_description,
    content: article.content_markdown,
    contentHtml: article.content_html,
    heroImage: article.hero_image_url,
    seoDescription: article.meta_description,
    jsonLd: article.jsonLd,
    source: "babylovegrowth",
    sourceArticleId: article.id,
    publishedAt: article.created_at ? new Date(article.created_at) : new Date(),
  };
}
