import { Canvas, Cell, gen_image } from "website";
import { memory } from "website/website_bg";

const CELL_SIZE = 20; // px
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
// init with random states
hopfield_canvas.randomize();

// Calculate the size needed for each grid including padding
const GRID_PIXEL_WIDTH = (CELL_SIZE + 1) * GRID_WIDTH + 1;
const GRID_PIXEL_HEIGHT = (CELL_SIZE + 1) * GRID_HEIGHT + 1;

// Calculate canvas size to fit all grids
const canvas = document.getElementById("hopfield-canvas");
canvas.height = GRID_PIXEL_HEIGHT * height;
canvas.width = GRID_PIXEL_WIDTH * width;

let image = gen_image(height, width);
console.log(image);

const ctx = canvas.getContext('2d');

const renderLoop = () => {
  hopfield_canvas.step(image);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrids();

  setTimeout(() => { requestAnimationFrame(renderLoop); }, 500);
};

const drawGridLines = (offsetX, offsetY) => {
  ctx.beginPath();
  ctx.strokeStyle = GRID_COLOR;

  // Vertical lines.
  for (let i = 0; i <= GRID_WIDTH; i++) {
    ctx.moveTo(offsetX + i * (CELL_SIZE + 1) + 1, offsetY);
    ctx.lineTo(offsetX + i * (CELL_SIZE + 1) + 1, offsetY + GRID_PIXEL_HEIGHT - 1);
  }

  // Horizontal lines.
  for (let j = 0; j <= GRID_HEIGHT; j++) {
    ctx.moveTo(offsetX, offsetY + j * (CELL_SIZE + 1) + 1);
    ctx.lineTo(offsetX + GRID_PIXEL_WIDTH - 1, offsetY + j * (CELL_SIZE + 1) + 1);
  }

  ctx.stroke();
};

const getIndex = (row, column) => {
  return row * GRID_WIDTH + column;
};

const drawGrids = () => {
  const gridsLen = hopfield_canvas.grids_len();

  // Calculate grid positions
  for (let gridIndex = 0; gridIndex < gridsLen; gridIndex++) {
    const gridRow = Math.floor(gridIndex / width);
    const gridCol = gridIndex % width;

    const offsetX = gridCol * GRID_PIXEL_WIDTH;
    const offsetY = gridRow * GRID_PIXEL_HEIGHT;

    // Draw grid lines
    drawGridLines(offsetX, offsetY);

    // Draw cells
    const cellsPtr = hopfield_canvas.get_grids_cells(gridIndex);
    const cells = new Int8Array(memory.buffer, cellsPtr, GRID_WIDTH * GRID_HEIGHT);

    ctx.beginPath();
    for (let row = 0; row < GRID_HEIGHT; row++) {
      for (let col = 0; col < GRID_WIDTH; col++) {
        const idx = getIndex(row, col);
        ctx.fillStyle = cells[idx] === Cell.Black
          ? NEGATIVE_COLOR
          : POSITIVE_COLOR;

        ctx.fillRect(
          offsetX + col * (CELL_SIZE + 1) + 1,
          offsetY + row * (CELL_SIZE + 1) + 1,
          CELL_SIZE,
          CELL_SIZE
        );
      }
    }
    ctx.stroke();
  }
};

// Initial render
drawGrids();
requestAnimationFrame(renderLoop);
