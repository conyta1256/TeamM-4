"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";  

//Importe del componente Mapa de manera dinámica para evitar problemas de renderizado en el lado del servidor
const Map = dynamic(() => import("./componentes/Mapa"), {
  ssr: false,
});

export default function Home() {
  const [puntos, setPuntos] = useState([]);

  // 1. Cargar los datos guardados en la api al abrir la página
  
  const cargarPuntos = async () => {
    try {
      const res = await fetch('/api/puntosInteres');
      const data = await res.json();
      setPuntos(data); // Guardamos la lista en el estado
    } catch (err) {
      console.error('Error cargando los puntos:', err);
    }
  };
  useEffect(() => {
    cargarPuntos();
  }, []);

  // Preparar los datos para que el mapa pueda crear los marcadores.
  const crearMarcadores = () => {
    return puntos.flatMap((punto) => {
      const lat = Number(punto.coordX ?? punto.coodX);
      const lng = Number(punto.coordY);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return [];
      }

      return [{
        ...punto,
        id: punto.id,
        nombre: punto.nombre ?? punto.t ?? "Punto de interés",
        position: { lat, lng },
      }];
    });
  };

  return (
    <main style={{ padding: "20px" }}>
      <h1>Nombre del juego</h1>
      <div style={{ height: "800px", marginTop: "20px" }}>
        <Map marcadores={crearMarcadores()} />
      </div>
    </main>
    
  );
}
