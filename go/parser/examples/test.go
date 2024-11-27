package main

import "fmt"

// ProcessData handles data processing
func ProcessData(data []byte) error {
	if len(data) == 0 {
		return fmt.Errorf("empty data")
	}
	return nil
}

// User represents a system user
type User struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}
