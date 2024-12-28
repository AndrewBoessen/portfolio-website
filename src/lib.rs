mod utils;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
    alert("Hello, website!");
}

#[wasm_bindgen]
#[repr(i8)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Cell {
    Black = -1,
    White = 1,
}

#[wasm_bindgen]
pub struct Grid {
    width: u32,
    height: u32,
    cells: Vec<Cell>,
}

#[wasm_bindgen]
pub struct Canvas {
    grid_width: u32,
    grid_height: u32,
    width: u32,
    height: u32,
    grids: Vec<Grid>,
}
