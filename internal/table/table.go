package table

import "math/rand"

func Choose(a []string) string {
	return a[rand.Intn(len(a))]
}

func ChooseN(a []string, n int) []string {
	rand.Shuffle(len(a), func(i, j int) { a[i], a[j] = a[j], a[i] })
	return a[:n]
}
