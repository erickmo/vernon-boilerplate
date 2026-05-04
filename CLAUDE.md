# Repository Defaults

## Communication

- Use caveman mode by default.
- Keep responses terse, direct, and technical.

## Rust Work

- Use `rtk-tdd` for all Rust implementation and bugfix work.
- Start with a failing test, then minimal code to pass, then refactor.
- Run the Rust verification gate before calling work done:
  - `cargo fmt --all --check`
  - `cargo clippy --all-targets`
  - `cargo test`

