const archivoJSON = require('../Revistas/Latindex.json')
// Se puede llamar directamente a un archivo JSON local. Este será automaticamente parseado por lo que se puede usar inmediatamente

function consultaLatindex(respuesta)
{

    // Extraigo toda la info de las revistas que hay en el archivo JSON
    var revistas = "";
    var numeroRevista = 1;
    for(var i = 0; i < archivoJSON.length; i++)
    {
        if (archivoJSON[i].Título == "HUBO UN ERROR")
        {
            revistas += `Revista ${numeroRevista++} <br>
                        HUBO UN ERROR<br> <hr>`
        }
        else
        {
            revistas += `Revista ${numeroRevista++} <br>
                        Titulo: ${archivoJSON[i].Título} <br> 
                        ISSN: ${archivoJSON[i].ISSN} <br>
                        Idioma: ${archivoJSON[i].Idioma} <br>
                        Tema: ${archivoJSON[i].Tema} <br>
                        Subtemas: ${archivoJSON[i].Subtemas} <br>
                        Organismo responsable: ${archivoJSON[i]['Organismo responsable']} <br>
                        Editorial: ${archivoJSON[i].Editorial} <br>
                        Ciudad: ${archivoJSON[i].Ciudad} <br>
                        Estado/Provincia/Departamento: ${archivoJSON[i]['Estado/Provincia/Departamento']} <br>
                        Correo: ${archivoJSON[i].Correo} <br>
                        <hr>`
        }
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
                <h1 align="center">Latindex</h1>
                <p>Estas son las revistas argentinas que se encuentran en Latindex</p>
                <p>Cantidad de revistas en Latindex: ${archivoJSON.length}</p>
                ${revistas}
                <a href="Latindex.html">Retornar</a>
            </body>
        </html>`)
    respuesta.end()
}

exports.consultaLatindex = consultaLatindex;