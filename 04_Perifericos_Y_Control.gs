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
// TAREA #15 (JORGE): Programa 3 de Estrés de Jerarquía de Memoria (Cache Miss/Hit + Page Faults + Write-Back)
function CargarCatalogoProg3() {
const ideLines = [
["1", "INICIO", "MOV AX, imm", "AAh", ""],
["2", "", "STORE [mem], AX", "40h", ""],
["3", "", "LOAD BX, [mem]", "40h", ""],
["4", "", "LOAD CX, [mem]", "41h", ""],
["5", "", "MOV AX, imm", "77h", ""],
["6", "FALL01", "VSTORE [vpn], AX", "80h", ""],
["7", "FALL02", "VLOAD DX, [vpn]", "A2h", ""],
["8", "FIN", "HLT", "", ""],
["9", "SWAP_D", "DB", "142:99", ""]
];
VolcarProgramaEnIDE(ideLines, "00", "FIFO", "SWAP", "Programa 3: Estrés de Caché L1/L2 y Page Faults con Write-Back");
}
function BtnStep() {
  LoadCPUState();
  if (CPU.isHalted || CPU.IR === 0xFF) {
    UpdateLiveBanner(" CPU DETENIDA (HLT)", "#EF9A9A", "Fin del programa. Presiona RESET o LOAD.");
    WriteLog(" CPU detenida (HLT). Presiona RESET.");
    return;
  }
  const currentPC = CPU.PC;
  Fetch();
  Decode();
  Execute();
  Store();
  const opText = DecodedInstruction.hasOperand ? ` [Op:${toHex2(DecodedInstruction.operand)}h]` : "";
  WriteLog(`[PC:${toHex2(currentPC)}h] ${DecodedInstruction.mnemonic}${opText} | AX:${toHex2(CPU.AX)} BX:${toHex2(CPU.BX)} CX:${toHex2(CPU.CX)} DX:${toHex2(CPU.DX)}`);
}

// Ejecución continua en MODO TURBO con protección anti-timeout de Google Apps Script
function BtnRun() {
  WriteLog(" Iniciando ejecución continua (RUN en Modo Turbo)...");
  PropertiesService.getDocumentProperties().setProperty("IS_RUNNING", "TRUE");
  TURBO_MODE = true;
  const startTime = Date.now();
  let safetyCounter = 0;
  try {
    while (safetyCounter < 80) {
      if (Date.now() - startTime > 180000) {
        WriteLog(" Pausa preventiva de seguridad. Presiona RUN nuevamente para continuar.");
        break;
      }
      if (PropertiesService.getDocumentProperties().getProperty("IS_RUNNING") === "FALSE") {
        UpdateLiveBanner(" EJECUCIÓN PAUSADA POR EL USUARIO", "#FFE082", null);
        WriteLog(" Ejecución pausada.");
        break;
      }
      LoadCPUState();
      if (CPU.isHalted || CPU.IR === 0xFF) {
        WriteLog(" Ejecución continua finalizada con éxito (HLT).");
        break;
      }
      BtnStep();
      SpreadsheetApp.flush();
      safetyCounter++;
    }
  } finally {
    TURBO_MODE = false;
  }
}