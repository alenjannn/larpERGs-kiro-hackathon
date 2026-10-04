import { useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { colors } from '../../../shared/theme';

/**
 * Stylised, fictional barangay drawn with plain Views (no SVG, no tiles, no
 * network), so it renders offline, in Expo Go and in the web export. All
 * geometry is in normalised 0..1 coordinates and converted to pixels from the
 * measured size, so lines keep their shape on narrow screens.
 *
 * Purely decorative: hidden from screen readers and never receives touches.
 * Street and place names are invented DEMO labels, not real addresses.
 */

type Pt = readonly [number, number];
type Size = { w: number; h: number };

const MAP = {
  land: '#F4F1E4',
  block: '#ECE7D5',
  building: '#DCDCD5',
  buildingEdge: '#C9C9C0',
  park: '#D5EDCB',
  parkEdge: '#A8D39A',
  tree: '#9CCB8C',
  water: '#BEE3F6',
  waterEdge: '#8CC6E6',
  waterText: '#1E5A85',
  road: '#FFFFFF',
  roadEdge: '#C5CBD3',
  side: '#FBFAF6',
  boundary: '#64748B',
  halo: 'rgba(255,255,255,0.8)',
};

const MAIN_ROADS: readonly (readonly Pt[])[] = [
  // Mabini Ave
  [[0, 0.6], [0.3, 0.57], [0.62, 0.53], [1, 0.5]],
  // Rizal St
  [[0.4, 0], [0.41, 0.3], [0.43, 0.6], [0.46, 1]],
  // Sampaguita Rd
  [[0.62, 0.53], [0.75, 0.3], [0.86, 0.12], [0.92, 0]],
];

const SIDE_STREETS: readonly (readonly Pt[])[] = [
  [[0, 0.3], [0.41, 0.3]], // Kalachuchi St
  [[0.44, 0.9], [0.72, 0.92], [1, 0.93]], // Ilang-Ilang St
  [[0.2, 0.585], [0.2, 1]],
  [[0.75, 0.3], [1, 0.31]],
  [[0.6, 0], [0.62, 0.53]],
];

/** Creek centre line as a smooth curve, sampled into short segments. */
const creekAt = (t: number): Pt => [t, 0.9 - 0.18 * t + 0.05 * Math.sin(t * Math.PI * 2.2)];
const CREEK: Pt[] = Array.from({ length: 25 }, (_, i) => creekAt(i / 24));

/** [x, y, width, height], normalised. Placed inside blocks, clear of roads. */
const BUILDINGS: readonly (readonly [number, number, number, number])[] = [
  [0.05, 0.07, 0.07, 0.06],
  [0.14, 0.08, 0.05, 0.08],
  [0.24, 0.06, 0.09, 0.06],
  [0.05, 0.18, 0.06, 0.07],
  [0.27, 0.17, 0.08, 0.06],
  [0.47, 0.07, 0.06, 0.07],
  [0.47, 0.18, 0.08, 0.06],
  [0.53, 0.36, 0.06, 0.07],
  [0.8, 0.38, 0.07, 0.06],
  [0.5, 0.62, 0.07, 0.06],
  [0.6, 0.62, 0.05, 0.07],
  [0.78, 0.56, 0.08, 0.06],
  [0.88, 0.6, 0.06, 0.07],
  [0.27, 0.66, 0.08, 0.06],
  [0.05, 0.66, 0.07, 0.07],
  [0.88, 0.8, 0.06, 0.06],
];

const PARK = { x: 0.08, y: 0.36, w: 0.22, h: 0.15 };
const TREES: readonly Pt[] = [[0.11, 0.4], [0.27, 0.4], [0.11, 0.47], [0.27, 0.47], [0.19, 0.39]];

type StreetLabel = { text: string; at: Pt; along: readonly [Pt, Pt]; minor?: boolean; water?: boolean };

const LABELS: readonly StreetLabel[] = [
  { text: 'Mabini Ave', at: [0.81, 0.515], along: [[0.62, 0.53], [1, 0.5]] },
  { text: 'Rizal St', at: [0.416, 0.16], along: [[0.4, 0], [0.41, 0.3]] },
  { text: 'Sampaguita Rd', at: [0.805, 0.21], along: [[0.75, 0.3], [0.86, 0.12]] },
  { text: 'Kalachuchi St', at: [0.22, 0.3], along: [[0, 0.3], [0.41, 0.3]], minor: true },
  { text: 'Ilang-Ilang St', at: [0.6, 0.912], along: [[0.44, 0.9], [0.72, 0.92]], minor: true },
  { text: 'Sapa Creek', at: creekAt(0.6), along: [creekAt(0.56), creekAt(0.64)], water: true },
];

/** A straight stroke from a to b with rounded caps, as a rotated View. */
function Segment({ a, b, size, thickness, color }: { a: Pt; b: Pt; size: Size; thickness: number; color: string }) {
  const x1 = a[0] * size.w;
  const y1 = a[1] * size.h;
  const x2 = b[0] * size.w;
  const y2 = b[1] * size.h;
  // Extend by the thickness so neighbouring segments overlap at the joints.
  const len = Math.hypot(x2 - x1, y2 - y1) + thickness;
  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  return (
    <View
      style={{
        position: 'absolute',
        left: (x1 + x2) / 2 - len / 2,
        top: (y1 + y2) / 2 - thickness / 2,
        width: len,
        height: thickness,
        borderRadius: thickness / 2,
        backgroundColor: color,
        transform: [{ rotate: `${angle}deg` }],
      }}
    />
  );
}

function pairs(line: readonly Pt[]): [Pt, Pt][] {
  return line.slice(1).map((p, i) => [line[i], p]);
}

/** Outline pass for every line first, then fill pass, so crossings join cleanly. */
function Lines({ lines, size, thickness, fill, edge }: { lines: readonly (readonly Pt[])[]; size: Size; thickness: number; fill: string; edge: string }) {
  const segs = lines.flatMap(pairs);
  return (
    <>
      {segs.map(([a, b], i) => (
        <Segment key={`e${i}`} a={a} b={b} size={size} thickness={thickness + 2} color={edge} />
      ))}
      {segs.map(([a, b], i) => (
        <Segment key={`f${i}`} a={a} b={b} size={size} thickness={thickness} color={fill} />
      ))}
    </>
  );
}

function Label({ label, size, fontSize }: { label: StreetLabel; size: Size; fontSize: number }) {
  const [a, b] = label.along;
  let angle = (Math.atan2((b[1] - a[1]) * size.h, (b[0] - a[0]) * size.w) * 180) / Math.PI;
  // Keep text upright.
  if (angle > 90) angle -= 180;
  if (angle < -90) angle += 180;
  const boxW = 120;
  return (
    <View
      style={[
        styles.labelBox,
        { left: label.at[0] * size.w - boxW / 2, top: label.at[1] * size.h - fontSize, width: boxW, height: fontSize * 2, transform: [{ rotate: `${angle}deg` }] },
      ]}
    >
      <Text
        numberOfLines={1}
        style={[styles.streetText, { fontSize }, label.water ? styles.waterText : null, label.minor ? styles.minorText : null]}
      >
        {label.text}
      </Text>
    </View>
  );
}

export default function BarangayMapBackdrop() {
  const [size, setSize] = useState<Size | null>(null);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!size || Math.abs(size.w - width) > 0.5 || Math.abs(size.h - height) > 0.5) setSize({ w: width, h: height });
  };

  const narrow = size != null && size.w < 340;
  const fontSize = narrow ? 9 : 11;
  const mainW = narrow ? 8 : 10;
  const sideW = narrow ? 4 : 5;
  const creekW = narrow ? 7 : 9;

  return (
    <View
      style={styles.fill}
      onLayout={onLayout}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden
    >
      {size ? (
        <>
          {/* Subtle city blocks */}
          {Array.from({ length: 6 }, (_, r) =>
            Array.from({ length: 7 }, (_, c) => (
              <View
                key={`b${r}-${c}`}
                style={[styles.block, { left: `${(c / 7) * 100 + 1}%`, top: `${(r / 6) * 100 + 1.2}%`, width: `${100 / 7 - 2}%`, height: `${100 / 6 - 2.4}%` }]}
              />
            ))
          )}

          {/* Park */}
          <View style={[styles.park, { left: `${PARK.x * 100}%`, top: `${PARK.y * 100}%`, width: `${PARK.w * 100}%`, height: `${PARK.h * 100}%` }]} />
          {TREES.map(([x, y], i) => (
            <View key={`t${i}`} style={[styles.tree, { left: x * size.w - 5, top: y * size.h - 5 }]} />
          ))}
          <View style={[styles.parkLabelBox, { left: `${PARK.x * 100}%`, top: `${(PARK.y + PARK.h / 2) * 100}%`, width: `${PARK.w * 100}%` }]}>
            <Text style={[styles.parkText, { fontSize }]} numberOfLines={1}>
              Plaza Park
            </Text>
          </View>

          {/* Buildings */}
          {BUILDINGS.map(([x, y, w, h], i) => (
            <View key={`h${i}`} style={[styles.building, { left: `${x * 100}%`, top: `${y * 100}%`, width: `${w * 100}%`, height: `${h * 100}%` }]} />
          ))}

          {/* Creek, then roads on top so crossings read as bridges */}
          <Lines lines={[CREEK]} size={size} thickness={creekW} fill={MAP.water} edge={MAP.waterEdge} />
          <Lines lines={SIDE_STREETS} size={size} thickness={sideW} fill={MAP.side} edge={MAP.roadEdge} />
          <Lines lines={MAIN_ROADS} size={size} thickness={mainW} fill={MAP.road} edge={MAP.roadEdge} />

          {LABELS.filter((l) => !(narrow && l.minor)).map((l) => (
            <Label key={l.text} label={l} size={size} fontSize={fontSize} />
          ))}

          {/* Barangay boundary */}
          <View style={styles.boundary} />

          {/* Overlays */}
          <View style={styles.badge}>
            <Text style={[styles.badgeText, { fontSize }]}>approximate DEMO location</Text>
          </View>

          <View style={[styles.compass, narrow ? styles.compassNarrow : null]}>
            <Text style={styles.compassArrow}>▲</Text>
            <Text style={styles.compassN}>N</Text>
          </View>

          <View style={styles.scale}>
            <View style={styles.scaleBar}>
              <View style={styles.scaleTickL} />
              <View style={styles.scaleTickR} />
            </View>
            <Text style={[styles.noteText, { fontSize }]}>Not to scale</Text>
          </View>

          <View style={styles.boundaryNote}>
            <View style={styles.boundarySwatch} />
            <Text style={[styles.noteText, { fontSize }]} numberOfLines={1}>
              {narrow ? 'Brgy. Tuloy (DEMO)' : 'Brgy. Tuloy boundary (DEMO)'}
            </Text>
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: MAP.land, borderRadius: 8, overflow: 'hidden', pointerEvents: 'none' },
  block: { position: 'absolute', backgroundColor: MAP.block, borderRadius: 3 },
  building: { position: 'absolute', backgroundColor: MAP.building, borderWidth: 1, borderColor: MAP.buildingEdge, borderRadius: 2 },
  park: { position: 'absolute', backgroundColor: MAP.park, borderWidth: 1, borderColor: MAP.parkEdge, borderRadius: 14 },
  tree: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: MAP.tree },
  parkLabelBox: { position: 'absolute', alignItems: 'center', marginTop: -8 },
  parkText: { color: colors.success, fontWeight: '600' },
  labelBox: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  streetText: { color: colors.muted, fontWeight: '600', backgroundColor: MAP.halo, paddingHorizontal: 3, borderRadius: 3, overflow: 'hidden' },
  minorText: { fontWeight: '400' },
  waterText: { color: MAP.waterText, fontStyle: 'italic', backgroundColor: 'rgba(255,255,255,0.65)' },
  boundary: {
    position: 'absolute',
    left: '3%',
    top: '3%',
    right: '3%',
    bottom: '3%',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: MAP.boundary,
    borderRadius: 16,
  },
  badge: {
    position: 'absolute',
    left: 8,
    top: 8,
    backgroundColor: MAP.halo,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeText: { color: colors.text, fontWeight: '600' },
  compass: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: MAP.halo,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassNarrow: { transform: [{ scale: 0.85 }] },
  compassArrow: { fontSize: 10, lineHeight: 11, color: colors.text },
  compassN: { fontSize: 11, lineHeight: 12, fontWeight: '700', color: colors.text },
  scale: {
    position: 'absolute',
    left: 8,
    bottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: MAP.halo,
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  scaleBar: { width: 28, height: 6, borderBottomWidth: 2, borderColor: colors.text },
  scaleTickL: { position: 'absolute', left: 0, bottom: -2, width: 2, height: 6, backgroundColor: colors.text },
  scaleTickR: { position: 'absolute', right: 0, bottom: -2, width: 2, height: 6, backgroundColor: colors.text },
  noteText: { color: colors.text },
  boundaryNote: {
    position: 'absolute',
    right: 8,
    bottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: MAP.halo,
    borderRadius: 4,
    paddingHorizontal: 4,
    maxWidth: '55%',
  },
  boundarySwatch: { width: 16, height: 0, borderTopWidth: 2, borderStyle: 'dashed', borderColor: MAP.boundary },
});
