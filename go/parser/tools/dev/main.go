package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

type Config struct {
	ProjectRoot string   `json:"projectRoot"`
	TestDirs    []string `json:"testDirs"`
	Excludes    []string `json:"excludes"`
	Commands    struct {
		PreTest  []string `json:"preTest"`
		PostTest []string `json:"postTest"`
		Build    []string `json:"build"`
	} `json:"commands"`
}

func main() {
	// Command line flags
	watch := flag.Bool("watch", false, "Watch for file changes")
	test := flag.Bool("test", false, "Run tests")
	build := flag.Bool("build", false, "Build project")
	docs := flag.Bool("docs", false, "Generate documentation")
	stats := flag.Bool("stats", false, "Show project statistics")
	configPath := flag.String("config", "dev-config.json", "Path to config file")
	flag.Parse()

	// Load configuration
	config, err := loadConfig(*configPath)
	if err != nil {
		log.Fatalf("Error loading config: %v", err)
	}

	// Execute requested actions
	if *watch {
		watchFiles(config)
	}
	if *test {
		runTests(config)
	}
	if *build {
		buildProject(config)
	}
	if *docs {
		generateDocs(config)
	}
	if *stats {
		showStats(config)
	}
}

func loadConfig(path string) (*Config, error) {
	data, err := ioutil.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read config: %v", err)
	}

	var config Config
	if err := json.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("failed to parse config: %v", err)
	}

	return &config, nil
}

func watchFiles(config *Config) {
	log.Println("Watching for file changes...")

	lastRun := time.Now()
	for {
		time.Sleep(time.Second)

		// Check for file changes
		changed := false
		err := filepath.Walk(".", func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}

			// Skip excluded paths
			for _, exclude := range config.Excludes {
				if strings.HasPrefix(path, exclude) {
					return filepath.SkipDir
				}
			}

			// Check if file was modified
			if !info.IsDir() && info.ModTime().After(lastRun) {
				changed = true
				log.Printf("File changed: %s", path)
			}

			return nil
		})

		if err != nil {
			log.Printf("Error walking files: %v", err)
			continue
		}

		if changed {
			log.Println("Running tests...")
			runTests(config)
			lastRun = time.Now()
		}
	}
}

func runTests(config *Config) {
	// Run pre-test commands
	for _, cmd := range config.Commands.PreTest {
		if err := runCommand(cmd); err != nil {
			log.Printf("Pre-test command failed: %v", err)
			return
		}
	}

	// Run tests
	for _, dir := range config.TestDirs {
		cmd := exec.Command("go", "test", "-v", "./"+dir)
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Run(); err != nil {
			log.Printf("Tests failed in %s: %v", dir, err)
			return
		}
	}

	// Run post-test commands
	for _, cmd := range config.Commands.PostTest {
		if err := runCommand(cmd); err != nil {
			log.Printf("Post-test command failed: %v", err)
			return
		}
	}

	log.Println("All tests passed!")
}

func buildProject(config *Config) {
	log.Println("Building project...")

	// Run build commands
	for _, cmd := range config.Commands.Build {
		if err := runCommand(cmd); err != nil {
			log.Printf("Build command failed: %v", err)
			return
		}
	}

	log.Println("Build completed!")
}

func generateDocs(config *Config) {
	log.Println("Generating documentation...")

	// Generate Go docs
	cmd := exec.Command("godoc", "-http=:6060")
	if err := cmd.Start(); err != nil {
		log.Printf("Failed to start godoc server: %v", err)
		return
	}

	// Generate TypeScript docs
	cmd = exec.Command("npm", "run", "docs")
	cmd.Dir = "wrapper"
	if err := cmd.Run(); err != nil {
		log.Printf("Failed to generate TypeScript docs: %v", err)
		return
	}

	log.Println("Documentation generated!")
	log.Println("Go docs available at: http://localhost:6060/pkg/goparser/")
	log.Println("TypeScript docs available in: wrapper/docs/")
}

func showStats(config *Config) {
	log.Println("Project Statistics:")

	// Count lines of code
	var totalLines, goLines, tsLines int
	err := filepath.Walk(".", func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Skip excluded paths
		for _, exclude := range config.Excludes {
			if strings.HasPrefix(path, exclude) {
				return filepath.SkipDir
			}
		}

		if !info.IsDir() {
			ext := filepath.Ext(path)
			data, err := ioutil.ReadFile(path)
			if err != nil {
				return err
			}

			lines := strings.Count(string(data), "\n") + 1
			totalLines += lines

			switch ext {
			case ".go":
				goLines += lines
			case ".ts":
				tsLines += lines
			}
		}

		return nil
	})

	if err != nil {
		log.Printf("Error counting lines: %v", err)
		return
	}

	fmt.Printf("Total lines of code: %d\n", totalLines)
	fmt.Printf("Go lines: %d\n", goLines)
	fmt.Printf("TypeScript lines: %d\n", tsLines)

	// Count tests
	var totalTests int
	for _, dir := range config.TestDirs {
		cmd := exec.Command("go", "test", "-list", ".", "./"+dir)
		output, err := cmd.Output()
		if err != nil {
			log.Printf("Error counting tests in %s: %v", dir, err)
			continue
		}
		totalTests += strings.Count(string(output), "\n")
	}

	fmt.Printf("Total tests: %d\n", totalTests)
}

func runCommand(command string) error {
	parts := strings.Fields(command)
	if len(parts) == 0 {
		return fmt.Errorf("empty command")
	}

	cmd := exec.Command(parts[0], parts[1:]...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}
