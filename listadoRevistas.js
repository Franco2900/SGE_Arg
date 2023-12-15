const fs = require('fs');        // Módulo para leer y escribir archivos
const csvtojson = require('csvtojson')  // Módulo para pasar texto csv a json

var sitiosWeb = []; // Almaceno los archivo JSON acá
// Se puede llamar directamente a un archivo JSON local y este será automaticamente parseado para usar inmediatamente

// Try-catch en caso de que no se encuentre un archivo
try {
    const CAICYT = require('./Revistas/CAICYT.json');
    sitiosWeb.push(CAICYT);
    console.log("Sitio web incluido en el listado: CAICYT");
}
catch (error) {
    console.log("Hay un problema con el archivo del sitio web CAICYT");
    console.log(error);
}

try {
    const DOAJ = require('./Revistas/DOAJ.json');
    sitiosWeb.push(DOAJ);
    console.log("Sitio web incluido en el listado: DOAJ");
}
catch (error) {
    console.log("Hay un problema con el archivo del sitio web DOAJ");
    console.log(error);
}

try {
    const Latindex = require('./Revistas/Latindex.json');
    sitiosWeb.push(Latindex);
    console.log("Sitio web incluido en el listado: Latindex");
}
catch (error) {
    console.log("Hay un problema con el archivo del sitio web Latindex");
    console.log(error);
}

try {
    const Redalyc = require('./Revistas/Redalyc.json');
    sitiosWeb.push(Redalyc);
    console.log("Sitio web incluido en el listado: Redalyc");
}
catch (error) {
    console.log("Hay un problema con el archivo del sitio web Redalyc");
    console.log(error);
}


// Clase para pasar el texto de los archivos JSON a objetos y así poder hacer el ordenamiento
class Revista {
    
    constructor(titulo, issnImpreso, issnEnLinea, instituto) {
        this.titulo = titulo;
        this.issnImpreso = issnImpreso;
        this.issnEnLinea = issnEnLinea;
        this.instituto   = instituto;
        this.CAICYT      = false;
        this.DOAJ        = false;
        this.Latindex    = false;
        this.Redalyc     = false;
    }

    toString() {
        console.log(`Título: ${this.titulo}, ISSN impreso: ${this.issnImpreso}, ISSN en linea: ${this.issnEnLinea}, Instituto: ${this.instituto}`);
    }
}


// Recorro cada revista de la que hayamos extraido información y creo una lista con el título y el ISSN impreso y/o electronico.
// Una revista puede aparecer en distintos sitios web, por eso se chequea el ISSN para que en la lista solo pueda aparecer una vez cada revista.
function crearListado() {
    var revistas = [];
    var cantidadErrores = 0; // Esta variable me sirve para saber cuantas revistas no aparecen en el listado debido a un error en la extracción de datos

    // Creo una lista inicial poniendo todas las revistas de todos los sitios web en una sola variable
    for (var i = 0; i < sitiosWeb.length; i++) // for para recorrer todas los sitios web
    {
        var archivoJSON = sitiosWeb[i];
        for (var j = 0; j < sitiosWeb[i].length; j++) // for para recorrer las revistas de cada sitio web
        {
            if (archivoJSON[j].Título == "HUBO UN ERROR") 
            {
                cantidadErrores++;
            }
            else 
            {
                revistas.push(new Revista(archivoJSON[j].Título, archivoJSON[j]['ISSN impresa'], archivoJSON[j]['ISSN en linea'], archivoJSON[j]['Instituto'])); // Paso el texto a objetos para poder hacer el ordenamiento por alfabeto
            }
        }
    }


    // Ordeno alfabeticamente las revistas según el título. NOTA: Es ordenamiento por burbujeo, es el ordenamiento más simple de todos pero también el más lento. Cambiarlo por uno más rápido después
    for (var i = 1; i < revistas.length; i++) 
    {
        for (var j = 0; j < revistas.length - 1; j++) 
        {
            if (revistas[j].titulo.toLowerCase() > revistas[j + 1].titulo.toLowerCase()) 
            {
                auxRevista = new Revista();
                auxRevista = revistas[j];
                revistas[j] = revistas[j + 1];
                revistas[j + 1] = auxRevista;
            }
        }
    }



    const cantidadRevistas = revistas.length;
    console.log("***********************************************************");
    console.log("Cantidad de revistas a filtrar: " + cantidadRevistas);

    var cantidadRevistasRepetidas = 0;
    // Chequeo que la revista no sea repetida fijandome el ISSN electronico 
    for (var i = 0; i < revistas.length; i++) 
    {
        for(var j = 0; j < revistas.length; j++)
        {
            if(i != j && revistas[i].issnEnLinea == revistas[j].issnEnLinea)
            {
                revistas.splice(i, 1); // Elimina un elemento del arreglo
                cantidadRevistasRepetidas++;
                if(i != 0) i--;
            }
        }
    }



    // Chequeo si la revista esta en un sitio web o no
    for(var r = 0; r < revistas.length; r++)
    {
        for(var i = 0; i < sitiosWeb.length; i++)
        {
            for(var j = 0; j < sitiosWeb[i].length; j++)
            {
                if(sitiosWeb[i][j]['ISSN en linea'] == revistas[r].issnEnLinea)
                {
                    //console.log(`r:${r} - i:${i} - j:${j} - ${sitiosWeb[i][j]['ISSN en linea']} - ${revistas[r].issnEnLinea}`); // DEBUGEO

                    if(i == 0) revistas[r].CAICYT   = true;
                    if(i == 1) revistas[r].DOAJ     = true;
                    if(i == 2) revistas[r].Latindex = true;
                    if(i == 3) revistas[r].Redalyc  = true;
                }
                
            }
        }
    }


    // El último filtro se fija si los datos que proporciono un sitio web están mal o no. Puede darse el caso de que un sitio web de datos equivocados sobre una revista
    // Un ejemplo es la revista de Acta Gastroenterológica Latinoamericana. Sus datos aparecen bien en CAICYT y DOAJ, pero no en Redalyc
    // En estos casos se usa DOAJ como fuente indiscutible de veracidad
    for (var i = 0; i < revistas.length; i++) {

        if (typeof revistas[i+1] !== 'undefined' && revistas[i].issnEnLinea != "null" && revistas[i+1].issnEnLinea != "null") 
        {
            if(revistas[i].issnImpreso == revistas[i+1].issnEnLinea || revistas[i].issnEnLinea == revistas[i+1].issnImpreso) // Chequeo si los ISSN están invertidos
            {
                if(revistas[i].CAICYT   != revistas[i+1].CAICYT)   revistas[i+1].CAICYT = true;
                if(revistas[i].DOAJ     != revistas[i+1].DOAJ)     revistas[i+1].DOAJ = true;
                if(revistas[i].Latindex != revistas[i+1].Latindex) revistas[i+1].Latindex = true;
                if(revistas[i].Redalyc  != revistas[i+1].Redalyc)  revistas[i+1].Redalyc = true;

                cantidadRevistasRepetidas++;
                revistas.splice(i, 1);

                if(i != 0) i--;
            }
        }
    }

    console.log("***********************************************************");
    console.log("Cantidad de revistas repetidas y eliminadas por el filtro: " + cantidadRevistasRepetidas);
    console.log("Cantidad de revistas que no se añadieron por errores en la extracción de datos: " + cantidadErrores);
    console.log("Cantidad de revistas en el listado final: " + revistas.length);


    // Armo el listado
    var listado = "Título;ISSN impresa;ISSN en linea;Instituto;CAICYT;DOAJ;Latindex;Redalyc" + "\n";
    for (var i = 0; i < revistas.length; i++) {
        listado += `${revistas[i].titulo};${revistas[i].issnImpreso};${revistas[i].issnEnLinea};${revistas[i].instituto};${revistas[i].CAICYT};${revistas[i].DOAJ};${revistas[i].Latindex};${revistas[i].Redalyc}` + `\n`;
    }



    // Escribo la info en el archivo .csv
    fs.writeFile('./Listado de revistas.csv', listado, error => {
        if (error) console.log(error);
    })


    // Parseo de CSV a JSON
    csvtojson({ delimiter: [";"], }).fromFile('./Listado de revistas.csv').then((json) => // La propiedad delimiter indica porque caracter debe separar
    {
        fs.writeFile('./Listado de revistas.json', JSON.stringify(json), error => {
            if (error) console.log(error);
        })
    })

}


crearListado();