pub mod hopfield_canvas {
    use crate::log_i32;
    use rand::Rng;
    use std::ops::Mul;
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

    #[wasm_bindgen]
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

    #[wasm_bindgen]
    #[derive(Clone, Debug)]
    pub struct Grid {
        cells: Vec<Cell>,
        width: u32,
        height: u32,
    }

    #[wasm_bindgen]
    impl Grid {
        pub fn new(width: u32, height: u32) -> Self {
            let cells = vec![Cell::default(); (width * height) as usize];
            Self {
                cells,
                width,
                height,
            }
        }

        pub fn cells_ptr(&self) -> *const Cell {
            self.cells.as_ptr()
        }

        pub fn cells_len(&self) -> usize {
            self.cells.len()
        }

        pub fn width(&self) -> u32 {
            self.width
        }

        pub fn height(&self) -> u32 {
            self.height
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
        width: u32,
        height: u32,
        grid_width: u32,
        grid_height: u32,
        grids: Vec<Grid>,
    }

    #[wasm_bindgen]
    impl Canvas {
        pub fn new(width: u32, height: u32, grid_height: u32, grid_width: u32) -> Self {
            let grid_count = (width / grid_width) * (height / grid_height);
            let grids = (0..grid_count)
                .map(|_| Grid::new(grid_width, grid_height))
                .collect();

            Self {
                width,
                height,
                grid_width,
                grid_height,
                grids,
            }
        }

        pub fn height(&self) -> u32 {
            self.height
        }

        pub fn width(&self) -> u32 {
            self.width
        }

        pub fn get_grids_cells(&self, index: usize) -> *const Cell {
            self.grids[index].cells_ptr()
        }

        pub fn grids_len(&self) -> usize {
            self.grids.len()
        }

        pub fn step(&mut self, image: Vec<Cell>) -> bool {
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
        fn test_canvas_creation() {
            // Test valid canvas creation
            let canvas = Canvas::new(100, 100, 10, 10);
            assert_eq!(canvas.grids.len(), 100);
        }

        #[test]
        fn test_grid_cells_ptr_and_len() {
            let grid = Grid::new(5, 5);
            let ptr = grid.cells_ptr();
            let len = grid.cells_len();

            assert!(!ptr.is_null());
            assert_eq!(len, 25);
        }

        #[test]
        fn test_canvas_step() {
            let mut canvas = Canvas::new(20, 20, 10, 10);
            let initial_state: Vec<Cell> =
                canvas.grids.iter().flat_map(|g| g.cells.clone()).collect();
            let image: Vec<Cell> = vec![Cell::White; 400];

            let stable = canvas.step(image);
            let final_state: Vec<Cell> =
                canvas.grids.iter().flat_map(|g| g.cells.clone()).collect();

            assert!(!stable);
            assert_ne!(initial_state, final_state);
        }

        #[test]
        fn test_canvas_randomize() {
            let mut canvas = Canvas::new(30, 30, 10, 10);
            let initial_state: Vec<Cell> =
                canvas.grids.iter().flat_map(|g| g.cells.clone()).collect();

            canvas.randomize();
            let randomized_state: Vec<Cell> =
                canvas.grids.iter().flat_map(|g| g.cells.clone()).collect();

            assert_ne!(initial_state, randomized_state);
        }

        #[test]
        fn test_calculate_cell_energy() {
            let image = vec![Cell::White, Cell::Black, Cell::White, Cell::Black];
            let cells = vec![Cell::White, Cell::White, Cell::Black, Cell::Black];

            let energy = Canvas::calculate_cell_energy(0, &image, &cells);
            assert_eq!(energy, -2);

            let energy = Canvas::calculate_cell_energy(1, &image, &cells);
            assert_eq!(energy, 2);
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
