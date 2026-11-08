/**
 * ============================================================================
 * ARCHIVO 01: 01_Config_Y_Buses.gs
 * RESPONSABLE: DAVID (T01: Config/UI, T02: 4 Registros y ALU, T03: Buses, T04: High-Z)
 * ============================================================================
 */

var TURBO_MODE = false;

var UI_CONFIG = {
  SHEETS: {
    MAIN: "Hoja 1",
    VIRTUAL: "Memoria_Virtual_Swap",
    ISA: "ISA",
    EDITOR: "Editor"
  },
  BANNER_STATUS: "T2:AA2",
  LIVE_PATH_MONITOR: "K2:R2",
  BUSES: {
    INTERNO:     { range: "C4:G4",  label: "BUS INTERNO CPU",          baseColor: "#0D9487", activeColor: "#FFEE58" },
    DIRECCIONES: { range: "I4:M4",  label: "BUS DIRECCIONES (A0-A8)",  baseColor: "#0D9487", activeColor: "#FFA726" },
    DATOS:       { range: "O4:R4",  label: "BUS DATOS (D0-D7)",        baseColor: "#0D9487", activeColor: "#69F0AE" },
    CONTROL:     { range: "T4:AA4", label: "BUS CONTROL (R/W/CLK/IO)", baseColor: "#0D9487", activeColor: "#E040FB" }
  },
  RAM: {
    ROW_OFFSET: 6,       // Filas 6 a 21 en Hoja 1 (8 Marcos Físicos de 32 Bytes = 256 Bytes)
    COL_OFFSET: 3,       // Columnas C a R
    KBD_BASE_ADDR: 0xF0, // F0h - F7h (8 Bytes Cola FIFO Teclado en Marco 7)
    LCD_BASE_ADDR: 0xF8  // F8h - FFh (8 Bytes VRAM Pantalla LCD 8x1 en Marco 7)
  },
  VIRTUAL_SWAP: {
    ROW_OFFSET: 6,       // Filas 6 a 37 en pestaña "Memoria_Virtual_Swap"
    COL_OFFSET: 3,
    SWAP_LOG_RANGE: "T6:Y37",
    SWAP_LOG_ROW_START: 6,
    SWAP_LOG_COL_START: 20
  },
  CPU_PANEL: {
    REG_ORDER: ['PC', 'IR', 'MAR', 'MDR', 'AX', 'BX', 'CX', 'DX'],
    REG_RANGE: "U6:U13",
    REG_ROW_START: 6,
    REG_COL: 21,         // Columna U
    FLAG_ORDER: ['ZF', 'CF', 'SF'],
    FLAG_RANGE: "U15:U17",
    FLAG_ROW_START: 15,
    SPEED_CELL: "U18"
  },
  ALU_MONITOR: {
    VALUES_RANGE: "W7:AA7",
    BINARY_RANGE: "W8:AA8"
  },
  MMU_MONITOR: {
    VALUES_RANGE: "W12:AA12",
    STATUS_RANGE: "W13:AA13"
  },
  PERIPHERALS: {
    KBD_INPUT_CELL: "V19",
    KBD_STATUS_CELL: "X19",
    KBD_QUEUE_RANGE: "T20:AA20",
    LCD_DISPLAY_RANGE: "T22:AA22",
    LCD_HEX_RANGE: "T23:AA23",
    IO_HISTORY_RANGE: "K39:P42"
  },
  CONTROL_WORD: {
    ROW_START: 25,       // Filas 25 a 42 en Hoja 1 (18 señales)
    COL_STATE: 3,        // Columna C
    SIGNALS: [
      { name: 'En_PC',  role: 'Buffer Tri-Estado' },
      { name: 'Ld_MAR', role: 'Latch Carga'       },
      { name: 'Mem_R',  role: 'Bus Control'       },
      { name: 'Mem_W',  role: 'Bus Control'       },
      { name: 'Ld_MDR', role: 'Latch Carga'       },
      { name: 'En_MDR', role: 'Buffer Tri-Estado' },
      { name: 'Ld_IR',  role: 'Latch Carga'       },
      { name: 'En_ALU', role: 'Buffer Tri-Estado' },
      { name: 'Ld_AX',  role: 'Latch Carga'       },
      { name: 'En_AX',  role: 'Buffer Tri-Estado' },
      { name: 'Ld_BX',  role: 'Latch Carga'       },
      { name: 'En_BX',  role: 'Buffer Tri-Estado' },
      { name: 'Ld_CX',  role: 'Latch Carga'       },
      { name: 'En_CX',  role: 'Buffer Tri-Estado' },
      { name: 'Ld_DX',  role: 'Latch Carga'       },
      { name: 'En_DX',  role: 'Buffer Tri-Estado' },
      { name: 'En_KBD', role: 'Buffer E/S'        },
      { name: 'Ld_LCD', role: 'Latch E/S'         }
    ],
    EMITTER_SIGNALS: ['En_PC', 'En_MDR', 'En_ALU', 'En_AX', 'En_BX', 'En_CX', 'En_DX', 'En_KBD']
  },
  CACHE: {
    L1I_RANGE: "E26:P26",
    L1D_RANGE: "E29:P29",
    L2_RANGE:  "E32:P35",
    METRICS_RANGE: "E39:I41"
  },
  MMU: {
    POLICY_CELL: "V25",
    ALERT_RANGE: "W25:AA25",
    TABLE_RANGE: "T27:AA42",
    ROW_START: 27,
    COL_START: 20
  },
  LOG: {
    RANGE: "AC6:AC42",
    COL: 29,
    ROW_START: 6
  },
  EDITOR: {
    IDE_RANGE: "A4:E38",
    HEX_RANGE: "G4:J38",
    START_PC_CELL: "M3",
    POLICY_CELL: "M4",
    INIT_KBD_CELL: "M5",
    INIT_SPEED_CELL: "M6",
    ACTIVE_PROG_CELL: "M2"
  },
  COLORS: {
    CANVAS_BG: "#EEF2F6",
    HEADER_DARK: "#0F172A",
    HEADER_TEXT: "#FFFFFF",
    REG_NORMAL: "#FFFFFF",
    REG_ACTIVE: "#FEF08A",
    ALU_ACTIVE: "#93C5FD",
    READ_PULSE: "#86EFAC",
    WRITE_PULSE: "#FCA5A5",
    CODE_RAM: "#FFFFFF",
    DATA_RAM: "#F1F8E9",
    IO_KBD_RAM: "#E0F7FA",
    IO_LCD_RAM: "#DCFCE7",
    SIGNAL_ON: "#00E676",
    SIGNAL_HIZ: "#E2E8F0",
    CACHE_HIT: "#69F0AE",
    CACHE_MISS: "#FFAB40",
    MMU_OK: "#BBF7D0",
    PAGE_FAULT: "#FF1744",
    LCD_BG: "#0A1914",
    LCD_FG: "#00FF66"
  }
};

var CPU = {
  PC: 0x00, IR: 0x00, MAR: 0x00, MDR: 0x00,
  AX: 0x00, BX: 0x00, CX: 0x00, DX: 0x00,
  ZF: 0, CF: 0, SF: 0,
  isHalted: false
};

// --- UTILIDADES Y PAUSA INTELIGENTE ANTI-TIMEOUT ---
function getSheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function setMergedBox(sheet, rangeStr, text, bgColor, fontColor) {
  const r = sheet.getRange(rangeStr);
  if (!r.isPartOfMerge()) {
    r.merge();
  }
  r.getCell(1, 1).setValue(text);
  if (bgColor) r.setBackground(bgColor);
  if (fontColor) r.setFontColor(fontColor);
}

function toHex2(num) {
  return ((Number(num) || 0) & 0xFF).toString(16).padStart(2, '0').toUpperCase();
}

function toHex3(num) {
  return ((Number(num) || 0) & 0x1FF).toString(16).padStart(3, '0').toUpperCase();
}

function toBin8(num) {
  return ((Number(num) || 0) & 0xFF).toString(2).padStart(8, '0');
}

function parseHex(val) {
  if (val === null || val === undefined || val === "") return 0;
  const clean = val.toString().replace("'", "").replace("0x", "").replace(/h$/i, "").trim();
  const parsed = parseInt(clean, 16);
  return isNaN(parsed) ? 0 : parsed;
}

function getAnimDelay() {
  if (TURBO_MODE) return 0;
  const sheet = getSheet(UI_CONFIG.SHEETS.MAIN);
  const val = Number(sheet.getRange(UI_CONFIG.CPU_PANEL.SPEED_CELL).getValue());
  if (isNaN(val)) return 40;
  return Math.max(0, Math.min(val, 600));
}

function SmartWait(ms) {
  if (TURBO_MODE) return;
  const d = (ms !== undefined && ms !== null) ? ms : getAnimDelay();
  if (d <= 0) return;
  SpreadsheetApp.flush();
  Utilities.sleep(d);
}

// --- SINCRONIZACIÓN DEL BANCO DE REGISTROS Y BANDERAS ---
function LoadCPUState() {
  const sheet = getSheet(UI_CONFIG.SHEETS.MAIN);
  const regVals = sheet.getRange(UI_CONFIG.CPU_PANEL.REG_RANGE).getValues();
  UI_CONFIG.CPU_PANEL.REG_ORDER.forEach((reg, i) => {
    CPU[reg] = parseHex(regVals[i][0]) & (reg === 'PC' || reg === 'MAR' ? 0x1FF : 0xFF);
  });

  const flagVals = sheet.getRange(UI_CONFIG.CPU_PANEL.FLAG_RANGE).getValues();
  UI_CONFIG.CPU_PANEL.FLAG_ORDER.forEach((flag, i) => {
    CPU[flag] = parseInt(flagVals[i][0], 10) ? 1 : 0;
  });
}

function SaveCPUState() {
  const sheet = getSheet(UI_CONFIG.SHEETS.MAIN);
  const regData = UI_CONFIG.CPU_PANEL.REG_ORDER.map(reg => [toHex2(CPU[reg])]);
  const regRange = sheet.getRange(UI_CONFIG.CPU_PANEL.REG_RANGE);
  regRange.setNumberFormat('@');
  regRange.setValues(regData);

  const flagData = UI_CONFIG.CPU_PANEL.FLAG_ORDER.map(f => [CPU[f] ? 1 : 0]);
  sheet.getRange(UI_CONFIG.CPU_PANEL.FLAG_RANGE).setValues(flagData);
}

// --- UNIDAD ARITMÉTICO-LÓGICA (ALU DE 8 BITS) CON MONITOR EN VIVO ---
function ExecuteALU(aluOp, val1, val2, labelA, labelB) {
  const sheet = getSheet(UI_CONFIG.SHEETS.MAIN);
  let a = val1 & 0xFF;
  let b = (val2 || 0) & 0xFF;
  let res = 0;
  let carry = 0;
  const opClean = (aluOp || "NONE").toUpperCase();

  switch (opClean) {
    case "ADD": res = a + b; carry = res > 0xFF ? 1 : 0; break;
    case "SUB":
    case "CMP": res = a - b; carry = a < b ? 1 : 0; break;
    case "INC": res = a + 1; carry = res > 0xFF ? 1 : 0; b = 1; break;
    case "DEC": res = a - 1; carry = a === 0 ? 1 : 0; b = 1; break;
    case "AND": res = a & b; break;
    case "OR":  res = a | b; break;
    case "XOR": res = a ^ b; break;
    default:    res = a; break;
  }

  const final8Bit = res & 0xFF;
  CPU.ZF = (final8Bit === 0) ? 1 : 0;
  CPU.CF = carry;
  CPU.SF = (final8Bit & 0x80) !== 0 ? 1 : 0;

  const aluRange = sheet.getRange(UI_CONFIG.ALU_MONITOR.VALUES_RANGE);
  aluRange.setValues([[
    `${labelA || 'A'}: ${toHex2(a)}h (${a})`,
    opClean,
    `${labelB || 'B'}: ${toHex2(b)}h (${b})`,
    `${toHex2(final8Bit)}h (${final8Bit})`,
    `Z:${CPU.ZF} C:${CPU.CF} S:${CPU.SF}`
  ]]);

  setMergedBox(
    sheet,
    UI_CONFIG.ALU_MONITOR.BINARY_RANGE,
    `🔢 Binario 8-Bit: ${toBin8(a)} [${opClean}] ${toBin8(b)} ➔ ${toBin8(final8Bit)}b`,
    "#E3F2FD",
    "#0F172A"
  );

  if (!TURBO_MODE && getAnimDelay() > 0) {
    aluRange.setBackground(UI_CONFIG.COLORS.ALU_ACTIVE);
    SmartWait(Math.floor(getAnimDelay() * 0.6));
    aluRange.setBackground("#FFFFFF");
  }

  return final8Bit;
}

// --- GOBERNADOR DE MICRO-PALABRA (18 SEÑALES Y BUFFERS HIGH-Z) ---
function SetControlSignals(activeSignals) {
  const sheet = getSheet(UI_CONFIG.SHEETS.MAIN);
  const active = activeSignals || [];

  const activeEmitters = active.filter(s => UI_CONFIG.CONTROL_WORD.EMITTER_SIGNALS.includes(s));
  if (activeEmitters.length > 1) {
    WriteLog(`⚠️ COLISIÓN BUS PREVENIDA: ${activeEmitters.join(", ")}`);
  }

  const values = UI_CONFIG.CONTROL_WORD.SIGNALS.map(sig => active.includes(sig.name) ? ["1"] : ["Hi-Z"]);
  const colors = values.map(v => v[0] === "1" ? [UI_CONFIG.COLORS.SIGNAL_ON] : [UI_CONFIG.COLORS.SIGNAL_HIZ]);

  const range = sheet.getRange(
    UI_CONFIG.CONTROL_WORD.ROW_START,
    UI_CONFIG.CONTROL_WORD.COL_STATE,
    UI_CONFIG.CONTROL_WORD.SIGNALS.length,
    1
  );
  range.setValues(values);
  range.setBackgrounds(colors);
}

// --- ANIMACIÓN DE BUSES Y MONITOR DE RUTA EN VIVO ---
function UpdateLiveBanner(statusText, statusColor, pathText) {
  const sheet = getSheet(UI_CONFIG.SHEETS.MAIN);
  if (statusText) {
    const fg = statusColor === UI_CONFIG.COLORS.PAGE_FAULT ? "#FFFFFF" : "#0F172A";
    setMergedBox(sheet, UI_CONFIG.BANNER_STATUS, statusText, statusColor, fg);
  }
  if (pathText) {
    setMergedBox(sheet, UI_CONFIG.LIVE_PATH_MONITOR, pathText, "#FEF08A", "#0F172A");
  }
}

function AnimateBusTransfer(busKey, sourceLabel, targetLabel, hexValue, signals) {
  const sheet = getSheet(UI_CONFIG.SHEETS.MAIN);
  const busCfg = UI_CONFIG.BUSES[busKey] || UI_CONFIG.BUSES.INTERNO;

  if (signals) SetControlSignals(signals);

  const routeMsg = `⚡ ${sourceLabel} ━━[${busCfg.label}: ${hexValue}]━━► ${targetLabel}`;
  UpdateLiveBanner(null, null, routeMsg);

  if (TURBO_MODE || getAnimDelay() <= 0) return;

  setMergedBox(sheet, busCfg.range, `${busCfg.label}  ⚡ [${hexValue}] ⚡`, busCfg.activeColor, "#000000");
  SmartWait(getAnimDelay());
  setMergedBox(sheet, busCfg.range, busCfg.label, busCfg.baseColor, "#FFFFFF");
}

function PulseRegister(regName, color) {
  if (TURBO_MODE || getAnimDelay() <= 0) return;
  const sheet = getSheet(UI_CONFIG.SHEETS.MAIN);
  let row = -1;
  const rIdx = UI_CONFIG.CPU_PANEL.REG_ORDER.indexOf(regName);
  if (rIdx !== -1) {
    row = UI_CONFIG.CPU_PANEL.REG_ROW_START + rIdx;
  } else {
    const fIdx = UI_CONFIG.CPU_PANEL.FLAG_ORDER.indexOf(regName);
    if (fIdx !== -1) row = UI_CONFIG.CPU_PANEL.FLAG_ROW_START + fIdx;
  }
  if (row === -1) return;

  const cell = sheet.getRange(row, UI_CONFIG.CPU_PANEL.REG_COL);
  cell.setBackground(color || UI_CONFIG.COLORS.REG_ACTIVE);
  SmartWait(Math.floor(getAnimDelay() * 0.5));
  cell.setBackground(UI_CONFIG.COLORS.REG_NORMAL);
}

function WriteLog(message) {
  const sheet = getSheet(UI_CONFIG.SHEETS.MAIN);
  const range = sheet.getRange(UI_CONFIG.LOG.RANGE);
  const vals = range.getValues();
  let emptyIdx = vals.findIndex(r => r[0] === "" || r[0] === null);
  if (emptyIdx === -1) {
    vals.shift();
    vals.push([message]);
    range.setValues(vals);
  } else {
    sheet.getRange(UI_CONFIG.LOG.ROW_START + emptyIdx, UI_CONFIG.LOG.COL).setValue(message);
  }
}

function ClearLog() {
  getSheet(UI_CONFIG.SHEETS.MAIN).getRange(UI_CONFIG.LOG.RANGE).clearContent();
}