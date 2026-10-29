import React, { useState } from 'react';
import { MessageSquare, MapPin, Calendar, X, RefreshCw } from 'lucide-react';
import api from '../../utils/api';

const AnnouncementModal = ({ onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    priority: 'Medium',
    description: '',
    location_name: '',
    pincode: '',
    scheduled_date: '',
    expiry_date: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        location_name: formData.location_name || null,
        pincode: formData.pincode || null,
        scheduled_date: formData.scheduled_date || null,
        expiry_date: formData.expiry_date || null,
      };
      const { data } = await api.post('/announcements', payload);
      if (onCreated) onCreated(data);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to create announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="bg-gray-100 p-2 rounded-lg mr-3">
              <MessageSquare className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Create Announcement</h2>
              <p className="text-sm text-gray-500">Broadcast important information to citizens</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
            <h3 className="font-medium text-gray-700 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              Basic Information
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notice Title *</label>
              <input
                type="text"
                placeholder="e.g. Coastal Flood Warning"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority *</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <textarea
              placeholder="Provide detailed information about the announcement..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
            <h3 className="font-medium text-gray-700 flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Location Information
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location Name</label>
              <input
                type="text"
                placeholder="e.g. Marina Beach, Chennai"
                value={formData.location_name}
                onChange={(e) => setFormData({...formData, location_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
              <input
                type="text"
                placeholder="600001"
                value={formData.pincode}
                onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
            <h3 className="font-medium text-gray-700 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Information (Optional)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date & Time</label>
              <input
                type="datetime-local"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date & Time</label>
              <input
                type="datetime-local"
                value={formData.expiry_date}
                onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-between pt-6 border-t">
            <button type="button" onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50">
              {submitting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <MessageSquare className="w-4 h-4 mr-2" />}
              Create Announcement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AnnouncementModal;
