import { notFound } from 'next/navigation';
import { getReadingBySlug, getReadingsList } from '@/app/actions/reading-management-actions';
import { ReadingView } from '@/components/ReadingView';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const response = await getReadingsList(false);
  const readings = response.data || [];
  return readings.map((reading) => ({
    slug: reading.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const reading = await getReadingBySlug(slug);

  if (!reading || reading.isArchived) {
    return {
      title: 'Bacaan Tidak Ditemukan',
    };
  }

  return {
    title: reading.title,
    description: reading.description,
  };
}

export default async function BacaanDetailPage({ params }: Props) {
  const { slug } = await params;
  const reading = await getReadingBySlug(slug);

  if (!reading || reading.isArchived) {
    notFound();
  }

  return <ReadingView reading={reading} />;
}
