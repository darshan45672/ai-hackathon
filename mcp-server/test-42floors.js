#!/usr/bin/env node

import { ExternalReviewMCPServer } from './index.js';
import axios from 'axios';

console.log('🧪 Testing 42Floors Detection...');

// Test the similarity detection specifically for 42Floors
async function test42FloorsDetection() {
  try {
    // Fetch YC companies
    console.log('📊 Fetching YC companies...');
    const response = await axios.get('https://yc-oss.github.io/api/companies/all.json');
    console.log('Response status:', response.status);
    console.log('Response data type:', typeof response.data);
    console.log('Response data length:', Array.isArray(response.data) ? response.data.length : 'Not an array');
    
    // The API returns an array of companies directly, not batches
    const allCompanies = Array.isArray(response.data) ? response.data : [];
    console.log('Total companies found:', allCompanies.length);
    
    if (allCompanies.length > 0) {
      console.log('Sample company:', {
        name: allCompanies[0].name,
        batch: allCompanies[0].batch,
        status: allCompanies[0].status
      });
    }
    
    // Search for 42Floors with various patterns
    console.log('\n🔍 Searching for 42Floors...');
    const patterns = ['42floors', '42 floors', 'floors'];
    
    let floors42 = null;
    
    for (const pattern of patterns) {
      const matches = allCompanies.filter(company => 
        company.name && company.name.toLowerCase().includes(pattern.toLowerCase())
      );
      console.log(`Pattern "${pattern}": ${matches.length} matches`);
      if (matches.length > 0) {
        matches.forEach(match => {
          console.log(`  - ${match.name} (${match.batch || 'No batch'})`);
          if (match.name.toLowerCase() === '42floors') {
            floors42 = match;
          }
        });
      }
    }
    
    if (floors42) {
      console.log('\n✅ Found 42Floors in YC data:');
      console.log('  Name:', floors42.name);
      console.log('  Slug:', floors42.slug);
      console.log('  One Liner:', floors42.one_liner);
      console.log('  Batch:', floors42.batch);
      console.log('  Status:', floors42.status);
    } else {
      console.log('\n❌ 42Floors NOT found in YC data');
    }
    
    // Test user application
    const userApplication = {
      title: "42Floors",
      description: "We make it easy to search for office space. Acquired by Knotel in 2018. 42Floors was founded in November of 2011 with the vision of making it easy to discover and create your dream office space.",
      problemStatement: "Commercial real estate search is difficult and time-consuming",
      proposedSolution: "Online platform to search and discover office spaces"
    };
    
    // Create minimal YC companies array with 42Floors
    const ycCompanies = floors42 ? [floors42] : [];
    
    if (ycCompanies.length > 0) {
      // Test the similarity analysis
      console.log('\n🔍 Testing similarity analysis...');
      console.log('User title (lower):', userApplication.title.toLowerCase());
      console.log('Company name (lower):', ycCompanies[0].name.toLowerCase());
      
      // Test exact string match
      const userTitleNormalized = userApplication.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      const companyNameNormalized = ycCompanies[0].name.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      console.log('Normalized user title:', userTitleNormalized);
      console.log('Normalized company name:', companyNameNormalized);
      console.log('Exact match?', userTitleNormalized === companyNameNormalized);
      
      // Test Levenshtein similarity
      function calculateStringSimilarity(str1, str2) {
        const len1 = str1.length;
        const len2 = str2.length;
        const matrix = [];

        for (let i = 0; i <= len2; i++) {
          matrix[i] = [i];
        }

        for (let j = 0; j <= len1; j++) {
          matrix[0][j] = j;
        }

        for (let i = 1; i <= len2; i++) {
          for (let j = 1; j <= len1; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
              matrix[i][j] = matrix[i - 1][j - 1];
            } else {
              matrix[i][j] = Math.min(
                matrix[i - 1][j - 1] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j] + 1
              );
            }
          }
        }

        const distance = matrix[len2][len1];
        const maxLen = Math.max(len1, len2);
        return maxLen === 0 ? 1 : 1 - distance / maxLen;
      }
      
      const similarity = calculateStringSimilarity(
        userApplication.title.toLowerCase(), 
        ycCompanies[0].name.toLowerCase()
      );
      
      console.log('Similarity score:', similarity);
      console.log('Should reject?', similarity > 0.85 || userTitleNormalized === companyNameNormalized);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

test42FloorsDetection();
