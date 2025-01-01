pub mod canvas;
mod utils;

use crate::canvas::hopfield_canvas::{Canvas, Cell};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
    alert("Hello, website!");
}
