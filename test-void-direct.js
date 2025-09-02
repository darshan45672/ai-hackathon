// Direct MCP Server Test
console.log('🧪 Direct MCP Server Test for Void...');

const ExternalReviewMCPServer = require('/app/mcp-server/index.js');

async function testVoidDirect() {
  try {
    console.log('📋 Creating MCP server instance...');
    const server = new ExternalReviewMCPServer();
    
    console.log('📤 Calling analyzeIdeaSimilarity directly...');
    const result = await server.analyzeIdeaSimilarity({
      userApplication: {
        title: 'Void',
        description: 'Open source code editor with AI features similar to Cursor and GitHub Copilot. Unlike other tools, Void lets developers keep their data completely private by connecting directly to any LLM.',
        problemStatement: 'Developers want AI-powered code assistance but are concerned about data privacy and vendor lock-in with proprietary tools.',
        proposedSolution: 'Create an open-source code editor that provides AI features while ensuring complete data privacy through direct LLM connections.',
        targetMarket: 'Privacy-conscious developers and enterprises',
        businessModel: 'Open source with premium enterprise features'
      },
      externalData: {
        ycCompanies: []  // Empty array to force fetching
      }
    });
    
    console.log('📥 Result:', result);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('🔍 Stack:', error.stack);
  }
}

testVoidDirect();
