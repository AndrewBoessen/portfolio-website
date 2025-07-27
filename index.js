import { Canvas, Cell, gen_image } from "./pkg/index";
import { memory } from "./pkg/index_bg.wasm";

// Define colors
const NEGATIVE_COLOR = "#000000";
const POSITIVE_COLOR = "#FFFFFF";

// Define grid dimensions
const MOBILE_WIDTH = 56;
const MOBILE_HEIGHT = 40;
const DESKTOP_WIDTH = 96;
const DESKTOP_HEIGHT = 32;

// Define pixel per cell in grid
const MOBILE_PIXELS = 2;
const DESKTOP_PIXELS = 4;

// JavaScript to handle the active menu item
const sections = document.querySelectorAll('.section');
const menuLinks = document.querySelectorAll('.menu-bar a');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    if (pageYOffset >= sectionTop - sectionHeight / 3) {
      current = section.getAttribute('id');
    }
  });

  menuLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href').includes(current)) {
      link.classList.add('active');
    }
  });
});
// Determine if the device is mobile
function isMobile() {
  return window.innerWidth <= 1200;
}

// List of ISBN numbers for the books
const isbnList = [
  "9780810112001",
  "9780451523105",
  "9780307787477",
  "9780810111752",
  "9781429955195",
  "9781922240040",
  "9780190948221",
  "0465026567",
  "9780307827661",
  "9780393542028",
  "9781493938438",
  "9780128119068",
  "9781429927215",
  "0140077022",
  "192224001X",
  "9780679720218",
  "9780061745171",
  "0262193981",
  "9780608033204",
  "9780679734529",
];

const GOOGLE_API_KEY = "AIzaSyB4VVtK4KcfmQouHGaIgA3PWsmpmn3e9Qg";

// Function to fetch book details from Google Books API
async function fetchBookDetails(isbn) {
  const response = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${GOOGLE_API_KEY}`
  );
  const data = await response.json();

  if (data.items && data.items.length > 0) {
    const bookInfo = data.items[0].volumeInfo;
    return {
      title: bookInfo.title,
      cover: (bookInfo.imageLinks?.thumbnail || "https://via.placeholder.com/150x200").replace('http://', 'https://'),
      previewLink: bookInfo.previewLink || `https://books.google.com/books?isbn=${isbn}`, // Fallback to Google Books search
    };
  } else {
    return null; // No book found for this ISBN
  }
}

// Function to create placeholder elements for the books
function createBookPlaceholders() {
  const bookshelfContainer = document.querySelector('.bookshelf-container');
  bookshelfContainer.innerHTML = ''; // Clear existing content

  isbnList.forEach(() => {
    const placeholder = document.createElement('div');
    placeholder.classList.add('book-item', 'book-item-placeholder');
    bookshelfContainer.appendChild(placeholder);
  });
}

// Function to display books on the bookshelf
async function displayBookshelf() {
  const bookshelfContainer = document.querySelector('.bookshelf-container');
  const placeholderItems = document.querySelectorAll('.book-item-placeholder');

  for (let i = 0; i < isbnList.length; i++) {
    const isbn = isbnList[i];
    const bookDetails = await fetchBookDetails(isbn);

    if (bookDetails) {
      const bookItem = document.createElement('div');
      bookItem.classList.add('book-item');

      // Create a hyperlink for the book cover
      const bookLink = document.createElement('a');
      bookLink.href = bookDetails.previewLink;
      bookLink.target = "_blank"; // Open link in a new tab
      bookLink.rel = "noopener noreferrer"; // Security best practice

      const bookCover = document.createElement('img');
      bookCover.classList.add('book-cover');
      bookCover.src = bookDetails.cover;
      bookCover.alt = bookDetails.title;
      bookCover.width = 150;
      bookCover.height = 200;

      const bookTitle = document.createElement('div');
      bookTitle.classList.add('book-title');
      bookTitle.textContent = bookDetails.title;

      // Append the cover image to the hyperlink
      bookLink.appendChild(bookCover);

      // Append the hyperlink and title to the book item
      bookItem.appendChild(bookLink);
      bookItem.appendChild(bookTitle);

      // Replace the placeholder with the new book item
      if (i < placeholderItems.length) {
        bookshelfContainer.replaceChild(bookItem, placeholderItems[i]);
      } else {
        bookshelfContainer.appendChild(bookItem);
      }
    }
  }
}

// Create placeholders and then display the bookshelf
createBookPlaceholders();
displayBookshelf();

// Set grid dimensions based on device type
const GRID_WIDTH = 8;
const GRID_HEIGHT = 8;
const WIDTH = isMobile() ? MOBILE_WIDTH : DESKTOP_WIDTH;
const HEIGHT = isMobile() ? MOBILE_HEIGHT : DESKTOP_HEIGHT;
const PIXELS = isMobile() ? MOBILE_PIXELS : DESKTOP_PIXELS;

// Calculate cell size based on screen width
const CELL_SIZE = (window.innerWidth / WIDTH) - PIXELS;

// Construct the canvas
const hopfield_canvas = Canvas.new(WIDTH, HEIGHT, GRID_HEIGHT, GRID_WIDTH);
const width = hopfield_canvas.width();
const height = hopfield_canvas.height();

// random starting cell values
hopfield_canvas.randomize();

// Calculate the size needed for each grid including padding
const GRID_PIXEL_WIDTH = (CELL_SIZE + PIXELS) * GRID_WIDTH;
const GRID_PIXEL_HEIGHT = (CELL_SIZE + PIXELS) * GRID_HEIGHT;

// Get the canvas element and set its size
const canvas = document.getElementById("hopfield-canvas");
canvas.height = GRID_PIXEL_HEIGHT * (height / GRID_HEIGHT);
canvas.width = GRID_PIXEL_WIDTH * (width / GRID_WIDTH);

// Function to handle window resize
function handleResize() {
  const newCellSize = Math.floor(window.innerWidth / WIDTH) - PIXELS;
  if (newCellSize !== Math.floor(CELL_SIZE)) {
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
          offsetX + col * (CELL_SIZE + PIXELS),
          offsetY + row * (CELL_SIZE + PIXELS),
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
