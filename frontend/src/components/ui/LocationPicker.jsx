import { useState, useRef, useCallback, useEffect } from "react";
import { useLoadScript, GoogleMap } from "@react-google-maps/api";
import { MapPin, Crosshair, Loader2, AlertCircle } from "lucide-react";

const LIBRARIES = [];
const DEFAULT_CENTER = { lat: -1.2921, lng: 36.8219 }; // Nairobi
const COUNTRY_CODES = ["ke", "ug", "tz", "rw", "et"];
const MAP_OPTIONS = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  zoomControlOptions: { position: 9 },
  mapId: "trakvora_map",
};

function reverseGeocode(lat, lng, onResult) {
  const geocoder = new window.google.maps.Geocoder();
  geocoder.geocode({ location: { lat, lng } }, (results, status) => {
    const name =
      status === "OK" && results[0]
        ? results[0].formatted_address
        : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    onResult({ name, lat, lng });
  });
}

// Renders a PlaceAutocompleteElement (new Places API) into a container div.
function PlaceSearch({ onSelect, defaultValue }) {
  const containerRef = useRef(null);

  useEffect(() => {
    let autocompleteEl = null;
    let handler = null;
    let cancelled = false;

    async function init() {
      const { PlaceAutocompleteElement } = await window.google.maps.importLibrary("places");

      if (cancelled) return;

      autocompleteEl = new PlaceAutocompleteElement({
        componentRestrictions: { country: COUNTRY_CODES },
      });

      // Match the existing input styling
      autocompleteEl.style.width = "100%";

      if (containerRef.current) {
        containerRef.current.appendChild(autocompleteEl);
      }

      handler = async (event) => {
        const place = event.placePrediction.toPlace();
        await place.fetchFields({ fields: ["displayName", "formattedAddress", "location"] });
        const lat = place.location.lat();
        const lng = place.location.lng();
        onSelect({ name: place.formattedAddress || place.displayName, lat, lng });
      };

      autocompleteEl.addEventListener("gmp-placeselect", handler);
    }

    init();

    return () => {
      cancelled = true;
      if (autocompleteEl) {
        if (handler) autocompleteEl.removeEventListener("gmp-placeselect", handler);
        autocompleteEl.remove();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex-1 min-w-0" ref={containerRef}>
      <style>{`
        gmp-place-autocomplete {
          --gmp-place-autocomplete-font-size: 0.875rem;
        }
        gmp-place-autocomplete input {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 0.5rem;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        gmp-place-autocomplete input:focus {
          border-color: #fe6a34;
          box-shadow: 0 0 0 2px rgb(254 106 52 / 0.2);
        }
      `}</style>
    </div>
  );
}

// Renders an AdvancedMarkerElement imperatively onto the map.
function MapMarker({ map, position }) {
  useEffect(() => {
    if (!map || !position) return;
    let marker = null;

    async function init() {
      const { AdvancedMarkerElement } = await window.google.maps.importLibrary("marker");
      marker = new AdvancedMarkerElement({ map, position });
    }

    init();

    return () => {
      if (marker) marker.map = null;
    };
  }, [map, position]);

  return null;
}

export default function LocationPicker({ label, value, onChange }) {
  const [mapInstance, setMapInstance] = useState(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
    version: "weekly",
  });

  const marker = value?.lat ? { lat: value.lat, lng: value.lng } : null;

  const handleMapClick = useCallback(
    (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      reverseGeocode(lat, lng, onChange);
    },
    [onChange]
  );

  const handlePlaceSelected = useCallback(
    (loc) => {
      mapInstance?.panTo({ lat: loc.lat, lng: loc.lng });
      mapInstance?.setZoom(14);
      onChange(loc);
    },
    [mapInstance, onChange]
  );

  const handleCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation not supported by this browser.");
      return;
    }
    setLocating(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        mapInstance?.panTo({ lat, lng });
        mapInstance?.setZoom(15);
        reverseGeocode(lat, lng, (loc) => {
          onChange(loc);
          setLocating(false);
        });
      },
      (err) => {
        setGeoError(err.message || "Could not get your location.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [mapInstance, onChange]);

  if (loadError) {
    return (
      <div className="flex flex-col gap-1">
        {label && <span className="text-sm font-medium text-slate-700">{label}</span>}
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Google Maps failed to load. Check your API key.
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex flex-col gap-1">
        {label && <span className="text-sm font-medium text-slate-700">{label}</span>}
        <div className="w-full h-52 bg-slate-100 rounded-lg animate-pulse flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-sm font-medium text-slate-700">{label}</span>
      )}

      {/* Search + current location row */}
      <div className="flex gap-2">
        <PlaceSearch onSelect={handlePlaceSelected} defaultValue={value?.name} />

        <button
          type="button"
          onClick={handleCurrentLocation}
          disabled={locating}
          title="Use my current location"
          className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-60 whitespace-nowrap shrink-0"
        >
          {locating
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Crosshair className="w-4 h-4" />
          }
          My Location
        </button>
      </div>

      {geoError && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {geoError}
        </p>
      )}

      {/* Interactive map */}
      <GoogleMap
        mapContainerClassName="w-full h-52 rounded-lg border border-slate-200 overflow-hidden"
        center={marker ?? DEFAULT_CENTER}
        zoom={marker ? 14 : 6}
        onClick={handleMapClick}
        onLoad={setMapInstance}
        options={MAP_OPTIONS}
      >
        {marker && <MapMarker map={mapInstance} position={marker} />}
      </GoogleMap>

      {/* Coordinates readout */}
      {value?.lat != null && (
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
          <MapPin className="w-3 h-3 text-secondary shrink-0" />
          <span>{value.lat.toFixed(6)}, {value.lng.toFixed(6)}</span>
          {value.name && (
            <span className="truncate text-slate-500 not-italic">{value.name}</span>
          )}
        </div>
      )}
    </div>
  );
}
