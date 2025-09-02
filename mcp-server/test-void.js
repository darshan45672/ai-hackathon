#!/usr/bin/env node

import axios from 'axios';

console.log('🧪 Testing Void Company Detection...');

async function testVoidDetection() {
  try {
    // Fetch YC companies
    console.log('📊 Fetching YC companies...');
    const response = await axios.get('https://yc-oss.github.io/api/companies/all.json');
    
    const allCompanies = Array.isArray(response.data) ? response.data : [];
    console.log('Total companies found:', allCompanies.length);
    
    // Search for Void specifically
    console.log('\n🔍 Searching for Void...');
    const voidCompanies = allCompanies.filter(company => 
      company.name && company.name.toLowerCase().includes('void')
    );
    
    console.log(`Found ${voidCompanies.length} companies with "void" in the name:`);
    voidCompanies.forEach(company => {
      console.log(`  - ${company.name} (${company.batch || 'No batch'}) - ${company.status || 'Unknown status'}`);
      console.log(`    Description: ${company.one_liner || 'No description'}`);
      console.log(`    Website: ${company.website || 'No website'}`);
      console.log('');
    });
    
    // Test exact match
    const userTitle = "Void";
    const exactMatch = allCompanies.find(company => 
      company.name.toLowerCase() === userTitle.toLowerCase()
    );
    
    if (exactMatch) {
      console.log('✅ EXACT MATCH found for "Void":');
      console.log('  Name:', exactMatch.name);
      console.log('  Batch:', exactMatch.batch);
      console.log('  Status:', exactMatch.status);
      console.log('  Description:', exactMatch.one_liner);
    } else {
      console.log('❌ NO exact match found for "Void"');
    }
    
    // Test normalized match
    const normalizedUserTitle = userTitle.replace(/[^a-z0-9]/g, '');
    const normalizedMatch = allCompanies.find(company => {
      const normalizedCompanyName = company.name.replace(/[^a-z0-9]/g, '');
      return normalizedUserTitle.toLowerCase() === normalizedCompanyName.toLowerCase();
    });
    
    if (normalizedMatch) {
      console.log('✅ NORMALIZED MATCH found for "Void":');
      console.log('  Name:', normalizedMatch.name);
    } else {
      console.log('❌ NO normalized match found for "Void"');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testVoidDetection();
