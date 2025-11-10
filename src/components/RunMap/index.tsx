import React, {
  useRef,
  useCallback,
  useState,
  useEffect,
  useMemo,
} from 'react';
import { MapContainer, TileLayer, Polyline, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './leaflet.css';

import useActivities from '@/hooks/useActivities';
import {
  IS_CHINESE,
  USE_DASH_LINE,
  LINE_OPACITY,
  MAP_HEIGHT,
  PRIVACY_MODE,
  PROVINCE_FILL_COLOR,
  COUNTRY_FILL_COLOR,
} from '@/utils/const';
import {
  Coordinate,
  IViewState,
  geoJsonForMap,
} from '@/utils/utils';
import { RouteAnimator } from '@/utils/routeAnimation';
import LeafletRunMarker from './LeafletRunMarker';
import RunMapButtons from './RunMapButtons';
import styles from './style.module.css';
import { FeatureCollection } from 'geojson';
import { RPGeometry } from '@/static/run_countries';
import LightsControl from '@/components/RunMap/LightsControl';

interface IRunMapProps {
  title: string;
  viewState: IViewState;
  setViewState: (_viewState: IViewState) => void;
  changeYear: (_year: string) => void;
  geoData: FeatureCollection<RPGeometry>;
  thisYear: string;
  animationTrigger?: number;
}

// Component to handle map view updates (optimized for performance)
const MapViewController = ({ 
  viewState, 
  setViewState 
}: { 
  viewState: IViewState;
  setViewState: (_viewState: IViewState) => void;
}) => {
  const map = useMap();
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current && viewState.latitude && viewState.longitude && viewState.zoom) {
      map.setView([viewState.latitude, viewState.longitude], viewState.zoom, {
        animate: false, // No animation on initial mount for better performance
      });
      isInitialMount.current = false;
    }
  }, [viewState.latitude, viewState.longitude, viewState.zoom, map]);

  // Handle map move events with debouncing for better performance
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleMoveEnd = () => {
      // Debounce the state update to reduce re-renders
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const center = map.getCenter();
        const zoom = map.getZoom();
        setViewState({
          latitude: center.lat,
          longitude: center.lng,
          zoom: zoom,
        });
      }, 100);
    };

    map.on('moveend', handleMoveEnd);
    return () => {
      clearTimeout(timeoutId);
      map.off('moveend', handleMoveEnd);
    };
  }, [map, setViewState]);

  return null;
};

// MapThemeController removed - map now uses fixed style regardless of theme

const RunMap = ({
  title,
  viewState,
  setViewState,
  changeYear,
  geoData,
  thisYear,
  animationTrigger,
}: IRunMapProps) => {
  const { countries, provinces } = useActivities();
  const mapRef = useRef<L.Map | null>(null);
  // Change default to true for better visibility
  const [lights, setLights] = useState(PRIVACY_MODE ? false : true);
  const [mapGeoData, setMapGeoData] =
    useState<FeatureCollection<RPGeometry> | null>(null);
  const [isLoadingMapData, setIsLoadingMapData] = useState(false);

  // Use fixed single run color (not affected by theme)
  const singleRunColor = '#52c41a'; // Fixed green color

  // Use fixed tile URL - always show standard light map, not affected by theme
  const tileUrl = useMemo(() => {
    // Always use standard Voyager style - clean and professional
    return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
  }, []);

  const tileAttribution = useMemo(() => {
    return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
  }, []);

  // animation state (single run only)
  const [animatedPoints, setAnimatedPoints] = useState<Coordinate[]>([]);
  const routeAnimatorRef = useRef<RouteAnimator | null>(null);
  const lastRouteKeyRef = useRef<string | null>(null);

  // Memoize filter arrays
  const filterProvinces = useMemo(() => {
    return provinces;
  }, [provinces]);

  const filterCountries = useMemo(() => {
    return countries;
  }, [countries]);

  const initGeoDataLength = geoData.features.length;
  const isBigMap = (viewState.zoom ?? 0) <= 3;

  useEffect(() => {
    if (isBigMap && IS_CHINESE && !mapGeoData && !isLoadingMapData) {
      setIsLoadingMapData(true);
      geoJsonForMap()
        .then((data) => {
          setMapGeoData(data);
          setIsLoadingMapData(false);
        })
        .catch(() => {
          setIsLoadingMapData(false);
        });
    }
  }, [isBigMap, IS_CHINESE, mapGeoData, isLoadingMapData]);

  let combinedGeoData = geoData;
  if (isBigMap && IS_CHINESE && mapGeoData) {
    if (geoData.features.length === initGeoDataLength) {
      combinedGeoData = {
        type: 'FeatureCollection',
        features: geoData.features.concat(mapGeoData.features),
      };
    }
  }

  // Detect single run
  const { isSingleRun, startLon, startLat, endLon, endLat } = useMemo(() => {
    const isSingle =
      geoData.features.length === 1 &&
      geoData.features[0].geometry.coordinates.length;

    let startLon = 0;
    let startLat = 0;
    let endLon = 0;
    let endLat = 0;

    if (isSingle) {
      const points = geoData.features[0].geometry.coordinates as Coordinate[];
      [startLon, startLat] = points[0];
      [endLon, endLat] = points[points.length - 1];
    }

    return { isSingleRun: isSingle, startLon, startLat, endLon, endLat };
  }, [geoData]);

  // Dash array for lines
  const dashArray = useMemo(() => {
    return USE_DASH_LINE && !isSingleRun && !isBigMap ? '5, 10' : undefined;
  }, [isSingleRun, isBigMap]);

  const style: React.CSSProperties = useMemo(
    () => ({
      width: '100%',
      height: MAP_HEIGHT,
      maxWidth: '100%',
      position: 'relative',
    }),
    []
  );

  // Route animation
  const startRouteAnimation = useCallback(() => {
    if (!isSingleRun) return;
    const points = geoData.features[0].geometry.coordinates as Coordinate[];
    if (!points || points.length < 2) return;

    if (routeAnimatorRef.current) {
      routeAnimatorRef.current.stop();
    }

    routeAnimatorRef.current = new RouteAnimator(
      points,
      setAnimatedPoints,
      () => {
        routeAnimatorRef.current = null;
      }
    );

    routeAnimatorRef.current.start();
  }, [geoData, isSingleRun]);

  // Auto-play animation on route change
  useEffect(() => {
    if (!isSingleRun) return;
    const pts = geoData.features[0].geometry.coordinates as Coordinate[];
    const key = `${pts.length}-${pts[0]?.join(',')}-${pts[pts.length - 1]?.join(',')}`;
    if (key && key !== lastRouteKeyRef.current) {
      lastRouteKeyRef.current = key;
      startRouteAnimation();
    }
    return () => {
      if (routeAnimatorRef.current) {
        routeAnimatorRef.current.stop();
      }
    };
  }, [geoData, isSingleRun, startRouteAnimation]);

  // Trigger animation from external source
  useEffect(() => {
    if (animationTrigger && animationTrigger > 0 && isSingleRun) {
      startRouteAnimation();
    }
  }, [animationTrigger, isSingleRun, startRouteAnimation]);

  const handleMapClick = useCallback(() => {
    if (!isSingleRun) return;
    startRouteAnimation();
  }, [isSingleRun, startRouteAnimation]);

  // GeoJSON style function
  const geoJsonStyle = useCallback((feature: any) => {
    const name = feature.properties?.name;
    
    if (filterProvinces.includes(name)) {
      return {
        fillColor: PROVINCE_FILL_COLOR,
        fillOpacity: 0.5,
        color: PROVINCE_FILL_COLOR,
        weight: 1,
      };
    }
    
    if (filterCountries.includes(name)) {
      const isChina = name === '中国';
      return {
        fillColor: COUNTRY_FILL_COLOR,
        fillOpacity: isChina ? 0.1 : 0.5,
        color: COUNTRY_FILL_COLOR,
        weight: 1,
      };
    }
    
    return {
      fillColor: 'transparent',
      fillOpacity: 0,
      color: 'transparent',
      weight: 0,
    };
  }, [filterProvinces, filterCountries]);

  // Calculate center and zoom for initial view
  const initialCenter: [number, number] = useMemo(() => {
    return [viewState.latitude || 20, viewState.longitude || 20];
  }, [viewState.latitude, viewState.longitude]);

  const initialZoom = useMemo(() => {
    return viewState.zoom || 3;
  }, [viewState.zoom]);

  return (
    <div style={{ width: '100%' }} id="map-container">
      {/* Year tabs above the map */}
      <RunMapButtons changeYear={changeYear} thisYear={thisYear} />
      
      {/* Map container */}
      <div style={style}>
        <MapContainer
          center={initialCenter}
          zoom={initialZoom}
          style={{ width: '100%', height: '100%' }}
          zoomControl={true}
          scrollWheelZoom={true}
          preferCanvas={true}
          renderer={L.canvas()}
          zoomAnimation={true}
          fadeAnimation={true}
          markerZoomAnimation={true}
          ref={(mapInstance) => {
            if (mapInstance) {
              mapRef.current = mapInstance;
            }
          }}
          whenReady={() => {
            if (mapRef.current) {
              // Map is ready
            }
          }}
        >
        <MapViewController viewState={viewState} setViewState={setViewState} />
        
        <TileLayer
          attribution={tileAttribution}
          url={tileUrl}
          maxZoom={19}
          minZoom={3}
          opacity={1}
          updateWhenZooming={false}
          updateWhenIdle={true}
          keepBuffer={2}
        />

        {/* Render boundary data (provinces and countries) */}
        {combinedGeoData && (
          <GeoJSON
            data={combinedGeoData as any}
            style={geoJsonStyle}
          />
        )}

        {/* Render all routes with optimized rendering */}
        {geoData.features.map((feature, index) => {
          const coordinates = feature.geometry.coordinates as Coordinate[];
          if (coordinates.length === 0) return null;

          // Convert [lon, lat] to [lat, lon] for Leaflet
          const positions = coordinates.map(coord => [coord[1], coord[0]] as [number, number]);
          // Use bright green color for better visibility on light map
          const color = '#22c55e'; // Bright green - highly visible
          // Always use full opacity for better visibility
          const opacity = 1;

          return (
            <Polyline
              key={`route-${index}`}
              positions={positions}
              pathOptions={{
                color: color,
                weight: isBigMap ? 1 : 3, // Thicker lines for better visibility
                opacity: opacity,
                dashArray: dashArray,
                lineJoin: 'round',
                lineCap: 'round',
              }}
              eventHandlers={{
                click: handleMapClick,
              }}
              // Use canvas renderer for better performance
              pane="overlayPane"
            />
          );
        })}

        {/* Render animated route for single run */}
        {isSingleRun && animatedPoints.length > 0 && (
          <Polyline
            positions={animatedPoints.map(coord => [coord[1], coord[0]] as [number, number])}
            pathOptions={{
              color: singleRunColor,
              weight: 3,
              opacity: 1,
            }}
          />
        )}

        {/* Render start/end markers for single run */}
        {isSingleRun && (
          <LeafletRunMarker
            startLat={startLat}
            startLon={startLon}
            endLat={endLat}
            endLon={endLon}
          />
        )}
        </MapContainer>

        <span className={styles.runTitle}>{title}</span>
        {!PRIVACY_MODE && <LightsControl setLights={setLights} lights={lights} />}
      </div>
    </div>
  );
};

export default RunMap;
