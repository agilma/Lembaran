import { redirect, notFound } from 'next/navigation';
import { readingsData } from '@/data/readings';

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return readingsData.map((reading) => ({
    slug: reading.slug,
  }));
}

export default async function ReadingLegacyDetailPage({ params }: Props) {
  const { slug } = await params;
  const reading = readingsData.find((item) => item.slug === slug);

  if (!reading) {
    notFound();
  }

  redirect(`/bacaan/${slug}`);
}
