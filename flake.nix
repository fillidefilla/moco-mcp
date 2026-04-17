{
  description = "MCP server for MOCO time tracking and project management";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            bashInteractive
            git
            nodejs_22
            pnpm
          ];

          shellHook = ''
            echo "moco-mcp dev shell"
            echo "  node: $(node --version)"
            echo "  pnpm: $(pnpm --version)"
          '';
        };
      }
    );
}
