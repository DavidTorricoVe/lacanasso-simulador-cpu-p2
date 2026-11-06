// MÓDULO 03: CACHÉ L1 y L2 
Autor: Jorge 

let L1I = { Valid: 0, Tag: 1, Data: Array(8).fill(0) };
let L1D = { Valid: 0, Tag: 1, Data: Array(8).fill(0) }; 
let L2 = Array.from({ length: 4 }, () => ({ Valid: 0, Tag: 1, Data: Array(8).fill(0) })); 

function ReadCacheL1D(address) { 
  const tag = Math.floor(address / 8); 
  if (L1D.Valid === 1 && L1D.Tag === tag) return L1D.Data[address % 8]; 
  return -1; 
}