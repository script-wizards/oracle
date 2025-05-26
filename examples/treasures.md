# Treasure Hoard

An example showcasing complex nested subtables and multiple references.

```perchance
title
  Treasure Hoard

output
  You discover [container] containing [treasure] and [treasure]

container
  an ornate chest
  a leather pouch
  a hidden compartment
  a burial urn
  a magical coffer

treasure
  [coins] coins
  [gems]
  [items]

coins
  2d6 × 10 gold
  1d4 × 100 silver
  3d8 × 50 copper

gems
  a sparkling ruby
  an emerald shard
  a polished sapphire
  a rough diamond
  a piece of jade

items
  a masterwork weapon
  fine silk clothing
  ancient maps
  rare spices
  quality tools
```

**Try this**: Notice how `[treasure]` appears twice in the output, and each can reference different subtables like `[coins]` or `[gems]`. Click on any bracketed text to reroll just that part!
