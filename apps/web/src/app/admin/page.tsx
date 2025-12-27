'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Building2, School, GraduationCap, BookOpen, Building } from 'lucide-react';
import { useAuth } from '@/store/auth.store';
import { UserRole } from '@paperless/shared';

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
  const { user, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('schools');
  const queryClient = useQueryClient();

  // Only allow ADMIN users to access this page
  if (!hasRole(UserRole.ADMIN)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">This page is only accessible to university administrators.</p>
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Dialog states
  const [schoolDialogOpen, setSchoolDialogOpen] = useState(false);
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
  const [programmeDialogOpen, setProgrammeDialogOpen] = useState(false);
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);

  // Form states
  const [schoolForm, setSchoolForm] = useState({ name: '', code: '' });
  const [departmentForm, setDepartmentForm] = useState({ name: '', code: '', schoolId: '' });
  const [programmeForm, setProgrammeForm] = useState({ 
    name: '', 
    code: '', 
    departmentId: '', 
    duration: '4', 
    degree: 'Bachelor' 
  });
  const [courseForm, setCourseForm] = useState({ 
    name: '', 
    code: '', 
    programmeId: '', 
    credits: '3', 
    semester: '1' 
  });

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

  // Mutations
  const createSchoolMutation = useMutation({
    mutationFn: async (data: { name: string; code: string }) => {
      const response = await apiClient.post('/schools', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      setSchoolDialogOpen(false);
      setSchoolForm({ name: '', code: '' });
    },
    onError: (error: any) => {
      console.error('Error creating school:', error);
      alert(error.response?.data?.error || 'Failed to create school. Please try again.');
    },
  });

  const createDepartmentMutation = useMutation({
    mutationFn: async (data: { name: string; code: string; schoolId: string }) => {
      const response = await apiClient.post('/departments', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setDepartmentDialogOpen(false);
      setDepartmentForm({ name: '', code: '', schoolId: '' });
    },
  });

  const createProgrammeMutation = useMutation({
    mutationFn: async (data: { name: string; code: string; departmentId: string; duration: number; degree: string }) => {
      const response = await apiClient.post('/programmes', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programmes'] });
      setProgrammeDialogOpen(false);
      setProgrammeForm({ name: '', code: '', departmentId: '', duration: '4', degree: 'Bachelor' });
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: async (data: { name: string; code: string; programmeId: string; credits: number; semester: number }) => {
      const response = await apiClient.post('/courses', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setCourseDialogOpen(false);
      setCourseForm({ name: '', code: '', programmeId: '', credits: '3', semester: '1' });
    },
  });

  // Form handlers
  const handleCreateSchool = (e: React.FormEvent) => {
    e.preventDefault();
    createSchoolMutation.mutate(schoolForm);
  };

  const handleCreateDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    createDepartmentMutation.mutate(departmentForm);
  };

  const handleCreateProgramme = (e: React.FormEvent) => {
    e.preventDefault();
    createProgrammeMutation.mutate({
      ...programmeForm,
      duration: parseInt(programmeForm.duration),
    });
  };

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    createCourseMutation.mutate({
      ...courseForm,
      credits: parseInt(courseForm.credits),
      semester: parseInt(courseForm.semester),
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Debug User Info */}
      <Card className="mb-4 bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium">Logged in as:</p>
              <p className="text-lg font-bold">{user?.firstName} {user?.lastName} ({user?.email})</p>
              <div className="flex gap-2 mt-2">
                {user?.roles?.map((role) => (
                  <Badge key={role} variant={role === 'SUPER_ADMIN' ? 'default' : 'secondary'}>
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                console.log('Current User:', user);
                console.log('Access Token:', localStorage.getItem('accessToken'));
              }}
            >
              Debug Console
            </Button>
          </div>
        </CardContent>
      </Card>

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
              <Button className="flex items-center gap-2" onClick={() => setSchoolDialogOpen(true)}>
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
              <Button className="flex items-center gap-2" onClick={() => setDepartmentDialogOpen(true)}>
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
              <Button className="flex items-center gap-2" onClick={() => setProgrammeDialogOpen(true)}>
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
              <Button className="flex items-center gap-2" onClick={() => setCourseDialogOpen(true)}>
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

      {/* School Dialog */}
      <Dialog open={schoolDialogOpen} onOpenChange={setSchoolDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New School</DialogTitle>
            <DialogDescription>
              Create a new school in your university structure.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSchool}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="school-name">Name</Label>
                <Input
                  id="school-name"
                  value={schoolForm.name}
                  onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                  placeholder="e.g., School of Engineering"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="school-code">Code</Label>
                <Input
                  id="school-code"
                  value={schoolForm.code}
                  onChange={(e) => setSchoolForm({ ...schoolForm, code: e.target.value })}
                  placeholder="e.g., ENG"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSchoolDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createSchoolMutation.isPending}>
                {createSchoolMutation.isPending ? 'Creating...' : 'Create School'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Department Dialog */}
      <Dialog open={departmentDialogOpen} onOpenChange={setDepartmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Department</DialogTitle>
            <DialogDescription>
              Create a new department within a school.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateDepartment}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="department-school">School</Label>
                <Select
                  value={departmentForm.schoolId}
                  onValueChange={(value) => setDepartmentForm({ ...departmentForm, schoolId: value })}
                  required
                >
                  <SelectTrigger id="department-school">
                    <SelectValue placeholder="Select a school" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools?.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name} ({school.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="department-name">Name</Label>
                <Input
                  id="department-name"
                  value={departmentForm.name}
                  onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
                  placeholder="e.g., Computer Science"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="department-code">Code</Label>
                <Input
                  id="department-code"
                  value={departmentForm.code}
                  onChange={(e) => setDepartmentForm({ ...departmentForm, code: e.target.value })}
                  placeholder="e.g., CS"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDepartmentDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createDepartmentMutation.isPending}>
                {createDepartmentMutation.isPending ? 'Creating...' : 'Create Department'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Programme Dialog */}
      <Dialog open={programmeDialogOpen} onOpenChange={setProgrammeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Programme</DialogTitle>
            <DialogDescription>
              Create a new academic programme within a department.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateProgramme}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="programme-department">Department</Label>
                <Select
                  value={programmeForm.departmentId}
                  onValueChange={(value) => setProgrammeForm({ ...programmeForm, departmentId: value })}
                  required
                >
                  <SelectTrigger id="programme-department">
                    <SelectValue placeholder="Select a department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments?.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="programme-name">Name</Label>
                <Input
                  id="programme-name"
                  value={programmeForm.name}
                  onChange={(e) => setProgrammeForm({ ...programmeForm, name: e.target.value })}
                  placeholder="e.g., Computer Science"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="programme-code">Code</Label>
                <Input
                  id="programme-code"
                  value={programmeForm.code}
                  onChange={(e) => setProgrammeForm({ ...programmeForm, code: e.target.value })}
                  placeholder="e.g., BSC-CS"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="programme-degree">Degree</Label>
                <Select
                  value={programmeForm.degree}
                  onValueChange={(value) => setProgrammeForm({ ...programmeForm, degree: value })}
                  required
                >
                  <SelectTrigger id="programme-degree">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Associate">Associate</SelectItem>
                    <SelectItem value="Bachelor">Bachelor</SelectItem>
                    <SelectItem value="Master">Master</SelectItem>
                    <SelectItem value="Doctorate">Doctorate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="programme-duration">Duration (years)</Label>
                <Input
                  id="programme-duration"
                  type="number"
                  min="1"
                  max="10"
                  value={programmeForm.duration}
                  onChange={(e) => setProgrammeForm({ ...programmeForm, duration: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setProgrammeDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createProgrammeMutation.isPending}>
                {createProgrammeMutation.isPending ? 'Creating...' : 'Create Programme'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Course Dialog */}
      <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Course</DialogTitle>
            <DialogDescription>
              Create a new course within a programme.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCourse}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="course-programme">Programme</Label>
                <Select
                  value={courseForm.programmeId}
                  onValueChange={(value) => setCourseForm({ ...courseForm, programmeId: value })}
                  required
                >
                  <SelectTrigger id="course-programme">
                    <SelectValue placeholder="Select a programme" />
                  </SelectTrigger>
                  <SelectContent>
                    {programmes?.map((prog) => (
                      <SelectItem key={prog.id} value={prog.id}>
                        {prog.name} ({prog.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="course-name">Name</Label>
                <Input
                  id="course-name"
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                  placeholder="e.g., Data Structures"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="course-code">Code</Label>
                <Input
                  id="course-code"
                  value={courseForm.code}
                  onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                  placeholder="e.g., CS201"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="course-credits">Credits</Label>
                <Input
                  id="course-credits"
                  type="number"
                  min="1"
                  max="10"
                  value={courseForm.credits}
                  onChange={(e) => setCourseForm({ ...courseForm, credits: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="course-semester">Semester</Label>
                <Input
                  id="course-semester"
                  type="number"
                  min="1"
                  max="12"
                  value={courseForm.semester}
                  onChange={(e) => setCourseForm({ ...courseForm, semester: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCourseDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCourseMutation.isPending}>
                {createCourseMutation.isPending ? 'Creating...' : 'Create Course'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
