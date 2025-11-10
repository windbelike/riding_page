import { ReactComponent as EndSvg } from '@assets/end.svg';
import { ReactComponent as StartSvg } from '@assets/start.svg';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { renderToString } from 'react-dom/server';
import styles from './style.module.css';

interface IRunMarkerProperties {
  startLon: number;
  startLat: number;
  endLon: number;
  endLat: number;
}

const LeafletRunMarker = ({
  startLon,
  startLat,
  endLon,
  endLat,
}: IRunMarkerProperties) => {
  // Create custom icons using the SVG components
  const createCustomIcon = (SvgComponent: React.FC<React.SVGProps<SVGSVGElement>>) => {
    const svgString = renderToString(
      <SvgComponent className={styles.locationSVG} />
    );
    return L.divIcon({
      html: svgString,
      className: 'custom-marker-icon',
      iconSize: [25, 25],
      iconAnchor: [12.5, 25],
    });
  };

  const startIcon = createCustomIcon(StartSvg);
  const endIcon = createCustomIcon(EndSvg);

  return (
    <>
      <Marker 
        position={[startLat, startLon]} 
        icon={startIcon}
      />
      <Marker 
        position={[endLat, endLon]} 
        icon={endIcon}
      />
    </>
  );
};

export default LeafletRunMarker;

