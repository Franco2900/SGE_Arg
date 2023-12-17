const fs = require('fs');        // Módulo para leer y escribir archivos
const csvtojson = require('csvtojson')  // Módulo para pasar texto csv a json

var sitiosWeb = []; // Almaceno los archivo JSON acá
// Se puede llamar directamente a un archivo JSON local y este será automaticamente parseado para usar inmediatamente

// Try-catch en caso de que no se encuentre un archivo
var archivoCAICYTEncontrado = false;
try {
    const CAICYT = require('./Revistas/CAICYT.json');
    sitiosWeb.push(CAICYT);
    archivoCAICYTEncontrado = true;
    console.log("Sitio web incluido en el listado: CAICYT");
}
catch (error) {
    sitiosWeb.push([]);
    console.log("Hay un problema con el archivo del sitio web CAICYT");
    console.log(error);
}

var archivoDOAJEncontrado = false;
try {
    const DOAJ = require('./Revistas/DOAJ.json');
    sitiosWeb.push(DOAJ);
    archivoDOAJEncontrado = true;
    console.log("Sitio web incluido en el listado: DOAJ");
}
catch (error) {
    sitiosWeb.push([])
    console.log("Hay un problema con el archivo del sitio web DOAJ");
    console.log(error);
}

var archivoLatindexEncontrado = false;
try {
    const Latindex = require('./Revistas/Latindex.json');
    sitiosWeb.push(Latindex);
    archivoLatindexEncontrado = true;
    console.log("Sitio web incluido en el listado: Latindex");
}
catch (error) {
    sitiosWeb.push([])
    console.log("Hay un problema con el archivo del sitio web Latindex");
    console.log(error);
}

var archivoRedalycEncontrado = false;
try {
    const Redalyc = require('./Revistas/Redalyc.json');
    sitiosWeb.push(Redalyc);
    archivoRedalycEncontrado = true;
    console.log("Sitio web incluido en el listado: Redalyc");
}
catch (error) {
    sitiosWeb.push([])
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

    // Creo una lista inicial poniendo todas las revistas de todos los sitios web en un solo arreglo
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
                var auxRevista  = new Revista();
                auxRevista      = revistas[j];
                revistas[j]     = revistas[j + 1];
                revistas[j + 1] = auxRevista;
            }
        }
    }

    console.log("***********************************************************");
    console.log("Cantidad de revistas a filtrar: " + revistas.length);

    for (var i = 1; i < revistas.length; i++) {
        if(revistas[i].issnEnLinea === null) console.log(revistas[i].titulo); // DEBUGEO
    }


    // Elimino todas las revistas que tengan repetido el ISSN en linea y el ISSN impreso, ejemplo: https://www.latindex.org/latindex/Solr/Busqueda?idModBus=0&buscar=Visi%C3%B3n+de+futuro&submit=Buscar
    // También elimino todas las revistas que tengan el ISSN en linea como null
    for (var i = 0; i < revistas.length; i++) 
    {
        if(revistas[i].issnEnLinea == revistas[i].issnImpreso || revistas[i].issnEnLinea == "null") 
        {
            revistas.splice(i, 1);
        }   
    }


    // Elimino las revistas repetidas fijandome el ISSN electronico
    var cantidadRevistasRepetidas = 0;
    for (var i = 0; i < revistas.length; i++) 
    {
        // Agarro un ISSN electronico y lo comparo con el ISSN electronico de todas las demás revistas
        for(var j = 0; j < revistas.length; j++)
        {
            if(i != j && revistas[i].issnEnLinea == revistas[j].issnEnLinea)  
            {
                revistas.splice(i, 1); // Elimina un elemento del arreglo si se encuentra repetido
                cantidadRevistasRepetidas++;
                if(i != 0) i--;
            }
        }
    }


    // Chequeo si la revista esta en un sitio web o no. ARREGLAR: Solo sirve si se cargan todos los archivos
    for(var r = 0; r < revistas.length; r++) // Eligo una revista de mi arreglo
    {
        for(var i = 0; i < sitiosWeb.length; i++) // Eligo un sitio web
        {
            for(var j = 0; j < sitiosWeb[i].length; j++) // Recorro todas las revistas del sitio web
            {
                if(sitiosWeb[i][j]['ISSN en linea'] == revistas[r].issnEnLinea) // Si el ISSN electronico de la revista del arreglo y la revista del sitio coinciden, entonces la revista del arreglo se encuentra en dicho sitio web
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


    // Este filtro se fija si los datos que proporciono un sitio web están mal o no. Puede darse el caso de que un sitio web de datos equivocados sobre una revista
    // Un ejemplo es la revista de Acta Gastroenterológica Latinoamericana. Sus datos aparecen bien en CAICYT y DOAJ, pero no en Redalyc

    for (var i = 0; i < revistas.length; i++) // Recorro todas las revistas del arreglo
    {
        if (typeof revistas[i+1] !== 'undefined' && revistas[i].issnEnLinea != "null" && revistas[i+1].issnEnLinea != "null") // Si hay una siguiente posición el el arreglo y el issnEnLinea de la revista actual y el de la revista siguiente no son nulos
        {
            if(revistas[i].issnImpreso == revistas[i+1].issnEnLinea || revistas[i].issnEnLinea == revistas[i+1].issnImpreso) // Chequeo si los ISSN están invertidos
            {
                // Si lis ISSN están invertidos, arreglo lo de en que sitios web esta la revista
                if(revistas[i].CAICYT   != revistas[i+1].CAICYT)   revistas[i+1].CAICYT   = true;
                if(revistas[i].DOAJ     != revistas[i+1].DOAJ)     revistas[i+1].DOAJ     = true;
                if(revistas[i].Latindex != revistas[i+1].Latindex) revistas[i+1].Latindex = true;
                if(revistas[i].Redalyc  != revistas[i+1].Redalyc)  revistas[i+1].Redalyc  = true;

                cantidadRevistasRepetidas++;
                revistas.splice(i, 1);

                if(i != 0) i--;
            }
        }
    }


    // Manejo de casos excepcionales
    for (var i = 0; i < revistas.length; i++) // Recorro todas las revistas del arreglo
    {

    }

    console.log("***********************************************************");
    console.log("Cantidad de revistas repetidas y eliminadas por el filtro: " + cantidadRevistasRepetidas);
    console.log("Cantidad de revistas que no se añadieron por errores en la extracción de datos: " + cantidadErrores);
    console.log("Cantidad de revistas en el listado final: " + revistas.length);


    // Armo el listado
    var listado = "Título;ISSN impresa;ISSN en linea;Instituto";
    
    if(archivoCAICYTEncontrado)   listado += ";CAICYT"
    if(archivoDOAJEncontrado)     listado += ";DOAJ"
    if(archivoLatindexEncontrado) listado += ";Latindex"
    if(archivoRedalycEncontrado)  listado += ";Redalyc"
    
    listado += "\n";

    for (var i = 0; i < revistas.length; i++) 
    {
        listado += `${revistas[i].titulo};${revistas[i].issnImpreso};${revistas[i].issnEnLinea};${revistas[i].instituto}`
    
        if(archivoCAICYTEncontrado)   listado += `;${revistas[i].CAICYT}`
        if(archivoDOAJEncontrado)     listado += `;${revistas[i].DOAJ}`
        if(archivoLatindexEncontrado) listado += `;${revistas[i].Latindex}`
        if(archivoRedalycEncontrado)  listado += `;${revistas[i].Redalyc}`
    
        listado += "\n";
    }



    // Escribo la info en el archivo .csv
    fs.writeFile('./Revistas/Listado de revistas.csv', listado, error => {
        if (error) console.log(error);
    })


    // Parseo de CSV a JSON
    setTimeout(function () { // Le indico al programa que espere 5 segundos antes de seguir porque tarda en crearse el archivo .csv
    
        csvtojson({ delimiter: [";"], }).fromFile('./Revistas/Listado de revistas.csv').then((json) => // La propiedad delimiter indica porque caracter debe separar
        {
            fs.writeFile('./Revistas/Listado de revistas.json', JSON.stringify(json), error => {
                if (error) console.log(error);
            })
        })
        
    }, 3000); 

}


crearListado();