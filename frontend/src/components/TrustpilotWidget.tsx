'use client';
import { useEffect } from 'react';

type Props = {
  businessUnitId?: string;
  locale?: string; // e.g., "en-US"
  theme?: 'light' | 'dark';
  templateId?: string; // Trustpilot widget template id
  height?: number;
  width?: number | string;
};

export default function TrustpilotWidget({
  businessUnitId = process.env.NEXT_PUBLIC_TRUSTPILOT_BUSINESS_UNIT_ID || '',
  locale = 'en-US',
  theme = 'light',
  templateId = '5419b6a8b0d04a076446a9ad', // Business Unit Stars
  height = 24,
  width = 120,
}: Props) {
  useEffect(() => {
    if (!businessUnitId) return;
    const id = 'trustpilot-script';
    if (document.getElementById(id)) {
      // Re-render widgets on route changes
      (window as any).Trustpilot?.loadFromElement?.(document.body);
      return;
    }
    const s = document.createElement('script');
    s.id = id;
    s.async = true;
    s.src = 'https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js';
    document.body.appendChild(s);
  }, [businessUnitId]);

  if (!businessUnitId) return null;

  return (
    <div
      className="trustpilot-widget"
      data-locale={locale}
      data-template-id={templateId}
      data-businessunit-id={businessUnitId}
      data-theme={theme}
      data-style-height={String(height)}
      data-style-width={String(width)}
    >
      <a
        href={`https://www.trustpilot.com/review/${
          process.env.NEXT_PUBLIC_TRUSTPILOT_DOMAIN || ''
        }`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Trustpilot
      </a>
    </div>
  );
}
