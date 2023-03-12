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
	"gopkg.in/yaml.v3"

	"github.com/charmbracelet/bubbles/key"
	"github.com/charmbracelet/bubbles/list"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/script-wizards/oracle/internal/table"
)

type Data struct {
	Tables map[string][]string `yaml:"tables"`
}

var (
	appStyle = lipgloss.NewStyle().Padding(1, 2)

	titleStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#232323")).
			Background(lipgloss.Color("#ffa227")).
			Padding(0, 1)

	statusMessageStyle = lipgloss.NewStyle().
				Foreground(lipgloss.AdaptiveColor{Light: "#ffa227", Dark: "#ffa227"}).
				Render
)

type item struct {
	title       string
	description string
}

func (i item) Title() string       { return i.title }
func (i item) Description() string { return i.description }
func (i item) FilterValue() string { return i.title }

type listKeyMap struct {
	toggleHelpMenu key.Binding
}

func newListKeyMap() *listKeyMap {
	return &listKeyMap{
		toggleHelpMenu: key.NewBinding(
			key.WithKeys("H"),
			key.WithHelp("H", "toggle help"),
		),
	}
}

type model struct {
	list         list.Model
	keys         *listKeyMap
	delegateKeys *delegateKeyMap
}

var data Data

func readYAML() []list.Item {
	args := os.Args[1:]
	if len(args) > 0 {
		file, err := os.ReadFile(args[0])
		if err != nil {
			log.Fatal(err)
		}

		if err := yaml.Unmarshal(file, &data); err != nil {
			log.Fatal(err)
		}
	} else {
		data.Tables = table.DefaultTable
	}

	var items []list.Item

	for title, entries := range data.Tables {
		var desc string
		for i, entry := range entries {
			desc += fmt.Sprintf("- %s: %s\n", strconv.Itoa(i+1), entry)
		}
		items = append(items, item{title: title, description: strings.TrimSuffix(desc, "\n")})
	}
	return items
}

func newModel() model {
	var (
		delegateKeys = newDelegateKeyMap()
		listKeys     = newListKeyMap()
	)

	items := readYAML()

	delegate := newItemDelegate(delegateKeys)
	m := list.New(items, delegate, 0, 0)
	m.Title = "Oracle"
	m.Styles.Title = titleStyle
	m.AdditionalFullHelpKeys = func() []key.Binding {
		return []key.Binding{
			listKeys.toggleHelpMenu,
		}
	}
	m.StatusMessageLifetime = 10 * time.Minute
	m.SetShowStatusBar(false)

	return model{
		list:         m,
		keys:         listKeys,
		delegateKeys: delegateKeys,
	}
}

func (m model) Init() tea.Cmd {
	return tea.EnterAltScreen
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmds []tea.Cmd

	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		h, v := appStyle.GetFrameSize()
		m.list.SetSize(msg.Width-h, msg.Height-v)

	case tea.KeyMsg:
		if m.list.FilterState() == list.Filtering {
			break
		}

		switch {
		case key.Matches(msg, m.keys.toggleHelpMenu):
			m.list.SetShowHelp(!m.list.ShowHelp())
			return m, nil
		}
	}

	newListModel, cmd := m.list.Update(msg)
	m.list = newListModel
	cmds = append(cmds, cmd)

	return m, tea.Batch(cmds...)
}

func (m model) View() string {
	return appStyle.Render(m.list.View())
}

func main() {
	rand.Seed(time.Now().UTC().UnixNano())

	if _, err := tea.NewProgram(newModel()).Run(); err != nil {
		fmt.Println("Error running program:", err)
		os.Exit(1)
	}
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
