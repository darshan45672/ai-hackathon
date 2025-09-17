import { PrismaClient, UserRole, NotificationType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@admin.com' },
  });

  if (existingAdmin) {
    console.log('⚠️  Admin user already exists, skipping creation');
    
    // Create a test notification for the existing admin if it doesn't exist
    const existingNotification = await prisma.notification.findFirst({
      where: { 
        userId: existingAdmin.id,
        title: 'Welcome to Hack-Ai thon Platform'
      },
    });

    if (!existingNotification) {
      const testNotification = await prisma.notification.create({
        data: {
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          title: 'Welcome to Hack-Ai thon Platform',
          message: 'Your notification system is working correctly! You can now receive real-time updates about your applications.',
          userId: existingAdmin.id,
          senderId: existingAdmin.id,
          actionUrl: '/dashboard',
          metadata: {
            test: true,
            category: 'welcome'
          }
        },
      });

      console.log('✅ Test notification created:', {
        id: testNotification.id,
        title: testNotification.title,
        type: testNotification.type,
      });
    } else {
      console.log('⚠️  Test notification already exists');
    }
    
    return;
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash('admin', 12);

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@admin.com',
      password: hashedPassword,
      name: 'System Administrator',
      firstName: 'System',
      lastName: 'Administrator',
      role: UserRole.ADMIN,
      provider: 'email',
    },
  });

  console.log('✅ Admin user created:', {
    id: adminUser.id,
    email: adminUser.email,
    name: adminUser.name,
    role: adminUser.role,
  });

  // Create some sample applications for testing (optional)
  const sampleApplications = [
    {
      title: 'AI-Powered Code Assistant',
      description: 'A revolutionary AI assistant that helps developers write better code faster by providing intelligent suggestions, bug detection, and automated documentation.',
      problemStatement: 'Developers spend too much time debugging and writing documentation instead of focusing on core functionality.',
      solution: 'Our AI assistant analyzes code in real-time, provides suggestions, detects potential bugs, and automatically generates documentation.',
      implementation: `## Technical Architecture
      - Frontend: React-based VS Code extension with TypeScript
      - Backend: Node.js API server with Express framework
      - AI Engine: Python service using TensorFlow and OpenAI GPT-4 API
      - Database: PostgreSQL for user data and project analytics
      
      ## Development Phases
      1. **Phase 1 (Weeks 1-2)**: Core VS Code extension development with basic syntax highlighting
      2. **Phase 2 (Weeks 3-4)**: AI integration for code suggestions using OpenAI API
      3. **Phase 3 (Weeks 5-6)**: Bug detection algorithms and real-time analysis
      4. **Phase 4 (Weeks 7-8)**: Documentation generation and testing
      
      ## Technical Implementation
      - Use VS Code Language Server Protocol for real-time code analysis
      - Implement caching mechanism for frequently used AI suggestions
      - Set up CI/CD pipeline with GitHub Actions for automated testing
      - Deploy backend on AWS with load balancing for scalability
      - Implement secure API authentication using JWT tokens
      
      ## Risk Mitigation
      - API rate limiting strategies for OpenAI usage
      - Fallback mechanisms for offline functionality
      - Comprehensive error handling and logging`,
      techStack: ['TypeScript', 'Python', 'TensorFlow', 'OpenAI API', 'React', 'Node.js'],
      teamSize: 3,
      teamMembers: ['John Doe (Team Lead)', 'Jane Smith (AI Engineer)', 'Bob Johnson (Frontend Developer)'],
      githubRepo: 'https://github.com/example/ai-code-assistant',
      demoUrl: 'https://ai-code-assistant-demo.com',
      status: 'SUBMITTED' as const,
    },
    {
      title: 'EcoTrack - Carbon Footprint Monitor',
      description: 'A mobile app that tracks personal carbon footprint through smart device integration and provides actionable insights for sustainable living.',
      problemStatement: 'People want to live more sustainably but lack visibility into their actual carbon footprint and its impact.',
      solution: 'Our app connects to smart devices, tracks energy usage, transportation, and consumption patterns to provide real-time carbon footprint monitoring with personalized recommendations.',
      implementation: `## Mobile App Architecture
      - Frontend: React Native for cross-platform compatibility (iOS/Android)
      - Backend: Node.js with Express and MongoDB for data storage
      - IoT Integration: RESTful APIs for smart home device connectivity
      - ML Pipeline: Python-based machine learning for pattern analysis
      
      ## Implementation Strategy
      1. **MVP Development (Month 1)**:
         - Basic carbon footprint calculator
         - Manual data entry interface
         - Simple dashboard with basic metrics
      
      2. **IoT Integration (Month 2)**:
         - Smart thermostat integration (Nest, Ecobee)
         - Smart meter connectivity for energy usage
         - Transportation tracking via GPS
      
      3. **AI Enhancement (Month 3)**:
         - Machine learning models for usage prediction
         - Personalized recommendations engine
         - Behavioral pattern analysis
      
      ## Technical Considerations
      - Use OAuth 2.0 for secure device authentication
      - Implement data privacy compliance (GDPR/CCPA)
      - Real-time data synchronization with WebSocket connections
      - Offline capability with local SQLite database
      - Push notifications for sustainability goals
      
      ## Challenges & Solutions
      - Device compatibility: Implement adapter pattern for different IoT protocols
      - Data accuracy: Cross-reference multiple data sources for validation
      - User engagement: Gamification elements and social sharing features`,
      techStack: ['React Native', 'Node.js', 'MongoDB', 'IoT APIs', 'Machine Learning'],
      teamSize: 4,
      teamMembers: ['Sarah Green (Product Lead)', 'Mike Chen (Mobile Developer)', 'Lisa Park (Data Scientist)', 'Alex Rivera (Backend Developer)'],
      githubRepo: 'https://github.com/example/ecotrack',
      demoUrl: 'https://ecotrack-demo.app',
      status: 'UNDER_REVIEW' as const,
    },
    {
      title: 'HealthAI - Symptom Analyzer',
      description: 'An AI-powered health platform that analyzes symptoms and provides preliminary health assessments with doctor recommendations.',
      problemStatement: 'People often delay seeking medical attention due to uncertainty about symptom severity and difficulty accessing healthcare professionals.',
      solution: 'Our AI analyzes user-reported symptoms using machine learning models trained on medical data to provide preliminary assessments and connect users with appropriate healthcare resources.',
      implementation: `## Healthcare AI System Architecture
      - Frontend: React web application with responsive design
      - Backend: Flask API with PostgreSQL database
      - AI Engine: TensorFlow-based neural networks for symptom analysis
      - Integration: FHIR-compliant medical APIs for doctor referrals
      
      ## Development Roadmap
      1. **Foundation (Weeks 1-2)**:
         - Set up secure, HIPAA-compliant infrastructure
         - Implement user authentication and data encryption
         - Design database schema for medical data storage
      
      2. **AI Model Development (Weeks 3-6)**:
         - Train machine learning models on anonymized medical datasets
         - Implement natural language processing for symptom description
         - Develop risk assessment algorithms with confidence scoring
         - Integrate medical knowledge base (ICD-10, medical literature)
      
      3. **User Interface (Weeks 7-8)**:
         - Create intuitive symptom input interface
         - Develop clear, non-alarming result presentation
         - Implement doctor referral system integration
      
      4. **Testing & Validation (Weeks 9-10)**:
         - Clinical validation with medical professionals
         - Security penetration testing
         - User experience testing with diverse demographics
      
      ## Technical Implementation Details
      - Use PyTorch/TensorFlow for deep learning model development
      - Implement BERT models for natural language understanding
      - Set up secure API gateway with rate limiting
      - Deploy on AWS with SOC 2 compliance
      - Implement audit logging for all medical interactions
      - Use Redis for caching frequent symptom patterns
      
      ## Compliance & Security
      - HIPAA compliance for US users (BAA with cloud providers)
      - GDPR compliance for EU users
      - End-to-end encryption for all medical data
      - Regular security audits and penetration testing
      - Medical disclaimer and liability considerations
      
      ## Risk Management
      - Clear limitations and disclaimers about AI recommendations
      - Emergency escalation protocols for severe symptoms
      - Continuous model monitoring and bias detection
      - Medical professional oversight and validation
      - User feedback loop for model improvement`,
      techStack: ['Python', 'TensorFlow', 'Flask', 'React', 'PostgreSQL', 'Medical APIs'],
      teamSize: 5,
      teamMembers: ['Dr. Emma Wilson (Medical Advisor)', 'Tom Zhang (AI Engineer)', 'Rachel Davis (Frontend Developer)', 'James Kim (Backend Developer)', 'Maria Lopez (Data Scientist)'],
      githubRepo: 'https://github.com/example/healthai',
      demoUrl: 'https://healthai-demo.com',
      status: 'ACCEPTED' as const,
    }
  ];

  for (const appData of sampleApplications) {
    const application = await prisma.application.create({
      data: {
        ...appData,
        submittedAt: new Date(),
        userId: adminUser.id,
      },
    });
    
    console.log('✅ Sample application created:', {
      id: application.id,
      title: application.title,
      status: application.status,
    });
  }

  // Create a test notification
  const testNotification = await prisma.notification.create({
    data: {
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      title: 'Welcome to Hack-Ai thon Platform',
      message: 'Your notification system is working correctly! You can now receive real-time updates about your applications.',
      userId: adminUser.id,
      senderId: adminUser.id,
      actionUrl: '/dashboard',
      metadata: {
        test: true,
        category: 'welcome'
      }
    },
  });

  console.log('✅ Test notification created:', {
    id: testNotification.id,
    title: testNotification.title,
    type: testNotification.type,
  });

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
