'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface TrackingMapProps {
  riderLat: number;
  riderLng: number;
  canteenName: string;
}

export default function TrackingMap({ riderLat, riderLng, canteenName }: TrackingMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    // Fix default marker icon path issue in Leaflet with Next.js static asset loaders
    // @ts-expect-error - Leaflet internal property modification
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    // Initialize map if it doesn't exist yet
    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
      }).setView([riderLat, riderLng], 16);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      mapRef.current = map;

      // Add delivery rider marker
      const marker = L.marker([riderLat, riderLng])
        .addTo(map)
        .bindPopup(`🚴 Rider from ${canteenName} is on the way!`)
        .openPopup();
      markerRef.current = marker;
    } else {
      // Dynamic update of coordinates when rider moves
      mapRef.current.setView([riderLat, riderLng]);
      if (markerRef.current) {
        markerRef.current.setLatLng([riderLat, riderLng]);
      }
    }
  }, [riderLat, riderLng, canteenName]);

  return (
    <div className="w-full h-64 sm:h-80 lg:h-96 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-inner relative z-0">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
