{
  description = "Andrew Boessen's portfolio website — Rust/WASM + webpack dev environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, flake-utils, rust-overlay }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        overlays = [ (import rust-overlay) ];
        pkgs = import nixpkgs { inherit system overlays; };

        # Stable Rust toolchain with the wasm target the build needs.
        rustToolchain = pkgs.rust-bin.stable.latest.default.override {
          targets = [ "wasm32-unknown-unknown" ];
        };
      in
      {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            rustToolchain
            wasm-pack          # driven by @wasm-tool/wasm-pack-plugin during `npm run build`
            wasm-bindgen-cli   # so wasm-pack doesn't try to fetch its own
            binaryen           # provides wasm-opt for release optimization
            nodejs             # node + npm for webpack
          ];

          # Point wasm-pack at the Nix-provided tools instead of downloading them.
          env = {
            WASM_PACK_CACHE = ".wasm-pack-cache";
          };

          shellHook = ''
            echo "portfolio-website dev shell"
            echo "  rustc      $(rustc --version)"
            echo "  wasm-pack  $(wasm-pack --version)"
            echo "  node       $(node --version)"
            echo ""
            echo "  npm install && npm run build   # build into dist/"
            echo "  npm start                      # serve dist/"
          '';
        };
      });
}
