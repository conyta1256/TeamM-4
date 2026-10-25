"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const ICONO_PREGUNTA = L.divIcon({
  className: "question-marker",
  html: "?",
  iconSize: [36, 44],
  iconAnchor: [18, 44],
  popupAnchor: [0, -40],
});
const ICONO_CORRECTO = L.divIcon({
  className: "question-marker correcto",
  html: "✓", // O una "X" si prefieres
  iconSize: [36, 44],
  iconAnchor: [18, 44],
  popupAnchor: [0, -40],
});

const ICONO_INCORRECTO = L.divIcon({
  className: "question-marker incorrecto",
  html: "✕", // Marca visual de error
  iconSize: [36, 44],
  iconAnchor: [18, 44],
  popupAnchor: [0, -40],
});

const VALDIVIA_CENTER = [-39.8142, -73.2459];
const VALDIVIA_BOUNDS = [
  [-39.95, -73.45],
  [-39.68, -73.04],
];

function ControlarZoom({ habilitado }) {
  const map = useMap();
  const controlZoomRef = useRef(null);

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

    if (habilitado && !controlZoomRef.current) {
      controlZoomRef.current = L.control.zoom();
      controlZoomRef.current.addTo(map);
    } else if (!habilitado && controlZoomRef.current) {
      map.removeControl(controlZoomRef.current);
      controlZoomRef.current = null;
    }

    return () => {
      if (controlZoomRef.current) {
        try {
          map.removeControl(controlZoomRef.current);
        } catch (e) {}
        controlZoomRef.current = null;
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

function AutoPanPopup() {
  const map = useMap();

  useEffect(() => {
    const handlePopupOpen = (e) => {
      const marker = e.popup._source;
      if (marker) {
        const latLng = marker.getLatLng();
        
        // Centramos el mapa en el marcador, desplazándolo ligeramente hacia abajo 
        // para que la tarjeta del popup (que se abre hacia arriba) tenga espacio de sobra.
        map.setView([latLng.lat + 0.003, latLng.lng], map.getZoom(), {
          animate: true,
          duration: 0.3
        });
      }
    };

    map.on("popupopen", handlePopupOpen);
    return () => {
      map.off("popupopen", handlePopupOpen);
    };
  }, [map]);

  return null;
}
export default function Mapa({
  marcadores = [],
  zoomHabilitado = false,
  onEvento = () => {},
  onRespuestaCorrecta = () => {},
}) {
  const [mensajesFeedback, setMensajesFeedback] = useState({});
  // Estado para llevar el registro visual de qué puntos fallaron o acertaron
  const [estadosPuntos, setEstadosPuntos] = useState({});

  const manejarRespuesta = (punto, opcionSeleccionada) => {
    const esCorrecta = (opcionSeleccionada === punto.respuesta3);

    if (esCorrecta) {
      setEstadosPuntos((prev) => ({ ...prev, [punto.id]: 'correcto' }));
      setMensajesFeedback((prev) => ({
        ...prev,
        [punto.id]: { texto: "¡Correcto! Nuevo punto desbloqueado.", esError: false }
      }));

      setTimeout(() => {
        onRespuestaCorrecta(punto.id, punto.puntaje || 10);
      }, 1000);
    } else {
      // Si falla, cambiamos su estado a 'incorrecto' para reflejarlo en el marcador
      setEstadosPuntos((prev) => ({ ...prev, [punto.id]: 'incorrecto' }));
      setMensajesFeedback((prev) => ({
        ...prev,
        [punto.id]: { texto: "Incorrecto, prueba otra vez.", esError: true }
      }));
    }
  };

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
      <AutoPanPopup />
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
        .map((punto) => {
          const feedback = mensajesFeedback[punto.id];
          const estado = estadosPuntos[punto.id];

          // Determinar qué icono mostrar según el estado actual del punto
          let iconoActual = ICONO_PREGUNTA;
          if (punto.respondido || estado === 'correcto') {
            iconoActual = ICONO_CORRECTO;
          } else if (estado === 'incorrecto') {
            iconoActual = ICONO_INCORRECTO;
          }

          return (
            <Marker
              key={punto.id}
              position={punto.position}
              icon={iconoActual}
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
              <Popup autoPan={true} autoPanPadding={[50, 50]}> 
              <strong>{punto.nombre}</strong>
              {punto.fecha && <p><strong>Fecha:</strong> {punto.fecha}</p>}
              {punto.info && <p>{punto.info}</p>}
              {punto.pregunta && <p><strong>Pregunta:</strong> {punto.pregunta}</p>}
              
              {/* Opciones interactivas de respuesta */}
              {(!punto.respondido && estado !== 'correcto') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold' }}>Selecciona una respuesta:</p>
                  {[
                    punto.respuesta1, 
                    punto.respuesta2 ?? punto.repsuesta2, 
                    punto.respuesta3
                  ]
                    .filter(Boolean)
                    .sort(() => Math.random() - 0.5)
                    .map((opcion, idx) => (
                      <button
                        key={idx}
                        onClick={() => manejarRespuesta(punto, opcion)}
                        style={{
                          padding: '6px 10px',
                          background: '#f0f0f0',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '13px'
                        }}
                      >
                        {opcion}
                      </button>
                    ))}
                </div>
              )}

              {feedback && (
                <p style={{
                  marginTop: '8px',
                  fontWeight: 'bold',
                  color: feedback.esError ? 'red' : 'green',
                  fontSize: '13px'
                }}>
                  {feedback.texto}
                </p>
              )}

              {(punto.respondido || estado === 'correcto') && (
                <p style={{ color: 'green', fontWeight: 'bold', marginTop: '8px' }}>¡Pregunta respondida con éxito!</p>
              )}

            {punto.puntaje != null && <p style={{ marginTop: '8px' }}><strong>Puntaje:</strong> {punto.puntaje}</p>}
          </Popup>
                
            </Marker>
          );
        })}
    </MapContainer>
  );
}