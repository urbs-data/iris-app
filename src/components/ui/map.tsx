'use client';

import MapLibreGL, { type PopupOptions, type MarkerOptions } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTheme } from 'next-themes';
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Minus,
  Plus,
  Locate,
  Maximize,
  Loader2,
  Map as MapIcon,
  Satellite,
  Layers
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type MapContextValue = {
  map: MapLibreGL.Map | null;
  isLoaded: boolean;
  isSatelliteMode: boolean;
  setSatelliteMode: (enabled: boolean) => void;
};

const MapContext = createContext<MapContextValue | null>(null);

function useMap() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMap must be used within a Map component');
  }
  return context;
}

const defaultStyles = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  satellite: {
    version: 8,
    sources: {
      'esri-satellite': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256,
        attribution:
          "Powered by <a href='https://www.esri.com/en-us/home' target='_blank'>Esri</a>"
      },
      'esri-labels': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256
      }
    },
    layers: [
      {
        id: 'esri-satellite-layer',
        type: 'raster',
        source: 'esri-satellite',
        minzoom: 0,
        maxzoom: 22
      },
      {
        id: 'esri-labels-layer',
        type: 'raster',
        source: 'esri-labels',
        minzoom: 0,
        maxzoom: 22
      }
    ]
  } as MapLibreGL.StyleSpecification
};

type MapStyleOption = string | MapLibreGL.StyleSpecification;

type MapProps = {
  children?: ReactNode;
  /** Custom map styles for light, dark and satellite themes. Overrides the default styles. */
  styles?: {
    light?: MapStyleOption;
    dark?: MapStyleOption;
    satellite?: MapStyleOption;
  };
  /** Map projection type. Use `{ type: "globe" }` for 3D globe view. */
  projection?: MapLibreGL.ProjectionSpecification;
} & Omit<MapLibreGL.MapOptions, 'container' | 'style'>;

type MapRef = MapLibreGL.Map;

const DefaultLoader = () => (
  <div className='absolute inset-0 flex items-center justify-center'>
    <div className='flex gap-1'>
      <span className='bg-muted-foreground/60 size-1.5 animate-pulse rounded-full' />
      <span className='bg-muted-foreground/60 size-1.5 animate-pulse rounded-full [animation-delay:150ms]' />
      <span className='bg-muted-foreground/60 size-1.5 animate-pulse rounded-full [animation-delay:300ms]' />
    </div>
  </div>
);

const Map = forwardRef<MapRef, MapProps>(function Map(
  { children, styles, projection, ...props },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<MapLibreGL.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isStyleLoaded, setIsStyleLoaded] = useState(false);
  const [isSatelliteMode, setIsSatelliteMode] = useState(false);
  const { resolvedTheme } = useTheme();
  const currentStyleRef = useRef<MapStyleOption | null>(null);
  const styleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mapStyles = useMemo(
    () => ({
      dark: styles?.dark ?? defaultStyles.dark,
      light: styles?.light ?? defaultStyles.light,
      satellite: styles?.satellite ?? defaultStyles.satellite
    }),
    [styles]
  );

  useImperativeHandle(ref, () => mapInstance as MapLibreGL.Map, [mapInstance]);

  const clearStyleTimeout = useCallback(() => {
    if (styleTimeoutRef.current) {
      clearTimeout(styleTimeoutRef.current);
      styleTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const initialStyle =
      resolvedTheme === 'dark' ? mapStyles.dark : mapStyles.light;
    currentStyleRef.current = initialStyle;

    const map = new MapLibreGL.Map({
      container: containerRef.current,
      style: initialStyle,
      renderWorldCopies: false,
      attributionControl: {
        compact: true
      },
      ...props
    });

    const styleDataHandler = () => {
      clearStyleTimeout();
      // Delay to ensure style is fully processed before allowing layer operations
      // This is a workaround to avoid race conditions with the style loading
      styleTimeoutRef.current = setTimeout(() => {
        setIsStyleLoaded(true);
        if (projection) {
          map.setProjection(projection);
        }
      }, 150);
    };
    const loadHandler = () => setIsLoaded(true);

    map.on('load', loadHandler);
    map.on('styledata', styleDataHandler);
    setMapInstance(map);

    return () => {
      clearStyleTimeout();
      map.off('load', loadHandler);
      map.off('styledata', styleDataHandler);
      map.remove();
      setIsLoaded(false);
      setIsStyleLoaded(false);
      setMapInstance(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapInstance || !resolvedTheme) return;
    if (isSatelliteMode) return; // Don't change style if in satellite mode

    const newStyle =
      resolvedTheme === 'dark' ? mapStyles.dark : mapStyles.light;

    if (currentStyleRef.current === newStyle) return;

    clearStyleTimeout();
    currentStyleRef.current = newStyle;
    setIsStyleLoaded(false);

    mapInstance.setStyle(newStyle, { diff: true });
  }, [
    mapInstance,
    resolvedTheme,
    mapStyles,
    clearStyleTimeout,
    isSatelliteMode
  ]);

  const isLoading = !isLoaded || !isStyleLoaded;

  const setSatelliteMode = useCallback(
    (enabled: boolean) => {
      if (!mapInstance || !resolvedTheme) return;

      setIsSatelliteMode(enabled);
      clearStyleTimeout();

      const newStyle = enabled
        ? mapStyles.satellite
        : resolvedTheme === 'dark'
          ? mapStyles.dark
          : mapStyles.light;

      currentStyleRef.current = newStyle;
      setIsStyleLoaded(false);
      mapInstance.setStyle(newStyle, { diff: true });
    },
    [mapInstance, resolvedTheme, mapStyles, clearStyleTimeout]
  );

  const contextValue = useMemo(
    () => ({
      map: mapInstance,
      isLoaded: isLoaded && isStyleLoaded,
      isSatelliteMode,
      setSatelliteMode
    }),
    [mapInstance, isLoaded, isStyleLoaded, isSatelliteMode, setSatelliteMode]
  );

  return (
    <MapContext.Provider value={contextValue}>
      <div ref={containerRef} className='relative h-full w-full'>
        {isLoading && <DefaultLoader />}
        {/* SSR-safe: children render only when map is loaded on client */}
        {mapInstance && children}
      </div>
    </MapContext.Provider>
  );
});

type MarkerContextValue = {
  marker: MapLibreGL.Marker;
  map: MapLibreGL.Map | null;
};

const MarkerContext = createContext<MarkerContextValue | null>(null);

function useMarkerContext() {
  const context = useContext(MarkerContext);
  if (!context) {
    throw new Error('Marker components must be used within MapMarker');
  }
  return context;
}

type MapMarkerProps = {
  /** Longitude coordinate for marker position */
  longitude: number;
  /** Latitude coordinate for marker position */
  latitude: number;
  /** Marker subcomponents (MarkerContent, MarkerPopup, MarkerTooltip, MarkerLabel) */
  children: ReactNode;
  /** Callback when marker is clicked */
  onClick?: (e: MouseEvent) => void;
  /** Callback when mouse enters marker */
  onMouseEnter?: (e: MouseEvent) => void;
  /** Callback when mouse leaves marker */
  onMouseLeave?: (e: MouseEvent) => void;
  /** Callback when marker drag starts (requires draggable: true) */
  onDragStart?: (lngLat: { lng: number; lat: number }) => void;
  /** Callback during marker drag (requires draggable: true) */
  onDrag?: (lngLat: { lng: number; lat: number }) => void;
  /** Callback when marker drag ends (requires draggable: true) */
  onDragEnd?: (lngLat: { lng: number; lat: number }) => void;
} & Omit<MarkerOptions, 'element'>;

function MapMarker({
  longitude,
  latitude,
  children,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onDragStart,
  onDrag,
  onDragEnd,
  draggable = false,
  ...markerOptions
}: MapMarkerProps) {
  const { map } = useMap();

  const marker = useMemo(() => {
    const markerInstance = new MapLibreGL.Marker({
      ...markerOptions,
      element: document.createElement('div'),
      draggable
    }).setLngLat([longitude, latitude]);

    const handleClick = (e: MouseEvent) => onClick?.(e);
    const handleMouseEnter = (e: MouseEvent) => onMouseEnter?.(e);
    const handleMouseLeave = (e: MouseEvent) => onMouseLeave?.(e);

    markerInstance.getElement()?.addEventListener('click', handleClick);
    markerInstance
      .getElement()
      ?.addEventListener('mouseenter', handleMouseEnter);
    markerInstance
      .getElement()
      ?.addEventListener('mouseleave', handleMouseLeave);

    const handleDragStart = () => {
      const lngLat = markerInstance.getLngLat();
      onDragStart?.({ lng: lngLat.lng, lat: lngLat.lat });
    };
    const handleDrag = () => {
      const lngLat = markerInstance.getLngLat();
      onDrag?.({ lng: lngLat.lng, lat: lngLat.lat });
    };
    const handleDragEnd = () => {
      const lngLat = markerInstance.getLngLat();
      onDragEnd?.({ lng: lngLat.lng, lat: lngLat.lat });
    };

    markerInstance.on('dragstart', handleDragStart);
    markerInstance.on('drag', handleDrag);
    markerInstance.on('dragend', handleDragEnd);

    return markerInstance;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!map) return;

    marker.addTo(map);

    return () => {
      marker.remove();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  if (
    marker.getLngLat().lng !== longitude ||
    marker.getLngLat().lat !== latitude
  ) {
    marker.setLngLat([longitude, latitude]);
  }
  if (marker.isDraggable() !== draggable) {
    marker.setDraggable(draggable);
  }

  const currentOffset = marker.getOffset();
  const newOffset = markerOptions.offset ?? [0, 0];
  const [newOffsetX, newOffsetY] = Array.isArray(newOffset)
    ? newOffset
    : [newOffset.x, newOffset.y];
  if (currentOffset.x !== newOffsetX || currentOffset.y !== newOffsetY) {
    marker.setOffset(newOffset);
  }

  if (marker.getRotation() !== markerOptions.rotation) {
    marker.setRotation(markerOptions.rotation ?? 0);
  }
  if (marker.getRotationAlignment() !== markerOptions.rotationAlignment) {
    marker.setRotationAlignment(markerOptions.rotationAlignment ?? 'auto');
  }
  if (marker.getPitchAlignment() !== markerOptions.pitchAlignment) {
    marker.setPitchAlignment(markerOptions.pitchAlignment ?? 'auto');
  }

  return (
    <MarkerContext.Provider value={{ marker, map }}>
      {children}
    </MarkerContext.Provider>
  );
}

type MarkerContentProps = {
  /** Custom marker content. Defaults to a blue dot if not provided */
  children?: ReactNode;
  /** Additional CSS classes for the marker container */
  className?: string;
};

function MarkerContent({ children, className }: MarkerContentProps) {
  const { marker } = useMarkerContext();

  return createPortal(
    <div className={cn('relative cursor-pointer', className)}>
      {children || <DefaultMarkerIcon />}
    </div>,
    marker.getElement()
  );
}

function DefaultMarkerIcon() {
  return (
    <div className='bg-primary relative h-4 w-4 rounded-full border-2 border-white shadow-lg' />
  );
}

type MarkerPopupProps = {
  /** Popup content */
  children: ReactNode;
  /** Additional CSS classes for the popup container */
  className?: string;
  /** Show a close button in the popup (default: false) */
  closeButton?: boolean;
} & Omit<PopupOptions, 'className' | 'closeButton'>;

function MarkerPopup({
  children,
  className,
  closeButton = false,
  ...popupOptions
}: MarkerPopupProps) {
  const { marker, map } = useMarkerContext();
  const container = useMemo(() => document.createElement('div'), []);
  const prevPopupOptions = useRef(popupOptions);

  const popup = useMemo(() => {
    const popupInstance = new MapLibreGL.Popup({
      offset: 16,
      ...popupOptions,
      closeButton: false
    })
      .setMaxWidth('none')
      .setDOMContent(container);

    return popupInstance;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!map) return;

    popup.setDOMContent(container);
    marker.setPopup(popup);

    return () => {
      marker.setPopup(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  if (popup.isOpen()) {
    const prev = prevPopupOptions.current;

    if (prev.offset !== popupOptions.offset) {
      popup.setOffset(popupOptions.offset ?? 16);
    }
    if (prev.maxWidth !== popupOptions.maxWidth && popupOptions.maxWidth) {
      popup.setMaxWidth(popupOptions.maxWidth ?? 'none');
    }

    prevPopupOptions.current = popupOptions;
  }

  const handleClose = () => popup.remove();

  return createPortal(
    <div
      className={cn(
        'bg-popover text-popover-foreground animate-in fade-in-0 zoom-in-95 relative rounded-md border p-3 shadow-md',
        className
      )}
    >
      {closeButton && (
        <button
          type='button'
          onClick={handleClose}
          className='ring-offset-background focus:ring-ring absolute top-1 right-1 z-10 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none'
          aria-label='Close popup'
        >
          <X className='h-4 w-4' />
          <span className='sr-only'>Close</span>
        </button>
      )}
      {children}
    </div>,
    container
  );
}

type MarkerTooltipProps = {
  /** Tooltip content */
  children: ReactNode;
  /** Additional CSS classes for the tooltip container */
  className?: string;
} & Omit<PopupOptions, 'className' | 'closeButton' | 'closeOnClick'>;

function MarkerTooltip({
  children,
  className,
  ...popupOptions
}: MarkerTooltipProps) {
  const { marker, map } = useMarkerContext();
  const container = useMemo(() => document.createElement('div'), []);
  const prevTooltipOptions = useRef(popupOptions);

  const tooltip = useMemo(() => {
    const tooltipInstance = new MapLibreGL.Popup({
      offset: 16,
      ...popupOptions,
      closeOnClick: true,
      closeButton: false
    }).setMaxWidth('none');

    return tooltipInstance;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!map) return;

    tooltip.setDOMContent(container);

    const handleMouseEnter = () => {
      tooltip.setLngLat(marker.getLngLat()).addTo(map);
    };
    const handleMouseLeave = () => tooltip.remove();

    marker.getElement()?.addEventListener('mouseenter', handleMouseEnter);
    marker.getElement()?.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      marker.getElement()?.removeEventListener('mouseenter', handleMouseEnter);
      marker.getElement()?.removeEventListener('mouseleave', handleMouseLeave);
      tooltip.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  if (tooltip.isOpen()) {
    const prev = prevTooltipOptions.current;

    if (prev.offset !== popupOptions.offset) {
      tooltip.setOffset(popupOptions.offset ?? 16);
    }
    if (prev.maxWidth !== popupOptions.maxWidth && popupOptions.maxWidth) {
      tooltip.setMaxWidth(popupOptions.maxWidth ?? 'none');
    }

    prevTooltipOptions.current = popupOptions;
  }

  return createPortal(
    <div
      className={cn(
        'bg-foreground text-background animate-in fade-in-0 zoom-in-95 rounded-md px-2 py-1 text-xs shadow-md',
        className
      )}
    >
      {children}
    </div>,
    container
  );
}

type MarkerLabelProps = {
  /** Label text content */
  children: ReactNode;
  /** Additional CSS classes for the label */
  className?: string;
  /** Position of the label relative to the marker (default: "top") */
  position?: 'top' | 'bottom';
};

function MarkerLabel({
  children,
  className,
  position = 'top'
}: MarkerLabelProps) {
  const positionClasses = {
    top: 'bottom-full mb-1',
    bottom: 'top-full mt-1'
  };

  return (
    <div
      className={cn(
        'absolute left-1/2 -translate-x-1/2 whitespace-nowrap',
        'text-foreground text-[10px] font-medium',
        positionClasses[position],
        className
      )}
    >
      {children}
    </div>
  );
}

type MapControlsProps = {
  /** Position of the controls on the map (default: "bottom-right") */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Show zoom in/out buttons (default: true) */
  showZoom?: boolean;
  /** Show compass button to reset bearing (default: false) */
  showCompass?: boolean;
  /** Show locate button to find user's location (default: false) */
  showLocate?: boolean;
  /** Show fullscreen toggle button (default: false) */
  showFullscreen?: boolean;
  /** Additional CSS classes for the controls container */
  className?: string;
  /** Callback with user coordinates when located */
  onLocate?: (coords: { longitude: number; latitude: number }) => void;
};

const positionClasses = {
  'top-left': 'top-4 left-4',
  'top-right': 'top-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-right': 'bottom-16 right-4'
};

function ControlGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className='border-border bg-background [&>button:not(:last-child)]:border-border flex flex-col overflow-hidden rounded-md border shadow-sm [&>button:not(:last-child)]:border-b'>
      {children}
    </div>
  );
}

function ControlButton({
  onClick,
  label,
  children,
  disabled = false
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      type='button'
      className={cn(
        'hover:bg-accent dark:hover:bg-accent/40 flex size-8 items-center justify-center transition-colors',
        disabled && 'pointer-events-none cursor-not-allowed opacity-50'
      )}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function MapControls({
  position = 'bottom-right',
  showZoom = true,
  showCompass = false,
  showLocate = false,
  showFullscreen = false,
  className,
  onLocate
}: MapControlsProps) {
  const { map, isLoaded } = useMap();
  const [waitingForLocation, setWaitingForLocation] = useState(false);

  const handleZoomIn = useCallback(() => {
    map?.zoomTo(map.getZoom() + 1, { duration: 300 });
  }, [map]);

  const handleZoomOut = useCallback(() => {
    map?.zoomTo(map.getZoom() - 1, { duration: 300 });
  }, [map]);

  const handleResetBearing = useCallback(() => {
    map?.resetNorthPitch({ duration: 300 });
  }, [map]);

  const handleLocate = useCallback(() => {
    setWaitingForLocation(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            longitude: pos.coords.longitude,
            latitude: pos.coords.latitude
          };
          map?.flyTo({
            center: [coords.longitude, coords.latitude],
            zoom: 14,
            duration: 1500
          });
          onLocate?.(coords);
          setWaitingForLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setWaitingForLocation(false);
        }
      );
    }
  }, [map, onLocate]);

  const handleFullscreen = useCallback(() => {
    const container = map?.getContainer();
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  }, [map]);

  if (!isLoaded) return null;

  return (
    <div
      className={cn(
        'absolute z-10 flex flex-col gap-1.5',
        positionClasses[position],
        className
      )}
    >
      {showZoom && (
        <ControlGroup>
          <ControlButton onClick={handleZoomIn} label='Zoom in'>
            <Plus className='size-4' />
          </ControlButton>
          <ControlButton onClick={handleZoomOut} label='Zoom out'>
            <Minus className='size-4' />
          </ControlButton>
        </ControlGroup>
      )}
      {showCompass && (
        <ControlGroup>
          <CompassButton onClick={handleResetBearing} />
        </ControlGroup>
      )}
      {showLocate && (
        <ControlGroup>
          <ControlButton
            onClick={handleLocate}
            label='Find my location'
            disabled={waitingForLocation}
          >
            {waitingForLocation ? (
              <Loader2 className='size-4 animate-spin' />
            ) : (
              <Locate className='size-4' />
            )}
          </ControlButton>
        </ControlGroup>
      )}
      {showFullscreen && (
        <ControlGroup>
          <ControlButton onClick={handleFullscreen} label='Toggle fullscreen'>
            <Maximize className='size-4' />
          </ControlButton>
        </ControlGroup>
      )}
    </div>
  );
}

function CompassButton({ onClick }: { onClick: () => void }) {
  const { isLoaded, map } = useMap();
  const compassRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!isLoaded || !map || !compassRef.current) return;

    const compass = compassRef.current;

    const updateRotation = () => {
      const bearing = map.getBearing();
      const pitch = map.getPitch();
      compass.style.transform = `rotateX(${pitch}deg) rotateZ(${-bearing}deg)`;
    };

    map.on('rotate', updateRotation);
    map.on('pitch', updateRotation);
    updateRotation();

    return () => {
      map.off('rotate', updateRotation);
      map.off('pitch', updateRotation);
    };
  }, [isLoaded, map]);

  return (
    <ControlButton onClick={onClick} label='Reset bearing to north'>
      <svg
        ref={compassRef}
        viewBox='0 0 24 24'
        className='size-5 transition-transform duration-200'
        style={{ transformStyle: 'preserve-3d' }}
      >
        <path d='M12 2L16 12H12V2Z' className='fill-red-500' />
        <path d='M12 2L8 12H12V2Z' className='fill-red-300' />
        <path d='M12 22L16 12H12V22Z' className='fill-muted-foreground/60' />
        <path d='M12 22L8 12H12V22Z' className='fill-muted-foreground/30' />
      </svg>
    </ControlButton>
  );
}

type MapPopupProps = {
  /** Longitude coordinate for popup position */
  longitude: number;
  /** Latitude coordinate for popup position */
  latitude: number;
  /** Callback when popup is closed */
  onClose?: () => void;
  /** Popup content */
  children: ReactNode;
  /** Additional CSS classes for the popup container */
  className?: string;
  /** Show a close button in the popup (default: false) */
  closeButton?: boolean;
} & Omit<PopupOptions, 'className' | 'closeButton'>;

function MapPopup({
  longitude,
  latitude,
  onClose,
  children,
  className,
  closeButton = false,
  ...popupOptions
}: MapPopupProps) {
  const { map } = useMap();
  const popupOptionsRef = useRef(popupOptions);
  const container = useMemo(() => document.createElement('div'), []);

  const popup = useMemo(() => {
    const popupInstance = new MapLibreGL.Popup({
      offset: 16,
      ...popupOptions,
      closeButton: false
    })
      .setMaxWidth('none')
      .setLngLat([longitude, latitude]);

    return popupInstance;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!map) return;

    const onCloseProp = () => onClose?.();
    popup.on('close', onCloseProp);

    popup.setDOMContent(container);
    popup.addTo(map);

    return () => {
      popup.off('close', onCloseProp);
      if (popup.isOpen()) {
        popup.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  if (popup.isOpen()) {
    const prev = popupOptionsRef.current;

    if (
      popup.getLngLat().lng !== longitude ||
      popup.getLngLat().lat !== latitude
    ) {
      popup.setLngLat([longitude, latitude]);
    }

    if (prev.offset !== popupOptions.offset) {
      popup.setOffset(popupOptions.offset ?? 16);
    }
    if (prev.maxWidth !== popupOptions.maxWidth && popupOptions.maxWidth) {
      popup.setMaxWidth(popupOptions.maxWidth ?? 'none');
    }
    popupOptionsRef.current = popupOptions;
  }

  const handleClose = () => {
    popup.remove();
    onClose?.();
  };

  return createPortal(
    <div
      className={cn(
        'bg-popover text-popover-foreground animate-in fade-in-0 zoom-in-95 relative rounded-md border p-3 shadow-md',
        className
      )}
    >
      {closeButton && (
        <button
          type='button'
          onClick={handleClose}
          className='ring-offset-background focus:ring-ring absolute top-1 right-1 z-10 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none'
          aria-label='Close popup'
        >
          <X className='h-4 w-4' />
          <span className='sr-only'>Close</span>
        </button>
      )}
      {children}
    </div>,
    container
  );
}

type MapRouteProps = {
  /** Optional unique identifier for the route layer */
  id?: string;
  /** Array of [longitude, latitude] coordinate pairs defining the route */
  coordinates: [number, number][];
  /** Line color as CSS color value (default: "#4285F4") */
  color?: string;
  /** Line width in pixels (default: 3) */
  width?: number;
  /** Line opacity from 0 to 1 (default: 0.8) */
  opacity?: number;
  /** Dash pattern [dash length, gap length] for dashed lines */
  dashArray?: [number, number];
  /** Callback when the route line is clicked */
  onClick?: () => void;
  /** Callback when mouse enters the route line */
  onMouseEnter?: () => void;
  /** Callback when mouse leaves the route line */
  onMouseLeave?: () => void;
  /** Whether the route is interactive - shows pointer cursor on hover (default: true) */
  interactive?: boolean;
};

function MapRoute({
  id: propId,
  coordinates,
  color = '#4285F4',
  width = 3,
  opacity = 0.8,
  dashArray,
  onClick,
  onMouseEnter,
  onMouseLeave,
  interactive = true
}: MapRouteProps) {
  const { map, isLoaded } = useMap();
  const autoId = useId();
  const id = propId ?? autoId;
  const sourceId = `route-source-${id}`;
  const layerId = `route-layer-${id}`;

  // Add source and layer on mount
  useEffect(() => {
    if (!isLoaded || !map) return;

    map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: [] }
      }
    });

    map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': color,
        'line-width': width,
        'line-opacity': opacity,
        ...(dashArray && { 'line-dasharray': dashArray })
      }
    });

    return () => {
      try {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, map]);

  // When coordinates change, update the source data
  useEffect(() => {
    if (!isLoaded || !map || coordinates.length < 2) return;

    const source = map.getSource(sourceId) as MapLibreGL.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates }
      });
    }
  }, [isLoaded, map, coordinates, sourceId]);

  useEffect(() => {
    if (!isLoaded || !map || !map.getLayer(layerId)) return;

    map.setPaintProperty(layerId, 'line-color', color);
    map.setPaintProperty(layerId, 'line-width', width);
    map.setPaintProperty(layerId, 'line-opacity', opacity);
    if (dashArray) {
      map.setPaintProperty(layerId, 'line-dasharray', dashArray);
    }
  }, [isLoaded, map, layerId, color, width, opacity, dashArray]);

  // Handle click and hover events
  useEffect(() => {
    if (!isLoaded || !map || !interactive) return;

    const handleClick = () => {
      onClick?.();
    };
    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = 'pointer';
      onMouseEnter?.();
    };
    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = '';
      onMouseLeave?.();
    };

    map.on('click', layerId, handleClick);
    map.on('mouseenter', layerId, handleMouseEnter);
    map.on('mouseleave', layerId, handleMouseLeave);

    return () => {
      map.off('click', layerId, handleClick);
      map.off('mouseenter', layerId, handleMouseEnter);
      map.off('mouseleave', layerId, handleMouseLeave);
    };
  }, [
    isLoaded,
    map,
    layerId,
    onClick,
    onMouseEnter,
    onMouseLeave,
    interactive
  ]);

  return null;
}

type MapClusterLayerProps<
  P extends GeoJSON.GeoJsonProperties = GeoJSON.GeoJsonProperties
> = {
  /** GeoJSON FeatureCollection data or URL to fetch GeoJSON from */
  data: string | GeoJSON.FeatureCollection<GeoJSON.Point, P>;
  /** Maximum zoom level to cluster points on (default: 14) */
  clusterMaxZoom?: number;
  /** Radius of each cluster when clustering points in pixels (default: 50) */
  clusterRadius?: number;
  /** Colors for cluster circles: [small, medium, large] based on point count (default: ["#51bbd6", "#f1f075", "#f28cb1"]) */
  clusterColors?: [string, string, string];
  /** Point count thresholds for color/size steps: [medium, large] (default: [100, 750]) */
  clusterThresholds?: [number, number];
  /** Color for unclustered individual points (default: "#3b82f6") */
  pointColor?: string;
  /** Callback when an unclustered point is clicked */
  onPointClick?: (
    feature: GeoJSON.Feature<GeoJSON.Point, P>,
    coordinates: [number, number]
  ) => void;
  /** Callback when a cluster is clicked. If not provided, zooms into the cluster */
  onClusterClick?: (
    clusterId: number,
    coordinates: [number, number],
    pointCount: number
  ) => void;
};

function MapClusterLayer<
  P extends GeoJSON.GeoJsonProperties = GeoJSON.GeoJsonProperties
>({
  data,
  clusterMaxZoom = 14,
  clusterRadius = 50,
  clusterColors = ['#51bbd6', '#f1f075', '#f28cb1'],
  clusterThresholds = [100, 750],
  pointColor = '#3b82f6',
  onPointClick,
  onClusterClick
}: MapClusterLayerProps<P>) {
  const { map, isLoaded } = useMap();
  const id = useId();
  const sourceId = `cluster-source-${id}`;
  const clusterLayerId = `clusters-${id}`;
  const clusterCountLayerId = `cluster-count-${id}`;
  const unclusteredLayerId = `unclustered-point-${id}`;

  const stylePropsRef = useRef({
    clusterColors,
    clusterThresholds,
    pointColor
  });

  // Add source and layers on mount
  useEffect(() => {
    if (!isLoaded || !map) return;

    // Add clustered GeoJSON source
    map.addSource(sourceId, {
      type: 'geojson',
      data,
      cluster: true,
      clusterMaxZoom,
      clusterRadius
    });

    // Add cluster circles layer
    map.addLayer({
      id: clusterLayerId,
      type: 'circle',
      source: sourceId,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          clusterColors[0],
          clusterThresholds[0],
          clusterColors[1],
          clusterThresholds[1],
          clusterColors[2]
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20,
          clusterThresholds[0],
          30,
          clusterThresholds[1],
          40
        ]
      }
    });

    // Add cluster count text layer
    map.addLayer({
      id: clusterCountLayerId,
      type: 'symbol',
      source: sourceId,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-size': 12
      },
      paint: {
        'text-color': '#fff'
      }
    });

    // Add unclustered point layer
    map.addLayer({
      id: unclusteredLayerId,
      type: 'circle',
      source: sourceId,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': pointColor,
        'circle-radius': 6
      }
    });

    return () => {
      try {
        if (map.getLayer(clusterCountLayerId))
          map.removeLayer(clusterCountLayerId);
        if (map.getLayer(unclusteredLayerId))
          map.removeLayer(unclusteredLayerId);
        if (map.getLayer(clusterLayerId)) map.removeLayer(clusterLayerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, map, sourceId]);

  // Update source data when data prop changes (only for non-URL data)
  useEffect(() => {
    if (!isLoaded || !map || typeof data === 'string') return;

    const source = map.getSource(sourceId) as MapLibreGL.GeoJSONSource;
    if (source) {
      source.setData(data);
    }
  }, [isLoaded, map, data, sourceId]);

  // Update layer styles when props change
  useEffect(() => {
    if (!isLoaded || !map) return;

    const prev = stylePropsRef.current;
    const colorsChanged =
      prev.clusterColors !== clusterColors ||
      prev.clusterThresholds !== clusterThresholds;

    // Update cluster layer colors and sizes
    if (map.getLayer(clusterLayerId) && colorsChanged) {
      map.setPaintProperty(clusterLayerId, 'circle-color', [
        'step',
        ['get', 'point_count'],
        clusterColors[0],
        clusterThresholds[0],
        clusterColors[1],
        clusterThresholds[1],
        clusterColors[2]
      ]);
      map.setPaintProperty(clusterLayerId, 'circle-radius', [
        'step',
        ['get', 'point_count'],
        20,
        clusterThresholds[0],
        30,
        clusterThresholds[1],
        40
      ]);
    }

    // Update unclustered point layer color
    if (map.getLayer(unclusteredLayerId) && prev.pointColor !== pointColor) {
      map.setPaintProperty(unclusteredLayerId, 'circle-color', pointColor);
    }

    stylePropsRef.current = { clusterColors, clusterThresholds, pointColor };
  }, [
    isLoaded,
    map,
    clusterLayerId,
    unclusteredLayerId,
    clusterColors,
    clusterThresholds,
    pointColor
  ]);

  // Handle click events
  useEffect(() => {
    if (!isLoaded || !map) return;

    // Cluster click handler - zoom into cluster
    const handleClusterClick = async (
      e: MapLibreGL.MapMouseEvent & {
        features?: MapLibreGL.MapGeoJSONFeature[];
      }
    ) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [clusterLayerId]
      });
      if (!features.length) return;

      const feature = features[0];
      const clusterId = feature.properties?.cluster_id as number;
      const pointCount = feature.properties?.point_count as number;
      const coordinates = (feature.geometry as GeoJSON.Point).coordinates as [
        number,
        number
      ];

      if (onClusterClick) {
        onClusterClick(clusterId, coordinates, pointCount);
      } else {
        // Default behavior: zoom to cluster expansion zoom
        const source = map.getSource(sourceId) as MapLibreGL.GeoJSONSource;
        const zoom = await source.getClusterExpansionZoom(clusterId);
        map.easeTo({
          center: coordinates,
          zoom
        });
      }
    };

    // Unclustered point click handler
    const handlePointClick = (
      e: MapLibreGL.MapMouseEvent & {
        features?: MapLibreGL.MapGeoJSONFeature[];
      }
    ) => {
      if (!onPointClick || !e.features?.length) return;

      const feature = e.features[0];
      const coordinates = (
        feature.geometry as GeoJSON.Point
      ).coordinates.slice() as [number, number];

      // Handle world copies
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      onPointClick(
        feature as unknown as GeoJSON.Feature<GeoJSON.Point, P>,
        coordinates
      );
    };

    // Cursor style handlers
    const handleMouseEnterCluster = () => {
      map.getCanvas().style.cursor = 'pointer';
    };
    const handleMouseLeaveCluster = () => {
      map.getCanvas().style.cursor = '';
    };
    const handleMouseEnterPoint = () => {
      if (onPointClick) {
        map.getCanvas().style.cursor = 'pointer';
      }
    };
    const handleMouseLeavePoint = () => {
      map.getCanvas().style.cursor = '';
    };

    map.on('click', clusterLayerId, handleClusterClick);
    map.on('click', unclusteredLayerId, handlePointClick);
    map.on('mouseenter', clusterLayerId, handleMouseEnterCluster);
    map.on('mouseleave', clusterLayerId, handleMouseLeaveCluster);
    map.on('mouseenter', unclusteredLayerId, handleMouseEnterPoint);
    map.on('mouseleave', unclusteredLayerId, handleMouseLeavePoint);

    return () => {
      map.off('click', clusterLayerId, handleClusterClick);
      map.off('click', unclusteredLayerId, handlePointClick);
      map.off('mouseenter', clusterLayerId, handleMouseEnterCluster);
      map.off('mouseleave', clusterLayerId, handleMouseLeaveCluster);
      map.off('mouseenter', unclusteredLayerId, handleMouseEnterPoint);
      map.off('mouseleave', unclusteredLayerId, handleMouseLeavePoint);
    };
  }, [
    isLoaded,
    map,
    clusterLayerId,
    unclusteredLayerId,
    sourceId,
    onClusterClick,
    onPointClick
  ]);

  return null;
}

type MapStyleControlProps = {
  /** Position of the control on the map (default: "top-right") */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Additional CSS classes for the control container */
  className?: string;
};

function MapStyleControl({
  position = 'top-right',
  className
}: MapStyleControlProps) {
  const { isLoaded, isSatelliteMode, setSatelliteMode } = useMap();

  const handleToggleSatellite = useCallback(() => {
    setSatelliteMode(!isSatelliteMode);
  }, [isSatelliteMode, setSatelliteMode]);

  if (!isLoaded) return null;

  return (
    <div
      className={cn(
        'absolute z-10 flex flex-col gap-1.5',
        positionClasses[position],
        className
      )}
    >
      <ControlGroup>
        <ControlButton
          onClick={handleToggleSatellite}
          label={isSatelliteMode ? 'Volver a mapa' : 'Vista satelital'}
        >
          <div
            className={cn(
              'flex items-center justify-center',
              isSatelliteMode && 'text-primary'
            )}
          >
            {isSatelliteMode ? (
              <MapIcon className='size-4' />
            ) : (
              <Satellite className='size-4' />
            )}
          </div>
        </ControlButton>
      </ControlGroup>
    </div>
  );
}

type GeoJSONLayersProps = {
  /** GeoJSON data to display */
  data: GeoJSON.FeatureCollection;
  /** Source ID for the layer */
  sourceId: string;
  /** Property name to use for feature identification (default: "name") */
  propertyKey?: string;
  /** Colors palette for features. If not enough colors, will cycle through */
  colors?: string[];
  /** Position of the layer control (default: "top-left") */
  controlPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Show tooltip on hover (default: true) */
  showTooltip?: boolean;
};

const defaultColors = [
  // '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  // '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16' // lime
];

const darkenColor = (color: string, percent: number = 30): string => {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = ((num >> 8) & 0x00ff) - amt;
  const B = (num & 0x0000ff) - amt;
  return (
    '#' +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
};

function GeoJSONLayer({
  data,
  sourceId,
  propertyKey = 'name',
  colors = defaultColors,
  controlPosition = 'top-left',
  showTooltip = true
}: GeoJSONLayersProps) {
  const { map, isLoaded } = useMap();
  const [hoveredArea, setHoveredArea] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Extract unique feature names and assign colors
  const featureInfo = useMemo(() => {
    const features = data.features
      .map((f) => f.properties?.[propertyKey])
      .filter((name): name is string => Boolean(name));

    const uniqueFeatures = Array.from(new Set(features));

    // Create color mapping
    const colorMap: Record<string, { fill: string; stroke: string }> = {};
    uniqueFeatures.forEach((name, index) => {
      const colorIndex = index % colors.length;
      const fillColor = colors[colorIndex];
      const strokeColor = darkenColor(fillColor);
      colorMap[name] = { fill: fillColor, stroke: strokeColor };
    });

    return { features: uniqueFeatures, colorMap };
  }, [data, propertyKey, colors]);

  // State for selected features (all selected by default)
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(
    () => new Set(featureInfo.features)
  );

  // Update selected features when data changes
  useEffect(() => {
    setSelectedFeatures(new Set(featureInfo.features));
  }, [featureInfo.features]);

  // Build MapLibre color expressions
  const { fillColorExpression, strokeColorExpression } = useMemo(() => {
    const fillExpression: any[] = ['match', ['get', propertyKey]];
    const strokeExpression: any[] = ['match', ['get', propertyKey]];

    Object.entries(featureInfo.colorMap).forEach(([name, { fill, stroke }]) => {
      fillExpression.push(name, fill);
      strokeExpression.push(name, stroke);
    });

    // Default colors
    fillExpression.push('#6b7280');
    strokeExpression.push('#374151');

    return {
      fillColorExpression: fillExpression,
      strokeColorExpression: strokeExpression
    };
  }, [featureInfo.colorMap, propertyKey]);

  const addLayers = useCallback(() => {
    if (!map || !isLoaded) return;

    const fillLayerId = `${sourceId}-fill`;
    const outlineLayerId = `${sourceId}-outline`;

    // Add source if it doesn't exist
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: 'geojson',
        data
      });
    }

    // Add fill layer if it doesn't exist
    if (!map.getLayer(fillLayerId)) {
      map.addLayer({
        id: fillLayerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': fillColorExpression as any,
          'fill-opacity': 0.4
        }
      });
    }

    // Add outline layer if it doesn't exist
    if (!map.getLayer(outlineLayerId)) {
      map.addLayer({
        id: outlineLayerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': strokeColorExpression as any,
          'line-width': 2
        }
      });
    }
  }, [
    map,
    isLoaded,
    sourceId,
    data,
    fillColorExpression,
    strokeColorExpression
  ]);

  useEffect(() => {
    if (!map || !isLoaded) return;

    addLayers();

    const fillLayerId = `${sourceId}-fill`;
    const outlineLayerId = `${sourceId}-outline`;

    // Update filter based on selected features
    if (map.getLayer(fillLayerId) && map.getLayer(outlineLayerId)) {
      if (selectedFeatures.size === 0) {
        // Hide all features
        map.setFilter(fillLayerId, ['==', ['get', propertyKey], '']);
        map.setFilter(outlineLayerId, ['==', ['get', propertyKey], '']);
      } else if (selectedFeatures.size === featureInfo.features.length) {
        // Show all features
        map.setFilter(fillLayerId, null);
        map.setFilter(outlineLayerId, null);
      } else {
        // Show only selected features
        const filter = [
          'in',
          ['get', propertyKey],
          ['literal', Array.from(selectedFeatures)]
        ] as any;
        map.setFilter(fillLayerId, filter);
        map.setFilter(outlineLayerId, filter);
      }
    }
  }, [
    map,
    isLoaded,
    selectedFeatures,
    addLayers,
    sourceId,
    propertyKey,
    featureInfo.features.length
  ]);

  useEffect(() => {
    if (!map || !isLoaded || !showTooltip) return;

    const fillLayerId = `${sourceId}-fill`;

    // Hover effect
    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = '';
      setHoveredArea(null);
    };

    const handleMouseMove = (e: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [fillLayerId]
      });
      if (features.length > 0) {
        setHoveredArea(features[0].properties?.[propertyKey] || null);
      }
    };

    map.on('mouseenter', fillLayerId, handleMouseEnter);
    map.on('mouseleave', fillLayerId, handleMouseLeave);
    map.on('mousemove', fillLayerId, handleMouseMove);

    return () => {
      map.off('mouseenter', fillLayerId, handleMouseEnter);
      map.off('mouseleave', fillLayerId, handleMouseLeave);
      map.off('mousemove', fillLayerId, handleMouseMove);
    };
  }, [map, isLoaded, sourceId, propertyKey, showTooltip]);

  const toggleFeature = (feature: string) => {
    setSelectedFeatures((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(feature)) {
        newSet.delete(feature);
      } else {
        newSet.add(feature);
      }
      return newSet;
    });
  };

  const handleTogglePanel = useCallback(() => {
    setIsPanelOpen((prev) => !prev);
  }, []);

  // Get color indicator for each feature
  const getFeatureColor = (feature: string) => {
    return featureInfo.colorMap[feature]?.fill || '#6b7280';
  };

  if (!isLoaded) return null;

  return (
    <>
      {/* Control Button */}
      <div
        className={cn(
          'absolute z-10 flex flex-col gap-1.5',
          positionClasses[controlPosition]
        )}
      >
        <ControlGroup>
          <ControlButton
            onClick={handleTogglePanel}
            label={isPanelOpen ? 'Ocultar capas' : 'Mostrar capas'}
          >
            <div
              className={cn(
                'flex items-center justify-center',
                isPanelOpen && 'text-primary'
              )}
            >
              <Layers className='size-4' />
            </div>
          </ControlButton>
        </ControlGroup>
      </div>

      {/* Layers Panel */}
      {isPanelOpen && (
        <div
          className={cn(
            'absolute z-10',
            controlPosition === 'top-left' && 'top-3 left-16',
            controlPosition === 'top-right' && 'top-3 right-16',
            controlPosition === 'bottom-left' && 'bottom-3 left-16',
            controlPosition === 'bottom-right' && 'right-16 bottom-3'
          )}
        >
          <div className='bg-background/95 flex flex-col gap-1 rounded-md border p-2 shadow-lg backdrop-blur'>
            {featureInfo.features.map((feature) => {
              const isSelected = selectedFeatures.has(feature);
              const color = getFeatureColor(feature);

              return (
                <Button
                  key={feature}
                  size='sm'
                  variant={isSelected ? 'default' : 'secondary'}
                  onClick={() => toggleFeature(feature)}
                  className='h-7 justify-start px-2 py-1 text-xs'
                >
                  <div
                    className='mr-1 size-2 rounded-full border border-white/20'
                    style={{
                      backgroundColor: isSelected ? color : 'transparent',
                      borderColor: color
                    }}
                  />
                  <span>{feature}</span>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && hoveredArea && (
        <div className='bg-background/90 absolute bottom-3 left-3 z-10 rounded-md border px-3 py-2 text-sm font-medium backdrop-blur'>
          {hoveredArea}
        </div>
      )}
    </>
  );
}

export {
  Map,
  useMap,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MarkerTooltip,
  MarkerLabel,
  MapPopup,
  MapControls,
  MapRoute,
  MapClusterLayer,
  MapStyleControl,
  GeoJSONLayer
};

export type { MapRef };
