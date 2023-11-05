const fs        = require('fs');        // Módulo para leer y escribir archivos
const csvtojson = require('csvtojson')  // Módulo para pasar texto csv a json

const CAICYT   = require('./Revistas/CAICYT.json')
const DOAJ     = require('./Revistas/DOAJ.json')
const Latindex = require('./Revistas/Latindex.json')
// Se puede llamar directamente a un archivo JSON local. Este será automaticamente parseado por lo que se puede usar inmediatamente
const sitiosWeb = [CAICYT, DOAJ]//, Latindex y el resto de los sitios web
// FALTA UN TRY-CATCH EN CASO DE QUE NO SE ENCUENTRE UN ARCHIVO

class Revista
{
    constructor(titulo, issnImpreso, issnEnLinea)
    {
        this._titulo      = titulo;
        this._issnImpreso = issnImpreso;
        this._issnEnLinea = issnEnLinea;
    }

    get titulo()
    {
        return this._titulo;
    }

    set titulo(titulo)
    {
        this._titulo = titulo;
    }

    get issnImpreso()
    {
        return this._issnImpreso;
    }

    set issnImpreso(issnImpreso)
    {
        this._issnImpreso = issnImpreso;
    }

    get issnEnLinea()
    {
        return this._issnEnLinea;
    }

    set issnEnLinea(issnEnLinea)
    {
        this._issnEnLinea = issnEnLinea;
    }

    toString()
    {
        console.log(`Título: ${this._titulo}, ISSN impreso: ${this._issnImpreso}, ISSN en linea: ${this._issnEnLinea}`);
    }
}


// Recorro cada revista de la que hayamos extraido información y creo una lista con el título y el ISSN impreso y/o electronico.
// Una revista puede aparecer en distintos sitios web, por eso se chequea el ISSN para que en la lista solo pueda aparecer una vez cada revista.
function crearListado()
{
    var revistas = [];
    var cantidadErrores = 0; // Esta variable me sirve para saber cuantas revistas no aparecen en el listado debido a un error en la extracción de datos
    
    // Creo una lista inicial poniendo todas las revistas de todos los sitios web en una sola variable
    for(var i = 0; i < sitiosWeb.length; i++) // for para recorrer todas los sitios web
    {
        var archivoJSON = sitiosWeb[i];
        for(var j = 0; j < sitiosWeb[i].length; j++) // for para recorrer las revistas de cada sitio web
        {
            if (archivoJSON[j].Título == "HUBO UN ERROR")
            {
                cantidadErrores++;
            }
            else
            {
                revistas.push(new Revista(archivoJSON[j].Título, archivoJSON[j]['ISSN impresa'], archivoJSON[j]['ISSN en linea']) ); // Paso el texto a objetos para poder hacer el ordenamiento por alfabeto
            }
        }
    }

    
    // Ordeno alfabeticamente las revistas según el título. NOTA: Es ordenamiento por burbujeo, es el ordenamiento más simple de todos pero también el más lento. Cambiarlo por uno más rápido después
    for(var i = 1; i < revistas.length; i++)
    {
        for(var j = 0; j < revistas.length-1; j++)
        {
            if(revistas[j].titulo.toLowerCase() > revistas[j+1].titulo.toLowerCase() )
            {
                auxRevista = new Revista();
                auxRevista    = revistas[j];
                revistas[j]   = revistas[j+1];
                revistas[j+1] = auxRevista;
            }
        }
    }


    // Chequeo que la revista no sea repetida fijandome si el ISSN electronico ya fue ingresado previamente
    for(var i = 0; i < revistas.length-1; i++) 
    {
        if(revistas[i].issnEnLinea == revistas[i+1].issnEnLinea) // Como ya tengo todas las revistas ordenadas alfabeticamente, solo me fijo el issn electronico de la siguiente posicion
        {
            revistas.splice(i, 1);
        }
    }


    // Armo el listado
    var listado = "Título;ISSN impresa;ISSN en linea" + "\n";
    for(var i = 0; i < revistas.length; i++)
    {
        listado += `${revistas[i].titulo};${revistas[i].issnImpreso};${revistas[i].issnEnLinea}` + `\n`;
    }


    console.log("Cantidad de revistas: " + revistas.length);  
    console.log("Cantidad de errores: " + cantidadErrores); 
    //console.log(valoresISSN); // DEBUGEO


    // Escribo la info en el archivo .csv
    fs.writeFile('./Listado de revistas.csv', listado, error => 
    { 
        if(error) console.log(error);
    })


    // Parseo de CSV a JSON
    csvtojson({delimiter: [";"],}).fromFile('./Listado de revistas.csv').then((json) => // La propiedad delimiter indica porque caracter debe separar
    { 
        fs.writeFile('./Listado de revistas.json', JSON.stringify(json), error => 
        { 
            if(error) console.log(error);
        })
    })

}


crearListado();