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
    }).then((res) => {
      if (!res.ok) {
        throw new Error(`La API de log respondió con estado ${res.status}.`);
      }
    }).catch((error) => {
      console.error("No se pudo registrar la acción del usuario:", error);
    });
  }, []);

  useEffect(() => {
    let cancelado = false;

    fetch("/api/puntosInteres")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelado) {
          setPuntos(data);
        }
      })
      .catch((err) => {
        console.error("Error cargando los puntos:", err);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  const marcadores = puntos.flatMap((punto) => {
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

  return (
    <main className={styles.page}>
      <div className={styles.mapBackground} aria-hidden={!juegoIniciado}>
        <Map
          marcadores={juegoIniciado ? marcadores : []}
          zoomHabilitado={juegoIniciado}
          onEvento={registrarEvento}
        />
      </div>

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
              onClick={() => {
                registrarEvento("juego_iniciado");
                setJuegoIniciado(true);
              }}
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
