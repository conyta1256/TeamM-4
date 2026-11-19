import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const TAMANO_MAXIMO_LOTE = 20;
const UUID_VALIDO = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function obtenerSql() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Falta configurar DATABASE_URL para conectar con Neon.");
  }
  return neon(databaseUrl);
}

function esObjeto(valor) {
  return valor !== null && typeof valor === "object" && !Array.isArray(valor);
}

function validarLote(entrada) {
  if (
    !esObjeto(entrada)
    || typeof entrada.sessionId !== "string"
    || !entrada.sessionId.trim()
    || entrada.sessionId.length > 128
    || typeof entrada.batchId !== "string"
    || !UUID_VALIDO.test(entrada.batchId)
    || !Array.isArray(entrada.events)
    || entrada.events.length < 1
    || entrada.events.length > TAMANO_MAXIMO_LOTE
  ) {
    return null;
  }

  const eventos = [];
  for (const evento of entrada.events) {
    if (
      !esObjeto(evento)
      || typeof evento.id !== "string"
      || !UUID_VALIDO.test(evento.id)
      || typeof evento.action !== "string"
      || !evento.action.trim()
      || evento.action.length > 100
      || !esObjeto(evento.details)
      || typeof evento.occurredAt !== "string"
      || !Number.isFinite(Date.parse(evento.occurredAt))
    ) {
      return null;
    }

    eventos.push({
      id: evento.id,
      action: evento.action.trim(),
      details: evento.details,
      occurredAt: evento.occurredAt,
    });
  }

  return {
    sessionId: entrada.sessionId.trim(),
    batchId: entrada.batchId,
    events: eventos,
  };
}

export async function GET() {
  try {
    const sql = obtenerSql();
    const eventos = await sql`
      SELECT
        item.event ->> 'id' AS id,
        lote.session_id AS "sessionId",
        item.event ->> 'action' AS action,
        COALESCE(item.event -> 'details', '{}'::jsonb) AS details,
        item.event ->> 'occurredAt' AS "occurredAt",
        lote.created_at AS "recordedAt"
      FROM public.log_batches AS lote
      CROSS JOIN LATERAL jsonb_array_elements(lote.events) AS item(event)
      ORDER BY lote.created_at, item.event ->> 'occurredAt'
    `;

    return NextResponse.json(eventos);
  } catch (error) {
    console.error("Error al leer el log desde Neon:", error);
    return NextResponse.json({ error: "No se pudo leer el log desde Neon." }, { status: 500 });
  }
}

export async function POST(request) {
  let entrada;

  try {
    entrada = await request.json();
  } catch {
    return NextResponse.json({ error: "El cuerpo debe ser JSON válido." }, { status: 400 });
  }

  const lote = validarLote(entrada);
  if (!lote) {
    return NextResponse.json(
      { error: "El lote requiere un ID de sesión, un ID de lote y entre 1 y 20 eventos válidos." },
      { status: 400 },
    );
  }

  try {
    const sql = obtenerSql();
    const guardados = await sql`
      INSERT INTO public.log_batches (session_id, batch_id, events)
      VALUES (${lote.sessionId}, ${lote.batchId}::uuid, ${JSON.stringify(lote.events)}::jsonb)
      ON CONFLICT (batch_id) DO UPDATE
        SET batch_id = EXCLUDED.batch_id
        WHERE public.log_batches.session_id = EXCLUDED.session_id
          AND public.log_batches.events = EXCLUDED.events
      RETURNING batch_id AS "batchId"
    `;

    if (guardados.length === 0) {
      return NextResponse.json(
        { error: "El ID de lote ya existe con datos diferentes." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { mensaje: "Lote guardado.", batchId: lote.batchId },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error al guardar el lote del log en Neon:", error);
    return NextResponse.json({ error: "No se pudo guardar el lote en Neon." }, { status: 500 });
  }
}
