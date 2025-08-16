# Application Feedback API Documentation

## Overview

The AI-powered review system now provides detailed, user-friendly feedback for rejected applications. This documentation explains how to integrate the feedback system with your frontend.

## API Endpoints

### 1. Get Application Feedback (Backend)
```http
GET /api/applications/{applicationId}/feedback
Authorization: Bearer <jwt_token>
```

**Response for Rejected Application:**
```json
{
  "status": "REJECTED",
  "isRejected": true,
  "rejectionStage": "EXTERNAL_IDEA",
  "primaryReason": "Similar Idea Already Exists",
  "feedback": "🔍 **Similar Idea Detected**\n\nUnfortunately, we found existing products/services similar to \"Smart Home Assistant\" on Product Hunt, Y Combinator.\n\n**Similarity Analysis:**\n• Product Hunt: 85% similar\n  Found similar product on Product Hunt with 85% similarity.\n• Y Combinator: 78% similar\n  Found similar startup in Y Combinator portfolio with 78% similarity.\n\n**Next Steps:**\n• Consider pivoting your idea to focus on underserved markets or unique features\n• Research what makes your approach different from existing solutions\n• You may resubmit with significant modifications that differentiate your solution",
  "score": 0.85,
  "reviewedAt": "2025-08-15T07:25:30.123Z",
  "details": {
    "similarityScore": 0.85,
    "foundSources": [
      {
        "platform": "Product Hunt",
        "similarity": "85%",
        "recommendation": "85% similarity detected. Review top products in this category and identify unique differentiators."
      },
      {
        "platform": "Y Combinator",
        "similarity": "78%",
        "recommendation": "78% similarity to YC portfolio company. Consider targeting different market segments or business models."
      }
    ],
    "suggestions": [
      "Research Product Hunt to understand what features users value most in similar products",
      "Consider targeting a different market segment or geographic region",
      "Study Y Combinator startups in this space to identify gaps in their solutions",
      "Focus on a specific niche or vertical that existing solutions don't address well",
      "Emphasize unique value propositions that set your solution apart",
      "Consider partnerships or integrations that existing solutions don't offer"
    ],
    "rejectionReason": "SIMILAR_IDEA_EXISTS"
  },
  "nextSteps": [
    "Review the detailed feedback provided",
    "Consider the suggestions for improvement",
    "Make significant changes to address the concerns",
    "Resubmit your application when ready",
    "Research existing solutions more thoroughly",
    "Identify unique differentiators for your approach",
    "Consider targeting a different market segment",
    "Focus on specific features that competitors lack"
  ],
  "canResubmit": true,
  "resubmissionGuidelines": [
    "Wait at least 24 hours before resubmitting",
    "Address all points mentioned in the feedback",
    "Provide clear explanations of what you changed",
    "Include additional evidence or research if requested",
    "Demonstrate clear differentiation from existing solutions",
    "Provide market research showing demand for your unique approach"
  ]
}
```

**Response for Approved Application:**
```json
{
  "status": "SUCCESS",
  "message": "Your application has passed all AI review stages!",
  "currentStage": "UNDER_REVIEW",
  "isRejected": false
}
```

### 2. Direct AI Service Feedback (Alternative)
```http
GET /ai-review/feedback/{applicationId}
```

## Frontend Integration Examples

### React Component Example

```tsx
import React, { useState, useEffect } from 'react';
import { Card, Alert, Button, List, Typography, Progress } from 'antd';

const ApplicationFeedback = ({ applicationId }) => {
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedback();
  }, [applicationId]);

  const fetchFeedback = async () => {
    try {
      const response = await fetch(`/api/applications/${applicationId}/feedback`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setFeedback(data);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading feedback...</div>;
  if (!feedback) return <div>No feedback available</div>;

  if (feedback.isRejected) {
    return (
      <div className="feedback-container">
        <Alert
          message={feedback.primaryReason}
          description={feedback.feedback}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Card title="Why was this rejected?" style={{ marginBottom: 16 }}>
          <p><strong>Rejection Stage:</strong> {feedback.rejectionStage}</p>
          <p><strong>Similarity Score:</strong> {Math.round((feedback.score || 0) * 100)}%</p>
          <p><strong>Review Date:</strong> {new Date(feedback.reviewedAt).toLocaleDateString()}</p>
        </Card>

        {feedback.details.foundSources.length > 0 && (
          <Card title="Similar Products Found" style={{ marginBottom: 16 }}>
            <List
              dataSource={feedback.details.foundSources}
              renderItem={(source) => (
                <List.Item>
                  <div>
                    <strong>{source.platform}:</strong> {source.similarity} similar
                    <br />
                    <small>{source.recommendation}</small>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        )}

        <Card title="Suggestions for Improvement" style={{ marginBottom: 16 }}>
          <List
            dataSource={feedback.details.suggestions}
            renderItem={(suggestion) => (
              <List.Item>
                <Typography.Text>• {suggestion}</Typography.Text>
              </List.Item>
            )}
          />
        </Card>

        <Card title="Next Steps" style={{ marginBottom: 16 }}>
          <List
            dataSource={feedback.nextSteps}
            renderItem={(step, index) => (
              <List.Item>
                <Typography.Text>{index + 1}. {step}</Typography.Text>
              </List.Item>
            )}
          />
        </Card>

        {feedback.canResubmit && (
          <Card title="Resubmission Guidelines">
            <List
              dataSource={feedback.resubmissionGuidelines}
              renderItem={(guideline) => (
                <List.Item>
                  <Typography.Text>• {guideline}</Typography.Text>
                </List.Item>
              )}
            />
            <Button type="primary" style={{ marginTop: 16 }}>
              Resubmit Application
            </Button>
          </Card>
        )}
      </div>
    );
  }

  return (
    <Alert
      message="Application Approved!"
      description={feedback.message}
      type="success"
      showIcon
    />
  );
};

export default ApplicationFeedback;
```

### Vue.js Component Example

```vue
<template>
  <div class="feedback-container">
    <div v-if="loading">Loading feedback...</div>
    
    <div v-else-if="feedback">
      <!-- Rejection Feedback -->
      <div v-if="feedback.isRejected" class="rejection-feedback">
        <div class="alert alert-danger">
          <h4>{{ feedback.primaryReason }}</h4>
          <pre>{{ feedback.feedback }}</pre>
        </div>
        
        <div class="card">
          <h5>Review Details</h5>
          <p><strong>Stage:</strong> {{ feedback.rejectionStage }}</p>
          <p><strong>Score:</strong> {{ Math.round((feedback.score || 0) * 100) }}%</p>
          <p><strong>Date:</strong> {{ formatDate(feedback.reviewedAt) }}</p>
        </div>

        <div v-if="feedback.details.suggestions.length" class="card">
          <h5>Suggestions</h5>
          <ul>
            <li v-for="suggestion in feedback.details.suggestions" :key="suggestion">
              {{ suggestion }}
            </li>
          </ul>
        </div>

        <div class="card">
          <h5>Next Steps</h5>
          <ol>
            <li v-for="step in feedback.nextSteps" :key="step">
              {{ step }}
            </li>
          </ol>
        </div>
      </div>

      <!-- Success Feedback -->
      <div v-else class="success-feedback">
        <div class="alert alert-success">
          <h4>Application Approved!</h4>
          <p>{{ feedback.message }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ['applicationId'],
  data() {
    return {
      feedback: null,
      loading: true
    };
  },
  mounted() {
    this.fetchFeedback();
  },
  methods: {
    async fetchFeedback() {
      try {
        const response = await fetch(`/api/applications/${this.applicationId}/feedback`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        this.feedback = await response.json();
      } catch (error) {
        console.error('Error fetching feedback:', error);
      } finally {
        this.loading = false;
      }
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString();
    }
  }
};
</script>
```

## Feedback Types and Reasons

### Primary Rejection Reasons
- **Similar Idea Already Exists** - External idea review rejection
- **Duplicate Submission Detected** - Internal idea review rejection  
- **Unable to Categorize Application** - Categorization failure
- **Implementation Not Feasible** - Technical feasibility issues
- **Budget Insufficient** - Cost analysis rejection
- **Low Market Impact Potential** - Customer impact assessment rejection

### Rejection Stages
- `EXTERNAL_IDEA` - Similar products found on Product Hunt, Y Combinator, or web
- `INTERNAL_IDEA` - Duplicate submission within platform
- `CATEGORIZATION` - Unable to determine appropriate category
- `IMPLEMENTATION` - Technical or team feasibility concerns
- `COST` - Budget vs. requirements mismatch
- `IMPACT` - Insufficient market potential

## Best Practices for Frontend Integration

1. **Show Progressive Disclosure**: Start with the main reason, allow users to expand for details
2. **Make Feedback Actionable**: Highlight specific steps users can take
3. **Provide Context**: Explain why certain criteria matter
4. **Enable Easy Resubmission**: Guide users through the improvement process
5. **Track Improvements**: Show how resubmitted applications address previous concerns

## Error Handling

```javascript
try {
  const feedback = await fetchApplicationFeedback(applicationId);
  // Handle feedback display
} catch (error) {
  if (error.status === 404) {
    // Application not found
  } else if (error.status === 403) {
    // Permission denied
  } else {
    // Service unavailable - show fallback message
    showFallbackMessage("Feedback temporarily unavailable. Please try again later.");
  }
}
```

## Testing the Feedback System

You can test the feedback system by:

1. **Creating a test application** with a common idea (e.g., "Social Media Platform")
2. **Submitting it** - it will likely be rejected for similarity
3. **Calling the feedback endpoint** to see the detailed response
4. **Using the suggestions** to improve and resubmit

The feedback system provides comprehensive, actionable guidance to help users improve their applications and succeed in future submissions.
