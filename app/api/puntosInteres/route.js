import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    // Cambia "Hoja1" por el nombre exacto de la pestaña abajo en tu spreadsheet
    const range = "Hoja1!A:J"; 

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    // Función para parsear números decimales con formato irregular
    const parsearCoordenada = (valor) => {
      if (!valor) return null;
      let str = String(valor).trim();
      
      // Si el número tiene varios puntos (ej. -39.817.673...), dejamos solo el primer punto
      const partes = str.split('.');
      if (partes.length > 2) {
        str = partes[0] + '.' + partes.slice(1).join('');
      }
      
      const num = parseFloat(str);
      return Number.isFinite(num) ? num : null;
    };

    const puntos = dataRows.map((row) => {
      let punto = {};
      headers.forEach((header, index) => {
        // Normalizamos el nombre de la cabecera (quitando espacios y pasando a minúsculas para evitar errores)
        const key = header ? header.trim().toLowerCase() : "";
        punto[key] = row[index] || "";
      });

      return {
        id: punto.id,
        nombre: punto.lugar,
        info: punto.informacion,
        // Mapeamos explícitamente latitud -> coordX y longitud -> coordY
        coordX: parsearCoordenada(punto.latitud),
        coordY: parsearCoordenada(punto.longitud),
        pregunta: punto.pregunta,
        respuesta1: punto.distractor1,
        respuesta2: punto.distractor2,
        respuesta3: punto.correcta,
        puntaje: Number(punto.puntaje) || 0,
      };
    });



    return NextResponse.json(puntos, { status: 200 });
  } catch (error) {
    console.error("Error al leer Google Sheets:", error);
    return NextResponse.json({ error: "No se pudieron cargar los puntos" }, { status: 500 });
  }
}

//funcion POST (agregar nueva info. ej: puntaje)
export async function POST(request){
    try{
        const nuevo = await request.json();
        let data = [];

        // comprueba si existe el archivo, sino lo crea
        if (fs.existsSync(archivo)){
            const datos = fs.readFileSync(archivo, "utf8");
            data =JSON.parse(datos);
        } else{
            fs.mkdirSync(path.dirname(archivo), {recursive: true});
        }

        //crea la sobreescritura
        const aGuardar = {
            id : Date.now().toString(),
            ...nuevo
        };
        data.push(aGuardar);
        fs.writeFileSync(archivo,JSON.stringify(data,null,2), "utf8");
        return NextResponse.json({mensaje: "guardado", data: aGuardar}, {status: 201});

    } catch (error){
        return NextResponse.json({error: "Error al guardar"}, {status : 500});
    }
}