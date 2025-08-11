import { createClient } from 'microcms-js-sdk';

// microCMSクライアントの設定
export const client = createClient({
  serviceDomain: import.meta.env.MICROCMS_SERVICE_DOMAIN,
  apiKey: import.meta.env.MICROCMS_API_KEY,
});

// ブログ記事の型定義
export interface BlogPost {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
  title: string;
  content: string;
  description?: string;
  image?: {
    url: string;
    height: number;
    width: number;
  };
  tags?: Tag[];
  category?: Category;
  draft?: boolean;
}

// カテゴリの型定義
export interface Category {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
  name: string;
  slug: string;
}

// タグの型定義
export interface Tag {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
  name: string;
  slug: string;
}

// microCMSのレスポンス型
export interface MicroCMSListResponse<T> {
  contents: T[];
  totalCount: number;
  offset: number;
  limit: number;
}

// ブログ記事一覧を取得
export async function getBlogPosts(options?: {
  limit?: number;
  offset?: number;
  filters?: string;
  orders?: string;
}): Promise<MicroCMSListResponse<BlogPost>> {
  return await client.get({
    endpoint: 'blogs',
    queries: {
      limit: options?.limit || 100,
      offset: options?.offset || 0,
      filters: options?.filters,
      orders: options?.orders || '-publishedAt',
    },
  });
}

// 特定のブログ記事を取得
export async function getBlogPost(contentId: string): Promise<BlogPost> {
  return await client.get({
    endpoint: 'blogs',
    contentId,
  });
}

// カテゴリ一覧を取得
export async function getCategories(): Promise<MicroCMSListResponse<Category>> {
  return await client.get({
    endpoint: 'categories',
    queries: {
      limit: 100,
    },
  });
}

// タグ一覧を取得
export async function getTags(): Promise<MicroCMSListResponse<Tag>> {
  return await client.get({
    endpoint: 'tags',
    queries: {
      limit: 100,
    },
  });
}