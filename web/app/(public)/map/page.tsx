'use client';

import { Suspense, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { bbox } from '@turf/turf';

type PlacesGeoJson = {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: { NAME?: string } & Record<string, unknown>;
    geometry: GeoJSON.Geometry;
  }>;
};

// Current Mapbox style catalog IDs. The legacy map.component.js used
// light-v10/streets-v11/dark-v10/outdoors-v11/satellite-v9 against
// mapbox-gl v2.9.1 - those are Mapbox's now-superseded style versions,
// updated here to the current catalog.
const MAP_STYLES = [
  { id: 'light-v11', label: 'Light' },
  { id: 'streets-v12', label: 'Streets' },
  { id: 'dark-v11', label: 'Dark' },
  { id: 'outdoors-v12', label: 'Outdoors' },
  { id: 'satellite-v9', label: 'Satellite' },
];
const DEFAULT_STYLE = 'streets-v12';

function MapView() {
  const searchParams = useSearchParams();
  const jurisdiction = searchParams.get('jurisdiction') ?? undefined;
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    if (!token || !mapContainerRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: `mapbox://styles/mapbox/${DEFAULT_STYLE}`,
      center: [-122.4241, 37.78],
      zoom: 9,
    });
    mapRef.current = map;

    map.on('style.load', async () => {
      map.setFog({});

      const response = await fetch('/places.json');
      const placesGeoJson = (await response.json()) as PlacesGeoJson;

      if (jurisdiction) {
        const feature = placesGeoJson.features.find((item) => item.properties.NAME === jurisdiction);
        if (feature) {
          map.fitBounds(bbox(feature.geometry) as [number, number, number, number], { padding: 20 });
        }
      }

      if (!map.getSource('jurisdictionBoundarySource')) {
        map.addSource('jurisdictionBoundarySource', { type: 'geojson', data: placesGeoJson as GeoJSON.FeatureCollection });
      }
      if (!map.getLayer('jurisdiction-boundary')) {
        map.addLayer({
          id: 'jurisdiction-boundary',
          type: 'fill',
          source: 'jurisdictionBoundarySource',
          paint: {
            'fill-outline-color': 'white',
            'fill-color': 'purple',
            'fill-opacity': 0.6,
          },
          filter: jurisdiction ? ['in', 'NAME', jurisdiction] : ['==', 'NAME', ''],
        });
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [jurisdiction, token]);

  function setStyle(styleId: string) {
    mapRef.current?.setStyle(`mapbox://styles/mapbox/${styleId}`);
  }

  return (
    <main className="map-page">
      <Link href="/data" className="button">
        Back to Data
      </Link>

      {!token ? (
        <p className="data-page__error">
          NEXT_PUBLIC_MAPBOX_TOKEN is not configured — the map cannot load without a Mapbox access
          token. See .env.example.
        </p>
      ) : (
        <div className="map-page__container">
          <div ref={mapContainerRef} className="map-page__map" />
          <div className="map-page__menu">
            {MAP_STYLES.map((style) => (
              <label key={style.id}>
                <input
                  type="radio"
                  name="mapStyle"
                  defaultChecked={style.id === DEFAULT_STYLE}
                  onChange={() => setStyle(style.id)}
                />
                {style.label}
              </label>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={null}>
      <MapView />
    </Suspense>
  );
}
