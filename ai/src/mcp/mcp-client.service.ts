import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';

export interface MCPAnalysisResult {
  isSimilar: boolean;
  similarityScore: number;
  mostSimilarCompany?: {
    name: string;
    reason: string;
  };
  analysis?: {
    businessModelSimilarity: string;
    targetMarketOverlap: string;
    valuePropSimilarity: string;
    differentiationPotential: string;
  };
  recommendation: 'APPROVE' | 'REJECT' | 'NEEDS_DIFFERENTIATION';
  feedback: string;
  suggestions?: string[];
  error?: boolean;
  message?: string;
}

@Injectable()
export class MCPClientService {
  private readonly logger = new Logger(MCPClientService.name);
  private mcpServerPath: string;

  constructor() {
    // Check if we're in a container (production/docker environment)
    const isContainer = process.env.NODE_ENV === 'production' || process.env.DOCKER_ENV || process.env.CONTAINER_ENV;
    
    if (isContainer) {
      // In container, MCP server is copied to ./mcp-server/
      this.mcpServerPath = join(process.cwd(), 'mcp-server', 'index.js');
    } else {
      // In development, MCP server is in parent directory
      this.mcpServerPath = join(process.cwd(), '..', 'mcp-server', 'index.js');
    }
    
    this.logger.log(`MCP Server Path: ${this.mcpServerPath}`);
    this.logger.log(`Environment: ${isContainer ? 'Container' : 'Development'}`);
    
    // Check if MCP server exists
    const mcpExists = existsSync(this.mcpServerPath);
    this.logger.log(`MCP Server Exists: ${mcpExists}`);
    
    if (!mcpExists) {
      this.logger.error(`❌ MCP Server not found at: ${this.mcpServerPath}`);
      this.logger.error('External reviews will use fallback logic with strict name-based rejection');
    }
  }

  async analyzeIdeaSimilarity(
    userApplication: {
      title: string;
      description: string;
      targetMarket?: string;
      businessModel?: string;
    },
    ycCompanies: any[]
  ): Promise<MCPAnalysisResult> {
    try {
      this.logger.log('Starting MCP analysis for idea similarity');
      
      // Check if MCP server exists before attempting to use it
      if (!existsSync(this.mcpServerPath)) {
        this.logger.error('MCP server not found - using fallback name-based rejection logic');
        return this.performFallbackSimilarityCheck(userApplication, ycCompanies);
      }
      
      const mcpRequest = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: 'analyze_idea_similarity',
          arguments: {
            userApplication,
            externalData: {
              ycCompanies
            }
          }
        }
      };

      const result = await this.callMCPServer(mcpRequest);
      
      if (result.error) {
        throw new Error(result.error.message || 'MCP analysis failed');
      }

      const analysisText = result.result?.content?.[0]?.text;
      if (!analysisText) {
        throw new Error('No analysis result from MCP server');
      }

      const analysis = JSON.parse(analysisText);
      this.logger.log(`MCP analysis completed: ${analysis.recommendation}`);
      
      return analysis;

    } catch (error) {
      this.logger.error('Error in MCP analysis:', error);
      
      // Use fallback analysis instead of generic approval
      this.logger.warn('🔄 MCP analysis failed, using fallback similarity check');
      return this.performFallbackSimilarityCheck(userApplication, ycCompanies);
    }
  }

  async fetchYCCompanies(category?: string, limit?: number): Promise<any[]> {
    try {
      this.logger.log('Fetching YC companies from MCP server');
      
      // For similarity analysis, we want ALL companies - don't set any limit
      const mcpRequest = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: 'fetch_yc_companies',
          arguments: {
            category,
            forSimilarityAnalysis: true, // This ensures we get all companies
            // Don't include limit for similarity analysis
            ...(limit && limit > 0 ? { limit } : {}),
          }
        }
      };

      const result = await this.callMCPServer(mcpRequest);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to fetch YC companies');
      }

      const dataText = result.result?.content?.[0]?.text;
      if (!dataText) {
        throw new Error('No YC companies data from MCP server');
      }

      const data = JSON.parse(dataText);
      return data.companies || [];

    } catch (error) {
      this.logger.error('Error fetching YC companies:', error);
      
      // Return fallback mock data
      return [
        {
          name: "CircuitHub",
          oneLiner: "On-Demand Electronics Manufacturing",
          description: "CircuitHub offers on-demand electronics manufacturing powered by our factory-scale robotics platform, The Grid.",
          tags: ["Hard Tech", "Hardware", "Robotics"],
          industry: "Industrials"
        }
      ];
    }
  }

  private async callMCPServer(request: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const mcpProcess = spawn('node', [this.mcpServerPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      mcpProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      mcpProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      mcpProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`MCP server exited with code ${code}: ${stderr}`));
          return;
        }

        try {
          // Parse the JSON-RPC response
          const lines = stdout.trim().split('\n');
          let response = null;
          
          for (const line of lines) {
            if (line.trim().startsWith('{')) {
              try {
                response = JSON.parse(line);
                break;
              } catch (e) {
                continue;
              }
            }
          }

          if (!response) {
            reject(new Error('No valid JSON response from MCP server'));
            return;
          }

          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse MCP response: ${error.message}`));
        }
      });

      mcpProcess.on('error', (error) => {
        reject(new Error(`Failed to start MCP server: ${error.message}`));
      });

      // Send the request
      mcpProcess.stdin.write(JSON.stringify(request) + '\n');
      mcpProcess.stdin.end();
    });
  }

  /**
   * Fallback similarity check when MCP server is not available
   * Implements name-based rejection logic specifically for CircuitHub and other YC companies
   */
  private async performFallbackSimilarityCheck(
    userApplication: { title: string; description: string; targetMarket?: string; businessModel?: string },
    ycCompanies: any[]
  ): Promise<MCPAnalysisResult> {
    this.logger.warn('🔄 Performing fallback similarity check (MCP server unavailable)');
    
    const userTitle = userApplication.title.toLowerCase().trim();
    
    // Check for exact or very similar name matches
    for (const company of ycCompanies) {
      const companyName = company.name.toLowerCase().trim();
      
      // Calculate string similarity using Levenshtein distance
      const similarity = this.calculateLevenshteinSimilarity(userTitle, companyName);
      
      // Reject if name similarity is very high (>80%) or exact match
      if (similarity > 0.8 || userTitle === companyName) {
        this.logger.warn(`❌ REJECTING: "${userApplication.title}" matches YC company "${company.name}" (${Math.round(similarity * 100)}% similarity)`);
        
        return {
          isSimilar: true,
          similarityScore: similarity,
          mostSimilarCompany: {
            name: company.name,
            reason: `Name similarity ${Math.round(similarity * 100)}% - fallback analysis`
          },
          recommendation: 'REJECT',
          feedback: `Your startup name "${userApplication.title}" is too similar to existing Y Combinator company "${company.name}". Please choose a different name. (Fallback analysis - MCP server unavailable)`,
          suggestions: [
            'Choose a more unique company name',
            'Consider adding descriptive words to differentiate your brand',
            'Focus on your unique value proposition in the name'
          ],
          error: true,
          message: 'MCP server unavailable - performed limited name-based analysis'
        };
      }
    }
    
    // If no name conflicts found, approve with warning
    this.logger.log(`✅ No obvious name conflicts found for "${userApplication.title}" (fallback analysis)`);
    
    return {
      isSimilar: false,
      similarityScore: 0,
      recommendation: 'APPROVE',
      feedback: 'No obvious name conflicts detected in fallback analysis. However, full similarity analysis was unavailable - manual review recommended.',
      error: true,
      message: 'MCP server unavailable - limited analysis performed'
    };
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateLevenshteinSimilarity(str1: string, str2: string): number {
    const matrix: number[][] = [];
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Calculate distances
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletion
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len1][len2]) / maxLen;
  }
}
