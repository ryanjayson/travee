import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, G, Circle, Text as SvgText, Rect } from 'react-native-svg';
import { geoMercator, geoPath } from 'd3-geo';
import type { GeoPermissibleObjects, GeoGeometryObjects } from 'd3-geo';

const countriesGeoJSON = require('../../../../assets/geo/countries.json');

export interface DoneActivity {
  lat: number;
  lng: number;
  type?: number;
  title?: string;
}

interface CountryOutlineProps {
  countryName: string;
  width: number;
  height: number;
  strokeColor?: string;
  strokeWidth?: number;
  doneActivities?: DoneActivity[];
  pinSize?: 'small' | 'medium' | 'large';
  showLabels?: boolean;
  destinationTitle?: string;
}

/** Unicode symbol for each ActivityType — safe cross-platform in SVG Text */
const ACTIVITY_EMOJI: Record<number, string> = {
  1:  '✈',  // flight
  2:  '⬆',  // check-in
  3:  '⬇',  // check-out
  4:  '🚕',  // taxi
  5:  '☕',  // cafe
  6:  '🍽',  // food
  7:  '🚶',  // walk
  8:  '📷',  // sightseeing
  9:  '🛍',  // shopping
  10: '🧳',  // preparation
  11: '🚲',  // ride
  12: '🛏',  // rest
};

/** Human-readable label for each ActivityType */
const ACTIVITY_LABEL: Record<number, string> = {
  1:  'Flight',
  2:  'Check-in',
  3:  'Check-out',
  4:  'Taxi',
  5:  'Café',
  6:  'Food',
  7:  'Walk',
  8:  'Sightseeing',
  9:  'Shopping',
  10: 'Prep',
  11: 'Ride',
  12: 'Rest',
};

const PIN_SIZE_R: Record<string, number> = { small: 2, medium: 3, large: 5 };

const CountryOutline: React.FC<CountryOutlineProps> = ({
  countryName,
  width,
  height,
  strokeColor = '#ffffff',
  strokeWidth = 1.5,
  doneActivities = [],
  pinSize = 'medium',
  showLabels = false,
}) => {
  const { pathData, found, activityPoints, topTypes } = useMemo(() => {
    if (!countryName || width === 0 || height === 0) {
      return { pathData: null, found: false, activityPoints: [], topTypes: [] };
    }

    const normalised = countryName.toLowerCase().trim();

    const feature = countriesGeoJSON.features.find((f: any) => {
      const p = f.properties;
      return (
        (p.NAME_EN && p.NAME_EN.toLowerCase() === normalised) ||
        (p.ADMIN  && p.ADMIN.toLowerCase()   === normalised) ||
        (p.NAME   && p.NAME.toLowerCase()    === normalised)
      );
    });

    if (!feature) {
      return { pathData: null, found: false, activityPoints: [], topTypes: [] };
    }

    try {
      const padding = 20;
      const projection = geoMercator().fitExtent(
        [[padding, padding], [width - padding, height - padding]],
        feature as GeoPermissibleObjects
      );

      const generator = geoPath().projection(projection);
      const d = generator(feature.geometry as GeoGeometryObjects);

      // Project each done activity onto the canvas
      const points = doneActivities
        .map(a => {
          const projected = projection([a.lng, a.lat]);
          if (!projected) return null;
          const [x, y] = projected;
          if (x < 0 || y < 0 || x > width || y > height) return null;
          return { x, y, type: a.type, title: a.title };
        })
        .filter((p): p is NonNullable<typeof p> => p !== null);

      // Top 3 activity types by count (for the icon legend)
      const counts: Record<number, number> = {};
      doneActivities.forEach(a => {
        const t = a.type ?? 0;
        if (t === 0) return;
        counts[t] = (counts[t] || 0) + 1;
      });
      const top = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([t, count]) => ({ type: parseInt(t, 10), count }));

      return { pathData: d, found: true, activityPoints: points as Array<{ x: number; y: number; type?: number; title?: string }>, topTypes: top };
    } catch {
      return { pathData: null, found: false, activityPoints: [], topTypes: [] };
    }
  }, [countryName, width, height, doneActivities]);

  if (!found || !pathData) {
    return (
      <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
          {countryName ? `Outline not found for "${countryName}"` : 'No country set'}
        </Text>
      </View>
    );
  }

  const PIN_R = PIN_SIZE_R[pinSize] || 3;

  // Legend icon chip constants
  const CHIP_R = 16;       // circle radius
  const CHIP_GAP = 8;      // gap between chips
  const CHIP_Y = height - 30; // vertical center of legend chips
  const CHIP_START_X = 24; // left margin

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>

      {/* ── Country outline with gradient cast shadow ── */}
      <G>
        <Path
          d={pathData}
          fill="none"
          stroke="rgba(0,0,0,0.08)"
          strokeWidth={strokeWidth + 14}
          strokeLinejoin="round"
          strokeLinecap="round"
          transform="translate(4, 6)"
        />
        <Path
          d={pathData}
          fill="none"
          stroke="rgba(0,0,0,0.14)"
          strokeWidth={strokeWidth + 10}
          strokeLinejoin="round"
          strokeLinecap="round"
          transform="translate(3, 5)"
        />
        <Path
          d={pathData}
          fill="none"
          stroke="rgba(0,0,0,0.22)"
          strokeWidth={strokeWidth + 6}
          strokeLinejoin="round"
          strokeLinecap="round"
          transform="translate(2, 3)"
        />
        <Path
          d={pathData}
          fill="none"
          stroke="rgba(0,0,0,0.30)"
          strokeWidth={strokeWidth + 3}
          strokeLinejoin="round"
          strokeLinecap="round"
          transform="translate(1, 2)"
        />
        <Path
          d={pathData}
          fill="rgba(255,255,255,0.08)"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </G>


      {/* ── Done-activity location pins on the map ── */}
      {activityPoints.map((pt, i) => (
        <G key={i}>
          <Circle cx={pt.x} cy={pt.y + 1} r={PIN_R + 0.5} fill="rgba(0,0,0,0.25)" />
          <Circle cx={pt.x} cy={pt.y}     r={PIN_R}        fill="#ffffff" />
          {showLabels && pt.title ? (
            <SvgText
              x={pt.x}
              y={pt.y + PIN_R + 11}
              fontSize={10}
              fontWeight="bold"
              textAnchor="middle"
              fill="#ffffff"
              stroke="rgba(0,0,0,0.4)"
              strokeWidth={0.3}
            >
              {pt.title}
            </SvgText>
          ) : null}
        </G>
      ))}

      {/* ── Activity type icon legend (top 3 by count) ── */}
      {/* {topTypes.length > 0 && topTypes.map((item, i) => {
        const cx = CHIP_START_X + i * (CHIP_R * 2 + CHIP_GAP) + CHIP_R;
        const emoji  = ACTIVITY_EMOJI[item.type]  ?? '●';
        const label  = ACTIVITY_LABEL[item.type]  ?? '';
        return (
          <G key={`legend-${i}`}>
            <Rect
              x={cx - CHIP_R}
              y={CHIP_Y - CHIP_R}
              width={CHIP_R * 2}
              height={CHIP_R * 2}
              rx={CHIP_R}
              ry={CHIP_R}
              fill="rgba(255,255,255,0.15)"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth={0.8}
            />
            <SvgText
              x={cx}
              y={CHIP_Y + 6}
              fontSize={14}
              textAnchor="middle"
              fill="#ffffff"
            >
              {emoji}
            </SvgText>
          </G>
        );
      })} */}

    </Svg>
  );
};

export default CountryOutline;
