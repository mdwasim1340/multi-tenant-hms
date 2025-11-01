"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Mail, Phone, MapPin, Calendar, Award, FileText, Edit2, Save, X, Upload } from "lucide-react"

export default function Profile() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-4xl mx-auto px-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">User Profile</h1>
                <p className="text-muted-foreground mt-1">Manage your personal information and credentials</p>
              </div>
              <Button
                onClick={() => setIsEditing(!isEditing)}
                className={isEditing ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"}
              >
                {isEditing ? (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </>
                )}
              </Button>
            </div>

            {/* Profile Header Card */}
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <User className="w-12 h-12 text-primary-foreground" />
                    </div>
                    {isEditing && (
                      <button className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90">
                        <Upload className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input placeholder="First Name" defaultValue="Dr. Sarah" />
                          <Input placeholder="Last Name" defaultValue="Johnson" />
                        </div>
                        <Input placeholder="Title" defaultValue="Chief Medical Officer" />
                      </div>
                    ) : (
                      <>
                        <h2 className="text-2xl font-bold text-foreground">Dr. Sarah Johnson</h2>
                        <p className="text-muted-foreground">Chief Medical Officer</p>
                        <p className="text-sm text-muted-foreground mt-2">Member since January 2023</p>
                      </>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="w-2 h-2 bg-green-600 rounded-full" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">Active</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-accent" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </label>
                    {isEditing ? (
                      <Input type="email" defaultValue="sarah.johnson@hospital.com" className="mt-2" />
                    ) : (
                      <p className="mt-2 text-foreground">sarah.johnson@hospital.com</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </label>
                    {isEditing ? (
                      <Input defaultValue="+1 (555) 123-4567" className="mt-2" />
                    ) : (
                      <p className="mt-2 text-foreground">+1 (555) 123-4567</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Office Location
                    </label>
                    {isEditing ? (
                      <Input defaultValue="Building A, Floor 3, Room 301" className="mt-2" />
                    ) : (
                      <p className="mt-2 text-foreground">Building A, Floor 3, Room 301</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Professional Information */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-accent" />
                  Professional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Medical License</label>
                    {isEditing ? (
                      <Input defaultValue="MD-2024-001" className="mt-2" />
                    ) : (
                      <p className="mt-2 text-foreground">MD-2024-001</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Specialization</label>
                    {isEditing ? (
                      <Input defaultValue="Internal Medicine" className="mt-2" />
                    ) : (
                      <p className="mt-2 text-foreground">Internal Medicine</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Department</label>
                    {isEditing ? (
                      <Input defaultValue="Medical Administration" className="mt-2" />
                    ) : (
                      <p className="mt-2 text-foreground">Medical Administration</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Years of Experience</label>
                    {isEditing ? (
                      <Input type="number" defaultValue="15" className="mt-2" />
                    ) : (
                      <p className="mt-2 text-foreground">15 years</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Certifications */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-accent" />
                  Certifications & Credentials
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: "Board Certification - Internal Medicine", expires: "2026-12-31" },
                  { name: "Advanced Life Support (ALS)", expires: "2025-06-15" },
                  { name: "HIPAA Compliance Training", expires: "2025-03-20" },
                ].map((cert, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{cert.name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        Expires: {cert.expires}
                      </p>
                    </div>
                    <div className="w-2 h-2 bg-green-600 rounded-full" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Save Button */}
            {isEditing && (
              <div className="flex gap-3">
                <Button className="bg-primary hover:bg-primary/90">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
