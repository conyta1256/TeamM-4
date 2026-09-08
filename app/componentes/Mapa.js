"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// 1. Delimitar las coordenadas del área (Ejemplo: Valdivia y sus alrededores)
const boundsRegion = [
  [-39.95, -73.35], // Suroeste
  [-39.70, -73.10]  // Noreste
];

export default function Mapa() {
  const center = [-39.8142, -73.2459];

  return (
    <MapContainer
      center={center}
      zoom={13}
      minZoom={11} // Impide alejar demasiado la cámara fuera de la región
      maxZoom={18} // Límite de zoom cercano
      maxBounds={boundsRegion} // Restringe el área visible
      maxBoundsViscosity={1.0} // Evita que se pueda arrastrar fuera (efecto 'rebote')
      style={{ height: "1000px", width: "100%", borderRadius: "12px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={center}>
        <Popup>Región delimitada</Popup>
      </Marker>
    </MapContainer>
  );
}