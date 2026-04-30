import { useEffect, useRef } from "react";
import { useLoadScript } from "@react-google-maps/api";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

const LIBRARIES = [];
const COUNTRY_CODES = ["ke", "ug", "tz", "rw", "et"];

export default function LocationSearch({ label, value, onChange, placeholder }) {
  const containerRef = useRef(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
    version: "weekly",
  });

  useEffect(() => {
    if (!isLoaded) return;
    let el = null;
    let handler = null;
    let cancelled = false;

    (async () => {
      const { PlaceAutocompleteElement } = await window.google.maps.importLibrary("places");
      if (cancelled || !containerRef.current) return;

      el = new PlaceAutocompleteElement({ componentRestrictions: { country: COUNTRY_CODES } });
      containerRef.current.appendChild(el);

      handler = async (e) => {
        const place = e.placePrediction.toPlace();
        await place.fetchFields({ fields: ["displayName", "formattedAddress", "location"] });
        onChange({
          name: place.formattedAddress || place.displayName,
          lat: place.location.lat(),
          lng: place.location.lng(),
        });
      };

      el.addEventListener("gmp-placeselect", handler);
    })();

    return () => {
      cancelled = true;
      if (handler && el) el.removeEventListener("gmp-placeselect", handler);
      el?.remove();
    };
  }, [isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loadError) {
    return (
      <div>
        {label && <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</span>}
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Maps failed to load. Check your API key.
        </div>
      </div>
    );
  }

  return (
    <div>
      {label && (
        <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          {label}
        </span>
      )}

      <style>{`
        gmp-place-autocomplete { width: 100%; display: block; }
        gmp-place-autocomplete input {
          width: 100%;
          padding: 0.625rem 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          background: #f8fafc;
          color: #0f172a;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        gmp-place-autocomplete input::placeholder { color: #94a3b8; }
        gmp-place-autocomplete input:focus {
          border-color: #fe6a34;
          box-shadow: 0 0 0 2px rgb(254 106 52 / 0.2);
        }
      `}</style>

      {!isLoaded ? (
        <div className="w-full h-11 bg-slate-100 rounded-lg animate-pulse flex items-center px-3 gap-2">
          <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
          <span className="text-xs text-slate-400">Loading maps…</span>
        </div>
      ) : (
        <div ref={containerRef} />
      )}

      {value?.lat && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
          <span className="text-xs text-slate-600 truncate">{value.name}</span>
          <span className="text-[11px] text-slate-400 font-mono shrink-0 ml-auto">
            {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
          </span>
        </div>
      )}
    </div>
  );
}
