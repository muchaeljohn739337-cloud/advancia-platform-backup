import news from '@/lib/news.json';

export const dynamic = 'force-static';

export default function NewsPage() {
  const items = (news as any[]).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">News & Changelog</h1>
      <ul className="space-y-6">
        {items.map((n) => (
          <li key={n.id} className="border-b pb-4">
            <h2 className="text-lg font-medium">{n.title}</h2>
            <p className="text-sm text-gray-600">{new Date(n.publishedAt).toLocaleString()}</p>
            <p className="mt-2">{n.summary}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
