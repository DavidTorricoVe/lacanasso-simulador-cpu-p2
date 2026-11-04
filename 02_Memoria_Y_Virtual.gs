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
}