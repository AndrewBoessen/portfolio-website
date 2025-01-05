import { Canvas, Cell, gen_image } from "website";
import { memory } from "website/website_bg.wasm";

// Define colors
const NEGATIVE_COLOR = "#000000";
const POSITIVE_COLOR = "#FFFFFF";

// Define grid dimensions
const MOBILE_WIDTH = 32;
const MOBILE_HEIGHT = 16;
const DESKTOP_WIDTH = 96;
const DESKTOP_HEIGHT = 32;

// Determine if the device is mobile
function isMobile() {
  return window.innerWidth <= 980;
}

// Set grid dimensions based on device type
const GRID_WIDTH = 8;
const GRID_HEIGHT = 8;
const WIDTH = isMobile() ? MOBILE_WIDTH : DESKTOP_WIDTH;
const HEIGHT = isMobile() ? MOBILE_HEIGHT : DESKTOP_HEIGHT;

// Calculate cell size based on screen width
const CELL_SIZE = (window.innerWidth / WIDTH) - 4;

// Construct the canvas
const hopfield_canvas = Canvas.new(WIDTH, HEIGHT, GRID_HEIGHT, GRID_WIDTH);
const width = hopfield_canvas.width();
const height = hopfield_canvas.height();

// random starting cell values
hopfield_canvas.randomize();

// Calculate the size needed for each grid including padding
const GRID_PIXEL_WIDTH = (CELL_SIZE + 4) * GRID_WIDTH;
const GRID_PIXEL_HEIGHT = (CELL_SIZE + 4) * GRID_HEIGHT;

// Get the canvas element and set its size
const canvas = document.getElementById("hopfield-canvas");
canvas.height = GRID_PIXEL_HEIGHT * (height / GRID_HEIGHT);
canvas.width = GRID_PIXEL_WIDTH * (width / GRID_WIDTH);

// Function to handle window resize
function handleResize() {
  const newCellSize = Math.floor(window.innerWidth / WIDTH) - 4;
  if (newCellSize !== CELL_SIZE) {
    location.reload();
  }
}

// Add resize event listener
window.addEventListener('resize', handleResize);

// Generate the initial image
let image = gen_image(height, width);

// Get the canvas context
const ctx = canvas.getContext('2d');

// Render loop
const renderLoop = () => {
  let stable = hopfield_canvas.step(image);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrids();

  if (!stable) {
    setTimeout(() => { requestAnimationFrame(renderLoop); }, 50);
  } else {
    return;
  }
};

// Function to get the index of a cell
const getIndex = (row, column) => {
  return row * GRID_WIDTH + column;
};

// Function to draw the grids
const drawGrids = () => {
  const gridsLen = hopfield_canvas.grids_len();
  const totalWidth = GRID_PIXEL_WIDTH * (WIDTH / GRID_WIDTH);

  // Calculate grid positions
  for (let gridIndex = 0; gridIndex < gridsLen; gridIndex++) {
    const gridRow = Math.floor(gridIndex / (width / GRID_WIDTH));
    const gridCol = gridIndex % (width / GRID_WIDTH);

    // Calculate offsetX without adding extra column width
    const offsetX = gridCol * GRID_PIXEL_WIDTH;
    const offsetY = gridRow * GRID_PIXEL_HEIGHT;

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
          offsetX + col * (CELL_SIZE + 4),
          offsetY + row * (CELL_SIZE + 4),
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
