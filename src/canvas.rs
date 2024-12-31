pub mod hopfield_canvas {
    use rand::Rng;
    use std::ops::Mul;
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

    impl Cell {
        fn flip(self) -> Self {
            match self {
                Cell::White => Cell::Black,
                Cell::Black => Cell::White,
            }
        }
    }

    // Implement Mul for Cell * Cell
    impl Mul for Cell {
        type Output = Self;

        fn mul(self, rhs: Self) -> Self::Output {
            match (self as i8) * (rhs as i8) {
                1 => Cell::White,
                -1 => Cell::Black,
                _ => unreachable!("Product of -1 and 1 can only be -1 or 1"),
            }
        }
    }

    // Implement Mul for Cell * i8
    impl Mul<i8> for Cell {
        type Output = Self;

        fn mul(self, rhs: i8) -> Self::Output {
            match (self as i8) * rhs {
                x if x > 0 => Cell::White,
                x if x < 0 => Cell::Black,
                _ => Cell::Black, // Handle multiplication by 0
            }
        }
    }

    // Implement Mul for i8 * Cell
    impl Mul<Cell> for i8 {
        type Output = Cell;

        fn mul(self, rhs: Cell) -> Cell {
            rhs * self
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

        pub fn step(&mut self, image: &[Cell]) -> bool {
            let height = self.grid_height;
            let width = self.grid_width;
            // Use iterator to check if any grid was modified
            self.grids
                .iter_mut()
                .enumerate()
                .fold(true, |stable, (index, grid)| {
                    let grid_start = (index as u32 * width * height) as usize;
                    let grid_slice = &image[grid_start..grid_start + (width * height) as usize];

                    // Find cell with minimum energy
                    let (min_index, min_energy) = (0..grid.cells.len())
                        .map(|i| {
                            let energy = Self::calculate_cell_energy(i, grid_slice, &grid.cells);
                            (i, energy)
                        })
                        .min_by_key(|&(_, energy)| energy)
                        .unwrap();

                    // Update cell if energy is negative
                    if min_energy < 0 {
                        grid.cells[min_index] = grid.cells[min_index].flip();
                        stable && false
                    } else {
                        stable
                    }
                })
        }

        // Helper function to calculate energy for a single cell
        fn calculate_cell_energy(i: usize, image: &[Cell], cells: &[Cell]) -> i32 {
            let energy = image.iter().enumerate().fold(0, |energy, (j, &w)| {
                let w_val = (w * image[i]) as i32;
                energy + (w_val * cells[j] as i32)
            });

            // ΔE_i = -2 * y_i * (∑_j w_ij * y_j + b_i)
            -2 * cells[i] as i32 * (energy + image[i] as i32)
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

    #[cfg(test)]
    mod tests {
        use super::*;
        use wasm_bindgen_test::*;

        wasm_bindgen_test_configure!(run_in_browser);

        #[test]
        fn test_cell_operations() {
            // Test cell default
            assert_eq!(Cell::default(), Cell::White);

            // Test cell flip
            assert_eq!(Cell::White.flip(), Cell::Black);
            assert_eq!(Cell::Black.flip(), Cell::White);

            // Test cell multiplication
            assert_eq!(Cell::White * Cell::White, Cell::White);
            assert_eq!(Cell::Black * Cell::Black, Cell::White);
            assert_eq!(Cell::White * Cell::Black, Cell::Black);
            assert_eq!(Cell::Black * Cell::White, Cell::Black);

            // Test cell multiplication with i8
            assert_eq!(Cell::White * 1_i8, Cell::White);
            assert_eq!(Cell::White * -1_i8, Cell::Black);
            assert_eq!(Cell::Black * 1_i8, Cell::Black);
            assert_eq!(Cell::Black * -1_i8, Cell::White);
            assert_eq!(Cell::White * 0_i8, Cell::Black); // Test zero case
        }

        #[test]
        fn test_grid_creation() {
            let grid = Grid::new(3, 4);
            assert_eq!(grid.width, 3);
            assert_eq!(grid.height, 4);
            assert_eq!(grid.cells.len(), 12);

            // Test all cells are initialized to default (White)
            assert!(grid.cells.iter().all(|&cell| cell == Cell::default()));
        }

        #[test]
        fn test_grid_cell_operations() {
            let mut grid = Grid::new(3, 3);

            // Test get_cell
            assert_eq!(grid.get_cell(0, 0), Some(Cell::White));
            assert_eq!(grid.get_cell(2, 2), Some(Cell::White));
            assert_eq!(grid.get_cell(3, 3), None);

            // Test set_cell
            assert!(grid.set_cell(1, 1, Cell::Black));
            assert_eq!(grid.get_cell(1, 1), Some(Cell::Black));

            // Test setting out of bounds
            assert!(!grid.set_cell(3, 3, Cell::Black));
        }

        #[test]
        fn test_canvas_creation() {
            // Test valid canvas creation
            let canvas = Canvas::new(100, 100, 10, 10);
            assert!(canvas.is_ok());
            let canvas = canvas.unwrap();
            assert_eq!(canvas.grids.len(), 100);

            // Test invalid dimensions
            let invalid_canvas = Canvas::new(100, 100, 15, 15);
            assert!(matches!(
                invalid_canvas,
                Err(CanvasError::InvalidWidth(100, 15))
            ));
        }

        #[test]
        fn test_canvas_grid_access() {
            let canvas = Canvas::new(100, 100, 10, 10).unwrap();

            // Test valid grid access
            assert!(canvas.get_grid(5, 5).is_some());
            assert!(canvas.get_grid(95, 95).is_some());

            // Test out of bounds access
            assert!(canvas.get_grid(100, 100).is_none());
        }

        #[test]
        fn test_canvas_step() {
            let mut canvas = Canvas::new(20, 20, 10, 10).unwrap();
            let image = gen_image(20, 20);

            // Test step returns true when stable
            let result = canvas.step(&image);
            assert!(result == false);

            // Verify image length matches canvas dimensions
            assert_eq!(image.len(), (canvas.width * canvas.height) as usize);
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

        #[test]
        fn test_grid_randomization() {
            let mut grid = Grid::new(5, 5);
            let initial_state: Vec<Cell> = grid.cells.clone();

            grid.randomize();

            // Test that cells have changed (note: this could theoretically fail with very low probability)
            assert_ne!(grid.cells, initial_state);

            // Test that all cells are valid
            assert!(grid
                .cells
                .iter()
                .all(|&cell| cell == Cell::White || cell == Cell::Black));
        }
    }
}
