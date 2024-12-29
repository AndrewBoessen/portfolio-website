mod hopfield_canvas {
    use rand::Rng;
    use thiserror::Error;
    use wasm_bindgen::prelude::*;

    #[wasm_bindgen]
    #[repr(i8)]
    #[derive(Clone, Copy, Debug, PartialEq, Eq)]
    pub enum Cell {
        Black = -1,
        White = 1,
    }

    impl Default for Cell {
        fn default() -> Self {
            Cell::White
        }
    }

    #[derive(Error, Debug)]
    pub enum CanvasError {
        #[error("Canvas width {0} is not divisible by grid width {1}")]
        InvalidWidth(u32, u32),
        #[error("Canvas height {0} is not divisible by grid height {1}")]
        InvalidHeight(u32, u32),
    }

    #[wasm_bindgen]
    #[derive(Clone, Debug)]
    pub struct Grid {
        width: u32,
        height: u32,
        cells: Vec<Cell>,
    }

    impl Grid {
        pub fn new(width: u32, height: u32) -> Self {
            let cells = vec![Cell::default(); (width * height) as usize];
            Self {
                width,
                height,
                cells,
            }
        }

        pub fn get_cell(&self, x: u32, y: u32) -> Option<Cell> {
            if x >= self.width || y >= self.height {
                None
            } else {
                Some(self.cells[(y * self.width + x) as usize])
            }
        }

        pub fn set_cell(&mut self, x: u32, y: u32, cell: Cell) -> bool {
            if x >= self.width || y >= self.height {
                false
            } else {
                self.cells[(y * self.width + x) as usize] = cell;
                true
            }
        }

        pub fn randomize(&mut self) {
            let mut rng = rand::thread_rng();
            for cell in &mut self.cells {
                *cell = if rng.gen::<f32>() < 0.5 {
                    Cell::Black
                } else {
                    Cell::White
                };
            }
        }
    }

    #[wasm_bindgen]
    #[derive(Clone, Debug)]
    pub struct Canvas {
        grid_width: u32,
        grid_height: u32,
        width: u32,
        height: u32,
        grids: Vec<Grid>,
    }

    impl Canvas {
        pub fn new(
            width: u32,
            height: u32,
            grid_height: u32,
            grid_width: u32,
        ) -> Result<Self, CanvasError> {
            if width % grid_width != 0 {
                return Err(CanvasError::InvalidWidth(width, grid_width));
            }
            if height % grid_height != 0 {
                return Err(CanvasError::InvalidHeight(height, grid_height));
            }

            let grid_count = (width / grid_width) * (height / grid_height);
            let grids = (0..grid_count)
                .map(|_| Grid::new(grid_width, grid_height))
                .collect();

            Ok(Self {
                grid_width,
                grid_height,
                width,
                height,
                grids,
            })
        }

        pub fn randomize(&mut self) {
            for grid in &mut self.grids {
                grid.randomize();
            }
        }

        pub fn get_grid(&self, x: u32, y: u32) -> Option<&Grid> {
            let grid_x = x / self.grid_width;
            let grid_y = y / self.grid_height;
            let index = (grid_y * (self.width / self.grid_width) + grid_x) as usize;
            self.grids.get(index)
        }

        pub fn get_grid_mut(&mut self, x: u32, y: u32) -> Option<&mut Grid> {
            let grid_x = x / self.grid_width;
            let grid_y = y / self.grid_height;
            let index = (grid_y * (self.width / self.grid_width) + grid_x) as usize;
            self.grids.get_mut(index)
        }
    }

    pub fn gen_image(height: u32, width: u32) -> Vec<Cell> {
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
}
