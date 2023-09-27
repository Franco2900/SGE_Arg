// Busco cuantas páginas devuelve la consulta a Latindex (cada página tiene entre 1 y 20 revistas)
async function obtenerPaths(puppeteer) {
  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(0);

    await page.goto('https://biblat.unam.mx/es/');

    // Espero a que el selector esté presente en la página
    await page.waitForSelector('path.highcharts-point.highcharts-name-argentina.highcharts-key-ar');

    await page.click(
      'path.highcharts-point.highcharts-name-argentina.highcharts-key-ar'
    );

    await page.waitForTimeout(2000);

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
    console.log('HREFs cantidad:', hrefs.length);
    console.log('HREFs encontrados:', hrefs);

    await browser.close();

    return hrefs;
  } catch (error) {
    console.error('Error:', error);
    throw error; // Lanza el error para manejarlo en el contexto que llama a esta función
  }
}


// Busco los enlaces de cada revista que devuelva la consulta a Latindex
async function buscarEnlacesARevistas(puppeteer) {
  try {
    const paths = await obtenerPaths(puppeteer);
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

    console.log('Cantidad de ENLACES:', enlaces.length);
    await browser.close();
    return enlaces;
  } catch (error) {
    console.error('Error obteniendo enlaces:', error);
    throw error;
  }
}


// Extraigo la info de una revista
async function extraerInfoRevista(puppeteer, jsdom, enlace) {
  try {
    const browser = await puppeteer.launch({ headless: "new" });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(0);
    const response = await page.goto(enlace);
    const body = await response.text();

    const {
      window: { document },
    } = new jsdom.JSDOM(body);

    var filtroHTML = document.getElementById("rev-linea");
    var filtro2HTML = filtroHTML.getElementsByClassName(
      "table-resultadosFicha"
    )[0];
    const tabla1 = filtro2HTML.querySelectorAll("tbody tr td");
    const titulo = tabla1[0].textContent;
    const issn = tabla1[tabla1.length - 1].textContent;

    filtroHTML = document.getElementById("datos-comunes");
    const tabla2 = filtroHTML.querySelectorAll("div table tbody tr td");
    const tabla3 = filtroHTML.querySelectorAll("div table tbody tr th");

    var moverPosicion = 0;
    var organismoResponsable = null;
    if (tabla3[3].textContent == "Organismo responsable:") {
      // No todas las revistas tienen esta variable
      moverPosicion = 1;
      organismoResponsable = tabla2[3].textContent.trim().replaceAll(";", ",");
    }

    const idioma = tabla2[0].textContent.trim().replaceAll(";", ",");
    const tema = tabla2[1].textContent.trim().replaceAll(";", ",");
    const subtemas = tabla2[2].textContent.trim().replaceAll(";", ",");
    const editorial = tabla2[3 + moverPosicion].textContent
      .trim()
      .replaceAll(";", ",");
    const ciudad = tabla2[4 + moverPosicion].textContent
      .trim()
      .replaceAll(";", ",");
    const provincia = tabla2[5 + moverPosicion].textContent
      .trim()
      .replaceAll(";", ","); // En Latindex se llama Estado/Provincia/Departamento pero para hacerlo corto lo llamo directamente provincia
    const correo = tabla2[6 + moverPosicion].textContent
      .trim()
      .replaceAll(";", ",");

    await browser.close();

    console.log(
      `***********************************************************************************`
    );
    console.log(`Título: ${titulo}`);
    console.log(`ISSN: ${issn}`);
    console.log(`Idioma: ${idioma}`);
    console.log(`Tema: ${tema}`);
    console.log(`Subtemas: ${subtemas}`);
    console.log(`Organismo responsable: ${organismoResponsable}`);
    console.log(`Editorial: ${editorial}`);
    console.log(`Ciudad: ${ciudad}`);
    console.log(`Estado/Provincia/Departamento: ${provincia}`);
    console.log(`Correo: ${correo}`);
    console.log(
      `***********************************************************************************`
    );

    return (
      `${titulo};${issn};${idioma};${tema};${subtemas};${organismoResponsable};${editorial};${ciudad};${provincia};${correo};` +
      `\n`
    );
  } catch (error) {
    console.error(error);
  }
}

// Extraigo la info de todas las revistas de la consulta
async function extraerInfoBiblat(puppeteer, jsdom, fs) {
  console.log("Comienza la extracción de datos de Latindex");

  const enlaces = await buscarEnlacesARevistas(puppeteer, jsdom);
  var info =
    "Título;ISSN;Idioma;Tema;Subtemas;Organismo responsable;Editorial;Ciudad;Estado/Provincia/Departamento;Correo;" +
    "\n";

  console.log("CANTIDAD DE REVISTAS: " + enlaces.length);

  var i;
  for (i = 0; i < enlaces.length - 1; i++) {
    console.log(`REVISTA ${i}`);
    info += await extraerInfoRevista(puppeteer, jsdom, enlaces[i]);
  }

  // Escribimos la info de cada revista en el archivo excel. En caso de que ya exista el archivo, lo reescribe así tenemos siempre la información actualizada
  fs.writeFile("./Revistas/Latindex.xls", info, (error) => {
    if (error) console.log(error);
  });

  console.log("Termina la extracción de datos de Latindex");
}

exports.buscarEnlacesARevistas = buscarEnlacesARevistas;
