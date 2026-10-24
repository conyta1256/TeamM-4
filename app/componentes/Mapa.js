"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect, useRef } from "react";
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

function ControlarZoom({ habilitado }) {
  const map = useMap();
  const controlZoom = useRef(null);

  useEffect(() => {
    const interacciones = [
      map.scrollWheelZoom,
      map.doubleClickZoom,
      map.touchZoom,
      map.boxZoom,
      map.keyboard,
    ];

    interacciones.forEach((interaccion) => {
      if (habilitado) {
        interaccion.enable();
      } else {
        interaccion.disable();
      }
    });

    if (habilitado) {
      controlZoom.current = L.control.zoom().addTo(map);
    }

    return () => {
      if (controlZoom.current) {
        controlZoom.current.remove();
        controlZoom.current = null;
      }
    };
  }, [habilitado, map]);

  return null;
}

function RegistrarInteracciones({ onEvento }) {
  const map = useMap();

  useEffect(() => {
    const registrarZoom = () => {
      onEvento("mapa_zoom_cambiado", { zoom: map.getZoom() });
    };
    const registrarDesplazamiento = () => {
      const centro = map.getCenter();
      onEvento("mapa_desplazado", { lat: centro.lat, lng: centro.lng });
    };

    map.on("zoomend", registrarZoom);
    map.on("dragend", registrarDesplazamiento);

    return () => {
      map.off("zoomend", registrarZoom);
      map.off("dragend", registrarDesplazamiento);
    };
  }, [map, onEvento]);

  return null;
}

export default function Mapa({
  marcadores = [],
  zoomHabilitado = false,
  onEvento = () => {},
}) {
  return (
    <MapContainer
      center={VALDIVIA_CENTER}
      zoom={13}
      minZoom={12}
      maxZoom={18}
      maxBounds={VALDIVIA_BOUNDS}
      maxBoundsViscosity={1}
      zoomControl={false}
      style={{ height: "100%", width: "100%" }}
    >
      <ControlarZoom habilitado={zoomHabilitado} />
      <RegistrarInteracciones onEvento={onEvento} />
      <TileLayer
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
          <Marker
            key={punto.id}
            position={punto.position}
            title={punto.nombre}
            eventHandlers={{
              click: () => onEvento("marcador_seleccionado", {
                puntoId: punto.id,
                nombre: punto.nombre,
                lat: punto.position.lat,
                lng: punto.position.lng,
              }),
            }}
          >
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