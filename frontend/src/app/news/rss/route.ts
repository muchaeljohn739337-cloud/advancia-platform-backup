import news from '@/lib/news.json';
import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function GET() {
  const items = (news as any[]).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const site = process.env.NEXT_PUBLIC_ORG_URL || '';
  const rssItems = items
    .map(
      (n) => `
  <item>
    <title><![CDATA[${n.title}]]></title>
    <link>${site.replace(/\/$/, '')}${n.url || '/news'}</link>
    <description><![CDATA[${n.summary}]]></description>
    <pubDate>${new Date(n.publishedAt).toUTCString()}</pubDate>
    <guid>${n.id}</guid>
  </item>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Project News</title>
    <link>${site}</link>
    <description>Latest updates and releases</description>
    ${rssItems}
  </channel>
  </rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
