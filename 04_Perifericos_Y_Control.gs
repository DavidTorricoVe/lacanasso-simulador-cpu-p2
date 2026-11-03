// ==========================================
// MÓDULO 4.1: CARGADOR DINÁMICO Y PROGRAMAS DE PRUEBA
// ==========================================

const PROGRAMAS_ISA = {
  "Prog1_Suma": [
    { op: "MOV", reg: "AX", val: 0x05 },
    { op: "MOV", reg: "BX", val: 0x03 },
    { op: "ADD", reg: "AX", val: "BX" },
    { op: "HALT", reg: "", val: 0 }
  ],
  "Prog2_Contador": [
    { op: "MOV", reg: "CX", val: 0x0A },
    { op: "DEC", reg: "CX", val: 0 },
    { op: "HALT", reg: "", val: 0 }
  ],
  "Prog3_IO": [
    { op: "MOV", reg: "DX", val: 0x48 }, // Código ASCII 'H'
    { op: "OUT", reg: "LCD", val: "DX" },
    { op: "HALT", reg: "", val: 0 }
  ]
};

function CargarProgramaEnMemoria(nombrePrograma) {
  const programa = PROGRAMAS_ISA[nombrePrograma];
  if (!programa) {
    Logger.log("Error: Programa no encontrado en el catálogo.");
    return false;
  }
  
  // Limpia y carga secuencialmente en la memoria RAM base
  let direccionBase = 0x00;
  programa.forEach((instruccion, index) => {
    // Simula la escritura en las celdas de memoria del simulador
    Logger.log(`Cargando ${instruccion.op} en 0x${(direccionBase + index).toString(16)}`);
  });
  
  SpreadsheetApp.getActiveSpreadsheet().toast(`Programa ${nombrePrograma} cargado con éxito.`, "Cargador Dinámico", 3);
  return true;
}