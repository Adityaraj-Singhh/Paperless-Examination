'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Building2, School, GraduationCap, BookOpen, Building } from 'lucide-react';

interface School {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  _count: { departments: number };
}

interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  school: { id: string; name: string; code: string };
  _count: { programmes: number };
}

interface Programme {
  id: string;
  name: string;
  code: string;
  description?: string;
  duration: number;
  isActive: boolean;
  department: {
    id: string;
    name: string;
    code: string;
    school: { id: string; name: string; code: string };
  };
  _count: { courses: number };
}

interface Course {
  id: string;
  name: string;
  code: string;
  description?: string;
  credits: number;
  semester?: number;
  isActive: boolean;
  programme: {
    id: string;
    name: string;
    code: string;
    department: {
      id: string;
      name: string;
      code: string;
      school: { id: string; name: string; code: string };
    };
  };
  _count: { exams: number };
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('schools');

  // Fetch Schools
  const { data: schools, isLoading: schoolsLoading } = useQuery<School[]>({
    queryKey: ['schools'],
    queryFn: async () => {
      const response = await apiClient.get('/schools');
      return response.data.data;
    },
  });

  // Fetch Departments
  const { data: departments, isLoading: departmentsLoading } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await apiClient.get('/departments');
      return response.data.data;
    },
  });

  // Fetch Programmes
  const { data: programmes, isLoading: programmesLoading } = useQuery<Programme[]>({
    queryKey: ['programmes'],
    queryFn: async () => {
      const response = await apiClient.get('/programmes');
      return response.data.data;
    },
  });

  // Fetch Courses
  const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await apiClient.get('/courses');
      return response.data.data;
    },
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Academic Structure Management</h1>
        <p className="text-muted-foreground">
          Manage schools, departments, programmes, and courses for your university
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="schools" className="flex items-center gap-2">
            <School className="h-4 w-4" />
            Schools
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="programmes" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Programmes
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Courses
          </TabsTrigger>
        </TabsList>

        {/* Schools Tab */}
        <TabsContent value="schools">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Schools</CardTitle>
                <CardDescription>
                  Manage schools within your university
                </CardDescription>
              </div>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add School
              </Button>
            </CardHeader>
            <CardContent>
              {schoolsLoading ? (
                <p>Loading schools...</p>
              ) : schools && schools.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Departments</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schools.map((school) => (
                      <TableRow key={school.id}>
                        <TableCell className="font-mono">{school.code}</TableCell>
                        <TableCell className="font-medium">{school.name}</TableCell>
                        <TableCell>{school._count.departments}</TableCell>
                        <TableCell>
                          {school.isActive ? (
                            <Badge variant="default">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No schools found. Create your first school to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Departments</CardTitle>
                <CardDescription>
                  Manage departments within schools
                </CardDescription>
              </div>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Department
              </Button>
            </CardHeader>
            <CardContent>
              {departmentsLoading ? (
                <p>Loading departments...</p>
              ) : departments && departments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Programmes</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.map((dept) => (
                      <TableRow key={dept.id}>
                        <TableCell className="font-mono">{dept.code}</TableCell>
                        <TableCell className="font-medium">{dept.name}</TableCell>
                        <TableCell>{dept.school.name}</TableCell>
                        <TableCell>{dept._count.programmes}</TableCell>
                        <TableCell>
                          {dept.isActive ? (
                            <Badge variant="default">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No departments found. Create your first department to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Programmes Tab */}
        <TabsContent value="programmes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Programmes</CardTitle>
                <CardDescription>
                  Manage academic programmes and degrees
                </CardDescription>
              </div>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Programme
              </Button>
            </CardHeader>
            <CardContent>
              {programmesLoading ? (
                <p>Loading programmes...</p>
              ) : programmes && programmes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Courses</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {programmes.map((prog) => (
                      <TableRow key={prog.id}>
                        <TableCell className="font-mono">{prog.code}</TableCell>
                        <TableCell className="font-medium">{prog.name}</TableCell>
                        <TableCell>{prog.department.name}</TableCell>
                        <TableCell>{prog.duration} years</TableCell>
                        <TableCell>{prog._count.courses}</TableCell>
                        <TableCell>
                          {prog.isActive ? (
                            <Badge variant="default">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No programmes found. Create your first programme to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Courses</CardTitle>
                <CardDescription>
                  Manage individual courses within programmes
                </CardDescription>
              </div>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Course
              </Button>
            </CardHeader>
            <CardContent>
              {coursesLoading ? (
                <p>Loading courses...</p>
              ) : courses && courses.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Programme</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Exams</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-mono">{course.code}</TableCell>
                        <TableCell className="font-medium">{course.name}</TableCell>
                        <TableCell>{course.programme.name}</TableCell>
                        <TableCell>{course.credits}</TableCell>
                        <TableCell>{course.semester || '-'}</TableCell>
                        <TableCell>{course._count.exams}</TableCell>
                        <TableCell>
                          {course.isActive ? (
                            <Badge variant="default">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No courses found. Create your first course to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
