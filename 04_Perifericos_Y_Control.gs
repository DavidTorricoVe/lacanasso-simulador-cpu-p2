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