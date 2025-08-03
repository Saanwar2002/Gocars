/**
 * API Documentation Service
 * Comprehensive API documentation system with interactive testing and SDK generation
 */

import { 
  collection, 
  doc, 
  getDocs, 
  addDoc,
  updateDoc,
  query, 
  where, 
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// API Documentation Types
export interface APIEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  summary: string;
  description: string;
  tags: string[];
  parameters: APIParameter[];
  requestBody?: APIRequestBody;
  responses: APIResponse[];
  security: SecurityRequirement[];
  deprecated: boolean;
  version: string;
  examples: APIExample[];
  rateLimit?: RateLimit;
  createdAt: Date;
  updatedAt: Date;
}

export interface APIParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  description: string;
  required: boolean;
  schema: APISchema;
  example?: any;
}

export interface APIRequestBody {
  description: string;
  required: boolean;
  content: {
    [mediaType: string]: {
      schema: APISchema;
      examples?: { [key: string]: APIExample };
    };
  };
}

export interface APIResponse {
  statusCode: string;
  description: string;
  headers?: { [key: string]: APIHeader };
  content?: {
    [mediaType: string]: {
      schema: APISchema;
      examples?: { [key: string]: APIExample };
    };
  };
}

export interface APISchema {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  format?: string;
  properties?: { [key: string]: APISchema };
  items?: APISchema;
  required?: string[];
  enum?: any[];
  minimum?: number;
  maximum?: number;
  pattern?: string;
  example?: any;
}

export interface APIExample {
  summary: string;
  description?: string;
  value: any;
}

export interface APIHeader {
  description: string;
  schema: APISchema;
  required?: boolean;
}

export interface SecurityRequirement {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  name?: string;
  in?: 'query' | 'header' | 'cookie';
  scheme?: string;
  bearerFormat?: string;
  flows?: OAuthFlows;
}

export interface OAuthFlows {
  implicit?: OAuthFlow;
  password?: OAuthFlow;
  clientCredentials?: OAuthFlow;
  authorizationCode?: OAuthFlow;
}

export interface OAuthFlow {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: { [key: string]: string };
}

export interface RateLimit {
  requests: number;
  window: string; // e.g., '1h', '1m', '1s'
  burst?: number;
}

export interface APIDocumentation {
  openapi: string;
  info: APIInfo;
  servers: APIServer[];
  paths: { [path: string]: { [method: string]: APIEndpoint } };
  components: APIComponents;
  security: SecurityRequirement[];
  tags: APITag[];
}

export interface APIInfo {
  title: string;
  description: string;
  version: string;
  termsOfService?: string;
  contact?: APIContact;
  license?: APILicense;
}

export interface APIContact {
  name: string;
  url?: string;
  email: string;
}

export interface APILicense {
  name: string;
  url?: string;
}

export interface APIServer {
  url: string;
  description: string;
  variables?: { [key: string]: APIServerVariable };
}

export interface APIServerVariable {
  enum?: string[];
  default: string;
  description?: string;
}

export interface APIComponents {
  schemas: { [key: string]: APISchema };
  responses: { [key: string]: APIResponse };
  parameters: { [key: string]: APIParameter };
  examples: { [key: string]: APIExample };
  requestBodies: { [key: string]: APIRequestBody };
  headers: { [key: string]: APIHeader };
  securitySchemes: { [key: string]: SecurityRequirement };
}

export interface APITag {
  name: string;
  description: string;
  externalDocs?: {
    description: string;
    url: string;
  };
}

export interface APITestResult {
  id: string;
  endpointId: string;
  method: string;
  path: string;
  parameters: any;
  requestBody?: any;
  response: {
    status: number;
    headers: { [key: string]: string };
    body: any;
    time: number;
  };
  success: boolean;
  error?: string;
  timestamp: Date;
  userId: string;
}

export interface SDKConfig {
  language: 'typescript' | 'javascript' | 'python' | 'java' | 'csharp' | 'php' | 'go' | 'ruby';
  packageName: string;
  version: string;
  author: string;
  description: string;
  repository?: string;
  license: string;
  includeExamples: boolean;
  includeTests: boolean;
  outputFormat: 'npm' | 'pip' | 'maven' | 'nuget' | 'composer' | 'go-mod' | 'gem';
}

class APIDocumentationService {
  // API Documentation Management
  async createEndpoint(endpointData: Omit<APIEndpoint, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'api_endpoints'), {
        ...endpointData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating API endpoint:', error);
      throw error;
    }
  }

  async getEndpoints(tag?: string, version?: string): Promise<APIEndpoint[]> {
    try {
      let q = query(
        collection(db, 'api_endpoints'),
        orderBy('path', 'asc')
      );

      if (tag) {
        q = query(
          collection(db, 'api_endpoints'),
          where('tags', 'array-contains', tag),
          orderBy('path', 'asc')
        );
      }

      if (version) {
        q = query(
          collection(db, 'api_endpoints'),
          where('version', '==', version),
          orderBy('path', 'asc')
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      } as APIEndpoint));
    } catch (error) {
      console.error('Error fetching API endpoints:', error);
      throw error;
    }
  }

  async updateEndpoint(endpointId: string, updates: Partial<APIEndpoint>): Promise<void> {
    try {
      await updateDoc(doc(db, 'api_endpoints', endpointId), {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating API endpoint:', error);
      throw error;
    }
  }

  // OpenAPI Specification Generation
  async generateOpenAPISpec(version: string = '1.0.0'): Promise<APIDocumentation> {
    try {
      const endpoints = await this.getEndpoints(undefined, version);
      
      const paths: { [path: string]: { [method: string]: any } } = {};
      const tags: Set<string> = new Set();

      endpoints.forEach(endpoint => {
        if (!paths[endpoint.path]) {
          paths[endpoint.path] = {};
        }
        
        paths[endpoint.path][endpoint.method.toLowerCase()] = {
          summary: endpoint.summary,
          description: endpoint.description,
          tags: endpoint.tags,
          parameters: endpoint.parameters,
          requestBody: endpoint.requestBody,
          responses: endpoint.responses,
          security: endpoint.security,
          deprecated: endpoint.deprecated,
          'x-rate-limit': endpoint.rateLimit
        };

        endpoint.tags.forEach(tag => tags.add(tag));
      });

      const apiDoc: APIDocumentation = {
        openapi: '3.0.3',
        info: {
          title: 'GoCars API',
          description: 'Comprehensive API for the GoCars taxi booking platform',
          version: version,
          contact: {
            name: 'GoCars API Support',
            email: 'api-support@gocars.com'
          },
          license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT'
          }
        },
        servers: [
          {
            url: 'https://api.gocars.com/v1',
            description: 'Production server'
          },
          {
            url: 'https://staging-api.gocars.com/v1',
            description: 'Staging server'
          },
          {
            url: 'http://localhost:3000/api/v1',
            description: 'Development server'
          }
        ],
        paths,
        components: this.generateComponents(),
        security: [
          { bearerAuth: [] },
          { apiKey: [] }
        ],
        tags: Array.from(tags).map(tag => ({
          name: tag,
          description: `${tag} related endpoints`
        }))
      };

      return apiDoc;
    } catch (error) {
      console.error('Error generating OpenAPI spec:', error);
      throw error;
    }
  }

  private generateComponents(): APIComponents {
    return {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'user_123' },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            name: { type: 'string', example: 'John Doe' },
            role: { type: 'string', enum: ['passenger', 'driver', 'operator', 'admin'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          },
          required: ['id', 'email', 'name', 'role']
        },
        Ride: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'ride_123' },
            passengerId: { type: 'string', example: 'user_123' },
            driverId: { type: 'string', example: 'driver_456' },
            status: { 
              type: 'string', 
              enum: ['requested', 'accepted', 'in_progress', 'completed', 'cancelled'] 
            },
            pickup: {
              type: 'object',
              properties: {
                latitude: { type: 'number', example: 40.7128 },
                longitude: { type: 'number', example: -74.0060 },
                address: { type: 'string', example: '123 Main St, New York, NY' }
              }
            },
            destination: {
              type: 'object',
              properties: {
                latitude: { type: 'number', example: 40.7589 },
                longitude: { type: 'number', example: -73.9851 },
                address: { type: 'string', example: '456 Broadway, New York, NY' }
              }
            },
            fare: { type: 'number', example: 25.50 },
            distance: { type: 'number', example: 5.2 },
            duration: { type: 'number', example: 15 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          },
          required: ['id', 'passengerId', 'status', 'pickup', 'destination']
        },
        Driver: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'driver_123' },
            userId: { type: 'string', example: 'user_456' },
            licenseNumber: { type: 'string', example: 'DL123456789' },
            vehicleId: { type: 'string', example: 'vehicle_789' },
            status: { 
              type: 'string', 
              enum: ['available', 'busy', 'offline', 'break'] 
            },
            rating: { type: 'number', minimum: 0, maximum: 5, example: 4.8 },
            totalRides: { type: 'integer', example: 1250 },
            earnings: { type: 'number', example: 15750.25 },
            location: {
              type: 'object',
              properties: {
                latitude: { type: 'number', example: 40.7128 },
                longitude: { type: 'number', example: -74.0060 }
              }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          },
          required: ['id', 'userId', 'licenseNumber', 'status']
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'Invalid request parameters' },
                details: { type: 'array', items: { type: 'string' } },
                timestamp: { type: 'string', format: 'date-time' }
              },
              required: ['code', 'message', 'timestamp']
            }
          }
        }
      },
      responses: {
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        Unauthorized: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        RateLimitExceeded: {
          description: 'Rate limit exceeded',
          headers: {
            'X-RateLimit-Limit': {
              description: 'Request limit per time window',
              schema: { type: 'integer' }
            },
            'X-RateLimit-Remaining': {
              description: 'Remaining requests in current window',
              schema: { type: 'integer' }
            },
            'X-RateLimit-Reset': {
              description: 'Time when rate limit resets',
              schema: { type: 'integer' }
            }
          },
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      },
      parameters: {
        PageParam: {
          name: 'page',
          in: 'query',
          description: 'Page number for pagination',
          required: false,
          schema: { type: 'integer', minimum: 1, default: 1 }
        },
        LimitParam: {
          name: 'limit',
          in: 'query',
          description: 'Number of items per page',
          required: false,
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
        },
        SortParam: {
          name: 'sort',
          in: 'query',
          description: 'Sort field and direction (e.g., "createdAt:desc")',
          required: false,
          schema: { type: 'string', example: 'createdAt:desc' }
        }
      },
      examples: {
        UserExample: {
          summary: 'Example user',
          value: {
            id: 'user_123',
            email: 'john.doe@example.com',
            name: 'John Doe',
            role: 'passenger',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z'
          }
        },
        RideExample: {
          summary: 'Example ride',
          value: {
            id: 'ride_123',
            passengerId: 'user_123',
            driverId: 'driver_456',
            status: 'completed',
            pickup: {
              latitude: 40.7128,
              longitude: -74.0060,
              address: '123 Main St, New York, NY'
            },
            destination: {
              latitude: 40.7589,
              longitude: -73.9851,
              address: '456 Broadway, New York, NY'
            },
            fare: 25.50,
            distance: 5.2,
            duration: 15,
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z'
          }
        }
      },
      requestBodies: {
        CreateRideRequest: {
          description: 'Create a new ride request',
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  pickup: {
                    type: 'object',
                    properties: {
                      latitude: { type: 'number' },
                      longitude: { type: 'number' },
                      address: { type: 'string' }
                    },
                    required: ['latitude', 'longitude']
                  },
                  destination: {
                    type: 'object',
                    properties: {
                      latitude: { type: 'number' },
                      longitude: { type: 'number' },
                      address: { type: 'string' }
                    },
                    required: ['latitude', 'longitude']
                  },
                  vehicleType: { type: 'string', enum: ['standard', 'premium', 'luxury'] },
                  scheduledTime: { type: 'string', format: 'date-time' },
                  notes: { type: 'string' }
                },
                required: ['pickup', 'destination']
              }
            }
          }
        }
      },
      headers: {
        'X-Request-ID': {
          description: 'Unique request identifier',
          schema: { type: 'string' },
          required: true
        },
        'X-API-Version': {
          description: 'API version',
          schema: { type: 'string' },
          required: false
        }
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        },
        oauth2: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://auth.gocars.com/oauth/authorize',
              tokenUrl: 'https://auth.gocars.com/oauth/token',
              scopes: {
                'read:rides': 'Read ride information',
                'write:rides': 'Create and modify rides',
                'read:users': 'Read user information',
                'write:users': 'Create and modify users',
                'admin': 'Administrative access'
              }
            }
          }
        }
      }
    };
  }

  // API Testing
  async testEndpoint(
    endpointId: string, 
    parameters: any = {}, 
    requestBody?: any,
    userId: string = 'test-user'
  ): Promise<APITestResult> {
    try {
      const endpoints = await this.getEndpoints();
      const endpoint = endpoints.find(e => e.id === endpointId);
      
      if (!endpoint) {
        throw new Error('Endpoint not found');
      }

      const startTime = Date.now();
      
      // Simulate API call (in real implementation, make actual HTTP request)
      const mockResponse = this.generateMockResponse(endpoint, parameters, requestBody);
      const endTime = Date.now();

      const testResult: APITestResult = {
        id: `test_${Date.now()}`,
        endpointId,
        method: endpoint.method,
        path: endpoint.path,
        parameters,
        requestBody,
        response: {
          ...mockResponse,
          time: endTime - startTime
        },
        success: mockResponse.status < 400,
        timestamp: new Date(),
        userId
      };

      // Store test result
      await addDoc(collection(db, 'api_test_results'), {
        ...testResult,
        timestamp: Timestamp.now()
      });

      return testResult;
    } catch (error) {
      console.error('Error testing API endpoint:', error);
      throw error;
    }
  }

  private generateMockResponse(endpoint: APIEndpoint, parameters: any, requestBody?: any) {
    // Generate mock response based on endpoint definition
    const successResponse = endpoint.responses.find(r => r.statusCode.startsWith('2'));
    
    if (!successResponse) {
      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: { error: 'No success response defined' }
      };
    }

    const contentType = Object.keys(successResponse.content || {})[0] || 'application/json';
    const schema = successResponse.content?.[contentType]?.schema;
    
    return {
      status: parseInt(successResponse.statusCode),
      headers: { 'Content-Type': contentType },
      body: this.generateMockData(schema)
    };
  }

  private generateMockData(schema?: APISchema): any {
    if (!schema) return {};

    switch (schema.type) {
      case 'string':
        return schema.example || 'mock-string';
      case 'number':
        return schema.example || 42;
      case 'integer':
        return schema.example || 42;
      case 'boolean':
        return schema.example !== undefined ? schema.example : true;
      case 'array':
        return schema.items ? [this.generateMockData(schema.items)] : [];
      case 'object':
        const obj: any = {};
        if (schema.properties) {
          Object.keys(schema.properties).forEach(key => {
            obj[key] = this.generateMockData(schema.properties![key]);
          });
        }
        return obj;
      default:
        return schema.example || null;
    }
  }

  // SDK Generation
  async generateSDK(config: SDKConfig): Promise<string> {
    try {
      const openApiSpec = await this.generateOpenAPISpec();
      
      // In a real implementation, this would use tools like OpenAPI Generator
      // For now, we'll return a mock SDK structure
      
      const sdkContent = this.generateSDKContent(openApiSpec, config);
      
      return sdkContent;
    } catch (error) {
      console.error('Error generating SDK:', error);
      throw error;
    }
  }

  private generateSDKContent(spec: APIDocumentation, config: SDKConfig): string {
    switch (config.language) {
      case 'typescript':
        return this.generateTypeScriptSDK(spec, config);
      case 'python':
        return this.generatePythonSDK(spec, config);
      case 'java':
        return this.generateJavaSDK(spec, config);
      default:
        return `// ${config.language} SDK generation not implemented yet`;
    }
  }

  private generateTypeScriptSDK(spec: APIDocumentation, config: SDKConfig): string {
    return `
// ${config.packageName} - TypeScript SDK
// Generated from OpenAPI specification
// Version: ${config.version}

export interface GoCarsClientConfig {
  baseUrl: string;
  apiKey?: string;
  bearerToken?: string;
  timeout?: number;
}

export class GoCarsClient {
  private config: GoCarsClientConfig;
  
  constructor(config: GoCarsClientConfig) {
    this.config = {
      timeout: 30000,
      ...config
    };
  }
  
  // Users API
  async getUsers(params?: { page?: number; limit?: number }): Promise<User[]> {
    return this.request('GET', '/users', { params });
  }
  
  async getUser(id: string): Promise<User> {
    return this.request('GET', \`/users/\${id}\`);
  }
  
  async createUser(userData: CreateUserRequest): Promise<User> {
    return this.request('POST', '/users', { body: userData });
  }
  
  // Rides API
  async getRides(params?: { page?: number; limit?: number }): Promise<Ride[]> {
    return this.request('GET', '/rides', { params });
  }
  
  async createRide(rideData: CreateRideRequest): Promise<Ride> {
    return this.request('POST', '/rides', { body: rideData });
  }
  
  async getRide(id: string): Promise<Ride> {
    return this.request('GET', \`/rides/\${id}\`);
  }
  
  async updateRide(id: string, updates: UpdateRideRequest): Promise<Ride> {
    return this.request('PUT', \`/rides/\${id}\`, { body: updates });
  }
  
  // Drivers API
  async getDrivers(params?: { page?: number; limit?: number }): Promise<Driver[]> {
    return this.request('GET', '/drivers', { params });
  }
  
  async getDriver(id: string): Promise<Driver> {
    return this.request('GET', \`/drivers/\${id}\`);
  }
  
  private async request(method: string, path: string, options?: any): Promise<any> {
    const url = new URL(path, this.config.baseUrl);
    
    if (options?.params) {
      Object.keys(options.params).forEach(key => {
        if (options.params[key] !== undefined) {
          url.searchParams.append(key, options.params[key]);
        }
      });
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.config.apiKey) {
      headers['X-API-Key'] = this.config.apiKey;
    }
    
    if (this.config.bearerToken) {
      headers['Authorization'] = \`Bearer \${this.config.bearerToken}\`;
    }
    
    const response = await fetch(url.toString(), {
      method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(this.config.timeout!)
    });
    
    if (!response.ok) {
      throw new Error(\`API request failed: \${response.status} \${response.statusText}\`);
    }
    
    return response.json();
  }
}

// Type definitions
${this.generateTypeScriptTypes(spec)}

export default GoCarsClient;
`;
  }

  private generateTypeScriptTypes(spec: APIDocumentation): string {
    let types = '';
    
    Object.keys(spec.components.schemas).forEach(schemaName => {
      const schema = spec.components.schemas[schemaName];
      types += this.generateTypeScriptInterface(schemaName, schema);
    });
    
    return types;
  }

  private generateTypeScriptInterface(name: string, schema: APISchema): string {
    if (schema.type !== 'object' || !schema.properties) {
      return `export type ${name} = any;\n\n`;
    }
    
    let interfaceStr = `export interface ${name} {\n`;
    
    Object.keys(schema.properties).forEach(propName => {
      const prop = schema.properties![propName];
      const optional = !schema.required?.includes(propName) ? '?' : '';
      const type = this.getTypeScriptType(prop);
      interfaceStr += `  ${propName}${optional}: ${type};\n`;
    });
    
    interfaceStr += '}\n\n';
    return interfaceStr;
  }

  private getTypeScriptType(schema: APISchema): string {
    switch (schema.type) {
      case 'string':
        return schema.enum ? schema.enum.map(v => `'${v}'`).join(' | ') : 'string';
      case 'number':
      case 'integer':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'array':
        return schema.items ? `${this.getTypeScriptType(schema.items)}[]` : 'any[]';
      case 'object':
        return 'any'; // Could be more specific with nested interfaces
      default:
        return 'any';
    }
  }

  private generatePythonSDK(spec: APIDocumentation, config: SDKConfig): string {
    return `
# ${config.packageName} - Python SDK
# Generated from OpenAPI specification
# Version: ${config.version}

import requests
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

@dataclass
class GoCarsClientConfig:
    base_url: str
    api_key: Optional[str] = None
    bearer_token: Optional[str] = None
    timeout: int = 30

class GoCarsClient:
    def __init__(self, config: GoCarsClientConfig):
        self.config = config
        self.session = requests.Session()
        
        if config.api_key:
            self.session.headers.update({'X-API-Key': config.api_key})
        
        if config.bearer_token:
            self.session.headers.update({'Authorization': f'Bearer {config.bearer_token}'})
    
    def get_users(self, page: int = 1, limit: int = 20) -> List[Dict[str, Any]]:
        """Get list of users"""
        params = {'page': page, 'limit': limit}
        return self._request('GET', '/users', params=params)
    
    def get_user(self, user_id: str) -> Dict[str, Any]:
        """Get user by ID"""
        return self._request('GET', f'/users/{user_id}')
    
    def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new user"""
        return self._request('POST', '/users', json=user_data)
    
    def get_rides(self, page: int = 1, limit: int = 20) -> List[Dict[str, Any]]:
        """Get list of rides"""
        params = {'page': page, 'limit': limit}
        return self._request('GET', '/rides', params=params)
    
    def create_ride(self, ride_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new ride"""
        return self._request('POST', '/rides', json=ride_data)
    
    def get_ride(self, ride_id: str) -> Dict[str, Any]:
        """Get ride by ID"""
        return self._request('GET', f'/rides/{ride_id}')
    
    def _request(self, method: str, path: str, **kwargs) -> Any:
        """Make HTTP request to API"""
        url = f"{self.config.base_url.rstrip('/')}{path}"
        
        response = self.session.request(
            method=method,
            url=url,
            timeout=self.config.timeout,
            **kwargs
        )
        
        response.raise_for_status()
        return response.json()
`;
  }

  private generateJavaSDK(spec: APIDocumentation, config: SDKConfig): string {
    return `
// ${config.packageName} - Java SDK
// Generated from OpenAPI specification
// Version: ${config.version}

package com.gocars.sdk;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;

public class GoCarsClient {
    private final String baseUrl;
    private final String apiKey;
    private final String bearerToken;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    
    public GoCarsClient(String baseUrl, String apiKey, String bearerToken) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.bearerToken = bearerToken;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();
        this.objectMapper = new ObjectMapper();
    }
    
    public List<User> getUsers(int page, int limit) throws Exception {
        String url = baseUrl + "/users?page=" + page + "&limit=" + limit;
        HttpRequest request = buildRequest("GET", url, null);
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        
        if (response.statusCode() >= 400) {
            throw new RuntimeException("API request failed: " + response.statusCode());
        }
        
        return objectMapper.readValue(response.body(), 
            objectMapper.getTypeFactory().constructCollectionType(List.class, User.class));
    }
    
    public User getUser(String userId) throws Exception {
        String url = baseUrl + "/users/" + userId;
        HttpRequest request = buildRequest("GET", url, null);
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        
        if (response.statusCode() >= 400) {
            throw new RuntimeException("API request failed: " + response.statusCode());
        }
        
        return objectMapper.readValue(response.body(), User.class);
    }
    
    private HttpRequest buildRequest(String method, String url, Object body) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .header("Content-Type", "application/json");
        
        if (apiKey != null) {
            builder.header("X-API-Key", apiKey);
        }
        
        if (bearerToken != null) {
            builder.header("Authorization", "Bearer " + bearerToken);
        }
        
        switch (method.toUpperCase()) {
            case "GET":
                builder.GET();
                break;
            case "POST":
                builder.POST(HttpRequest.BodyPublishers.ofString(
                    body != null ? objectMapper.writeValueAsString(body) : ""));
                break;
            case "PUT":
                builder.PUT(HttpRequest.BodyPublishers.ofString(
                    body != null ? objectMapper.writeValueAsString(body) : ""));
                break;
            case "DELETE":
                builder.DELETE();
                break;
        }
        
        return builder.build();
    }
}
`;
  }

  // Get predefined API endpoints
  async getDefaultEndpoints(): Promise<Partial<APIEndpoint>[]> {
    return [
      {
        path: '/users',
        method: 'GET',
        summary: 'Get users',
        description: 'Retrieve a list of users with pagination',
        tags: ['Users'],
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number',
            required: false,
            schema: { type: 'integer', minimum: 1, example: 1 }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Items per page',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 100, example: 20 }
          }
        ],
        responses: [
          {
            statusCode: '200',
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/User' }
                }
              }
            }
          }
        ],
        security: [{ bearerAuth: [] }],
        deprecated: false,
        version: '1.0.0',
        examples: [],
        rateLimit: { requests: 100, window: '1h' }
      },
      {
        path: '/rides',
        method: 'POST',
        summary: 'Create ride',
        description: 'Create a new ride request',
        tags: ['Rides'],
        parameters: [],
        requestBody: {
          description: 'Ride creation data',
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/requestBodies/CreateRideRequest' }
            }
          }
        },
        responses: [
          {
            statusCode: '201',
            description: 'Ride created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Ride' }
              }
            }
          }
        ],
        security: [{ bearerAuth: [] }],
        deprecated: false,
        version: '1.0.0',
        examples: [],
        rateLimit: { requests: 50, window: '1h' }
      }
    ];
  }
}

export const apiDocumentationService = new APIDocumentationService();