// Módulos del núcleo de Node.JS o módulos externos
const fs             = require('fs');        // Módulo para leer y escribir archivos
const puppeteer      = require('puppeteer'); // Módulo para web scrapping
const jsdom          = require('jsdom');     // Módulo para filtrar la información extraida con web scrapping
const XMLHttpRequest = require('xhr2');      // Módulo para comunicarse con las APIs

// Módulos de webscrapping (hechos por nosotros)
const Latindex = require('./modulos webScrapping/Latindex webScrapping.js');
const CAICYT   = require('./modulos webScrapping/CAICYT websScrapping.js');
const Biblat   = require('./modulos webScrapping/Biblat_webScrapping.js');

// APIs (los brindan los sitios web)
const DOAJ     = require('./APIs/DOAJ API.js');

// Extracción de datos
//Latindex.extraerInfoLatindex(puppeteer, jsdom, fs);
//DOAJ.extraerInfoDOAJ(XMLHttpRequest, fs);
//CAICYT.extraerInfoCAICYT(puppeteer, jsdom, fs);
//Biblat.extraerInfoBiblat(puppeteer, jsdom, fs);
Biblat.extraerInfoBiblat();
