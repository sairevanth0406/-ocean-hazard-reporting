import React, { useState, useEffect, useRef } from 'react';
import {
  Heart, MessageCircle, AlertTriangle, MapPin,
  Clock, Users, Send, X, Plus, RefreshCw, ChevronDown, ChevronUp,
  Rss, ExternalLink
} from 'lucide-react';
import api from '../../utils/api';

const CATEGORIES = ['All', 'General', 'Safety Alert', 'Hazard', 'Diving', 'Surfing', 'Fishing', 'Weather'];

function timeAgo(isoStr) {
  if (!isoStr) return '';
  // Ensure the string is treated as UTC if no timezone info present
  const normalized = isoStr.endsWith('Z') || isoStr.includes('+') ? isoStr : isoStr + 'Z';
  const diff = (Date.now() - new Date(normalized).getTime()) / 1000;
  if (diff < 5) return 'just now';
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function categoryColor(cat) {
  const map = {
    'Safety Alert': 'bg-red-100 text-red-800',
    'Hazard': 'bg-orange-100 text-orange-800',
    'Diving': 'bg-blue-100 text-blue-800',
    'Surfing': 'bg-teal-100 text-teal-800',
    'Fishing': 'bg-green-100 text-green-800',
    'Weather': 'bg-purple-100 text-purple-800',
  };
  return map[cat] || 'bg-gray-100 text-gray-700';
}

// ── New Post Modal ──────────────────────────────────────────────────────────
function NewPostModal({ onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) { setError('Title and content are required.'); return; }
    setSubmitting(true); setError('');
    try {
      const { data } = await api.post('/community/posts', { title, content, category, location });
      onCreated(data); onClose();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to create post.');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-gray-900">New Community Post</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="What's happening near the coast?"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              maxLength={300} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
            <textarea value={content} onChange={e => setContent(e.target.value)}
              placeholder="Share details, observations, or ask the community..."
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 resize-none"
              maxLength={2000} />
            <p className="text-xs text-gray-400 text-right mt-1">{content.length}/2000</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location (optional)</label>
              <input value={location} onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Marina Beach"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                maxLength={255} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
            <button type="submit" disabled={submitting}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Comment Section ─────────────────────────────────────────────────────────
function CommentSection({ postId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/community/posts/${postId}/comments`)
      .then(r => setComments(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/community/posts/${postId}/comments`, { content: text });
      setComments(prev => [...prev, data]);
      setText('');
    } catch {}
    setSubmitting(false);
  };

  return (
    <div className="mt-4 border-t pt-4">
      {loading ? (
        <p className="text-xs text-gray-400">Loading comments...</p>
      ) : (
        <div className="space-y-3 mb-3 max-h-48 overflow-y-auto">
          {comments.length === 0 && <p className="text-xs text-gray-400">No comments yet. Be the first!</p>}
          {comments.map(c => (
            <div key={c.id} className="flex gap-2">
              <div className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                {c.author_initials}
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-gray-800">{c.author_name}</span>
                  <span className="text-xs text-gray-400">{timeAgo(c.created_at)}</span>
                </div>
                <p className="text-sm text-gray-700">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input value={text} onChange={e => setText(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400"
          maxLength={1000} />
        <button type="submit" disabled={submitting || !text.trim()}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

// ── Post Card ───────────────────────────────────────────────────────────────
function PostCard({ post, onLike }) {
  const [showComments, setShowComments] = useState(false);
  const isAlert = post.category === 'Safety Alert' || post.category === 'Hazard';

  return (
    <div className={`bg-white rounded-xl shadow-sm p-5 ${isAlert ? 'border-l-4 border-red-500' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
            {post.author_initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 text-sm">{post.author_name}</span>
              {post.author_role === 'official' && (
                <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">Official</span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(post.created_at)}</span>
              {post.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{post.location}</span>}
            </div>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${categoryColor(post.category)}`}>
          {post.category}
        </span>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1 text-left">{post.title}</h3>
      <p className="text-gray-700 text-sm leading-relaxed text-left">{post.content}</p>
      <div className="flex items-center gap-5 mt-4 text-gray-500">
        <button onClick={() => onLike(post.id)}
          className={`flex items-center gap-1.5 text-sm transition-colors ${post.liked_by_me ? 'text-red-500' : 'hover:text-red-500'}`}>
          <Heart className={`w-4 h-4 ${post.liked_by_me ? 'fill-red-500' : ''}`} />
          <span>{post.likes}</span>
        </button>
        <button onClick={() => setShowComments(v => !v)}
          className="flex items-center gap-1.5 text-sm hover:text-blue-600 transition-colors">
          <MessageCircle className="w-4 h-4" />
          <span>{post.comment_count}</span>
          {showComments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>
      {showComments && <CommentSection postId={post.id} />}
    </div>
  );
}

// ── External Alert Card ─────────────────────────────────────────────────────
function ExternalAlertCard({ item }) {
  const sourceColors = {
    'YouTube': 'bg-red-100 text-red-700',
    'NDTV News': 'bg-orange-100 text-orange-700',
    'ReliefWeb India': 'bg-blue-100 text-blue-700',
    'GDACS Alerts': 'bg-red-100 text-red-800',
  };
  const badgeClass = sourceColors[item.source] || 'bg-gray-100 text-gray-700';
  const isGDACS = item.source === 'GDACS Alerts';

  return (
    <div className={`bg-white rounded-xl shadow-sm p-5 ${isGDACS ? 'border-l-4 border-red-500' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{item.source_icon}</span>
          <div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeClass}`}>{item.source}</span>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
              <Clock className="w-3 h-3" />
              <span>{timeAgo(item.created_at)}</span>
              {item.location && <><MapPin className="w-3 h-3" /><span>{item.location}</span></>}
            </div>
          </div>
        </div>
        {item.urgency === 'high' && (
          <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Alert
          </span>
        )}
      </div>
      {item.thumbnail && (
        <img src={item.thumbnail} alt={item.title}
          className="w-full h-36 object-cover rounded-lg mb-3"
          onError={e => { e.target.style.display = 'none'; }} />
      )}
      <h3 className="font-semibold text-gray-900 text-sm mb-1 text-left leading-snug">{item.title}</h3>
      {item.content && item.content !== item.title && (
        <p className="text-gray-600 text-xs leading-relaxed text-left line-clamp-3">{item.content}</p>
      )}
      <a href={item.link} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1 mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium">
        View source <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}

// ── Main Community Page ─────────────────────────────────────────────────────
const Community = () => {
  const [activeTab, setActiveTab] = useState('community');
  const [posts, setPosts] = useState([]);
  const [externalFeed, setExternalFeed] = useState([]);
  const [stats, setStats] = useState({ total_posts: 0, total_members: 0, posts_this_week: 0 });
  const [loading, setLoading] = useState(true);
  const [externalLoading, setExternalLoading] = useState(false);
  const [externalError, setExternalError] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sort, setSort] = useState('recent');
  const [search, setSearch] = useState('');
  const [showNewPost, setShowNewPost] = useState(false);
  const searchTimeout = useRef(null);

  const loadPosts = async (cat = activeCategory, s = sort, q = search) => {
    setLoading(true);
    try {
      const params = { sort: s, limit: 30 };
      if (cat !== 'All') params.category = cat;
      if (q) params.search = q;
      const { data } = await api.get('/community/posts', { params });
      setPosts(data);
    } catch (e) {
      console.error('Failed to load posts', e);
    } finally {
      setLoading(false);
    }
  };

  const loadExternalFeed = async () => {
    setExternalLoading(true);
    setExternalError('');
    try {
      const { data } = await api.get('/social/external-feed?limit=30');
      setExternalFeed(data);
      if (data.length === 0) setExternalError('No coastal alerts found right now. Try again later.');
    } catch {
      setExternalError('Could not load external feed. Check your internet connection.');
    } finally {
      setExternalLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data } = await api.get('/community/stats');
      setStats(data);
    } catch {}
  };

  useEffect(() => { loadPosts(); loadStats(); }, []);

  useEffect(() => {
    if (activeTab === 'external' && externalFeed.length === 0 && !externalLoading) {
      loadExternalFeed();
    }
  }, [activeTab]);

  const handleCategoryChange = (cat) => { setActiveCategory(cat); loadPosts(cat, sort, search); };
  const handleSortChange = (s) => { setSort(s); loadPosts(activeCategory, s, search); };
  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearch(q);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => loadPosts(activeCategory, sort, q), 400);
  };
  const handleLike = async (postId) => {
    try {
      const { data } = await api.post(`/community/posts/${postId}/like`);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: data.likes, liked_by_me: data.liked } : p));
    } catch {}
  };
  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
    setStats(prev => ({ ...prev, total_posts: prev.total_posts + 1, posts_this_week: prev.posts_this_week + 1 }));
  };

  return (
    <div className="min-h-screen bg-sky-100">
      {showNewPost && <NewPostModal onClose={() => setShowNewPost(false)} onCreated={handlePostCreated} />}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 text-left">Community Forum</h1>
            <p className="text-gray-600 text-left mt-1">Connect, share experiences, and stay safe together</p>
          </div>
          {activeTab === 'community' && (
            <button onClick={() => setShowNewPost(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Post
            </button>
          )}
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveTab('community')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'community' ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
            }`}>
            <Users className="w-4 h-4" /> Community Posts
          </button>
          <button onClick={() => setActiveTab('external')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'external' ? 'bg-red-600 text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
            }`}>
            <Rss className="w-4 h-4" /> Live News & Alerts
            <span className="bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded-full font-bold">LIVE</span>
          </button>
        </div>

        {activeTab === 'community' ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-5">
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center mb-4">
                  <Users className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="font-semibold text-gray-900">Community Stats</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Total Members</span>
                    <span className="font-semibold text-blue-600">{stats.total_members.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Total Posts</span>
                    <span className="font-semibold">{stats.total_posts.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">This Week</span>
                    <span className="font-semibold text-green-600">+{stats.posts_this_week} posts</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
                <div className="space-y-1">
                  {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => handleCategoryChange(cat)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeCategory === cat ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                      }`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="w-4 h-4 text-blue-600 mr-2" />
                  <h3 className="font-semibold text-blue-800 text-sm">Community Tips</h3>
                </div>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Share real-time coastal observations</li>
                  <li>• Tag posts as Safety Alert for urgent info</li>
                  <li>• Include your location for local context</li>
                  <li>• Like helpful posts to boost visibility</li>
                </ul>
              </div>
            </div>

            {/* Main Feed */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input type="text" placeholder="Search posts..." value={search} onChange={handleSearchChange}
                    className="flex-1 text-sm focus:outline-none text-gray-700" />
                </div>
                <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                  {[['recent', 'Recent'], ['popular', 'Popular']].map(([val, label]) => (
                    <button key={val} onClick={() => handleSortChange(val)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                        sort === val ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
                <button onClick={() => loadPosts()} className="p-2 text-gray-500 hover:text-blue-600 transition-colors" title="Refresh">
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mr-3" />
                  <span className="text-gray-600">Loading posts...</span>
                </div>
              ) : posts.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No posts yet</p>
                  <p className="text-gray-400 text-sm mt-1">Be the first to share something with the community!</p>
                  <button onClick={() => setShowNewPost(true)}
                    className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                    Create First Post
                  </button>
                </div>
              ) : (
                posts.map(post => <PostCard key={post.id} post={post} onLike={handleLike} />)
              )}
            </div>
          </div>
        ) : (
          /* External Feed Tab */
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Live Coastal News & Disaster Alerts</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Real-time data from NDTV, ReliefWeb & GDACS — filtered for coastal hazards
                </p>
              </div>
              <button onClick={loadExternalFeed} disabled={externalLoading}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 text-sm font-medium disabled:opacity-50">
                <RefreshCw className={`w-4 h-4 ${externalLoading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              {[
                ['🚨 GDACS', 'bg-red-100 text-red-700'],
                ['📰 NDTV', 'bg-orange-100 text-orange-700'],
                ['🌐 ReliefWeb', 'bg-blue-100 text-blue-700'],
              ].map(([label, cls]) => (
                <span key={label} className={`text-xs px-3 py-1 rounded-full font-medium ${cls}`}>{label}</span>
              ))}
            </div>

            {externalLoading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-6 h-6 text-red-500 animate-spin mr-3" />
                <span className="text-gray-600">Fetching live alerts from news sources...</span>
              </div>
            ) : externalError && externalFeed.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <Rss className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">{externalError}</p>
                <button onClick={loadExternalFeed}
                  className="mt-4 px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">
                  Try Again
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {externalFeed.map(item => <ExternalAlertCard key={item.id} item={item} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Community;
