// MÓDULO 03: CACHÉ L1 y L2 
Autor: Jorge 

let L1I = { Valid: 0, Tag: 1, Data: Array(8).fill(0) };
let L1D = { Valid: 0, Tag: 1, Data: Array(8).fill(0) }; 
let L2 = Array.from({ length: 4 }, () => ({ Valid: 0, Tag: 1, Data: Array(8).fill(0) })); 

function ReadCacheL1D(address) { 
  const tag = Math.floor(address / 8); 
  if (L1D.Valid === 1 && L1D.Tag === tag) return L1D.Data[address % 8]; 
  return -1; 
// TAREA 10: MÉTRICAS HITS/MISSES
let Metrics = { L1_Hits: 0, L1_Misses: 0, L2_Hits: 0, L2_Misses: 0 }; 

function UpdateMetrics(level, isHit) { 
  if (level === 'L1') isHit ? Metrics.L1_Hits++ : Metrics.L1_Misses++; 
  if (level === 'L2') isHit ? Metrics.L2_Hits++ : Metrics.L2_Misses++; 
}