import { TestSuiteConfig } from '../configuration/TestConfigurationManager';
import { ExecutionPhase, ResourceRequirements } from './TestExecutionOrchestrator';

export interface DependencyNode {
  id: string;
  name: string;
  dependencies: string[];
  dependents: string[];
  level: number;
  estimatedDuration: number;
  resourceRequirements: ResourceRequirements;
}

export interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  levels: Map<number, string[]>;
  maxLevel: number;
}

export class DependencyResolver {
  
  public buildDependencyGraph(testSuites: TestSuiteConfig[]): DependencyGraph {
    const nodes = new Map<string, DependencyNode>();
    
    // Create nodes
    for (const suite of testSuites) {
      nodes.set(suite.id, {
        id: suite.id,
        name: suite.name,
        dependencies: [...suite.dependencies],
        dependents: [],
        level: 0,
        estimatedDuration: this.estimateSuiteDuration(suite),
        resourceRequirements: this.estimateResourceRequirements(suite)
      });
    }
    
    // Build dependency relationships
    for (const node of nodes.values()) {
      for (const depId of node.dependencies) {
        const depNode = nodes.get(depId);
        if (depNode) {
          depNode.dependents.push(node.id);
        }
      }
    }
    
    // Validate dependencies
    this.validateDependencies(nodes);
    
    // Calculate levels (topological sort)
    const levels = this.calculateLevels(nodes);
    
    return {
      nodes,
      levels,
      maxLevel: Math.max(...levels.keys())
    };
  }
  
  public createExecutionPhases(graph: DependencyGraph, maxConcurrency: number): ExecutionPhase[] {
    const phases: ExecutionPhase[] = [];
    
    for (let level = 0; level <= graph.maxLevel; level++) {
      const suiteIds = graph.levels.get(level) || [];
      if (suiteIds.length === 0) continue;
      
      // Group suites by resource requirements and dependencies
      const phaseGroups = this.groupSuitesForPhase(suiteIds, graph.nodes, maxConcurrency);
      
      for (let groupIndex = 0; groupIndex < phaseGroups.length; groupIndex++) {
        const group = phaseGroups[groupIndex];
        const phaseId = `phase-${level}-${groupIndex}`;
        
        phases.push({
          id: phaseId,
          name: `Phase ${level}.${groupIndex}`,
          suites: group.suites,
          dependencies: this.getPhaseDependencies(group.suites, graph.nodes),
          estimatedDuration: Math.max(...group.suites.map(id => graph.nodes.get(id)!.estimatedDuration)),
          maxConcurrency: Math.min(maxConcurrency, group.suites.length),
          resourceRequirements: this.aggregateResourceRequirements(
            group.suites.map(id => graph.nodes.get(id)!.resourceRequirements)
          )
        });
      }
    }
    
    return phases;
  }
  
  public validateExecutionOrder(phases: ExecutionPhase[], graph: DependencyGraph): boolean {
    const executedSuites = new Set<string>();
    
    for (const phase of phases) {
      for (const suiteId of phase.suites) {
        const node = graph.nodes.get(suiteId);
        if (!node) continue;
        
        // Check if all dependencies have been executed
        for (const depId of node.dependencies) {
          if (!executedSuites.has(depId)) {
            return false;
          }
        }
        
        executedSuites.add(suiteId);
      }
    }
    
    return true;
  }
  
  public optimizeExecutionOrder(phases: ExecutionPhase[], graph: DependencyGraph): ExecutionPhase[] {
    // Sort phases by priority (critical path, resource efficiency, etc.)
    const optimizedPhases = [...phases];
    
    // Sort suites within each phase by priority
    for (const phase of optimizedPhases) {
      phase.suites.sort((a, b) => {
        const nodeA = graph.nodes.get(a)!;
        const nodeB = graph.nodes.get(b)!;
        
        // Prioritize by:
        // 1. Number of dependents (critical path)
        // 2. Estimated duration (longer first for better parallelization)
        // 3. Resource requirements (balance load)
        
        const dependentsA = nodeA.dependents.length;
        const dependentsB = nodeB.dependents.length;
        
        if (dependentsA !== dependentsB) {
          return dependentsB - dependentsA; // More dependents first
        }
        
        const durationA = nodeA.estimatedDuration;
        const durationB = nodeB.estimatedDuration;
        
        if (Math.abs(durationA - durationB) > 1000) { // 1 second threshold
          return durationB - durationA; // Longer duration first
        }
        
        // Balance resource requirements
        const resourceScoreA = this.calculateResourceScore(nodeA.resourceRequirements);
        const resourceScoreB = this.calculateResourceScore(nodeB.resourceRequirements);
        
        return resourceScoreA - resourceScoreB; // Lower resource score first
      });
    }
    
    return optimizedPhases;
  }
  
  public detectCircularDependencies(testSuites: TestSuiteConfig[]): string[] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const suiteMap = new Map(testSuites.map(suite => [suite.id, suite]));
    
    const hasCycle = (suiteId: string, path: string[]): string[] | null => {
      if (recursionStack.has(suiteId)) {
        // Found a cycle, return the path
        const cycleStart = path.indexOf(suiteId);
        return path.slice(cycleStart).concat(suiteId);
      }
      
      if (visited.has(suiteId)) {
        return null;
      }
      
      visited.add(suiteId);
      recursionStack.add(suiteId);
      
      const suite = suiteMap.get(suiteId);
      if (suite) {
        for (const depId of suite.dependencies) {
          const cycle = hasCycle(depId, [...path, suiteId]);
          if (cycle) {
            return cycle;
          }
        }
      }
      
      recursionStack.delete(suiteId);
      return null;
    };
    
    for (const suite of testSuites) {
      if (!visited.has(suite.id)) {
        const cycle = hasCycle(suite.id, []);
        if (cycle) {
          return cycle;
        }
      }
    }
    
    return [];
  }
  
  public getCriticalPath(graph: DependencyGraph): string[] {
    const criticalPath: string[] = [];
    let maxDuration = 0;
    let currentPath: string[] = [];
    
    // Find the longest path through the dependency graph
    const findLongestPath = (nodeId: string, currentDuration: number, path: string[]): void => {
      const node = graph.nodes.get(nodeId);
      if (!node) return;
      
      const newDuration = currentDuration + node.estimatedDuration;
      const newPath = [...path, nodeId];
      
      if (node.dependents.length === 0) {
        // Leaf node - check if this is the longest path
        if (newDuration > maxDuration) {
          maxDuration = newDuration;
          criticalPath.length = 0;
          criticalPath.push(...newPath);
        }
      } else {
        // Continue with dependents
        for (const dependentId of node.dependents) {
          findLongestPath(dependentId, newDuration, newPath);
        }
      }
    };
    
    // Start from root nodes (nodes with no dependencies)
    for (const node of graph.nodes.values()) {
      if (node.dependencies.length === 0) {
        findLongestPath(node.id, 0, []);
      }
    }
    
    return criticalPath;
  }
  
  private validateDependencies(nodes: Map<string, DependencyNode>): void {
    for (const node of nodes.values()) {
      for (const depId of node.dependencies) {
        if (!nodes.has(depId)) {
          throw new Error(`Dependency '${depId}' not found for suite '${node.id}'`);
        }
      }
    }
  }
  
  private calculateLevels(nodes: Map<string, DependencyNode>): Map<number, string[]> {
    const levels = new Map<number, string[]>();
    const visited = new Set<string>();
    
    const calculateLevel = (nodeId: string): number => {
      if (visited.has(nodeId)) {
        const node = nodes.get(nodeId)!;
        return node.level;
      }
      
      visited.add(nodeId);
      const node = nodes.get(nodeId)!;
      
      if (node.dependencies.length === 0) {
        node.level = 0;
      } else {
        node.level = Math.max(...node.dependencies.map(depId => calculateLevel(depId))) + 1;
      }
      
      // Add to level map
      if (!levels.has(node.level)) {
        levels.set(node.level, []);
      }
      levels.get(node.level)!.push(nodeId);
      
      return node.level;
    };
    
    // Calculate levels for all nodes
    for (const nodeId of nodes.keys()) {
      calculateLevel(nodeId);
    }
    
    return levels;
  }
  
  private groupSuitesForPhase(
    suiteIds: string[], 
    nodes: Map<string, DependencyNode>, 
    maxConcurrency: number
  ): Array<{ suites: string[]; totalResources: ResourceRequirements }> {
    const groups: Array<{ suites: string[]; totalResources: ResourceRequirements }> = [];
    const remainingSuites = [...suiteIds];
    
    while (remainingSuites.length > 0) {
      const group: string[] = [];
      let totalResources: ResourceRequirements = {
        memory: 0,
        cpu: 0,
        network: 0,
        storage: 0,
        concurrentUsers: 0
      };
      
      // Greedy algorithm to group suites that can run together
      for (let i = remainingSuites.length - 1; i >= 0; i--) {
        const suiteId = remainingSuites[i];
        const node = nodes.get(suiteId)!;
        const suiteResources = node.resourceRequirements;
        
        // Check if adding this suite would exceed limits
        const newResources = {
          memory: totalResources.memory + suiteResources.memory,
          cpu: totalResources.cpu + suiteResources.cpu,
          network: totalResources.network + suiteResources.network,
          storage: totalResources.storage + suiteResources.storage,
          concurrentUsers: totalResources.concurrentUsers + suiteResources.concurrentUsers
        };
        
        if (group.length < maxConcurrency && this.isResourceLimitAcceptable(newResources)) {
          group.push(suiteId);
          totalResources = newResources;
          remainingSuites.splice(i, 1);
        }
      }
      
      if (group.length === 0) {
        // If we can't fit any suite, take the first one anyway
        group.push(remainingSuites.shift()!);
        const node = nodes.get(group[0])!;
        totalResources = { ...node.resourceRequirements };
      }
      
      groups.push({ suites: group, totalResources });
    }
    
    return groups;
  }
  
  private getPhaseDependencies(suiteIds: string[], nodes: Map<string, DependencyNode>): string[] {
    const dependencies = new Set<string>();
    
    for (const suiteId of suiteIds) {
      const node = nodes.get(suiteId);
      if (node) {
        for (const depId of node.dependencies) {
          if (!suiteIds.includes(depId)) {
            dependencies.add(depId);
          }
        }
      }
    }
    
    return Array.from(dependencies);
  }
  
  private aggregateResourceRequirements(requirements: ResourceRequirements[]): ResourceRequirements {
    return requirements.reduce((total, req) => ({
      memory: total.memory + req.memory,
      cpu: total.cpu + req.cpu,
      network: Math.max(total.network, req.network), // Network is shared
      storage: total.storage + req.storage,
      concurrentUsers: total.concurrentUsers + req.concurrentUsers
    }), { memory: 0, cpu: 0, network: 0, storage: 0, concurrentUsers: 0 });
  }
  
  private estimateSuiteDuration(suite: TestSuiteConfig): number {
    // Base duration estimation based on suite type and parameters
    let baseDuration = 60000; // 1 minute default
    
    // Adjust based on suite name/type
    if (suite.name.toLowerCase().includes('firebase')) {
      baseDuration = 45000; // Firebase tests are typically faster
    } else if (suite.name.toLowerCase().includes('ui')) {
      baseDuration = 120000; // UI tests take longer
    } else if (suite.name.toLowerCase().includes('integration')) {
      baseDuration = 180000; // Integration tests are slowest
    } else if (suite.name.toLowerCase().includes('websocket')) {
      baseDuration = 90000; // WebSocket tests are moderate
    }
    
    // Adjust based on parameters
    if (suite.parameters.quickMode) {
      baseDuration *= 0.5;
    }
    if (suite.parameters.skipVisualTests) {
      baseDuration *= 0.7;
    }
    if (suite.parameters.maxUsers && suite.parameters.maxUsers > 100) {
      baseDuration *= 1.5;
    }
    
    // Add some randomness for realistic estimation
    const variance = baseDuration * 0.2; // ±20% variance
    return baseDuration + (Math.random() - 0.5) * variance;
  }
  
  private estimateResourceRequirements(suite: TestSuiteConfig): ResourceRequirements {
    let baseMemory = 100; // 100MB base
    let baseCpu = 10; // 10% CPU base
    let baseNetwork = 10; // 10 Mbps base
    let baseStorage = 50; // 50MB base
    let baseConcurrentUsers = 5; // 5 concurrent users base
    
    // Adjust based on suite type
    if (suite.name.toLowerCase().includes('ui')) {
      baseMemory *= 2; // UI tests need more memory for browser instances
      baseCpu *= 1.5;
    } else if (suite.name.toLowerCase().includes('integration')) {
      baseMemory *= 1.5;
      baseCpu *= 2;
      baseNetwork *= 3;
    } else if (suite.name.toLowerCase().includes('websocket')) {
      baseNetwork *= 2;
      baseConcurrentUsers *= 2;
    }
    
    // Adjust based on parameters
    if (suite.parameters.maxUsers) {
      const userMultiplier = suite.parameters.maxUsers / 10;
      baseMemory *= userMultiplier;
      baseCpu *= userMultiplier;
      baseConcurrentUsers = suite.parameters.maxUsers;
    }
    
    if (suite.parameters.browsers && Array.isArray(suite.parameters.browsers)) {
      const browserMultiplier = suite.parameters.browsers.length;
      baseMemory *= browserMultiplier;
      baseCpu *= browserMultiplier;
    }
    
    return {
      memory: Math.round(baseMemory),
      cpu: Math.round(baseCpu),
      network: Math.round(baseNetwork),
      storage: Math.round(baseStorage),
      concurrentUsers: Math.round(baseConcurrentUsers)
    };
  }
  
  private isResourceLimitAcceptable(resources: ResourceRequirements): boolean {
    // Define reasonable limits for a single phase
    const limits = {
      memory: 2000, // 2GB
      cpu: 80, // 80%
      network: 100, // 100 Mbps
      storage: 1000, // 1GB
      concurrentUsers: 100 // 100 users
    };
    
    return resources.memory <= limits.memory &&
           resources.cpu <= limits.cpu &&
           resources.network <= limits.network &&
           resources.storage <= limits.storage &&
           resources.concurrentUsers <= limits.concurrentUsers;
  }
  
  private calculateResourceScore(requirements: ResourceRequirements): number {
    // Calculate a weighted score for resource requirements
    return (requirements.memory * 0.3) +
           (requirements.cpu * 0.3) +
           (requirements.network * 0.2) +
           (requirements.storage * 0.1) +
           (requirements.concurrentUsers * 0.1);
  }
}