package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

var targets = []struct {
	os   string
	arch string
}{
	{"windows", "amd64"},
	{"linux", "amd64"},
	{"darwin", "amd64"},
	{"darwin", "arm64"},
}

func main() {
	// Get the root directory of the project
	rootDir, err := os.Getwd()
	if err != nil {
		fmt.Printf("Failed to get working directory: %v\n", err)
		os.Exit(1)
	}

	// Create bin directory if it doesn't exist
	binDir := filepath.Join(rootDir, "bin")
	if err := os.MkdirAll(binDir, 0755); err != nil {
		fmt.Printf("Failed to create bin directory: %v\n", err)
		os.Exit(1)
	}

	// Build for each target
	for _, target := range targets {
		fmt.Printf("Building for %s/%s...\n", target.os, target.arch)

		// Set environment variables for cross-compilation
		env := append(os.Environ(),
			fmt.Sprintf("GOOS=%s", target.os),
			fmt.Sprintf("GOARCH=%s", target.arch),
		)

		// Determine binary name based on target OS
		binaryName := "goparser"
		if target.os == "windows" {
			binaryName += ".exe"
		}
		outputPath := filepath.Join(binDir, fmt.Sprintf("%s_%s_%s", binaryName, target.os, target.arch))

		// Build command
		cmd := exec.Command("go", "build", "-o", outputPath, "../main.go")
		cmd.Env = env
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr

		// Execute build
		if err := cmd.Run(); err != nil {
			fmt.Printf("Failed to build for %s/%s: %v\n", target.os, target.arch, err)
			os.Exit(1)
		}

		fmt.Printf("Successfully built %s\n", outputPath)

		// If this is the current platform, copy it to the default name
		if target.os == runtime.GOOS && target.arch == runtime.GOARCH {
			defaultPath := filepath.Join(binDir, binaryName)
			if err := copyFile(outputPath, defaultPath); err != nil {
				fmt.Printf("Failed to copy to default name: %v\n", err)
				os.Exit(1)
			}
		}
	}
}

func copyFile(src, dst string) error {
	data, err := os.ReadFile(src)
	if err != nil {
		return err
	}
	return os.WriteFile(dst, data, 0755)
}
