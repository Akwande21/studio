import { getPaperById } from '@/lib/data';
import { PaperDetailClient } from '@/components/papers/PaperDetailClient';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const paper = await getPaperById(params.id);
  if (!paper) {
    return {
      title: 'Paper Not Found',
    };
  }
  return {
    title: `${paper.title} - PaperTrail`,
    description: paper.description || `View and study the ${paper.subject} paper from ${paper.year}.`,
  };
}


export default async function PaperPage({ params }: { params: { id: string } }) {
  const paper = await getPaperById(params.id);

  if (!paper) {
    notFound();
  }

  return <PaperDetailClient paper={paper} />;
}
