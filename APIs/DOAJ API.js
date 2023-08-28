function extraerInfoDOAJ(XMLHttpRequest, fs)
{    
    const API_URL = "https://doaj.org/api/"; // URL a la que vamos a pedir los datos

    const xhttp = new XMLHttpRequest(); // Creo un objeto de la clase XMLHttpRequest para poder hacer el intercambio de datos

    // BUSCAR COMO HACER MEJOR LA CONSULTA PORQUE SOLO TIRA 100 REVISTAS DE LAS 381 (QUIZAS HACER VARIAS CONSULTAS PORQUE EL LIMITE ES 100)
    xhttp.open("GET", `${API_URL}/search/journals/Argentina?page=1&pageSize=100`, true); // Crea la solicitud al servidor
    xhttp.send();   // Envía la solicitud al servidor

    // Recibo la respuesta del servidor
    xhttp.onreadystatechange = function() // El atributo onreadystatechange define una función que se invoca cada vez que cambia el atributo readyState
    {      
        // El atributo readyState es el estado de un objeto de la clase XMLHttpRequest, y el atributo status define el estado de una solicitud al servidor
        if (this.readyState == 4 && this.status == 200) // cuando esta condición se cumple, significa que la respuesta del servidor ya se recibió y que no hubo problemas
        { 
            // response es la respuesta del servidor
            const respuestaJSON = JSON.parse(this.response); // las APIs se suelen comunicar en JSON, así que parseo la respuesta a JSON
            info = "";

            // Filtro la info recibida
            for(let i = 0; i < respuestaJSON.pageSize; i++)
            {
                info += "Titulo: " + respuestaJSON.results[i].bibjson.title + "\n";
                console.log(`Titulo ${i}: ${respuestaJSON.results[i].bibjson.title}`);
            }
            
            // Escribo la info filtrada en el archivo .xls
            fs.writeFile('./Revistas/DOAJ.xls', info, error => 
            { 
                if(error) console.log(error);
            })

            //ESTO ES PARA DEBUGEAR, GUARDA EL JSON CRUDO EN UN TXT ASI LO PONEMOS DESPUES EN JSONVIEWER
            fs.writeFile('./Revistas/DOAJ.txt', this.response, error => 
            { 
                if(error) console.log(error);
            })
        }
    };
}

exports.extraerInfoDOAJ = extraerInfoDOAJ;