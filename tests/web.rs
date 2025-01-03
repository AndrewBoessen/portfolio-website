//! Test suite for the Web and headless browsers.

#![cfg(target_arch = "wasm32")]

extern crate wasm_bindgen_test;
use wasm_bindgen_test::*;

use website::canvas::hopfield_canvas::{Canvas, Cell, Grid};
use website::gen_image;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
fn test_canvas_creation() {
    let canvas = Canvas::new(100, 100, 10, 10);
    assert_eq!(canvas.width(), 100);
    assert_eq!(canvas.height(), 100);
    assert_eq!(canvas.grids_len(), 100);
}

#[wasm_bindgen_test]
fn test_grid_creation() {
    let grid = Grid::new(5, 5);
    assert_eq!(grid.width(), 5);
    assert_eq!(grid.height(), 5);
    assert_eq!(grid.cells_len(), 25);
}

#[wasm_bindgen_test]
fn test_grid_randomization() {
    let mut grid = Grid::new(10, 10);
    let initial_state: Vec<Cell> = (0..100)
        .map(|_| unsafe { *grid.cells_ptr().add(0) })
        .collect();
    grid.randomize();
    let randomized_state: Vec<Cell> = (0..100)
        .map(|_| unsafe { *grid.cells_ptr().add(0) })
        .collect();
    assert_ne!(initial_state, randomized_state);
}

#[wasm_bindgen_test]
fn test_canvas_step() {
    let mut canvas = Canvas::new(20, 20, 10, 10);
    let image = gen_image(20, 20);
    let stable = canvas.step(image);
    assert!(!stable);
}

#[wasm_bindgen_test]
fn test_canvas_randomize() {
    let mut canvas = Canvas::new(30, 30, 10, 10);
    let initial_state: Vec<Cell> = (0..900)
        .map(|i| unsafe { *canvas.get_grids_cells(i / 100).add(i % 100) })
        .collect();
    canvas.randomize();
    let randomized_state: Vec<Cell> = (0..900)
        .map(|i| unsafe { *canvas.get_grids_cells(i / 100).add(i % 100) })
        .collect();
    assert_ne!(initial_state, randomized_state);
}

#[wasm_bindgen_test]
fn test_gen_image() {
    let width = 20;
    let height = 15;
    let image = gen_image(height, width);

    assert_eq!(image.len(), (width * height) as usize);
    assert!(image
        .iter()
        .all(|&cell| cell == Cell::White || cell == Cell::Black));
}
