const archivoJSON = require('../Revistas/DOAJ.json')
// Se puede llamar directamente a un archivo JSON local. Este será automaticamente parseado por lo que se puede usar inmediatamente

function consultaDOAJ(respuesta)
{

    // Extraigo toda la info de las revistas que hay en el archivo JSON
    var revistas = "";
    var numeroRevista = 1;
    for(var i = 0; i < archivoJSON.length; i++)
    {
        revistas += `Revista ${numeroRevista++} <br>
                    Titulo: ${archivoJSON[i].Titulo} <br> 
                    E-ISSN: ${archivoJSON[i]['E-ISSN']} <br>
                    P-ISSN: ${archivoJSON[i]['P-ISSN']} <br>
                    Editora: ${archivoJSON[i].Editora} <br>
                    Institucion: ${archivoJSON[i].Institución} <br>
                    <hr>`
    }
    

    // Muestro mensaje
    respuesta.writeHead(200, { 'Content-Type': 'text/html' })
    respuesta.write(
        `<!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Sistema de Gestión Editorial</title>
            </head>
            <body>
                <h1 align="center">DOAJ</h1>
                <p>Estas son las revistas argentinas que se encuentran en DOAJ</p>
                <p>Cantidad de revistas en DOAJ: ${archivoJSON.length}</p>
                ${revistas}
                <a href="DOAJ.html">Retornar</a>
            </body>
        </html>`)
    respuesta.end()
}

exports.consultaDOAJ = consultaDOAJ;