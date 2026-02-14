const TARGET_LOCATION = {
  latitude: 19.1824807,
  longitude: 73.050656,
};

const ALLOWED_RADIUS_METERS = 50;

// Helper: Convert Degrees to Radians
const toRad = (value) => {
  return (value * Math.PI) / 180;
};

// The Haversine Formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Radius of Earth in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in meters

  return distance;
};

const verifyLocation = (req, res) => {
  const { latitude, longitude } = req.body;

  // Basic Validation
  if (!latitude || !longitude) {
    return res.status(400).json({
      success: false,
      message: "Latitude and Longitude are required.",
    });
  }

  const distance = calculateDistance(
        parseFloat(latitude), 
        parseFloat(longitude), 
        TARGET_LOCATION.latitude, 
        TARGET_LOCATION.longitude
    );

    // Round to 2 decimal places for readability
    const distanceFormatted = distance.toFixed(2); 

    if (distance <= ALLOWED_RADIUS_METERS) {
        return res.status(200).json({
            success: true,
            message: `Location verified. You are ${distanceFormatted} meters away from the location.`,
            data: {
                status: "INSIDE_RADIUS",
                distance: parseFloat(distanceFormatted)
            }
        });
    } else {
        // FAIL: Logic for being outside the radius
        const distanceToValidZone = (distance - ALLOWED_RADIUS_METERS).toFixed(2);
        
        return res.status(403).json({
            success: false,
            // UPDATED MESSAGE HERE:
            message: `Location verification failed. You are ${distanceFormatted} meters away from the location.`,
            error: {
                status: "OUTSIDE_RADIUS",
                currentDistance: parseFloat(distanceFormatted), // Total distance from center
                requiredDistance: ALLOWED_RADIUS_METERS,        // The radius limit
                distanceToEnter: parseFloat(distanceToValidZone) // How much closer they need to move
            }
        });
    }
};

module.exports = { verifyLocation };
