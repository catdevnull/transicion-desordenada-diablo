export const targetsPorDefecto = [
  "datajson+https://datos.gob.ar/data.json",
  "datajson+http://datos.energia.gob.ar/data.json",
  "datajson+https://datos.magyp.gob.ar/data.json",
  "datajson+https://datos.acumar.gov.ar/data.json",
  "datajson+https://datasets.datos.mincyt.gob.ar/data.json",
  "datajson+https://datos.cultura.gob.ar/data.json",
  "datajson+https://datos.mininterior.gob.ar/data.json",
  "datajson+https://datos.produccion.gob.ar/data.json",
  "datajson+http://datos.salud.gob.ar/data.json",
  "datajson+https://datos.transporte.gob.ar/data.json",
  "datajson+https://ckan.ciudaddemendoza.gov.ar/data.json",
  "datajson+https://datos.santafe.gob.ar/data.json",
  "datajson+https://datosabiertos.chaco.gob.ar/data.json",
  "datajson+https://datosabiertos.mercedes.gob.ar/data.json",
  "datajson+http://luj-bue-datos.paisdigital.innovacion.gob.ar/data.json",
  "datajson+https://datosabiertos.desarrollosocial.gob.ar/data.json",
  "datajson+http://datos.mindef.gov.ar/data.json",
  "datajson+http://datos.legislatura.gob.ar/data.json",
  "datajson+https://portal.hcdiputados-ba.gov.ar/data.json", // Cámara de Diputados de la Provincia de Buenos Aires
  "datajson+https://datos.arsat.com.ar/data.json",

  "datajson+https://monitoreo.datos.gob.ar/catalog/jgm/data.json",
  // "datajson+https://datosabiertos.enacom.gob.ar/data.json",
  "datajson+https://monitoreo.datos.gob.ar/catalog/otros/data.json",
  "datajson+https://monitoreo.datos.gob.ar/catalog/aaip/data.json",
  "datajson+https://monitoreo.datos.gob.ar/media/catalog/sedronar/data.json",
  "datajson+https://monitoreo.datos.gob.ar/catalog/modernizacion/data.json",
  "datajson+https://monitoreo.datos.gob.ar/media/catalog/shn/data.json",
  "datajson+https://monitoreo.datos.gob.ar/catalog/smn/data.json",
  "datajson+https://monitoreo.datos.gob.ar/catalog/ign/data.json",
  "datajson+https://monitoreo.datos.gob.ar/catalog/justicia/data.json",
  "datajson+https://monitoreo.datos.gob.ar/catalog/seguridad/data.json",
  "datajson+https://monitoreo.datos.gob.ar/media/catalog/ambiente/data.json",
  // "datajson+http://andino.siu.edu.ar/data.json",
  "datajson+https://monitoreo.datos.gob.ar/catalog/educacion/data.json",
  "datajson+https://monitoreo.datos.gob.ar/media/catalog/inti/data.json",
  "datajson+https://monitoreo.datos.gob.ar/catalog/ssprys/data.json",
  "datajson+https://www.presupuestoabierto.gob.ar/sici/rest-api/catalog/public",
  "datajson+https://transparencia.enargas.gob.ar/data.json",
  "datajson+https://infra.datos.gob.ar/catalog/sspm/data.json",
  "datajson+https://monitoreo.datos.gob.ar/catalog/ssprys/data.json",
  "datajson+https://monitoreo.datos.gob.ar/catalog/siep/data.json",
  "datajson+https://monitoreo.datos.gob.ar/catalog/exterior/data.json",
  "datajson+http://datos.pami.org.ar/data.json",
  "datajson+https://monitoreo.datos.gob.ar/media/catalog/trabajo/data.json",
  "datajson+https://datos.yvera.gob.ar/data.json",
  "datajson+https://monitoreo.datos.gob.ar/media/catalog/renaper/data.json",
  "datajson+https://monitoreo.datos.gob.ar/media/catalog/dine/data.json",
  "datajson+https://monitoreo.datos.gob.ar/media/catalog/obras/data.json",
  "datajson+https://monitoreo.datos.gob.ar/media/catalog/generos/data.json",

  "ckan+http://datos.jus.gob.ar", // justicia nacional
  "ckan+https://datos.csjn.gov.ar", // corte suprema de justicia nacional
  "ckan+https://datos.hcdn.gob.ar", // diputados nacional
  "ckan+https://data.buenosaires.gob.ar", // CABA
  "ckan+https://datos.tsjbaires.gov.ar", // tribunal superior de justicia CABA
];

// desactivado porque va MUY lento: datosabiertos.gualeguaychu.gov.ar

// FYI: al menos los siguientes dominios no tienen la cadena completa de certificados en HTTPS. tenemos que usar un hack (node_extra_ca_certs_mozilla_bundle) para conectarnos a estos sitios. (se puede ver con ssllabs.com) ojalá lxs administradorxs de estos servidores lo arreglen.
// www.enargas.gov.ar, transparencia.enargas.gov.ar, www.energia.gob.ar, www.economia.gob.ar, datos.yvera.gob.ar

export const userAgent = "transicion-desordenada (https://nulo.ar)";
