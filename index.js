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

// The books on the shelf. Titles are hardcoded because the Google Books
// endpoint below returns covers and links but no title field.
const books = [
  { isbn: "9781922240453", title: "Sleep and the Soul" },
  { isbn: "9780691166193", title: "Efficiently Inefficient" },
  { isbn: "9780345497512", title: "The City & The City" },
  { isbn: "9780618640157", title: "The Lord of the Rings" },
  { isbn: "9780810112001", title: "Moscow to the End of the Line" },
  { isbn: "9780451523105", title: "One Day in the Life of Ivan Denisovich" },
  { isbn: "9780307787477", title: "Pnin" },
  { isbn: "9780810111752", title: "Cement" },
  { isbn: "9781429955195", title: "Blindsight" },
  { isbn: "9781922240040", title: "Diaspora" },
  { isbn: "9780190948221", title: "The Ethical Algorithm" },
  { isbn: "0465026567", title: "Gödel, Escher, Bach" },
  { isbn: "9780307827661", title: "The Stranger" },
  { isbn: "9780393542028", title: "Hidden Spring" },
  { isbn: "9781493938438", title: "Pattern Recognition and Machine Learning" },
  { isbn: "9780128119068", title: "Computer Architecture" },
  { isbn: "9781429927215", title: "The Brothers Karamazov" },
  { isbn: "0140077022", title: "White Noise" },
  { isbn: "192224001X", title: "Permutation City" },
  { isbn: "9780679720218", title: "The Plague" },
  { isbn: "9780061745171", title: "The Intelligent Investor" },
  { isbn: "0262193981", title: "Reinforcement Learning" },
  { isbn: "9780608033204", title: "The Gulag Archipelago" },
  { isbn: "9780679734529", title: "Notes from Underground" },
];

const PLACEHOLDER_COVER = "https://via.placeholder.com/150x200";

// Fetch covers and links for every ISBN in a single request to Google Books
// Dynamic Links. That endpoint sends no CORS header, so it has to be loaded
// JSONP-style rather than with fetch(). Needs no API key.
function fetchAllBookLinks(isbns) {
  return new Promise((resolve, reject) => {
    const callbackName = `gbCallback${Date.now()}`;
    const bibkeys = isbns.map((isbn) => `ISBN:${isbn}`).join(',');
    const script = document.createElement('script');

    let timer;
    const cleanup = () => {
      clearTimeout(timer);
      delete window[callbackName];
      script.remove();
    };

    window[callbackName] = (data) => {
      cleanup();
      resolve(data || {});
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('Google Books request failed'));
    };

    timer = setTimeout(() => {
      cleanup();
      reject(new Error('Google Books request timed out'));
    }, 10000);

    script.src = `https://books.google.com/books?bibkeys=${encodeURIComponent(bibkeys)}&jscmd=viewapi&callback=${callbackName}`;
    document.head.appendChild(script);
  });
}

// Map one Dynamic Links entry onto the fields the bookshelf renders
function toBookDetails(book, entry) {
  // The default thumbnail is small and has a page-curl effect baked in;
  // zoom=1 without edge=curl gives a cleaner, larger cover.
  const cover = entry?.thumbnail_url
    ? entry.thumbnail_url.replace('zoom=5', 'zoom=1').replace('&edge=curl', '')
    : PLACEHOLDER_COVER;

  // A "noview" volume has no usable preview, so send those to its info page.
  const link = entry
    ? (entry.preview === 'noview' ? entry.info_url : entry.preview_url || entry.info_url)
    : null;

  return {
    title: book.title,
    cover: cover.replace('http://', 'https://'),
    previewLink: link || `https://books.google.com/books?isbn=${book.isbn}`,
  };
}

// Function to create placeholder elements for the books
function createBookPlaceholders() {
  const bookshelfContainer = document.querySelector('.bookshelf-container');
  bookshelfContainer.innerHTML = ''; // Clear existing content

  books.forEach(() => {
    const placeholder = document.createElement('div');
    placeholder.classList.add('book-item', 'book-item-placeholder');
    bookshelfContainer.appendChild(placeholder);
  });
}

// Function to display books on the bookshelf
async function displayBookshelf() {
  const bookshelfContainer = document.querySelector('.bookshelf-container');
  const placeholderItems = document.querySelectorAll('.book-item-placeholder');

  let volumes = {};
  try {
    volumes = await fetchAllBookLinks(books.map((book) => book.isbn));
  } catch (error) {
    // Still render the shelf from the hardcoded titles rather than leaving
    // every placeholder in place.
    console.warn('Could not load book covers:', error.message);
  }

  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    const bookDetails = toBookDetails(book, volumes[`ISBN:${book.isbn}`]);

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
