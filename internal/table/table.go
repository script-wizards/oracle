package table

import "math/rand"

var DefaultTable = map[string][]string{
	"Oracle": {
		"No, and…, and…",
		"No, and…",
		"No, and…",
		"No, and…",
		"No.",
		"No, but…",
		"No, but…",
		"No, but…",
		"Maybe, but…",
		"Maybe.",
		"Maybe.",
		"Maybe, and…",
		"Yes, but…",
		"Yes, but…",
		"Yes, but…",
		"Yes.",
		"Yes, and…",
		"Yes, and…",
		"Yes, and…",
		"Yes, and…, and…",
	},
}

func Choose(a []string) string {
	return a[rand.Intn(len(a))]
}

func ChooseN(a []string, n int) []string {
	rand.Shuffle(len(a), func(i, j int) { a[i], a[j] = a[j], a[i] })
	return a[:n]
}
