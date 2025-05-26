# Forest Encounters

Examples showcasing Oracle's table features, from simple to complex.

## Weather

The simplest possible table - just multiple entries in the output section.

```perchance
title
  Weather

output
  Sunny and warm
  Cloudy with light breeze
  Rainy and cool
  Foggy and mysterious
  Stormy with heavy winds
  Clear and cold
```

**Try this**: This is the most basic table format. Each roll picks one random entry from the output section.

## Forest Encounters

```perchance
title
  Forest Encounters

output
  You encounter [creature] near [location]

creature
  a pack of wolves
  a wandering merchant
  an ancient tree spirit
  bandits demanding toll
  a lost child

location
  a babbling brook
  an old stone bridge
  a clearing with wildflowers
  ancient ruins covered in moss
  a magical spring
```

**Try this**: This shows subtables in action. Roll the table, then click on `[creature]` or `[location]` in the result to reroll just that part!

## Weather Generator

```perchance
title
  Weather Generator

output
  The weather is [conditions] with [temperature] temperatures

conditions
  clear skies
  light rain
  heavy fog
  strong winds
  thunderstorms
  snow flurries

temperature
  freezing
  cold
  mild
  warm
  hot
  sweltering
```

## NPC Reactions

```perchance
title
  NPC Reactions

output
  [name] greets you with [reaction]

name
  Elara the Merchant
  Gareth the Blacksmith
  Old Tom the Farmer
  Sister Meredith
  Captain Aldric
  Whisper the Rogue

reaction
  friendly enthusiasm
  cautious suspicion
  open hostility
  fearful nervousness
  curious interest
  complete indifference
```
