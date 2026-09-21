"use client";

import dynamic from "next/dynamic";

//Importe del componente Mapa de manera dinámica para evitar problemas de renderizado en el lado del servidor
const Map = dynamic(() => import("./componentes/Mapa"), {
  ssr: false,
});

export default function Home() {
  return (
    <main style={{ padding: "20px" }}>
      <h1>Turismo</h1>
      <div style={{ height: "400px", marginTop: "20px" }}>
        <Map />
      </div>
    </main>
  );
}
