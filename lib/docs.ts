import fs from 'fs';
import path from 'path';

export interface DocItem {
  title: string;
  slug: string;
  path: string;
  description?: string;
  content: string;
  frontmatter: Record<string, any>;
}

export interface DocSection {
  title: string;
  slug: string;
  items: DocItem[];
}

// 简单的frontmatter解析函数
function parseFrontmatter(content: string): { data: Record<string, any>; content: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { data: {}, content };
  }

  const [, frontmatterStr, markdownContent] = match;
  const data: Record<string, any> = {};

  // 简单解析YAML frontmatter
  frontmatterStr.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
      data[key] = value;
    }
  });

  return { data, content: markdownContent };
}

// 获取docs目录的根路径
const docsDirectory = path.join(process.cwd(), 'docs');

// 读取单个markdown文件
export function getDocBySlug(slug: string[]): DocItem | null {
  try {
    const fullPath = path.join(docsDirectory, ...slug) + '.md';

    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = parseFrontmatter(fileContents);

    return {
      title: data.title || slug[slug.length - 1],
      slug: slug.join('/'),
      path: `/docs/${slug.join('/')}`,
      description: data.description,
      content,
      frontmatter: data
    };
  } catch (error) {
    console.error('Error reading doc:', error);
    return null;
  }
}

// 扫描目录获取所有文档
export function getAllDocs(): DocSection[] {
  const sections: DocSection[] = [];

  try {
    if (!fs.existsSync(docsDirectory)) {
      return sections;
    }

    const sectionDirs = fs.readdirSync(docsDirectory, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const sectionDir of sectionDirs) {
      const sectionPath = path.join(docsDirectory, sectionDir);
      const items: DocItem[] = [];

      const files = fs.readdirSync(sectionPath)
        .filter(file => file.endsWith('.md'))
        .sort();

      for (const file of files) {
        const filePath = path.join(sectionPath, file);
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const { data, content } = parseFrontmatter(fileContents);

        const slug = file.replace('.md', '');
        items.push({
          title: data.title || slug,
          slug: `${sectionDir}/${slug}`,
          path: `/docs/${sectionDir}/${slug}`,
          description: data.description,
          content,
          frontmatter: data
        });
      }

      if (items.length > 0) {
        sections.push({
          title: formatSectionTitle(sectionDir),
          slug: sectionDir,
          items
        });
      }
    }

    return sections;
  } catch (error) {
    console.error('Error reading docs directory:', error);
    return sections;
  }
}

// 格式化章节标题
function formatSectionTitle(dirName: string): string {
  const titleMap: Record<string, string> = {
    'getting-started': 'Getting Started',
    'article': 'Article',
    'api': 'API Reference',
    'guides': 'Guides',
    'tutorials': 'Tutorials'
  };

  return titleMap[dirName] || dirName.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

// 获取导航数据
export function getDocsNavigation(): DocSection[] {
  return getAllDocs();
}

// 根据路径获取文档
export function getDocByPath(docPath: string[]): DocItem | null {
  return getDocBySlug(docPath);
}