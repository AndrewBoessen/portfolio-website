import { Canvas, Cell } from "website";
// Import the WebAssembly memory at the top of the file.
import { memory } from "website/website_bg";

const CELL_SIZE = 5; // px
const GRID_COLOR = "#CCCCCC";
const NEGATIVE_COLOR = "#FFFFFF";
const POSITIVE_COLOR = "#000000";

const WIDTH = 96;
const HEIGHT = 32;
const GRID_WIDTH = 8;
const GRID_HEIGHT = 8;

// Construct the canvas, and get its width and height.
const hopfield_canvas = Canvas.new(WIDTH, HEIGHT, GRID_HEIGHT, GRID_WIDTH);
const width = hopfield_canvas.width();
const height = hopfield_canvas.height();

// Give the canvas room for all of our cells and a 1px border
// around each of them.
const canvas = document.getElementById("hopfield-canvas");
canvas.height = (GRID_WIDTH * GRID_HEIGHT) * (CELL_SIZE + 1) * height + 1;
canvas.width = (GRID_WIDTH * GRID_HEIGHT) * (CELL_SIZE + 1) * width + 1;

const ctx = canvas.getContext('2d');

const renderLoop = () => {
  hopfield_canvas.step();

  drawGrid();
  drawCells();

  requestAnimationFrame(renderLoop);
};

const drawGrid = () => {
  ctx.beginPath();
  ctx.strokeStyle = GRID_COLOR;

  // Vertical lines.
  for (let i = 0; i <= width; i++) {
    ctx.moveTo(i * (CELL_SIZE + 1) + 1, 0);
    ctx.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * height + 1);
  }

  // Horizontal lines.
  for (let j = 0; j <= height; j++) {
    ctx.moveTo(0, j * (CELL_SIZE + 1) + 1);
    ctx.lineTo((CELL_SIZE + 1) * width + 1, j * (CELL_SIZE + 1) + 1);
  }

  ctx.stroke();
};

const getIndex = (row, column) => {
  return row * width + column;
};

const drawCells = () => {
  const gridsPtr = hopfield_canvas.grids_ptr();
  const gridsLen = hopfield_canvas.grids_len();
  // loop over grids
  for (let i = 0; i < gridsLen; i++) {
    const gridPtr = gridsPtr + i;
    const cellsPtr = view.getUint32(gridPtr, true);
    const cellsLength = view.getBigUint64(gridPtr + 8, true);
    const cells = new Uint8Array(memory.buffer, cellsPtr, cellsLength);
  }

  ctx.beginPath();

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const idx = getIndex(row, col);

      ctx.fillStyle = cells[idx] === Cell.Dead
        ? DEAD_COLOR
        : ALIVE_COLOR;

      ctx.fillRect(
        col * (CELL_SIZE + 1) + 1,
        row * (CELL_SIZE + 1) + 1,
        CELL_SIZE,
        CELL_SIZE
      );
    }
  }

  ctx.stroke();
};

drawGrid();
drawCells();
requestAnimationFrame(renderLoop);
