const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Fetch combined feed data from all AI sources (YouTube and Twitter)
 * @param {number} limit - Maximum number of items to fetch
 * @returns {Promise<Array>} Array of feed items
 */
export const fetchCombinedFeed = async (limit = 30) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/feed/combined-feed?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('Error fetching combined feed:', error);
    return [];
  }
};

/**
 * Fetch alerts from YouTube scraper
 * @param {number} limit - Maximum number of alerts to fetch
 * @returns {Promise<Array>} Array of YouTube alerts
 */
export const fetchYouTubeAlerts = async (limit = 20) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/feed/alerts?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('Error fetching YouTube alerts:', error);
    return [];
  }
};

/**
 * Fetch scraped data from Twitter scraper
 * @param {number} limit - Maximum number of items to fetch
 * @returns {Promise<Array>} Array of Twitter scraped data
 */
export const fetchTwitterData = async (limit = 20) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/feed/scraped-data?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('Error fetching Twitter data:', error);
    return [];
  }
};

/**
 * Format urgency level for display
 * @param {string} urgency - Urgency level
 * @returns {Object} Styling object for urgency
 */
export const getUrgencyStyle = (urgency) => {
  const urgencyLower = (urgency || '').toLowerCase();
  
  switch (urgencyLower) {
    case 'critical':
    case 'high':
      return {
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        borderColor: 'border-red-200',
        icon: '🔴'
      };
    case 'medium':
      return {
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-200',
        icon: '🟡'
      };
    case 'low':
      return {
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-200',
        icon: '🟢'
      };
    default:
      return {
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        borderColor: 'border-gray-200',
        icon: '⚪'
      };
  }
};

/**
 * Format sentiment for display
 * @param {string} sentiment - Sentiment value
 * @returns {Object} Styling object for sentiment
 */
export const getSentimentStyle = (sentiment) => {
  const sentimentLower = (sentiment || '').toLowerCase();
  
  switch (sentimentLower) {
    case 'panic':
    case 'panicked':
    case 'worried':
      return {
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
        icon: '😰'
      };
    case 'calm':
    case 'neutral':
      return {
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        icon: '😌'
      };
    case 'informative':
      return {
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        icon: '📢'
      };
    default:
      return {
        bgColor: 'bg-gray-50',
        textColor: 'text-gray-700',
        icon: '😐'
      };
  }
};

/**
 * Get source icon and label
 * @param {string} source - Source type
 * @returns {Object} Source display info
 */
export const getSourceInfo = (source) => {
  const s = source?.toLowerCase() || '';
  if (s.includes('gdacs')) {
    return {
      icon: '🚨',
      label: 'GDACS Alert',
      bgColor: 'bg-rose-50',
      textColor: 'text-rose-700'
    };
  }
  if (s.includes('ndtv') || s.includes('news')) {
    return {
      icon: '📰',
      label: 'Disaster News',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700'
    };
  }
  if (s.includes('reliefweb')) {
    return {
      icon: '🌐',
      label: 'ReliefWeb',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700'
    };
  }
  if (s.includes('youtube')) {
    return {
      icon: '📺',
      label: 'YouTube AI',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    };
  }
  if (s.includes('twitter')) {
    return {
      icon: '🐦',
      label: 'Social Intelligence',
      bgColor: 'bg-sky-50',
      textColor: 'text-sky-700'
    };
  }
  if (s.includes('citizen') || s.includes('report')) {
    return {
      icon: '📍',
      label: 'Citizen Report',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700'
    };
  }
  return {
    icon: '📡',
    label: 'Live AI Feed',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700'
  };
};
