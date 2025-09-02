#!/usr/bin/env node

const fetch = require('node-fetch');

async function testSubmitAPI() {
  try {
    // First, get a user token (using the existing user login)
    console.log('🔑 Logging in to get user token...');
    const loginResponse = await fetch('http://localhost/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      }),
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed:', loginResponse.status, await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful, got token');

    // Now test the submit API
    console.log('📝 Testing application submission...');
    const submissionData = {
      title: "Test Cost Analysis App",
      description: "A test application to verify cost analysis functionality",
      problemStatement: "Testing the cost estimation feature",
      solution: "Building a React app with AI integration",
      techStack: ["React", "Node.js", "AI", "PostgreSQL"],
      teamSize: 3,
      teamMembers: ["Alice Developer", "Bob Designer", "Charlie QA"],
      githubRepo: "https://github.com/test/test-repo",
      demoUrl: "https://test-demo.com",
      estimatedCost: 15000,
      status: "SUBMITTED"
    };

    console.log('Sending data:', JSON.stringify(submissionData, null, 2));

    const submitResponse = await fetch('http://localhost/api/applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(submissionData),
    });

    console.log('📊 Response status:', submitResponse.status);
    console.log('📊 Response headers:', Object.fromEntries(submitResponse.headers.entries()));
    
    const responseText = await submitResponse.text();
    console.log('📊 Response body:', responseText);

    if (submitResponse.ok) {
      console.log('✅ Application submitted successfully!');
      const application = JSON.parse(responseText);
      console.log('📄 Application ID:', application.id);
      console.log('💰 Estimated Cost:', application.estimatedCost);
    } else {
      console.log('❌ Submission failed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSubmitAPI();
