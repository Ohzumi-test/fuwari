import type { BlogPost, Category, Tag } from '@/lib/microcms';
import { getBlogPosts, getCategories, getTags } from '@/lib/microcms';
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { getCategoryUrl, getTagUrl } from "@utils/url-utils.ts";

// microCMSの記事をAstroのCollectionEntry形式に変換
export function convertBlogPostToCollectionEntry(post: BlogPost) {
  return {
    id: post.id,
    slug: post.id,
    body: post.content,
    collection: 'posts' as const,
    data: {
      title: post.title,
      published: new Date(post.publishedAt),
      updated: post.updatedAt ? new Date(post.updatedAt) : undefined,
      description: post.description || '',
      image: post.image?.url || '',
      tags: post.tags?.map(tag => tag.name) || [],
      category: post.category?.name || null,
      draft: post.draft || false,
      lang: '',
      prevTitle: '',
      prevSlug: '',
      nextTitle: '',
      nextSlug: '',
    },
    render: async () => ({
      Content: () => ({ $$render: () => post.content }),
      headings: [],
      remarkPluginFrontmatter: {
        excerpt: post.description || '',
        words: post.content.split(' ').length,
        minutes: Math.max(1, Math.round(post.content.split(' ').length / 200)),
      },
    }),
  };
}

// ソート済みの記事一覧を取得（microCMSから）
export async function getSortedPosts() {
  const response = await getBlogPosts({
    orders: '-publishedAt',
    filters: import.meta.env.PROD ? 'draft[equals]false' : undefined,
  });

  const posts = response.contents.map(convertBlogPostToCollectionEntry);

  // 前後の記事のリンクを設定
  for (let i = 1; i < posts.length; i++) {
    posts[i].data.nextSlug = posts[i - 1].slug;
    posts[i].data.nextTitle = posts[i - 1].data.title;
  }
  for (let i = 0; i < posts.length - 1; i++) {
    posts[i].data.prevSlug = posts[i + 1].slug;
    posts[i].data.prevTitle = posts[i + 1].data.title;
  }

  return posts;
}

// 記事一覧（簡易版）を取得
export async function getSortedPostsList() {
  const response = await getBlogPosts({
    orders: '-publishedAt',
    filters: import.meta.env.PROD ? 'draft[equals]false' : undefined,
  });

  return response.contents.map(post => ({
    slug: post.id,
    data: {
      title: post.title,
      published: new Date(post.publishedAt),
      updated: post.updatedAt ? new Date(post.updatedAt) : undefined,
      description: post.description || '',
      image: post.image?.url || '',
      tags: post.tags?.map(tag => tag.name) || [],
      category: post.category?.name || null,
      draft: post.draft || false,
      lang: '',
      prevTitle: '',
      prevSlug: '',
      nextTitle: '',
      nextSlug: '',
    },
  }));
}

// タグ一覧を取得（カウント付き）
export async function getTagList() {
  const [postsResponse, tagsResponse] = await Promise.all([
    getBlogPosts({
      filters: import.meta.env.PROD ? 'draft[equals]false' : undefined,
    }),
    getTags(),
  ]);

  const countMap: { [key: string]: number } = {};
  
  // 各記事のタグをカウント
  postsResponse.contents.forEach(post => {
    post.tags?.forEach(tag => {
      if (!countMap[tag.name]) countMap[tag.name] = 0;
      countMap[tag.name]++;
    });
  });

  // タグをアルファベット順にソート
  const sortedTags = Object.keys(countMap).sort((a, b) => {
    return a.toLowerCase().localeCompare(b.toLowerCase());
  });

  return sortedTags.map(tagName => ({
    name: tagName,
    count: countMap[tagName],
  }));
}

// カテゴリ一覧を取得（カウント付き）
export async function getCategoryList() {
  const [postsResponse, categoriesResponse] = await Promise.all([
    getBlogPosts({
      filters: import.meta.env.PROD ? 'draft[equals]false' : undefined,
    }),
    getCategories(),
  ]);

  const countMap: { [key: string]: number } = {};
  
  // 各記事のカテゴリをカウント
  postsResponse.contents.forEach(post => {
    if (!post.category) {
      const ucKey = i18n(I18nKey.uncategorized);
      countMap[ucKey] = countMap[ucKey] ? countMap[ucKey] + 1 : 1;
      return;
    }

    const categoryName = post.category.name.trim();
    countMap[categoryName] = countMap[categoryName] ? countMap[categoryName] + 1 : 1;
  });

  // カテゴリをアルファベット順にソート
  const sortedCategories = Object.keys(countMap).sort((a, b) => {
    return a.toLowerCase().localeCompare(b.toLowerCase());
  });

  return sortedCategories.map(categoryName => ({
    name: categoryName,
    count: countMap[categoryName],
    url: getCategoryUrl(categoryName),
  }));
}

// 特定の記事を取得
export async function getBlogPostBySlug(slug: string) {
  const post = await getBlogPost(slug);
  return convertBlogPostToCollectionEntry(post);
}