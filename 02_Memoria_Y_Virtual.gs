// MÓDULO 02: MEMORIA FÍSICA Y VIRTUAL Autor: Jorge
const NUM_FRAMES = 8;
const FRAME_SIZE = 32;

function getFrameAndOffset(physicalAddress) {
  const addr = physicalAddress & 0xFF;
  return { 
    frame: Math.floor(addr / FRAME_SIZE), 
    offset: addr % FRAME_SIZE 
  };
// TAREA 7: MMU Y TABLA DE PAGINAS
let PageTable = Array.from({ length: 16 }, (_, vpn) => ({ 
  VPN: vpn, 
  Present: 0, 
  PFN: 1, 
  Dirty: 0, 
  Ref: 0 
}));

function TranslateAddress(virtualAddress) {
  const { vpn, offset } = getVirtualPageAndOffset(virtualAddress);
  const entry = PageTable[vpn];
  if (entry.Present === 0) return -1; // Dispara Page Fault
  entry.Ref = 1;
  return (entry.PFN * FRAME_SIZE) + offset;
}