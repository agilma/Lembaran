import { notFound } from 'next/navigation';
import { readingsData } from '@/data/readings';
import { ReadingView } from '@/components/ReadingView';
import type { Metadata } from 'next';

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const reading = readingsData.find((item) => item.slug === slug);

  if (!reading) {
    return {
      title: 'Bacaan Tidak Ditemukan',
    };
  }

  return {
    title: reading.title,
    description: reading.description,
  };
}

export default async function ReadingDetailPage({ params }: Props) {
  const { slug } = await params;
  const reading = readingsData.find((item) => item.slug === slug);

  if (!reading) {
    notFound();
  }

  return <ReadingView reading={reading} />;
}
