import React from 'react';
import { Header } from '../components/layout/header';
import { getDocsNavigation } from '@/lib/docs';
import { DocsSidebar } from '@/components/docs/docs-sidebar';
import BackToTop from '../components/BackToTop';

interface DocsLayoutProps {
  children: React.ReactNode;
}

export default function DocsLayout({ children }: DocsLayoutProps) {
  const navigation = getDocsNavigation();

  return (
    <div className="bg-white mt-6 dark:bg-gray-900 min-h-screen">
      <Header />
      <div className="pt-16">
        <div className="flex">
          <DocsSidebar sections={navigation} />
          <main className="flex-1 max-w-4xl mx-auto px-6 py-8 mt-12">
            {children}
          </main>
        </div>
      </div>
      <BackToTop />
    </div>
  );
}