/**
 * Hospital Admin Dashboard
 * Team: Epsilon
 * Purpose: Hospital-level administration and overview
 */

'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  Calendar,
  Bed,
  Activity,
  DollarSign,
  AlertCircle,
  TrendingUp,
  Building2,
  Settings,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';

interface HospitalMetrics {
  totalPatients: number;
  activePatients: number;
  todayAppointments: number;
  availableBeds: number;
  totalBeds: number;
  staffOnDuty: number;
  totalStaff: number;
  pendingBills: number;
  monthlyRevenue: number;
  criticalAlerts: number;
}

export default function HospitalAdminPage() {
  const [metrics, setMetrics] = useState<HospitalMetrics>({
    totalPatients: 0,
    activePatients: 0,
    todayAppointments: 0,
    availableBeds: 0,
    totalBeds: 0,
    staffOnDuty: 0,
    totalStaff: 0,
    pendingBills: 0,
    monthlyRevenue: 0,
    criticalAlerts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      // TODO: Replace with actual API calls
      // Simulating API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMetrics({
        totalPatients: 1247,
        activePatients: 892,
        todayAppointments: 45,
        availableBeds: 23,
        totalBeds: 150,
        staffOnDuty: 67,
        totalStaff: 120,
        pendingBills: 34,
        monthlyRevenue: 450000,
        criticalAlerts: 3,
      });
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'User Management',
      description: 'Manage hospital staff and users',
      icon: Users,
      href: '/admin/users',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Departments',
      description: 'Manage hospital departments',
      icon: Building2,
      href: '/admin/departments',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Resources',
      description: 'Manage beds, equipment, and facilities',
      icon: Bed,
      href: '/admin/resources',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Hospital Settings',
      description: 'Configure hospital preferences',
      icon: Settings,
      href: '/admin/settings',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Analytics',
      description: 'View hospital analytics and reports',
      icon: BarChart3,
      href: '/analytics',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Hospital Administration</h1>
        <p className="text-gray-600 mt-1">Manage your hospital operations and settings</p>
      </div>

      {/* Critical Alerts */}
      {metrics.criticalAlerts > 0 && (
        <Card className="mb-6 p-4 border-red-200 bg-red-50">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">
                {metrics.criticalAlerts} Critical Alert{metrics.criticalAlerts > 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-red-700">Requires immediate attention</p>
            </div>
            <Link href="/notifications/critical">
              <Button variant="outline" size="sm" className="border-red-300 text-red-700">
                View Alerts
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Patients */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Patients</p>
            <p className="text-2xl font-bold text-gray-900">{metrics.totalPatients.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.activePatients} active
            </p>
          </div>
        </Card>

        {/* Appointments */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600">Today's Appointments</p>
            <p className="text-2xl font-bold text-gray-900">{metrics.todayAppointments}</p>
            <p className="text-xs text-gray-500 mt-1">Scheduled for today</p>
          </div>
        </Card>

        {/* Beds */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Bed className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600">Available Beds</p>
            <p className="text-2xl font-bold text-gray-900">
              {metrics.availableBeds}/{metrics.totalBeds}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round((metrics.availableBeds / metrics.totalBeds) * 100)}% available
            </p>
          </div>
        </Card>

        {/* Staff */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-50 rounded-lg">
              <Activity className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600">Staff on Duty</p>
            <p className="text-2xl font-bold text-gray-900">
              {metrics.staffOnDuty}/{metrics.totalStaff}
            </p>
            <p className="text-xs text-gray-500 mt-1">Currently on duty</p>
          </div>
        </Card>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Monthly Revenue</h3>
              <p className="text-sm text-gray-600">Current month</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${metrics.monthlyRevenue.toLocaleString()}
          </p>
          <p className="text-sm text-green-600 mt-2">↑ 12% from last month</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Pending Bills</h3>
              <p className="text-sm text-gray-600">Requires attention</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics.pendingBills}</p>
          <Link href="/billing">
            <Button variant="link" className="p-0 h-auto mt-2">
              View all bills →
            </Button>
          </Link>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className={`p-3 ${action.bgColor} rounded-lg`}>
                    <action.icon className={`h-6 w-6 ${action.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
