import L from 'leaflet';

/** Adds the app's basemap (MapTiler when a key is set, otherwise Carto Voyager) to a Leaflet map. */
export function addBasemap(map: L.Map) {
  const maptilerKey = import.meta.env.VITE_MAPTILER_API_KEY;
  const voyager = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
  const layer = maptilerKey
    ? L.tileLayer(`https://api.maptiler.com/maps/dataviz-v4/256/{z}/{x}/{y}.png?key=${maptilerKey}`, {
        attribution:
          '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap</a>',
        maxZoom: 19,
        crossOrigin: true,
      })
    : L.tileLayer(voyager, {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
      });
  layer.on('tileerror', () => layer.setUrl(voyager));
  layer.addTo(map);
}
