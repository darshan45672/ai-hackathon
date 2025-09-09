#!/usr/bin/env node

import { ExternalReviewMCPServer } from './index.js';

async function testYCAPIConnection() {
  console.log('🧪 Testing Y Combinator API Data Retrieval\n');
  
  const server = new (class TestMCPServer extends ExternalReviewMCPServer {
    // Override to test API connection directly
    async testFetchYCCompanies() {
      return this.fetchYCCompanies();
    }
  })();

  try {
    console.log('🔍 Fetching Y Combinator companies from API...');
    const result = await server.testFetchYCCompanies();
    
    if (result && result.content && result.content[0] && result.content[0].text) {
      const data = JSON.parse(result.content[0].text);
      
      console.log(`✅ API Response received`);
      console.log(`📊 Total companies: ${data.companies?.length || 0}`);
      console.log(`📡 Source: ${data.source}`);
      
      if (data.companies && data.companies.length > 0) {
        console.log('\n🔍 Searching for CircuitHub in the data...');
        
        const circuitHub = data.companies.find(company => 
          company.name && company.name.toLowerCase().includes('circuithub')
        );
        
        if (circuitHub) {
          console.log('✅ CircuitHub FOUND in Y Combinator data:');
          console.log(`📋 Name: ${circuitHub.name}`);
          console.log(`📝 One-liner: ${circuitHub.oneLiner || 'N/A'}`);
          console.log(`📄 Description: ${circuitHub.description || 'N/A'}`);
          console.log(`🏢 Industry: ${circuitHub.industry || 'N/A'}`);
          console.log(`📅 Batch: ${circuitHub.batch || 'N/A'}`);
          console.log(`🏷️  Tags: ${circuitHub.tags?.join(', ') || 'N/A'}`);
          console.log(`🌐 Website: ${circuitHub.website || 'N/A'}`);
          console.log(`📊 Status: ${circuitHub.status || 'N/A'}`);
        } else {
          console.log('❌ CircuitHub NOT FOUND in Y Combinator data');
          console.log('🔍 Let me search for similar names...');
          
          const similarNames = data.companies.filter(company => 
            company.name && (
              company.name.toLowerCase().includes('circuit') ||
              company.name.toLowerCase().includes('hub') ||
              company.name.toLowerCase().includes('electronic') ||
              company.name.toLowerCase().includes('manufacturing')
            )
          );
          
          if (similarNames.length > 0) {
            console.log(`🔍 Found ${similarNames.length} companies with similar names:`);
            similarNames.slice(0, 5).forEach(company => {
              console.log(`  - ${company.name} (${company.industry || 'Unknown industry'})`);
            });
          } else {
            console.log('❌ No similar names found either');
          }
        }
        
        // Sample first few companies
        console.log('\n📋 Sample of first 5 companies in the dataset:');
        data.companies.slice(0, 5).forEach((company, index) => {
          console.log(`${index + 1}. ${company.name} - ${company.oneLiner || 'No description'} (${company.batch || 'No batch'})`);
        });
        
      } else {
        console.log('❌ No companies found in API response');
      }
      
    } else {
      console.log('❌ Invalid API response format');
      console.log('📄 Raw response:', result);
    }
    
  } catch (error) {
    console.error('❌ Failed to fetch Y Combinator data:', error.message);
    if (error.response) {
      console.error('📄 Response status:', error.response.status);
      console.error('📄 Response data:', error.response.data);
    }
  }
}

testYCAPIConnection().catch(console.error);
