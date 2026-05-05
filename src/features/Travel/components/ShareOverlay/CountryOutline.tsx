import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { geoMercator, geoPath } from 'd3-geo';
import type { GeoPermissibleObjects, GeoGeometryObjects } from 'd3-geo';

// Lazy-load GeoJSON so it doesn't block the JS thread on import
const countriesGeoJSON = require('../../../../assets/geo/countries.json');

interface CountryOutlineProps {
  /** English country name, e.g. "Japan", "France" */
  countryName: string;
  /** Width of the SVG canvas */
  width: number;
  /** Height of the SVG canvas */
  height: number;
  /** Stroke color for the outline (default: white) */
  strokeColor?: string;
  /** Stroke width (default: 1.5) */
  strokeWidth?: number;
}

const CountryOutline: React.FC<CountryOutlineProps> = ({
  countryName,
  width,
  height,
  strokeColor = '#ffffff',
  strokeWidth = 1.5,
}) => {
  const { pathData, found } = useMemo(() => {
    if (!countryName || width === 0 || height === 0) {
      return { pathData: null, found: false };
    }

    const normalised = countryName.toLowerCase().trim();

    // Try to find the matching country feature by NAME_EN, ADMIN, or NAME
    const feature = countriesGeoJSON.features.find((f: any) => {
      const p = f.properties;
      return (
        (p.NAME_EN && p.NAME_EN.toLowerCase() === normalised) ||
        (p.ADMIN && p.ADMIN.toLowerCase() === normalised) ||
        (p.NAME && p.NAME.toLowerCase() === normalised)
      );
    });

    if (!feature) {
      return { pathData: null, found: false };
    }

    try {
      // Build a Mercator projection fitted to the canvas with padding
      const padding = 20;
      const projection = geoMercator().fitExtent(
        [[padding, padding], [width - padding, height - padding]],
        feature as GeoPermissibleObjects
      );

      const generator = geoPath().projection(projection);
      const d = generator(feature.geometry as GeoGeometryObjects);
      return { pathData: d, found: true };
    } catch {
      return { pathData: null, found: false };
    }
  }, [countryName, width, height]);

  if (!found || !pathData) {
    return (
      <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
          {countryName ? `Outline not found for "${countryName}"` : 'No country set'}
        </Text>
      </View>
    );
  }

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <G>
        <Path
          d={pathData}
          fill="rgba(255,255,255,0.08)"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
};

export default CountryOutline;
