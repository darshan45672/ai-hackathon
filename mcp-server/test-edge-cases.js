#!/usr/bin/env node

// Test edge cases for CircuitHub detection
import { ExternalReviewMCPServer } from './index.js';

async function testEdgeCases() {
  console.log('🧪 Testing CircuitHub edge cases...\n');
  
  const server = new ExternalReviewMCPServer();
  
  // Test cases with different variations
  const testCases = [
    {
      name: "Exact match",
      application: {
        title: "CircuitHub",
        description: "On-Demand Electronics Manufacturing",
        problemStatement: "Small-batch electronics production",
        proposedSolution: "Robotics platform for manufacturing"
      }
    },
    {
      name: "Lowercase match", 
      application: {
        title: "circuithub",
        description: "On-Demand Electronics Manufacturing",
        problemStatement: "Small-batch electronics production",
        proposedSolution: "Robotics platform for manufacturing"
      }
    },
    {
      name: "Different case",
      application: {
        title: "CIRCUITHUB",
        description: "On-Demand Electronics Manufacturing", 
        problemStatement: "Small-batch electronics production",
        proposedSolution: "Robotics platform for manufacturing"
      }
    },
    {
      name: "With spaces",
      application: {
        title: "Circuit Hub",
        description: "On-Demand Electronics Manufacturing",
        problemStatement: "Small-batch electronics production", 
        proposedSolution: "Robotics platform for manufacturing"
      }
    },
    {
      name: "Similar but different",
      application: {
        title: "CircuitHubPro",
        description: "On-Demand Electronics Manufacturing",
        problemStatement: "Small-batch electronics production",
        proposedSolution: "Robotics platform for manufacturing"
      }
    }
  ];
  
  // Get YC companies once
  const ycResult = await server.fetchYCCompanies();
  const ycData = JSON.parse(ycResult.content[0].text);
  
  console.log(`📊 Testing against ${ycData.companies.length} companies\n`);
  
  for (const testCase of testCases) {
    console.log(`🎯 Testing: ${testCase.name} - "${testCase.application.title}"`);
    
    try {
      const analysisResult = await server.analyzeIdeaSimilarity({
        userApplication: testCase.application,
        externalData: { ycCompanies: ycData.companies }
      });
      
      const analysis = JSON.parse(analysisResult.content[0].text);
      
      const status = analysis.recommendation === 'REJECT' ? '❌ REJECTED' : '✅ APPROVED';
      const similarCompany = analysis.mostSimilarCompany?.name || 'none';
      const score = Math.round(analysis.similarityScore * 100);
      
      console.log(`   ${status} (${score}% similarity with ${similarCompany})`);
      
    } catch (error) {
      console.log(`   ⚠️ ERROR: ${error.message}`);
    }
    console.log('');
  }
}

testEdgeCases().catch(console.error);
