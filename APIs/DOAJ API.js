function extraerInfoDOAJ(XMLHttpRequest, fs, paginaActual = 1, revista = 1, info = "Titulo;E-ISSN;P-ISSN;Institución;Editora\n")
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

            // Filtro la info recibida por la API
            console.log(`PÁGINA: ${paginaActual}`);
            for(let i = 0; i < limite; i++)
            {
                var titulo = respuestaJSON.results[i].bibjson.title.trim().replaceAll(";", ",");

                // No todas las revistas tienen todos los datos, así que tengo que verificar si tienen ciertos datos o no
                var eissn;
                if(typeof(respuestaJSON.results[i].bibjson.eissn) == "undefined") eissn = null;
                else                                                              eissn = respuestaJSON.results[i].bibjson.eissn.trim().replaceAll(";", ",");

                var pissn;
                if(typeof(respuestaJSON.results[i].bibjson.pissn) == "undefined") pissn = null;
                else                                                              pissn = respuestaJSON.results[i].bibjson.pissn.trim().replaceAll(";", ",");

                var nombreInstituto;
                if     (typeof(respuestaJSON.results[i].bibjson.institution) == "undefined")      nombreInstituto = null;
                else if(typeof(respuestaJSON.results[i].bibjson.institution.name) == "undefined") nombreInstituto = null;
                else nombreInstituto = respuestaJSON.results[i].bibjson.institution.name.trim().replaceAll(";", ",");

                var editora;
                if     (typeof(respuestaJSON.results[i].bibjson.publisher) == "undefined")      editora = null;
                else if(typeof(respuestaJSON.results[i].bibjson.publisher.name) == "undefined") editora = null;
                else                                                                            editora = respuestaJSON.results[i].bibjson.publisher.name.trim().replaceAll(";", ",");

                info += `${titulo};${eissn};${pissn};${nombreInstituto};${editora}\n`;

                console.log(`***********************************************************************************`);
                console.log(`Revista: ${revista}`)
                console.log(`***********************************************************************************`);
                console.log(`Titulo ${i}: ${titulo}`);
                console.log(`E-ISSN: ${eissn}`);
                console.log(`P-ISSN: ${pissn}`);
                console.log(`Institucion: ${nombreInstituto}`);
                console.log(`Editora: ${editora}`);
                console.log(`***********************************************************************************`);

                revista++;
            }

            console.log(`Termina la extracción de datos de la página ${paginaActual} de ${cantidadPaginas}`);

            // Si no termine de consultar todas las páginas, vuelvo a hacer la consulta pero en la página siguiente y con la info que ya obtuvimos
            if(paginaActual != cantidadPaginas) extraerInfoDOAJ(XMLHttpRequest, fs, ++paginaActual, revista, info); 

            // Escribo la info en el archivo .xls
            fs.writeFile('./Revistas/DOAJ.xls', info, error => 
            { 
                if(error) console.log(error);
            })

            // También en un archivo .csv
            fs.writeFile('./Revistas/DOAJ.csv', info, error => 
            { 
                if(error) console.log(error);
            })

            //ESTO ES PARA DEBUGEAR, GUARDA EL JSON CRUDO EN UN TXT ASI LO PONEMOS DESPUES EN JSONVIEWER
            /*fs.writeFile('./Revistas/DOAJ.txt', this.response, error => 
            { 
                if(error) console.log(error);
            })*/
        }
    };
}

exports.extraerInfoDOAJ = extraerInfoDOAJ;