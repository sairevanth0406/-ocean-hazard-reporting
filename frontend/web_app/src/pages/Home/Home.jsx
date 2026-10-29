import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Waves, Shield, Phone, Navigation, AlertTriangle, CheckCircle, Users, Clock, Star, Anchor, Cross, Loader2, RotateCcw, CloudRain, Wind, Thermometer, Activity } from 'lucide-react';
import MapView from '../../components/MapView.jsx';
import Feed from '../../components/Feed';
import { fetchHotspots, fetchRecentReports } from '../../services/hotspotService.js';
import api from '../../utils/api';
import { getMediaUrl, getPlaceholderImageUrl } from '../../utils/imageUtils';

const Home = () => {
  const [hotspots, setHotspots] = useState([]);
  const [loadingHotspots, setLoadingHotspots] = useState(true);
  const [hotspotError, setHotspotError] = useState('');
  const [myLocation, setMyLocation] = useState(null); // { lat, lng, address }
  const [locationAllowed, setLocationAllowed] = useState(null); // null|true|false
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [recentReports, setRecentReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [safetyCircles, setSafetyCircles] = useState([]); // Array of safety status circles
  const [riskData, setRiskData] = useState(null);
  const [loadingRisk, setLoadingRisk] = useState(true);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const watchIdRef = useRef(null);

  // Fetch dynamic risk assessment & nearby resources
  useEffect(() => {
    let active = true;
    const fetchDynamicData = async () => {
      try {
        const lat = myLocation?.lat || 17.4045;
        const lng = myLocation?.lng || 78.3915;

        // Fetch risk assessment
        try {
          const { data: risk } = await api.get(`/resources/risk-assessment?lat=${lat}&lng=${lng}`);
          if (active && risk) {
            setRiskData(risk);
          }
        } catch (e) {
          console.error('Failed to load risk assessment:', e);
        } finally {
          if (active) setLoadingRisk(false);
        }

        // Fetch nearby emergency places
        try {
          const { data: res } = await api.get(`/resources/nearby?lat=${lat}&lng=${lng}`);
          if (active && res?.places) {
            setNearbyPlaces(res.places);
          }
        } catch (e) {
          console.error('Failed to load nearby places:', e);
        } finally {
          if (active) setLoadingPlaces(false);
        }
      } catch (err) {
        console.error('Dynamic data load error:', err);
      }
    };

    fetchDynamicData();
    return () => { active = false; };
  }, [myLocation?.lat, myLocation?.lng]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const items = await fetchHotspots();
        if (mounted) setHotspots(items);
      } catch (e) {
        if (mounted) setHotspotError('Failed to load hotspots');
      } finally {
        if (mounted) setLoadingHotspots(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Load recent reports
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const items = await fetchRecentReports(10);
        if (mounted) setRecentReports(items);
      } catch (e) {
        // silent fail, we will show static fallback
      } finally {
        if (mounted) setLoadingReports(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Load existing safety circles from database
  useEffect(() => {
    const loadSafetyCircles = async () => {
      try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
          console.log('No auth token found, skipping safety circles load');
          return;
        }

        console.log('Loading safety circles from database...');
        const { data: circles } = await api.get('/safety-circles/active');
        if (Array.isArray(circles)) {
          console.log('Raw safety circles from API:', circles);
          
          const mappedCircles = circles.map(circle => ({
            id: `db-${circle.id}`,
            lat: circle.latitude,
            lng: circle.longitude,
            isSafe: circle.is_safe,
            color: circle.color,
            timestamp: new Date(circle.created_at).getTime(),
            reportId: circle.notification_id
          }));
          
          setSafetyCircles(mappedCircles);
          console.log('Loaded', mappedCircles.length, 'safety circles from database');
        }
      } catch (error) {
        console.error('Error loading safety circles:', error);
      }
    };

    // Add a small delay to ensure auth token is available
    const timeoutId = setTimeout(() => {
      loadSafetyCircles();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  // Listen for auth changes and reload safety circles
  useEffect(() => {
    const loadSafetyCircles = async () => {
      try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
          console.log('No auth token found, clearing safety circles');
          setSafetyCircles([]);
          return;
        }

        console.log('Auth changed, reloading safety circles...');
        const response = await fetch('/api/safety-circles/active', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        if (response.ok) {
          const circles = await response.json();
          const mappedCircles = circles.map(circle => ({
            id: `db-${circle.id}`,
            lat: circle.latitude,
            lng: circle.longitude,
            isSafe: circle.is_safe,
            color: circle.color,
            timestamp: new Date(circle.created_at).getTime(),
            reportId: circle.notification_id
          }));
          
          setSafetyCircles(mappedCircles);
          console.log('Reloaded', mappedCircles.length, 'safety circles after auth change');
        }
      } catch (error) {
        console.error('Error reloading safety circles after auth change:', error);
      }
    };

    const handleStorageChange = (e) => {
      if (e.key === 'authToken') {
        loadSafetyCircles();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Listen for safety circle events
  useEffect(() => {
    const handleSafetyCircle = (event) => {
      const { latitude, longitude, isSafe, color, timestamp, reportId } = event.detail;
      
      const newCircle = {
        id: `safety-${timestamp}-${reportId}`,
        lat: latitude,
        lng: longitude,
        isSafe,
        color,
        timestamp,
        reportId
      };

      setSafetyCircles(prev => [...prev, newCircle]);

      // Remove the circle after 30 seconds (temporary display)
      setTimeout(() => {
        setSafetyCircles(prev => prev.filter(circle => circle.id !== newCircle.id));
      }, 30000);
    };

    window.addEventListener('addSafetyCircle', handleSafetyCircle);
    
    return () => {
      window.removeEventListener('addSafetyCircle', handleSafetyCircle);
    };
  }, []);

  // Function to get current location
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    });
  };

  // Function to get address from coordinates using reverse geocoding
  const getAddressFromCoordinates = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }
      
      const data = await response.json();
      
      // Extract city/area information from the response
      const address = data.address || {};
      const locationName = address.city || 
                          address.town || 
                          address.village || 
                          address.county || 
                          address.state || 
                          address.country || 
                          'Unknown Location';
      
      return {
        fullAddress: data.display_name,
        city: locationName,
        area: address.suburb || address.neighbourhood || address.quarter || '',
        country: address.country || '',
        state: address.state || ''
      };
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return {
        fullAddress: 'Address unavailable',
        city: 'Unknown Location',
        area: '',
        country: '',
        state: ''
      };
    }
  };

  // Function to start location tracking
  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      setLocationAllowed(false);
      return;
    }

    // Clear any existing watch
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        // Get address information
        const address = await getAddressFromCoordinates(lat, lng);
        
        setMyLocation({ 
          lat: lat, 
          lng: lng,
          address: address
        });
        setLocationAllowed(true);
      },
      (error) => {
        console.error('Location tracking error:', error);
        setLocationAllowed(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  // Function to stop location tracking
  const stopLocationTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setLocationAllowed(false);
    setMyLocation(null);
  };

  // Function to handle GPS button click
  const handleGPSButtonClick = async () => {
    if (locationAllowed === true) {
      // If GPS is active, stop tracking
      stopLocationTracking();
    } else {
      // If GPS is inactive, request permission and start tracking
      setIsRequestingLocation(true);
      try {
        const location = await getCurrentLocation();
        // Get address information
        const address = await getAddressFromCoordinates(location.lat, location.lng);
        setMyLocation({
          ...location,
          address: address
        });
        setLocationAllowed(true);
        startLocationTracking();
      } catch (error) {
        console.error('Failed to get location:', error);
        setLocationAllowed(false);
      } finally {
        setIsRequestingLocation(false);
      }
    }
  };

  // Initial location request
  useEffect(() => {
    let active = true;
    if (!navigator.geolocation) {
      setLocationAllowed(false);
      return () => {};
    }
    
    getCurrentLocation()
      .then(async (location) => {
        if (!active) return;
        // Get address information
        const address = await getAddressFromCoordinates(location.lat, location.lng);
        setMyLocation({
          ...location,
          address: address
        });
        setLocationAllowed(true);
        startLocationTracking();
      })
      .catch(() => {
        if (!active) return;
        setLocationAllowed(false);
      });
    
    return () => { 
      active = false;
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-sky-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Main Title Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {/* App Logo and Name */}
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900 text-left">Dashboard</h1>
            </div>
            {/* SOS Button */}
            <button className="bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>SOS</span>
            </button>
          </div>
          
          <p className="text-slate-600 text-lg text-left">
            Stay informed about current ocean conditions and safety alerts.
          </p>
        </div>

        {/* Content Cards */}
        <div className="space-y-20">
          {/* Current Location Card */}
          <div className="bg-slate-50 rounded-xl shadow-lg p-8">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <MapPin className="w-6 h-6 text-blue-800 mr-3" />
                  <h2 className="text-xl font-semibold text-blue-800">Current Location</h2>
                </div>
                <div className="flex items-center space-x-3">
                <button
                  onClick={handleGPSButtonClick}
                  disabled={isRequestingLocation}
                  className={`px-4 py-2 rounded-full text-sm font-medium flex items-center transition-all duration-200 ${
                    locationAllowed === true
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg'
                      : locationAllowed === false
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg'
                      : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white hover:from-gray-500 hover:to-gray-600 shadow-md hover:shadow-lg'
                  } ${isRequestingLocation ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {isRequestingLocation ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Requesting...
                    </>
                  ) : locationAllowed === true ? (
                    <>
                      <MapPin className="w-4 h-4 mr-1" />
                      GPS Active
                    </>
                  ) : locationAllowed === false ? (
                    <>
                      <Cross className="w-4 h-4 mr-1" />
                      GPS Inactive
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4 mr-1" />
                      Enable GPS
                    </>
                  )}
                </button>
                  <button
                    onClick={() => {
                      const loadSafetyCircles = async () => {
                        try {
                          const authToken = localStorage.getItem('authToken');
                          if (!authToken) {
                            console.log('No auth token for manual refresh');
                            alert('Please log in to load safety circles');
                            return;
                          }
                          
                          console.log('Manually refreshing safety circles...');
                          console.log('Current circles before refresh:', safetyCircles.length);
                          
                          const { data: circles } = await api.get('/safety-circles/active');
                          if (Array.isArray(circles)) {
                            console.log('Raw circles from API:', circles);
                            
                            const mappedCircles = circles.map(circle => ({
                              id: `db-${circle.id}`,
                              lat: circle.latitude,
                              lng: circle.longitude,
                              isSafe: circle.is_safe,
                              color: circle.color,
                              timestamp: new Date(circle.created_at).getTime(),
                              reportId: circle.notification_id
                            }));
                            
                            console.log('Mapped circles:', mappedCircles);
                            
                            // Force a fresh state update
                            setSafetyCircles([]);
                            setTimeout(() => {
                              setSafetyCircles(mappedCircles);
                              console.log('Manual refresh: State updated with', mappedCircles.length, 'safety circles');
                            }, 50);
                          }
                        } catch (error) {
                          console.error('Manual refresh error:', error);
                          alert(`Error refreshing circles: ${error.message}`);
                        }
                      };
                      loadSafetyCircles();
                    }}
                    className="p-2 rounded-full bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200 transition-colors"
                    title={`Refresh safety circles (${safetyCircles.length} circles)`}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            
            {/* Map Container */}
            <div className="h-64 rounded-lg border-2 border-slate-300 overflow-hidden">
              <div className="relative h-full">
                {hotspotError ? (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-red-600 bg-red-50">{hotspotError}</div>
                ) : null}
                <MapView
                  height="256px"
                  center={myLocation ? [myLocation.lat, myLocation.lng] : [12.9716, 77.5946]}
                  zoom={myLocation ? 13 : 11}
                  markers={locationAllowed && myLocation ? [{ 
                    position: [myLocation.lat, myLocation.lng], 
                    popup: myLocation.address ? `${myLocation.address.city}` : 'My Location' 
                  }] : []}
                  hotspots={hotspots}
                  safetyCircles={safetyCircles}
                />
                {loadingHotspots ? (
                  <div className="absolute bottom-2 left-2 bg-white/80 text-gray-700 text-xs px-2 py-1 rounded">Loading hotspotsâ€¦</div>
                ) : null}
              </div>
            </div>
            
            {/* Location Coordinates Display */}
            {locationAllowed && myLocation && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="space-y-2">
                  {/* City/Area Display */}
                  {myLocation.address && (
                    <div className="flex items-center text-sm text-blue-800">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="font-medium">Location:</span>
                      <span className="ml-2">
                        {myLocation.address.area && `${myLocation.address.area}, `}
                        {myLocation.address.city}
                        {myLocation.address.state && `, ${myLocation.address.state}`}
                      </span>
                    </div>
                  )}
                  {/* Coordinates Display */}
                  <div className="flex items-center text-sm text-blue-800">
                    <Navigation className="w-4 h-4 mr-2" />
                    <span className="font-medium">Coordinates:</span>
                    <span className="ml-2 font-mono">
                      {myLocation.lat.toFixed(6)}, {myLocation.lng.toFixed(6)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Reports Card */
          }
          <div className="bg-slate-50 rounded-xl shadow-lg p-8 mt-16">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Users className="w-6 h-6 text-blue-800 mr-3" />
                <h2 className="text-xl font-semibold text-blue-800">Recent Reports</h2>
              </div>
              <button className="text-blue-600 text-lg font-semibold hover:text-blue-700 transition-colors duration-200 px-4 py-2 rounded-lg hover:bg-blue-50">
                View More
              </button>
            </div>
            
            <div className="relative">
              <div className="flex gap-6 overflow-x-auto overflow-y-hidden pb-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-slate-300">
                {(!loadingReports && recentReports && recentReports.length > 0) ? (
                  recentReports.map((r) => (
                    <div key={r.id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-transform duration-200 hover:scale-[1.01] relative flex flex-col h-full min-w-[280px] max-w-[320px] snap-start">
                      <div className="mb-2">
                      <h3 className="font-bold text-gray-900 text-lg leading-tight">{r.hazard_type?.replace('_', ' ') || 'Hazard Report'}</h3>
                    </div>
                      <div className="mb-3">
                        <div className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium items-center text-white ${r.status === 'verified' ? 'bg-green-600' : r.status === 'under_verification' ? 'bg-yellow-500' : 'bg-red-600'}` }>
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          {r.status?.replace('_', ' ') || 'status'}
                        </div>
                      </div>
                      {/* Report Location */}
                      {(r.latitude && r.longitude) && (
                        <div className="mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                            <span className="font-medium">Location:</span>
                            <span className="ml-1">
                              {r.location || `${parseFloat(r.latitude).toFixed(4)}, ${parseFloat(r.longitude).toFixed(4)}`}
                            </span>
                          </div>
                        </div>
                      )}
                    {r.user_description ? (
                      <p className="text-gray-700 text-base mb-6 leading-relaxed truncate whitespace-nowrap">{r.user_description}</p>
                    ) : null}
                    <div className="h-48 rounded-xl overflow-hidden mb-6 flex-grow bg-gray-100">
                      {r.thumbnail_url ? (
                        <img 
                          src={getMediaUrl(r.thumbnail_url)} 
                          alt={r.hazard_type} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = getPlaceholderImageUrl('media');
                          }}
                        />
                      ) : (
                        <img 
                          src={getPlaceholderImageUrl('media')} 
                          alt="No media" 
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{r.user_name || 'Anonymous'}</p>
                          <p className="text-xs text-gray-500">{r.user_city || 'Community'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-gray-600">{r.created_at ? new Date(r.created_at).toLocaleString() : ''}</p>
                        <p className="text-xs text-gray-500">Created</p>
                      </div>
                    </div>
                    </div>
                  ))
                ) : (
                  !loadingReports && (
                    <div className="text-gray-600 text-sm px-2">No current reports</div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* AI Intelligence Feed */}
          <div className="mt-16">
            <Feed limit={12} />
          </div>

          {/* Risk Assessment Card */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8 mt-16 border border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center">
                <Shield className="w-7 h-7 text-blue-700 mr-3" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 text-left">Live Risk Assessment</h2>
                  <p className="text-sm text-gray-500 text-left">
                    Real-time analysis powered by live weather sensors & verified ocean reports
                  </p>
                </div>
              </div>

              {/* Location Badge */}
              <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-blue-800 text-sm font-semibold shadow-sm self-start sm:self-auto">
                <MapPin className="w-4 h-4 mr-1.5 text-blue-600 animate-pulse" />
                <span>{riskData?.city ? `${riskData.city}${riskData.state ? `, ${riskData.state}` : ''}` : 'Detecting location...'}</span>
              </div>
            </div>
            
            {/* Dynamic Risk Level Indicator */}
            <div className={`${riskData?.risk_badge || 'bg-gradient-to-r from-blue-600 to-indigo-700'} rounded-2xl p-6 mb-6 shadow-xl text-white transition-all duration-300`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl mt-1">
                    <AlertTriangle className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-3">
                      <h3 className="text-3xl font-extrabold text-left">{riskData?.risk_level || 'Calculating Risk...'}</h3>
                      <span className="text-xs bg-white/25 px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold">Live</span>
                    </div>
                    <p className="text-sm text-white/90 text-left mt-1">
                      Computed for {riskData?.city || 'your area'} based on atmospheric pressure, wind velocities & local hazards
                    </p>
                    
                    {/* Live Weather Metrics Snippet */}
                    {riskData?.weather && (
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-white/95 font-medium">
                        <span className="inline-flex items-center bg-black/20 px-3 py-1 rounded-lg">
                          <Thermometer className="w-3.5 h-3.5 mr-1" />
                          {riskData.weather.temp_c}°C
                        </span>
                        <span className="inline-flex items-center bg-black/20 px-3 py-1 rounded-lg">
                          <Wind className="w-3.5 h-3.5 mr-1" />
                          {riskData.weather.wind_kph} km/h Wind
                        </span>
                        <span className="inline-flex items-center bg-black/20 px-3 py-1 rounded-lg">
                          <CloudRain className="w-3.5 h-3.5 mr-1" />
                          {riskData.weather.condition || 'Clear'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-right flex md:flex-col items-baseline md:items-end justify-between md:justify-center border-t md:border-t-0 border-white/20 pt-3 md:pt-0">
                  <div className="text-5xl font-black tracking-tight">{riskData?.overall_score ?? 25}%</div>
                  <div className="text-xs text-white/80 uppercase tracking-wider font-semibold mt-1">Hazard Index</div>
                </div>
              </div>
            </div>
            
            {/* Risk Factors Breakdown */}
            <div className="mt-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4 text-left">Dynamic Environmental Factors</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-700 font-semibold flex items-center">
                      <Waves className="w-4 h-4 mr-1.5 text-blue-600" />
                      Wave & Swell Height
                    </span>
                    <span className="font-bold text-blue-700">{riskData?.factors?.wave_height_pct ?? 20}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                      style={{width: `${riskData?.factors?.wave_height_pct ?? 20}%`}}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-left">Estimated coastal wave surge potential</p>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-700 font-semibold flex items-center">
                      <Wind className="w-4 h-4 mr-1.5 text-cyan-600" />
                      Current & Wind Force
                    </span>
                    <span className="font-bold text-cyan-700">{riskData?.factors?.current_strength_pct ?? 25}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div 
                      className="bg-cyan-600 h-2.5 rounded-full transition-all duration-500" 
                      style={{width: `${riskData?.factors?.current_strength_pct ?? 25}%`}}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-left">Undercurrent velocity & gust strength</p>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-700 font-semibold flex items-center">
                      <CloudRain className="w-4 h-4 mr-1.5 text-indigo-600" />
                      Precipitation & Inundation
                    </span>
                    <span className="font-bold text-indigo-700">{riskData?.factors?.precipitation_pct ?? 10}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div 
                      className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" 
                      style={{width: `${riskData?.factors?.precipitation_pct ?? 10}%`}}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-left">Rainfall volume and waterlogging likelihood</p>
                </div>
              </div>
            </div>
          </div>

          {/* Safety Recommendations Card */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8 mt-12 border border-slate-100">
            <div className="flex items-center mb-6">
              <Shield className="w-7 h-7 text-blue-700 mr-3" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 text-left">Safety Advisory & Recommendations</h2>
                <p className="text-sm text-gray-500 text-left">Custom precautions based on current conditions in {riskData?.city || 'your area'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(riskData?.recommendations || [
                'Avoid swimming alone and stay within designated zones.',
                'Stay close to shore and observe coastal flag warnings.',
                'Check with lifeguards before entering unfamiliar waters.',
                'Be aware of rip current notices and sudden wave surges.'
              ]).map((recommendation, index) => (
                <div key={index} className="flex items-start p-4 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-100 transition-colors">
                  <div className="w-3 h-3 bg-blue-600 rounded-full mt-1.5 mr-3.5 flex-shrink-0 shadow-sm"></div>
                  <p className="text-gray-800 text-sm font-medium leading-relaxed text-left">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Safe Places Card - Dynamic Emergency Contacts for User's Live Location */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mt-12 border border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center">
                <div className="p-2.5 bg-red-100 text-red-600 rounded-xl mr-3">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 text-left">Nearby Emergency Services & Safe Places</h2>
                  <p className="text-sm text-gray-500 text-left">
                    Verified facilities near {riskData?.city || 'your current location'} with real-time distance
                  </p>
                </div>
              </div>
              <span className="text-xs bg-red-50 text-red-700 font-bold px-3 py-1.5 rounded-full border border-red-200 self-start sm:self-auto">
                Emergency 24x7
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(nearbyPlaces.length > 0 ? nearbyPlaces : [
                { name: `${riskData?.city || 'Local'} Central Police Station`, type: 'Police Station', phone: '112 / 100', icon: 'shield', rating: 4.8, hours: '24 hours', distanceKm: 1.2, address: 'Police HQ' },
                { name: `${riskData?.city || 'City'} Emergency Trauma Care`, type: 'Medical Facility', phone: '108 / 102', icon: 'cross', rating: 4.7, hours: '24 hours', distanceKm: 2.1, address: 'General Hospital Circle' },
                { name: `${riskData?.state || 'State'} Disaster Response Shelter`, type: 'Emergency Shelter', phone: '1070 / 1077', icon: 'shield', rating: 4.6, hours: '24 hours', distanceKm: 3.4, address: 'Civil Defence' },
                { name: `${riskData?.city || 'Coastal'} Safety & Lifeguard Post`, type: 'Lifeguard Station', phone: '+91 1800 209 1111', icon: 'anchor', rating: 4.5, hours: '6:00 AM - 8:30 PM', distanceKm: 2.8, address: 'Waterfront Post' },
              ]).map((p, idx) => (
                <div key={idx} className="flex items-start justify-between p-5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/60 shadow-sm transition-all duration-200 hover:shadow-md">
                  <div className="flex items-start space-x-3.5 flex-1 pr-3">
                    <div className={`w-11 h-11 ${
                      p.icon === 'anchor' ? 'bg-blue-100 text-blue-600' :
                      p.icon === 'cross' ? 'bg-rose-100 text-rose-600' :
                      'bg-amber-100 text-amber-700'
                    } rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm`}>
                      {p.icon === 'anchor' ? <Anchor className="w-5 h-5" /> :
                       p.icon === 'cross' ? <Cross className="w-5 h-5" /> :
                       <Shield className="w-5 h-5" />}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-base mb-0.5 text-left">{p.name}</h3>
                      <p className="text-xs font-semibold text-blue-700 mb-2 text-left">{p.type}</p>
                      
                      <a 
                        href={`tel:${p.phone.split('/')[0].trim()}`} 
                        className="inline-flex items-center text-sm font-semibold text-emerald-700 hover:text-emerald-800 mb-1 group"
                      >
                        <Phone className="w-3.5 h-3.5 mr-1.5 group-hover:scale-110 transition-transform" />
                        <span>{p.phone}</span>
                      </a>
                      
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
                        <span>{p.hours}</span>
                      </div>
                      
                      {p.address && (
                        <p className="text-xs text-gray-400 mt-1 text-left truncate max-w-xs">{p.address}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right flex-shrink-0 flex flex-col items-end justify-between self-stretch">
                    <div className="inline-flex items-center bg-blue-100/70 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">
                      <Navigation className="w-3 h-3 mr-1" />
                      {typeof p.distanceKm === 'number' ? p.distanceKm.toFixed(1) : p.distanceKm} km
                    </div>
                    
                    <div className="flex items-center mt-3">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                      <span className="text-xs font-bold text-gray-700 ml-1">{p.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Home;

