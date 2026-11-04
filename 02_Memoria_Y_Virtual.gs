// MÓDULO 02: MEMORIA FÍSICA Y VIRTUAL Autor: Jorge
const NUM_FRAMES = 8;
const FRAME_SIZE = 32;

function getFrameAndOffset(physicalAddress) {
  const addr = physicalAddress & 0xFF;
  return { 
    frame: Math.floor(addr / FRAME_SIZE), 
    offset: addr % FRAME_SIZE 
  };
}