const fs         = require('fs');        // Módulo para leer y escribir archivos
const puppeteer  = require('puppeteer'); // Módulo para web scrapping
const jsdom      = require('jsdom');     // Módulo para filtrar la información extraida con web scrapping
const csvtojson  = require('csvtojson'); // Módulo para pasar texto csv a json

// El web scrapping de Redalyc es especial porque se hace todo en la misma URL, para ver el resto de las revistas se actualiza el sitio
// Busco los enlaces de todas las revistas
async function extraerInfoRedalyc()
{
    const browser  = await puppeteer.launch({headless: 'new'}); // Inicio puppeter
   
    try
    {
        const page     = await browser.newPage();
        page.setDefaultNavigationTimeout(120000);                     // Indico el tiempo limite para conectarse a un sitio web en milisegundos. Con cero quita el límite de tiempo (no es recomendable poner en 0 porque puede quedar en un bucle infinito en caso de error)
        await page.goto(`https://www.redalyc.org/pais.oa?id=9`); // URL del sitio web al que se le hace web scrapping
        await page.waitForSelector(".wrapper");                  // Espera a que el elemento indicado se cargue en el sitio web
        var html = await page.content();                         // Guardo el HTML extraido en esta variable  
        
        var { window: { document } } = new jsdom.JSDOM(html);    // Inicio JSDOM y le paso el HTML extraido

        // Averiguo la cantidad de revistas y páginas para saber como proceder con la extracción de datos
        const cantidadRevistas = parseInt(document.getElementsByClassName("elemento-filtro")[0].getElementsByClassName("ng-binding")[1].textContent.trim().replaceAll("(", "").replaceAll(")", "") );
        console.log("Cantidad de revistas: " + cantidadRevistas);

        var cantidadPaginas = Math.ceil(cantidadRevistas / 15);
        console.log("Cantidad de páginas: " + cantidadPaginas);


        // Empiezo la extracción de datos
        var info = "Título;ISSN impresa;ISSN en linea;Instituto" + "\n";           // Info que quiero extraer
        for(var paginaActual = 1; paginaActual <= cantidadPaginas; paginaActual++) // Para recorrer todas las páginas
        {
            console.log(`Página actual: ${paginaActual}`);

            if(paginaActual > 1) // Si la página no es la primera, me muevo a la siguiente
            {
                await page.click(`#btn-${paginaActual} b`); // Hago click en la siguiente página para moverme
                await page.waitForSelector(`#loading[style*="display: none;"]`);

                html = await page.content();
            }

            var { window: { document } } = new jsdom.JSDOM(html);  // Obtengo el html actualizado
            var revistas = document.getElementsByClassName("right");

            for(var i = 0; i < revistas.length; i++) // Para extraer la info de cada página
            {
                var titulo = revistas[i].querySelectorAll("h4 a")[0].textContent;

                var issnImpresa = null;
                var issnEnLinea = null;
                if(revistas[i].querySelectorAll("span")[1] == undefined)
                {
                    issnEnLinea = revistas[i].querySelectorAll("span")[0].textContent.trim().replaceAll("ISSN: ", "");
                }
                else
                {
                    issnImpresa = revistas[i].querySelectorAll("span")[0].textContent.trim().replaceAll("ISSN: ", "");
                    issnEnLinea = revistas[i].querySelectorAll("span")[1].textContent.trim().replaceAll("ISSN: ", "");
                }

                var instituto = revistas[i].querySelectorAll("p a")[0].textContent;

                // Muestro en consola el resultado
                console.log(`***********************************************************************************`);
                console.log(`Título: ${titulo}`);
                console.log(`ISSN impresa: ${issnImpresa}`);
                console.log(`ISSN en linea: ${issnEnLinea}`);
                console.log(`Instituto: ${instituto}`);
                console.log(`***********************************************************************************`);

                info += `${titulo};${issnImpresa};${issnEnLinea};${instituto}` + "\n";
            }
 
        }


        // Escribo la info en formato CSV. En caso de que ya exista el archivo, lo reescribe así tenemos siempre la información actualizada
        fs.writeFile('./Revistas/Redalyc.csv', info, error => 
        { 
            if(error) console.log(error);
        })


        setTimeout(function () { // Le indico al programa que espere 5 segundos antes de seguir porque tarda en crearse el archivo .csv

            // Parseo de CSV a JSON
            csvtojson({delimiter: [";"],}).fromFile('./Revistas/Redalyc.csv').then((json) => // La propiedad delimiter indica porque caracter debe separar
            { 
                fs.writeFile('./Revistas/Redalyc.json', JSON.stringify(json), error => 
                { 
                    if(error) console.log(error);
                })
            })

        }, 5000);
    }
    catch(error)
    {
        console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
        console.log("HUBO UN ERROR");
        console.error(error);
        console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
    }

    await browser.close(); // cierro puppeter
}

exports.extraerInfoRedalyc = extraerInfoRedalyc;