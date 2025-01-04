import { Canvas, Cell, gen_image } from "website";
import { memory } from "website/website_bg.wasm";

// Calculate cell size based on screen width
const NEGATIVE_COLOR = "#000000";
const POSITIVE_COLOR = "#FFFFFF";

const WIDTH = 96;
const HEIGHT = 32;
const GRID_WIDTH = 8;
const GRID_HEIGHT = 8;

const CELL_SIZE = Math.floor(window.innerWidth / (WIDTH)) - 1;

// Construct the canvas, and get its width and height.
const hopfield_canvas = Canvas.new(WIDTH, HEIGHT, GRID_HEIGHT, GRID_WIDTH);
const width = hopfield_canvas.width();
const height = hopfield_canvas.height();
// init with random states
hopfield_canvas.randomize();

// Calculate the size needed for each grid including padding
const GRID_PIXEL_WIDTH = (CELL_SIZE + 1) * GRID_WIDTH;
const GRID_PIXEL_HEIGHT = (CELL_SIZE + 1) * GRID_HEIGHT;

// Calculate canvas size to fit all grids
const canvas = document.getElementById("hopfield-canvas");
canvas.height = GRID_PIXEL_HEIGHT * height;
canvas.width = window.innerWidth;

window.addEventListener('resize', () => {
  const newCellSize = Math.floor(window.innerWidth / (WIDTH * GRID_WIDTH)) - 1;
  if (newCellSize !== CELL_SIZE) {
    location.reload(); // Reload the page to redraw with new cell size
  }
});
let image = gen_image(height, width);

const ctx = canvas.getContext('2d');

const renderLoop = () => {
  hopfield_canvas.step(image);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrids();

  setTimeout(() => { requestAnimationFrame(renderLoop); }, 500);
};

const getIndex = (row, column) => {
  return row * GRID_WIDTH + column;
};

const drawGrids = () => {
  const gridsLen = hopfield_canvas.grids_len();
  const totalWidth = GRID_PIXEL_WIDTH * (WIDTH / GRID_WIDTH);

  // Calculate grid positions
  for (let gridIndex = 0; gridIndex < gridsLen; gridIndex++) {
    const gridRow = Math.floor(gridIndex / (width / GRID_WIDTH));
    const gridCol = gridIndex % (width / GRID_WIDTH);

    const offsetX = (gridCol * GRID_PIXEL_WIDTH) + (window.innerWidth - totalWidth) / 2;
    const offsetY = gridRow * GRID_PIXEL_HEIGHT;

    // Draw cells
    const cellsPtr = hopfield_canvas.get_grids_cells(gridIndex);
    const cells = new Int8Array(memory.buffer, cellsPtr, GRID_WIDTH * GRID_HEIGHT);

    ctx.beginPath();
    for (let row = 0; row < GRID_HEIGHT; row++) {
      for (let col = 0; col < GRID_WIDTH; col++) {
        const idx = getIndex(row, col);
        let image_idx = (gridRow * GRID_HEIGHT * width) +              // Move to correct grid row
          (gridCol * GRID_WIDTH) +                       // Move to correct grid column
          (Math.floor(idx / GRID_WIDTH) * width) + // Move to correct row within grid
          (idx % GRID_WIDTH);
        ctx.fillStyle = image[image_idx] === Cell.Black
          ? NEGATIVE_COLOR
          : POSITIVE_COLOR;

        ctx.fillRect(
          offsetX + col * (CELL_SIZE + 1),
          offsetY + row * (CELL_SIZE + 1),
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
