// TAREA 6: MEMORIA VIRTUAL 512B Y SWAP
const VMEM_SHEET = "Memoria_Virtual";
const PAGE_SIZE = 32;

function getVirtualPageAndOffset(vAddress) {
  const vAddr = vAddress & 0x1FF;
  return { 
    vpn: Math.floor(vAddr / PAGE_SIZE), 
    offset: vAddr % PAGE_SIZE 
  };
}

function ReadVirtualPageBlock(vpn) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(VMEM_SHEET);
  if (!sheet) return Array(PAGE_SIZE).fill(0);
  return sheet.getRange(5 + vpn, 3, 1, PAGE_SIZE).getValues()[0].map(v => parseInt(v, 16) || 0);
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