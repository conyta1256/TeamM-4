"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";  

//Importe del componente Mapa de manera dinámica para evitar problemas de renderizado en el lado del servidor
const Map = dynamic(() => import("./componentes/Mapa"), {
  ssr: false,
});

export default function Home() {

  // 1. Cargar los datos guardados en la api al abrir la página
  
  const cargarPuntos = async () => {
    try {
      const res = await fetch('/api/puntosInteres/data/info.json');
      const data = await res.json();
      setPuntos(data); // Guardamos la lista en el estado
    } catch (err) {
      console.error('Error cargando los puntos:', err);
    }
  };
  useEffect(() => {
    cargarPuntos();
  }, []);

  // 2. Leer data con usarla pare crear puntos interactivos en el mapa.
  const crearMarcadores = () => {
    return puntos.map((punto) => (
      <Marker
        key={punto.id}
        position={{ lat: punto.coordX, lng: punto.coordY }}
        title={punto.nombre}
      />
    ));
  };


  // 3. cargar datos guardados en puntajes.json en la api (se usara como tablero de puntajes en el inicio de la app, se podra
  // ver los 5 mayores puntajes del usuario y al finalizar la partida se podra guardar si es mayor al puntaje guardado en la api)
  const puntajes = async (nuevoPuntaje) => {
    try {
      const les = await fetch('/api/puntosInteres/data/puntajes.json');
      const puntaje = await les.json();
      setPuntos(puntaje);
    } catch (err) {
      console.error('Error cargando los puntos:', err);
    }
  };
  useEffect(() => {
    puntajes();
  }, []);

  return (
    <main style={{ padding: "20px" }}>
      <h1>Nombre del juego juego</h1>
      <div style={{ height: "400px", marginTop: "20px" }}>
        <Map />
      </div>
    </main>
    
  );
}
