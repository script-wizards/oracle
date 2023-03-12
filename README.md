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
