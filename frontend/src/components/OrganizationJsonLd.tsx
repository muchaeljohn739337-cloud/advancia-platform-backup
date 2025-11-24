export default function OrganizationJsonLd() {
  const name = process.env.NEXT_PUBLIC_ORG_NAME;
  const url = process.env.NEXT_PUBLIC_ORG_URL;
  const logo = process.env.NEXT_PUBLIC_LOGO_URL;
  const sameAsRaw = process.env.NEXT_PUBLIC_ORG_SAMEAS || ''; // comma-separated URLs

  if (!name || !url) return null;

  const sameAs = sameAsRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const ratingValue = process.env.NEXT_PUBLIC_RATING_VALUE;
  const ratingCount = process.env.NEXT_PUBLIC_RATING_COUNT;

  const data: any = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo,
    sameAs,
  };

  if (ratingValue && ratingCount) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(ratingValue),
      ratingCount: Number(ratingCount),
    };
  }

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
