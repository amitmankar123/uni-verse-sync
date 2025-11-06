-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_roles table (CRITICAL: separate from profiles for security)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Create teachers table
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  unique_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create students table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  enrollment_number TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent')),
  marked_at TIMESTAMPTZ DEFAULT NOW(),
  qr_scanned BOOLEAN DEFAULT FALSE,
  UNIQUE(student_id, date)
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create class_schedule table
CREATE TABLE IF NOT EXISTS public.class_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  room_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create mous (Memorandum of Understanding) table
CREATE TABLE IF NOT EXISTS public.mous (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name TEXT NOT NULL,
  coordinator TEXT NOT NULL,
  duration TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create QR codes table for attendance
CREATE TABLE IF NOT EXISTS public.qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
  qr_data TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mous ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for teachers
DROP POLICY IF EXISTS "Admins can manage teachers" ON public.teachers;
CREATE POLICY "Admins can manage teachers"
  ON public.teachers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Teachers can view all teachers" ON public.teachers;
CREATE POLICY "Teachers can view all teachers"
  ON public.teachers FOR SELECT
  USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for students
DROP POLICY IF EXISTS "Admins can manage students" ON public.students;
CREATE POLICY "Admins can manage students"
  ON public.students FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Teachers can view students" ON public.students;
CREATE POLICY "Teachers can view students"
  ON public.students FOR SELECT
  USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Students can view their own data" ON public.students;
CREATE POLICY "Students can view their own data"
  ON public.students FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for attendance
DROP POLICY IF EXISTS "Teachers can manage attendance" ON public.attendance;
CREATE POLICY "Teachers can manage attendance"
  ON public.attendance FOR ALL
  USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Students can view their own attendance" ON public.attendance;
CREATE POLICY "Students can view their own attendance"
  ON public.attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.user_id = auth.uid() AND students.id = attendance.student_id
    )
  );

-- RLS Policies for assignments
DROP POLICY IF EXISTS "Teachers can manage their assignments" ON public.assignments;
CREATE POLICY "Teachers can manage their assignments"
  ON public.assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers
      WHERE teachers.user_id = auth.uid() AND teachers.id = assignments.teacher_id
    ) OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Students can view assignments" ON public.assignments;
CREATE POLICY "Students can view assignments"
  ON public.assignments FOR SELECT
  USING (public.has_role(auth.uid(), 'student') OR public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for class_schedule
DROP POLICY IF EXISTS "Teachers can manage their schedules" ON public.class_schedule;
CREATE POLICY "Teachers can manage their schedules"
  ON public.class_schedule FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers
      WHERE teachers.user_id = auth.uid() AND teachers.id = class_schedule.teacher_id
    ) OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "All authenticated users can view schedules" ON public.class_schedule;
CREATE POLICY "All authenticated users can view schedules"
  ON public.class_schedule FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- RLS Policies for mous
DROP POLICY IF EXISTS "Admins can manage MOUs" ON public.mous;
CREATE POLICY "Admins can manage MOUs"
  ON public.mous FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "All authenticated users can view MOUs" ON public.mous;
CREATE POLICY "All authenticated users can view MOUs"
  ON public.mous FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- RLS Policies for chat_messages
DROP POLICY IF EXISTS "Users can view their messages" ON public.chat_messages;
CREATE POLICY "Users can view their messages"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;
CREATE POLICY "Users can send messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update their sent messages" ON public.chat_messages;
CREATE POLICY "Users can update their sent messages"
  ON public.chat_messages FOR UPDATE
  USING (auth.uid() = sender_id);

-- RLS Policies for qr_codes
DROP POLICY IF EXISTS "Teachers can manage their QR codes" ON public.qr_codes;
CREATE POLICY "Teachers can manage their QR codes"
  ON public.qr_codes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers
      WHERE teachers.user_id = auth.uid() AND teachers.id = qr_codes.teacher_id
    ) OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Students can view active QR codes" ON public.qr_codes;
CREATE POLICY "Students can view active QR codes"
  ON public.qr_codes FOR SELECT
  USING (public.has_role(auth.uid(), 'student') AND expires_at > NOW());

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();