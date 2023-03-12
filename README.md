# Oracle

```t
 █▀▀▀█ █▀▀█ █▀▀█ █▀▀ █   █▀▀
 █   █ █▄▄▀ █▄▄█ █   █   █▀▀
 █▄▄▄█ ▀ ▀▀ ▀  ▀ ▀▀▀ ▀▀▀ ▀▀▀
```

This tool is designed for picking random items from a table.

## Installation

```sh
go install github.com/script-wizards/sourcery/cmd/oracle
```

## Usage

You can run `oracle` with no arguments and it will load up a Yes/No oracle.

You can create custom tables defined in YAML files. See [example](examples/random-events.yaml). Pass the file path as an argument.

```sh
oracle random-events.yaml
```

### Dice Notation

Put dice notation in curly braces, like `There are {1d4} kobolds.` The following formats are supported:

- Standard
  - `xdy[[k|d][h|l]z][+/-c]`
  - Rolls and sums `x` `y`-sided dice, keeping or dropping the lowest or highest `z` dice and then adding or subtracting `c`.
  - Example: `4d6kh3+4`
- Fudge
  - `xdf[+/-c]`
  - Rolls and sums x fudge dice (-1 and 1), and then adding or subtracting `c`.
  - Example: `4df+4`
- Versus
  - `xdy[e|r]vt`
  - Rolls `x` `y`-sided dice, counting the number that roll `t` or higher.
- Comparison
  - `{xdy[<|>]t}`
  - Rolls `x` `y`-sided dice, then compares the result to `t`. Useful for `X-in-Y`.
  - Example: `1d6<3` for `2-in-6`
