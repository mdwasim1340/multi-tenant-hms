import { LabResult } from '../types/lab-test';

export class ResultInterpretationService {
  interpretResult(result: LabResult): string {
    if (!result.is_abnormal) {
      return 'Result is within normal range';
    }
    
    let interpretation = '';
    
    switch (result.abnormal_flag) {
      case 'critical_high':
        interpretation = `CRITICAL: ${result.result_name} is critically elevated. Immediate medical attention may be required.`;
        break;
      case 'critical_low':
        interpretation = `CRITICAL: ${result.result_name} is critically low. Immediate medical attention may be required.`;
        break;
      case 'high':
        interpretation = `${result.result_name} is elevated above normal range.`;
        break;
      case 'low':
        interpretation = `${result.result_name} is below normal range.`;
        break;
      default:
        interpretation = `${result.result_name} is outside normal range.`;
    }
    
    if (result.interpretation) {
      interpretation += ` ${result.interpretation}`;
    }
    
    return interpretation;
  }

  getCriticalResults(results: LabResult[]): LabResult[] {
    return results.filter(r => 
      r.abnormal_flag === 'critical_high' || r.abnormal_flag === 'critical_low'
    );
  }

  getAbnormalResults(results: LabResult[]): LabResult[] {
    return results.filter(r => r.is_abnormal);
  }
}
