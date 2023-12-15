const fs             = require('fs');        // Módulo para leer y escribir archivos
const XMLHttpRequest = require('xhr2');      // Módulo para comunicarse con las APIs
const csvtojson      = require('csvtojson')  // Módulo para pasar texto csv a json

function extraerInfoDOAJ(paginaActual = 1, revista = 1, info = "Título;ISSN impresa;ISSN en linea;Instituto;Editora\n")
{    
    const API_URL = "https://doaj.org/api/"; // URL a la que vamos a pedir los datos

    const xhttp = new XMLHttpRequest(); // Creo un objeto de la clase XMLHttpRequest para poder hacer el intercambio de datos

    xhttp.open("GET", `${API_URL}/search/journals/Argentina?page=${paginaActual}&pageSize=100`, true); // Crea la solicitud al servidor
    xhttp.send();   // Envía la solicitud al servidor

    // Recibo la respuesta del servidor
    xhttp.onreadystatechange = function() // El atributo onreadystatechange define una función que se invoca cada vez que cambia el atributo readyState
    {      
        // El atributo readyState es el estado de un objeto de la clase XMLHttpRequest, y el atributo status define el estado de una solicitud al servidor
        if (this.readyState == 4 && this.status == 200) // cuando esta condición se cumple, significa que la respuesta del servidor ya se recibió y que no hubo problemas
        { 
            // response es la respuesta del servidor
            const respuestaJSON = JSON.parse(this.response); // Las APIs se suelen comunicar en JSON, así que parseo la respuesta a JSON
        
            // Ya que cada consulta solo puede devolver una página con un máximo de 100 revistas, me fijo cuantas páginas me falta consultar
            var cantidadPaginas = Math.ceil(respuestaJSON.total/respuestaJSON.pageSize);
            var limite          = respuestaJSON.pageSize;

            if(paginaActual == cantidadPaginas) 
            {
                auxCantidadPaginas = cantidadPaginas
                limite = respuestaJSON.total - (respuestaJSON.pageSize * (--auxCantidadPaginas));
            }
            
            console.log(`Comienza la extracción de datos de la página ${paginaActual} de ${cantidadPaginas}`);
            console.log(`PÁGINA: ${paginaActual}`);
            info = filtro(info, limite, revista, respuestaJSON);
            console.log(`Termina la extracción de datos de la página ${paginaActual} de ${cantidadPaginas}`);

            revista += limite

            // Si no termine de consultar todas las páginas, vuelvo a hacer la consulta pero en la página siguiente y con la info que ya obtuvimos
            if(paginaActual != cantidadPaginas) extraerInfoDOAJ(++paginaActual, revista, info);
            
            escribirInfo(info);
        }
    };
    
}


function filtro(info, limite, revista, respuestaJSON)
{
    // Filtro la info recibida por la API
    for(let i = 0; i < limite; i++)
    {
        var titulo = respuestaJSON.results[i].bibjson.title.trim().replaceAll(";", ",");

        // No todas las revistas tienen todos los datos, así que tengo que verificar si tienen ciertos datos o no
        var eissn; // E-ISSN significa ISSN en linea
        if(typeof(respuestaJSON.results[i].bibjson.eissn) == "undefined") eissn = null;
        else                                                              eissn = respuestaJSON.results[i].bibjson.eissn.trim().replaceAll(";", ",");

        var pissn; // P-ISSN significa ISSN impresa
        if(typeof(respuestaJSON.results[i].bibjson.pissn) == "undefined") pissn = null;
        else                                                              pissn = respuestaJSON.results[i].bibjson.pissn.trim().replaceAll(";", ",");

        var nombreInstituto;
        if     (typeof(respuestaJSON.results[i].bibjson.institution)      == "undefined") nombreInstituto = null;
        else if(typeof(respuestaJSON.results[i].bibjson.institution.name) == "undefined") nombreInstituto = null;
        else nombreInstituto = respuestaJSON.results[i].bibjson.institution.name.trim().replaceAll(";", ",");

        var editora;
        if     (typeof(respuestaJSON.results[i].bibjson.publisher)      == "undefined") editora = null;
        else if(typeof(respuestaJSON.results[i].bibjson.publisher.name) == "undefined") editora = null;
        else                                                                            editora = respuestaJSON.results[i].bibjson.publisher.name.trim().replaceAll(";", ",");

        info += `${titulo};${pissn};${eissn};${nombreInstituto};${editora}\n`;

        // Muestro en consola la info de la revista
        console.log(`***********************************************************************************`);
        console.log(`Revista: ${revista}`)
        console.log(`***********************************************************************************`);
        console.log(`Titulo: ${titulo}`);
        console.log(`ISSN impresa: ${pissn}`);
        console.log(`ISSN en linea: ${eissn}`);
        console.log(`Instituto: ${nombreInstituto}`);
        console.log(`Editora: ${editora}`);
        console.log(`***********************************************************************************`);

        revista++;
    }

    return info;
}


function escribirInfo(info)
{
    // Escribo la info en el archivo .csv
    fs.writeFile('./Revistas/DOAJ.csv', info, error => 
    { 
        if(error) console.log(error);
    })


    setTimeout(function () { // Le indico al programa que espere 5 segundos antes de seguir porque tarda en crearse el archivo .csv

        // Parseo de CSV a JSON
        csvtojson({delimiter: [";"],}).fromFile('./Revistas/DOAJ.csv').then((json) => // La propiedad delimiter indica porque caracter debe separar
        { 
            fs.writeFile('./Revistas/DOAJ.json', JSON.stringify(json), error => 
            { 
                if(error) console.log(error);
            })
        })
        
    }, 5000);

    //ESTO ES PARA DEBUGEAR, GUARDA EL JSON CRUDO EN UN TXT ASI LO PONEMOS DESPUES EN JSONVIEWER
    /*fs.writeFile('./Revistas/DOAJ.txt', this.response, error => 
    { 
        if(error) console.log(error);
    })*/
    
}


exports.extraerInfoDOAJ = extraerInfoDOAJ;