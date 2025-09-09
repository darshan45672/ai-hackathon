#!/usr/bin/env node

import { ExternalReviewMCPServer } from './index.js';

async function testYCLenientAnalysis() {
  console.log('🧪 Testing Y Combinator Lenient Analysis\n');
  
  const server = new (class TestMCPServer extends ExternalReviewMCPServer {
    // Override to use fallback analysis directly for testing
    async testFallbackAnalysis(userApplication, ycCompanies) {
      return this.fallbackSimilarityAnalysis(userApplication, ycCompanies);
    }
  })();

  // Mock Y Combinator companies data
  const mockYCCompanies = [
    {
      name: "Stripe",
      oneLiner: "Online payment processing for internet businesses",
      description: "Stripe is a technology company that builds economic infrastructure for the internet. Businesses of every size use Stripe's software and APIs to accept payments, send payouts, and manage their businesses online.",
      industry: "Fintech",
      tags: ["payments", "fintech", "api", "software"],
      batch: "S09",
      status: "Public"
    },
    {
      name: "Airbnb", 
      oneLiner: "Online marketplace for short-term homestays and experiences",
      description: "Airbnb is an online marketplace that connects people who want to rent out their homes with people looking for accommodations in specific locales.",
      industry: "Marketplace",
      tags: ["marketplace", "travel", "rental", "accommodation"],
      batch: "W08",
      status: "Public"
    },
    {
      name: "Intercom",
      oneLiner: "Customer messaging platform for sales, marketing and support",
      description: "Intercom makes customer messaging apps for sales, marketing, and support, connected on one platform.",
      industry: "B2B Software",
      tags: ["customer service", "messaging", "support", "communication"],
      batch: "S11", 
      status: "Private"
    }
  ];

  // Test Case 1: Different approach to payments (should be APPROVED)
  console.log('🧪 Test 1: Different approach to payments (should be APPROVED)');
  const testApp1 = {
    title: "CryptoPay Pro",
    description: "Cryptocurrency payment processing platform specifically for NFT marketplaces and DeFi protocols",
    problemStatement: "NFT marketplaces and DeFi protocols need specialized crypto payment processing that traditional payment processors don't support",
    proposedSolution: "Native blockchain payment processing with multi-chain support, smart contract integration, and DeFi-specific features",
    targetMarket: "NFT marketplaces, DeFi protocols, crypto businesses",
    businessModel: "Transaction fee on crypto payments with premium API access"
  };

  try {
    const result1 = await server.testFallbackAnalysis(testApp1, mockYCCompanies);
    const analysis1 = JSON.parse(result1.content[0].text);
    console.log(`📊 Result: ${analysis1.recommendation}`);
    console.log(`📈 Similarity: ${analysis1.overallSimilarity || analysis1.similarityScore}%`);
    console.log(`💭 Reason: ${analysis1.reason || analysis1.feedback}`);
    console.log();
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
  }

  // Test Case 2: AI-powered customer service (should be APPROVED due to AI differentiation)
  console.log('🧪 Test 2: AI-powered customer service (should be APPROVED due to AI differentiation)');
  const testApp2 = {
    title: "SupportBot AI",
    description: "AI-powered customer support platform using machine learning and natural language processing for automated ticket resolution",
    problemStatement: "Customer support teams are overwhelmed with repetitive queries and need intelligent automation",
    proposedSolution: "Advanced AI chatbots with deep learning capabilities, automated ticket classification, and predictive customer issue resolution",
    targetMarket: "Enterprise SaaS companies, e-commerce platforms",
    businessModel: "SaaS subscription with usage-based pricing for AI processing"
  };

  try {
    const result2 = await server.testFallbackAnalysis(testApp2, mockYCCompanies);
    const analysis2 = JSON.parse(result2.content[0].text);
    console.log(`📊 Result: ${analysis2.recommendation}`);
    console.log(`📈 Similarity: ${analysis2.overallSimilarity || analysis2.similarityScore}%`);
    console.log(`💭 Reason: ${analysis2.reason || analysis2.feedback}`);
    console.log();
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
  }

  // Test Case 3: Rental marketplace for different market (should be APPROVED due to market differentiation)
  console.log('🧪 Test 3: Rental marketplace for different market (should be APPROVED due to market differentiation)');
  const testApp3 = {
    title: "ToolRent",
    description: "Peer-to-peer marketplace for renting construction tools and equipment in developing countries",
    problemStatement: "Small contractors in developing countries can't afford expensive construction equipment",
    proposedSolution: "Mobile-first marketplace connecting equipment owners with contractors, with local payment methods and pickup/delivery",
    targetMarket: "Small contractors and construction workers in Africa and Asia",
    businessModel: "Commission on rentals with mobile money integration"
  };

  try {
    const result3 = await server.testFallbackAnalysis(testApp3, mockYCCompanies);
    const analysis3 = JSON.parse(result3.content[0].text);
    console.log(`📊 Result: ${analysis3.recommendation}`);
    console.log(`📈 Similarity: ${analysis3.overallSimilarity || analysis3.similarityScore}%`);
    console.log(`💭 Reason: ${analysis3.reason || analysis3.feedback}`);
    console.log();
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message);
  }

  // Test Case 4: Exact duplicate (should be REJECTED)
  console.log('🧪 Test 4: Exact duplicate (should be REJECTED)');
  const testApp4 = {
    title: "Stripe Clone",
    description: "Online payment processing for internet businesses with APIs",
    problemStatement: "Businesses need to accept online payments",
    proposedSolution: "Payment processing APIs and dashboard for businesses",
    targetMarket: "Internet businesses",
    businessModel: "Transaction fees"
  };

  try {
    const result4 = await server.testFallbackAnalysis(testApp4, mockYCCompanies);
    const analysis4 = JSON.parse(result4.content[0].text);
    console.log(`📊 Result: ${analysis4.recommendation}`);
    console.log(`📈 Similarity: ${analysis4.overallSimilarity || analysis4.similarityScore}%`);
    console.log(`💭 Reason: ${analysis4.reason || analysis4.feedback}`);
  } catch (error) {
    console.error('❌ Test 4 failed:', error.message);
  }

  console.log('\n✅ Y Combinator lenient analysis testing complete!');
  console.log('Expected results:');
  console.log('- Test 1: APPROVED (different crypto approach)');
  console.log('- Test 2: APPROVED (AI differentiation)'); 
  console.log('- Test 3: APPROVED (different market)');
  console.log('- Test 4: REJECTED (too similar)');
}

testYCLenientAnalysis().catch(console.error);
