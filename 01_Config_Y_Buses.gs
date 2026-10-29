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