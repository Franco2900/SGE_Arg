const fs = require("fs"); // Módulo para leer y escribir archivos
const puppeteer = require("puppeteer"); // Módulo para web scrapping
const jsdom = require("jsdom"); // Módulo para filtrar la información extraida con web scrapping

// Busco cuantas páginas devuelve la consulta a Latindex (cada página tiene entre 1 y 20 revistas)
async function obtenerUrls() {
  const urls = [];
  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(0);

    const response = await page.goto(
      "http://www.scielo.org.ar/scielo.php?script=sci_alphabetic&lng=es&nrm=iso"
    );
    const body = await response.text();

    const {
      window: { document },
    } = new jsdom.JSDOM(body);

    var filtroHTML = document.querySelectorAll("ul")[0];
    filtroHTML.querySelectorAll("li font a[href]").forEach((element) => {
      const href = element.getAttribute("href");
      //console.log("HREF", href);
      urls.push(href);
    });

    await page.close();
    await browser.close();
    return urls;
  } catch (error) {
    console.error("Error:", error);
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
      console.log("PATH:", path);
      try {
        await page.goto(path);
        await page.waitForSelector("a.registro.cboxElement", { timeout: 5000 }); // Espera a que aparezca el siguiente enlace

        const href = await page.evaluate(() => {
          const aElement = document.querySelector("a.registro.cboxElement");
          return aElement ? aElement.getAttribute("href") : null;
        });

        console.log("Href del siguiente enlace:", href);
        enlaces.push(href);
      } catch (error) {
        console.error("Error en page.goto para el path:", path, error.message);
        // Continúa con el siguiente path si hay un error de tiempo de espera
        continue;
      }
    }

    //console.log('ENLACES Cantidad obtenida:', enlaces.length);
    await browser.close();
    return enlaces;
  } catch (error) {
    console.error("Error obteniendo enlaces:", error);
    throw error;
  }
}
// Extraigo la info de una revista
async function extraerInfoRevista(urls) {
  const browser = await puppeteer.launch({ headless: "new" });
  const registros = [];

  for (const url of urls) {
    const page = await browser.newPage();
    try {
      console.log(`Procesando enlace: ${url}`);
      page.setDefaultNavigationTimeout(0);
      await page.goto(url);
        
        // Extraer los valores de issn y issn_e
  const issnMatches = await page.evaluate(() => {
    const spanElement = document.querySelector('.issn');
    const textContent = spanElement.textContent;

    // Crear patrones para extraer los ISSN
    const printPattern = /versión\s+impresa\s+ISSN\s+([\d-]+)/i;
    const onlinePattern = /versión\s+On-line\s+ISSN\s+([\d-]+)/i;

    const issn = textContent.match(printPattern);
    const issn_e = textContent.match(onlinePattern);

    return [issn ? issn[1] : null, issn_e ? issn_e[1] : null];
  });

  const [issn, issn_e] = issnMatches; 

      // Extraer el texto de la etiqueta <span class="titulo">Salud colectiva</span>
      const revista = await page.evaluate(() => {
        const imgElement = document.querySelector(".journalLogo img");
        return imgElement ? imgElement.alt : null;
      });

      // Extrae el valor de la etiqueta <strong>
      const institucion = await page.evaluate(() => {
        const titleElement = document.querySelector(".journalTitle");
        return titleElement ? titleElement.innerText.trim() : null;
      });

      console.log("Valor de ISSN:", issn);
      console.log("Valor de ISSN-e:", issn_e);
      console.log("INSTITUCION:", institucion);
      console.log("REVISTA: ", revista);

      registros.push({
        revista,
        institucion,
        issn,
        issn_e,
      });
    } catch (error) {
      console.error(`Error al procesar enlace: ${url}`);
      console.error(error);
      // Continúa con el siguiente URL si hay un error
      continue;
    } finally {
      await page.close();
    }
  }
  await browser.close();
  return registros;
}

// Extraigo la info de todas las revistas de la consulta
async function extraerInfoScielo() {
  console.log("Comienza la extracción de datos de Scielo");
    const urls = await obtenerUrls();
  //const urls = ["http://www.scielo.org.ar/scielo.php?script=sci_serial&pid=1851-8265&lng=es&nrm=iso"];
  const registros = await extraerInfoRevista(urls);
  //
  console.log("REVISTAS CONSULTADAS: " + urls.length);
  console.log("REGISTROS OBTENIDOS: " + registros.length);

 // Crear archivo JSON
 const jsonFilePath = "./Revistas/Scielo.json";
 fs.writeFileSync(jsonFilePath, JSON.stringify(registros, null, 4));
 console.log(`Archivo JSON creado: ${jsonFilePath}`);

 // Crear archivo CSV
 const csvData = registros
   .map((registro) => `${registro.revista};${registro.institucion};${registro.issn};${registro.issn_e}`)
   .join("\n");
 const csvFilePath = "./Revistas/Scielo.csv";
 fs.writeFileSync(csvFilePath, `Revista;Institucion;ISSN;ISSN-e\n${csvData}`);
 console.log(`Archivo CSV creado: ${csvFilePath}`);

 console.log("Termina la extracción de datos de Scielo");
}

exports.extraerInfoScielo = extraerInfoScielo;
