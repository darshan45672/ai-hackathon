#!/usr/bin/env node

/**
 * Comprehensive MCP Test Suite
 * Tests all review steps including the new target audience and business outcome analysis
 * 
 * This test covers:
 * 1. External Idea Review (analyze_idea_similarity)
 * 2. Internal Idea Review (analyze_internal_idea_similarity) 
 * 3. Cost Feasibility Review (analyze_cost_feasibility)
 * 4. Data Fetching (fetch_yc_companies, fetch_internal_applications)
 * 5. Integration testing with sample applications
 * 6. Error handling and edge cases
 */

import { spawn } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ComprehensiveMLPTester {
  constructor() {
    this.mcpServerPath = join(__dirname, 'index.js');
    this.testResults = [];
    this.passedTests = 0;
    this.totalTests = 0;
  }

  async runAllTests() {
    console.log('🧪 Starting Comprehensive MCP Test Suite\n');
    console.log('=' * 80);
    
    // Sample test applications covering different scenarios
    const testApplications = this.getTestApplications();
    
    for (const [appName, appData] of Object.entries(testApplications)) {
      console.log(`\n🚀 Testing Application: ${appName}`);
      console.log('-' * 60);
      
      await this.testExternalReview(appName, appData);
      await this.testInternalReview(appName, appData);
      await this.testCostFeasibility(appName, appData);
      await this.testDataFetching(appName);
    }
    
    // Test edge cases and error scenarios
    await this.testErrorScenarios();
    
    // Print final results
    this.printFinalResults();
  }

  getTestApplications() {
    return {
      'AI Code Assistant': {
        title: "AI-Powered Code Assistant",
        description: "A revolutionary AI assistant that helps developers write better code faster by providing intelligent suggestions, bug detection, and automated documentation.",
        problemStatement: "Developers spend too much time debugging and writing documentation instead of focusing on core functionality.",
        proposedSolution: "Our AI assistant analyzes code in real-time, provides suggestions, detects potential bugs, and automatically generates documentation.",
        targetAudience: `Software developers (25-40 years old) in companies ranging from startups to enterprise. 
        Primary: Individual contributors with 1-10+ years experience in JavaScript, Python, Java, TypeScript.
        Secondary: Development teams, engineering managers, CTOs seeking productivity improvements.
        Market: 26M+ developers globally, 15M VS Code users, targeting 100K active developers in first year.`,
        businessOutcome: `Financial Goals: $500K ARR Year 1, $2M Year 2, $5M Year 3 with freemium model.
        Metrics: 10K monthly installs by month 6, 25K DAU by year 1, 70% retention, 10% premium conversion.
        Outcomes: 30% reduction in debugging time, 40% code quality improvement, 20% faster time-to-market.
        Strategy: Build developer ecosystem, establish partnerships, create defensible AI moat.`,
        techStack: ['TypeScript', 'Python', 'TensorFlow', 'OpenAI API', 'React', 'Node.js'],
        teamSize: 3,
        estimatedCost: 150000,
        currentUserId: "test-user-001"
      },
      
      'EcoTrack Carbon Monitor': {
        title: "EcoTrack - Carbon Footprint Monitor",
        description: "A mobile app that tracks personal carbon footprint through smart device integration and provides actionable insights for sustainable living.",
        problemStatement: "People want to live more sustainably but lack visibility into their actual carbon footprint and its impact.",
        proposedSolution: "Our app connects to smart devices, tracks energy usage, transportation, and consumption patterns to provide real-time carbon footprint monitoring with personalized recommendations.",
        targetAudience: `Environmentally conscious consumers (25-45, college-educated, $50K+ income) in urban areas.
        Secondary: Smart home enthusiasts, corporate sustainability programs, educational institutions.
        Geographic: US, Canada, UK, Germany, Australia. TAM: 500M consumers, SAM: 50M smart home users.
        Target: 100K active users in 18 months with freemium mobile app model.`,
        businessOutcome: `Revenue: $200K Year 1 (10K premium), $1.2M Year 2 (B2B), $3.5M Year 3 (API).
        Engagement: 500K downloads, 150K MAU, 8% premium conversion, 60% retention.
        Impact: 15% average carbon reduction, 10M+ tons CO2 tracked, $50M sustainable purchasing.
        Strategy: IoT ecosystem leadership, B2B SaaS expansion, acquisition target positioning.`,
        techStack: ['React Native', 'Node.js', 'MongoDB', 'IoT APIs', 'Machine Learning'],
        teamSize: 4,
        estimatedCost: 200000,
        currentUserId: "test-user-002"
      },
      
      'HealthAI Symptom Analyzer': {
        title: "HealthAI - Symptom Analyzer",
        description: "An AI-powered health platform that analyzes symptoms and provides preliminary health assessments with doctor recommendations.",
        problemStatement: "People often delay seeking medical attention due to uncertainty about symptom severity and difficulty accessing healthcare professionals.",
        proposedSolution: "Our AI analyzes user-reported symptoms using machine learning models trained on medical data to provide preliminary assessments and connect users with appropriate healthcare resources.",
        targetAudience: `Health-conscious consumers (25-55, educated professionals, families) seeking proactive healthcare.
        Secondary: Underserved rural communities, uninsured individuals, healthcare providers.
        B2B: Telemedicine platforms, primary care practices, insurance companies, occupational health.
        Market: $659B digital health, $102B AI healthcare, targeting 1M users in 24 months.`,
        businessOutcome: `Revenue Model: $9.99/month consumer, $1-5 per assessment B2B, $0.50 API access.
        Projections: $1.5M Year 1, $8M Year 2, $25M Year 3, break-even month 20.
        Impact: 20% fewer ER visits, 30% better early detection, 2-3 days faster care, $500 annual savings.
        Strategy: Market leadership, medical knowledge graph, provider ecosystem, IPO/acquisition potential.`,
        techStack: ['Python', 'TensorFlow', 'Flask', 'React', 'PostgreSQL', 'Medical APIs'],
        teamSize: 5,
        estimatedCost: 500000,
        currentUserId: "test-user-003"
      },
      
      'Blockchain Fintech': {
        title: "CryptoPayroll - Blockchain Payroll Solution",
        description: "A blockchain-based payroll system that enables companies to pay employees in cryptocurrency with automatic tax compliance.",
        problemStatement: "Companies want to offer crypto payments to employees but face complex tax compliance and technical integration challenges.",
        proposedSolution: "Our platform handles crypto payroll conversion, tax withholding, compliance reporting, and integrates with existing HR systems.",
        targetAudience: `Tech-forward companies (50-500 employees) in crypto/fintech sectors wanting crypto payment options.
        Primary: HR departments, CFOs, payroll managers in startups and mid-size tech companies.
        Secondary: Remote-first companies, international organizations, crypto-native businesses.
        Geographic: US initially, expanding to EU and Asia. TAM: 100K+ companies, SAM: 10K tech companies.`,
        businessOutcome: `Revenue: SaaS model $50-200/employee/month, transaction fees 0.5-1%.
        Goals: $2M ARR Year 1, $10M Year 2, $25M Year 3 with enterprise expansion.
        Metrics: 500 companies, 50K employees processed, 95% compliance accuracy.
        Strategy: First-mover advantage, regulatory partnerships, enterprise sales focus.`,
        techStack: ['Solidity', 'Node.js', 'React', 'Web3.js', 'PostgreSQL', 'AWS'],
        teamSize: 6,
        estimatedCost: 750000,
        currentUserId: "test-user-004"
      }
    };
  }

  async testExternalReview(appName, appData) {
    console.log(`\n📊 Testing External Idea Review for ${appName}`);
    
    try {
      this.totalTests++;
      
      // First fetch YC companies
      const ycData = await this.callMCPTool('fetch_yc_companies', {});
      
      if (!ycData.success) {
        throw new Error('Failed to fetch YC companies');
      }
      
      const companies = JSON.parse(ycData.response.content[0].text);
      
      // Now test idea similarity
      const request = {
        userApplication: {
          title: appData.title,
          description: appData.description,
          problemStatement: appData.problemStatement,
          proposedSolution: appData.proposedSolution
        },
        externalData: {
          ycCompanies: companies.companies.slice(0, 20) // Test with subset
        }
      };
      
      const result = await this.callMCPTool('analyze_idea_similarity', request);
      
      if (result.success) {
        const analysis = JSON.parse(result.response.content[0].text);
        console.log(`  ✅ External Review: ${analysis.recommendation}`);
        console.log(`  📈 Similarity Score: ${Math.round(analysis.similarityScore * 100)}%`);
        console.log(`  🎯 Decision: ${analysis.decision}`);
        
        if (analysis.concerns && analysis.concerns.length > 0) {
          console.log(`  ⚠️  Concerns: ${analysis.concerns.slice(0, 2).join(', ')}`);
        }
        
        this.passedTests++;
        this.testResults.push({
          test: `External Review - ${appName}`,
          status: 'PASSED',
          score: analysis.similarityScore,
          decision: analysis.decision
        });
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.log(`  ❌ External Review Failed: ${error.message}`);
      this.testResults.push({
        test: `External Review - ${appName}`,
        status: 'FAILED',
        error: error.message
      });
    }
  }

  async testInternalReview(appName, appData) {
    console.log(`\n🏢 Testing Internal Idea Review for ${appName}`);
    
    try {
      this.totalTests++;
      
      // First fetch internal applications
      const internalData = await this.callMCPTool('fetch_internal_applications', {
        excludeUserId: appData.currentUserId,
        forSimilarityAnalysis: true
      });
      
      if (!internalData.success) {
        throw new Error('Failed to fetch internal applications');
      }
      
      const applications = JSON.parse(internalData.response.content[0].text);
      
      // Test internal similarity
      const request = {
        userApplication: appData,
        internalData: {
          applications: applications.applications
        }
      };
      
      const result = await this.callMCPTool('analyze_internal_idea_similarity', request);
      
      if (result.success) {
        const analysis = JSON.parse(result.response.content[0].text);
        console.log(`  ✅ Internal Review: ${analysis.recommendation}`);
        console.log(`  📈 Similarity Score: ${Math.round(analysis.similarityScore * 100)}%`);
        console.log(`  🎯 Decision: ${analysis.decision}`);
        
        if (analysis.similarApplications && analysis.similarApplications.length > 0) {
          console.log(`  🔍 Similar Apps: ${analysis.similarApplications.length} found`);
        }
        
        this.passedTests++;
        this.testResults.push({
          test: `Internal Review - ${appName}`,
          status: 'PASSED',
          score: analysis.similarityScore,
          decision: analysis.decision
        });
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.log(`  ❌ Internal Review Failed: ${error.message}`);
      this.testResults.push({
        test: `Internal Review - ${appName}`,
        status: 'FAILED',
        error: error.message
      });
    }
  }

  async testCostFeasibility(appName, appData) {
    console.log(`\n💰 Testing Cost Feasibility Review for ${appName}`);
    
    try {
      this.totalTests++;
      
      const request = {
        userApplication: {
          title: appData.title,
          description: appData.description,
          problemStatement: appData.problemStatement,
          proposedSolution: appData.proposedSolution,
          techStack: appData.techStack,
          teamSize: appData.teamSize,
          estimatedCost: appData.estimatedCost
        }
      };
      
      const result = await this.callMCPTool('analyze_cost_feasibility', request);
      
      if (result.success) {
        const analysis = JSON.parse(result.response.content[0].text);
        console.log(`  ✅ Cost Review: ${analysis.recommendation}`);
        console.log(`  💵 Estimated Cost: $${analysis.estimatedCost?.toLocaleString() || 'N/A'}`);
        console.log(`  📊 Feasibility Score: ${Math.round((analysis.feasibilityScore || 0) * 100)}%`);
        console.log(`  🎯 Decision: ${analysis.decision}`);
        
        this.passedTests++;
        this.testResults.push({
          test: `Cost Feasibility - ${appName}`,
          status: 'PASSED',
          score: analysis.feasibilityScore,
          decision: analysis.decision
        });
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.log(`  ❌ Cost Review Failed: ${error.message}`);
      this.testResults.push({
        test: `Cost Feasibility - ${appName}`,
        status: 'FAILED',
        error: error.message
      });
    }
  }

  async testDataFetching(appName) {
    console.log(`\n📥 Testing Data Fetching for ${appName}`);
    
    try {
      this.totalTests += 2; // Two data fetching tests
      
      // Test YC companies fetch
      const ycResult = await this.callMCPTool('fetch_yc_companies', {});
      if (ycResult.success) {
        const ycData = JSON.parse(ycResult.response.content[0].text);
        console.log(`  ✅ YC Companies: ${ycData.total} companies fetched`);
        this.passedTests++;
        this.testResults.push({
          test: `YC Data Fetch - ${appName}`,
          status: 'PASSED',
          count: ycData.total
        });
      } else {
        throw new Error('YC fetch failed: ' + ycResult.error);
      }
      
      // Test internal applications fetch
      const internalResult = await this.callMCPTool('fetch_internal_applications', {
        excludeUserId: 'test-user-001',
        forSimilarityAnalysis: true
      });
      
      if (internalResult.success) {
        const internalData = JSON.parse(internalResult.response.content[0].text);
        console.log(`  ✅ Internal Apps: ${internalData.total} applications fetched`);
        this.passedTests++;
        this.testResults.push({
          test: `Internal Data Fetch - ${appName}`,
          status: 'PASSED',
          count: internalData.total
        });
      } else {
        throw new Error('Internal fetch failed: ' + internalResult.error);
      }
      
    } catch (error) {
      console.log(`  ❌ Data Fetching Failed: ${error.message}`);
      this.testResults.push({
        test: `Data Fetching - ${appName}`,
        status: 'FAILED',
        error: error.message
      });
    }
  }

  async testErrorScenarios() {
    console.log(`\n🚨 Testing Error Scenarios and Edge Cases`);
    console.log('-' * 60);
    
    const errorTests = [
      {
        name: 'Invalid Tool Name',
        tool: 'non_existent_tool',
        args: {},
        expectedError: true
      },
      {
        name: 'Missing Required Fields',
        tool: 'analyze_idea_similarity',
        args: { userApplication: { title: 'Test' } }, // Missing required fields
        expectedError: true
      },
      {
        name: 'Empty Application Data',
        tool: 'analyze_internal_idea_similarity',
        args: { 
          userApplication: {
            title: '',
            description: '',
            problemStatement: '',
            proposedSolution: '',
            currentUserId: 'test'
          },
          internalData: { applications: [] }
        },
        expectedError: false // Should handle gracefully
      },
      {
        name: 'Invalid Cost Data',
        tool: 'analyze_cost_feasibility',
        args: {
          userApplication: {
            title: 'Test App',
            description: 'Test description',
            problemStatement: 'Test problem',
            proposedSolution: 'Test solution',
            techStack: [],
            teamSize: -1, // Invalid team size
            estimatedCost: -5000 // Invalid cost
          }
        },
        expectedError: false // Should handle gracefully with validation
      }
    ];
    
    for (const test of errorTests) {
      try {
        this.totalTests++;
        console.log(`\n🧪 Testing: ${test.name}`);
        
        const result = await this.callMCPTool(test.tool, test.args);
        
        if (test.expectedError && result.success) {
          console.log(`  ❌ Expected error but got success`);
          this.testResults.push({
            test: `Error Test - ${test.name}`,
            status: 'FAILED',
            error: 'Expected error but got success'
          });
        } else if (!test.expectedError && !result.success) {
          console.log(`  ❌ Unexpected error: ${result.error}`);
          this.testResults.push({
            test: `Error Test - ${test.name}`,
            status: 'FAILED',
            error: result.error
          });
        } else {
          console.log(`  ✅ Error handling correct`);
          this.passedTests++;
          this.testResults.push({
            test: `Error Test - ${test.name}`,
            status: 'PASSED'
          });
        }
        
      } catch (error) {
        console.log(`  ❌ Test execution failed: ${error.message}`);
        this.testResults.push({
          test: `Error Test - ${test.name}`,
          status: 'FAILED',
          error: error.message
        });
      }
    }
  }

  async callMCPTool(toolName, args) {
    const mcpRequest = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    };

    return new Promise((resolve) => {
      const mcpProcess = spawn('node', [this.mcpServerPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      mcpProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      mcpProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      mcpProcess.on('close', (code) => {
        try {
          if (code !== 0) {
            resolve({
              success: false,
              error: `Process exited with code ${code}. stderr: ${stderr}`
            });
            return;
          }

          // Parse the JSON response
          const lines = stdout.trim().split('\n');
          const lastLine = lines[lines.length - 1];
          
          if (!lastLine) {
            resolve({
              success: false,
              error: 'No response from MCP server'
            });
            return;
          }

          const response = JSON.parse(lastLine);
          
          if (response.error) {
            resolve({
              success: false,
              error: response.error.message || JSON.stringify(response.error)
            });
          } else {
            resolve({
              success: true,
              response: response.result
            });
          }
        } catch (parseError) {
          resolve({
            success: false,
            error: `Failed to parse response: ${parseError.message}. Raw output: ${stdout.substring(0, 200)}`
          });
        }
      });

      // Send the request
      mcpProcess.stdin.write(JSON.stringify(mcpRequest) + '\n');
      mcpProcess.stdin.end();
    });
  }

  printFinalResults() {
    console.log('\n' + '=' * 80);
    console.log('📊 COMPREHENSIVE TEST RESULTS');
    console.log('=' * 80);
    
    console.log(`\n📈 Overall Results:`);
    console.log(`   Total Tests: ${this.totalTests}`);
    console.log(`   Passed: ${this.passedTests}`);
    console.log(`   Failed: ${this.totalTests - this.passedTests}`);
    console.log(`   Success Rate: ${Math.round((this.passedTests / this.totalTests) * 100)}%`);
    
    console.log(`\n📋 Detailed Results:`);
    
    // Group results by test type
    const groupedResults = {};
    this.testResults.forEach(result => {
      const type = result.test.split(' - ')[0];
      if (!groupedResults[type]) groupedResults[type] = [];
      groupedResults[type].push(result);
    });
    
    Object.entries(groupedResults).forEach(([type, results]) => {
      console.log(`\n  🧪 ${type}:`);
      results.forEach(result => {
        const status = result.status === 'PASSED' ? '✅' : '❌';
        const extra = result.score ? ` (Score: ${Math.round(result.score * 100)}%)` : 
                     result.count ? ` (Count: ${result.count})` : 
                     result.error ? ` (Error: ${result.error.substring(0, 50)}...)` : '';
        console.log(`     ${status} ${result.test}${extra}`);
      });
    });
    
    // Recommendations
    console.log(`\n💡 Recommendations:`);
    const failedTests = this.testResults.filter(r => r.status === 'FAILED');
    
    if (failedTests.length === 0) {
      console.log(`   🎉 All tests passed! Your MCP server is working perfectly.`);
    } else {
      console.log(`   🔧 ${failedTests.length} tests failed. Check the errors above for debugging.`);
      
      // Common failure patterns
      const errorTypes = {};
      failedTests.forEach(test => {
        if (test.error) {
          const errorType = test.error.includes('fetch') ? 'Data Fetching' :
                           test.error.includes('parse') ? 'Response Parsing' :
                           test.error.includes('timeout') ? 'Timeout' : 'Other';
          errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
        }
      });
      
      Object.entries(errorTypes).forEach(([type, count]) => {
        console.log(`   • ${count} ${type} errors`);
      });
    }
    
    console.log('\n' + '=' * 80);
    console.log('🎯 Test Suite Complete!');
    console.log('=' * 80);
  }
}

// Run the tests
async function main() {
  const tester = new ComprehensiveMLPTester();
  await tester.runAllTests();
}

main().catch(console.error);