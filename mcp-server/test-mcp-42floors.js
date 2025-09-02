#!/usr/bin/env node

import { ExternalReviewMCPServer } from './index.js';

console.log('🧪 Testing MCP Server with 42Floors...');

async function testMCPServer() {
  try {
    const server = new ExternalReviewMCPServer();
    
    // Test user application mimicking 42Floors
    const userApplication = {
      title: "42Floors",
      description: "We make it easy to search for office space. Acquired by Knotel in 2018. 42Floors was founded in November of 2011 with the vision of making it easy to discover and create your dream office space. Based in San Francisco, the 42Floors team is made up of experienced entrepreneurs, engineers, and real estate professionals. All with a passion for making the commercial real estate search process easier for everyone.",
      problemStatement: "Commercial real estate search is difficult and time-consuming",
      proposedSolution: "Online platform to search and discover office spaces",
      targetMarket: "Businesses looking for office space",
      businessModel: "Commission from real estate transactions"
    };
    
    // Fetch YC companies
    console.log('📊 Fetching YC companies...');
    const ycResponse = await server.fetchYCCompanies();
    
    // The response might be structured differently
    console.log('YC Response structure:', Object.keys(ycResponse));
    
    let ycCompanies;
    if (ycResponse.companies) {
      ycCompanies = ycResponse.companies;
    } else if (Array.isArray(ycResponse)) {
      ycCompanies = ycResponse;
    } else {
      console.log('Full response:', ycResponse);
      throw new Error('Unexpected response structure');
    }
    
    console.log(`Found ${ycCompanies.length} YC companies`);
    
    // Check if 42Floors is in the data
    const floors42 = ycCompanies.find(company => 
      company.name.toLowerCase() === '42floors'
    );
    
    if (floors42) {
      console.log('✅ 42Floors found in YC data:', floors42.name);
    } else {
      console.log('❌ 42Floors NOT found in YC data');
    }
    
    // Test the similarity analysis
    console.log('\n🔍 Testing similarity analysis...');
    const externalData = { ycCompanies };
    
    const result = await server.analyzeIdeaSimilarity({
      userApplication,
      externalData
    });
    
    console.log('\n📊 MCP Server Result:');
    console.log('Status:', result.status);
    console.log('Confidence:', result.confidence);
    console.log('Reason:', result.reason);
    console.log('Similar Company:', result.similarCompany?.name || 'None');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error(error.stack);
  }
}

testMCPServer();
