
import { getPaperById } from '@/lib/data';
import { PaperDetailClient } from '@/components/papers/PaperDetailClient';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // The runtime error "params should be awaited before using its properties"
  // suggests that the `params` object passed by Next.js/Turbopack might be
  // a thenable/awaitable proxy, even if its static type is just `{ id: string }`.
  // To satisfy this runtime check while also passing TypeScript's strict checks,
  // we cast `params` to `any` before awaiting it.
  const resolvedParams = await (params as any);

  const paper = await getPaperById(resolvedParams.id);
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
