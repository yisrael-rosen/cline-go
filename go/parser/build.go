//go:build ignore
// +build ignore

package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

func main() {
	// Get the current directory
	dir, err := os.Getwd()
	if err != nil {
		fmt.Printf("Error getting working directory: %v\n", err)
		os.Exit(1)
	}

	// Initialize module if needed
	cmd := exec.Command("go", "mod", "tidy")
	cmd.Dir = dir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		fmt.Printf("Error running go mod tidy: %v\n", err)
		os.Exit(1)
	}

	// Build for current platform
	fmt.Println("Building for current platform...")
	buildTarget := filepath.Join(dir, "bin", getBinaryName())
	os.MkdirAll(filepath.Dir(buildTarget), 0755)

	cmd = exec.Command("go", "build", "-o", buildTarget, ".")
	cmd.Dir = dir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		fmt.Printf("Error building binary: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Successfully built binary at: %s\n", buildTarget)

	// Run tests
	fmt.Println("Running tests...")
	cmd = exec.Command("go", "test", "./...")
	cmd.Dir = dir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		fmt.Printf("Error running tests: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("Build and tests completed successfully!")
}

func getBinaryName() string {
	binaryName := "goparser"
	if runtime.GOOS == "windows" {
		binaryName += ".exe"
	}
	return binaryName
}
