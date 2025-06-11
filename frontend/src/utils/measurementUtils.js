// Utility functions for measurement processing and conversions

/**
 * Convert measurements to a standard unit (meters) for consistency
 */
export const convertToMeters = (value, unit) => {
  const conversions = {
    'm': 1,
    'cm': 0.01,
    'ft': 0.3048,
    'in': 0.0254
  };
  
  return parseFloat(value) * (conversions[unit] || 1);
};

/**
 * Legacy function for backward compatibility
 */
export const convertToFeet = (value, unit) => {
  const meters = convertToMeters(value, unit);
  return meters * 3.28084; // Convert meters to feet
};

/**
 * Calculate furniture scale ratios based on measurements
 */
export const calculateScaleRatios = (measurements) => {
  if (!measurements || measurements.length === 0) {
    return null;
  }

  const wallMeasurements = measurements.filter(m => m.type === 'wall');
  const ceilingMeasurements = measurements.filter(m => m.type === 'ceiling');
  
  let roomWidth = null;
  let roomHeight = null;
  
  if (wallMeasurements.length > 0) {
    // Take the longest wall measurement as room width
    const widths = wallMeasurements.map(m => convertToMeters(m.dimension.value, m.dimension.unit));
    roomWidth = Math.max(...widths);
  }
  
  if (ceilingMeasurements.length > 0) {
    // Take ceiling height
    const heights = ceilingMeasurements.map(m => convertToMeters(m.dimension.value, m.dimension.unit));
    roomHeight = Math.max(...heights);
  }
  
  return {
    roomWidth,
    roomHeight,
    hasRealMeasurements: true
  };
};

/**
 * Get optimal furniture scale category based on measurements
 */
export const getFurnitureScaleCategory = (measurements) => {
  const scaleData = calculateScaleRatios(measurements);
  
  if (!scaleData || !scaleData.roomWidth) {
    return 'medium';
  }
  
  const width = scaleData.roomWidth;
  
  // Metric thresholds
  if (width < 2.4) {     // Less than 2.4m (8ft)
    return 'small';
  } else if (width > 4.9) { // Greater than 4.9m (16ft)
    return 'large';
  } else {
    return 'medium';
  }
};

/**
 * Determine if space is too narrow for kitchen islands
 */
export const isSpaceTooNarrowForIsland = (measurements) => {
  const scaleData = calculateScaleRatios(measurements);
  
  if (!scaleData || !scaleData.roomWidth) {
    return false; // Can't determine, allow island
  }
  
  return scaleData.roomWidth < 3.0; // Less than 3m (10ft)
};

/**
 * Get spatial constraints text for AI prompts
 */
export const getSpatialConstraints = (measurements) => {
  const scaleData = calculateScaleRatios(measurements);
  
  if (!scaleData || !scaleData.roomWidth) {
    return '';
  }
  
  const width = scaleData.roomWidth;
  
  if (width < 3.0) {
    return `CRITICAL: Very narrow space (${width.toFixed(1)}m) - NO kitchen islands possible. Use galley layout only.`;
  } else if (width < 3.7) {
    return `WARNING: Limited width (${width.toFixed(1)}m) - small peninsula only, avoid full islands.`;
  } else {
    return `SPACIOUS: Room width ${width.toFixed(1)}m allows standard kitchen layouts.`;
  }
};

/**
 * Format measurements for display
 */
export const formatMeasurement = (measurement) => {
  return `${measurement.dimension.value}${measurement.dimension.unit}`;
};

/**
 * Format metric measurement for display (auto-convert to best unit)
 */
export const formatMetricMeasurement = (valueInMeters) => {
  if (valueInMeters >= 1) {
    return `${valueInMeters.toFixed(1)}m`;
  } else {
    return `${(valueInMeters * 100).toFixed(0)}cm`;
  }
};

/**
 * Validate measurement data
 */
export const validateMeasurements = (measurements) => {
  if (!Array.isArray(measurements)) {
    return false;
  }
  
  return measurements.every(m => 
    m.dimension && 
    m.dimension.value && 
    m.dimension.unit && 
    m.type &&
    !isNaN(parseFloat(m.dimension.value))
  );
}; 