pub mod canvas;
mod utils;

use crate::canvas::hopfield_canvas::Cell;
use rand::Rng;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn gen_image(height: u32, width: u32) -> Vec<Cell> {
    utils::set_panic_hook();
    let mut rng = rand::thread_rng();
    // linspace for border gradients
    let gradient: Vec<f32> = (0..width / 4)
        .map(|i| i as f32 / (width / 4 - 1) as f32)
        .collect();
    let reverse_grad: Vec<f32> = gradient.iter().rev().cloned().collect();
    let blank: Vec<f32> = vec![1.0; width as usize / 2];

    let probs: Vec<f32> = [gradient, blank, reverse_grad].concat();

    // Pixel values of image {-1,1}
    // Pre-allocate with capacity for better performance
    let mut pixel_vals = Vec::with_capacity((width * height) as usize);

    pixel_vals.extend((0..width * height).map(|i| {
        if rng.gen::<f32>() < probs[i as usize % width as usize] {
            Cell::White
        } else {
            Cell::Black
        }
    }));

    // return pixels
    pixel_vals
}

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
    alert("Hello, website!");
}

#[test]
fn test_image_generation() {
    let width = 20;
    let height = 15;
    let image = gen_image(height, width);

    // Check dimensions
    assert_eq!(image.len(), (width * height) as usize);

    // Verify all cells are valid
    assert!(image
        .iter()
        .all(|&cell| cell == Cell::White || cell == Cell::Black));
}
