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

const VALDIVIA_CENTER = [-39.8142, -73.2459];
const VALDIVIA_BOUNDS = [
  [-39.95, -73.45],
  [-39.68, -73.04],
];

export default function Mapa({ marcadores = [] }) {
  return (
    <MapContainer
      //Dimensiones del mapa y zoom inicial
      center={VALDIVIA_CENTER}
      zoom={13}
      minZoom={12}
      maxZoom={18}
      maxBounds={VALDIVIA_BOUNDS}
      maxBoundsViscosity={1}
      style={{ height: "100%", width: "100%", borderRadius: "12px" }}
    >
      <TileLayer
        //Muestra el mapa y la fuente de los datos (OpenStreetMap)
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {marcadores
        .filter(({ position }) =>
          position.lat >= VALDIVIA_BOUNDS[0][0]
          && position.lat <= VALDIVIA_BOUNDS[1][0]
          && position.lng >= VALDIVIA_BOUNDS[0][1]
          && position.lng <= VALDIVIA_BOUNDS[1][1]
        )
        .map((punto) => (
        <Marker key={punto.id} position={punto.position} title={punto.nombre}>
          <Popup>
            <strong>{punto.nombre}</strong>
            {punto.fecha && <p><strong>Fecha:</strong> {punto.fecha}</p>}
            {punto.info && <p>{punto.info}</p>}
            {punto.pregunta && <p><strong>Pregunta:</strong> {punto.pregunta}</p>}
            {(punto.respuesta1 || punto.respuesta2 || punto.repsuesta2 || punto.respuesta3) && (
              <p>
                <strong>Respuestas:</strong>{" "}
                {[punto.respuesta1, punto.respuesta2 ?? punto.repsuesta2, punto.respuesta3]
                  .filter(Boolean)
                  .join(" / ")}
              </p>
            )}
            {punto.puntaje != null && <p><strong>Puntaje:</strong> {punto.puntaje}</p>}
          </Popup>
        </Marker>
        ))}
    </MapContainer>
  );
}