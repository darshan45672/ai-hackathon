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
      targetAudience: `## Primary Target Audience
      **Software Developers (Individual Contributors)**:
      - Experience Level: Junior to senior developers (1-10+ years experience)
      - Company Size: All sizes from startups to enterprise
      - Programming Languages: Primarily JavaScript, Python, Java, and TypeScript developers
      - Geographic Scope: Global, with initial focus on North America and Europe
      - Demographics: 25-40 years old, tech-savvy early adopters
      
      ## Secondary Target Audience
      **Development Teams & Engineering Managers**:
      - Team leads looking to improve team productivity
      - CTOs and engineering directors in companies with 10-500 developers
      - DevOps engineers interested in code quality automation
      
      ## Market Segmentation
      - **Freelance Developers**: Independent contractors seeking productivity tools
      - **Startup Teams**: Early-stage companies needing to move fast with quality
      - **Enterprise Teams**: Large organizations focusing on code standardization
      - **Educational Sector**: Coding bootcamps and computer science students
      
      ## Target Market Size
      - Total Addressable Market: 26+ million developers globally
      - Serviceable Addressable Market: 15 million VS Code users
      - Initial Target: 100,000 active developers in first year`,
      businessOutcome: `## Financial Goals
      **Revenue Targets**:
      - Year 1: $500K ARR with freemium model (10% conversion rate)
      - Year 2: $2M ARR expanding to enterprise licenses
      - Year 3: $5M ARR with API licensing and white-label solutions
      - Break-even point: Month 18 with 50,000 active users
      
      ## Business Metrics & KPIs
      **User Adoption**:
      - Install Rate: 10,000 monthly installs by month 6
      - Daily Active Users: 25,000 by end of year 1
      - User Retention: 70% monthly retention rate
      - Premium Conversion: 10% of free users upgrade within 3 months
      
      **Product Performance**:
      - Code Suggestion Accuracy: >90% relevance rating
      - Bug Detection Rate: 85% of common issues identified
      - Time Savings: Average 30% reduction in debugging time
      - Customer Satisfaction: NPS score >50
      
      ## Operational Outcomes
      - Reduce developer debugging time by 30% on average
      - Improve code quality scores by 40% in customer projects
      - Decrease time-to-market for software projects by 20%
      - Establish market leadership in AI-powered development tools
      
      ## Strategic Goals
      - Build developer ecosystem with 3rd-party integrations
      - Establish partnerships with major IDE providers
      - Create defensible moat through proprietary AI models
      - Scale to support enterprise clients with custom solutions`,
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
      targetAudience: `## Primary Target Audience
      **Environmentally Conscious Consumers**:
      - Demographics: Age 25-45, college-educated, middle to upper-middle class
      - Psychographics: Environmentally aware, tech-savvy, willing to change behaviors
      - Location: Urban and suburban areas in developed countries
      - Income: $50,000+ household income with discretionary spending on sustainability
      
      ## Secondary Target Audiences
      **Smart Home Enthusiasts**:
      - Early adopters of IoT devices and smart home technology
      - Tech enthusiasts interested in data tracking and optimization
      - Homeowners with existing smart device ecosystems
      
      **Corporate Sustainability Programs**:
      - Companies implementing employee sustainability initiatives
      - HR departments promoting eco-friendly workplace culture
      - B2B market for corporate carbon tracking solutions
      
      ## Market Segmentation
      - **Individual Users**: Personal sustainability tracking (B2C)
      - **Families**: Household carbon footprint management
      - **Small Businesses**: Office sustainability monitoring
      - **Educational Institutions**: Teaching sustainability through data
      
      ## Geographic & Market Size
      - Primary Markets: US, Canada, UK, Germany, Australia
      - TAM: 500M environmentally conscious consumers globally
      - SAM: 50M smart home users interested in sustainability
      - Initial Target: 100K active users in first 18 months`,
      businessOutcome: `## Financial Objectives
      **Revenue Model & Targets**:
      - Freemium mobile app with premium features ($4.99/month)
      - B2B enterprise licenses ($50-200/employee/year)
      - Data insights and analytics API ($0.10 per API call)
      - Year 1: $200K revenue from 10K premium subscribers
      - Year 2: $1.2M revenue adding B2B customers
      - Year 3: $3.5M revenue with API monetization
      
      ## User Engagement Goals
      **Adoption & Retention**:
      - App Downloads: 500K in first year
      - Monthly Active Users: 150K by month 12
      - Premium Conversion Rate: 8% of free users
      - User Retention: 60% monthly retention for premium users
      - Average Session Time: 5+ minutes per app session
      
      ## Environmental Impact Metrics
      **Sustainability Outcomes**:
      - Help users reduce carbon footprint by average 15% within 6 months
      - Track and report 10M+ tons of CO2 equivalent annually
      - Drive $50M in sustainable purchasing decisions
      - Partner with 100+ eco-friendly brands for recommendations
      
      ## Business Strategy Goals
      - Establish leadership in personal carbon tracking market
      - Build comprehensive IoT device integration ecosystem
      - Create defensible data moat with behavioral insights
      - Develop B2B SaaS offering for corporate sustainability programs
      - Potential acquisition target for larger sustainability platforms`,
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
      targetAudience: `## Primary Target Audience
      **Health-Conscious Consumers**:
      - Demographics: Age 25-55, educated professionals, families with children
      - Psychographics: Proactive about health, comfortable with technology
      - Behavior: Seek information before doctor visits, use health apps
      - Geographic: US, Canada, UK initially, expanding to global markets
      - Pain Points: Long wait times, expensive consultations, uncertainty about symptoms
      
      ## Secondary Target Audiences
      **Underserved Healthcare Markets**:
      - Rural communities with limited access to healthcare providers
      - Uninsured or underinsured individuals seeking affordable health guidance
      - International users in countries with healthcare accessibility challenges
      
      **Healthcare Providers & Systems**:
      - Telemedicine platforms seeking AI-powered triage tools
      - Primary care practices wanting to streamline patient intake
      - Health insurance companies interested in preventive care solutions
      - Occupational health programs for employee wellness
      
      ## Market Segmentation
      - **B2C Individual Users**: Personal health management (primary)
      - **B2B Healthcare Providers**: Clinical decision support tools
      - **B2B2C Insurance/Employer**: Employee health benefits platform
      - **B2G Government**: Public health screening and triage systems
      
      ## Target Market Analysis
      - Global Digital Health Market: $659B by 2025
      - AI in Healthcare Market: $102B by 2028
      - Target User Base: 100M+ health app users globally
      - Initial Focus: 1M active users within 24 months`,
      businessOutcome: `## Revenue Strategy & Financial Goals
      **Diversified Revenue Model**:
      - Consumer Subscriptions: $9.99/month premium health insights
      - Provider Licensing: $1-5 per assessment for healthcare organizations
      - API Access: $0.50 per AI assessment for third-party integrations
      - Data Analytics: Anonymized population health insights to research organizations
      
      **Financial Projections**:
      - Year 1: $1.5M revenue (150K premium users, early B2B pilots)
      - Year 2: $8M revenue (healthcare provider partnerships, API licensing)
      - Year 3: $25M revenue (international expansion, enterprise contracts)
      - Break-even: Month 20 with 300K active premium subscribers
      
      ## Healthcare Impact Goals
      **Clinical Outcomes**:
      - Reduce unnecessary emergency room visits by 20% for users
      - Improve early detection of serious conditions by 30%
      - Decrease time to appropriate care by average 2-3 days
      - Achieve 90%+ accuracy in symptom severity assessment
      - Help users save average $500 annually in healthcare costs
      
      ## Business & Operational Metrics
      **Platform Performance**:
      - Daily Active Users: 500K by end of year 2
      - Assessment Accuracy: >92% clinical validation rate
      - User Satisfaction: NPS score >60, 4.5+ app store rating
      - Provider Partnerships: 1,000+ healthcare organizations
      - International Expansion: 5 countries by year 3
      
      ## Strategic Business Outcomes
      - Establish market leadership in AI-powered health assessment
      - Build comprehensive medical knowledge graph and dataset
      - Create network effects through provider ecosystem
      - Potential IPO or acquisition by major healthcare/tech company
      - Contribute to democratizing healthcare access globally`,
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
