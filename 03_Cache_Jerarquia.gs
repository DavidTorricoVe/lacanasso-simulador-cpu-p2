/**
 * ARCHIVO 03: 03_Cache_Jerarquia.gs (AUDITADO QA v2.0 - SINCRONIZADO CON SHEETS)
 * RESPONSABLE: JORGE (T09: Estructura L1I/L1D/L2, T10: Lógica Hit/Miss y Métricas)
 */
function UpdateCacheMetrics(levelIndex, isHit) {
  const sheet = getSheet(UI_CONFIG.SHEETS.MAIN);
  const range = sheet.getRange(UI_CONFIG.CACHE.METRICS_RANGE);
  const metrics = range.getValues();
  let hits = parseInt(metrics[levelIndex][1], 10) || 0;
  let misses = parseInt(metrics[levelIndex][2], 10) || 0;
  if (isHit) hits++; else misses++;
  const total = hits + misses;
  const rate = total > 0 ? ((hits / total) * 100).toFixed(1) + "%" : "0.0%";
  metrics[levelIndex][1] = hits;
  metrics[levelIndex][2] = misses;
  metrics[levelIndex][3] = total;
  metrics[levelIndex][4] = rate;
  range.setValues(metrics);
}

function HierarchicalMemoryRead(virtualAddress, isInstructionFetch) {
  const sheet = getSheet(UI_CONFIG.SHEETS.MAIN);
  const vAddr = virtualAddress & 0x1FF;
  if (vAddr >= UI_CONFIG.RAM.KBD_BASE_ADDR && vAddr <= 0xFF) {
    const phys = MMU_Translate(vAddr, false);
    HighlightRAMCell(phys, UI_CONFIG.COLORS.READ_PULSE);
    return RawRAMRead(phys);
  }
  const tag = Math.floor(vAddr / 8);
  const offset = vAddr % 8;
  const l1RangeStr = isInstructionFetch ? UI_CONFIG.CACHE.L1I_RANGE : UI_CONFIG.CACHE.L1D_RANGE;
  const l1Name = isInstructionFetch ? "L1I" : "L1D";
  const l1MetricIdx = isInstructionFetch ? 0 : 1;
  const l1Range = sheet.getRange(l1RangeStr);
  const l1Row = l1Range.getValues()[0];
  
  // 1. Consultar Caché L1 (Harvard: L1I o L1D)
  if (parseInt(l1Row[0], 10) === 1 && parseHex(l1Row[1]) === tag) {
    l1Row[11] = "HIT";
    l1Range.setValues([l1Row]);
    UpdateCacheMetrics(l1MetricIdx, true);
    UpdateLiveBanner(`CACHE HIT EN ${l1Name} (Tag ${toHex2(tag)}h, Offset +${offset})`, UI_CONFIG.COLORS.CACHE_HIT, null);
    if (!TURBO_MODE && getAnimDelay() > 0) {
      l1Range.setBackground(UI_CONFIG.COLORS.CACHE_HIT);
      Smartwait(Math.floor(getAnimDelay() * 0.5));
      l1Range.setBackground("#FFFFFF");
    }
    return parseHex(l1Row[3 + offset]);
  }
  
  // Fallo en L1 (CACHE MISS)
  UpdateCacheMetrics(l1MetricIdx, false);
  l1Row[11] = "MISS";
  l1Range.setValues([l1Row]);
  return -1;
}