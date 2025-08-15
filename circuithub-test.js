// Manual CircuitHub Test

console.log('\n=== CircuitHub Y Combinator Detection Test ===');

// Your submitted data
const testCases = [
  {
    name: 'Your CircuitHub Submission',
    title: 'CircuitHub',
    description: 'On-Demand Electronics Manufacturing'
  },
  {
    name: 'CircuitHub Full Description',
    title: 'Electronics Manufacturing Platform',
    description: 'CircuitHub offers on-demand electronics manufacturing powered by our factory-scale robotics platform, The Grid. This platform delivers a 10x improvement in the speed and cost of small-batch electronics production.'
  },
  {
    name: 'Similar Concept',
    title: 'RoboManufacturing',
    description: 'Automated electronics production using advanced robotics for rapid prototyping'
  },
  {
    name: 'Different Idea',
    title: 'Pet Care App',
    description: 'Mobile application for scheduling veterinary appointments'
  }
];

// Mock YC database
const ycCompanies = [
  {
    name: "CircuitHub",
    oneLiner: "On-Demand Electronics Manufacturing",
    description: "CircuitHub offers on-demand electronics manufacturing powered by our factory-scale robotics platform, The Grid. This platform delivers a 10x improvement in the speed and cost of small-batch electronics production.",
    industry: "Industrials"
  }
];

// Test function
function calculateSimilarity(text1, text2) {
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  return intersection.size / union.size;
}

testCases.forEach(testCase => {
  console.log(`\n--- ${testCase.name} ---`);
  console.log(`Title: "${testCase.title}"`);
  console.log(`Description: "${testCase.description}"`);
  
  const titleLower = testCase.title.toLowerCase();
  const descLower = testCase.description.toLowerCase();
  
  let shouldReject = false;
  let maxSimilarity = 0;
  let matchedCompany = '';
  
  ycCompanies.forEach(company => {
    const companyNameLower = company.name.toLowerCase();
    const companyOneLinerLower = company.oneLiner.toLowerCase();
    const companyDescLower = company.description.toLowerCase();
    
    // Check for direct name match
    if (titleLower.includes(companyNameLower) || companyNameLower.includes(titleLower)) {
      shouldReject = true;
      maxSimilarity = 0.95;
      matchedCompany = company.name;
      console.log(`🚨 DIRECT MATCH: Title contains "${company.name}"`);
      return;
    }
    
    // Calculate semantic similarity
    const titleSim = calculateSimilarity(titleLower, companyOneLinerLower);
    const descSim = calculateSimilarity(descLower, companyDescLower);
    const overallSim = Math.max(titleSim, descSim * 0.8);
    
    console.log(`   Similarity to ${company.name}: ${(overallSim * 100).toFixed(1)}%`);
    console.log(`     - Title vs OneLiner: ${(titleSim * 100).toFixed(1)}%`);
    console.log(`     - Desc vs Company Desc: ${(descSim * 100).toFixed(1)}%`);
    
    if (overallSim > 0.7) {
      shouldReject = true;
      maxSimilarity = overallSim;
      matchedCompany = company.name;
    }
  });
  
  console.log(`\n📊 RESULT: ${shouldReject ? '❌ REJECTED' : '✅ APPROVED'}`);
  if (shouldReject) {
    console.log(`   Reason: ${(maxSimilarity * 100).toFixed(1)}% similar to "${matchedCompany}"`);
    console.log(`   This should have been caught by our improved detection!`);
  }
});

console.log('\n=== Why Your CircuitHub Submission Should Be Rejected ===');
console.log('1. EXACT NAME MATCH: "CircuitHub" is literally in the YC database');
console.log('2. BUSINESS MODEL MATCH: "On-Demand Electronics Manufacturing" matches exactly');
console.log('3. The old system used only random keyword matching');
console.log('4. The new system does direct name comparison and semantic analysis');
console.log('\nWith the updated code, CircuitHub submissions will be properly rejected!');
