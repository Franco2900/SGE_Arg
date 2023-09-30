const fs             = require('fs');        // Módulo para leer y escribir archivos
const puppeteer      = require('puppeteer'); // Módulo para web scrapping
const jsdom          = require('jsdom');     // Módulo para filtrar la información extraida con web scrapping

// Busco cuantas páginas devuelve la consulta a Latindex (cada página tiene entre 1 y 20 revistas)
async function obtenerPaths() {
  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(0);

    await page.goto('https://biblat.unam.mx/es/');

    // Espero a que el selector esté presente en la página
    await page.waitForSelector('path.highcharts-point.highcharts-name-argentina.highcharts-key-ar');
    await page.waitForTimeout(2000);
    // Comprobar si el selector está presente
    const selectorExists = await page.evaluate(() => {
      return !!document.querySelector('path.highcharts-point.highcharts-name-argentina.highcharts-key-ar');
    });

    if (!selectorExists) {
      console.log('El selector no está presente en la página.');
      return [];
    }

    await page.click(
      'path.highcharts-point.highcharts-name-argentina.highcharts-key-ar'
    );
    // Espero a que el selector esté presente en la página
    await page.waitForSelector('div.dataTables_scrollBody');
    await page.waitForTimeout(3000);

    const hrefs = await page.evaluate(() => {
      const hrefArray = [];
      const rows = document.querySelectorAll('#bodyRevista tr');

      rows.forEach(row => {
        const hrefElement = row.querySelector('td.sorting_1 a');
        if (hrefElement) {
          const href = hrefElement.getAttribute('href');
          hrefArray.push('https://biblat.unam.mx/es/'+href);
        }
      });

      return hrefArray;
    });
    //console.log('PATHs cantidad obtenidos:', hrefs.length);

    await browser.close();

    return hrefs;
  } catch (error) {
    console.error('Error:', error);
    throw error; // Lanza el error para manejarlo en el contexto que llama a esta función
  }
}


// Busco los enlaces de cada revista que devuelva la consulta a Latindex
async function buscarEnlacesARevistas(paths) {
  try {
    //const paths = await obtenerPaths();
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(5000); // Establece un tiempo de espera predeterminado

    const enlaces = [];

    for (const path of paths) {
      console.log('PATH:', path);
      try {
        await page.goto(path);
        await page.waitForSelector('a.registro.cboxElement', { timeout: 5000 }); // Espera a que aparezca el siguiente enlace
        
        const href = await page.evaluate(() => {
          const aElement = document.querySelector('a.registro.cboxElement');
          return aElement ? aElement.getAttribute('href') : null;
        });

        console.log('Href del siguiente enlace:', href);
        enlaces.push(href);
      } catch (error) {
        console.error('Error en page.goto para el path:', path, error.message);
        // Continúa con el siguiente path si hay un error de tiempo de espera
        continue;
      }
    }

    //console.log('ENLACES Cantidad obtenida:', enlaces.length);
    await browser.close();
    return enlaces;
  } catch (error) {
    console.error('Error obteniendo enlaces:', error);
    throw error;
  }
}
// Extraigo la info de una revista
async function extraerInfoRevista(enlaces) {
  const browser = await puppeteer.launch({ headless: "new" });
  const registros = [];

  for (const enlace of enlaces) {
    const page = await browser.newPage();

    try {
      console.log(`Procesando enlace: ${enlace}`);

      const response = await page.goto(enlace); 
      const body     = await response.text();   
            
    const { window: { document } } = new jsdom.JSDOM(body); 
        
    //var filtroHTML  = document.getElementById("rev-linea");
    var filtro2HTML = document.getElementsByClassName("table table-striped ")[0];
    const tabla1    = filtro2HTML.querySelectorAll("tbody tr td");
   var revista    = null;
   var issn      = null;
   var pais      = null;
   for ( i =0; i<tabla1.length;i++){
    //console.log("CONTENIDO: "+tabla1[i].textContent)
     if (tabla1[i].textContent === "Revista:") revista = tabla1[i+1].textContent ;
     if (tabla1[i].textContent === "ISSN:") issn = tabla1[i+1].textContent ;
     if (tabla1[i].textContent === "País:") pais = tabla1[i+1].textContent ;
    }
    
      //console.log("REGISTROS: "+revista+" "+issn);
      registros.push({ revista, issn , pais});
    } catch (error) {
      console.error(`Error al procesar enlace: ${enlace}`);
      console.error(error);
      // Continúa con el siguiente path si hay un error de tiempo de espera
      continue;
    } finally {
      await page.close();
    }
  }

  await browser.close();
  return registros;
}

// Extraigo la info de todas las revistas de la consulta
async function extraerInfoBiblat() {
  console.log("Comienza la extracción de datos de Biblat");
  const paths = await obtenerPaths();
  const enlaces = await buscarEnlacesARevistas(paths);
  //const enlaces = ['https://biblat.unam.mx/es/revista/salud-colectiva/articulo/concentracion'];
  const registros = await extraerInfoRevista(enlaces);

  console.log("CANTIDAD DE REVISTAS: " + paths.length);
  console.log("REVISTAS CONSULTADAS: " + enlaces.length);
  console.log("REGISTROS OBTENIDOS: " + registros.length);

  // Crear archivo JSON
  const jsonFilePath = './Revistas/Biblat.json';
  fs.writeFileSync(jsonFilePath, JSON.stringify(registros, null, 3));
  console.log(`Archivo JSON creado: ${jsonFilePath}`);

  // Crear archivo CSV
  const csvData = registros.map(registro => `${registro.revista};${registro.issn};${registro.pais}`).join('\n');
  const csvFilePath = './Revistas/Biblat.csv';
  fs.writeFileSync(csvFilePath, `Título;ISSN;Pais\n${csvData}`);
  console.log(`Archivo CSV creado: ${csvFilePath}`);

  console.log("Termina la extracción de datos de Biblat");
}

exports.extraerInfoBiblat = extraerInfoBiblat;
