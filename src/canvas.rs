mod hopfield_canvas {
    use rand::Rng;
    use wasm_bindgen::prelude::*;

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

    fn rand_grid(width: u32, height: u32) -> Grid {
        let mut rng = rand::thread_rng();
        let mut cells = Vec::new();
        // fill in row major order
        for _ in 0..height {
            for _ in 0..width {
                cells.push(if rng.gen::<f32>() < 0.5 {
                    Cell::Black
                } else {
                    Cell::White
                });
            }
        }
        // return new random grid
        Grid {
            width,
            height,
            cells,
        }
    }
}
