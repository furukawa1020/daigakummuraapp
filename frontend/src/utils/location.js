const VILLAGE_CENTER_LAT = parseFloat(import.meta.env.VITE_VILLAGE_CENTER_LAT) || 36.17773082095139;
const VILLAGE_CENTER_LNG = parseFloat(import.meta.env.VITE_VILLAGE_CENTER_LNG) || 136.62608115875494;
const VILLAGE_RADIUS_KM = parseFloat(import.meta.env.VITE_VILLAGE_RADIUS_KM) || 5.0;

/**
 * Haversine formula to calculate distance between two coordinates
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Check if coordinates are within village range
 */
export function isWithinVillageRange(lat, lng) {
  const distance = calculateDistance(
    VILLAGE_CENTER_LAT,
    VILLAGE_CENTER_LNG,
    lat,
    lng
  );
  return distance <= VILLAGE_RADIUS_KM;
}

/**
 * Get current geolocation
 */
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

export const VILLAGE_CONFIG = {
  centerLat: VILLAGE_CENTER_LAT,
  centerLng: VILLAGE_CENTER_LNG,
  radiusKm: VILLAGE_RADIUS_KM,
};
