'use client';

import TrustpilotWidgetEmbedded from './TrustpilotWidgetEmbedded';

/**
 * Trustpilot Widget Showcase
 * Displays all available Trustpilot widget templates
 * Use this as a reference for which widget to use where
 */
export default function TrustpilotWidgetShowcase() {
  return (
    <div className="space-y-12 py-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">Trustpilot Widget Templates</h2>
        <p className="text-gray-400">Choose the widget that best fits your design</p>
      </div>

      {/* Mini Widget - Best for Headers/Footers */}
      <section className="border border-gray-700 rounded-lg p-6 bg-gray-900">
        <h3 className="text-xl font-semibold mb-3">Mini Star Widget</h3>
        <p className="text-gray-400 mb-4">Perfect for: Headers, footers, navigation bars</p>
        <TrustpilotWidgetEmbedded template="mini" height={24} width={150} theme="dark" />
        <pre className="mt-4 bg-gray-800 p-3 rounded text-sm overflow-x-auto">
          {`<TrustpilotWidgetEmbedded template="mini" height={24} width={150} />`}
        </pre>
      </section>

      {/* Micro Widget */}
      <section className="border border-gray-700 rounded-lg p-6 bg-gray-900">
        <h3 className="text-xl font-semibold mb-3">Micro Review Count</h3>
        <p className="text-gray-400 mb-4">Perfect for: Sidebars, compact spaces</p>
        <TrustpilotWidgetEmbedded template="micro" height={20} width={120} theme="dark" />
        <pre className="mt-4 bg-gray-800 p-3 rounded text-sm overflow-x-auto">
          {`<TrustpilotWidgetEmbedded template="micro" height={20} width={120} />`}
        </pre>
      </section>

      {/* Quote Widget */}
      <section className="border border-gray-700 rounded-lg p-6 bg-gray-900">
        <h3 className="text-xl font-semibold mb-3">Single Quote Widget</h3>
        <p className="text-gray-400 mb-4">Perfect for: Landing pages, hero sections</p>
        <TrustpilotWidgetEmbedded template="quote" height={240} width="100%" theme="dark" />
        <pre className="mt-4 bg-gray-800 p-3 rounded text-sm overflow-x-auto">
          {`<TrustpilotWidgetEmbedded template="quote" height={240} width="100%" />`}
        </pre>
      </section>

      {/* Carousel Widget */}
      <section className="border border-gray-700 rounded-lg p-6 bg-gray-900">
        <h3 className="text-xl font-semibold mb-3">Review Carousel</h3>
        <p className="text-gray-400 mb-4">Perfect for: Homepage, about page</p>
        <TrustpilotWidgetEmbedded
          template="carousel"
          height={350}
          width="100%"
          theme="dark"
          stars="5"
        />
        <pre className="mt-4 bg-gray-800 p-3 rounded text-sm overflow-x-auto">
          {`<TrustpilotWidgetEmbedded template="carousel" height={350} width="100%" stars="5" />`}
        </pre>
      </section>

      {/* List Widget */}
      <section className="border border-gray-700 rounded-lg p-6 bg-gray-900">
        <h3 className="text-xl font-semibold mb-3">Review List</h3>
        <p className="text-gray-400 mb-4">Perfect for: Reviews page, testimonials section</p>
        <TrustpilotWidgetEmbedded template="list" height={500} width="100%" theme="dark" />
        <pre className="mt-4 bg-gray-800 p-3 rounded text-sm overflow-x-auto">
          {`<TrustpilotWidgetEmbedded template="list" height={500} width="100%" />`}
        </pre>
      </section>

      {/* Grid Widget */}
      <section className="border border-gray-700 rounded-lg p-6 bg-gray-900">
        <h3 className="text-xl font-semibold mb-3">Review Grid</h3>
        <p className="text-gray-400 mb-4">Perfect for: Wide sections, landing pages</p>
        <TrustpilotWidgetEmbedded template="grid" height={500} width="100%" theme="dark" />
        <pre className="mt-4 bg-gray-800 p-3 rounded text-sm overflow-x-auto">
          {`<TrustpilotWidgetEmbedded template="grid" height={500} width="100%" />`}
        </pre>
      </section>

      {/* Custom Template */}
      <section className="border border-gray-700 rounded-lg p-6 bg-gray-900">
        <h3 className="text-xl font-semibold mb-3">Custom Template</h3>
        <p className="text-gray-400 mb-4">Use your own template ID from Trustpilot</p>
        <TrustpilotWidgetEmbedded
          template="custom"
          customTemplateId="74ecde4d46d4b399c7295cf599d2886b"
          height={300}
          width="100%"
          theme="dark"
        />
        <pre className="mt-4 bg-gray-800 p-3 rounded text-sm overflow-x-auto">
          {`<TrustpilotWidgetEmbedded 
  template="custom" 
  customTemplateId="74ecde4d46d4b399c7295cf599d2886b"
  height={300}
  width="100%"
/>`}
        </pre>
      </section>

      {/* Usage Tips */}
      <section className="border border-purple-500/30 rounded-lg p-6 bg-purple-900/10">
        <h3 className="text-xl font-semibold mb-3 text-purple-400">💡 Usage Tips</h3>
        <ul className="space-y-2 text-gray-300">
          <li>
            • <strong>Theme:</strong> Use <code>theme="dark"</code> for dark backgrounds,{' '}
            <code>theme="light"</code> for light backgrounds
          </li>
          <li>
            • <strong>Stars Filter:</strong> Use <code>stars="5"</code> to show only 5-star reviews
          </li>
          <li>
            • <strong>Height/Width:</strong> Use <code>height="auto"</code> or{' '}
            <code>width="100%"</code> for responsive sizing
          </li>
          <li>
            • <strong>Locale:</strong> Set <code>locale="en-US"</code> for language (default is
            en-US)
          </li>
          <li>
            • <strong>Custom Template:</strong> Get your template ID from Trustpilot Business Portal
            → Integrations
          </li>
        </ul>
      </section>

      {/* Recommended Placements */}
      <section className="border border-blue-500/30 rounded-lg p-6 bg-blue-900/10">
        <h3 className="text-xl font-semibold mb-3 text-blue-400">📍 Recommended Placements</h3>
        <div className="grid md:grid-cols-2 gap-4 text-gray-300">
          <div>
            <h4 className="font-semibold mb-2">Homepage</h4>
            <ul className="space-y-1 text-sm">
              <li>• Hero: Quote or Mini widget</li>
              <li>• Middle: Carousel widget</li>
              <li>• Footer: Mini widget</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Reviews Page</h4>
            <ul className="space-y-1 text-sm">
              <li>• Main: List or Grid widget</li>
              <li>• Sidebar: Mini widget</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Product/Service Page</h4>
            <ul className="space-y-1 text-sm">
              <li>• Top: Mini widget</li>
              <li>• Bottom: Carousel widget</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Checkout/Pricing</h4>
            <ul className="space-y-1 text-sm">
              <li>• Sidebar: Quote widget</li>
              <li>• Trust badges: Mini widget</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
