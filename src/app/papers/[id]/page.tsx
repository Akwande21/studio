

import { getPaperByIdFromFirestore } from '@/lib/data'; // Changed to Firestore
import { PaperDetailClient } from '@/components/papers/PaperDetailClient';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await (params as any);
  const paper = await getPaperByIdFromFirestore(resolvedParams.id); // Changed to Firestore
  if (!paper) {
    return {
      title: 'Paper Not Found',
    };
  }
  return {
    title: `${paper.title} - PaperVault`, // Changed App Name
    description: paper.description || `View and study the ${paper.subject} paper from ${paper.year}.`,
  };
}


export default async function PaperPage({ params }: { params: { id: string } }) {
  const paper = await getPaperByIdFromFirestore(params.id); // Changed to Firestore

  if (!paper) {
    notFound();
  }
  // Convert Timestamps to string for client component props
  const serializablePaper = {
    ...paper,
    createdAt: paper.createdAt.toDate().toISOString(),
    updatedAt: paper.updatedAt.toDate().toISOString(),
  };

  return <PaperDetailClient paper={serializablePaper} />;
}

