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
// =========================================================
// MÓDULO 04: PERIFÉRICOS DE E/S (TECLADO Y PANTALLA LCD)
// Autor: David - Tareas 11 y 12
// =========================================================


const IO_SHEET_NAME = ;
const KBD_CELL = ;      
const LCD_RANGE = ; 


function ReadKeyboard() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(IO_SHEET_NAME);
  if (!sheet) return 0x00;
  
  const kbValue = sheet.getRange(KBD_CELL).getValue();
  let parsedValue = parseInt(kbValue, 16);
  
  
  if (isNaN(parsedValue)) return 0x00;
  return parsedValue & 0xFF;
}



function WriteLCD(asciiValue) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(IO_SHEET_NAME);
  if (!sheet) return;
  
  const lcdRange = sheet.getRange(LCD_RANGE);
  let currentDisplay = lcdRange.getValues()[0]; 
  
  
  for (let i = 0; i < 7; i++) {
    currentDisplay[i] = currentDisplay[i + 1];
  }
  
  
  let charToDisplay = (asciiValue >= 32 && asciiValue <= 126) 
                      ? String.fromCharCode(asciiValue) 
                      :  + asciiValue.toString(16).toUpperCase() + ;
                      
  currentDisplay[7] = charToDisplay;
  
  lcdRange.setValues([currentDisplay]);
  SpreadsheetApp.flush();
}// Constantes para la interfaz (Se configurarán el penúltimo día)"Hoja 1""B10"// Celda de entrada del teclado"D10:K10"// Rango de 8 celdas para LCD 8x1// Función para leer un valor hexadecimal ingresado en el Teclado// Si la celda está vacía o es inválida, retorna 0// Función para enviar un carácter ASCII o Hex a la pantalla LCD 8x1// Maneja un buffer interno y desplaza los caracteres hacia la izquierda (efecto scroll)// Desplazar todo una posición a la izquierda// Convertir el valor a carácter imprimible, o mostrarlo en Hex si no es imprimible"[""]"
