'use client';

import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Review {
  id: string;
  stars: number;
  title: string | null;
  text: string;
  reviewerName: string;
  isVerified: boolean;
  reviewDate: string;
}

interface TrustpilotReviewsProps {
  limit?: number;
  showTitle?: boolean;
}

export default function TrustpilotReviews({ limit = 6, showTitle = true }: TrustpilotReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    averageRating: number;
    fiveStar: number;
    fourStar: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [limit]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/trustpilot/reviews?limit=${limit}`
      );
      const data = await response.json();

      if (data.success) {
        setReviews(data.reviews);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trustpilot/stats`);
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-5 h-5 ${
              i < rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-700 text-gray-700'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
        <p className="mt-4 text-gray-400">Loading reviews...</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return null;
  }

  return (
    <div className="py-12">
      {showTitle && (
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            Trusted by Our Community
          </h2>
          {stats && (
            <div className="flex items-center justify-center gap-4 text-gray-300">
              <div className="flex items-center gap-2">
                {renderStars(Math.round(stats.averageRating))}
                <span className="text-2xl font-bold text-white">
                  {stats.averageRating.toFixed(1)}
                </span>
              </div>
              <span className="text-gray-500">•</span>
              <span>
                {stats.total} review{stats.total !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-semibold text-white">{review.reviewerName}</p>
                <p className="text-sm text-gray-400">{formatDate(review.reviewDate)}</p>
              </div>
              {review.isVerified && (
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                  Verified
                </span>
              )}
            </div>

            {/* Rating */}
            <div className="mb-3">{renderStars(review.stars)}</div>

            {/* Title */}
            {review.title && <h3 className="font-semibold text-white mb-2">{review.title}</h3>}

            {/* Review Text */}
            <p className="text-gray-300 text-sm line-clamp-4">{review.text}</p>
          </div>
        ))}
      </div>

      {/* Trustpilot Badge */}
      <div className="mt-8 text-center">
        <a
          href={`https://www.trustpilot.com/review/${
            process.env.NEXT_PUBLIC_TRUSTPILOT_DOMAIN || ''
          }`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-purple-400 transition-colors"
        >
          <span>View all reviews on</span>
          <span className="font-semibold">Trustpilot</span>
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        </a>
      </div>
    </div>
  );
}
