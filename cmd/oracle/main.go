package main

import (
	"fmt"
	"log"
	"math/rand"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/justinian/dice"
	"github.com/script-wizards/oracle/internal/table"
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

	rand.Seed(time.Now().Unix())
	chosen := table.Choose(out.Tables["outside"])

	result, nil := parseDice(chosen)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(result)
}

func findIndex(s string) (indices [][]int) {
	re := regexp.MustCompile(`\{(.*?)\}`)
	expressions := re.FindAllStringSubmatchIndex(s, -1)
	for _, ex := range expressions {
		indices = append(indices, []int{ex[2], ex[3]})
	}
	return indices
}

func parseDice(s string) (string, error) {
	exprIdx := findIndex(s)

	offset := 0
	for _, idx := range exprIdx {
		start, end := idx[0]+offset, idx[1]+offset
		expr := s[start:end]
		compareExpr, comparator, rh, err := compare(expr)
		if err != nil {
			return "", fmt.Errorf("parsing comparison: %w", err)
		}
		roll, _, err := dice.Roll(compareExpr)
		if err != nil {
			return "", fmt.Errorf("parsing dice expression: %w", err)
		}
		if comparator != "" {
			var result string
			switch comparator {
			case "<":
				result = fmt.Sprintf("%d: %t", roll.Int(), roll.Int() < rh)
			case ">":
				result = fmt.Sprintf("%d: %t", roll.Int(), roll.Int() > rh)
			}
			s = (s[:start] + result + s[end:])
			offset += len(result) - len(expr)
		} else {
			result := fmt.Sprintf("%s: %d", expr, roll.Int())
			s = (s[:start] + result + s[end:])
			offset += len(result) - len(expr)
		}
	}
	return s, nil
}

func compare(s string) (string, string, int, error) {
	if i := strings.Index(s, "<"); i >= 0 {
		rh, err := strconv.Atoi(s[i+1:])
		if err != nil {
			return "", "", -1, fmt.Errorf("converting to int: %w", err)
		}
		return s[:i], "<", rh, nil
	}
	if i := strings.Index(s, ">"); i >= 0 {
		rh, err := strconv.Atoi(s[i+1:])
		if err != nil {
			return "", "", -1, fmt.Errorf("converting to int: %w", err)
		}
		return s[:i], ">", rh, nil
	}
	return s, "", -1, nil
}
