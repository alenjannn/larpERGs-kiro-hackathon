import { Children, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { spacing } from '../theme';

interface Props {
  children: ReactNode;
  /** Smallest comfortable tile width; the column count follows from it. */
  minTileWidth?: number;
  /** Upper limit on columns (e.g. 5 metrics never go to 6). */
  maxColumns?: number;
  gap?: number;
}

/**
 * Equal-width tiles in as many columns as fit. Unlike flex-wrap with grow,
 * a lone last tile keeps its tile width instead of stretching across the row.
 */
export default function TileGrid({ children, minTileWidth = 150, maxColumns = 6, gap = spacing.sm }: Props) {
  const [width, setWidth] = useState(0);
  const items = Children.toArray(children).filter(Boolean);
  const columns = width > 0 ? Math.max(1, Math.min(maxColumns, items.length, Math.floor((width + gap) / (minTileWidth + gap)))) : 1;
  const tileWidth = width > 0 ? (width - gap * (columns - 1)) / columns : undefined;

  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.floor(e.nativeEvent.layout.width));

  return (
    <View style={[styles.grid, { gap }]} onLayout={onLayout}>
      {items.map((child, i) => (
        <View key={i} style={tileWidth ? { width: tileWidth } : styles.unmeasured}>
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  // Before the first layout pass: one per row, so nothing overflows.
  unmeasured: { width: '100%' },
});
