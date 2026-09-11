import {NextResponse} from "next/server";
import fs from "fs";
import path from "path";

//busca la carpeta y el archivo
const archivo = path.join(process.cwd(),
"app","api", "puntosInteres", "data", "info.json");

//funcion get (sacar la info de la api)
export async function GET(){
    try{
        if (!fs.existSync(archivo)){
            return NextResponse.json({error: "no esta agregado el archivo"},{status: 404});
        }

        // lee el archivo .json y retorna la info.
        const lectura = fs.readFileSync(filePath,"utf8");
        const data = JSON.parse(lectura);
        return NextResponse.json (data, {status:200});

        } catch (error){
            return NextResponse.json({error: "Error al leer datos"},{status: 500});
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