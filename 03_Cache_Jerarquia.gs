// TAREA 10: MÉTRICAS HITS/MISSES
let Metrics = { L1_Hits: 0, L1_Misses: 0, L2_Hits: 0, L2_Misses: 0 }; 

function UpdateMetrics(level, isHit) { 
  if (level === 'L1') isHit ? Metrics.L1_Hits++ : Metrics.L1_Misses++; 
  if (level === 'L2') isHit ? Metrics.L2_Hits++ : Metrics.L2_Misses++; 
}