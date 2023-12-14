const fs        = require('fs');        // Módulo para leer y escribir archivos
const puppeteer = require('puppeteer'); // Módulo para web scrapping
const jsdom     = require('jsdom');     // Módulo para filtrar la información extraida con web scrapping
const csvtojson = require('csvtojson'); // Módulo para pasar texto csv a json


// Busco los enlaces de todas las revistas
async function buscarEnlacesARevistas(tiempo) 
{
  var enlaces = [];
  const browser = await puppeteer.launch({ headless: 'new' }); // inicio puppeter

  try 
  {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(tiempo);                    // Indico el tiempo limite para conectarse a un sitio web en milisegundos. Con cero quita el límite de tiempo (no es recomendable poner en 0 porque puede quedar en un bucle infinito en caso de error)
    const response = await page.goto(`http://www.caicyt-conicet.gov.ar/sitio/comunicacion-cientifica/nucleo-basico/revistas-integrantes/`); // URL del sitio web al que se le hace web scrapping
    const body = await response.text();                     // Guardo el HTML extraido en esta variable  

    const { window: { document } } = new jsdom.JSDOM(body);     // inicio JSDOM y le paso el HTML extraido

    const filtroHTML = document.getElementsByClassName("_self cvplbd"); // Hago un filtro al HTML extraido

    // DEBUGEO
    /*var titulos = "";
    for(var i = 0; i < filtroHTML.length; i++){
      titulos += filtroHTML[i].textContent.trim() + "\n";
    }

    fs.writeFile('./Revistas/auxCAICYT.csv', titulos, error => {
      if (error) console.log(error);
    })*/
    // DEBUGEO

    for (var i = 0; i < filtroHTML.length; i++) 
    {
      enlaces.push(filtroHTML[i].getAttribute("href"));        // obtengo los enlaces de las revistas
    }

  }
  catch (error) 
  {
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
    console.log("HUBO UN ERROR CON LA CONEXIÓN DE PUPPETEER");
    console.error(error);
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
  }

  await browser.close(); // cierro puppeter
  return enlaces;
}


// Extraigo la info de una sola revista
async function extraerInfoRevista(enlace, tiempo) 
{
  var respuesta;
  const browser = await puppeteer.launch({ headless: 'new' });

  try 
  {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(tiempo);
    const response = await page.goto(enlace);
    const body = await response.text();

    const { window: { document } } = new jsdom.JSDOM(body);

    try 
    {
      const titulo = document.getElementsByClassName("entry-title")[0].textContent.trim().replaceAll(";", ",");

      var issnImpresa = null;
      var issnEnLinea = null;
      var auxISSN = null; // CASO EXCEPCIONAL: Una revista tiene tres ISSN, siendo el tercer ISSN la revista en ingles
      // Algunas revistas solo tienen ISSN en linea, mientras que otras tienen ISSN en linea e impresa

      // Me fijo si la sección con la información tiene etiquetas <p> y <strong>
      const etiquetasP        = document.getElementsByClassName("siteorigin-widget-tinymce textwidget")[0].querySelectorAll("p");
      const etiquetasStrong   = document.getElementsByClassName("siteorigin-widget-tinymce textwidget")[0].querySelectorAll("strong");
      const etiquetasPyStrong = document.getElementsByClassName("siteorigin-widget-tinymce textwidget")[0].querySelectorAll("p strong");

      // Caso expecional. El ISSN no esta marcado con la etiqueta Strong. Todos los ISSN son identificados con la etiqueta Strong
      if (typeof (etiquetasP[0]) != "undefined" && etiquetasP.length == 2) 
      {
        issnEnLinea = etiquetasP[0].textContent.trim().replaceAll(";", ",").replaceAll("ISSN ", "").replaceAll(" (En línea)", "");
      }

      // Si no tiene etiquetas <p> y la revista solo tiene ISSN en linea
      if (typeof (etiquetasP[0]) == "undefined" && etiquetasStrong.length == 2) 
      {
        issnEnLinea = etiquetasStrong[0].textContent.trim().replaceAll(";", ",").replaceAll("ISSN ", "").replaceAll("(En línea)", "");
      }
      // Si no tiene etiquetas <p> y la revista tiene ISSN en linea e ISSN impresa
      if (typeof (etiquetasP[0]) == "undefined" && etiquetasStrong.length > 2) 
      {
        issnImpresa = etiquetasStrong[0].textContent.trim().replaceAll(";", ",").replaceAll("ISSN ", "").replaceAll("(Impresa)");
        issnEnLinea = etiquetasStrong[1].textContent.trim().replaceAll(";", ",").replaceAll("ISSN ", "").replaceAll("(En línea)", "");
      }

      // Si tiene etiquetas <p> y la revista solo tiene ISSN en linea
      if (typeof (etiquetasP[0]) != "undefined" && etiquetasPyStrong.length == 2) 
      {
        issnEnLinea = etiquetasPyStrong[0].textContent.trim().replaceAll(";", ",").replaceAll("ISSN ", "").replaceAll("(En línea)", "");
      }
      // Si tiene etiquetas <p> y la revista tiene ISSN en linea e ISSN impresa
      if (typeof (etiquetasP[0]) != "undefined" && etiquetasPyStrong.length > 2) 
      {
        issnImpresa = etiquetasPyStrong[0].textContent.trim().replaceAll(";", ",").replaceAll("ISSN ", "").replaceAll("(Impresa)");
        issnEnLinea = etiquetasPyStrong[2].textContent.trim().replaceAll(";", ",").replaceAll("ISSN ", "").replaceAll("(En línea)", "");

        // No todas las revistas tienen el ISSN en linea bien escrito
        if (issnEnLinea == "Ver publicación" || issnEnLinea.replace(/(?:\r\n|\r|\n)/g, "") == "" /*Quita los saltos de línea*/ || etiquetasP[0].textContent.trim().includes("English ed.") /* Una revista tiene tres ISSN, siendo el tercer ISSN la revista en ingles */) 
        {
          issnEnLinea = etiquetasPyStrong[1].textContent.trim().replaceAll(";", ",").replaceAll("ISSN ", "").replaceAll("(En línea)", "");
        }

        // Algunas revistas tienen las etiquetas para el ISSN en linea pero no tienen nada de texto dentro
        if (issnEnLinea == "") 
        {
          issnImpresa = null;
          issnEnLinea = etiquetasPyStrong[0].textContent.trim().replaceAll(";", ",").replaceAll("ISSN ", "").replaceAll("(En línea)", "");
        }

        if(etiquetasP[0].textContent.trim().includes("English ed.") ) auxISSN = etiquetasPyStrong[2].textContent.trim().replaceAll(";", ",").replaceAll("ISSN ", "").replaceAll("(En línea)", "");  /* Una revista tiene tres ISSN, siendo el tercer ISSN la revista en ingles */

      }
      

      var area = null;
      // Para chequear a que área corresponde cada revista reviso que imagen tienen en la clase "so-widget-image"
      const imagen = document.getElementsByClassName("so-widget-image")[0].getAttribute("src");
      switch (imagen) 
      {
        case "http://www.caicyt-conicet.gov.ar/sitio/wp-content/uploads/2017/09/CIENCIAS-BIOLÓGICAS-Y-DE-LA-SALUD-00.jpg":
          area = "Ciencias biológicas y de la salud";
          break;

        case "http://www.caicyt-conicet.gov.ar/sitio/wp-content/uploads/2017/09/CIENCIAS-AGRARIAS-INGENIERÍA-Y-MATERIALES-00.jpg":
          area = "Ciencias agrarias, ingeniería y materiales";
          break;

        case "http://www.caicyt-conicet.gov.ar/sitio/wp-content/uploads/2017/09/CIENCIAS-EXACTAS-Y-NATURALES-00.jpg":
          area = "Ciencias exactas y naturales";
          break;

        case "http://www.caicyt-conicet.gov.ar/sitio/wp-content/uploads/2017/09/CIENCIAS-SOCIALES-Y-HUMANIDADES-00.jpg":
          area = "Ciencias sociales y humanidades";
          break;

        default:
          area = "No hay area";
          break;
      }

      // Obtener la información de la institución es muy complicado porque todos tienen algo diferente
      // Elimino todo lo que no quiero hasta que solo me quede el nombre de la institución
      var instituto;
      if (typeof (etiquetasP[0]) == "undefined")  // Si no tiene etiquetas <p>
      {
        instituto = document.getElementsByClassName("siteorigin-widget-tinymce textwidget")[0].textContent.trim();
      }
      else // Si tiene etiquetas <p>
      {
        instituto = etiquetasP[0].textContent.trim();
      }

      if (instituto.includes("English ed."))     instituto = instituto.replaceAll("English ed.", ""); // Hay una revista que tiene un tercer ISSN de la versión en ingles. Esta no se cuenta porque no es Argentina
      if (auxISSN != null)                       instituto = instituto.replaceAll(`${auxISSN}`, "");  // Hay una revista que tiene un tercer ISSN de la versión en ingles. Esta no se cuenta porque no es Argentina
      if (instituto.includes(";"))               instituto = instituto.replaceAll(";", ",");
      if (instituto.includes("."))               instituto = instituto.replaceAll(".", "");
      if (instituto.includes("("))               instituto = instituto.replaceAll("(", "");
      if (instituto.includes(")"))               instituto = instituto.replaceAll(")", "");
      if (instituto.includes("ISSN "))           instituto = instituto.replaceAll("ISSN ", "");
      if (instituto.includes(`${issnEnLinea}`))  instituto = instituto.replaceAll(`${issnEnLinea}`, "");
      if (instituto.includes(`${issnImpresa}`))  instituto = instituto.replaceAll(`${issnImpresa}`, "");
      if (instituto.includes("Impresa"))         instituto = instituto.replaceAll("Impresa", "");
      if (instituto.includes("impresa"))         instituto = instituto.replaceAll("impresa", "");
      if (instituto.includes("lmpresa"))         instituto = instituto.replaceAll("lmpresa", ""); // Alguien en una revista puso impresa con l en vez I
      if (instituto.includes("En"))              instituto = instituto.replaceAll("En", "");
      if (instituto.includes("en"))              instituto = instituto.replaceAll("en", "");
      if (instituto.includes("línea"))           instituto = instituto.replaceAll("línea", "");
      if (instituto.includes("linea"))           instituto = instituto.replaceAll("linea", "");
      if (instituto.includes("Ver publicación")) instituto = instituto.replaceAll("Ver publicación", "");
      instituto = instituto.replace(/(?:\r\n|\r|\n)/g, ""); // Quita los saltos de línea
      instituto = instituto.trimStart(); // Quita los espacios en blanco que quedan al principio


      // Chequeo que el string que me quedo no este vacio
      var instituoVacio = true;
      for (var i = 0; i < instituto.length; i++) {
        if (instituto[i] != " ") instituoVacio = false;
      }

      if (instituoVacio) instituto = null;

      // Muestro en consola el resultado
      console.log(`***********************************************************************************`);
      console.log(`Título: ${titulo}`);
      console.log(`ISSN impresa: ${issnImpresa}`);
      console.log(`ISSN en linea: ${issnEnLinea}`);
      console.log(`Área: ${area}`);
      console.log(`Instituto: ${instituto}`);
      console.log(`***********************************************************************************`);

      respuesta = `${titulo};${issnImpresa};${issnEnLinea};${area};${instituto}` + '\n';
    }
    catch (error) {
      respuesta = "HUBO UN ERROR" + "\n";

      console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
      console.log("HUBO UN ERROR AL EXTRAER LOS DATOS");
      console.error(error);
      console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
    }


  }
  catch (error) {
    respuesta = "HUBO UN ERROR" + "\n";

    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
    console.log("HUBO UN ERROR CON LA CONEXIÓN DE PUPPETEER");
    console.error(error);
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
  }

  await browser.close();
  return respuesta;
}


// Extraigo la info de todas las revistas
async function extraerInfoCAICYT() 
{
  console.log("Comienza la extracción de datos de CAICYT");

  const enlaces = await buscarEnlacesARevistas(120000);
  console.log(`CANTIDAD DE REVISTAS ${enlaces.length}`);

  var info = "Título;ISSN impresa;ISSN en linea;Área;Instituto" + "\n"; // No usar las tildes inclinadas (` `) acá porque al ser la línea cabecera genera error al crear el archivo csv
  var auxError = 0;

  try
  {
    if(enlaces.length > 0)
    {
      var revista = 0;
      for (var i = 0; i < enlaces.length; i++) // Recorro todos los enlaces y obtengo la info de cada revista una por una
      {
        console.log(`REVISTA ${++revista} DE ${enlaces.length}`);
        auxError = i;
        info += await extraerInfoRevista(enlaces[i], 120000);
      }      

      console.log("Termina la extracción de datos de CAICYT");
      escribirArchivos(info);
    }
  }
  catch(error) // En caso de que se caiga el sitio web debido a la sobrecarga de transito. Solo pasa con este sitio web
  {
    console.log(error)
    console.log("Extraccion de datos incompleta");
  
    if(enlaces.length > 0)
    {
      for(var i = auxError; i < enlaces.length; i++) // A todas las revistas que falto extraer se les pone el mensaje "HUBO UN ERROR\n"
      {
        info += "HUBO UN ERROR\n";
      }

      escribirArchivos(info);
    }
  }

}


async function sanarDatos() 
{
  console.log("Saneando datos corrompidos");

  // Busco los archivos para sanear
  var archivoCSV;
  fs.readFile(`./Revistas/CAICYT.csv`, (error, datos) => 
  {
    if (error) console.log(error);
    else archivoCSV = datos.toString();
  })

  const archivoJSON = require(`../Revistas/CAICYT.json`);
  const enlaces = await buscarEnlacesARevistas(0);

  var cantidadRevistarASanear = 0;
  for (var i = 0; i < archivoJSON.length; i++)
  {
    if (archivoJSON[i].Título == "HUBO UN ERROR") cantidadRevistarASanear++;
  }
  console.log(`Hay ${cantidadRevistarASanear} revistas para sanear del total de ${archivoJSON.length} revistas`);


  // Vuelvo a extraer los datos de las revistas que tienen errores y añado la información saneada al archivo
  if(enlaces.length > 0 && cantidadRevistarASanear > 0) // Me fijo si se produjo un error al obtener los enlances y si de verdad hay algo para sanear
  { 
    try
    {
      var revistasSaneadas = 0;
      var revistasNoSaneadas = 0;

      for (var i = 0; i < archivoJSON.length; i++) 
      {
        if (archivoJSON[i].Título == "HUBO UN ERROR") // Uso el archivo JSON para saber que revistas hay que sanear
        { 
          console.log(`Saneando Revista ${i}. Falta sanear ${cantidadRevistarASanear - revistasSaneadas - revistasNoSaneadas} revistas`);
          var info = await extraerInfoRevista(enlaces[i], 0); // Vuelvo a extraer la info de la revista

          if(!info.includes("HUBO UN ERROR\n")) // Si no hubo error al recuperar la información
          {
            archivoCSV = archivoCSV.replace("HUBO UN ERROR\n", info)  // Se sobreescribe el "HUBO UN ERROR\n" en el archivo csv con la información recuperada    
            revistasSaneadas++;
          }
          else // Si hubo error al recuperar la información
          {
            archivoCSV = archivoCSV.replace("HUBO UN ERROR\n", "NO SE PUDO SANEAR\n"); // Se sobreescribe el "HUBO UN ERROR\n" en el archivo csv con cualquier otra cosa porque la función replace() siempre reemplaza la primera coincidencia y eso genera problemas
            revistasNoSaneadas++;
          }
        }
      }
      
      console.log("Saneamiento completo");
      console.log(`Se sanearon ${revistasSaneadas} revistas`);
      if(revistasNoSaneadas > 0) console.log(`No se pudo sanear ${revistasNoSaneadas} revistas`);
    }
    catch(error)
    {
      console.log(error);
      console.log("Saneamiento incompleto debido a un error");
    }
  }

  archivoCSV = archivoCSV.replaceAll("NO SE PUDO SANEAR\n", "HUBO UN ERROR\n"); // Vuelvo a poner como estaba el mensaje de error
  escribirArchivos(archivoCSV); // Vuelvo a escribir los archivos pero ya saneados

  /*setTimeout(function () {
    if(archivoCSV.includes("HUBO UN ERROR\n")) sanarDatos();
  }, 20000); */
}


function escribirArchivos(info)
{
  // Escribo la info en formato CSV. En caso de que ya exista el archivo, lo reescribe así tenemos siempre la información actualizada
  fs.writeFile('./Revistas/CAICYT.csv', info, error => {
    if (error) console.log(error);
  })


  setTimeout(function () { // Le indico al programa que espere 5 segundos antes de seguir porque tarda en crearse el archivo .csv

    // Parseo de CSV a JSON
    csvtojson({ delimiter: [";"], }).fromFile('./Revistas/CAICYT.csv').then((json) => // La propiedad delimiter indica porque caracter debe separar
    {
      fs.writeFile('./Revistas/CAICYT.json', JSON.stringify(json), error => {
        if (error) console.log(error);
      })
    })

  }, 5000);  
}


exports.extraerInfoCAICYT = extraerInfoCAICYT;
exports.sanarDatos = sanarDatos;