/**
 * ============================================================================
 * ARCHIVO 02: 02_Memoria_Y_Virtual.gs (DEFINITIVO Y SINCRONIZADO CON GIT)
 * RESPONSABLE: JORGE (T05: 8 Marcos RAM, T06: Virtual/Swap, T07: MMU, T08: Page Fault)
 * ============================================================================
 */

function RawRAMRead(physAddr) {
  const sheet = getSheet(UI_CONFIG.SHEETS.MAIN);
  const addr = physAddr & 0xFF;
  const row = UI_CONFIG.RAM.ROW_OFFSET + Math.floor(addr / 16);
  const col = UI_CONFIG.RAM.COL_OFFSET + (addr % 16);
  return parseHex(sheet.getRange(row, col).getValue()) & 0xFF;
}

function RawRAMWrite(physAddr, value, highlightColor) {
  const sheet = getSheet(UI_CONFIG.SHEETS.MAIN);
  const addr = physAddr & 0xFF;
  const row = UI_CONFIG.RAM.ROW_OFFSET + Math.floor(addr / 16);
  const col = UI_CONFIG.RAM.COL_OFFSET + (addr % 16);
  const cell = sheet.getRange(row, col);
  const prevBg = cell.getBackground();
  cell.setNumberFormat('@');
  cell.setValue(toHex2(value));
  if (highlightColor && !TURBO_MODE && getAnimDelay() > 0) {
    cell.setBackground(highlightColor);
    SmartWait(Math.floor(getAnimDelay() * 0.5));
    cell.setBackground(prevBg);
  }
}

function HighlightRAMCell(physAddr, color) {
  if (TURBO_MODE || getAnimDelay() <= 0) return;
  const sheet = getSheet(UI_CONFIG.SHEETS.MAIN);
  const addr = physAddr & 0xFF;
  const row = UI_CONFIG.RAM.ROW_OFFSET + Math.floor(addr / 16);
  const col = UI_CONFIG.RAM.COL_OFFSET + (addr % 16);
  const cell = sheet.getRange(row, col);
  const prevBg = cell.getBackground();
  cell.setBackground(color);
  SmartWait(Math.floor(getAnimDelay() * 0.5));
  cell.setBackground(prevBg);
}

function RawVirtualReadByte(vAddr) {
  const vSheet = getSheet(UI_CONFIG.SHEETS.VIRTUAL);
  const addr = vAddr & 0x1FF;
  const row = UI_CONFIG.VIRTUAL_SWAP.ROW_OFFSET + Math.floor(addr / 16);
  const col = UI_CONFIG.VIRTUAL_SWAP.COL_OFFSET + (addr % 16);
  return parseHex(vSheet.getRange(row, col).getValue()) & 0xFF;
}

function RawVirtualWriteByte(vAddr, value) {
  const vSheet = getSheet(UI_CONFIG.SHEETS.VIRTUAL);
  const addr = vAddr & 0x1FF;
  const row = UI_CONFIG.VIRTUAL_SWAP.ROW_OFFSET + Math.floor(addr / 16);
  const col = UI_CONFIG.VIRTUAL_SWAP.COL_OFFSET + (addr % 16);
  const cell = vSheet.getRange(row, col);
  cell.setNumberFormat('@');
  cell.setValue(toHex2(value));
}

function WriteSwapEventLog(eventType, vpn, pfn, dirtyStatus, detail) {
  const vSheet = getSheet(UI_CONFIG.SHEETS.VIRTUAL);
  if (!vSheet) return;
  const stepStamp = PropertiesService.getDocumentProperties().getProperty("STEP_COUNTER") || "1";
  const range = vSheet.getRange(UI_CONFIG.VIRTUAL_SWAP.SWAP_LOG_RANGE);
  const vals = range.getValues();
  const newRow = [`#${stepStamp}`, eventType, `VPN ${toHex2(vpn)}h`, `Marco ${pfn}`, dirtyStatus, detail];

  let emptyIdx = vals.findIndex(r => r[0] === "" || r[0] === null);
  if (emptyIdx === -1) {
    vals.shift();
    vals.push(newRow);
    range.setValues(vals);
  } else {
    vSheet.getRange(UI_CONFIG.VIRTUAL_SWAP.SWAP_LOG_ROW_START + emptyIdx, UI_CONFIG.VIRTUAL_SWAP.SWAP_LOG_COL_START, 1, 6).setValues([newRow]);
  }
}

function CopyPageVirtualToRAMFrame(vpn, pfn) {
  const mainSheet = getSheet(UI_CONFIG.SHEETS.MAIN);
  const vSheet = getSheet(UI_CONFIG.SHEETS.VIRTUAL);

  const vStartRow = UI_CONFIG.VIRTUAL_SWAP.ROW_OFFSET + (vpn * 2);
  const rStartRow = UI_CONFIG.RAM.ROW_OFFSET + (pfn * 2);

  const pageData = vSheet.getRange(vStartRow, UI_CONFIG.VIRTUAL_SWAP.COL_OFFSET, 2, 16).getValues();
  const ramFrameRange = mainSheet.getRange(rStartRow, UI_CONFIG.RAM.COL_OFFSET, 2, 16);

  ramFrameRange.setNumberFormat('@');
  ramFrameRange.setValues(pageData);
  if (!TURBO_MODE && getAnimDelay() > 0) {
    ramFrameRange.setBackground(UI_CONFIG.COLORS.READ_PULSE);
    SmartWait(getAnimDelay());
  }
  ramFrameRange.setBackground(pfn < 4 ? UI_CONFIG.COLORS.CODE_RAM : UI_CONFIG.COLORS.DATA_RAM);
}

function CopyRAMFrameToVirtualSwap(pfn, vpn) {
  const mainSheet = getSheet(UI_CONFIG.SHEETS.MAIN);
  const vSheet = getSheet(UI_CONFIG.SHEETS.VIRTUAL);

  const rStartRow = UI_CONFIG.RAM.ROW_OFFSET + (pfn * 2);
  const vStartRow = UI_CONFIG.VIRTUAL_SWAP.ROW_OFFSET + (vpn * 2);

  const ramData = mainSheet.getRange(rStartRow, UI_CONFIG.RAM.COL_OFFSET, 2, 16).getValues();
  const swapRange = vSheet.getRange(vStartRow, UI_CONFIG.VIRTUAL_SWAP.COL_OFFSET, 2, 16);
  swapRange.setNumberFormat('@');
  swapRange.setValues(ramData);
  swapRange.setBackground(UI_CONFIG.COLORS.WRITE_PULSE);
}

function MMU_Translate(virtualAddress, isWrite) {
  const sheet = getSheet(UI_CONFIG.SHEETS.MAIN);
  const vAddr = virtualAddress & 0x1FF;

  if (vAddr >= UI_CONFIG.RAM.KBD_BASE_ADDR && vAddr <= 0xFF) {
    sheet.getRange(UI_CONFIG.MMU_MONITOR.VALUES_RANGE).setValues([[
      `${toHex3(vAddr)}h (E/S)`, "VPN 07h", `+${toHex2(vAddr % 32)}h`, "Marco 7", `${toHex2(vAddr)}h`
    ]]);
    setMergedBox(sheet, UI_CONFIG.MMU_MONITOR.STATUS_RANGE, "🔌 E/S MAPEADA EN MARCO 7 (F0h-FFh)", "#CCFBF1", "#0F172A");
    return vAddr & 0xFF;
  }

  const vpn = Math.floor(vAddr / 32);
  const offset = vAddr % 32;

  const tableRange = sheet.getRange(UI_CONFIG.MMU.TABLE_RANGE);
  const tableData = tableRange.getValues();
  const mmuRowRange = sheet.getRange(UI_CONFIG.MMU.ROW_START + vpn, UI_CONFIG.MMU.COL_START, 1, 8);

  let presentBit = parseInt(tableData[vpn][2], 10) || 0;
  let pfn = parseInt(tableData[vpn][3], 10);

  if (presentBit === 0 || isNaN(pfn)) {
    pfn = HandlePageFault(vpn, tableData, offset, vAddr);
    const updatedTable = tableRange.getValues();
    tableData[vpn] = updatedTable[vpn];
  } else {
    setMergedBox(sheet, UI_CONFIG.MMU.ALERT_RANGE, `🟢 MMU OK: VPN ${toHex2(vpn)}h ➔ Marco ${pfn}`, UI_CONFIG.COLORS.MMU_OK, "#0F172A");
    if (!TURBO_MODE && getAnimDelay() > 0) {
      mmuRowRange.setBackground(UI_CONFIG.COLORS.READ_PULSE);
      SmartWait(Math.floor(getAnimDelay() * 0.5));
      mmuRowRange.setBackground("#FFFFFF");
    }
  }

  const stepStamp = Number(PropertiesService.getDocumentProperties().getProperty("STEP_COUNTER") || "1") + 1;
  PropertiesService.getDocumentProperties().setProperty("STEP_COUNTER", String(stepStamp));

  tableData[vpn][5] = 1;
  if (isWrite) {
    tableData[vpn][4] = 1;
    tableData[vpn][7] = `RAM Marco ${pfn} (Dirty)`;
  }

  const policy = (sheet.getRange(UI_CONFIG.MMU.POLICY_CELL).getValue() || "FIFO").toString().toUpperCase();
  if (policy === "LRU") {
    tableData[vpn][6] = stepStamp;
  }

  tableRange.setValues(tableData);
  const physAddr = ((pfn * 32) + offset) & 0xFF;

  sheet.getRange(UI_CONFIG.MMU_MONITOR.VALUES_RANGE).setValues([[
    `${toHex3(vAddr)}h`, `VPN ${toHex2(vpn)}h`, `+${toHex2(offset)}h`, `Marco ${pfn}`, `${toHex2(physAddr)}h`
  ]]);
  setMergedBox(
    sheet, UI_CONFIG.MMU_MONITOR.STATUS_RANGE,
    `✅ Fórmula MMU: (${pfn} × 32) + ${offset} = Dir. Física ${toHex2(physAddr)}h`,
    UI_CONFIG.COLORS.MMU_OK, "#0F172A"
  );

  return physAddr;
}

function HandlePageFault(targetVPN, tableData, offset, vAddr) {
  const sheet = getSheet(UI_CONFIG.SHEETS.MAIN);
  const faultRowRange = sheet.getRange(UI_CONFIG.MMU.ROW_START + targetVPN, UI_CONFIG.MMU.COL_START, 1, 8);

  setMergedBox(sheet, UI_CONFIG.MMU.ALERT_RANGE, `🚨 PAGE FAULT EN VPN ${toHex2(targetVPN)}h (Bit P=0)`, UI_CONFIG.COLORS.PAGE_FAULT, "#FFFFFF");
  faultRowRange.setBackground(UI_CONFIG.COLORS.PAGE_FAULT).setFontColor("#FFFFFF");

  sheet.getRange(UI_CONFIG.MMU_MONITOR.VALUES_RANGE).setValues([[
    `${toHex3(vAddr)}h`, `VPN ${toHex2(targetVPN)}h`, `+${toHex2(offset)}h`, "P=0 (FALLO)", "SWAP ➔ RAM"
  ]]);
  setMergedBox(
    sheet, UI_CONFIG.MMU_MONITOR.STATUS_RANGE,
    `🚨 PAGE FAULT: Página ${toHex2(targetVPN)}h ausente en RAM. Trayendo 32B desde Swap...`,
    UI_CONFIG.COLORS.PAGE_FAULT, "#FFFFFF"
  );

  UpdateLiveBanner(
    `🚨 INTERRUPCIÓN: PAGE FAULT EN PÁGINA VIRTUAL ${toHex2(targetVPN)}h`,
    UI_CONFIG.COLORS.PAGE_FAULT,
    `⚡ MMU detectó Bit P=0 en VPN ${toHex2(targetVPN)}h ━━► Activando reemplazo con Swap`
  );
  WriteLog(`🚨 PAGE FAULT: VPN ${toHex2(targetVPN)}h no está en RAM (P=0).`);
  SpreadsheetApp.flush();
  Utilities.sleep(150);

  const usedFrames = {};
  for (let i = 0; i < 16; i++) {
    if (parseInt(tableData[i][2], 10) === 1 && tableData[i][3] !== "-") {
      usedFrames[parseInt(tableData[i][3], 10)] = i;
    }
  }

  let chosenPFN = -1;
  for (let f = 1; f < 7; f++) {
    if (usedFrames[f] === undefined) {
      chosenPFN = f;
      break;
    }
  }

  // Si los marcos de datos 1..6 están ocupados, elegir víctima con FIFO o LRU (protegiendo el Marco 0 de código activo)
  if (chosenPFN === -1) {
    const policy = (sheet.getRange(UI_CONFIG.MMU.POLICY_CELL).getValue() || "FIFO").toString().toUpperCase();
    const activeCodeVPN = Math.floor((CPU.PC & 0x1FF) / 32);
    let victimVPN = -1;
    let minOrder = Infinity;

    for (let i = 0; i < 16; i++) {
      if (i === activeCodeVPN) continue; // Proteger la página de código en curso
      const pBit = parseInt(tableData[i][2], 10);
      const pfnVal = parseInt(tableData[i][3], 10);
      if (pBit === 1 && pfnVal >= 1 && pfnVal < 7) {
        const orderVal = Number(tableData[i][6]) || 0;
        if (orderVal < minOrder) {
          minOrder = orderVal;
          victimVPN = i;
          chosenPFN = pfnVal;
        }
      }
    }

    if (victimVPN !== -1) {
      const victimDirty = parseInt(tableData[victimVPN][4], 10) === 1;
      WriteLog(`🔄 Reemplazo (${policy}): Víctima VPN ${toHex2(victimVPN)}h cede Marco ${chosenPFN}.`);
      if (victimDirty) {
        WriteLog(`💾 Write-Back: VPN ${toHex2(victimVPN)}h tenía Dirty=1. Volcando 32B al Swap.`);
        CopyRAMFrameToVirtualSwap(chosenPFN, victimVPN);
        WriteSwapEventLog("WRITE-BACK", victimVPN, chosenPFN, "Dirty=1", "32B guardados en Swap antes de desalojo");
      } else {
        WriteSwapEventLog("EVICT (Limpia)", victimVPN, chosenPFN, "Dirty=0", "Desalojada sin cambios");
      }
      tableData[victimVPN][2] = 0;
      tableData[victimVPN][3] = "-";
      tableData[victimVPN][4] = 0;
      tableData[victimVPN][5] = 0;
      tableData[victimVPN][6] = 0;
      tableData[victimVPN][7] = "En Disco (Swap)";
    } else {
      chosenPFN = 2;
    }
  }

  CopyPageVirtualToRAMFrame(targetVPN, chosenPFN);
  WriteSwapEventLog("PAGE-IN (Swap➔RAM)", targetVPN, chosenPFN, "Dirty=0", "32B cargados a RAM tras Page Fault");

  const stepStamp = Number(PropertiesService.getDocumentProperties().getProperty("STEP_COUNTER") || "1") + 1;
  PropertiesService.getDocumentProperties().setProperty("STEP_COUNTER", String(stepStamp));

  tableData[targetVPN][2] = 1;
  tableData[targetVPN][3] = chosenPFN;
  tableData[targetVPN][4] = 0;
  tableData[targetVPN][5] = 1;
  tableData[targetVPN][6] = stepStamp;
  tableData[targetVPN][7] = `RAM (Marco ${chosenPFN})`;

  sheet.getRange(UI_CONFIG.MMU.TABLE_RANGE).setValues(tableData);
  faultRowRange.setBackground(UI_CONFIG.COLORS.READ_PULSE).setFontColor("#000000");
  SmartWait(getAnimDelay());
  faultRowRange.setBackground("#FFFFFF");

  WriteLog(`✅ VPN ${toHex2(targetVPN)}h alojada en Marco Físico ${chosenPFN}.`);
  return chosenPFN;
}