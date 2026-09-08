import dynamic from "next/dynamic";

// Cargar el mapa dinámicamente solo en el cliente
const Map = dynamic(() => import("./components/Map"), {
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
