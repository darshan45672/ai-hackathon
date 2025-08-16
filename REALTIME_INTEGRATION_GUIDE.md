# Real-Time Application Status Tracking

## Frontend WebSocket Integration

### Installation

```bash
npm install socket.io-client
```

### React Hook for Real-Time Updates

```typescript
// hooks/useApplicationStatus.ts
import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface ApplicationStatus {
  applicationId: string;
  status: string;
  timestamp: string;
  reviewStage?: string;
  result?: string;
  message?: string;
  isRejected?: boolean;
  feedback?: string;
  details?: any;
}

interface UseApplicationStatusReturn {
  status: ApplicationStatus | null;
  isConnected: boolean;
  joinApplicationUpdates: (applicationId: string) => void;
  leaveApplicationUpdates: (applicationId: string) => void;
  rejectionDetails: any | null;
  reviewProgress: any[];
}

export const useApplicationStatus = (token: string): UseApplicationStatusReturn => {
  const [status, setStatus] = useState<ApplicationStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [rejectionDetails, setRejectionDetails] = useState<any | null>(null);
  const [reviewProgress, setReviewProgress] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    socketRef.current = io('http://localhost:3001', {
      auth: {
        token: token,
      },
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    });

    socket.on('application-status-updated', (data: ApplicationStatus) => {
      console.log('Application status updated:', data);
      setStatus(data);
    });

    socket.on('application-rejected', (data: any) => {
      console.log('Application rejected:', data);
      setRejectionDetails(data);
      setStatus({
        ...data,
        status: 'REJECTED',
        isRejected: true,
      });
    });

    socket.on('ai-review-progress', (data: any) => {
      console.log('AI review progress:', data);
      setReviewProgress(prev => [...prev, data]);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const joinApplicationUpdates = (applicationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-application-updates', { applicationId });
      console.log(`Joined updates for application ${applicationId}`);
    }
  };

  const leaveApplicationUpdates = (applicationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave-application-updates', { applicationId });
      console.log(`Left updates for application ${applicationId}`);
    }
  };

  return {
    status,
    isConnected,
    joinApplicationUpdates,
    leaveApplicationUpdates,
    rejectionDetails,
    reviewProgress,
  };
};
```

### React Component for Real-Time Application Tracking

```typescript
// components/ApplicationStatusTracker.tsx
import React, { useEffect, useState } from 'react';
import { Card, Alert, Timeline, Badge, Button, Modal, Typography } from 'antd';
import { 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  LoadingOutlined 
} from '@ant-design/icons';
import { useApplicationStatus } from '../hooks/useApplicationStatus';

const { Title, Paragraph, Text } = Typography;

interface ApplicationStatusTrackerProps {
  applicationId: string;
  token: string;
}

const ApplicationStatusTracker: React.FC<ApplicationStatusTrackerProps> = ({
  applicationId,
  token
}) => {
  const { 
    status, 
    isConnected, 
    joinApplicationUpdates, 
    leaveApplicationUpdates,
    rejectionDetails,
    reviewProgress 
  } = useApplicationStatus(token);

  const [showRejectionModal, setShowRejectionModal] = useState(false);

  useEffect(() => {
    // Join updates for this specific application
    joinApplicationUpdates(applicationId);
    
    return () => {
      leaveApplicationUpdates(applicationId);
    };
  }, [applicationId]);

  useEffect(() => {
    // Show rejection modal when application is rejected
    if (rejectionDetails?.isRejected) {
      setShowRejectionModal(true);
    }
  }, [rejectionDetails]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'blue';
      case 'EXTERNAL_IDEA_REVIEW': return 'orange';
      case 'INTERNAL_IDEA_REVIEW': return 'orange';
      case 'CATEGORIZATION': return 'orange';
      case 'IMPLEMENTATION_REVIEW': return 'orange';
      case 'COST_REVIEW': return 'orange';
      case 'IMPACT_REVIEW': return 'orange';
      case 'UNDER_REVIEW': return 'green';
      case 'REJECTED': return 'red';
      case 'APPROVED': return 'green';
      default: return 'default';
    }
  };

  const getStageTitle = (stage: string) => {
    switch (stage) {
      case 'EXTERNAL_IDEA': return 'Y Combinator Check';
      case 'INTERNAL_IDEA': return 'Duplicate Check';
      case 'CATEGORIZATION': return 'Categorization';
      case 'IMPLEMENTATION': return 'Feasibility Review';
      case 'COST': return 'Budget Analysis';
      case 'IMPACT': return 'Market Impact';
      default: return stage;
    }
  };

  const renderProgressTimeline = () => {
    const stages = [
      { key: 'EXTERNAL_IDEA', title: 'Y Combinator Check', status: 'pending' },
      { key: 'INTERNAL_IDEA', title: 'Duplicate Check', status: 'pending' },
      { key: 'CATEGORIZATION', title: 'Categorization', status: 'pending' },
      { key: 'IMPLEMENTATION', title: 'Feasibility Review', status: 'pending' },
      { key: 'COST', title: 'Budget Analysis', status: 'pending' },
      { key: 'IMPACT', title: 'Market Impact', status: 'pending' },
    ];

    // Update stages based on progress
    reviewProgress.forEach(progress => {
      const stage = stages.find(s => s.key === progress.reviewStage);
      if (stage) {
        stage.status = progress.result === 'APPROVED' ? 'finish' : 
                     progress.result === 'REJECTED' ? 'error' : 'process';
      }
    });

    return (
      <Timeline>
        {stages.map(stage => (
          <Timeline.Item
            key={stage.key}
            dot={
              stage.status === 'finish' ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> :
              stage.status === 'error' ? <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> :
              stage.status === 'process' ? <LoadingOutlined style={{ color: '#1890ff' }} /> :
              <ClockCircleOutlined style={{ color: '#d9d9d9' }} />
            }
            color={
              stage.status === 'finish' ? 'green' :
              stage.status === 'error' ? 'red' :
              stage.status === 'process' ? 'blue' : 'gray'
            }
          >
            <div>
              <Text strong>{stage.title}</Text>
              {reviewProgress.find(p => p.reviewStage === stage.key)?.message && (
                <div>
                  <Text type="secondary">
                    {reviewProgress.find(p => p.reviewStage === stage.key)?.message}
                  </Text>
                </div>
              )}
            </div>
          </Timeline.Item>
        ))}
      </Timeline>
    );
  };

  return (
    <div>
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            Application Status
            <Badge 
              status={isConnected ? 'success' : 'error'} 
              text={isConnected ? 'Live' : 'Disconnected'}
            />
          </div>
        }
        style={{ marginBottom: 16 }}
      >
        {status && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Current Status: </Text>
              <Badge 
                color={getStatusColor(status.status)} 
                text={status.status.replace(/_/g, ' ')} 
              />
            </div>
            
            {status.message && (
              <Alert 
                message={status.message} 
                type="info" 
                style={{ marginBottom: 16 }}
              />
            )}
          </div>
        )}

        {reviewProgress.length > 0 && (
          <div>
            <Title level={4}>Review Progress</Title>
            {renderProgressTimeline()}
          </div>
        )}
      </Card>

      {/* Rejection Details Modal */}
      <Modal
        title="Application Review Results"
        open={showRejectionModal}
        onCancel={() => setShowRejectionModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowRejectionModal(false)}>
            Close
          </Button>,
          <Button key="improve" type="primary">
            Improve & Resubmit
          </Button>
        ]}
        width={800}
      >
        {rejectionDetails && (
          <div>
            <Alert
              message={rejectionDetails.primaryReason}
              type="error"
              style={{ marginBottom: 16 }}
            />
            
            <Title level={4}>Feedback</Title>
            <Paragraph>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                {rejectionDetails.feedback}
              </pre>
            </Paragraph>

            {rejectionDetails.details?.suggestions && (
              <div>
                <Title level={4}>Suggestions for Improvement</Title>
                <ul>
                  {rejectionDetails.details.suggestions.map((suggestion: string, index: number) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}

            {rejectionDetails.details?.foundSources && (
              <div>
                <Title level={4}>Similar Startups Found</Title>
                {rejectionDetails.details.foundSources.map((source: any, index: number) => (
                  <Card key={index} size="small" style={{ marginBottom: 8 }}>
                    <Text strong>{source.platform}:</Text> {source.similarity} similar
                    <br />
                    <Text type="secondary">{source.recommendation}</Text>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ApplicationStatusTracker;
```

### Usage in Application Detail Page

```typescript
// pages/ApplicationDetail.tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import ApplicationStatusTracker from '../components/ApplicationStatusTracker';

const ApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const token = localStorage.getItem('token');

  if (!id || !token) {
    return <div>Invalid application or not authenticated</div>;
  }

  return (
    <div>
      <h1>Application Details</h1>
      
      {/* Other application details */}
      
      <ApplicationStatusTracker 
        applicationId={id} 
        token={token} 
      />
    </div>
  );
};

export default ApplicationDetail;
```

## Key Features

### Real-Time Updates
- **Live Connection Status**: Shows if WebSocket is connected
- **Instant Status Changes**: Updates appear immediately without refresh
- **Progress Tracking**: Visual timeline of review stages
- **Rejection Notifications**: Immediate feedback with detailed reasons

### Enhanced User Experience
- **Visual Progress**: Timeline showing each review stage
- **Detailed Feedback**: Comprehensive rejection reasons and suggestions
- **Action Items**: Clear next steps for improvement
- **Resubmission Guidance**: Specific guidelines for reapplication

### Technical Benefits
- **Auto-Reconnection**: WebSocket handles connection drops
- **Room Management**: Users only get updates for their applications
- **Efficient Updates**: Only sends relevant data to specific users
- **Error Handling**: Graceful degradation when WebSocket fails

## Testing the Real-Time System

1. **Submit an application** (triggers AI review)
2. **Watch the live progress** as it goes through stages
3. **See immediate rejection** if Y Combinator similarity is detected
4. **Get detailed feedback** without page refresh

The system now provides real-time visibility into the AI review process!
