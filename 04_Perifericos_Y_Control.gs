/**
 * ============================================================================
 * ARCHIVO 04: 04_Perifericos_Y_Control.gs (DEFINITIVO Y SINCRONIZADO CON GIT)
 * RESPONSABLES: DAVID (T11-T14) & JORGE (T15-T16)
 * ============================================================================
 */

var ISA_DICTIONARY = {};
var ISA_BY_MNEMONIC = {};
var DecodedInstruction = {
  opcode: 0, mnemonic: "NOP", type: "NOP", aluOp: "NONE",
  targetReg: "NONE", sourceReg: "NONE", hasOperand: false,
  jumpCond: "NONE", operand: 0
};
var ExecutionResult = { value: null, writeToReg: null, writeToMem: null, newPC: null, writeLCD: false, outReg: null };

function SyncPeripheralsFromRAM() {
  const sheet = getSheet(UI_CONFIG.SHEETS.MAIN);
  const kbdBytes = [];
  const lcdChars = [];
  const lcdHexes = [];

  for (let i = 0; i < 8; i++) {
    const kVal = RawRAMRead(UI_CONFIG.RAM.KBD_BASE_ADDR + i);
    const kChar = (kVal >= 32 && kVal <= 126) ? String.fromCharCode(kVal) : "·";
    kbdBytes.push(`${toHex2(kVal)} (${kChar})`);

    const lVal = RawRAMRead(UI_CONFIG.RAM.LCD_BASE_ADDR + i);
    const lChar = (lVal >= 32 && lVal <= 126) ? String.fromCharCode(lVal) : " ";
    lcdChars.push(lChar);
    lcdHexes.push(`${toHex2(UI_CONFIG.RAM.LCD_BASE_ADDR + i)}:${toHex2(lVal)}h`);
  }

  sheet.getRange(UI_CONFIG.PERIPHERALS.KBD_QUEUE_RANGE).setValues([kbdBytes]);
  sheet.getRange(UI_CONFIG.PERIPHERALS.LCD_DISPLAY_RANGE).setValues([lcdChars]);
  sheet.getRange(UI_CONFIG.PERIPHERALS.LCD_HEX_RANGE).setValues([lcdHexes]);
}

function AppendIOHistory(ioType, ramPort, regName, byteValue) {
  const sheet = getSheet(UI_CONFIG.SHEETS.MAIN);
  const range = sheet.getRange(UI_CONFIG.PERIPHERALS.IO_HISTORY_RANGE);
  const rows = range.getValues();
  const stepStamp = PropertiesService.getDocumentProperties().getProperty("STEP_COUNTER") || "1";
  const asciiChar = (byteValue >= 32 && byteValue <= 126) ? `'${String.fromCharCode(byteValue)}'` : "Ctrl";
  const newEntry = [`#${stepStamp}`, ioType, ramPort, regName, `${toHex2(byteValue)}h`, asciiChar];

  let emptyIdx = rows.findIndex(r => r[0] === "" || r[0] === null);
  if (emptyIdx === -1) {
    rows.shift();
    rows.push(newEntry);
  } else {
    rows[emptyIdx] = newEntry;
  }
  range.setValues(rows);
}

function BtnEnqueueKey() {
  const sheet = getSheet(UI_CONFIG.SHEETS.MAIN);
  const rawText = (sheet.getRange(UI_CONFIG.PERIPHERALS.KBD_INPUT_CELL).getValue() || "").toString();
  if (!rawText) {
    WriteLog("⌨️ Teclado: Escribe texto en V19 antes de encolar.");
    return;
  }

  const text = rawText.substring(0, 8);
  for (let i = 0; i < 8; i++) {
    const ascii = i < text.length ? text.charCodeAt(i) & 0xFF : 0x00;
    RawRAMWrite(UI_CONFIG.RAM.KBD_BASE_ADDR + i, ascii, null);
    RawVirtualWriteByte(UI_CONFIG.RAM.KBD_BASE_ADDR + i, ascii);
  }
  PropertiesService.getDocumentProperties().setProperty("LCD_CURSOR", "0");
  sheet.getRange(UI_CONFIG.PERIPHERALS.KBD_STATUS_CELL).setValue(`Cola F0h-F7h: ${text.length}/8 bytes`);
  SyncPeripheralsFromRAM();
  AppendIOHistory("ENCOLAR KBD", "F0h-F7h", "FIFO", text.charCodeAt(0) || 0);
  WriteLog(`⌨️ ENTRADA TECLADO: "${text}" encolado en RAM [F0h-F7h].`);
}

function ReadFromKeyboardFIFO(targetReg) {
  const sheet = getSheet(UI_CONFIG.SHEETS.MAIN);
  const firstByte = RawRAMRead(UI_CONFIG.RAM.KBD_BASE_ADDR);
  const charView = (firstByte >= 32 && firstByte <= 126) ? String.fromCharCode(firstByte) : "?";

  for (let i = 0; i < 7; i++) {
    const nextByte = RawRAMRead(UI_CONFIG.RAM.KBD_BASE_ADDR + i + 1);
    RawRAMWrite(UI_CONFIG.RAM.KBD_BASE_ADDR + i, nextByte, null);
  }
  RawRAMWrite(UI_CONFIG.RAM.KBD_BASE_ADDR + 7, 0x00, null);
  HighlightRAMCell(UI_CONFIG.RAM.KBD_BASE_ADDR, UI_CONFIG.COLORS.READ_PULSE);
  SyncPeripheralsFromRAM();

  sheet.getRange(UI_CONFIG.PERIPHERALS.KBD_STATUS_CELL).setValue(`Último IN: ${toHex2(firstByte)}h ('${charView}')`);
  AppendIOHistory("IN (Lectura)", "F0h (KBD)", targetReg, firstByte);
  WriteLog(`⌨️ IN ${targetReg}, [KBD]: Leído ${toHex2(firstByte)}h ('${charView}') desde F0h (En_KBD=1).`);
  return firstByte;
}

function WriteToLCDDisplay(byteValue, sourceReg) {
  const sheet = getSheet(UI_CONFIG.SHEETS.MAIN);
  let cursor = parseInt(PropertiesService.getDocumentProperties().getProperty("LCD_CURSOR") || "0", 10);
  if (cursor < 0 || cursor >= 8) cursor = 0;

  const vramAddr = UI_CONFIG.RAM.LCD_BASE_ADDR + cursor;
  const charView = (byteValue >= 32 && byteValue <= 126) ? String.fromCharCode(byteValue) : " ";

  RawRAMWrite(vramAddr, byteValue & 0xFF, UI_CONFIG.COLORS.WRITE_PULSE);
  RawVirtualWriteByte(vramAddr, byteValue & 0xFF);
  SyncPeripheralsFromRAM();

  if (!TURBO_MODE && getAnimDelay() > 0) {
    const lcdCell = sheet.getRange(22, 20 + cursor);
    lcdCell.setBackground("#004D40");
    SmartWait(Math.floor(getAnimDelay() * 0.6));
    lcdCell.setBackground(UI_CONFIG.COLORS.LCD_BG);
  }

  sheet.getRange(UI_CONFIG.PERIPHERALS.KBD_STATUS_CELL).setValue(`Último OUT: ${toHex2(byteValue)}h ('${charView}') ➔ [${toHex2(vramAddr)}h]`);
  AppendIOHistory("OUT (Display)", `${toHex2(vramAddr)}h (VRAM)`, sourceReg || "CPU", byteValue);
  WriteLog(`📟 OUT [LCD], ${sourceReg || 'REG'}: Impreso '${charView}' (${toHex2(byteValue)}h) en [${toHex2(vramAddr)}h].`);

  cursor = (cursor + 1) % 8;
  PropertiesService.getDocumentProperties().setProperty("LCD_CURSOR", String(cursor));
}

function NormalizeMnemonicKey(str) {
  return (str || "").toString().toUpperCase().replace(/\s+/g, " ").replace(/\s*,\s*/g, ", ").trim();
}

function LoadISAConfig() {
  const isaSheet = getSheet(UI_CONFIG.SHEETS.ISA);
  if (!isaSheet) return;
  const data = isaSheet.getDataRange().getValues();
  ISA_DICTIONARY = {};
  ISA_BY_MNEMONIC = {};

  for (let i = 1; i < data.length; i++) {
    const opHex = data[i][0];
    if (opHex === "" || opHex === null || opHex === undefined) continue;
    const opcodeNum = parseHex(opHex);
    const mnemClean = (data[i][1] || "NOP").toString().trim();
    const spec = {
      opcode:     opcodeNum,
      opcodeHex:  toHex2(opcodeNum),
      mnemonic:   mnemClean,
      type:       (data[i][2] || "NOP").toString().trim().toUpperCase(),
      aluOp:      (data[i][3] || "NONE").toString().trim().toUpperCase(),
      targetReg:  (data[i][4] || "NONE").toString().trim().toUpperCase(),
      sourceReg:  (data[i][5] || "NONE").toString().trim().toUpperCase(),
      hasOperand: data[i][6] === true || (data[i][6] || "").toString().trim().toUpperCase() === "TRUE",
      jumpCond:   (data[i][7] || "NONE").toString().trim().toUpperCase()
    };
    ISA_DICTIONARY[opcodeNum] = spec;
    ISA_BY_MNEMONIC[NormalizeMnemonicKey(mnemClean)] = spec;

    const shortKey = NormalizeMnemonicKey(
      mnemClean.replace(/,\s*imm$/i, "").replace(/\s+addr$/i, "").replace(/,\s*\[mem\]$/i, "").replace(/\[mem\],\s*/i, "")
    );
    if (!ISA_BY_MNEMONIC[shortKey]) {
      ISA_BY_MNEMONIC[shortKey] = spec;
    }
  }
}

function MatchISASpecFromIDELine(rawInst, rawOperand) {
  let inst = (rawInst || "").toString().split(";")[0].trim();
  let opnd = (rawOperand || "").toString().split(";")[0].trim();
  if (!inst) return null;

  if (inst.toUpperCase() === "DB" || inst.toUpperCase() === "DATA") {
    return { isDataDirective: true, operandRaw: opnd };
  }

  const normFull = NormalizeMnemonicKey(inst);
  if (ISA_BY_MNEMONIC[normFull]) {
    return { spec: ISA_BY_MNEMONIC[normFull], operandRaw: opnd };
  }

  if (!opnd) {
    const parts = inst.split(",");
    if (parts.length === 2) {
      const left = parts[0].trim();
      const right = parts[1].trim();
      const tryImm = NormalizeMnemonicKey(`${left}, imm`);
      const tryMemLoad = NormalizeMnemonicKey(`${left}, [mem]`);
      const tryMemStore = NormalizeMnemonicKey(`STORE [mem], ${right}`);
      if (ISA_BY_MNEMONIC[tryImm]) return { spec: ISA_BY_MNEMONIC[tryImm], operandRaw: right };
      if (ISA_BY_MNEMONIC[tryMemLoad]) return { spec: ISA_BY_MNEMONIC[tryMemLoad], operandRaw: right };
      if (left.toUpperCase().startsWith("STORE") && ISA_BY_MNEMONIC[tryMemStore]) {
        return { spec: ISA_BY_MNEMONIC[tryMemStore], operandRaw: left.replace(/STORE/i, "").trim() };
      }
    } else {
      const words = inst.trim().split(/\s+/);
      if (words.length === 2) {
        const tryJmp = NormalizeMnemonicKey(`${words[0]} addr`);
        if (ISA_BY_MNEMONIC[tryJmp]) return { spec: ISA_BY_MNEMONIC[tryJmp], operandRaw: words[1] };
      }
    }
  }

  return null;
}

function BtnEnsamblarIDE() {
  LoadISAConfig();
  const editorSheet = getSheet(UI_CONFIG.SHEETS.EDITOR);
  if (!editorSheet) return false;

  const ideRange = editorSheet.getRange(UI_CONFIG.EDITOR.IDE_RANGE);
  const ideRows = ideRange.getValues();

  const startPC = parseHex(editorSheet.getRange(UI_CONFIG.EDITOR.START_PC_CELL).getValue()) & 0x1FF;
  let currentAddr = startPC;
  const symbolTable = {};
  const parsedLines = [];
  let syntaxErrors = 0;

  for (let i = 0; i < ideRows.length; i++) {
    const rawLabel = (ideRows[i][1] || "").toString().replace(":", "").trim().toUpperCase();
    const rawInst  = (ideRows[i][2] || "").toString().trim();
    const rawOpnd  = (ideRows[i][3] || "").toString().trim();

    if (rawLabel) {
      symbolTable[rawLabel] = currentAddr;
    }

    if (!rawInst) {
      parsedLines.push({ empty: true, label: rawLabel, addr: currentAddr });
      continue;
    }

    const matched = MatchISASpecFromIDELine(rawInst, rawOpnd);
    if (!matched) {
      parsedLines.push({ error: `❌ ERROR SINTAXIS: '${rawInst}' no existe en la hoja ISA` });
      syntaxErrors++;
      continue;
    }

    if (matched.isDataDirective) {
      parsedLines.push({ isDataDirective: true, operandRaw: matched.operandRaw });
      continue;
    }

    const spec = matched.spec;
    const lineAddr = currentAddr;
    currentAddr += spec.hasOperand ? 2 : 1;
    parsedLines.push({
      spec: spec,
      addr: lineAddr,
      operandRaw: matched.operandRaw,
      label: rawLabel
    });
  }

  const diagValues = [];
  const diagColors = [];
  const machineRows = [];

  for (let i = 0; i < parsedLines.length; i++) {
    const item = parsedLines[i];
    if (item.empty) {
      diagValues.push([item.label ? `🏷️ Etiqueta ${item.label} = ${toHex2(item.addr)}h` : ""]);
      diagColors.push([item.label ? "#E0F2FE" : "#FFFFFF"]);
      continue;
    }

    if (item.error) {
      diagValues.push([item.error]);
      diagColors.push(["#FECACA"]);
      continue;
    }

    if (item.isDataDirective) {
      const parts = (item.operandRaw || "").replace(/\[|\]/g, "").split(":");
      if (parts.length !== 2) {
        diagValues.push(["❌ ERROR DB: Usa formato DirHex:ValorHex (ej. 142:99)"]);
        diagColors.push(["#FECACA"]);
        syntaxErrors++;
      } else {
        const dAddr = parseHex(parts[0]) & 0x1FF;
        const dVal  = parseHex(parts[1]) & 0xFF;
        machineRows.push([
          toHex3(dAddr),
          toHex2(dVal),
          `Dato precargado en Página Virtual ${toHex2(Math.floor(dAddr / 32))}h`,
          `✅ OK: Dato Memoria/Swap`
        ]);
        diagValues.push([`✅ DATO [${toHex3(dAddr)}h] ➔ ${toHex2(dVal)}h (Pág ${toHex2(Math.floor(dAddr / 32))}h)`]);
        diagColors.push(["#DBEAFE"]);
      }
      continue;
    }

    const spec = item.spec;
    const labelPrefix = item.label ? `${item.label}: ` : "";

    if (!spec.hasOperand) {
      machineRows.push([
        toHex2(item.addr),
        spec.opcodeHex,
        `${labelPrefix}${spec.mnemonic}`,
        `✅ SINTAXIS OK (${spec.type})`
      ]);
      diagValues.push([`✅ [${toHex2(item.addr)}h] ➔ ${spec.opcodeHex} (1 Byte)`]);
      diagColors.push(["#DCFCE7"]);
    } else {
      const cleanOp = (item.operandRaw || "").replace(/\[|\]/g, "").trim().toUpperCase();
      let resolvedByte = null;
      let resolvedNote = "";

      if (!cleanOp) {
        diagValues.push([`❌ ERROR: '${spec.mnemonic}' requiere un operando o etiqueta en Col D`]);
        diagColors.push(["#FECACA"]);
        syntaxErrors++;
        continue;
      }

      if (symbolTable[cleanOp] !== undefined) {
        resolvedByte = symbolTable[cleanOp] & 0xFF;
        resolvedNote = ` (Etiqueta ${cleanOp}=${toHex2(resolvedByte)}h)`;
      } else if (/^[0-9A-FA-F]{1,3}H?$/.test(cleanOp)) {
        resolvedByte = parseHex(cleanOp) & 0xFF;
      } else {
        diagValues.push([`❌ ERROR: Operando o Etiqueta '${cleanOp}' no definido`]);
        diagColors.push(["#FECACA"]);
        syntaxErrors++;
        continue;
      }

      const opHex = toHex2(resolvedByte);
      machineRows.push([
        toHex2(item.addr),
        spec.opcodeHex,
        `${labelPrefix}${spec.mnemonic} ➔ ${cleanOp}${resolvedNote}`,
        `✅ SINTAXIS OK (${spec.type})`
      ]);
      machineRows.push([
        toHex2(item.addr + 1),
        opHex,
        `↳ Operando de ${spec.mnemonic}${resolvedNote}`,
        `✅ OK: Operando 0x${opHex}`
      ]);

      diagValues.push([`✅ [${toHex2(item.addr)}h] ➔ ${spec.opcodeHex} ${opHex}${resolvedNote}`]);
      diagColors.push(["#DCFCE7"]);
    }
  }

  const diagRange = editorSheet.getRange(4, 5, ideRows.length, 1);
  diagRange.setValues(diagValues);
  diagRange.setBackgrounds(diagColors);
  diagRange.setFontWeight("bold");

  if (syntaxErrors > 0) {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      `Se encontraron ${syntaxErrors} errores de sintaxis en el IDE Ensamblador (Columna E).`,
      "❌ Error de Ensamblado", 6
    );
    return false;
  }

  const hexTableRange = editorSheet.getRange(UI_CONFIG.EDITOR.HEX_RANGE);
  hexTableRange.clearContent().setBackground("#FFFFFF");

  if (machineRows.length > 0) {
    const writeRows = machineRows.slice(0, 35);
    const targetRange = editorSheet.getRange(4, 7, writeRows.length, 4);
    targetRange.setNumberFormat('@');
    targetRange.setValues(writeRows);
    editorSheet.getRange(4, 10, writeRows.length, 1).setBackground("#DCFCE7").setFontWeight("bold");
  }

  return true;
}

function BtnVerificarSintaxisEditor() {
  LoadISAConfig();
  const editorSheet = getSheet(UI_CONFIG.SHEETS.EDITOR);
  if (!editorSheet) return false;

  const hexRange = editorSheet.getRange(UI_CONFIG.EDITOR.HEX_RANGE);
  const rows = hexRange.getValues();
  const statusValues = [];
  const statusColors = [];

  let errores = 0;
  let expectOperandFromOpcode = null;

  for (let i = 0; i < rows.length; i++) {
    const addrRaw = (rows[i][0] || "").toString().trim();
    const byteRaw = (rows[i][1] || "").toString().trim();

    if (addrRaw === "" && byteRaw === "") {
      statusValues.push([""]);
      statusColors.push(["#FFFFFF"]);
      continue;
    }

    const isValidAddr = /^[0-9A-Fa-f]{1,3}h?$/.test(addrRaw) && parseHex(addrRaw) <= 0x1FF;
    const isValidByte = /^[0-9A-Fa-f]{1,2}h?$/.test(byteRaw) && parseHex(byteRaw) <= 0xFF;

    if (!isValidAddr || !isValidByte) {
      errores++;
      statusValues.push(["❌ ERROR: Hex inválido"]);
      statusColors.push(["#FECACA"]);
      expectOperandFromOpcode = null;
      continue;
    }

    const byteVal = parseHex(byteRaw);
    const vAddr = parseHex(addrRaw);

    if (expectOperandFromOpcode !== null) {
      statusValues.push([`✅ OK: Operando 0x${toHex2(byteVal)}`]);
      statusColors.push(["#ECFDF5"]);
      expectOperandFromOpcode = null;
      continue;
    }

    if (vAddr >= 0x40) {
      statusValues.push([`✅ OK: Dato Pág ${toHex2(Math.floor(vAddr / 32))}h`]);
      statusColors.push(["#DBEAFE"]);
      continue;
    }

    const spec = ISA_DICTIONARY[byteVal];
    if (!spec) {
      errores++;
      statusValues.push([`❌ Opcode 0x${toHex2(byteVal)} no existe en ISA`]);
      statusColors.push(["#FECACA"]);
      expectOperandFromOpcode = null;
    } else {
      statusValues.push([`✅ SINTAXIS OK: ${spec.mnemonic}`]);
      statusColors.push(["#DCFCE7"]);
      expectOperandFromOpcode = spec.hasOperand ? spec.mnemonic : null;
    }
  }

  const statusColRange = editorSheet.getRange(4, 10, rows.length, 1);
  statusColRange.setValues(statusValues);
  statusColRange.setBackgrounds(statusColors);
  statusColRange.setFontWeight("bold");

  return errores === 0;
}

function BtnAssembleAndLoad() {
  if (!BtnEnsamblarIDE()) {
    UpdateLiveBanner("❌ ERROR DE SINTAXIS EN IDE ENSAMBLADOR", "#FF1744", "⚡ Revisa la Columna E en la pestaña 'Editor'.");
    return;
  }
  BtnLoad();
}

// --- CICLO DE INSTRUCCIÓN (FETCH, DECODE, EXECUTE, STORE) ---
function Fetch() {
  UpdateLiveBanner("🟢 FASE 1: FETCH (Búsqueda de Instrucción)", "#C8E6C9", null);

  AnimateBusTransfer("INTERNO", `PC (${toHex2(CPU.PC)}h)`, "MAR", toHex2(CPU.PC), ["En_PC", "Ld_MAR"]);
  CPU.MAR = CPU.PC & 0x1FF;
  PulseRegister("MAR", UI_CONFIG.COLORS.READ_PULSE);
  SaveCPUState();

  AnimateBusTransfer("DIRECCIONES", `MAR (${toHex2(CPU.MAR)}h)`, "Caché L1I / MMU", toHex2(CPU.MAR), ["Mem_R", "Ld_MDR"]);
  const fetchedByte = HierarchicalMemoryRead(CPU.MAR, true);
  AnimateBusTransfer("DATOS", "Jerarquía Memoria", "MDR", toHex2(fetchedByte), ["Mem_R", "Ld_MDR"]);
  CPU.MDR = fetchedByte & 0xFF;
  PulseRegister("MDR", UI_CONFIG.COLORS.READ_PULSE);
  SaveCPUState();

  AnimateBusTransfer("INTERNO", `MDR (${toHex2(CPU.MDR)}h)`, "IR", toHex2(CPU.MDR), ["En_MDR", "Ld_IR"]);
  CPU.IR = CPU.MDR;
  CPU.PC = (CPU.PC + 1) & 0x1FF;
  PulseRegister("IR", UI_CONFIG.COLORS.READ_PULSE);
  SetControlSignals([]);
  SaveCPUState();
}

function FetchOperand() {
  AnimateBusTransfer("INTERNO", `PC (${toHex2(CPU.PC)}h)`, "MAR (Operando)", toHex2(CPU.PC), ["En_PC", "Ld_MAR"]);
  CPU.MAR = CPU.PC & 0x1FF;
  SaveCPUState();

  AnimateBusTransfer("DIRECCIONES", `MAR (${toHex2(CPU.MAR)}h)`, "Caché L1I / MMU", toHex2(CPU.MAR), ["Mem_R", "Ld_MDR"]);
  const operandByte = HierarchicalMemoryRead(CPU.MAR, true);
  AnimateBusTransfer("DATOS", "Jerarquía Memoria", "MDR (Operando)", toHex2(operandByte), ["Mem_R", "Ld_MDR"]);
  CPU.MDR = operandByte & 0xFF;
  CPU.PC = (CPU.PC + 1) & 0x1FF;
  PulseRegister("MDR", UI_CONFIG.COLORS.READ_PULSE);
  SetControlSignals([]);
  SaveCPUState();
  return CPU.MDR;
}

function Decode() {
  UpdateLiveBanner("🟡 FASE 2: DECODE (Decodificación en Tabla ISA)", "#FFF59D", null);
  if (Object.keys(ISA_DICTIONARY).length === 0) LoadISAConfig();

  const op = CPU.IR & 0xFF;
  const spec = ISA_DICTIONARY[op];

  if (!spec) {
    DecodedInstruction = {
      opcode: op, mnemonic: `UNKNOWN (0x${toHex2(op)})`, type: "NOP",
      aluOp: "NONE", targetReg: "NONE", sourceReg: "NONE",
      hasOperand: false, jumpCond: "NONE", operand: 0
    };
    WriteLog(`⚠️ Opcode 0x${toHex2(op)} no existe en la hoja 'ISA'.`);
    return;
  }

  DecodedInstruction = {
    opcode: op,
    mnemonic: spec.mnemonic,
    type: spec.type,
    aluOp: spec.aluOp,
    targetReg: spec.targetReg,
    sourceReg: spec.sourceReg,
    hasOperand: spec.hasOperand,
    jumpCond: spec.jumpCond,
    operand: spec.hasOperand ? FetchOperand() : 0
  };
}

function Execute() {
  UpdateLiveBanner(`🔵 FASE 3: EXECUTE (${DecodedInstruction.mnemonic})`, "#90CAF9", null);
  ExecutionResult = { value: null, writeToReg: null, writeToMem: null, newPC: null, writeLCD: false, outReg: null };

  const tgt = DecodedInstruction.targetReg;
  const src = DecodedInstruction.sourceReg;
  const imm = DecodedInstruction.operand;

  switch (DecodedInstruction.type) {
    case "MOV_IMM":
      ExecutionResult.writeToReg = tgt;
      ExecutionResult.value = imm;
      break;

    case "MOV_REG":
      AnimateBusTransfer("INTERNO", `${src} (${toHex2(CPU[src])}h)`, tgt, toHex2(CPU[src]), [`En_${src}`, `Ld_${tgt}`]);
      ExecutionResult.writeToReg = tgt;
      ExecutionResult.value = CPU[src] & 0xFF;
      break;

    case "LOAD":
    case "VLOAD": {
      const vAddr = DecodedInstruction.type === "VLOAD" ? ((imm & 0xF0) << 1) | (imm & 0x0F) : imm;
      CPU.MAR = vAddr & 0x1FF;
      SetControlSignals(["Ld_MAR"]);
      PulseRegister("MAR", UI_CONFIG.COLORS.READ_PULSE);
      SaveCPUState();

      AnimateBusTransfer("DIRECCIONES", `MAR (${toHex3(CPU.MAR)}h)`, "Caché L1D / MMU", toHex2(CPU.MAR & 0xFF), ["Mem_R", "Ld_MDR"]);
      const dataByte = HierarchicalMemoryRead(CPU.MAR, false);
      AnimateBusTransfer("DATOS", "Caché L1D / RAM", "MDR", toHex2(dataByte), ["Mem_R", "Ld_MDR"]);
      CPU.MDR = dataByte & 0xFF;
      PulseRegister("MDR", UI_CONFIG.COLORS.READ_PULSE);
      SaveCPUState();

      ExecutionResult.writeToReg = tgt;
      ExecutionResult.value = CPU.MDR;
      break;
    }

    case "STORE":
    case "VSTORE": {
      const vAddr = DecodedInstruction.type === "VSTORE" ? ((imm & 0xF0) << 1) | (imm & 0x0F) : imm;
      ExecutionResult.writeToMem = vAddr & 0x1FF;
      ExecutionResult.value = CPU[src !== "NONE" ? src : tgt] & 0xFF;
      break;
    }

    case "ALU_IMM":
    case "ALU_REG":
    case "ALU_UNARY":
    case "CMP_IMM":
    case "CMP_REG": {
      const isRegOp = (DecodedInstruction.type === "ALU_REG" || DecodedInstruction.type === "CMP_REG");
      const val1 = CPU[tgt] & 0xFF;
      const val2 = isRegOp ? (CPU[src] & 0xFF) : imm;
      const labelB = isRegOp ? src : "IMM";

      AnimateBusTransfer("INTERNO", `${tgt} (${toHex2(val1)}h)`, `ALU [${DecodedInstruction.aluOp}]`, toHex2(val1), ["En_ALU"]);
      PulseRegister(tgt, UI_CONFIG.COLORS.ALU_ACTIVE);

      const aluOut = ExecuteALU(DecodedInstruction.aluOp, val1, val2, tgt, labelB);
      PulseRegister("ZF", UI_CONFIG.COLORS.ALU_ACTIVE);

      if (!DecodedInstruction.type.startsWith("CMP")) {
        ExecutionResult.writeToReg = tgt;
        ExecutionResult.value = aluOut;
      }
      break;
    }

    case "JMP":
    case "JCC": {
      SetControlSignals(["En_ALU"]);
      PulseRegister("ZF", UI_CONFIG.COLORS.ALU_ACTIVE);
      let takeJump = false;
      switch (DecodedInstruction.jumpCond) {
        case "ALWAYS": takeJump = true; break;
        case "ZF=1":   takeJump = (CPU.ZF === 1); break;
        case "ZF=0":   takeJump = (CPU.ZF === 0); break;
        case "CF=1":   takeJump = (CPU.CF === 1); break;
        case "SF=1":   takeJump = (CPU.SF === 1); break;
      }
      if (takeJump) ExecutionResult.newPC = imm & 0x1FF;
      break;
    }

    case "IN_KBD": {
      AnimateBusTransfer("CONTROL", "Unidad de Control", "Teclado FIFO [En_KBD=1]", "IN", ["En_KBD", `Ld_${tgt}`]);
      const kbdByte = ReadFromKeyboardFIFO(tgt);
      AnimateBusTransfer("DATOS", "Cola Teclado [F0h]", tgt, toHex2(kbdByte), ["En_KBD", `Ld_${tgt}`]);
      ExecutionResult.writeToReg = tgt;
      ExecutionResult.value = kbdByte;
      break;
    }

    case "OUT_LCD": {
      const outReg = src !== "NONE" ? src : tgt;
      const outVal = CPU[outReg] & 0xFF;
      AnimateBusTransfer("DATOS", `${outReg} (${toHex2(outVal)}h)`, "Pantalla LCD 8x1 [Ld_LCD=1]", toHex2(outVal), [`En_${outReg}`, "Ld_LCD"]);
      ExecutionResult.value = outVal;
      ExecutionResult.writeLCD = true;
      ExecutionResult.outReg = outReg;
      break;
    }

    case "HLT":
    case "SYS":
      CPU.isHalted = true;
      UpdateLiveBanner("🛑 SISTEMA DETENIDO (Instrucción HLT)", "#EF9A9A", "⚡ CPU en estado HALT. Presiona RESET o LOAD.");
      break;
  }
}

function Store() {
  if (CPU.isHalted) {
    SetControlSignals([]);
    SaveCPUState();
    return;
  }
  UpdateLiveBanner("🟣 FASE 4: STORE (Escritura de Resultados)", "#E1BEE7", null);

  if (ExecutionResult.writeToReg && ExecutionResult.writeToReg !== "NONE") {
    const r = ExecutionResult.writeToReg;
    AnimateBusTransfer("INTERNO", "ALU / MDR", r, toHex2(ExecutionResult.value), [`Ld_${r}`]);
    CPU[r] = ExecutionResult.value & 0xFF;
    PulseRegister(r, UI_CONFIG.COLORS.ALU_ACTIVE);
  }

  if (ExecutionResult.writeToMem !== null) {
    CPU.MAR = ExecutionResult.writeToMem & 0x1FF;
    CPU.MDR = ExecutionResult.value & 0xFF;
    SaveCPUState();

    AnimateBusTransfer("DIRECCIONES", `MAR (${toHex3(CPU.MAR)}h)`, "MMU / RAM", toHex2(CPU.MAR & 0xFF), ["En_MDR", "Mem_W"]);
    AnimateBusTransfer("DATOS", `MDR (${toHex2(CPU.MDR)}h)`, `Memoria [${toHex3(CPU.MAR)}h]`, toHex2(CPU.MDR), ["En_MDR", "Mem_W"]);
    HierarchicalMemoryWrite(CPU.MAR, CPU.MDR);
  }

  if (ExecutionResult.writeLCD) {
    SetControlSignals(["Ld_LCD"]);
    WriteToLCDDisplay(ExecutionResult.value, ExecutionResult.outReg);
  }

  if (ExecutionResult.newPC !== null) {
    AnimateBusTransfer("INTERNO", "Unidad de Saltos", "PC", toHex2(ExecutionResult.newPC), ["En_ALU"]);
    CPU.PC = ExecutionResult.newPC & 0x1FF;
    PulseRegister("PC", UI_CONFIG.COLORS.ALU_ACTIVE);
  }

  SetControlSignals([]);
  SaveCPUState();
}

// --- BOTONES DE CONTROL DEL SIMULADOR (RESET, LOAD, STEP, RUN TURBO, PAUSE) ---
function BtnReset() {
  LoadISAConfig();
  const sheet = getSheet(UI_CONFIG.SHEETS.MAIN);
  const vSheet = getSheet(UI_CONFIG.SHEETS.VIRTUAL);
  const editorSheet = getSheet(UI_CONFIG.SHEETS.EDITOR);

  const ramRange = sheet.getRange(UI_CONFIG.RAM.ROW_OFFSET, UI_CONFIG.RAM.COL_OFFSET, 16, 16);
  ramRange.setNumberFormat('@');
  ramRange.setValues(Array.from({ length: 16 }, () => Array(16).fill("00")));
  sheet.getRange(UI_CONFIG.RAM.ROW_OFFSET, UI_CONFIG.RAM.COL_OFFSET, 8, 16).setBackground(UI_CONFIG.COLORS.CODE_RAM);
  sheet.getRange(UI_CONFIG.RAM.ROW_OFFSET + 8, UI_CONFIG.RAM.COL_OFFSET, 7, 16).setBackground(UI_CONFIG.COLORS.DATA_RAM);
  sheet.getRange(21, 3, 1, 8).setBackground(UI_CONFIG.COLORS.IO_KBD_RAM);
  sheet.getRange(21, 11, 1, 8).setBackground(UI_CONFIG.COLORS.IO_LCD_RAM);

  if (vSheet) {
    const vRange = vSheet.getRange(UI_CONFIG.VIRTUAL_SWAP.ROW_OFFSET, UI_CONFIG.VIRTUAL_SWAP.COL_OFFSET, 32, 16);
    vRange.setNumberFormat('@');
    vRange.setValues(Array.from({ length: 32 }, () => Array(16).fill("00")));
    vSheet.getRange(6, 3, 14, 16).setBackground("#FFFFFF");
    vSheet.getRange(20, 3, 18, 16).setBackground("#FFFDF7");
    vSheet.getRange(UI_CONFIG.VIRTUAL_SWAP.SWAP_LOG_RANGE).clearContent();
  }

  const emptyL1 = [[0, "00", 0, "00", "00", "00", "00", "00", "00", "00", "00", "VACÍO"]];
  sheet.getRange(UI_CONFIG.CACHE.L1I_RANGE).setNumberFormat('@').setValues(emptyL1).setBackground("#FFFFFF");
  sheet.getRange(UI_CONFIG.CACHE.L1D_RANGE).setNumberFormat('@').setValues(emptyL1).setBackground("#FFFFFF");

  const emptyL2 = [
    ["L2-0", 0, "00", 0, "00", "00", "00", "00", "00", "00", "00", "00"],
    ["L2-1", 0, "00", 0, "00", "00", "00", "00", "00", "00", "00", "00"],
    ["L2-2", 0, "00", 0, "00", "00", "00", "00", "00", "00", "00", "00"],
    ["L2-3", 0, "00", 0, "00", "00", "00", "00", "00", "00", "00", "00"]
  ];
  sheet.getRange(UI_CONFIG.CACHE.L2_RANGE).setNumberFormat('@').setValues(emptyL2).setBackground("#FFFFFF");

  const emptyMetrics = [
    ["L1I (Inst)", 0, 0, 0, "0.0%"],
    ["L1D (Datos)", 0, 0, 0, "0.0%"],
    ["L2 (Unif)", 0, 0, 0, "0.0%"]
  ];
  sheet.getRange(UI_CONFIG.CACHE.METRICS_RANGE).setValues(emptyMetrics);
  sheet.getRange(UI_CONFIG.PERIPHERALS.IO_HISTORY_RANGE).clearContent();

  // Inicializar Tabla MMU (Marco 2 con Orden=1 para ser la primera víctima con Dirty=1 en Programa 3)
  const fifoOrderInit = [9, 2, 1, 3, 4, 5, 6];
  const mmuInit = [];
  for (let vpn = 0; vpn < 16; vpn++) {
    const startV = toHex3(vpn * 32) + "h-" + toHex3(vpn * 32 + 31) + "h";
    if (vpn < 7) {
      mmuInit.push([toHex2(vpn) + "h", startV, 1, vpn, 0, 0, fifoOrderInit[vpn], `RAM (Marco ${vpn})`]);
    } else if (vpn === 7) {
      mmuInit.push(["07h", startV, 1, 7, 0, 1, 999, "Marco 7 (E/S)"]);
    } else {
      mmuInit.push([toHex2(vpn) + "h", startV, 0, "-", 0, 0, 0, "En Disco (Swap)"]);
    }
  }
  sheet.getRange(UI_CONFIG.MMU.TABLE_RANGE).setValues(mmuInit).setBackground("#FFFFFF").setFontColor("#000000");
  setMergedBox(sheet, UI_CONFIG.MMU.ALERT_RANGE, "🟢 MMU LISTA (Sin Fallos)", UI_CONFIG.COLORS.MMU_OK, "#0F172A");

  sheet.getRange(UI_CONFIG.ALU_MONITOR.VALUES_RANGE).setValues([["A: 00h (0)", "NOP", "B: 00h (0)", "00h (0)", "Z:0 C:0 S:0"]]).setBackground("#FFFFFF");
  setMergedBox(sheet, UI_CONFIG.ALU_MONITOR.BINARY_RANGE, "🔢 Binario 8-Bit: 00000000b", "#EFF6FF", "#0F172A");
  sheet.getRange(UI_CONFIG.MMU_MONITOR.VALUES_RANGE).setValues([["000h", "VPN 00h", "+00h", "Marco 0", "00h"]]);
  setMergedBox(sheet, UI_CONFIG.MMU_MONITOR.STATUS_RANGE, "🧭 Esperando traducción de dirección...", "#F0FDFA", "#0F172A");

  let initialPC = 0x00;
  if (editorSheet) {
    initialPC = parseHex(editorSheet.getRange(UI_CONFIG.EDITOR.START_PC_CELL).getValue()) & 0xFF;
    const edPolicy = (editorSheet.getRange(UI_CONFIG.EDITOR.POLICY_CELL).getValue() || "FIFO").toString().toUpperCase();
    const edSpeed = Number(editorSheet.getRange(UI_CONFIG.EDITOR.INIT_SPEED_CELL).getValue()) || 40;
    sheet.getRange(UI_CONFIG.MMU.POLICY_CELL).setValue(edPolicy);
    sheet.getRange(UI_CONFIG.CPU_PANEL.SPEED_CELL).setValue(edSpeed);
  }

  CPU = {
    PC: initialPC, IR: 0, MAR: 0, MDR: 0,
    AX: 0, BX: 0, CX: 0, DX: 0,
    ZF: 0, CF: 0, SF: 0, isHalted: false
  };
  SaveCPUState();
  SetControlSignals([]);
  SyncPeripheralsFromRAM();
  ClearLog();

  PropertiesService.getDocumentProperties().setProperty("IS_RUNNING", "FALSE");
  PropertiesService.getDocumentProperties().setProperty("STEP_COUNTER", "10");
  PropertiesService.getDocumentProperties().setProperty("LCD_CURSOR", "0");

  UpdateLiveBanner("🟢 SISTEMA REINICIADO Y LISTO", UI_CONFIG.COLORS.MMU_OK, `⚡ Punto de entrada PC = ${toHex2(initialPC)}h | Esperando instrucción...`);
  WriteLog(`🔄 RESET completado. PC inicial = 0x${toHex2(initialPC)}.`);
}

function BtnLoad() {
  if (!BtnVerificarSintaxisEditor()) {
    UpdateLiveBanner("❌ CARGA CANCELADA POR ERROR DE SINTAXIS", "#FF1744", "⚡ Revisa la Columna J en la pestaña 'Editor'.");
    return;
  }

  BtnReset();
  const mainSheet = getSheet(UI_CONFIG.SHEETS.MAIN);
  const editorSheet = getSheet(UI_CONFIG.SHEETS.EDITOR);
  if (!editorSheet) return;

  const initKbd = (editorSheet.getRange(UI_CONFIG.EDITOR.INIT_KBD_CELL).getValue() || "").toString().trim();
  if (initKbd.length > 0) {
    mainSheet.getRange(UI_CONFIG.PERIPHERALS.KBD_INPUT_CELL).setValue(initKbd);
    BtnEnqueueKey();
  }

  const data = editorSheet.getRange(UI_CONFIG.EDITOR.HEX_RANGE).getValues();
  let bytesCargados = 0;

  for (let i = 0; i < data.length; i++) {
    const addrStr = data[i][0];
    const valStr = data[i][1];
    if (addrStr === "" || valStr === "" || addrStr === null || valStr === null) continue;

    const vAddr = parseHex(addrStr) & 0x1FF;
    const byteVal = parseHex(valStr) & 0xFF;

    RawVirtualWriteByte(vAddr, byteVal);
    const vpn = Math.floor(vAddr / 32);
    if (vpn < 7) {
      RawRAMWrite(vAddr & 0xFF, byteVal, null);
    }
    bytesCargados++;
  }

  const startPC = parseHex(editorSheet.getRange(UI_CONFIG.EDITOR.START_PC_CELL).getValue()) & 0xFF;
  CPU.PC = startPC;
  SaveCPUState();
  UpdateLiveBanner(`🚀 PROGRAMA VALIDADO Y CARGADO (${bytesCargados} BYTES)`, "#B3E5FC", `⚡ Listo desde PC = ${toHex2(startPC)}h. Presiona STEP o RUN.`);
  WriteLog(`🚀 Sintaxis OK. Cargados ${bytesCargados} bytes desde 'Editor' (PC = ${toHex2(startPC)}h).`);
}

function EnsureProgramLoadedBeforeExec() {
  if (CPU.PC === 0 && RawRAMRead(0) === 0x00 && RawRAMRead(1) === 0x00) {
    BtnLoad();
  }
}

function BtnStep() {
  EnsureProgramLoadedBeforeExec();
  LoadCPUState();
  if (CPU.isHalted || CPU.IR === 0xFF) {
    UpdateLiveBanner("🛑 CPU DETENIDA (HLT)", "#EF9A9A", "⚡ Fin del programa. Presiona RESET o LOAD.");
    WriteLog("🛑 CPU detenida (HLT). Presiona RESET.");
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

function BtnRun() {
  EnsureProgramLoadedBeforeExec();
  WriteLog("▶️ Iniciando ejecución continua (RUN en Modo Turbo)...");
  PropertiesService.getDocumentProperties().setProperty("IS_RUNNING", "TRUE");
  TURBO_MODE = true;
  const startTime = Date.now();
  let safetyCounter = 0;

  try {
    while (safetyCounter < 80) {
      if (Date.now() - startTime > 180000) {
        WriteLog("⏱️ Pausa preventiva de seguridad. Presiona RUN nuevamente para continuar.");
        break;
      }
      if (PropertiesService.getDocumentProperties().getProperty("IS_RUNNING") === "FALSE") {
        UpdateLiveBanner("⏸️ EJECUCIÓN PAUSADA POR EL USUARIO", "#FFE082", null);
        WriteLog("⏸️ Ejecución pausada.");
        break;
      }
      LoadCPUState();
      if (CPU.isHalted || CPU.IR === 0xFF) {
        WriteLog("🏁 Ejecución continua finalizada con éxito (HLT).");
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

function BtnPause() {
  PropertiesService.getDocumentProperties().setProperty("IS_RUNNING", "FALSE");
  UpdateLiveBanner("⏸️ SEÑAL DE PAUSA ENVIADA", "#FFE082", null);
  WriteLog("⏸️ Señal de PAUSE registrada.");
}

// --- CATÁLOGO DE LOS 3 PROGRAMAS DEMOSTRATIVOS (AUTO-ENSAMBLAN Y AUTO-CARGAN A RAM) ---
function CargarCatalogoProg1() {
  const ideLines = [
    ["1",  "INICIO", "MOV AX, imm",     "00h",   ""],
    ["2",  "",       "MOV BX, imm",     "06h",   ""],
    ["3",  "",       "MOV CX, imm",     "04h",   ""],
    ["4",  "",       "MOV DX, imm",     "02h",   ""],
    ["5",  "BUCLE",  "ADD AX, BX",      "",      ""],
    ["6",  "",       "INC DX",          "",      ""],
    ["7",  "",       "DEC CX",          "",      ""],
    ["8",  "",       "JNZ addr",        "BUCLE", ""],
    ["9",  "",       "SUB AX, DX",      "",      ""],
    ["10", "",       "STORE [mem], AX", "80h",   ""],
    ["11", "FIN",    "HLT",             "",      ""]
  ];
  VolcarProgramaEnIDE(ideLines, "00", "FIFO", "LACANASO", "Programa 1: Cálculo Aritmético con Bucles y 4 Registros");
}

function CargarCatalogoProg2() {
  const ideLines = [
    ["1", "INICIO",  "MOV CX, imm",   "05h",     ""],
    ["2", "LOOP_IO", "IN DX, [KBD]",  "",        ""],
    ["3", "",        "MOV AX, DX",    "",        ""],
    ["4", "",        "OUT [LCD], DX", "",        ""],
    ["5", "",        "DEC CX",        "",        ""],
    ["6", "",        "JNZ addr",      "LOOP_IO", ""],
    ["7", "FIN",     "HLT",           "",        ""]
  ];
  VolcarProgramaEnIDE(ideLines, "00", "FIFO", "HOLA!", "Programa 2: Eco Interactivo Teclado FIFO ➔ Pantalla LCD 8x1");
}

function CargarCatalogoProg3() {
  const ideLines = [
    ["1",  "INICIO", "MOV AX, imm",     "AAh",    ""],
    ["2",  "",       "STORE [mem], AX", "40h",    ""],
    ["3",  "",       "LOAD BX, [mem]",  "40h",    ""],
    ["4",  "",       "LOAD CX, [mem]",  "41h",    ""],
    ["5",  "",       "MOV AX, imm",     "77h",    ""],
    ["6",  "FALLO1", "VSTORE [vpn],AX", "80h",    ""],
    ["7",  "FALLO2", "VLOAD DX, [vpn]", "A2h",    ""],
    ["8",  "FIN",    "HLT",             "",       ""],
    ["9",  "SWAP_D", "DB",              "142:99", ""]
  ];
  VolcarProgramaEnIDE(ideLines, "00", "FIFO", "SWAP", "Programa 3: Estrés de Caché L1/L2 y Page Faults con Write-Back");
}

function VolcarProgramaEnIDE(ideLines, pcInicial, politica, textoTeclado, tituloProg) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const editorSheet = getSheet(UI_CONFIG.SHEETS.EDITOR);
  const mainSheet = getSheet(UI_CONFIG.SHEETS.MAIN);
  if (!editorSheet) return;

  const emptyIDE = Array.from({ length: 35 }, (_, idx) => [String(idx + 1), "", "", "", ""]);
  for (let i = 0; i < ideLines.length && i < 35; i++) {
    emptyIDE[i] = ideLines[i];
  }

  const ideRange = editorSheet.getRange(UI_CONFIG.EDITOR.IDE_RANGE);
  ideRange.clearContent().setBackground("#FFFFFF");
  ideRange.setNumberFormat('@').setValues(emptyIDE);
  editorSheet.getRange(4, 1, 35, 1).setBackground("#F1F5F9").setHorizontalAlignment("center");

  editorSheet.getRange(UI_CONFIG.EDITOR.ACTIVE_PROG_CELL).setValue(tituloProg);
  editorSheet.getRange(UI_CONFIG.EDITOR.START_PC_CELL).setNumberFormat('@').setValue(pcInicial);
  editorSheet.getRange(UI_CONFIG.EDITOR.POLICY_CELL).setValue(politica);
  editorSheet.getRange(UI_CONFIG.EDITOR.INIT_KBD_CELL).setValue(textoTeclado);

  // Ensamblar e inyectar automáticamente en la RAM de Hoja 1
  if (BtnEnsamblarIDE()) {
    BtnLoad();
    if (mainSheet) ss.setActiveSheet(mainSheet);
    ss.toast(
      `${tituloProg} ensamblado y cargado en RAM. ¡Solo presiona RUN o STEP!`,
      "🚀 Programa Listo en RAM", 5
    );
  }
}