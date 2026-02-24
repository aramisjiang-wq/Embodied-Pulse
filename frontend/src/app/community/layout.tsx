'use client';

import { CommunityErrorBoundary } from './CommunityErrorBoundary';

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CommunityErrorBoundary>{children}</CommunityErrorBoundary>;
}
