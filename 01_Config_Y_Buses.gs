// ==========================================
// MÓDULO 1: CONFIGURACIÓN, CPU Y BUSES
// ==========================================

const SHEET_NAME = "Hoja 1";

// Registros expandidos (Tarea #2)
const REG_ORDER = ['PC', 'IR', 'MAR', 'MDR', 'AX', 'BX', 'CX', 'DX'];
const FLAG_ORDER = ['ZF', 'CF', 'SF'];

// Estado Global del CPU con 4 registros de propósito general
let CPU = {
  PC: 0x00, IR: 0x00, MAR: 0x00, MDR: 0x00, 
  AX: 0x00, BX: 0x00, CX: 0x00, DX: 0x00,
  ZF: 0, CF: 0, SF: 0, 
  isHalted: false
};

// ==========================================
// UNIDAD ARITMÉTICO-LÓGICA (ALU)
// ==========================================
function ExecuteALU(operation, val1, val2 = 0) {
  let result = 0;
  let carry = 0;

  switch (operation) {
    case 'ADD': result = val1 + val2; carry = result > 255 ? 1 : 0; break;
    case 'SUB':
    case 'CMP': result = val1 - val2; carry = val1 < val2 ? 1 : 0; break;
    case 'INC': result = val1 + 1; carry = result > 255 ? 1 : 0; break;
    case 'DEC': result = val1 - 1; carry = (val1 === 0) ? 1 : 0; break;
    default: result = val1; break;
  }

  let finalResult = result & 0xFF;
  CPU.ZF = (finalResult === 0) ? 1 : 0;
  CPU.CF = carry;
  CPU.SF = (finalResult & 0x80) !== 0 ? 1 : 0;
  return finalResult;
}
// ==========================================
// MÓDULO 1.1: BUSES Y CONTROL TRI-ESTADO (HIGH-Z)
// ==========================================

const CONTROL_SIGNALS = [
  'En_PC', 'Ld_MAR', 'Mem_R', 'Mem_W', 'Ld_MDR', 'En_MDR', 
  'Ld_IR', 'En_ALU', 'Ld_AX', 'En_AX', 'Ld_BX', 'En_BX', 
  'Ld_CX', 'En_CX', 'Ld_DX', 'En_DX', 'En_KBD', 'Ld_LCD'
];

const COLOR_READ  = "#b6d7a8"; // Verde (Lecturas)
const COLOR_WRITE = "#ea9999"; // Rojo (Escrituras)
const COLOR_ALU   = "#cfe2f3"; // Azul (Matemáticas)

function SetControlSignals(activeSignals) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const values = CONTROL_SIGNALS.map(sig => activeSignals.includes(sig) ? [1] : ['Hi-Z']);
  
  // Panel visual de micro-palabra (columna X, filas 5 a 22)
  const range = sheet.getRange(5, 24, CONTROL_SIGNALS.length, 1);
  range.setValues(values);
  
  const backgrounds = values.map(v => v[0] === 1 ? ["#00FF00"] : ["#EFEFEF"]);
  range.setBackgrounds(backgrounds);
  SpreadsheetApp.flush();
  Utilities.sleep(60);
}

function HighlightBus() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const busRange = sheet.getRange("S3:T3"); // Rango visual del Bus
  busRange.setBackground("#FF9900");
  SpreadsheetApp.flush();
  Utilities.sleep(80); 
  busRange.setBackground("#EFEFEF");
  SpreadsheetApp.flush();
}