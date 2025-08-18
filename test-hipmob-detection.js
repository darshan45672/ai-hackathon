#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Test the MCP server's ability to detect Hipmob-like applications
 */
async function testHipmobDetection() {
  console.log('🧪 Testing Hipmob Detection in MCP Server\n');

  const testCases = [
    {
      name: "Exact Name Match - Hipmob",
      userApplication: {
        title: "Hipmob",
        description: "Customer communication platform for mobile apps",
        targetMarket: "Mobile developers",
        businessModel: "SaaS"
      },
      expectedResult: "REJECT",
      reason: "Exact company name match"
    },
    {
      name: "Very Similar - Mobile Customer Service",
      userApplication: {
        title: "MobileChat Pro",
        description: "Live chat and customer service tools for iOS and Android developers. Help mobile businesses increase sales and transform customer support.",
        targetMarket: "Mobile app developers",
        businessModel: "SaaS subscription"
      },
      expectedResult: "REJECT",
      reason: "High conceptual similarity to Hipmob"
    },
    {
      name: "Similar but Different - Desktop Focus",
      userApplication: {
        title: "ChatDesk",
        description: "Customer service and live chat platform specifically for desktop web applications",
        targetMarket: "Web developers",
        businessModel: "Per-agent pricing"
      },
      expectedResult: "APPROVE",
      reason: "Different platform focus (desktop vs mobile)"
    },
    {
      name: "Different Domain - Gaming Chat",
      userApplication: {
        title: "GameTalk",
        description: "In-game communication and player engagement tools for game developers",
        targetMarket: "Game studios",
        businessModel: "Revenue sharing"
      },
      expectedResult: "APPROVE",
      reason: "Different vertical (gaming vs general mobile apps)"
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 Test Case: ${testCase.name}`);
    console.log(`Expected: ${testCase.expectedResult} (${testCase.reason})`);
    console.log('---');

    try {
      const result = await callMCPServer(testCase.userApplication);
      const recommendation = result.recommendation;
      const similarity = Math.round((result.similarityScore || 0) * 100);
      const mostSimilar = result.mostSimilarCompany?.name || 'None';

      console.log(`✅ Result: ${recommendation}`);
      console.log(`📊 Similarity: ${similarity}% (most similar: ${mostSimilar})`);
      
      if (recommendation === testCase.expectedResult) {
        console.log(`🎯 PASS - Got expected result: ${recommendation}`);
      } else {
        console.log(`❌ FAIL - Expected ${testCase.expectedResult}, got ${recommendation}`);
      }

      // Show detailed feedback for rejected applications
      if (recommendation === 'REJECT') {
        console.log(`💬 Feedback: ${result.feedback}`);
        if (result.mostSimilarCompany) {
          console.log(`🔍 Reason: ${result.mostSimilarCompany.reason}`);
        }
      }

    } catch (error) {
      console.error(`❌ ERROR in test case: ${error.message}`);
    }

    console.log(''); // Add spacing between tests
  }
}

/**
 * Call the MCP server with a test application
 */
async function callMCPServer(userApplication) {
  return new Promise((resolve, reject) => {
    const mcpServerPath = join(__dirname, 'mcp-server', 'index.js');
    const child = spawn('node', [mcpServerPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      try {
        // Parse the response from the MCP server
        const lines = stdout.split('\n').filter(line => line.trim());
        let result = null;

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.content && parsed.content[0] && parsed.content[0].text) {
              result = JSON.parse(parsed.content[0].text);
              break;
            }
          } catch (e) {
            // Skip lines that aren't JSON responses
          }
        }

        if (result) {
          resolve(result);
        } else {
          reject(new Error('No valid response from MCP server'));
        }
      } catch (error) {
        reject(error);
      }
    });

    child.on('error', (error) => {
      reject(error);
    });

    // First, fetch companies data
    const fetchRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'fetch_yc_companies',
        arguments: {
          forSimilarityAnalysis: true,
          includeInactive: true
        }
      }
    };

    child.stdin.write(JSON.stringify(fetchRequest) + '\n');

    // Small delay then send analysis request
    setTimeout(() => {
      const analysisRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'analyze_idea_similarity',
          arguments: {
            userApplication,
            externalData: {
              ycCompanies: [
                // Include Hipmob in test data
                {
                  name: "Hipmob",
                  oneLiner: "Customer communication for iOS and Android developers",
                  description: "Hipmob brings easy to use live chat, helpdesk, feedback and customer engagement tools to mobile and tablet businesses. Whether you're a mobile-native startup, a small business going mobile, or a large public company with a growing mobile business, we give you the tools to increase sales, transform customer support, and make your customers happy.",
                  tags: ["Customer Service", "Mobile", "Communication", "Live Chat"],
                  industry: "Consumer",
                  batch: "Winter 2012",
                  founded: 2012,
                  status: "Inactive"
                },
                // Add a few other companies for comparison
                {
                  name: "Stripe",
                  oneLiner: "Online payment processing",
                  description: "Stripe is a technology company that builds economic infrastructure for the internet.",
                  tags: ["Fintech", "Payments", "API"],
                  industry: "Fintech",
                  batch: "Summer 2009"
                },
                {
                  name: "Intercom",
                  oneLiner: "Customer messaging platform",
                  description: "Intercom is a customer communications platform that shows you who is using your product.",
                  tags: ["Customer Service", "Communication", "SaaS"],
                  industry: "B2B Software",
                  batch: "Not YC"
                }
              ]
            }
          }
        }
      };

      child.stdin.write(JSON.stringify(analysisRequest) + '\n');
      child.stdin.end();
    }, 100);
  });
}

// Run the tests
testHipmobDetection().catch(console.error);
