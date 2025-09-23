import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDocByPath } from '@/lib/docs';
import { MarkdownRenderer } from '@/components/docs/markdown-renderer';
import { TableOfContents } from '@/components/docs/table-of-contents';

interface PageProps {
  params: Promise<{
    slug: string[];
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDocByPath(slug);

  if (!doc) {
    return {
      title: '页面未找到 | i8Relay 文档'
    };
  }

  return {
    title: `${doc.title} | i8Relay 文档`,
    description: doc.description || `i8Relay文档 - ${doc.title}`,
  };
}

export default async function DocPage({ params }: PageProps) {
  const { slug } = await params;
  const doc = getDocByPath(slug);

  if (!doc) {
    notFound();
  }

  return (
    <div className="relative">
      {/* 主要内容区域 - 保持原有最大宽度 */}
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <article className="prose prose-gray dark:prose-invert prose-lg max-w-none">
          <header className="mb-8 not-prose">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {doc.title}
            </h1>
            {doc.description && (
              <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                {doc.description}
              </p>
            )}
          </header>

          <div className="prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-code:text-blue-600 dark:prose-code:text-blue-400 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-pre:bg-gray-50 dark:prose-pre:bg-gray-800 prose-blockquote:border-l-blue-500 prose-table:text-gray-700 dark:prose-table:text-gray-300">
            <MarkdownRenderer content={doc.content} />
          </div>
        </article>
      </div>

      {/* 右侧浮动目录 - 绝对定位，不占用布局空间 */}
      <TableOfContents content={doc.content} />
    </div>
  );
}