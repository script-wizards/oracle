package main

import (
	"fmt"
	"log"
	"math/rand"
	"os"
	"strconv"
	"time"

	"gopkg.in/yaml.v3"
)

type Data struct {
	Tables map[string][]string `yaml:"tables"`
}

func main() {
	file, err := os.ReadFile("random-events.yaml")
	if err != nil {
		log.Fatal(err)
	}

	out := Data{}
	if err := yaml.Unmarshal(file, &out); err != nil {
		log.Fatal(err)
	}

	for name, table := range out.Tables {
		fmt.Println(name)
		for i, event := range table {
			fmt.Printf("- %s: %s\n", strconv.Itoa(i+1), event)
		}
	}

	outside := out.Tables["outside"]
	rand.Seed(time.Now().Unix())
	message := fmt.Sprint("\n\nRandom Events Outside the Mound (1-in-6 Chance Every Two Turns)\n", chooseFromTable(outside))
	fmt.Println(message)

	fmt.Println("Choose 2 from Outside")
	for _, s := range chooseNfromTable(outside, 2) {
		fmt.Println(s)
	}
}

func chooseFromTable(a []string) string {
	return a[rand.Intn(len(a))]
}

func chooseNfromTable(a []string, n int) []string {
	rand.Shuffle(len(a), func(i, j int) { a[i], a[j] = a[j], a[i] })
	return a[:n]
}
