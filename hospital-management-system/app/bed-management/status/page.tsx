'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Bed, Clock, AlertTriangle, CheckCircle, Wrench, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Bed Status Dashboard
 * 
 * Real-time bed availability and status tracking across all hospital units.
 * 
 * Features:
 * - Real-time bed status display
 * - Unit filtering
 * - Status legend
 * - Auto-refresh every 30 seconds
 * - Estimated availability times
 * - Bed features display
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

interface BedStatus {
  bed_id: string;
  bed_number: string;
  unit: string;
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'reserved';
  patient_id?: string;
  patient_name?: string;
  features: string[];
  estimated_available_at?: string;
  last_updated: string;
  cleaning_priority?: 'low' | 'medium' | 'high';
  maintenance_notes?: string;
}

interface UnitMetrics {
  unit: string;
  total_beds: number;
  available_beds: number;
  occupied_beds: number;
  cleaning_beds: number;
  maintenance_beds: number;
  reserved_beds: number;
  utilization_rate: number;
  avg_turnover_time_hours: number;
}

const BedStatusDashboard: React.FC = () => {
  const [beds, setBeds] = useState<BedStatus[]>([]);
  const [unitMetrics, setUnitMetrics] = useState<UnitMetrics[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Available units
  const units = ['ICU', 'Medical', 'Surgical', 'Emergency', 'Pediatric'];

  // Fetch bed status data
  const fetchBedStatus = async (unit?: string) => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = unit && unit !== 'all' 
        ? `/api/bed-management/status/${unit}`
        : '/api/bed-management/status/all';

      const response = await fetch(`http://localhost:3000${endpoint}`, {
        headers: {
          'X-Tenant-ID': 'aajmin_polyclinic',
          'X-App-ID': 'hospital_system',
          'X-API-Key': 'hospital-dev-key-789'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch bed status: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setBeds(data.data || []);
        setLastUpdated(new Date());
      } else {
        throw new Error(data.error || 'Failed to fetch bed status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching bed status:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unit metrics
  const fetchUnitMetrics = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/bed-management/turnover-metrics', {
        headers: {
          'X-Tenant-ID': 'aajmin_polyclinic',
          'X-App-ID': 'hospital_system',
          'X-API-Key': 'hospital-dev-key-789'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUnitMetrics(data.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching unit metrics:', err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchBedStatus(selectedUnit);
    fetchUnitMetrics();
  }, [selectedUnit]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchBedStatus(selectedUnit);
      fetchUnitMetrics();
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedUnit, autoRefresh]);

  // Filter beds by selected unit
  const filteredBeds = selectedUnit === 'all' 
    ? beds 
    : beds.filter(bed => bed.unit === selectedUnit);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'occupied': return 'bg-blue-500';
      case 'cleaning': return 'bg-yellow-500';
      case 'maintenance': return 'bg-orange-500';
      case 'reserved': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="h-4 w-4" />;
      case 'occupied': return <Bed className="h-4 w-4" />;
      case 'cleaning': return <Sparkles className="h-4 w-4" />;
      case 'maintenance': return <Wrench className="h-4 w-4" />;
      case 'reserved': return <Clock className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  // Calculate unit summary
  const getUnitSummary = () => {
    if (selectedUnit === 'all') {
      const total = beds.length;
      const available = beds.filter(b => b.status === 'available').length;
      const occupied = beds.filter(b => b.status === 'occupied').length;
      const cleaning = beds.filter(b => b.status === 'cleaning').length;
      const maintenance = beds.filter(b => b.status === 'maintenance').length;
      const reserved = beds.filter(b => b.status === 'reserved').length;

      return {
        total,
        available,
        occupied,
        cleaning,
        maintenance,
        reserved,
        utilization: total > 0 ? ((occupied / total) * 100).toFixed(1) : '0'
      };
    } else {
      const unitBeds = beds.filter(b => b.unit === selectedUnit);
      const total = unitBeds.length;
      const available = unitBeds.filter(b => b.status === 'available').length;
      const occupied = unitBeds.filter(b => b.status === 'occupied').length;
      const cleaning = unitBeds.filter(b => b.status === 'cleaning').length;
      const maintenance = unitBeds.filter(b => b.status === 'maintenance').length;
      const reserved = unitBeds.filter(b => b.status === 'reserved').length;

      return {
        total,
        available,
        occupied,
        cleaning,
        maintenance,
        reserved,
        utilization: total > 0 ? ((occupied / total) * 100).toFixed(1) : '0'
      };
    }
  };

  const summary = getUnitSummary();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Bed Status Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time bed availability and status across all units
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchBedStatus(selectedUnit)}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
        </div>
      </div>

      {/* Unit Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter by Unit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units</SelectItem>
                {units.map(unit => (
                  <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {lastUpdated && (
              <p className="text-sm text-muted-foreground">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Unit Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{summary.total}</div>
            <div className="text-sm text-muted-foreground">Total Beds</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{summary.available}</div>
            <div className="text-sm text-muted-foreground">Available</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{summary.occupied}</div>
            <div className="text-sm text-muted-foreground">Occupied</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{summary.cleaning}</div>
            <div className="text-sm text-muted-foreground">Cleaning</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{summary.maintenance}</div>
            <div className="text-sm text-muted-foreground">Maintenance</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{summary.utilization}%</div>
            <div className="text-sm text-muted-foreground">Utilization</div>
          </CardContent>
        </Card>
      </div>

      {/* Status Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {[
              { status: 'available', label: 'Available', color: 'bg-green-500' },
              { status: 'occupied', label: 'Occupied', color: 'bg-blue-500' },
              { status: 'cleaning', label: 'Cleaning', color: 'bg-yellow-500' },
              { status: 'maintenance', label: 'Maintenance', color: 'bg-orange-500' },
              { status: 'reserved', label: 'Reserved', color: 'bg-purple-500' }
            ].map(({ status, label, color }) => (
              <div key={status} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${color}`} />
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2" />
                <div className="h-3 bg-gray-200 rounded mb-1" />
                <div className="h-3 bg-gray-200 rounded" />
              </CardContent>
            </Card>
          ))
        ) : filteredBeds.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <Bed className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No beds found for the selected unit.</p>
          </div>
        ) : (
          filteredBeds.map((bed) => (
            <Card key={bed.bed_id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(bed.status)}
                    <span className="font-semibold">{bed.bed_number}</span>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`${getStatusColor(bed.status)} text-white`}
                  >
                    {bed.status}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="text-muted-foreground">Unit: {bed.unit}</div>
                  {bed.patient_name && (
                    <div>Patient: {bed.patient_name}</div>
                  )}
                  {bed.features.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {bed.features.map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {bed.estimated_available_at && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Est. available: {new Date(bed.estimated_available_at).toLocaleString()}
                    </div>
                  )}
                  {bed.cleaning_priority && bed.status === 'cleaning' && (
                    <div className="text-xs">
                      Priority: 
                      <Badge 
                        variant={bed.cleaning_priority === 'high' ? 'destructive' : 'secondary'}
                        className="ml-1"
                      >
                        {bed.cleaning_priority}
                      </Badge>
                    </div>
                  )}
                  {bed.maintenance_notes && bed.status === 'maintenance' && (
                    <div className="text-xs text-muted-foreground">
                      {bed.maintenance_notes}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Unit Metrics (if available) */}
      {unitMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Unit Performance Metrics</CardTitle>
            <CardDescription>
              Average turnover times and utilization rates by unit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Unit</th>
                    <th className="text-left p-2">Total Beds</th>
                    <th className="text-left p-2">Available</th>
                    <th className="text-left p-2">Utilization</th>
                    <th className="text-left p-2">Avg Turnover</th>
                  </tr>
                </thead>
                <tbody>
                  {unitMetrics.map((metric) => (
                    <tr key={metric.unit} className="border-b">
                      <td className="p-2 font-medium">{metric.unit}</td>
                      <td className="p-2">{metric.total_beds}</td>
                      <td className="p-2 text-green-600">{metric.available_beds}</td>
                      <td className="p-2">
                        <Badge 
                          variant={metric.utilization_rate > 85 ? 'destructive' : 'secondary'}
                        >
                          {metric.utilization_rate.toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="p-2">{metric.avg_turnover_time_hours.toFixed(1)}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BedStatusDashboard;
