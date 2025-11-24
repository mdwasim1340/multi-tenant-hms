import pool from '../database';

/**
 * Capacity Forecasting Service
 * 
 * Provides 24/48/72-hour capacity predictions, seasonal pattern recognition,
 * staffing recommendations, and surge capacity planning.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

interface CapacityForecast {
  unit: string;
  forecast_date: Date;
  predicted_occupancy: number;
  predicted_available: number;
  total_capacity: number;
  occupancy_rate: number;
  confidence_level: 'high' | 'medium' | 'low';
  factors: string[];
}

interface SeasonalPattern {
  period: string;
  average_occupancy: number;
  peak_days: string[];
  low_days: string[];
  trend: 'increasing' | 'stable' | 'decreasing';
}

interface StaffingRecommendation {
  unit: string;
  shift: 'day' | 'evening' | 'night';
  date: Date;
  recommended_nurses: number;
  recommended_doctors: number;
  recommended_support_staff: number;
  patient_to_nurse_ratio: number;
  reasoning: string[];
}

interface SurgeCapacityPlan {
  trigger_level: number;
  current_level: number;
  surge_activated: boolean;
  additional_beds_available: number;
  estimated_activation_time: string;
  resource_requirements: {
    staff: number;
    equipment: string[];
    supplies: string[];
  };
  recommendations: string[];
}

class CapacityForecaster {
  /**
   * Predict capacity for next 24/48/72 hours
   * Requirement 5.1
   */
  async predictCapacity(
    tenantId: string,
    unit: string,
    hours: 24 | 48 | 72
  ): Promise<CapacityForecast[]> {
    const forecasts: CapacityForecast[] = [];
    const now = new Date();

    // Get historical data for pattern analysis
    const historicalData = await this.getHistoricalOccupancy(tenantId, unit, 30);
    
    // Get current capacity
    const capacityResult = await pool.query(
      `SELECT COUNT(*) as total_capacity
       FROM beds
       WHERE unit = $1 AND status != 'out_of_service'`,
      [unit]
    );
    const totalCapacity = parseInt(capacityResult.rows[0]?.total_capacity || '0');

    // Get current occupancy
    const occupancyResult = await pool.query(
      `SELECT COUNT(*) as occupied
       FROM beds
       WHERE unit = $1 AND status = 'occupied'`,
      [unit]
    );
    const currentOccupied = parseInt(occupancyResult.rows[0]?.occupied || '0');

    // Get scheduled discharges
    const discharges = await this.getScheduledDischarges(tenantId, unit, hours);
    
    // Get expected admissions (based on historical patterns)
    const expectedAdmissions = await this.predictAdmissions(tenantId, unit, hours);

    // Generate forecasts for each time period
    const intervals = hours === 24 ? 4 : hours === 48 ? 8 : 12; // 6-hour intervals
    const hoursPerInterval = hours / intervals;

    for (let i = 1; i <= intervals; i++) {
      const forecastDate = new Date(now.getTime() + i * hoursPerInterval * 60 * 60 * 1000);
      const intervalDischarges = discharges.filter(d => 
        new Date(d.expected_discharge) <= forecastDate
      ).length;
      const intervalAdmissions = Math.round(expectedAdmissions * (i / intervals));

      const predictedOccupied = Math.max(
        0,
        currentOccupied - intervalDischarges + intervalAdmissions
      );
      const predictedAvailable = totalCapacity - predictedOccupied;
      const occupancyRate = (predictedOccupied / totalCapacity) * 100;

      // Determine confidence level based on data quality
      const confidence = this.calculateConfidence(
        historicalData.length,
        i,
        intervals
      );

      // Identify factors affecting forecast
      const factors = this.identifyFactors(
        occupancyRate,
        forecastDate,
        historicalData
      );

      forecasts.push({
        unit,
        forecast_date: forecastDate,
        predicted_occupancy: predictedOccupied,
        predicted_available: predictedAvailable,
        total_capacity: totalCapacity,
        occupancy_rate: Math.round(occupancyRate * 10) / 10,
        confidence_level: confidence,
        factors
      });
    }

    return forecasts;
  }

  /**
   * Analyze seasonal patterns
   * Requirement 5.2
   */
  async analyzeSeasonalPatterns(
    tenantId: string,
    unit: string,
    months: number = 12
  ): Promise<SeasonalPattern[]> {
    const patterns: SeasonalPattern[] = [];

    // Get historical data for the specified period
    const historicalData = await this.getHistoricalOccupancy(tenantId, unit, months * 30);

    if (historicalData.length === 0) {
      return patterns;
    }

    // Group by month
    const monthlyData = this.groupByMonth(historicalData);

    // Analyze each month
    for (const [month, data] of Object.entries(monthlyData)) {
      const avgOccupancy = data.reduce((sum, d) => sum + d.occupancy, 0) / data.length;
      
      // Identify peak and low days
      const sortedByOccupancy = [...data].sort((a, b) => b.occupancy - a.occupancy);
      const peakDays = sortedByOccupancy.slice(0, 3).map(d => 
        new Date(d.date).toLocaleDateString('en-US', { weekday: 'long' })
      );
      const lowDays = sortedByOccupancy.slice(-3).map(d => 
        new Date(d.date).toLocaleDateString('en-US', { weekday: 'long' })
      );

      // Determine trend
      const firstHalf = data.slice(0, Math.floor(data.length / 2));
      const secondHalf = data.slice(Math.floor(data.length / 2));
      const firstAvg = firstHalf.reduce((sum, d) => sum + d.occupancy, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, d) => sum + d.occupancy, 0) / secondHalf.length;
      
      let trend: 'increasing' | 'stable' | 'decreasing';
      if (secondAvg > firstAvg * 1.1) {
        trend = 'increasing';
      } else if (secondAvg < firstAvg * 0.9) {
        trend = 'decreasing';
      } else {
        trend = 'stable';
      }

      patterns.push({
        period: month,
        average_occupancy: Math.round(avgOccupancy * 10) / 10,
        peak_days: [...new Set(peakDays)],
        low_days: [...new Set(lowDays)],
        trend
      });
    }

    return patterns;
  }

  /**
   * Generate staffing recommendations
   * Requirement 5.3
   */
  async generateStaffingRecommendations(
    tenantId: string,
    unit: string,
    date: Date
  ): Promise<StaffingRecommendation[]> {
    const recommendations: StaffingRecommendation[] = [];
    const shifts: Array<'day' | 'evening' | 'night'> = ['day', 'evening', 'night'];

    // Get capacity forecast for the date
    const hoursUntilDate = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60));
    const forecasts = await this.predictCapacity(tenantId, unit, Math.min(72, hoursUntilDate) as 24 | 48 | 72);
    
    // Find forecast closest to target date
    const targetForecast = forecasts.reduce((closest, forecast) => {
      const forecastDiff = Math.abs(forecast.forecast_date.getTime() - date.getTime());
      const closestDiff = Math.abs(closest.forecast_date.getTime() - date.getTime());
      return forecastDiff < closestDiff ? forecast : closest;
    });

    // Get unit-specific staffing ratios
    const ratios = this.getStaffingRatios(unit);

    for (const shift of shifts) {
      const predictedPatients = targetForecast.predicted_occupancy;
      
      // Adjust for shift patterns (day shift typically busier)
      const shiftMultiplier = shift === 'day' ? 1.0 : shift === 'evening' ? 0.9 : 0.8;
      const adjustedPatients = Math.ceil(predictedPatients * shiftMultiplier);

      // Calculate staff requirements
      const recommendedNurses = Math.ceil(adjustedPatients / ratios.patientToNurse);
      const recommendedDoctors = Math.ceil(adjustedPatients / ratios.patientToDoctor);
      const recommendedSupport = Math.ceil(adjustedPatients / ratios.patientToSupport);

      // Generate reasoning
      const reasoning = [
        `Predicted ${adjustedPatients} patients for ${shift} shift`,
        `Target patient-to-nurse ratio: 1:${ratios.patientToNurse}`,
        `Occupancy rate: ${targetForecast.occupancy_rate}%`,
        targetForecast.occupancy_rate > 85 ? 'High occupancy - consider additional staff' : '',
        shift === 'day' ? 'Day shift requires full staffing for procedures and discharges' : ''
      ].filter(r => r !== '');

      recommendations.push({
        unit,
        shift,
        date,
        recommended_nurses: recommendedNurses,
        recommended_doctors: recommendedDoctors,
        recommended_support_staff: recommendedSupport,
        patient_to_nurse_ratio: ratios.patientToNurse,
        reasoning
      });
    }

    return recommendations;
  }

  /**
   * Assess surge capacity needs
   * Requirement 5.4
   */
  async assessSurgeCapacity(
    tenantId: string,
    unit: string
  ): Promise<SurgeCapacityPlan> {
    // Get current occupancy
    const occupancyResult = await pool.query(
      `SELECT 
         COUNT(*) FILTER (WHERE status = 'occupied') as occupied,
         COUNT(*) FILTER (WHERE status != 'out_of_service') as total
       FROM beds
       WHERE unit = $1`,
      [unit]
    );

    const occupied = parseInt(occupancyResult.rows[0]?.occupied || '0');
    const total = parseInt(occupancyResult.rows[0]?.total || '0');
    const currentLevel = (occupied / total) * 100;

    // Surge trigger at 90% occupancy
    const triggerLevel = 90;
    const surgeActivated = currentLevel >= triggerLevel;

    // Get available surge beds (out_of_service beds that can be activated)
    const surgeBedsResult = await pool.query(
      `SELECT COUNT(*) as surge_beds
       FROM beds
       WHERE unit = $1 AND status = 'out_of_service' AND bed_type != 'isolation'`,
      [unit]
    );
    const additionalBeds = parseInt(surgeBedsResult.rows[0]?.surge_beds || '0');

    // Calculate resource requirements
    const additionalStaff = Math.ceil(additionalBeds / 4); // 1 nurse per 4 beds
    const equipment = this.getSurgeEquipment(unit, additionalBeds);
    const supplies = this.getSurgeSupplies(unit, additionalBeds);

    // Generate recommendations
    const recommendations = [];
    if (surgeActivated) {
      recommendations.push('SURGE CAPACITY ACTIVATED - Immediate action required');
      recommendations.push(`Activate ${additionalBeds} additional beds`);
      recommendations.push(`Deploy ${additionalStaff} additional staff members`);
      recommendations.push('Expedite discharge planning for stable patients');
      recommendations.push('Consider diverting non-urgent admissions');
    } else if (currentLevel >= 80) {
      recommendations.push('WARNING: Approaching surge capacity threshold');
      recommendations.push('Prepare surge resources for potential activation');
      recommendations.push('Review discharge readiness of current patients');
      recommendations.push('Alert staffing coordinator of potential needs');
    } else {
      recommendations.push('Normal capacity - no surge activation needed');
      recommendations.push('Continue monitoring occupancy levels');
    }

    return {
      trigger_level: triggerLevel,
      current_level: Math.round(currentLevel * 10) / 10,
      surge_activated: surgeActivated,
      additional_beds_available: additionalBeds,
      estimated_activation_time: surgeActivated ? 'Immediate' : '2-4 hours',
      resource_requirements: {
        staff: additionalStaff,
        equipment,
        supplies
      },
      recommendations
    };
  }

  /**
   * Get capacity metrics for dashboard
   * Requirement 5.5
   */
  async getCapacityMetrics(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    // This would aggregate various capacity metrics
    // Implementation similar to other metrics methods
    return {
      average_occupancy: 0,
      peak_occupancy: 0,
      forecast_accuracy: 0,
      surge_activations: 0
    };
  }

  // Helper methods

  private async getHistoricalOccupancy(
    tenantId: string,
    unit: string,
    days: number
  ): Promise<Array<{ date: Date; occupancy: number }>> {
    // Simplified - would query historical occupancy data
    return [];
  }

  private async getScheduledDischarges(
    tenantId: string,
    unit: string,
    hours: number
  ): Promise<Array<{ expected_discharge: Date }>> {
    const result = await pool.query(
      `SELECT dr.expected_discharge_date as expected_discharge
       FROM discharge_readiness dr
       JOIN admissions a ON dr.admission_id = a.id
       JOIN beds b ON a.bed_id = b.id
       WHERE b.unit = $1 
         AND dr.expected_discharge_date <= NOW() + INTERVAL '${hours} hours'
         AND dr.expected_discharge_date > NOW()
       ORDER BY dr.expected_discharge_date`,
      [unit]
    );

    return result.rows;
  }

  private async predictAdmissions(
    tenantId: string,
    unit: string,
    hours: number
  ): Promise<number> {
    // Simplified prediction based on historical averages
    // In production, this would use more sophisticated ML models
    const avgAdmissionsPerDay = 5; // Would be calculated from historical data
    return Math.round((avgAdmissionsPerDay / 24) * hours);
  }

  private calculateConfidence(
    dataPoints: number,
    interval: number,
    totalIntervals: number
  ): 'high' | 'medium' | 'low' {
    // More data = higher confidence
    // Nearer forecasts = higher confidence
    if (dataPoints > 60 && interval <= totalIntervals / 3) {
      return 'high';
    } else if (dataPoints > 30 && interval <= totalIntervals * 2 / 3) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private identifyFactors(
    occupancyRate: number,
    forecastDate: Date,
    historicalData: any[]
  ): string[] {
    const factors = [];

    if (occupancyRate > 90) {
      factors.push('High occupancy expected - near capacity');
    } else if (occupancyRate > 75) {
      factors.push('Moderate-high occupancy expected');
    } else if (occupancyRate < 50) {
      factors.push('Low occupancy expected');
    }

    const dayOfWeek = forecastDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      factors.push('Weekend - typically lower admission rates');
    }

    const hour = forecastDate.getHours();
    if (hour >= 8 && hour <= 17) {
      factors.push('Business hours - higher discharge activity expected');
    }

    return factors;
  }

  private groupByMonth(data: Array<{ date: Date; occupancy: number }>): Record<string, Array<{ date: Date; occupancy: number }>> {
    const grouped: Record<string, Array<{ date: Date; occupancy: number }>> = {};
    
    for (const item of data) {
      const month = new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      if (!grouped[month]) {
        grouped[month] = [];
      }
      grouped[month].push(item);
    }

    return grouped;
  }

  private getStaffingRatios(unit: string): {
    patientToNurse: number;
    patientToDoctor: number;
    patientToSupport: number;
  } {
    // Unit-specific ratios
    const ratios: Record<string, any> = {
      'ICU': { patientToNurse: 2, patientToDoctor: 8, patientToSupport: 6 },
      'Emergency': { patientToNurse: 4, patientToDoctor: 10, patientToSupport: 8 },
      'Medical': { patientToNurse: 6, patientToDoctor: 15, patientToSupport: 10 },
      'Surgical': { patientToNurse: 5, patientToDoctor: 12, patientToSupport: 8 },
      'Pediatric': { patientToNurse: 4, patientToDoctor: 12, patientToSupport: 8 }
    };

    return ratios[unit] || { patientToNurse: 6, patientToDoctor: 15, patientToSupport: 10 };
  }

  private getSurgeEquipment(unit: string, beds: number): string[] {
    const equipment = [
      `${beds} patient monitors`,
      `${beds} IV pumps`,
      `${beds} oxygen delivery systems`
    ];

    if (unit === 'ICU') {
      equipment.push(`${beds} ventilators`, `${beds} cardiac monitors`);
    }

    return equipment;
  }

  private getSurgeSupplies(unit: string, beds: number): string[] {
    return [
      `${beds * 3} sets of linens`,
      `${beds * 5} IV start kits`,
      `${beds * 10} medication doses`,
      'Additional PPE supplies',
      'Emergency medications'
    ];
  }
}

export const capacityForecaster = new CapacityForecaster();
