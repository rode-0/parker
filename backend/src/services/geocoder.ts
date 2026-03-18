import { geocodeLogger } from "../lib/logger";

export type GeocodingResult = {
  latitude: number;
  longitude: number;
} | null;

let lastRequestTime = 0;

async function throttle(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < 1100) {
    await new Promise((resolve) => setTimeout(resolve, 1100 - elapsed));
  }
  lastRequestTime = Date.now();
}

export async function geocodeAddress(
  address: string,
  city: string,
  state: string,
  zip: string,
  country: string
): Promise<GeocodingResult> {
  await throttle();

  const parts = [address, city, state, zip].filter(Boolean).join(", ");
  const query = encodeURIComponent(`${parts}, ${country}`);
  const cc = country.toLowerCase() === "ca" || country.toLowerCase() === "canada" ? "ca" : "us";
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=${cc}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "GeorgiaGulfInternal/1.0" },
    });
    if (!res.ok) {
      geocodeLogger.warn({ status: res.status, city, state }, "Geocoding HTTP error");
      return null;
    }

    const data = await res.json() as Array<{ lat: string; lon: string }>;
    if (!Array.isArray(data) || data.length === 0) {
      geocodeLogger.warn({ city, state }, "Geocoding returned no results");
      return null;
    }

    return {
      latitude: parseFloat(data[0]!.lat),
      longitude: parseFloat(data[0]!.lon),
    };
  } catch {
    return null;
  }
}
