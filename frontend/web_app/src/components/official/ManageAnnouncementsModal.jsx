import React, { useState, useEffect } from 'react';
import { X, Trash2, RefreshCw, AlertTriangle, MapPin, Calendar, MessageSquare } from 'lucide-react';
import api from '../../utils/api';

const priorityColors = {
  Critical: 'bg-red-100 text-red-800 border-red-200',
  High: 'bg-orange-100 text-orange-800 border-orange-200',
  Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Low: 'bg-green-100 text-green-800 border-green-200',
};

function timeAgo(isoStr) {
  if (!isoStr) return '';
  const normalized = isoStr.endsWith('Z') || isoStr.includes('+') ? isoStr : isoStr + 'Z';
  const diff = (Date.now() - new Date(normalized).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const ManageAnnouncementsModal = ({ onClose }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');

  const loadAnnouncements = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/announcements?limit=100');
      setAnnouncements(data);
    } catch {
      setError('Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAnnouncements(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    setDeleting(id);
    try {
      await api.delete(`/announcements/${id}`);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch {
      alert('Failed to delete announcement.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Manage Announcements</h2>
              <p className="text-sm text-gray-500">{announcements.length} announcement{announcements.length !== 1 ? 's' : ''} total</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadAnnouncements} disabled={loading}
              className="p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-4">{error}</p>}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mr-3" />
              <span className="text-gray-600">Loading announcements...</span>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No announcements yet</p>
              <p className="text-gray-400 text-sm mt-1">Create your first announcement using the button above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map(ann => (
                <div key={ann.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-gray-900 text-sm">{ann.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${priorityColors[ann.priority] || priorityColors.Medium}`}>
                          {ann.priority}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed mb-2">{ann.description}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                        <span>By {ann.official_name}</span>
                        <span>• {timeAgo(ann.created_at)}</span>
                        {ann.location_name && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{ann.location_name}
                            {ann.pincode && ` - ${ann.pincode}`}
                          </span>
                        )}
                        {ann.expiry_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />Expires {new Date(ann.expiry_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(ann.id)}
                      disabled={deleting === ann.id}
                      className="flex-shrink-0 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete announcement"
                    >
                      {deleting === ann.id
                        ? <RefreshCw className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t flex-shrink-0">
          <button onClick={onClose}
            className="w-full py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageAnnouncementsModal;
