import { redirect, notFound } from 'next/navigation';
import { getReadingBySlug, getReadingsList } from '@/app/actions/reading-management-actions';

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

export default async function ReadingLegacyDetailPage({ params }: Props) {
  const { slug } = await params;
  const reading = await getReadingBySlug(slug);

  if (!reading || reading.isArchived) {
    notFound();
  }

  redirect(`/bacaan/${slug}`);
}
