import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleView } from "@/components/guides/Guides";
import { articleBySlug, articles } from "@/config/articles";
import { pageMetadata } from "@/lib/seo";

/** Only the guides in config/articles.ts exist; anything else is a real 404. */
export const dynamicParams = false;

export const generateStaticParams = () => articles.map((a) => ({ slug: a.slug }));

export async function generateMetadata({ params }: PageProps<"/guides/[slug]">): Promise<Metadata> {
  const article = articleBySlug((await params).slug);
  if (!article) return {};
  return pageMetadata({
    title: article.title,
    description: article.description,
    path: `/guides/${article.slug}`,
    article: { published: article.published, modified: article.updated },
  });
}

export default async function Page({ params }: PageProps<"/guides/[slug]">) {
  const { slug } = await params;
  if (!articleBySlug(slug)) notFound();
  return <ArticleView slug={slug} />;
}
