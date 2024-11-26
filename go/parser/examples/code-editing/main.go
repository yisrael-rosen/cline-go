package main

import (
	"log"

	"github.com/rosen/go-parser/parser"
)

func main() {
	// Example 1: Adding context to methods
	addContextExample()

	// Example 2: Updating error handling
	updateErrorHandlingExample()

	// Example 3: Adding field tags
	addFieldTagsExample()

	// Example 4: Implementing interfaces
	implementInterfaceExample()

	// Example 5: Adding middleware
	addMiddlewareExample()
}

// Example 1: Adding context to methods
func addContextExample() {
	req := parser.EditRequest{
		Path:   "service.go",
		Symbol: "Process",
		Content: `func (s *Service) Process(ctx context.Context, data []byte) error {
			select {
			case <-ctx.Done():
				return ctx.Err()
			default:
				return s.processData(data)
			}
		}`,
	}

	if result := parser.Edit(req); !result.Success {
		log.Printf("Failed to add context: %s", result.Error)
	}
}

// Example 2: Updating error handling
func updateErrorHandlingExample() {
	req := parser.EditRequest{
		Path:   "handler.go",
		Symbol: "HandleRequest",
		Content: `func HandleRequest(w http.ResponseWriter, r *http.Request) {
			if err := process(r); err != nil {
				var httpErr *HTTPError
				if errors.As(err, &httpErr) {
					http.Error(w, httpErr.Message, httpErr.Code)
				} else {
					http.Error(w, "Internal server error", http.StatusInternalServerError)
				}
				return
			}
			w.WriteHeader(http.StatusOK)
		}`,
	}

	if result := parser.Edit(req); !result.Success {
		log.Printf("Failed to update error handling: %s", result.Error)
	}
}

// Example 3: Adding field tags
func addFieldTagsExample() {
	req := parser.EditRequest{
		Path:   "models.go",
		Symbol: "User",
		Content: `type User struct {
			ID        int       ` + "`json:\"id\" db:\"id\"`" + `
			Name      string    ` + "`json:\"name\" db:\"name\"`" + `
			Email     string    ` + "`json:\"email\" db:\"email\"`" + `
			CreatedAt time.Time ` + "`json:\"created_at\" db:\"created_at\"`" + `
		}`,
	}

	if result := parser.Edit(req); !result.Success {
		log.Printf("Failed to add field tags: %s", result.Error)
	}
}

// Example 4: Implementing interfaces
func implementInterfaceExample() {
	// First add the interface method
	req := parser.EditRequest{
		Path:     "service.go",
		Symbol:   "Service",
		Position: "after",
		Content: `func (s *Service) Close() error {
			if s.db != nil {
				if err := s.db.Close(); err != nil {
					return fmt.Errorf("failed to close db: %w", err)
				}
			}
			return nil
		}`,
	}

	if result := parser.Edit(req); !result.Success {
		log.Printf("Failed to implement interface: %s", result.Error)
	}
}

// Example 5: Adding middleware
func addMiddlewareExample() {
	req := parser.EditRequest{
		Path:   "middleware.go",
		Symbol: "AuthMiddleware",
		Content: `func AuthMiddleware(next http.Handler) http.Handler {
			return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				token := r.Header.Get("Authorization")
				if token == "" {
					http.Error(w, "Unauthorized", http.StatusUnauthorized)
					return
				}

				// Validate token
				user, err := validateToken(token)
				if err != nil {
					http.Error(w, "Invalid token", http.StatusUnauthorized)
					return
				}

				// Add user to context
				ctx := context.WithValue(r.Context(), "user", user)
				next.ServeHTTP(w, r.WithContext(ctx))
			})
		}`,
	}

	if result := parser.Edit(req); !result.Success {
		log.Printf("Failed to add middleware: %s", result.Error)
	}
}
