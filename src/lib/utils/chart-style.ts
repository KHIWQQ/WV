/**
 * Recharts tooltip style that adapts to the active light/dark theme by
 * reading CSS variables from globals.css. Use as:
 *
 *   <Tooltip
 *     contentStyle={CHART_TOOLTIP_CONTENT}
 *     labelStyle={CHART_TOOLTIP_LABEL}
 *     itemStyle={CHART_TOOLTIP_ITEM}
 *     cursor={CHART_TOOLTIP_CURSOR}
 *   />
 *
 * Replaces hardcoded `rgba(12, 31, 63, 0.95)` (dark navy) tooltips that
 * looked correct in dark mode but jarring in light mode.
 */
export const CHART_TOOLTIP_CONTENT: React.CSSProperties = {
  borderRadius: "12px",
  border: "1px solid hsl(var(--border))",
  backgroundColor: "hsl(var(--popover))",
  color: "hsl(var(--popover-foreground))",
  backdropFilter: "blur(8px)",
  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
  padding: "12px 16px",
};

export const CHART_TOOLTIP_LABEL: React.CSSProperties = {
  fontWeight: 600,
  color: "hsl(var(--popover-foreground))",
  marginBottom: "8px",
};

export const CHART_TOOLTIP_ITEM: React.CSSProperties = {
  color: "hsl(var(--popover-foreground))",
  padding: "2px 0",
};

/**
 * Cursor highlight under the tooltip. `--muted` adapts per theme.
 */
export const CHART_TOOLTIP_CURSOR = {
  fill: "hsl(var(--muted))",
  fillOpacity: 0.5,
};

/**
 * Axis tick / grid stroke that adapts to theme.
 */
export const CHART_AXIS_TICK = {
  fill: "hsl(var(--muted-foreground))",
  fontSize: 12,
};

export const CHART_GRID_STROKE = "hsl(var(--border))";
