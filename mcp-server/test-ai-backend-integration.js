#!/usr/bin/env node

import axios from 'axios';

async function testAIBackendLenientAnalysis() {
  console.log('🧪 Testing AI Backend Integration with Lenient Y Combinator Analysis\n');
  
  const backendUrl = 'http://localhost:3002'; // AI backend URL
  
  // Test application that should be approved (AI-powered fintech)
  const testApplication = {
    title: "SmartFinance AI",
    description: "AI-powered personal finance management using machine learning for predictive budgeting and investment recommendations",
    problemStatement: "People struggle with financial planning and don't know how to optimize their spending and investments",
    proposedSolution: "Machine learning algorithms analyze spending patterns and provide personalized financial advice with automated investment portfolio management",
    targetMarket: "Young professionals and millennials who want automated financial planning",
    businessModel: "Freemium SaaS with premium AI features subscription"
  };

  try {
    console.log('📤 Sending test application to AI backend...');
    console.log(`📋 Application: ${testApplication.title}`);
    console.log(`📝 Description: ${testApplication.description.substring(0, 100)}...`);
    
    const response = await axios.post(`${backendUrl}/ai/analyze-application`, {
      userApplication: testApplication
    });

    console.log('📥 Response received:');
    console.log(`📊 Status: ${response.status}`);
    console.log(`🎯 Recommendation: ${response.data.recommendation}`);
    console.log(`📈 Similarity: ${response.data.overallSimilarity || response.data.similarityScore}%`);
    console.log(`💭 Feedback: ${response.data.feedback || response.data.reason}`);
    
    if (response.data.recommendation === 'APPROVE') {
      console.log('✅ Test PASSED: Application correctly approved');
    } else {
      console.log('❌ Test FAILED: Application incorrectly rejected');
      console.log('🔍 This suggests the MCP server might be too strict');
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('⚠️  AI Backend not running. To test the full integration:');
      console.log('1. Start the AI backend: cd ai && npm run start:dev');
      console.log('2. Re-run this test');
    } else {
      console.error('❌ Test failed:', error.message);
      if (error.response) {
        console.error('📄 Response data:', error.response.data);
      }
    }
  }
}

testAIBackendLenientAnalysis().catch(console.error);
