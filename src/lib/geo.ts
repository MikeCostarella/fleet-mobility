// Geographic bounds of the Ohio region used by the simulated telemetry maps.
// Both the Telematics fleet map and the VehicleDetail mini-map project lat/lng
// into SVG pixel space using these same bounds, so they live here once.
export const OHIO_BOUNDS = { minLng: -84.9, maxLng: -80.4, minLat: 38.3, maxLat: 42.0 };

// Project a lat/lng into x/y pixel coordinates within a W×H SVG viewBox.
// Longitude maps left→right; latitude is inverted so north is at the top.
export function projectOhio(lat: number, lng: number, w: number, h: number): { x: number; y: number } {
  const { minLng, maxLng, minLat, maxLat } = OHIO_BOUNDS;
  return {
    x: ((lng - minLng) / (maxLng - minLng)) * w,
    y: h - ((lat - minLat) / (maxLat - minLat)) * h,
  };
}
