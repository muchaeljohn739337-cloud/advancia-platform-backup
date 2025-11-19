import React, { useEffect, useState } from "react";
import "./TrustScoreComponent.css";

// Type definitions for API responses
interface TrustReport {
  success: boolean;
  domain: string;
  scamAdviserScore: number;
  sslValid: boolean;
  verifiedBusiness: boolean;
  status: "verified" | "pending" | "suspicious" | "high-risk";
  domainAgeMonths: number;
  lastChecked: string;
}

interface ImprovementTask {
  id: string;
  priority: "low" | "medium" | "high";
  description: string;
  actionRequired: string;
}

interface ImprovementTasks {
  success: boolean;
  domain: string;
  currentScore: number;
  tasks: ImprovementTask[];
  totalTasks: number;
  highPriority: number;
  lastChecked: string;
}

interface TrustScoreComponentProps {
  domain: string;
  apiBaseUrl?: string;
  showImprovementTasks?: boolean;
  refreshInterval?: number; // in minutes
  className?: string;
}

const TrustScoreComponent: React.FC<TrustScoreComponentProps> = ({
  domain,
  apiBaseUrl = "/api",
  showImprovementTasks = true,
  refreshInterval = 60, // 60 minutes default
  className = "",
}) => {
  // State management
  const [trustData, setTrustData] = useState<TrustReport | null>(null);
  const [improvementTasks, setImprovementTasks] =
    useState<ImprovementTasks | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fetch trust report
  const fetchTrustReport = async () => {
    try {
      const response = await fetch(
        `${apiBaseUrl}/trust/report?domain=${encodeURIComponent(domain)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch trust report");
      }

      return data;
    } catch (err) {
      console.error("Trust report fetch error:", err);
      throw err;
    }
  };

  // Fetch improvement tasks
  const fetchImprovementTasks = async () => {
    try {
      const response = await fetch(
        `${apiBaseUrl}/trust/improvement-tasks?domain=${encodeURIComponent(
          domain
        )}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch improvement tasks");
      }

      return data;
    } catch (err) {
      console.error("Improvement tasks fetch error:", err);
      throw err;
    }
  };

  // Load all data
  const loadData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(null);

      // Fetch trust report
      const trustReport = await fetchTrustReport();
      setTrustData(trustReport);

      // Fetch improvement tasks if enabled
      if (showImprovementTasks) {
        try {
          const tasks = await fetchImprovementTasks();
          setImprovementTasks(tasks);
        } catch (taskErr) {
          console.warn("Could not load improvement tasks:", taskErr);
          // Don't fail the whole component if tasks can't load
        }
      }

      setLastUpdate(new Date());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load trust data"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Manual refresh function
  const refreshData = () => {
    if (!refreshing) {
      loadData(false);
    }
  };

  // Initial data load
  useEffect(() => {
    if (domain) {
      loadData();
    }
  }, [domain]);

  // Auto-refresh interval
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        loadData(false);
      }, refreshInterval * 60 * 1000); // Convert minutes to milliseconds

      return () => clearInterval(interval);
    }
  }, [refreshInterval, domain]);

  // Helper functions
  const getScoreColor = (score: number): string => {
    if (score >= 85) return "#28a745"; // Green
    if (score >= 70) return "#ffc107"; // Yellow
    if (score >= 50) return "#fd7e14"; // Orange
    return "#dc3545"; // Red
  };

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case "verified":
        return "status-badge status-verified";
      case "pending":
        return "status-badge status-pending";
      case "suspicious":
        return "status-badge status-suspicious";
      case "high-risk":
        return "status-badge status-high-risk";
      default:
        return "status-badge";
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case "high":
        return "#dc3545";
      case "medium":
        return "#ffc107";
      case "low":
        return "#28a745";
      default:
        return "#6c757d";
    }
  };

  const formatLastUpdate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} minutes ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;

    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  // Render loading state
  if (loading) {
    return (
      <div className={`trust-score-component loading ${className}`}>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Analyzing domain trust...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={`trust-score-component error ${className}`}>
        <div className="error-content">
          <h3>⚠️ Unable to Load Trust Data</h3>
          <p>{error}</p>
          <button onClick={() => loadData()} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render main component
  return (
    <div className={`trust-score-component ${className}`}>
      {/* Header */}
      <div className="trust-header">
        <div className="domain-info">
          <h2 className="domain-name">{domain}</h2>
          <span className={getStatusBadgeClass(trustData?.status || "")}>
            {trustData?.status?.toUpperCase()}
          </span>
        </div>

        <div className="refresh-controls">
          {lastUpdate && (
            <span className="last-update">
              Updated {formatLastUpdate(lastUpdate)}
            </span>
          )}
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="refresh-button"
          >
            {refreshing ? "🔄" : "↻"} Refresh
          </button>
        </div>
      </div>

      {/* Main Trust Score */}
      <div className="trust-score-main">
        <div className="score-circle">
          <svg viewBox="0 0 100 100" className="score-svg">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#e9ecef"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={getScoreColor(trustData?.scamAdviserScore || 0)}
              strokeWidth="8"
              strokeDasharray={`${
                (trustData?.scamAdviserScore || 0) * 2.827
              }, 282.7`}
              strokeDashoffset="70.675"
              className="score-progress"
            />
          </svg>
          <div className="score-text">
            <span className="score-number">{trustData?.scamAdviserScore}</span>
            <span className="score-total">/100</span>
          </div>
        </div>

        <div className="trust-details">
          <h3>Trust Score Breakdown</h3>

          <div className="detail-item">
            <span className="detail-label">SSL Certificate</span>
            <span
              className={`detail-value ${
                trustData?.sslValid ? "positive" : "negative"
              }`}
            >
              {trustData?.sslValid ? "✅ Valid" : "❌ Invalid"}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Business Verification</span>
            <span
              className={`detail-value ${
                trustData?.verifiedBusiness ? "positive" : "neutral"
              }`}
            >
              {trustData?.verifiedBusiness ? "✅ Verified" : "⏳ Pending"}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Domain Age</span>
            <span className="detail-value">
              {trustData?.domainAgeMonths} months
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Last Checked</span>
            <span className="detail-value">
              {trustData?.lastChecked
                ? new Date(trustData.lastChecked).toLocaleDateString()
                : "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* Improvement Tasks */}
      {showImprovementTasks &&
        improvementTasks &&
        improvementTasks.tasks.length > 0 && (
          <div className="improvement-tasks">
            <div className="tasks-header">
              <h3>🔧 Improvement Recommendations</h3>
              <div className="tasks-summary">
                <span className="task-count">
                  {improvementTasks.totalTasks} tasks
                </span>
                {improvementTasks.highPriority > 0 && (
                  <span className="high-priority-count">
                    {improvementTasks.highPriority} high priority
                  </span>
                )}
              </div>
            </div>

            <div className="tasks-list">
              {improvementTasks.tasks.map((task, index) => (
                <div key={task.id} className="task-item">
                  <div className="task-header">
                    <span
                      className={`task-priority ${task.priority.toLowerCase()}`}
                    >
                      ● {task.priority.toUpperCase()}
                    </span>
                    <h4 className="task-title">{task.description}</h4>
                  </div>
                  <p className="task-action">{task.actionRequired}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Trust Score Legend */}
      <div className="trust-legend">
        <h4>Trust Score Guide</h4>
        <div className="legend-items">
          <div className="legend-item">
            <span
              className="legend-color"
              style={{ backgroundColor: "#28a745" }}
            ></span>
            <span>85-100: Verified & Trusted</span>
          </div>
          <div className="legend-item">
            <span
              className="legend-color"
              style={{ backgroundColor: "#ffc107" }}
            ></span>
            <span>70-84: Generally Safe</span>
          </div>
          <div className="legend-item">
            <span
              className="legend-color"
              style={{ backgroundColor: "#fd7e14" }}
            ></span>
            <span>50-69: Some Concerns</span>
          </div>
          <div className="legend-item">
            <span
              className="legend-color"
              style={{ backgroundColor: "#dc3545" }}
            ></span>
            <span>0-49: High Risk</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustScoreComponent;
