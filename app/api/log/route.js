import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

const archivo = path.join(process.cwd(), "app", "api", "log", "data", "log.json");

function leerEventos() {
  if (!fs.existsSync(archivo)) {
    return [];
  }

  const contenido = fs.readFileSync(archivo, "utf8");
  if (!contenido.trim()) {
    return [];
  }

  const eventos = JSON.parse(contenido);
  if (!Array.isArray(eventos)) {
    throw new Error("El archivo de log debe contener una lista de eventos.");
  }

  return eventos;
}

export async function GET() {
  try {
    return NextResponse.json(leerEventos());
  } catch (error) {
    console.error("Error al leer el log:", error);
    return NextResponse.json({ error: "No se pudo leer el log." }, { status: 500 });
  }
}

export async function POST(request) {
  let entrada;

  try {
    entrada = await request.json();
  } catch {
    return NextResponse.json({ error: "El cuerpo debe ser JSON válido." }, { status: 400 });
  }

  if (
    !entrada
    || typeof entrada.action !== "string"
    || !entrada.action.trim()
    || entrada.action.length > 100
    || typeof entrada.sessionId !== "string"
    || !entrada.sessionId.trim()
    || entrada.sessionId.length > 128
  ) {
    return NextResponse.json(
      { error: "Se requiere una acción y un identificador de sesión válido." },
      { status: 400 },
    );
  }

  if (
    entrada.details != null
    && (typeof entrada.details !== "object" || Array.isArray(entrada.details))
  ) {
    return NextResponse.json(
      { error: "Los detalles del evento deben ser un objeto." },
      { status: 400 },
    );
  }

  try {
    const eventos = leerEventos();
    const evento = {
      id: randomUUID(),
      sessionId: entrada.sessionId.trim(),
      action: entrada.action.trim(),
      details: entrada.details ?? {},
      occurredAt: typeof entrada.occurredAt === "string" ? entrada.occurredAt : null,
      recordedAt: new Date().toISOString(),
    };

    fs.mkdirSync(path.dirname(archivo), { recursive: true });
    fs.writeFileSync(archivo, JSON.stringify([...eventos, evento], null, 2), "utf8");

    return NextResponse.json({ mensaje: "Evento guardado.", evento }, { status: 201 });
  } catch (error) {
    console.error("Error al guardar el evento del log:", error);
    return NextResponse.json({ error: "No se pudo guardar el evento." }, { status: 500 });
  }
}
