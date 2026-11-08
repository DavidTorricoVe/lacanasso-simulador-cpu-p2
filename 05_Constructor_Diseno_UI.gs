/**
 * ARCHIVO 05: 05_Constructor_Diseno_UI.gs
 * RESPONSABLE: JORGE & DAVID (T01: Identidad Visual UI, T16: Ergonomía y Menú)
 * PROPÓSITO: Menú interactivo superior, ayudantes de formato y sincronización UI
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("SIMULADOR LACANASSO")
    .addItem("Cargar Programa 1 en IDE (Aritmético Bucles 4 Regs)", "CargarCatalogoProg1")
    .addItem("Cargar Programa 2 en IDE (Eco Interactivo Teclado → LCD)", "CargarCatalogoProg2")
    .addItem("Cargar Programa 3 en IDE (Estrés Caché + Page Faults)", "CargarCatalogoProg3")
    .addSeparator()
    .addItem("Ensamblar Código del IDE (A:G:J) y Cargar a RAM", "BtnAssembleAndLoad")
    .addItem("Solo Ensamblar y Validar Sintaxis en el IDE", "BtnEnsamblarIDE")
    .addItem("LOAD (Cargar Tabla Hexadecimal G:J al Simulador)", "BtnLoad")
    .addSeparator()
    .addItem("STEP (Ejecutar 1 Instrucción con Ruta Animada)", "BtnStep")
    .addItem("RUN (Ejecución Continua en Modo Turbo)", "BtnRun")
    .addItem("PAUSE (Pausar Ejecución)", "BtnPause")
    .addItem("RESET (Reiniciar Todo el Hardware)", "BtnReset")
    .addSeparator()
    .addItem("Encolar Texto de Entrada en el Teclado", "BtnEnqueueKey")
    .addToUi();
}

function StyleCard(range, borderColor) {
  range.setBorder(
    true, true, true, true, true, true,
    "#CBD5E1", SpreadsheetApp.BorderStyle.SOLID
  );
  range.setBorder(
    true, true, true, true, null, null,
    borderColor || "#0F172A", SpreadsheetApp.BorderStyle.SOLID_MEDIUM
  );
}

function RefrescarEstilosConsola() {
  const sheet = getSheet(UI_CONFIG.SHEETS.MAIN);
  if (!sheet) return;
  Object.keys(UI_CONFIG.BUSES).forEach(key => {
    const b = UI_CONFIG.BUSES[key];
    setMergedBox(sheet, b.range, b.label, b.baseColor, "#FFFFFF");
  });
  UpdateLiveBanner("CONSOLA SINCRONIZADA Y LISTA", UI_CONFIG.COLORS.MMU_OK, "Buses en estado de reposo (High-Z)");
}