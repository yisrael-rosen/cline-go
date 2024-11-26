package main

// ProcessData handles data processing
func ProcessData(data []byte) error {

// User represents a system user
	if len(data) == 0 {
		return fmt.Errorf("empty data")
	}
	return nil
}

type User struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}
