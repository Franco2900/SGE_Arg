// Módulos del núcleo de Node.JS o módulos externos
const http = require('http');           // Módulo para la navegación web
const fs   = require('fs');             // Módulo para leer y escribir archivos
const puppeteer = require('puppeteer'); // Módulo para web scrapping
const jsdom     = require('jsdom');     // Módulo para filtrar la información extraida con web scrapping
const XMLHttpRequest = require('xhr2'); // Módulo para comunicarse con las APIs

// Módulos hechos por nosotros
const Latindex = require('./modulos webScrapping/Latindex webScrapping.js');

// APIs
const DOAJ     = require('./APIs/DOAJ API.js');

// Ejecución del programa
//Latindex.extraerInfoLatindex(puppeteer, jsdom, fs);
DOAJ.extraerInfoDOAJ(XMLHttpRequest, fs);


/* TODO ESTO ANDA. ES PARA IMPLEMENTAR UNA VISTA WEB EN EL FUTURO
// Defino los MIME Types (estos son los tipos de archivo que soporta el código)
const mime = 
{ 
  'html': 'text/html',
  'css': 'text/css',
  'jpg': 'image/jpg',
  'ico': 'image/x-icon',
  'mp3': 'audio/mpeg3',
  'mp4': 'video/mp4',
  'xls': 'application/xml'
}

// Configuración del servidor de Node.js
const servidor = http.createServer((pedido, respuesta) => {
  
  const url = new URL('http://localhost:8888' + pedido.url) // Creo una URL para el servidor
  let camino = 'static' + url.pathname                      // Al nombre de la subcarpeta que contiene los archivos HTML le concatenao el path y el nombre del archivo HTML solicitado
  
  if (camino == 'static/') camino = 'static/index.html' // El primer control que hacemos es verificar si en la url no viene ninguna página, en dicho caso redirigimos el path al archivo index.html (el html principal del sitio)
  
  // Verifico la existencia del archivo html al que se quiere acceder
  fs.stat(camino, error => {

    if (!error) { // Si existe el archivo

      fs.readFile(camino, (error, contenido) => {

        if (error) { // Si hubo un error al leer el archivo
          respuesta.writeHead(500, { 'Content-Type': 'text/plain' })
          respuesta.write('Error interno')
          respuesta.end()
        } 
        else { // Si no hubo un error al leer el archivo
            const vector      = camino.split('.');
            const extension   = vector[vector.length - 1]; 
            const mimearchivo = mime[extension];            
            respuesta.writeHead(200, { 'Content-Type': mimearchivo });
            respuesta.write(contenido);
               
            extraerInfoLatindex();

            respuesta.end();
        }
        
      })

    } 
    else { // Si no existe el archivo
      respuesta.writeHead(404, { 'Content-Type': 'text/html' });
      respuesta.write('<!doctype html><html><head></head><body>Recurso inexistente</body></html>');
      respuesta.end();
    }

  })

})

servidor.listen(8888); // Dirección de puerto en el que el servidor se va a quedar escuchando peticiones
console.log('Servidor web iniciado en el puerto 8888'); 
*/
