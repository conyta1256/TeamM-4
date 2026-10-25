"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import styles from "./page.module.css";

const Map = dynamic(() => import("./componentes/Mapa"), {
  ssr: false,
});

export default function Home() {
  const [puntos, setPuntos] = useState([]);
  const [juegoIniciado, setJuegoIniciado] = useState(false);
  const [puntosDisponibles, setPuntosDisponibles] = useState([]);
  const [puntosDesbloqueados, setPuntosDesbloqueados] = useState([]);
  const [puntuacionTotal, setPuntuacionTotal] = useState(0);

  const registrarEvento = useCallback((action, details = {}) => {
    let sessionId;
    try {
      sessionId = window.sessionStorage.getItem("tour-valdivia-session");
      if (!sessionId) {
        sessionId = window.crypto.randomUUID();
        window.sessionStorage.setItem("tour-valdivia-session", sessionId);
      }
    } catch (error) {
      console.error("No se pudo preparar el evento del log:", error);
      return;
    }

    fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        action,
        details,
        occurredAt: new Date().toISOString(),
      }),
    }).catch((error) => console.error("Error en log:", error));
  }, []);

  useEffect(() => {
    let cancelado = false;

    fetch("/api/puntosInteres")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelado && Array.isArray(data)) {
          const validos = data.flatMap((punto) => {
            const lat = Number(punto.coordX);
            const lng = Number(punto.coordY);

            if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
              return [];
            }

            return [{
              ...punto,
              id: punto.id,
              nombre: punto.nombre || punto.t || "Punto de interés",
              position: { lat, lng },
            }];
          });
          setPuntos(validos);
        }
      })
      .catch((err) => {
        console.error("Error cargando los puntos:", err);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  // Al iniciar el juego, seleccionamos el primer punto al azar
  const handleIniciarJuego = () => {
    if (puntos.length === 0) return;

    const indiceAleatorio = Math.floor(Math.random() * puntos.length);
    const primerPunto = puntos[indiceAleatorio];
    const restantes = puntos.filter((p) => p.id !== primerPunto.id);

    setPuntosDesbloqueados([primerPunto]); // Primer punto visible en el mapa
    setPuntosDisponibles(restantes);       // Restantes ocultos para desbloquear
    setJuegoIniciado(true);

    registrarEvento("juego_iniciado", { puntoId: primerPunto.id });
  };

// Función para manejar cuando se responde correctamente
  const desbloquearSiguientePunto = (puntoId, puntajeGanado = 10) => {
    // Forzamos a que sea un número para evitar concatenaciones de texto
    const puntosNum = Number(puntajeGanado) || 10;
    
    setPuntuacionTotal((prev) => Number(prev) + puntosNum);
    registrarEvento("respuesta_correcta", { puntoId, puntosGanados: puntosNum });

    // Marcamos el punto actual como respondido
    setPuntosDesbloqueados((prev) =>
      prev.map((p) => (p.id === puntoId ? { ...p, respondido: true } : p))
    );

    if (puntosDisponibles.length > 0) {
      const indiceAleatorio = Math.floor(Math.random() * puntosDisponibles.length);
      const siguientePunto = puntosDisponibles[indiceAleatorio];
      const nuevosRestantes = puntosDisponibles.filter((p) => p.id !== siguientePunto.id);

      setPuntosDesbloqueados((prev) => [...prev, siguientePunto]);
      setPuntosDisponibles(nuevosRestantes);
    } else {
      alert("¡Felicidades! Has completado y desbloqueado todos los puntos del tour.");
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.mapBackground} aria-hidden={!juegoIniciado}>
        <Map
          marcadores={juegoIniciado ? puntosDesbloqueados : []}
          zoomHabilitado={juegoIniciado}
          onEvento={registrarEvento}
          onRespuestaCorrecta={desbloquearSiguientePunto} // Conectamos la función para que el mapa la llame al acertar
        />
      </div>

      {/* Panel superior con puntaje y progreso */}
      {juegoIniciado && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          background: 'white',
          padding: '10px 15px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          fontWeight: 'bold',
          fontFamily: 'sans-serif',
          fontSize: '14px'
        }}>
          Puntaje: {puntuacionTotal} | Descubiertos: {puntosDesbloqueados.length} / {puntos.length}
        </div>
      )}

      {!juegoIniciado && (
        <section className={styles.welcome} aria-labelledby="welcome-title">
          <div className={styles.welcomeCard}>
            <p className={styles.eyebrow}>Una aventura por descubrir</p>
            <h1 id="welcome-title">Tour por Valdivia</h1>
            <p className={styles.description}>
              Recorre la ciudad, explora sus lugares de interés y descubre las
              historias que hacen de Valdivia un lugar único.
            </p>
            <button
              className={styles.startButton}
              onClick={handleIniciarJuego}
              disabled={puntos.length === 0}
            >
              Iniciar juego
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
