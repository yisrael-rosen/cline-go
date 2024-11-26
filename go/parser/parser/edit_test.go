package parser

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestEdit(t *testing.T) {
	// Create a temporary directory for test files
	tmpDir, err := os.MkdirTemp("", "edit_test")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(tmpDir)

	tests := []struct {
		name     string
		initial  string
		req      EditRequest
		want     EditResult
		validate func(t *testing.T, path string)
	}{
		{
			name: "add context parameter",
			initial: `package test
// Process processes data without context
func Process(data []byte) error {
	return nil
}`,
			req: EditRequest{
				Symbol: "Process",
				Content: `// Process processes data with context for better control
func Process(ctx context.Context, data []byte) error {
	return nil
}`,
			},
			want: EditResult{
				Success: true,
			},
			validate: func(t *testing.T, path string) {
				content, err := os.ReadFile(path)
				if err != nil {
					t.Fatal(err)
				}
				contentStr := string(content)
				if !strings.Contains(contentStr, "ctx context.Context") {
					t.Error("Context parameter not added")
				}
				if !strings.Contains(contentStr, "processes data with context") {
					t.Error("New documentation not added")
				}
				if strings.Contains(contentStr, "processes data without context") {
					t.Error("Old documentation still present")
				}
			},
		},
		{
			name: "add struct field tags",
			initial: `package test
// User represents a basic user without metadata
type User struct {
	ID   int
	Name string
}`,
			req: EditRequest{
				Symbol: "User",
				Content: `// User represents a user with JSON and DB metadata
type User struct {
	ID   int    ` + "`json:\"id\" db:\"id\"`" + `
	Name string ` + "`json:\"name\" db:\"name\"`" + `
}`,
			},
			want: EditResult{
				Success: true,
			},
			validate: func(t *testing.T, path string) {
				content, err := os.ReadFile(path)
				if err != nil {
					t.Fatal(err)
				}
				contentStr := string(content)
				if !strings.Contains(contentStr, "represents a user with JSON and DB metadata") {
					t.Error("New documentation not added")
				}
				if strings.Contains(contentStr, "represents a basic user without metadata") {
					t.Error("Old documentation still present")
				}
				if !strings.Contains(contentStr, "`json:\"id\"") && !strings.Contains(contentStr, "`json:\"id\" db:\"id\"`") {
					t.Error("JSON tags not added")
				}
				if !strings.Contains(contentStr, "db:\"name\"") && !strings.Contains(contentStr, "`db:\"name\"`") {
					t.Error("DB tags not added")
				}
			},
		},
		{
			name: "implement interface method",
			initial: `package test
// Handler handles basic operations
type Handler interface {
	Handle(context.Context) error
}
// Service provides basic functionality
type Service struct{}`,
			req: EditRequest{
				Symbol:   "Service",
				Position: "after",
				Content: `// Handle implements Handler interface with advanced error handling
func (s *Service) Handle(ctx context.Context) error {
	return nil
}`,
			},
			want: EditResult{
				Success: true,
			},
			validate: func(t *testing.T, path string) {
				content, err := os.ReadFile(path)
				if err != nil {
					t.Fatal(err)
				}
				contentStr := string(content)
				if !strings.Contains(contentStr, "implements Handler interface with advanced error handling") {
					t.Error("Method documentation not added")
				}
				if !strings.Contains(contentStr, "func (s *Service) Handle") {
					t.Error("Interface method not implemented")
				}
			},
		},
		{
			name: "add method before existing",
			initial: `package test
// Service provides data processing
type Service struct{}
// Process handles data processing
func (s *Service) Process() error {
	return nil
}`,
			req: EditRequest{
				Symbol:   "Process",
				Position: "before",
				Content: `// Validate ensures data integrity before processing
func (s *Service) Validate() error {
	return nil
}`,
			},
			want: EditResult{
				Success: true,
			},
			validate: func(t *testing.T, path string) {
				content, err := os.ReadFile(path)
				if err != nil {
					t.Fatal(err)
				}
				validateStr := string(content)
				if !strings.Contains(validateStr, "ensures data integrity") {
					t.Error("New method documentation not added")
				}
				if !strings.Contains(validateStr, "func (s *Service) Validate") {
					t.Error("Method not added")
				}
				validateIdx := strings.Index(validateStr, "Validate")
				processIdx := strings.Index(validateStr, "Process")
				if validateIdx > processIdx {
					t.Error("Method not added before target")
				}
			},
		},
		{
			name: "add method after existing",
			initial: `package test
// Service provides data processing
type Service struct{}
// Process handles initial data processing
func (s *Service) Process() error {
	return nil
}`,
			req: EditRequest{
				Symbol:   "Process",
				Position: "after",
				Content: `// Cleanup performs post-processing cleanup operations
func (s *Service) Cleanup() error {
	return nil
}`,
			},
			want: EditResult{
				Success: true,
			},
			validate: func(t *testing.T, path string) {
				content, err := os.ReadFile(path)
				if err != nil {
					t.Fatal(err)
				}
				validateStr := string(content)
				if !strings.Contains(validateStr, "performs post-processing cleanup") {
					t.Error("New method documentation not added")
				}
				if !strings.Contains(validateStr, "func (s *Service) Cleanup") {
					t.Error("Method not added")
				}
				processIdx := strings.Index(validateStr, "Process")
				cleanupIdx := strings.Index(validateStr, "Cleanup")
				if cleanupIdx < processIdx {
					t.Error("Method not added after target")
				}
			},
		},
		{
			name: "handle missing symbol",
			initial: `package test
// Existing function with basic functionality
func Existing() {}`,
			req: EditRequest{
				Symbol:  "NonExistent",
				Content: "func NonExistent() {}",
			},
			want: EditResult{
				Success: false,
				Error:   "Symbol not found: NonExistent",
			},
			validate: func(t *testing.T, path string) {
				content, err := os.ReadFile(path)
				if err != nil {
					t.Fatal(err)
				}
				if strings.Contains(string(content), "NonExistent") {
					t.Error("File was modified when it shouldn't have been")
				}
			},
		},
		{
			name: "handle invalid syntax",
			initial: `package test
// Valid performs basic validation
func Valid() {}`,
			req: EditRequest{
				Symbol:  "Valid",
				Content: "invalid go code {",
			},
			want: EditResult{
				Success: false,
				Error:   "Failed to parse new content",
			},
			validate: func(t *testing.T, path string) {
				content, err := os.ReadFile(path)
				if err != nil {
					t.Fatal(err)
				}
				if !strings.Contains(string(content), "func Valid()") {
					t.Error("Original content was modified")
				}
			},
		},
		{
			name: "replace function with docs",
			initial: `package test
// updateExpiredSubscriptions updates the status of expired subscriptions
func (sh *SubscriptionHandler) updateExpiredSubscriptions(ctx context.Context) error {
	return nil
}`,
			req: EditRequest{
				Symbol: "updateExpiredSubscriptions",
				Content: `// updateExpiredSubscriptions processes expired subscriptions and logs the changes
// It handles each subscription in a separate transaction for better isolation
// and maintains an audit log of all status changes.
func (sh *SubscriptionHandler) updateExpiredSubscriptions(ctx context.Context) error {
	// First, get the subscriptions that will be expired
	rows, err := sh.db.QueryContext(ctx, ` + "`" + `
		SELECT id, status, payment_status, expiration_date, renewal_count
		FROM subscriptions 
		WHERE status IN (?, ?) 
		AND expiration_date < NOW()` + "`" + `,
		StatusActive, StatusPending)
	if err != nil {
		return fmt.Errorf("failed to query expiring subscriptions: %w", err)
	}
	defer rows.Close()

	// Process each subscription in its own transaction
	var expiredCount int64
	for rows.Next() {
		var sub Subscription
		err := rows.Scan(&sub.ID, &sub.Status, &sub.PaymentStatus, &sub.ExpirationDate, &sub.RenewalCount)
		if err != nil {
			return fmt.Errorf("failed to scan subscription: %w", err)
		}

		// Start a new transaction for this subscription
		tx, err := sh.db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelSerializable})
		if err != nil {
			return fmt.Errorf("failed to begin transaction: %w", err)
		}

		// Verify the subscription is still in a valid state for expiration
		var currentStatus SubscriptionStatus
		err = tx.QueryRowContext(ctx, ` + "`" + `
			SELECT status 
			FROM subscriptions 
			WHERE id = ? 
			AND status IN (?, ?) 
			FOR UPDATE` + "`" + `,
			sub.ID, StatusActive, StatusPending).Scan(&currentStatus)
		if err != nil {
			tx.Rollback()
			if err == sql.ErrNoRows {
				continue // Skip this subscription as it's no longer in a valid state
			}
			return fmt.Errorf("failed to verify subscription state: %w", err)
		}

		// Update the subscription status
		result, err := tx.ExecContext(ctx, ` + "`" + `
			UPDATE subscriptions 
			SET status = ?, updated_at = NOW() 
			WHERE id = ?` + "`" + `,
			StatusExpired, sub.ID)
		if err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to update subscription %d: %w", sub.ID, err)
		}

		rowsAffected, err := result.RowsAffected()
		if err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to get affected rows: %w", err)
		}

		if rowsAffected > 0 {
			// Create details map directly from the subscription data
			details := map[string]interface{}{
				"payment_status":  sub.PaymentStatus,
				"expiration_date": sub.ExpirationDate,
				"renewal_count":   sub.RenewalCount,
			}
			detailsJSON, _ := json.Marshal(details)

			// Insert expiration log
			_, err = tx.ExecContext(ctx, ` + "`" + `
				INSERT INTO subscription_logs 
				(subscription_id, action, old_status, new_status, details)
				VALUES (?, ?, ?, ?, ?)` + "`" + `,
				sub.ID,
				"expire",
				currentStatus,
				StatusExpired,
				string(detailsJSON))
			if err != nil {
				tx.Rollback()
				return fmt.Errorf("failed to log subscription change: %w", err)
			}

			expiredCount++
		}

		if err := tx.Commit(); err != nil {
			return fmt.Errorf("failed to commit transaction: %w", err)
		}
	}
	if err = rows.Err(); err != nil {
		return fmt.Errorf("error iterating subscriptions: %w", err)
	}

	// Log the batch update if any subscriptions were expired
	if expiredCount > 0 {
		tx, err := sh.db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelSerializable})
		if err != nil {
			return fmt.Errorf("failed to begin batch log transaction: %w", err)
		}
		defer tx.Rollback()

		details := map[string]interface{}{
			"affected_count": expiredCount,
			"update_time":    time.Now(),
		}
		detailsJSON, _ := json.Marshal(details)

		_, err = tx.ExecContext(ctx, ` + "`" + `
			INSERT INTO subscription_logs 
			(action, details) 
			VALUES (?, ?)` + "`" + `,
			"daily_expiration_update", string(detailsJSON))
		if err != nil {
			return fmt.Errorf("failed to log batch update: %w", err)
		}

		if err := tx.Commit(); err != nil {
			return fmt.Errorf("failed to commit batch log transaction: %w", err)
		}
	}

	return nil
}`,
			},
			want: EditResult{
				Success: true,
			},
			validate: func(t *testing.T, path string) {
				content, err := os.ReadFile(path)
				if err != nil {
					t.Fatal(err)
				}
				contentStr := string(content)
				if !strings.Contains(contentStr, "processes expired subscriptions and logs the changes") {
					t.Error("New function documentation not added")
				}
				if strings.Contains(contentStr, "updates the status of expired subscriptions") {
					t.Error("Old documentation still present")
				}
				if !strings.Contains(contentStr, "expiredCount int64") {
					t.Error("Function implementation not updated")
				}
				if !strings.Contains(contentStr, "subscription_logs") {
					t.Error("New SQL operations not added")
				}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create test file
			path := filepath.Join(tmpDir, tt.name+".go")
			if err := os.WriteFile(path, []byte(tt.initial), 0644); err != nil {
				t.Fatal(err)
			}

			// Set path in request
			tt.req.Path = path

			// Run edit
			got := Edit(tt.req)

			// Check success/error status
			if got.Success != tt.want.Success {
				t.Errorf("Edit() success = %v, want %v", got.Success, tt.want.Success)
			}
			if tt.want.Error != "" && !strings.Contains(got.Error, tt.want.Error) {
				t.Errorf("Edit() error = %v, want %v", got.Error, tt.want.Error)
			}

			// Run validation if provided
			if tt.validate != nil {
				tt.validate(t, path)
			}
		})
	}
}
