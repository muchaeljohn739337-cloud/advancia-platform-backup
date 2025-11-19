import React from "react";
import TrustScoreComponent from "../components/TrustScoreComponent";
import "./TrustScoreDemoPage.css";

const TrustScoreDemoPage: React.FC = () => {
  return (
    <div className="trust-demo-page">
      <div className="demo-container">
        {/* Header */}
        <div className="demo-header">
          <h1>🔒 Advanced Trust Scoring System</h1>
          <p>
            Comprehensive domain trust analysis with real-time security scoring
          </p>
        </div>

        {/* Demo Components */}
        <div className="demo-grid">
          {/* High Trust Domain Example */}
          <div className="demo-section">
            <h2>✅ High Trust Domain Example</h2>
            <p>Established domain with excellent security practices</p>
            <TrustScoreComponent
              domain="google.com"
              showImprovementTasks={true}
              refreshInterval={30}
              className="demo-component"
            />
          </div>

          {/* Medium Trust Domain Example */}
          <div className="demo-section">
            <h2>⚠️ Medium Trust Domain Example</h2>
            <p>Decent security but room for improvement</p>
            <TrustScoreComponent
              domain="example.com"
              showImprovementTasks={true}
              refreshInterval={30}
              className="demo-component"
            />
          </div>

          {/* Low Trust Domain Example */}
          <div className="demo-section">
            <h2>⚠️ New/Unknown Domain Example</h2>
            <p>Recently registered domain with limited trust signals</p>
            <TrustScoreComponent
              domain="newdomain123.com"
              showImprovementTasks={true}
              refreshInterval={30}
              className="demo-component"
            />
          </div>
        </div>

        {/* Integration Guide */}
        <div className="integration-guide">
          <h2>🚀 Integration Guide</h2>

          <div className="code-section">
            <h3>Basic Usage</h3>
            <pre className="code-block">
              {`import TrustScoreComponent from './components/TrustScoreComponent';

function MyComponent() {
  return (
    <TrustScoreComponent 
      domain="your-domain.com"
      showImprovementTasks={true}
      refreshInterval={60}
    />
  );
}`}
            </pre>
          </div>

          <div className="code-section">
            <h3>Advanced Configuration</h3>
            <pre className="code-block">
              {`<TrustScoreComponent 
  domain="your-domain.com"
  apiBaseUrl="/api"                    // Custom API endpoint
  showImprovementTasks={true}          // Show security recommendations
  refreshInterval={30}                 // Auto-refresh every 30 minutes
  className="custom-styling"           // Custom CSS class
/>`}
            </pre>
          </div>

          <div className="props-table">
            <h3>Component Props</h3>
            <table>
              <thead>
                <tr>
                  <th>Prop</th>
                  <th>Type</th>
                  <th>Default</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>domain</code>
                  </td>
                  <td>string</td>
                  <td>required</td>
                  <td>Domain to analyze (e.g., "example.com")</td>
                </tr>
                <tr>
                  <td>
                    <code>apiBaseUrl</code>
                  </td>
                  <td>string</td>
                  <td>"/api"</td>
                  <td>Base URL for trust API endpoints</td>
                </tr>
                <tr>
                  <td>
                    <code>showImprovementTasks</code>
                  </td>
                  <td>boolean</td>
                  <td>true</td>
                  <td>Whether to display improvement recommendations</td>
                </tr>
                <tr>
                  <td>
                    <code>refreshInterval</code>
                  </td>
                  <td>number</td>
                  <td>60</td>
                  <td>Auto-refresh interval in minutes (0 to disable)</td>
                </tr>
                <tr>
                  <td>
                    <code>className</code>
                  </td>
                  <td>string</td>
                  <td>""</td>
                  <td>Additional CSS classes for styling</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Features Overview */}
        <div className="features-overview">
          <h2>✨ Key Features</h2>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Real-time Scoring</h3>
              <p>
                Dynamic trust scores based on SSL status, domain age, and
                security indicators
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Security Analysis</h3>
              <p>
                Comprehensive security checks including certificate validation
                and reputation analysis
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔧</div>
              <h3>Improvement Tasks</h3>
              <p>
                Actionable recommendations to enhance domain trust and security
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">↻</div>
              <h3>Auto-Refresh</h3>
              <p>Configurable auto-refresh intervals to keep data current</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Responsive Design</h3>
              <p>Mobile-first design that works perfectly on all devices</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3>Customizable</h3>
              <p>
                Flexible styling options and configuration for different use
                cases
              </p>
            </div>
          </div>
        </div>

        {/* API Endpoints Info */}
        <div className="api-info">
          <h2>🔗 API Endpoints</h2>

          <div className="endpoint-card">
            <h3>Trust Report</h3>
            <code>GET /api/trust/report?domain=example.com</code>
            <p>
              Returns comprehensive trust analysis including score, SSL status,
              and verification details
            </p>
          </div>

          <div className="endpoint-card">
            <h3>Improvement Tasks</h3>
            <code>GET /api/trust/improvement-tasks?domain=example.com</code>
            <p>
              Provides actionable security recommendations based on current
              trust status
            </p>
          </div>

          <div className="endpoint-card">
            <h3>Cache Refresh (Admin)</h3>
            <code>POST /api/trust/refresh</code>
            <p>
              Forces refresh of cached trust data (requires admin
              authentication)
            </p>
          </div>
        </div>

        {/* Trust Score Guide */}
        <div className="score-guide">
          <h2>📈 Trust Score Guide</h2>

          <div className="score-ranges">
            <div className="score-range verified">
              <div className="score-badge">85-100</div>
              <div className="score-details">
                <h4>Verified & Trusted</h4>
                <p>
                  Excellent security practices, valid certificates, established
                  domain
                </p>
              </div>
            </div>

            <div className="score-range pending">
              <div className="score-badge">70-84</div>
              <div className="score-details">
                <h4>Generally Safe</h4>
                <p>Good security foundation with minor improvements possible</p>
              </div>
            </div>

            <div className="score-range suspicious">
              <div className="score-badge">50-69</div>
              <div className="score-details">
                <h4>Some Concerns</h4>
                <p>
                  Mixed security signals, may need attention to improve trust
                </p>
              </div>
            </div>

            <div className="score-range high-risk">
              <div className="score-badge">0-49</div>
              <div className="score-details">
                <h4>High Risk</h4>
                <p>
                  Multiple security issues detected, immediate attention
                  required
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="demo-footer">
          <p>🔒 Powered by Scam Adviser API • Built with React & TypeScript</p>
        </div>
      </div>
    </div>
  );
};

export default TrustScoreDemoPage;
