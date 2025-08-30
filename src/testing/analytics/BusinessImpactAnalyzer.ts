/**
 * Business Impact Analyzer
 * Analyzes the business impact of test results and system metrics
 */

import { QualityMetrics, BusinessImpactMetrics } from './MetricsCollector'
import { TrendInsight } from './TrendAnalyzer'

export interface BusinessImpactAssessment {
  id: string
  timestamp: number
  overallScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  categories: {
    userExperience: BusinessCategoryImpact
    operational: BusinessCategoryImpact
    financial: BusinessCategoryImpact
    reputation: BusinessCategoryImpact
  }
  recommendations: BusinessRecommendation[]
  projectedImpact: {
    shortTerm: ProjectedImpact
    mediumTerm: ProjectedImpact
    longTerm: ProjectedImpact
  }
}

export interface BusinessCategoryImpact {
  score: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  keyMetrics: Array<{
    name: string
    value: number
    impact: number
    trend: 'improving' | 'declining' | 'stable'
  }>
  issues: Array<{
    description: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    estimatedImpact: string
  }>
}

export interface BusinessRecommendation {
  id: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: 'userExperience' | 'operational' | 'financial' | 'reputation'
  title: string
  description: string
  expectedBenefit: string
  estimatedEffort: 'low' | 'medium' | 'high'
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term'
  roi: number
}

export interface ProjectedImpact {
  timeframe: 'short_term' | 'medium_term' | 'long_term'
  userImpact: {
    affectedUsers: number
    satisfactionChange: number
    churnRisk: number
  }
  financialImpact: {
    revenueAtRisk: number
    costIncrease: number
    potentialSavings: number
  }
  operationalImpact: {
    downtimeRisk: number
    resourceRequirement: number
    efficiencyChange: number
  }
}

export interface CostBenefitAnalysis {
  testingInvestment: {
    tooling: number
    personnel: number
    infrastructure: number
    training: number
    total: number
  }
  benefits: {
    defectPrevention: number
    reducedDowntime: number
    improvedEfficiency: number
    customerRetention: number
    total: number
  }
  roi: number
  paybackPeriod: number
  netPresentValue: number
}

export class BusinessImpactAnalyzer {
  private assessmentHistory: BusinessImpactAssessment[] = []
  private costBenefitHistory: CostBenefitAnalysis[] = []

  // Business impact weights for different metrics
  private readonly impactWeights = {
    userExperience: {
      satisfactionScore: 0.3,
      taskCompletionRate: 0.25,
      errorRecoveryRate: 0.2,
      accessibilityScore: 0.15,
      responseTime: 0.1
    },
    operational: {
      systemUptime: 0.35,
      incidentCount: 0.25,
      resourceUtilization: 0.2,
      maintenanceTime: 0.2
    },
    financial: {
      defectCostAvoidance: 0.3,
      timeToMarket: 0.25,
      testingCostPerFeature: 0.25,
      riskReduction: 0.2
    },
    reputation: {
      userSatisfaction: 0.4,
      systemReliability: 0.3,
      securityIncidents: 0.2,
      complianceViolations: 0.1
    }
  }

  /**
   * Assess business impact based on quality and business metrics
   */
  public assessBusinessImpact(
    qualityMetrics: QualityMetrics,
    businessMetrics: BusinessImpactMetrics,
    insights: TrendInsight[]
  ): BusinessImpactAssessment {
    const timestamp = Date.now()

    // Analyze each category
    const userExperience = this.analyzeUserExperienceImpact(businessMetrics, insights)
    const operational = this.analyzeOperationalImpact(qualityMetrics, businessMetrics, insights)
    const financial = this.analyzeFinancialImpact(businessMetrics, insights)
    const reputation = this.analyzeReputationImpact(qualityMetrics, businessMetrics, insights)

    // Calculate overall score
    const overallScore = this.calculateOverallScore({
      userExperience,
      operational,
      financial,
      reputation
    })

    // Determine risk level
    const riskLevel = this.determineRiskLevel(overallScore)

    // Generate recommendations
    const recommendations = this.generateRecommendations({
      userExperience,
      operational,
      financial,
      reputation
    }, insights)

    // Project future impact
    const projectedImpact = this.projectFutureImpact(
      qualityMetrics,
      businessMetrics,
      insights
    )

    const assessment: BusinessImpactAssessment = {
      id: `assessment_${timestamp}`,
      timestamp,
      overallScore,
      riskLevel,
      categories: {
        userExperience,
        operational,
        financial,
        reputation
      },
      recommendations,
      projectedImpact
    }

    // Store assessment
    this.assessmentHistory.push(assessment)

    // Keep only last 100 assessments
    if (this.assessmentHistory.length > 100) {
      this.assessmentHistory.splice(0, this.assessmentHistory.length - 100)
    }

    return assessment
  }

  /**
   * Perform cost-benefit analysis of testing efforts
   */
  public performCostBenefitAnalysis(
    testingCosts: {
      tooling: number
      personnel: number
      infrastructure: number
      training: number
    },
    qualityMetrics: QualityMetrics,
    businessMetrics: BusinessImpactMetrics
  ): CostBenefitAnalysis {
    const totalInvestment = Object.values(testingCosts).reduce((sum, cost) => sum + cost, 0)

    // Calculate benefits
    const defectPrevention = this.calculateDefectPreventionBenefit(qualityMetrics)
    const reducedDowntime = this.calculateDowntimeReductionBenefit(businessMetrics)
    const improvedEfficiency = this.calculateEfficiencyBenefit(qualityMetrics)
    const customerRetention = this.calculateCustomerRetentionBenefit(businessMetrics)

    const totalBenefits = defectPrevention + reducedDowntime + improvedEfficiency + customerRetention

    const analysis: CostBenefitAnalysis = {
      testingInvestment: {
        ...testingCosts,
        total: totalInvestment
      },
      benefits: {
        defectPrevention,
        reducedDowntime,
        improvedEfficiency,
        customerRetention,
        total: totalBenefits
      },
      roi: totalInvestment > 0 ? ((totalBenefits - totalInvestment) / totalInvestment) * 100 : 0,
      paybackPeriod: totalBenefits > 0 ? totalInvestment / (totalBenefits / 12) : Infinity, // months
      netPresentValue: this.calculateNPV(totalInvestment, totalBenefits, 0.1, 3) // 10% discount rate, 3 years
    }

    this.costBenefitHistory.push(analysis)
    return analysis
  }

  /**
   * Get assessment history
   */
  public getAssessmentHistory(limit: number = 10): BusinessImpactAssessment[] {
    return this.assessmentHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  /**
   * Get cost-benefit analysis history
   */
  public getCostBenefitHistory(limit: number = 10): CostBenefitAnalysis[] {
    return this.costBenefitHistory
      .sort((a, b) => b.testingInvestment.total - a.testingInvestment.total)
      .slice(0, limit)
  }

  /**
   * Generate executive summary
   */
  public generateExecutiveSummary(assessment: BusinessImpactAssessment): {
    summary: string
    keyFindings: string[]
    criticalActions: string[]
    businessValue: string
  } {
    const criticalRecommendations = assessment.recommendations
      .filter(rec => rec.priority === 'critical')
      .slice(0, 3)

    const keyFindings = [
      `Overall business risk level: ${assessment.riskLevel.toUpperCase()}`,
      `User experience score: ${assessment.categories.userExperience.score.toFixed(1)}/100`,
      `Operational efficiency: ${assessment.categories.operational.score.toFixed(1)}/100`,
      `Financial impact score: ${assessment.categories.financial.score.toFixed(1)}/100`
    ]

    const criticalActions = criticalRecommendations.map(rec => rec.title)

    const businessValue = this.calculateBusinessValue(assessment)

    return {
      summary: this.generateSummaryText(assessment),
      keyFindings,
      criticalActions,
      businessValue
    }
  }

  // Private helper methods

  private analyzeUserExperienceImpact(
    businessMetrics: BusinessImpactMetrics,
    insights: TrendInsight[]
  ): BusinessCategoryImpact {
    const ux = businessMetrics.userExperience
    const weights = this.impactWeights.userExperience

    // Calculate weighted score
    const score = (
      ux.satisfactionScore * 20 * weights.satisfactionScore +
      ux.taskCompletionRate * weights.taskCompletionRate +
      ux.errorRecoveryRate * weights.errorRecoveryRate +
      ux.accessibilityScore * weights.accessibilityScore
    )

    const keyMetrics = [
      {
        name: 'User Satisfaction',
        value: ux.satisfactionScore,
        impact: ux.satisfactionScore * weights.satisfactionScore * 20,
        trend: this.getTrendFromInsights('user_satisfaction', insights)
      },
      {
        name: 'Task Completion Rate',
        value: ux.taskCompletionRate,
        impact: ux.taskCompletionRate * weights.taskCompletionRate,
        trend: this.getTrendFromInsights('task_completion_rate', insights)
      }
    ]

    const issues = this.identifyUserExperienceIssues(ux, insights)

    return {
      score,
      riskLevel: this.determineRiskLevel(score),
      keyMetrics,
      issues
    }
  }

  private analyzeOperationalImpact(
    qualityMetrics: QualityMetrics,
    businessMetrics: BusinessImpactMetrics,
    insights: TrendInsight[]
  ): BusinessCategoryImpact {
    const ops = businessMetrics.operational
    const weights = this.impactWeights.operational

    const score = (
      ops.systemUptime * weights.systemUptime +
      (100 - ops.incidentCount) * weights.incidentCount + // Invert incident count
      ops.resourceUtilization * weights.resourceUtilization +
      (100 - ops.maintenanceTime) * weights.maintenanceTime // Invert maintenance time
    )

    const keyMetrics = [
      {
        name: 'System Uptime',
        value: ops.systemUptime,
        impact: ops.systemUptime * weights.systemUptime,
        trend: this.getTrendFromInsights('system_availability', insights)
      },
      {
        name: 'Incident Count',
        value: ops.incidentCount,
        impact: ops.incidentCount * weights.incidentCount,
        trend: this.getTrendFromInsights('incident_count', insights)
      }
    ]

    const issues = this.identifyOperationalIssues(qualityMetrics, ops, insights)

    return {
      score,
      riskLevel: this.determineRiskLevel(score),
      keyMetrics,
      issues
    }
  }

  private analyzeFinancialImpact(
    businessMetrics: BusinessImpactMetrics,
    insights: TrendInsight[]
  ): BusinessCategoryImpact {
    const fin = businessMetrics.financial
    const weights = this.impactWeights.financial

    const score = (
      fin.defectCostAvoidance * weights.defectCostAvoidance +
      (100 - fin.timeToMarket) * weights.timeToMarket + // Invert time to market
      (100 - fin.testingCostPerFeature) * weights.testingCostPerFeature + // Invert cost
      fin.riskReduction * weights.riskReduction
    )

    const keyMetrics = [
      {
        name: 'Defect Cost Avoidance',
        value: fin.defectCostAvoidance,
        impact: fin.defectCostAvoidance * weights.defectCostAvoidance,
        trend: this.getTrendFromInsights('defect_cost_avoidance', insights)
      },
      {
        name: 'Time to Market',
        value: fin.timeToMarket,
        impact: fin.timeToMarket * weights.timeToMarket,
        trend: this.getTrendFromInsights('time_to_market', insights)
      }
    ]

    const issues = this.identifyFinancialIssues(fin, insights)

    return {
      score,
      riskLevel: this.determineRiskLevel(score),
      keyMetrics,
      issues
    }
  }

  private analyzeReputationImpact(
    qualityMetrics: QualityMetrics,
    businessMetrics: BusinessImpactMetrics,
    insights: TrendInsight[]
  ): BusinessCategoryImpact {
    const ux = businessMetrics.userExperience
    const perf = qualityMetrics.performanceMetrics
    const weights = this.impactWeights.reputation

    const score = (
      ux.satisfactionScore * 20 * weights.userSatisfaction +
      perf.availabilityPercentage * weights.systemReliability +
      (100 - perf.errorRate) * weights.securityIncidents + // Invert error rate
      90 * weights.complianceViolations // Assume 90% compliance
    )

    const keyMetrics = [
      {
        name: 'User Satisfaction',
        value: ux.satisfactionScore,
        impact: ux.satisfactionScore * weights.userSatisfaction * 20,
        trend: this.getTrendFromInsights('user_satisfaction', insights)
      },
      {
        name: 'System Reliability',
        value: perf.availabilityPercentage,
        impact: perf.availabilityPercentage * weights.systemReliability,
        trend: this.getTrendFromInsights('system_availability', insights)
      }
    ]

    const issues = this.identifyReputationIssues(qualityMetrics, businessMetrics, insights)

    return {
      score,
      riskLevel: this.determineRiskLevel(score),
      keyMetrics,
      issues
    }
  }

  private calculateOverallScore(categories: {
    userExperience: BusinessCategoryImpact
    operational: BusinessCategoryImpact
    financial: BusinessCategoryImpact
    reputation: BusinessCategoryImpact
  }): number {
    // Weight categories by business importance
    const categoryWeights = {
      userExperience: 0.3,
      operational: 0.25,
      financial: 0.25,
      reputation: 0.2
    }

    return (
      categories.userExperience.score * categoryWeights.userExperience +
      categories.operational.score * categoryWeights.operational +
      categories.financial.score * categoryWeights.financial +
      categories.reputation.score * categoryWeights.reputation
    )
  }

  private determineRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'low'
    if (score >= 60) return 'medium'
    if (score >= 40) return 'high'
    return 'critical'
  }

  private generateRecommendations(
    categories: {
      userExperience: BusinessCategoryImpact
      operational: BusinessCategoryImpact
      financial: BusinessCategoryImpact
      reputation: BusinessCategoryImpact
    },
    insights: TrendInsight[]
  ): BusinessRecommendation[] {
    const recommendations: BusinessRecommendation[] = []

    // Generate recommendations based on category scores and issues
    Object.entries(categories).forEach(([categoryName, category]) => {
      if (category.riskLevel === 'critical' || category.riskLevel === 'high') {
        category.issues.forEach((issue, index) => {
          recommendations.push({
            id: `rec_${categoryName}_${index}_${Date.now()}`,
            priority: issue.severity,
            category: categoryName as any,
            title: `Address ${issue.description}`,
            description: `${issue.description} - ${issue.estimatedImpact}`,
            expectedBenefit: this.calculateExpectedBenefit(issue.severity, categoryName),
            estimatedEffort: this.estimateEffort(issue.severity),
            timeframe: this.determineTimeframe(issue.severity),
            roi: this.calculateROI(issue.severity, categoryName)
          })
        })
      }
    })

    // Add recommendations based on insights
    insights.filter(insight => insight.severity === 'critical' || insight.severity === 'high')
      .forEach(insight => {
        recommendations.push({
          id: `rec_insight_${insight.id}`,
          priority: insight.severity,
          category: this.mapInsightToCategory(insight.metric),
          title: insight.title,
          description: insight.recommendation,
          expectedBenefit: this.calculateInsightBenefit(insight),
          estimatedEffort: 'medium',
          timeframe: 'short_term',
          roi: insight.confidence * 100
        })
      })

    // Sort by priority and ROI
    return recommendations
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority] || b.roi - a.roi
      })
      .slice(0, 10) // Top 10 recommendations
  }

  private projectFutureImpact(
    qualityMetrics: QualityMetrics,
    businessMetrics: BusinessImpactMetrics,
    insights: TrendInsight[]
  ): {
    shortTerm: ProjectedImpact
    mediumTerm: ProjectedImpact
    longTerm: ProjectedImpact
  } {
    const baseUserImpact = businessMetrics.userExperience.satisfactionScore * 1000 // Assume 1000 users per satisfaction point
    const baseRevenue = 100000 // Assume $100k monthly revenue

    return {
      shortTerm: {
        timeframe: 'short_term',
        userImpact: {
          affectedUsers: Math.floor(baseUserImpact * 0.1),
          satisfactionChange: -0.2,
          churnRisk: 0.05
        },
        financialImpact: {
          revenueAtRisk: baseRevenue * 0.05,
          costIncrease: baseRevenue * 0.02,
          potentialSavings: baseRevenue * 0.03
        },
        operationalImpact: {
          downtimeRisk: 0.02,
          resourceRequirement: 1.1,
          efficiencyChange: -0.05
        }
      },
      mediumTerm: {
        timeframe: 'medium_term',
        userImpact: {
          affectedUsers: Math.floor(baseUserImpact * 0.25),
          satisfactionChange: -0.5,
          churnRisk: 0.15
        },
        financialImpact: {
          revenueAtRisk: baseRevenue * 0.15,
          costIncrease: baseRevenue * 0.08,
          potentialSavings: baseRevenue * 0.12
        },
        operationalImpact: {
          downtimeRisk: 0.08,
          resourceRequirement: 1.3,
          efficiencyChange: -0.15
        }
      },
      longTerm: {
        timeframe: 'long_term',
        userImpact: {
          affectedUsers: Math.floor(baseUserImpact * 0.5),
          satisfactionChange: -1.0,
          churnRisk: 0.3
        },
        financialImpact: {
          revenueAtRisk: baseRevenue * 0.3,
          costIncrease: baseRevenue * 0.2,
          potentialSavings: baseRevenue * 0.25
        },
        operationalImpact: {
          downtimeRisk: 0.2,
          resourceRequirement: 1.5,
          efficiencyChange: -0.3
        }
      }
    }
  }

  private calculateDefectPreventionBenefit(qualityMetrics: QualityMetrics): number {
    // Estimate cost savings from preventing defects
    const defectRate = qualityMetrics.defectMetrics.defectDensity
    const avgDefectCost = 5000 // $5k per defect
    const preventedDefects = defectRate * 0.8 // Assume 80% prevention
    return preventedDefects * avgDefectCost
  }

  private calculateDowntimeReductionBenefit(businessMetrics: BusinessImpactMetrics): number {
    // Estimate revenue protection from reduced downtime
    const uptimeImprovement = (businessMetrics.operational.systemUptime - 95) / 100 // Improvement over 95% baseline
    const hourlyRevenue = 1000 // $1k per hour
    const hoursPerMonth = 24 * 30
    return uptimeImprovement * hourlyRevenue * hoursPerMonth
  }

  private calculateEfficiencyBenefit(qualityMetrics: QualityMetrics): number {
    // Estimate savings from improved efficiency
    const efficiencyGain = qualityMetrics.performanceMetrics.throughput / 1000 // Normalize
    const monthlySavings = efficiencyGain * 10000 // $10k per efficiency point
    return monthlySavings * 12 // Annual savings
  }

  private calculateCustomerRetentionBenefit(businessMetrics: BusinessImpactMetrics): number {
    // Estimate revenue from improved customer retention
    const satisfactionImprovement = (businessMetrics.userExperience.satisfactionScore - 3) / 2 // Improvement over 3.0 baseline
    const customerValue = 1000 // $1k per customer annually
    const retainedCustomers = satisfactionImprovement * 100 // 100 customers per satisfaction point
    return retainedCustomers * customerValue
  }

  private calculateNPV(investment: number, annualBenefit: number, discountRate: number, years: number): number {
    let npv = -investment
    for (let year = 1; year <= years; year++) {
      npv += annualBenefit / Math.pow(1 + discountRate, year)
    }
    return npv
  }

  private getTrendFromInsights(metricId: string, insights: TrendInsight[]): 'improving' | 'declining' | 'stable' {
    const relevantInsight = insights.find(insight => insight.metric === metricId)
    if (!relevantInsight) return 'stable'
    
    if (relevantInsight.type === 'improvement') return 'improving'
    if (relevantInsight.type === 'degradation') return 'declining'
    return 'stable'
  }

  private identifyUserExperienceIssues(
    ux: BusinessImpactMetrics['userExperience'],
    insights: TrendInsight[]
  ): Array<{ description: string; severity: 'low' | 'medium' | 'high' | 'critical'; estimatedImpact: string }> {
    const issues = []

    if (ux.satisfactionScore < 3.0) {
      issues.push({
        description: 'Low user satisfaction score',
        severity: 'critical' as const,
        estimatedImpact: 'High risk of customer churn and negative reviews'
      })
    }

    if (ux.taskCompletionRate < 80) {
      issues.push({
        description: 'Low task completion rate',
        severity: 'high' as const,
        estimatedImpact: 'Users struggling to complete key workflows'
      })
    }

    if (ux.accessibilityScore < 70) {
      issues.push({
        description: 'Poor accessibility compliance',
        severity: 'medium' as const,
        estimatedImpact: 'Excluding users with disabilities, potential legal risks'
      })
    }

    return issues
  }

  private identifyOperationalIssues(
    qualityMetrics: QualityMetrics,
    ops: BusinessImpactMetrics['operational'],
    insights: TrendInsight[]
  ): Array<{ description: string; severity: 'low' | 'medium' | 'high' | 'critical'; estimatedImpact: string }> {
    const issues = []

    if (ops.systemUptime < 99) {
      issues.push({
        description: 'System availability below target',
        severity: 'critical' as const,
        estimatedImpact: 'Revenue loss and customer dissatisfaction'
      })
    }

    if (qualityMetrics.performanceMetrics.errorRate > 5) {
      issues.push({
        description: 'High error rate',
        severity: 'high' as const,
        estimatedImpact: 'Poor user experience and potential data issues'
      })
    }

    if (ops.resourceUtilization > 85) {
      issues.push({
        description: 'High resource utilization',
        severity: 'medium' as const,
        estimatedImpact: 'Performance degradation and scalability concerns'
      })
    }

    return issues
  }

  private identifyFinancialIssues(
    fin: BusinessImpactMetrics['financial'],
    insights: TrendInsight[]
  ): Array<{ description: string; severity: 'low' | 'medium' | 'high' | 'critical'; estimatedImpact: string }> {
    const issues = []

    if (fin.testingCostPerFeature > 10000) {
      issues.push({
        description: 'High testing costs per feature',
        severity: 'medium' as const,
        estimatedImpact: 'Reduced profitability and slower feature delivery'
      })
    }

    if (fin.timeToMarket > 90) {
      issues.push({
        description: 'Slow time to market',
        severity: 'high' as const,
        estimatedImpact: 'Competitive disadvantage and missed opportunities'
      })
    }

    return issues
  }

  private identifyReputationIssues(
    qualityMetrics: QualityMetrics,
    businessMetrics: BusinessImpactMetrics,
    insights: TrendInsight[]
  ): Array<{ description: string; severity: 'low' | 'medium' | 'high' | 'critical'; estimatedImpact: string }> {
    const issues = []

    if (businessMetrics.userExperience.satisfactionScore < 3.5) {
      issues.push({
        description: 'Below average user satisfaction',
        severity: 'high' as const,
        estimatedImpact: 'Negative brand perception and word-of-mouth'
      })
    }

    if (qualityMetrics.performanceMetrics.availabilityPercentage < 99.5) {
      issues.push({
        description: 'Reliability concerns',
        severity: 'medium' as const,
        estimatedImpact: 'Trust issues and competitive disadvantage'
      })
    }

    return issues
  }

  private calculateExpectedBenefit(severity: string, category: string): string {
    const benefits = {
      critical: 'High - Significant improvement in business metrics',
      high: 'Medium-High - Notable improvement in key areas',
      medium: 'Medium - Moderate improvement in performance',
      low: 'Low-Medium - Minor but measurable improvement'
    }
    return benefits[severity as keyof typeof benefits] || 'Unknown'
  }

  private estimateEffort(severity: string): 'low' | 'medium' | 'high' {
    const efforts = {
      critical: 'high' as const,
      high: 'medium' as const,
      medium: 'medium' as const,
      low: 'low' as const
    }
    return efforts[severity as keyof typeof efforts] || 'medium'
  }

  private determineTimeframe(severity: string): 'immediate' | 'short_term' | 'medium_term' | 'long_term' {
    const timeframes = {
      critical: 'immediate' as const,
      high: 'short_term' as const,
      medium: 'medium_term' as const,
      low: 'long_term' as const
    }
    return timeframes[severity as keyof typeof timeframes] || 'medium_term'
  }

  private calculateROI(severity: string, category: string): number {
    const baseROI = {
      critical: 300,
      high: 200,
      medium: 150,
      low: 100
    }
    return baseROI[severity as keyof typeof baseROI] || 100
  }

  private mapInsightToCategory(metric: string): 'userExperience' | 'operational' | 'financial' | 'reputation' {
    if (metric.includes('satisfaction') || metric.includes('user')) return 'userExperience'
    if (metric.includes('cost') || metric.includes('financial')) return 'financial'
    if (metric.includes('reputation') || metric.includes('brand')) return 'reputation'
    return 'operational'
  }

  private calculateInsightBenefit(insight: TrendInsight): string {
    return `${insight.confidence * 100}% confidence in ${insight.type} impact`
  }

  private calculateBusinessValue(assessment: BusinessImpactAssessment): string {
    const score = assessment.overallScore
    if (score >= 80) return 'Strong business value with low risk'
    if (score >= 60) return 'Good business value with manageable risk'
    if (score >= 40) return 'Moderate business value with elevated risk'
    return 'Limited business value with high risk'
  }

  private generateSummaryText(assessment: BusinessImpactAssessment): string {
    const riskLevel = assessment.riskLevel
    const score = assessment.overallScore.toFixed(1)
    
    return `Business impact assessment shows ${riskLevel} risk level with an overall score of ${score}/100. ` +
           `Key areas of concern include ${this.getTopConcerns(assessment)}. ` +
           `Immediate attention is recommended for ${assessment.recommendations.filter(r => r.priority === 'critical').length} critical issues.`
  }

  private getTopConcerns(assessment: BusinessImpactAssessment): string {
    const concerns = []
    
    if (assessment.categories.userExperience.riskLevel === 'high' || assessment.categories.userExperience.riskLevel === 'critical') {
      concerns.push('user experience')
    }
    if (assessment.categories.operational.riskLevel === 'high' || assessment.categories.operational.riskLevel === 'critical') {
      concerns.push('operational efficiency')
    }
    if (assessment.categories.financial.riskLevel === 'high' || assessment.categories.financial.riskLevel === 'critical') {
      concerns.push('financial impact')
    }
    if (assessment.categories.reputation.riskLevel === 'high' || assessment.categories.reputation.riskLevel === 'critical') {
      concerns.push('reputation management')
    }

    return concerns.length > 0 ? concerns.join(', ') : 'no major concerns'
  }
}